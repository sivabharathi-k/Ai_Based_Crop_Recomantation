import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import {
  BarChart3,
  TrendingUp,
  History,
  ArrowRight,
  Activity,
  DollarSign,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { predictionAPI, marketAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

/* unwrap axios → API envelope → .data */
const unwrap = (res) => res?.data?.data ?? null;

const formatTimeAgo = (dateString) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60)  return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  if (hours < 24)  return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};

const Dashboard = () => {
  const { data: statsRes, isLoading: predictionLoading } = useQuery(
    'predictionStats',
    predictionAPI.getStats,
    { refetchInterval: 30000 }
  );

  const { data: marketRes, isLoading: marketLoading } = useQuery(
    'dashboardMarket',
    () => marketAPI.getPrices(),
    { refetchInterval: 60000 }
  );

  const { data: historyRes } = useQuery(
    'dashboardHistory',
    () => predictionAPI.getHistory({ limit: 5 }),
    { refetchInterval: 30000 }
  );

  /* correctly unwrapped data */
  const stats      = unwrap(statsRes);          // { overview, topCrops }
  const market     = unwrap(marketRes);         // { allCrops, timestamp }
  const historyRaw = unwrap(historyRes);        // { predictions, pagination }
  const recentPredictions = historyRaw?.predictions ?? [];

  const quickActions = [
    {
      title: 'Get Crop Prediction',
      description: 'Get AI-powered crop recommendations based on your soil and weather conditions',
      icon: BarChart3, href: '/prediction',
      color: 'bg-primary-500', hoverColor: 'hover:bg-primary-600'
    },
    {
      title: 'Market Intelligence',
      description: 'View real-time market prices and demand forecasts',
      icon: TrendingUp, href: '/market',
      color: 'bg-accent-500', hoverColor: 'hover:bg-accent-600'
    },
    {
      title: 'View History',
      description: 'Check your previous predictions and analysis results',
      icon: History, href: '/history',
      color: 'bg-purple-500', hoverColor: 'hover:bg-purple-600'
    }
  ];

  if (predictionLoading && marketLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const riceTrend = market?.allCrops?.Rice?.trend;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="gradient-bg rounded-2xl p-8 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">Welcome to your Smart Farm Dashboard</h1>
        <p className="text-lg opacity-90">
          Monitor your crops, analyze market trends, and make data-driven decisions
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Predictions</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.overview?.totalPredictions ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-accent-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.overview?.totalPredictions > 0
                    ? Math.round(
                        (stats.overview.successfulPredictions /
                          stats.overview.totalPredictions) * 100
                      )
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rice Market Trend</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {riceTrend === 'up' ? '↗️ Rising' :
                   riceTrend === 'down' ? '↘️ Falling' : '→ Stable'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.href}
                className="card hover:shadow-medium transition-all duration-300 group"
              >
                <div className="card-body text-center">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${action.color} ${action.hoverColor} transition-colors duration-300 mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                  <div className="flex items-center justify-center text-primary-600 group-hover:text-primary-700">
                    <span className="text-sm font-medium">Get Started</span>
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Activities — real data from prediction history */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
              <Link to="/history" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View all
              </Link>
            </div>
            <div className="card-body space-y-4">
              {recentPredictions.length > 0 ? (
                recentPredictions.map((pred, index) => {
                  const topCrop = pred.predictions?.[0];
                  const isSuccess = pred.status === 'completed';
                  return (
                    <div key={pred._id ?? index} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                        isSuccess ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {isSuccess
                          ? <CheckCircle className="h-4 w-4 text-green-600" />
                          : <AlertCircle className="h-4 w-4 text-red-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {isSuccess ? 'Crop prediction completed' : 'Prediction failed'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {topCrop
                            ? `${topCrop.crop} recommended with ${Math.round(topCrop.confidence * 100)}% confidence`
                            : `Soil type: ${pred.inputData?.soilType ?? '—'}`}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(pred.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <History className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent activity</p>
                  <Link to="/prediction" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    Make your first prediction
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Top Recommended Crops — real data from stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Top Recommended Crops</h3>
            </div>
            <div className="card-body">
              {stats?.topCrops?.length > 0 ? (
                <div className="space-y-4">
                  {stats.topCrops.slice(0, 5).map((crop, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-700">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{crop._id}</p>
                          <p className="text-xs text-gray-500">{crop.count} recommendation{crop.count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {Math.round((crop.avgConfidence ?? 0) * 100)}%
                        </p>
                        <p className="text-xs text-gray-500">avg confidence</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">No predictions yet</p>
                  <Link to="/prediction" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    Get your first prediction
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Market Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Market Overview</h3>
            <Link to="/market" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View Details
            </Link>
          </div>
          <div className="card-body">
            {market?.allCrops ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(market.allCrops).slice(0, 4).map(([crop, data]) => (
                  <div key={crop} className="text-center">
                    <h4 className="text-sm font-medium text-gray-900">{crop}</h4>
                    <p className="text-lg font-semibold text-gray-900 mt-1">₹{data.currentPrice}</p>
                    <p className="text-xs text-gray-500">{data.unit}</p>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                      data.trend === 'up'   ? 'bg-green-100 text-green-800' :
                      data.trend === 'down' ? 'bg-red-100 text-red-800'    :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {data.trend === 'up' ? '↗️' : data.trend === 'down' ? '↘️' : '→'} {data.changePercent}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Market data unavailable</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
