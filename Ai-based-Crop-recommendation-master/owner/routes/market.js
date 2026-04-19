const express = require('express');
const axios   = require('axios');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ── Crop catalogue ─────────────────────────────────────────────────────────────
const CROPS = {
  Rice:      { base: 28.50, unit: 'INR/kg',      demand: 'High',      season: 'Kharif (Jun–Nov)' },
  Wheat:     { base: 25.20, unit: 'INR/kg',      demand: 'Very High', season: 'Rabi (Nov–Apr)'   },
  Maize:     { base: 22.80, unit: 'INR/kg',      demand: 'High',      season: 'Kharif/Rabi'      },
  Cotton:    { base: 72.00, unit: 'INR/kg',      demand: 'High',      season: 'Kharif (Jun–Nov)' },
  Sugarcane: { base: 3.40,  unit: 'INR/kg',      demand: 'Medium',    season: 'Year-round'       },
  Soybean:   { base: 45.00, unit: 'INR/kg',      demand: 'High',      season: 'Kharif (Jun–Nov)' },
  Tomato:    { base: 18.00, unit: 'INR/kg',      demand: 'Very High', season: 'Year-round'       },
  Onion:     { base: 22.00, unit: 'INR/kg',      demand: 'Very High', season: 'Year-round'       },
};

