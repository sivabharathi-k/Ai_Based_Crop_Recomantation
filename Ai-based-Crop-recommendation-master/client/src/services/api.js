import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // FormData must NOT use application/json or a manual multipart header (needs boundary).
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.get('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updatePassword: (passwordData) => api.put('/auth/updatepassword', passwordData),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  deleteProfile: () => api.delete('/users/profile'),
  getStats: () => api.get('/users/stats'),
};

// Prediction API
export const predictionAPI = {
  predictCrop:        (data) => api.post('/predictions/crop', data),
  predictByLocation:  (data) => api.post('/predictions/by-location', data),
  getHistory:         (params) => api.get('/predictions/history', { params }),
  getPrediction:      (id) => api.get(`/predictions/${id}`),
  deletePrediction:   (id) => api.delete(`/predictions/${id}`),
  getStats:           () => api.get('/predictions/stats/overview'),
};

// Image Analysis API removed

// Market API
export const marketAPI = {
  getPrices: (params) => api.get('/market/prices', { params }),
  getTrends: (params) => api.get('/market/trends', { params }),
  getDemandForecast: (params) => api.get('/market/demand-forecast', { params }),
  getWeatherImpact: (params) => api.get('/market/weather-impact', { params }),
};

// NLP API
export const nlpAPI = {
  getLanguages: () => api.get('/nlp/languages'),
  translate: (data) => api.post('/nlp/translate', data),
  translateRecommendations: (data) => api.post('/nlp/local-recommendations', data),
  getCropInfo: (crop, language) => api.get(`/nlp/crop-info/${crop}/${language}`),
  voiceToText: (data) => api.post('/nlp/voice-to-text', data),
  textToSpeech: (data) => api.post('/nlp/text-to-speech', data),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
