import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Prediction from './pages/Prediction';
import Market from './pages/Market';
import Profile from './pages/Profile';
import History from './pages/History';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={
              <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
            } />
            <Route path="/prediction" element={
              <ProtectedRoute><Layout><Prediction /></Layout></ProtectedRoute>
            } />
            <Route path="/market" element={
              <ProtectedRoute><Layout><Market /></Layout></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute><Layout><History /></Layout></ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