const REGIONS = {
  Rice:      { Punjab: 29.00, Haryana: 28.50, 'Uttar Pradesh': 27.80, 'West Bengal': 28.20 },
  Wheat:     { Punjab: 25.50, Haryana: 25.20, 'Madhya Pradesh': 24.80, Rajasthan: 25.00 },
  Maize:     { Karnataka: 23.20, 'Andhra Pradesh': 22.80, Bihar: 22.40, Maharashtra: 23.00 },
  Cotton:    { Gujarat: 73.00, Maharashtra: 72.00, Telangana: 71.00, Punjab: 72.50 },
  Sugarcane: { 'Uttar Pradesh': 3.50, Maharashtra: 3.40, Karnataka: 3.30, 'Tamil Nadu': 3.45 },
  Soybean:   { 'Madhya Pradesh': 45.50, Maharashtra: 45.00, Rajasthan: 44.50, Karnataka: 45.20 },
  Tomato:    { Karnataka: 18.50, 'Andhra Pradesh': 18.00, Maharashtra: 17.50, Gujarat: 18.20 },
  Onion:     { Maharashtra: 22.50, Karnataka: 22.00, Gujarat: 21.50, 'Madhya Pradesh': 22.20 },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Deterministic pseudo-random based on seed (no external dep) */
function seededRand(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate N days of price history ending today.
 * Uses a seeded walk so the same crop always produces the same shape.
 */
function priceHistory(cropName, days = 30) {
  const base  = CROPS[cropName]?.base || 25;
  const seed  = cropName.charCodeAt(0) + cropName.charCodeAt(1);
  const today = new Date();
  const result = [];

  let price = base * (0.92 + seededRand(seed) * 0.08);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

    // Small daily walk ±1.5 %
    const delta = (seededRand(seed + i) - 0.48) * 0.03;
    price = Math.max(base * 0.80, Math.min(base * 1.25, price * (1 + delta)));

    result.push({ date: label, price: parseFloat(price.toFixed(2)) });
  }
  return result;
}

/** Compute trend from history */
function computeTrend(history) {
  if (history.length < 2) return { trend: 'stable', changePercent: 0 };
  const first = history[0].price;
  const last  = history[history.length - 1].price;
  const pct   = parseFloat((((last - first) / first) * 100).toFixed(2));
  return {
    trend:         pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'stable',
    changePercent: Math.abs(pct),
  };
}

/** Build full crop market object */
function buildCropData(name, days = 30) {
  const info    = CROPS[name];
  const history = priceHistory(name, days);
  const { trend, changePercent } = computeTrend(history);
  const regions = REGIONS[name] || {};

  return {
    currentPrice:  history[history.length - 1].price,
    unit:          info.unit,
    demand:        info.demand,
    season:        info.season,
    trend,
    changePercent,
    history,
    regions: Object.fromEntries(
      Object.entries(regions).map(([region, price]) => {
        const regionHistory = history.map(h => ({
          date:  h.date,
          price: parseFloat((price * (h.price / (CROPS[name]?.base || 25))).toFixed(2)),
        }));
        const rt = computeTrend(regionHistory);
        return [region, { price, trend: rt.trend }];
      })
    ),
  };
}

/** Demand forecast for a single crop */
function buildDemandForecast(name) {
  const info = CROPS[name];
  const demandLevels = ['Low', 'Medium', 'High', 'Very High'];
  const idx = demandLevels.indexOf(info.demand);

  const forecastDemand = (shift) =>
    demandLevels[Math.min(3, Math.max(0, idx + shift))];

  return {
    currentDemand: info.demand,
    trend: idx >= 2 ? 'Increasing' : 'Stable',
    forecast: {
      '1month':  { demand: forecastDemand(0),  confidence: 0.88 },
      '3months': { demand: forecastDemand(1),  confidence: 0.78 },
      '6months': { demand: forecastDemand(0),  confidence: 0.68 },
    },
    factors: [
      `${name} is a ${info.season.toLowerCase()} crop with consistent demand`,
      'Government MSP support stabilises floor price',
      'Export opportunities improving with global supply tightening',
    ],
  };
}

// ── Routes ─────────────────────────────────────────────────────────────────────

// GET /api/market/prices
router.get('/prices', optionalAuth, (req, res) => {
  try {
    const { crop, days: daysParam } = req.query;
    const days = parseInt(daysParam) || 30;

    if (crop && CROPS[crop]) {
      return res.json({
        status: 'success',
        data: {
          crop,
          marketInfo: buildCropData(crop, days),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const allCrops = {};
    Object.keys(CROPS).forEach(name => {
      allCrops[name] = buildCropData(name, days);
    });

    res.json({
      status: 'success',
      data: { allCrops, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    console.error('market/prices error:', err);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

// GET /api/market/trends
router.get('/trends', optionalAuth, (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const days = period === '90d' ? 90 : 30;

    const allData = Object.entries(CROPS).map(([name]) => {
      const d = buildCropData(name, days);
      return { crop: name, change: d.changePercent * (d.trend === 'down' ? -1 : 1), price: d.currentPrice };
    });

    const sorted     = [...allData].sort((a, b) => b.change - a.change);
    const topGainers = sorted.filter(c => c.change > 0).slice(0, 3);
    const topLosers  = sorted.filter(c => c.change < 0).slice(0, 3);

    const bullishCount = allData.filter(c => c.change > 0).length;
    const sentiment    = bullishCount >= allData.length / 2 ? 'Bullish' : 'Bearish';

    // Per-crop history for chart
    const chartData = {};
    Object.keys(CROPS).forEach(name => {
      chartData[name] = priceHistory(name, days);
    });

    res.json({
      status: 'success',
      data: {
        period,
        trends: {
          topGainers,
          topLosers,
          marketSentiment: sentiment,
          keyFactors: [
            'Government MSP revisions driving floor prices higher',
            'Export demand from South-East Asia boosting Maize & Rice',
            'Erratic monsoon creating supply uncertainty for Kharif crops',
            'Fuel cost increases raising transportation and input costs',
          ],
        },
        chartData,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('market/trends error:', err);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

// GET /api/market/demand-forecast
router.get('/demand-forecast', optionalAuth, (req, res) => {
  try {
    const { crop } = req.query;

    if (crop && CROPS[crop]) {
      return res.json({
        status: 'success',
        data: {
          crop: buildDemandForecast(crop),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const allCrops = {};
    Object.keys(CROPS).forEach(name => { allCrops[name] = buildDemandForecast(name); });

    res.json({
      status: 'success',
      data: { allCrops, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    console.error('market/demand-forecast error:', err);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

// GET /api/market/weather-impact
router.get('/weather-impact', optionalAuth, async (req, res) => {
  const WEATHER_KEY = process.env.WEATHER_API_KEY;

  // City → region mapping for weather fetch
  const CITIES = [
    { city: 'Ludhiana',   region: 'North India',  lat: 30.90, lon: 75.85 },
    { city: 'Hyderabad',  region: 'South India',  lat: 17.38, lon: 78.49 },
    { city: 'Kolkata',    region: 'East India',   lat: 22.57, lon: 88.36 },
    { city: 'Pune',       region: 'West India',   lat: 18.52, lon: 73.86 },
  ];

  const impactRule = (temp, humidity, rain) => {
    if (rain > 50)  return { impact: 'Mixed',    insight: 'Heavy rainfall — risk of waterlogging for Wheat & Cotton; beneficial for Rice.' };
    if (rain < 2 && humidity < 40) return { impact: 'Negative', insight: 'Dry conditions — irrigation demand rising; price pressure on Rice & Sugarcane.' };
    if (temp > 38)  return { impact: 'Negative', insight: 'Heat stress likely — reduced yields expected for Wheat and Maize.' };
    if (temp < 10)  return { impact: 'Positive', insight: 'Cool weather favourable for Rabi crops (Wheat, Mustard).' };
    return { impact: 'Positive', insight: 'Favourable conditions — normal crop development expected.' };
  };

  try {
    let regions = {};

    if (WEATHER_KEY) {
      const results = await Promise.allSettled(
        CITIES.map(c =>
          axios.get('https://api.openweathermap.org/data/2.5/weather', {
            params: { lat: c.lat, lon: c.lon, appid: WEATHER_KEY, units: 'metric' },
            timeout: 6000,
          }).then(r => ({ ...c, weather: r.data }))
        )
      );

      results.forEach(r => {
        if (r.status !== 'fulfilled') return;
        const { region, city, weather } = r.value;
        const temp     = weather.main.temp;
        const humidity = weather.main.humidity;
        const rain     = weather.rain?.['1h'] || weather.rain?.['3h'] || 0;
        const { impact, insight } = impactRule(temp, humidity, rain);

        regions[region] = {
          city,
          currentWeather: weather.weather[0].description,
          temperature:    parseFloat(temp.toFixed(1)),
          humidity,
          rainfall:       parseFloat(rain.toFixed(1)),
          impact,
          insight,
          forecast:       insight,
          affectedCrops:  impact === 'Negative' ? ['Rice', 'Wheat'] : impact === 'Mixed' ? ['Cotton', 'Wheat'] : [],
          recommendations: [
            insight,
            impact === 'Negative'
              ? 'Consider drought-resistant varieties and drip irrigation.'
              : 'Maintain regular scouting and balanced fertilisation.',
          ],
        };
      });
    }

    // Fallback / supplement with static data for any missing regions
    const fallback = {
      'North India': {
        city: 'Ludhiana', currentWeather: 'partly cloudy', temperature: 28, humidity: 55, rainfall: 0,
        impact: 'Positive', insight: 'Favourable conditions for Rabi sowing.',
        forecast: 'Normal conditions expected for next 7 days.',
        affectedCrops: [], recommendations: ['Continue normal farming practices.', 'Monitor soil moisture.'],
      },
      'South India': {
        city: 'Hyderabad', currentWeather: 'clear sky', temperature: 33, humidity: 40, rainfall: 0,
        impact: 'Negative', insight: 'Dry spell — irrigation critical for Rice & Sugarcane.',
        forecast: 'Below-normal rainfall forecast for next 10 days.',
        affectedCrops: ['Rice', 'Sugarcane'], recommendations: ['Implement drip irrigation.', 'Use drought-tolerant varieties.'],
      },
      'East India': {
        city: 'Kolkata', currentWeather: 'moderate rain', temperature: 26, humidity: 82, rainfall: 12,
        impact: 'Mixed', insight: 'Heavy rain — good for Rice but risk of waterlogging for Jute.',
        forecast: 'Above-normal rainfall expected.',
        affectedCrops: ['Jute', 'Wheat'], recommendations: ['Ensure proper drainage.', 'Delay Wheat sowing if waterlogged.'],
      },
      'West India': {
        city: 'Pune', currentWeather: 'few clouds', temperature: 30, humidity: 60, rainfall: 2,
        impact: 'Positive', insight: 'Moderate conditions — ideal for Soybean and Cotton.',
        forecast: 'Normal monsoon activity expected.',
        affectedCrops: [], recommendations: ['Good time for Kharif crop sowing.', 'Monitor pest activity.'],
      },
    };

    Object.keys(fallback).forEach(r => {
      if (!regions[r]) regions[r] = fallback[r];
    });

    res.json({
      status: 'success',
      data: {
        weatherImpact: regions,
        source: WEATHER_KEY ? 'OpenWeatherMap (live)' : 'Simulated data',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('market/weather-impact error:', err);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

module.exports = router;
