const express = require('express');
const { spawn } = require('child_process');
const path    = require('path');
const axios   = require('axios');
const Prediction = require('../models/Prediction');
const User       = require('../models/User');
const { protect }            = require('../middleware/auth');
const { validatePrediction } = require('../middleware/validation');
const { getPythonPath }      = require('../config/pythonPath');

const router = express.Router();

const WEATHER_APIKEY = process.env.WEATHER_API_KEY;
const OWM_BASE       = 'https://api.openweathermap.org/data/2.5';
const GEO_BASE       = 'https://api.openweathermap.org/geo/1.0';

// -- Helper: run Python prediction using spawn (handles paths with spaces) ----
const runPythonPrediction = (pythonData) => {
  return new Promise((resolve, reject) => {
    const pythonBin  = getPythonPath();
    const scriptPath = path.join(__dirname, '../scripts/predict_crop.py');
    const arg        = Buffer.from(JSON.stringify(pythonData)).toString('base64');

    const proc = spawn(pythonBin, [scriptPath, arg], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' }
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGTERM');
      reject(new Error('Python prediction timed out after 30s'));
    }, 30000);

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) return;
      if (stderr) console.log('[Python stderr]', stderr.slice(-300));

      const jsonLine = stdout.split('\n').map(l => l.trim()).filter(l => l.startsWith('{')).pop();
      if (!jsonLine) return reject(new Error(`No JSON output (exit ${code}): ${stderr.slice(-200)}`));

      let parsed;
      try { parsed = JSON.parse(jsonLine); } catch (e) {
        return reject(new Error(`JSON parse failed: ${jsonLine.slice(0, 200)}`));
      }
      if (parsed.error) return reject(new Error(`Python model error: ${parsed.error}`));
      resolve(parsed);
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to start Python: ${err.message}`));
    });
  });
};

// ── Weather helpers ──────────────────────────────────────────────────────────

/**
 * Fetch current weather + 5-day forecast rainfall by lat/lon.
 * Returns { temperature, humidity, rainfall, cityName, country }
 */
async function fetchWeatherByCoords(lat, lon) {
  const [currentRes, forecastRes] = await Promise.all([
    axios.get(`${OWM_BASE}/weather`, {
      params: { lat, lon, appid: WEATHER_APIKEY, units: 'metric' },
      timeout: 8000,
    }),
    axios.get(`${OWM_BASE}/forecast`, {
      params: { lat, lon, appid: WEATHER_APIKEY, units: 'metric', cnt: 40 },
      timeout: 8000,
    }),
  ]);

  const cur      = currentRes.data;
  const forecast = forecastRes.data;

  // Sum rain from 5-day/3-hour forecast (mm per 3h slots → monthly estimate)
  const totalRain3h = forecast.list.reduce((sum, slot) => {
    return sum + (slot.rain?.['3h'] || 0);
  }, 0);
  // 40 slots = 5 days; scale to 30-day monthly rainfall
  const monthlyRainfall = parseFloat(((totalRain3h / 5) * 30).toFixed(2));

  return {
    temperature: parseFloat(cur.main.temp.toFixed(2)),
    humidity:    parseFloat(cur.main.humidity.toFixed(2)),
    rainfall:    monthlyRainfall,
    cityName:    cur.name,
    country:     cur.sys.country,
    description: cur.weather?.[0]?.description || '',
    windSpeed:   cur.wind?.speed || 0,
    feelsLike:   cur.main.feels_like,
  };
}

/**
 * Resolve city name -> lat/lon using OWM Geocoding API.
 */
async function geocodeCity(city) {
  const res = await axios.get(`${GEO_BASE}/direct`, {
    params: { q: city, limit: 1, appid: WEATHER_APIKEY },
    timeout: 8000,
  });
  if (!res.data?.length) throw new Error(`City not found: "${city}"`);
  const { lat, lon, name, country } = res.data[0];
  return { lat, lon, name, country };
}

// @desc    Get crop prediction
// @route   POST /api/predictions/crop
// @access  Private
router.post('/crop', protect, validatePrediction, async (req, res) => {
  const startTime = Date.now();
  const inputData = req.body;
  let prediction = null;

  try {
    // Create pending record
    prediction = new Prediction({ user: req.user.id, inputData, status: 'pending' });
    await prediction.save();

    console.log('[Prediction] Input received:', JSON.stringify(inputData));

    const pythonData = {
      nitrogen:    inputData.nitrogen,
      phosphorus:  inputData.phosphorus,
      potassium:   inputData.potassium,
      temperature: inputData.temperature,
      humidity:    inputData.humidity,
      ph:          inputData.ph,
      rainfall:    inputData.rainfall,
      soil_type:   inputData.soilType
    };

    const predictionResult = await runPythonPrediction(pythonData);
    console.log('[Prediction] Python result:', JSON.stringify(predictionResult));

    prediction.predictions     = predictionResult.predictions    || [];
    prediction.recommendations = predictionResult.recommendations || [];
    prediction.marketData      = predictionResult.marketData     || {};
    prediction.cropInfo        = predictionResult.cropInfo       || {};
    prediction.status          = 'completed';
    prediction.processingTime  = Date.now() - startTime;
    prediction.modelVersion    = predictionResult.modelVersion   || '1.0';

    await prediction.save();

    // Best-effort: update history (don't let this crash the response)
    User.findByIdAndUpdate(req.user.id, {
      $push: { predictionHistory: prediction._id }
    }).catch(e => console.warn('[Prediction] History update failed:', e.message));

    return res.status(200).json({
      status: 'success',
      data: { prediction, processingTime: prediction.processingTime }
    });

  } catch (err) {
    console.error('[Prediction] Error:', err.message);

    // Try to mark as failed — but don't let a DB error here cause another unhandled throw
    if (prediction && prediction._id) {
      prediction.status = 'failed';
      prediction.processingTime = Date.now() - startTime;
      prediction.save().catch(e => console.warn('[Prediction] Failed to save failure status:', e.message));
    }

    return res.status(500).json({
      status: 'error',
      message: 'Prediction failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @desc    Location-based crop prediction (auto-fetch weather)
// @route   POST /api/predictions/by-location
// @access  Private
router.post('/by-location', protect, async (req, res) => {
  if (!WEATHER_APIKEY) {
    return res.status(500).json({
      status: 'error',
      message: 'WEATHER_API_KEY not set in .env',
    });
  }

  const startTime = Date.now();
  const {
    latitude, longitude,
    city,
    nitrogen    = 80,
    phosphorus  = 40,
    potassium   = 40,
    ph          = 6.5,
    soilType    = 'Loamy',
  } = req.body;

  let prediction = null;

  try {
    // 1. Resolve coordinates
    let lat, lon, resolvedCity, resolvedCountry;

    if (latitude != null && longitude != null) {
      lat = parseFloat(latitude);
      lon = parseFloat(longitude);
      resolvedCity    = req.body.city || 'Your location';
      resolvedCountry = '';
    } else if (city) {
      const geo = await geocodeCity(city);
      lat = geo.lat; lon = geo.lon;
      resolvedCity    = geo.name;
      resolvedCountry = geo.country;
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Provide latitude+longitude or a city name.',
      });
    }

    // 2. Fetch weather
    const weather = await fetchWeatherByCoords(lat, lon);
    resolvedCity    = weather.cityName    || resolvedCity;
    resolvedCountry = weather.country     || resolvedCountry;

    // 3. Build ML input
    const inputData = {
      nitrogen:    parseFloat(nitrogen),
      phosphorus:  parseFloat(phosphorus),
      potassium:   parseFloat(potassium),
      temperature: weather.temperature,
      humidity:    weather.humidity,
      ph:          parseFloat(ph),
      rainfall:    weather.rainfall,
      soilType,
      location: { latitude: lat, longitude: lon,
                  address: `${resolvedCity}, ${resolvedCountry}`.trim().replace(/,$/, '') },
    };

    // 4. Save pending record
    prediction = new Prediction({ user: req.user.id, inputData, status: 'pending' });
    await prediction.save();

    // 5. Run ML model
    const pythonData = {
      nitrogen:    inputData.nitrogen,
      phosphorus:  inputData.phosphorus,
      potassium:   inputData.potassium,
      temperature: inputData.temperature,
      humidity:    inputData.humidity,
      ph:          inputData.ph,
      rainfall:    inputData.rainfall,
      soil_type:   inputData.soilType,
    };

    const predictionResult = await runPythonPrediction(pythonData);

    prediction.predictions     = predictionResult.predictions     || [];
    prediction.recommendations = predictionResult.recommendations || [];
    prediction.marketData      = predictionResult.marketData      || {};
    prediction.cropInfo        = predictionResult.cropInfo        || {};
    prediction.status          = 'completed';
    prediction.processingTime  = Date.now() - startTime;
    prediction.modelVersion    = predictionResult.modelVersion    || '1.0';
    await prediction.save();

    User.findByIdAndUpdate(req.user.id, {
      $push: { predictionHistory: prediction._id },
    }).catch(() => {});

    return res.status(200).json({
      status: 'success',
      data: {
        prediction,
        processingTime: prediction.processingTime,
        weather: {
          temperature: weather.temperature,
          humidity:    weather.humidity,
          rainfall:    weather.rainfall,
          description: weather.description,
          windSpeed:   weather.windSpeed,
          feelsLike:   weather.feelsLike,
          city:        resolvedCity,
          country:     resolvedCountry,
        },
        location: { lat, lon, city: resolvedCity, country: resolvedCountry },
        autoFilledValues: {
          temperature: weather.temperature,
          humidity:    weather.humidity,
          rainfall:    weather.rainfall,
          nitrogen:    inputData.nitrogen,
          phosphorus:  inputData.phosphorus,
          potassium:   inputData.potassium,
          ph:          inputData.ph,
          soilType:    inputData.soilType,
        },
      },
    });

  } catch (err) {
    console.error('[by-location] Error:', err.message);

    if (prediction?._id) {
      prediction.status = 'failed';
      prediction.processingTime = Date.now() - startTime;
      prediction.save().catch(() => {});
    }

    const isWeatherErr = err.response?.status === 401;
    return res.status(isWeatherErr ? 502 : 500).json({
      status:  'error',
      message: isWeatherErr
        ? 'Weather API key invalid. Check WEATHER_API_KEY in .env.'
        : err.message || 'Location-based prediction failed.',
    });
  }
});

// @desc    Get prediction statistics
// @route   GET /api/predictions/stats/overview
// @access  Private
// NOTE: This route MUST be defined before /:id to avoid being shadowed
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const stats = await Prediction.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalPredictions: { $sum: 1 },
          avgProcessingTime: { $avg: '$processingTime' },
          successfulPredictions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          failedPredictions:     { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
        }
      }
    ]);

    const topCrops = await Prediction.aggregate([
      { $match: { user: req.user._id, status: 'completed' } },
      { $unwind: '$predictions' },
      {
        $group: {
          _id: '$predictions.crop',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$predictions.confidence' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        overview: stats[0] || {
          totalPredictions: 0, avgProcessingTime: 0,
          successfulPredictions: 0, failedPredictions: 0
        },
        topCrops
      }
    });
  } catch (error) {
    console.error('Get prediction stats error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

// @desc    Get user's prediction history
// @route   GET /api/predictions/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const predictions = await Prediction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await Prediction.countDocuments({ user: req.user.id });

    res.status(200).json({
      status: 'success',
      data: { predictions, pagination: { current: page, pages: Math.ceil(total / limit), total } }
    });
  } catch (error) {
    console.error('Get prediction history error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

// @desc    Get specific prediction by ID
// @route   GET /api/predictions/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const prediction = await Prediction.findOne({ _id: req.params.id, user: req.user.id });
    if (!prediction) {
      return res.status(404).json({ status: 'error', message: 'Prediction not found' });
    }
    res.status(200).json({ status: 'success', data: { prediction } });
  } catch (error) {
    console.error('Get prediction error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

// @desc    Delete prediction
// @route   DELETE /api/predictions/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const prediction = await Prediction.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!prediction) {
      return res.status(404).json({ status: 'error', message: 'Prediction not found' });
    }
    await User.findByIdAndUpdate(req.user.id, { $pull: { predictionHistory: prediction._id } });
    res.status(200).json({ status: 'success', message: 'Prediction deleted successfully' });
  } catch (error) {
    console.error('Delete prediction error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

module.exports = router;
