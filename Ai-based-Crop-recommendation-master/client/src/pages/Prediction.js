import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery } from 'react-query';
import { useForm } from 'react-hook-form';
import {
  BarChart3,
  MapPin,
  Thermometer,
  Leaf,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  Trophy,
  Search,
  CloudSun
} from 'lucide-react';
import { predictionAPI, marketAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const MIN_CONFIDENCE = 0.6;

const formatCropName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const normalizePredictionResponse = (response) => {
  const apiData = response?.data || {};
  const predDoc = apiData?.data?.prediction;

  let raw = Array.isArray(predDoc?.predictions) ? predDoc.predictions : null;
  if (!raw?.length && Array.isArray(apiData.predictions)) {
    raw = apiData.predictions;
  }

  if (!raw?.length) return null;

  const sorted = [...raw].sort((a, b) => {
    const ra = a.rank ?? 999;
    const rb = b.rank ?? 999;
    if (ra !== rb) return ra - rb;
    return (b.confidence ?? 0) - (a.confidence ?? 0);
  });

  const aboveMin = sorted.filter((p) => (Number(p.confidence) || 0) >= MIN_CONFIDENCE);
  const displayed =
    aboveMin.length > 0 ? aboveMin : sorted.slice(0, Math.min(5, sorted.length));

  return {
    predictions: displayed,
    showMinConfidenceNote: aboveMin.length === 0 && sorted.some((p) => (Number(p.confidence) || 0) < MIN_CONFIDENCE),
    marketData: predDoc?.marketData || {},
    recommendations: predDoc?.recommendations || [],
    cropInfo: predDoc?.cropInfo || {},
    processingTime: apiData?.data?.processingTime ?? predDoc?.processingTime ?? 0
  };
};

const Prediction = () => {
  const [predictionResult, setPredictionResult] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [locationInput, setLocationInput] = useState('');
  const [weatherInfo, setWeatherInfo] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    defaultValues: {
      nitrogen: '',
      phosphorus: '',
      potassium: '',
      temperature: '',
      humidity: '',
      ph: '',
      rainfall: '',
      soilType: '',
      location: { latitude: '', longitude: '', address: '' }
    }
  });

  const locationMutation = useMutation(
    (city) => predictionAPI.predictByLocation({ city }),
    {
      onSuccess: (response) => {
        const normalized = normalizePredictionResponse(response);
        if (!normalized) {
          setApiError('Location prediction completed, but response format is invalid.');
          toast.error('Prediction response format error');
          return;
        }
        const auto = response?.data?.data?.autoFilledValues;
        if (auto) {
          setValue('temperature', auto.temperature ?? '');
          setValue('humidity', auto.humidity ?? '');
          setValue('rainfall', auto.rainfall ?? '');
          if (auto.nitrogen)   setValue('nitrogen', auto.nitrogen);
          if (auto.phosphorus) setValue('phosphorus', auto.phosphorus);
          if (auto.potassium)  setValue('potassium', auto.potassium);
          if (auto.ph)         setValue('ph', auto.ph);
          if (auto.soilType)   setValue('soilType', auto.soilType);
        }
        const w = response?.data?.data?.weather;
        if (w) setWeatherInfo(w);
        setPredictionResult(normalized);
        setApiError(null);
        toast.success(`Crop prediction for ${w?.city || locationInput} completed!`);
      },
      onError: (error) => {
        const msg = error.response?.data?.message || error.message || 'Location lookup failed.';
        setApiError(msg);
        toast.error(msg, { duration: 6000 });
      }
    }
  );

  const handleLocationFetch = () => {
    if (!locationInput.trim()) return;
    setApiError(null);
    setPredictionResult(null);
    setWeatherInfo(null);
    locationMutation.mutate(locationInput.trim());
  };

  const topCropName = predictionResult?.predictions?.[0]?.crop;

  const { data: marketDataRes } = useQuery(
    ['marketData', topCropName],
    () => marketAPI.getPrices({ crop: topCropName }),
    { enabled: !!topCropName, retry: 1 }
  );
  // axios → res.data (envelope) → .data.crop.marketInfo
  const marketInfo = marketDataRes?.data?.data?.crop?.marketInfo ?? null;

  const predictionMutation = useMutation(predictionAPI.predictCrop, {
    onSuccess: (response) => {
      const normalized = normalizePredictionResponse(response);
      if (!normalized) {
        setApiError('Prediction completed, but response format is invalid.');
        toast.error('Prediction response format error');
        return;
      }
      setPredictionResult(normalized);
      setApiError(null);
      toast.success('Crop prediction completed!');
    },
    onError: (error) => {
      const status = error.response?.status;
      const msg = error.response?.data?.message;
      const devError = error.response?.data?.error;

      let userMessage;
      if (!error.response) {
        userMessage = 'Cannot reach server. Make sure the backend is running on port 5000.';
      } else if (status === 400) {
        userMessage = `Invalid input: ${msg || 'Check all fields are filled correctly.'}`;
      } else if (status === 401) {
        userMessage = 'Session expired. Please log in again.';
      } else if (status === 500) {
        userMessage = devError
          ? `Model error: ${devError}`
          : 'Server error during prediction. Check backend logs.';
      } else {
        userMessage = msg || 'Prediction failed. Please try again.';
      }

      setApiError(userMessage);
      toast.error(userMessage, { duration: 6000 });
    }
  });

  const onSubmit = (data) => {
    setApiError(null);
    setPredictionResult(null);

    predictionMutation.mutate({
      nitrogen: parseFloat(data.nitrogen),
      phosphorus: parseFloat(data.phosphorus),
      potassium: parseFloat(data.potassium),
      temperature: parseFloat(data.temperature),
      humidity: parseFloat(data.humidity),
      ph: parseFloat(data.ph),
      rainfall: parseFloat(data.rainfall),
      soilType: data.soilType,
      location: {
        latitude: parseFloat(data.location.latitude) || null,
        longitude: parseFloat(data.location.longitude) || null,
        address: data.location.address || null
      }
    });
  };

  const soilTypes = ['Sandy', 'Loamy', 'Clay', 'Black', 'Red', 'Laterite'];

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSuitabilityColor = (suitability) => {
    const map = {
      Excellent: 'text-green-600 bg-green-100',
      Good: 'text-blue-600 bg-blue-100',
      Moderate: 'text-yellow-600 bg-yellow-100',
      Poor: 'text-red-600 bg-red-100'
    };
    return map[suitability] || 'text-gray-600 bg-gray-100';
  };

  const isAnalyzing = predictionMutation.isLoading || locationMutation.isLoading;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
            <BarChart3 className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI-Powered Crop Prediction</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Enter your soil and environmental conditions to get personalized crop recommendations.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Soil & Environmental Data</h2>
            </div>
            <div className="card-body">
              {/* Smart Location Lookup */}
              <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                  <CloudSun className="h-4 w-4 mr-2" />
                  Smart Location Lookup
                </h3>
                <p className="text-xs text-blue-600 mb-3">
                  Don't know the values? Type your location and we'll auto-fetch weather data and predict crops.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLocationFetch()}
                    className="input flex-1"
                    placeholder="e.g. Koranad, Mayiladuthurai"
                  />
                  <button
                    type="button"
                    onClick={handleLocationFetch}
                    disabled={locationMutation.isLoading || !locationInput.trim()}
                    className="btn-primary px-4 flex items-center gap-2"
                  >
                    {locationMutation.isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Fetch & Predict
                  </button>
                </div>
                {weatherInfo && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-gray-500">Temp</p>
                      <p className="font-semibold text-blue-800">{weatherInfo.temperature}°C</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-gray-500">Humidity</p>
                      <p className="font-semibold text-blue-800">{weatherInfo.humidity}%</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-gray-500">Rainfall</p>
                      <p className="font-semibold text-blue-800">{weatherInfo.rainfall}mm</p>
                    </div>
                  </div>
                )}
              </div>

              {/* API Error Banner */}
              {apiError && (
                <div className="mb-4 flex items-start space-x-3 bg-red-50 border border-red-200 rounded-lg p-4">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{apiError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Soil Nutrients */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Leaf className="h-5 w-5 mr-2 text-green-600" />
                    Soil Nutrients (kg/ha)
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[
                      { name: 'nitrogen', label: 'Nitrogen (N)' },
                      { name: 'phosphorus', label: 'Phosphorus (P)' },
                      { name: 'potassium', label: 'Potassium (K)' }
                    ].map(({ name, label }) => (
                      <div key={name}>
                        <label className="label">{label}</label>
                        <input
                          type="number"
                          step="0.1"
                          {...register(name, {
                            required: `${label} is required`,
                            min: { value: 0, message: 'Must be ≥ 0' },
                            max: { value: 200, message: 'Must be ≤ 200' }
                          })}
                          className={`input ${errors[name] ? 'input-error' : ''}`}
                          placeholder="0–200"
                        />
                        {errors[name] && (
                          <p className="mt-1 text-sm text-red-600">{errors[name].message}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Environmental Conditions */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Thermometer className="h-5 w-5 mr-2 text-blue-600" />
                    Environmental Conditions
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label">Temperature (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('temperature', {
                          required: 'Temperature is required',
                          min: { value: -50, message: 'Must be ≥ -50°C' },
                          max: { value: 60, message: 'Must be ≤ 60°C' }
                        })}
                        className={`input ${errors.temperature ? 'input-error' : ''}`}
                        placeholder="-50 to 60"
                      />
                      {errors.temperature && (
                        <p className="mt-1 text-sm text-red-600">{errors.temperature.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="label">Humidity (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('humidity', {
                          required: 'Humidity is required',
                          min: { value: 0, message: 'Must be ≥ 0' },
                          max: { value: 100, message: 'Must be ≤ 100%' }
                        })}
                        className={`input ${errors.humidity ? 'input-error' : ''}`}
                        placeholder="0–100"
                      />
                      {errors.humidity && (
                        <p className="mt-1 text-sm text-red-600">{errors.humidity.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="label">pH Level</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('ph', {
                          required: 'pH is required',
                          min: { value: 0, message: 'Must be ≥ 0' },
                          max: { value: 14, message: 'Must be ≤ 14' }
                        })}
                        className={`input ${errors.ph ? 'input-error' : ''}`}
                        placeholder="0–14"
                      />
                      {errors.ph && (
                        <p className="mt-1 text-sm text-red-600">{errors.ph.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="label">Rainfall (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('rainfall', {
                          required: 'Rainfall is required',
                          min: { value: 0, message: 'Must be ≥ 0' },
                          max: { value: 3000, message: 'Must be ≤ 3000mm' }
                        })}
                        className={`input ${errors.rainfall ? 'input-error' : ''}`}
                        placeholder="0–3000"
                      />
                      {errors.rainfall && (
                        <p className="mt-1 text-sm text-red-600">{errors.rainfall.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Soil Type */}
                <div>
                  <label className="label">Soil Type</label>
                  <select
                    {...register('soilType', { required: 'Soil type is required' })}
                    className={`input ${errors.soilType ? 'input-error' : ''}`}
                  >
                    <option value="">Select soil type</option>
                    {soilTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.soilType && (
                    <p className="mt-1 text-sm text-red-600">{errors.soilType.message}</p>
                  )}
                </div>

                {/* Location (Optional) */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-purple-600" />
                    Location (Optional)
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label">Latitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        {...register('location.latitude')}
                        className="input"
                        placeholder="e.g., 28.6139"
                      />
                    </div>
                    <div>
                      <label className="label">Longitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        {...register('location.longitude')}
                        className="input"
                        placeholder="e.g., 77.2090"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="label">Address</label>
                    <input
                      type="text"
                      {...register('location.address')}
                      className="input"
                      placeholder="City, State, Country"
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={isAnalyzing}
                    className="btn-primary flex-1 btn-lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <BarChart3 className="mr-2 h-5 w-5" />
                        Get Prediction
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { reset(); setPredictionResult(null); setApiError(null); }}
                    className="btn-secondary btn-lg"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {predictionResult ? (
            <div className="space-y-6">
              {/* Prediction Results */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-gray-900">Prediction Results</h2>
                  {predictionResult.processingTime > 0 && (
                    <div className="text-sm text-gray-500">
                      Processing time: {predictionResult.processingTime}ms
                    </div>
                  )}
                </div>
                <div className="card-body space-y-4">
                  {predictionResult.showMinConfidenceNote && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      No crop reached {Math.round(MIN_CONFIDENCE * 100)}% model confidence. Showing the top ranked
                      alternatives from the model.
                    </div>
                  )}

                  <div className="space-y-4">
                    {predictionResult.predictions.map((p, idx) => {
                      const isBest = idx === 0;
                      const conf = Number(p.confidence) || 0;
                      const rankLabel = p.rank != null ? `Top ${p.rank}` : `Top ${idx + 1}`;
                      return (
                        <div
                          key={`${p.crop}-${p.rank ?? idx}`}
                          className={`rounded-xl border p-5 transition-shadow ${
                            isBest
                              ? 'border-primary-300 bg-gradient-to-br from-primary-50 via-green-50 to-blue-50 shadow-md ring-1 ring-primary-200'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <span
                                className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                                  isBest ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {isBest ? <Trophy className="h-5 w-5" /> : p.rank ?? idx + 1}
                              </span>
                              <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{rankLabel}</p>
                                <h3 className="text-xl font-bold text-gray-900">{formatCropName(p.crop)}</h3>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className={`badge ${getConfidenceColor(conf)}`}>
                                {Math.round(conf * 100)}% confidence
                              </span>
                              <span className={`badge ${getSuitabilityColor(p.suitability)}`}>
                                {p.suitability || '—'}
                              </span>
                              {isBest && (
                                <span className="badge bg-primary-100 text-primary-800">Best match</span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">Why this crop?</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {(p.reasons?.length ? p.reasons : []).map((reason, i) => (
                                <li key={i} className="flex items-start">
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Crop Info */}
              {predictionResult.cropInfo?.description && (
                <div className="card">
                  <div className="card-header">
                    <h2 className="text-xl font-semibold text-gray-900">Crop Information</h2>
                  </div>
                  <div className="card-body">
                    <div className="space-y-3">
                      <p className="text-gray-700">{predictionResult.cropInfo.description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-500">Season</p>
                          <p className="font-medium text-gray-900">{predictionResult.cropInfo.season || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-500">Duration</p>
                          <p className="font-medium text-gray-900">{predictionResult.cropInfo.duration || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-500">Profitability</p>
                          <p className="font-medium text-gray-900">{predictionResult.cropInfo.profitability || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Market Data */}
              {marketInfo && (
                <div className="card">
                  <div className="card-header">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                      Market Intelligence
                    </h2>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Current Price</h4>
                        <p className="text-2xl font-bold text-gray-900">₹{marketInfo.currentPrice}</p>
                        <p className="text-sm text-gray-500">{marketInfo.unit}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Price Trend</h4>
                        <div className="flex items-center space-x-2">
                          <span className={`text-lg ${
                            marketInfo.trend === 'up'   ? 'text-green-600' :
                            marketInfo.trend === 'down' ? 'text-red-600'   : 'text-gray-600'
                          }`}>
                            {marketInfo.trend === 'up' ? '↗️' : marketInfo.trend === 'down' ? '↘️' : '→'}
                          </span>
                          <span className="text-lg font-semibold text-gray-900">{marketInfo.changePercent}%</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Demand</h4>
                        <p className="text-lg font-semibold text-gray-900">{marketInfo.demand}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Season</h4>
                        <p className="text-lg font-semibold text-gray-900">{marketInfo.season}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {predictionResult.recommendations?.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h2 className="text-xl font-semibold text-gray-900">Recommendations</h2>
                  </div>
                  <div className="card-body">
                    <div className="space-y-3">
                      {predictionResult.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
                            rec.priority === 'High' ? 'bg-red-100' :
                            rec.priority === 'Medium' ? 'bg-yellow-100' : 'bg-green-100'
                          }`}>
                            <span className={`text-xs font-medium ${
                              rec.priority === 'High' ? 'text-red-600' :
                              rec.priority === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {rec.priority === 'High' ? 'H' : rec.priority === 'Medium' ? 'M' : 'L'}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{rec.type}</h4>
                            <p className="text-sm text-gray-600">{rec.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <div className="card-body text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for Prediction</h3>
                <p className="text-gray-600">
                  Fill in the form on the left to get AI-powered crop recommendations.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Prediction;
