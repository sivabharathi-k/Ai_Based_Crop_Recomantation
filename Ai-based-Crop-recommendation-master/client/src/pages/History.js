import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import {
  History as HistoryIcon,
  BarChart3,
  Calendar,
  MapPin,
  Trash2,
  Eye,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { predictionAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const History = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  const { data: predictionHistory, isLoading, error, refetch } = useQuery(
    'predictionHistory',
    () => predictionAPI.getHistory({ limit: 50 }),
    { refetchInterval: 30000, retry: 1 }
  );

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this prediction?')) {
      try {
        await predictionAPI.deletePrediction(id);
        refetch();
        toast.success('Prediction deleted successfully');
      } catch {
        toast.error('Failed to delete prediction');
      }
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'failed':     return 'text-red-600 bg-red-100';
      default:           return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const filterData = (data) => {
    let filtered = data || [];

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.predictions?.some(p =>
          p.crop.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (dateFilter === 'today')  cutoff.setHours(0, 0, 0, 0);
      if (dateFilter === 'week')   cutoff.setDate(now.getDate() - 7);
      if (dateFilter === 'month')  cutoff.setMonth(now.getMonth() - 1);
      filtered = filtered.filter(item => new Date(item.createdAt) >= cutoff);
    }

    return filtered;
  };

  // axios response → res.data (API envelope) → .data.predictions
  const filtered = filterData(predictionHistory?.data?.data?.predictions);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 font-medium">Failed to load history</p>
          <p className="text-gray-500 text-sm mt-1">Make sure you are logged in and the server is running.</p>
          <button onClick={() => refetch()} className="btn-secondary mt-4">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
            <HistoryIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Prediction History</h1>
        <p className="text-lg text-gray-600">View and manage your crop predictions</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                  placeholder="Search by crop name..."
                />
              </div>
            </div>
            <div>
              <label className="label">Date Filter</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setSearchTerm(''); setDateFilter('all'); }}
                className="btn-secondary w-full"
              >
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {filtered.length > 0 ? (
          filtered.map((prediction) => (
            <div key={prediction._id} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <BarChart3 className="h-5 w-5 text-primary-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Crop Prediction</h3>
                      <span className={`badge ${getStatusColor(prediction.status)}`}>
                        {prediction.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Recommended Crops</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {prediction.predictions?.map((pred, i) => (
                            <span key={i} className="badge badge-primary">{pred.crop}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Confidence</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {prediction.predictions?.map((pred, i) => (
                            <span key={i} className={`badge ${getConfidenceColor(pred.confidence)}`}>
                              {Math.round(pred.confidence * 100)}%
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Soil Type</h4>
                        <p className="text-sm text-gray-900">{prediction.inputData?.soilType ?? '—'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Processing Time</h4>
                        <p className="text-sm text-gray-900">
                          {prediction.processingTime != null ? `${prediction.processingTime}ms` : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(prediction.createdAt)}
                      </div>
                      {prediction.inputData?.location?.address && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {prediction.inputData.location.address}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <button className="btn-secondary btn-sm" title="View">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="btn-secondary btn-sm" title="Download">
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(prediction._id)}
                      className="btn-danger btn-sm"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card">
            <div className="card-body text-center py-12">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No predictions found</h3>
              <p className="text-gray-600">
                {searchTerm || dateFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start by making your first crop prediction'}
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default History;
