import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  BarChart3,
  Globe,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { marketAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

/* ── helpers ─────────────────────────────────────────────────────────────── */
const unwrap = (res) => res?.data?.data ?? null;

const getTrendIcon = (trend) => {
  if (trend === 'up')   return <TrendingUp   className="h-4 w-4 text-green-600" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600"   />;
  return <Minus className="h-4 w-4 text-gray-600" />;
};

const trendCls = (t) =>
  t === 'up' ? 'text-green-600 bg-green-100' :
  t === 'down' ? 'text-red-600 bg-red-100' : 'text-gray-600 bg-gray-100';

const demandCls = (d) =>
  d === 'Very High' ? 'text-green-600 bg-green-100' :
  d === 'High'      ? 'text-blue-600 bg-blue-100'   :
  d === 'Medium'    ? 'text-yellow-600 bg-yellow-100' :
  d === 'Low'       ? 'text-red-600 bg-red-100'      : 'text-gray-600 bg-gray-100';

const impactCls = (i) =>
  i === 'Positive' ? 'text-green-600 bg-green-100' :
  i === 'Negative' ? 'text-red-600 bg-red-100'     :
  i === 'Mixed'    ? 'text-yellow-600 bg-yellow-100' : 'text-gray-600 bg-gray-100';

const COLORS = ['#16a34a','#2563eb','#d97706','#dc2626','#7c3aed','#0891b2','#be185d','#65a30d'];

/* ── component ───────────────────────────────────────────────────────────── */
const Market = () => {
  const [selectedCrop, setSelectedCrop]     = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const {
    data: pricesRes, isLoading: pricesLoading, error: pricesError, refetch: refetchPrices,
  } = useQuery(
    ['marketPrices', selectedCrop],
    () => marketAPI.getPrices({ crop: selectedCrop || undefined }),
    { refetchInterval: 60000, retry: 1 }
  );

  const {
    data: trendsRes, isLoading: trendsLoading, error: trendsError, refetch: refetchTrends,
  } = useQuery(
    ['marketTrends', selectedPeriod],
    () => marketAPI.getTrends({ period: selectedPeriod }),
    { refetchInterval: 300000, retry: 1 }
  );

  const {
    data: demandRes, isLoading: demandLoading, error: demandError, refetch: refetchDemand,
  } = useQuery(
    ['demandForecast', selectedCrop],
    () => marketAPI.getDemandForecast({ crop: selectedCrop || undefined }),
    { refetchInterval: 300000, retry: 1 }
  );

  const {
    data: weatherRes, isLoading: weatherLoading, error: weatherError, refetch: refetchWeather,
  } = useQuery(
    'weatherImpact',
    () => marketAPI.getWeatherImpact(),
    { refetchInterval: 600000, retry: 1 }
  );

  /* unwrap axios response → API data layer */
  const pricesData  = unwrap(pricesRes);
  const trendsData  = unwrap(trendsRes);
  const demandData  = unwrap(demandRes);
  const weatherData = unwrap(weatherRes);

  const anyLoading = pricesLoading || trendsLoading || demandLoading || weatherLoading;

  const handleRefresh = () => {
    refetchPrices(); refetchTrends(); refetchDemand(); refetchWeather();
  };

  /* ── build chart data: merge all crop histories by date ── */
  const chartSeries = React.useMemo(() => {
    const cd = trendsData?.chartData;
    if (!cd) return [];
    const cropNames = Object.keys(cd);
    if (!cropNames.length) return [];
    const dateMap = {};
    cropNames.forEach((name) => {
      cd[name].forEach(({ date, price }) => {
        if (!dateMap[date]) dateMap[date] = { date };
        dateMap[date][name] = price;
      });
    });
    return Object.values(dateMap);
  }, [trendsData]);

  const chartCrops = trendsData?.chartData ? Object.keys(trendsData.chartData) : [];

  /* ── section: empty / error fallback ── */
  const Empty = ({ msg }) => (
    <p className="text-sm text-gray-500 py-4 text-center">{msg}</p>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Market Intelligence</h1>
          <p className="text-lg text-gray-600">Real-time market prices, trends, and demand forecasts</p>
        </div>
        <button onClick={handleRefresh} disabled={anyLoading} className="btn-secondary mt-4 sm:mt-0">
          <RefreshCw className={`mr-2 h-4 w-4 ${anyLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="card"
      >
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label">Crop</label>
              <select value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)} className="input">
                <option value="">All Crops</option>
                {pricesData?.allCrops && Object.keys(pricesData.allCrops).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Time Period</label>
              <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="input">
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleRefresh} disabled={anyLoading} className="btn-primary w-full">
                {anyLoading ? <LoadingSpinner size="sm" /> : 'Update Data'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 1. Current Market Prices ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Current Market Prices
            </h2>
          </div>
          <div className="card-body">
            {pricesLoading ? (
              <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>
            ) : pricesError ? (
              <Empty msg="Failed to load prices. Please refresh." />
            ) : selectedCrop && pricesData?.marketInfo ? (
              /* ── single crop detail view ── */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedCrop('')}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    ← Back to all crops
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">{selectedCrop}</h3>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(pricesData.marketInfo.trend)}
                      <span className={`badge ${trendCls(pricesData.marketInfo.trend)}`}>
                        {pricesData.marketInfo.changePercent}%
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Current Price</h4>
                      <p className="text-2xl font-bold text-gray-900">₹{pricesData.marketInfo.currentPrice}</p>
                      <p className="text-sm text-gray-500">{pricesData.marketInfo.unit}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Demand</h4>
                      <span className={`badge ${demandCls(pricesData.marketInfo.demand)}`}>
                        {pricesData.marketInfo.demand}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Season</h4>
                      <p className="text-lg font-semibold text-gray-900">{pricesData.marketInfo.season}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Trend</h4>
                      <p className="text-lg font-semibold text-gray-900 capitalize">{pricesData.marketInfo.trend}</p>
                    </div>
                  </div>
                </div>

                {pricesData.marketInfo.regions && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Regional Prices</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(pricesData.marketInfo.regions).map(([region, data]) => (
                        <div key={region} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{region}</h5>
                            {getTrendIcon(data.trend)}
                          </div>
                          <p className="text-lg font-semibold text-gray-900">₹{data.price}</p>
                          <p className="text-sm text-gray-500 capitalize">{data.trend} trend</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : pricesData?.allCrops ? (
              /* ── all crops grid ── */
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(pricesData.allCrops).map(([crop, data]) => (
                  <div key={crop} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{crop}</h3>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(data.trend)}
                        <span className={`badge ${trendCls(data.trend)}`}>{data.changePercent}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">₹{data.currentPrice}</p>
                        <p className="text-sm text-gray-500">{data.unit}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`badge ${demandCls(data.demand)}`}>{data.demand}</span>
                        <button
                          onClick={() => setSelectedCrop(crop)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty msg="No price data available." />
            )}
          </div>
        </div>
      </motion.div>

      {/* ── 2. Market Trends ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              Market Trends ({selectedPeriod})
            </h2>
          </div>
          <div className="card-body">
            {trendsLoading ? (
              <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>
            ) : trendsError ? (
              <Empty msg="Failed to load trends. Please refresh." />
            ) : trendsData?.trends ? (
              <div className="space-y-6">
                {/* Price history chart */}
                {chartSeries.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Price History</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartSeries} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => `₹${v}`} />
                        <Legend />
                        {chartCrops.map((name, i) => (
                          <Line
                            key={name}
                            type="monotone"
                            dataKey={name}
                            stroke={COLORS[i % COLORS.length]}
                            dot={false}
                            strokeWidth={2}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Top Gainers */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" /> Top Gainers
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {trendsData.trends.topGainers.map((crop, i) => (
                      <div key={i} className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{crop.crop}</h4>
                          <span className="text-green-600 font-semibold">+{crop.change}%</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">₹{crop.price}</p>
                      </div>
                    ))}
                    {trendsData.trends.topGainers.length === 0 && <Empty msg="No gainers this period." />}
                  </div>
                </div>

                {/* Top Losers */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <TrendingDown className="h-5 w-5 mr-2 text-red-600" /> Top Losers
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {trendsData.trends.topLosers.map((crop, i) => (
                      <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{crop.crop}</h4>
                          <span className="text-red-600 font-semibold">{crop.change}%</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">₹{crop.price}</p>
                      </div>
                    ))}
                    {trendsData.trends.topLosers.length === 0 && <Empty msg="No losers this period." />}
                  </div>
                </div>

                {/* Market Sentiment */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Market Sentiment</h3>
                  <span className={`badge ${trendsData.trends.marketSentiment === 'Bullish' ? 'badge-success' : 'badge-warning'}`}>
                    {trendsData.trends.marketSentiment}
                  </span>
                  <ul className="text-sm text-gray-600 space-y-1 mt-4">
                    {trendsData.trends.keyFactors.map((f, i) => (
                      <li key={i} className="flex items-start">
                        <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <Empty msg="No trend data available." />
            )}
          </div>
        </div>
      </motion.div>

      {/* ── 3. Demand Forecast ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-purple-600" />
              Demand Forecast
            </h2>
          </div>
          <div className="card-body">
            {demandLoading ? (
              <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>
            ) : demandError ? (
              <Empty msg="Failed to load demand forecast. Please refresh." />
            ) : selectedCrop && demandData?.crop ? (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedCrop}</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Current Demand</h4>
                    <span className={`badge ${demandCls(demandData.crop.currentDemand)}`}>
                      {demandData.crop.currentDemand}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">1 Month Forecast</h4>
                    <span className={`badge ${demandCls(demandData.crop.forecast['1month'].demand)}`}>
                      {demandData.crop.forecast['1month'].demand}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(demandData.crop.forecast['1month'].confidence * 100)}% confidence
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">3 Months Forecast</h4>
                    <span className={`badge ${demandCls(demandData.crop.forecast['3months'].demand)}`}>
                      {demandData.crop.forecast['3months'].demand}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(demandData.crop.forecast['3months'].confidence * 100)}% confidence
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Key Factors:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {demandData.crop.factors.map((f, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : demandData?.allCrops ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(demandData.allCrops).map(([crop, data]) => (
                  <div key={crop} className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{crop}</h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Current Demand</h4>
                        <span className={`badge ${demandCls(data.currentDemand)}`}>{data.currentDemand}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">3 Months Forecast</h4>
                        <span className={`badge ${demandCls(data.forecast['3months'].demand)}`}>
                          {data.forecast['3months'].demand}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedCrop(crop)}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View Full Forecast
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty msg="No demand forecast data available." />
            )}
          </div>
        </div>
      </motion.div>

      {/* ── 4. Weather Impact Analysis ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-orange-600" />
              Weather Impact Analysis
            </h2>
          </div>
          <div className="card-body">
            {weatherLoading ? (
              <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>
            ) : weatherError ? (
              <Empty msg="Failed to load weather data. Please refresh." />
            ) : weatherData?.weatherImpact ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(weatherData.weatherImpact).map(([region, data]) => (
                  <div key={region} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{region}</h3>
                      <span className={`badge ${impactCls(data.impact)}`}>{data.impact}</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Current Weather</h4>
                        <p className="text-sm text-gray-900 capitalize">{data.currentWeather}</p>
                        {data.temperature != null && (
                          <p className="text-xs text-gray-500">{data.temperature}°C · {data.humidity}% humidity</p>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Insight</h4>
                        <p className="text-sm text-gray-900">{data.insight}</p>
                      </div>
                      {data.affectedCrops?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Affected Crops</h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {data.affectedCrops.map((c, i) => (
                              <span key={i} className="badge badge-gray text-xs">{c}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {data.recommendations?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Recommendations</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {data.recommendations.map((r, i) => (
                              <li key={i} className="flex items-start">
                                <AlertCircle className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />{r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty msg="No weather impact data available." />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Market;
