import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { useForm } from 'react-hook-form';
import { 
  User, 
  Mail, 
  MapPin, 
  Globe, 
  Settings, 
  Save, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { user, updateProfile, updatePassword } = useAuth();
  const { supportedLanguages, currentLanguage, changeLanguage } = useLanguage();

  // Fetch user profile data
  const { isLoading: profileLoading, refetch: refetchProfile } = useQuery(
    'userProfile',
    userAPI.getProfile,
    { enabled: !!user }
  );

  const { data: statsData, isLoading: statsLoading } = useQuery(
    'userStats',
    userAPI.getStats,
    { enabled: !!user }
  );

  // Profile form
  const profileForm = useForm({
    defaultValues: {
      name: user?.name || '',
      location: {
        country: user?.location?.country || '',
        state: user?.location?.state || '',
        city: user?.location?.city || ''
      },
      preferences: {
        language: user?.preferences?.language || 'en'
      },
      farmDetails: {
        farmSize: user?.farmDetails?.farmSize || '',
        soilTypes: user?.farmDetails?.soilTypes || [],
        currentCrops: user?.farmDetails?.currentCrops || [],
        farmingExperience: user?.farmDetails?.farmingExperience || ''
      }
    }
  });

  // Password form
  const passwordForm = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const onProfileSubmit = async (data) => {
    const result = await updateProfile(data);
    if (result.success) {
      refetchProfile();
    }
  };

  const onPasswordSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    await updatePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    });
    passwordForm.reset();
  };

  const tabs = [
    { id: 'profile', name: 'Profile Information', icon: User },
    { id: 'password', name: 'Security', icon: Settings },
    { id: 'stats', name: 'Statistics', icon: CheckCircle }
  ];

  if (profileLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-700">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {user?.name}
        </h1>
        <p className="text-lg text-gray-600">
          {user?.email} • {user?.role}
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="border-b border-gray-200"
      >
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Profile Information */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              </div>
              <div className="card-body">
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div>
                    <label className="label">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        {...profileForm.register('name', { required: 'Name is required' })}
                        className="input pl-10"
                      />
                    </div>
                    {profileForm.formState.errors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {profileForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="label">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={user?.email}
                        disabled
                        className="input pl-10 bg-gray-50"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="label">Role</label>
                    <input
                      type="text"
                      value={user?.role}
                      disabled
                      className="input bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="label">Preferred Language</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Globe className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        {...profileForm.register('preferences.language')}
                        className="input pl-10"
                        onChange={(e) => {
                          profileForm.setValue('preferences.language', e.target.value);
                          changeLanguage(e.target.value);
                        }}
                      >
                        {Object.entries(supportedLanguages).map(([code, info]) => (
                          <option key={code} value={code}>
                            {info.flag} {info.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="btn-primary flex-1"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Location & Farm Details */}
            <div className="space-y-6">
              {/* Location */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                    Location
                  </h2>
                </div>
                <div className="card-body">
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="label">Country</label>
                        <input
                          type="text"
                          {...profileForm.register('location.country')}
                          className="input"
                          placeholder="Country"
                        />
                      </div>
                      <div>
                        <label className="label">State</label>
                        <input
                          type="text"
                          {...profileForm.register('location.state')}
                          className="input"
                          placeholder="State"
                        />
                      </div>
                      <div>
                        <label className="label">City</label>
                        <input
                          type="text"
                          {...profileForm.register('location.city')}
                          className="input"
                          placeholder="City"
                        />
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Farm Details */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-gray-900">Farm Details</h2>
                </div>
                <div className="card-body">
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <div>
                      <label className="label">Farm Size (hectares)</label>
                      <input
                        type="number"
                        step="0.1"
                        {...profileForm.register('farmDetails.farmSize')}
                        className="input"
                        placeholder="Farm size in hectares"
                      />
                    </div>
                    <div>
                      <label className="label">Farming Experience (years)</label>
                      <input
                        type="number"
                        {...profileForm.register('farmDetails.farmingExperience')}
                        className="input"
                        placeholder="Years of farming experience"
                      />
                    </div>
                    <div>
                      <label className="label">Current Crops (comma-separated)</label>
                      <input
                        type="text"
                        {...profileForm.register('farmDetails.currentCrops')}
                        className="input"
                        placeholder="Rice, Wheat, Maize"
                      />
                    </div>
                    <div>
                      <label className="label">Soil Types (comma-separated)</label>
                      <input
                        type="text"
                        {...profileForm.register('farmDetails.soilTypes')}
                        className="input"
                        placeholder="Sandy, Loamy, Clay"
                      />
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="max-w-md mx-auto">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
              </div>
              <div className="card-body">
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <div>
                    <label className="label">Current Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Eye className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        {...passwordForm.register('currentPassword', { required: 'Current password is required' })}
                        className="input pl-10 pr-10"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="label">New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Eye className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        {...passwordForm.register('newPassword', { 
                          required: 'New password is required',
                          minLength: { value: 6, message: 'Password must be at least 6 characters' }
                        })}
                        className="input pl-10 pr-10"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="label">Confirm New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Eye className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...passwordForm.register('confirmPassword', { required: 'Please confirm your password' })}
                        className="input pl-10 pr-10"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn-primary w-full"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Update Password
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="card">
              <div className="card-body text-center">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {statsData?.data?.stats?.totalPredictions || 0}
                </h3>
                <p className="text-sm text-gray-600">Total Predictions</p>
              </div>
            </div>

            <div className="card">
              <div className="card-body text-center">
                <div className="h-12 w-12 rounded-full bg-secondary-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-6 w-6 text-secondary-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {statsData?.data?.stats?.accountAge || 0}
                </h3>
                <p className="text-sm text-gray-600">Days Active</p>
              </div>
            </div>

            <div className="card">
              <div className="card-body text-center">
                <div className="h-12 w-12 rounded-full bg-accent-100 flex items-center justify-center mx-auto mb-4">
                  <User className="h-6 w-6 text-accent-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {statsData?.data?.stats?.farmingExperience || 0}
                </h3>
                <p className="text-sm text-gray-600">Years Experience</p>
              </div>
            </div>

            <div className="card">
              <div className="card-body text-center">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {statsData?.data?.stats?.farmSize || 0}
                </h3>
                <p className="text-sm text-gray-600">Hectares</p>
              </div>
            </div>

            <div className="card">
              <div className="card-body text-center">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {supportedLanguages[currentLanguage]?.name || 'English'}
                </h3>
                <p className="text-sm text-gray-600">Language</p>
              </div>
            </div>

            <div className="card">
              <div className="card-body text-center">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {user?.role}
                </h3>
                <p className="text-sm text-gray-600">Account Type</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Profile;
