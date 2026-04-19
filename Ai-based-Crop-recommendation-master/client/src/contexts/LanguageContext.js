import React, { createContext, useContext, useState, useEffect } from 'react';
import { nlpAPI } from '../services/api';

const LanguageContext = createContext();

const supportedLanguages = {
  'en': { name: 'English', flag: '🇺🇸' },
  'ta': { name: 'தமிழ்', flag: '🇮🇳' },
  'ml': { name: 'മലയാളം', flag: '🇮🇳' }
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem('language') || 'en'
  );

  useEffect(() => {
    localStorage.setItem('language', currentLanguage);
  }, [currentLanguage]);

  const translate = async (text, targetLanguage = currentLanguage) => {
    if (targetLanguage === 'en' || !text) {
      return text;
    }

    try {
      const response = await nlpAPI.translate({
        text,
        targetLanguage,
        sourceLanguage: 'en'
      });
      return response.data.translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    }
  };

  const translateRecommendations = async (recommendations, targetLanguage = currentLanguage) => {
    if (targetLanguage === 'en' || !recommendations) {
      return recommendations;
    }

    try {
      const response = await nlpAPI.translateRecommendations({
        recommendations,
        language: targetLanguage
      });
      return response.data.recommendations;
    } catch (error) {
      console.error('Recommendations translation error:', error);
      return recommendations;
    }
  };

  const getCropInfo = async (crop, language = currentLanguage) => {
    try {
      const response = await nlpAPI.getCropInfo(crop, language);
      return response.data.information;
    } catch (error) {
      console.error('Get crop info error:', error);
      return null;
    }
  };

  const changeLanguage = (languageCode) => {
    if (supportedLanguages[languageCode]) {
      setCurrentLanguage(languageCode);
    }
  };

  const getCurrentLanguageInfo = () => {
    return supportedLanguages[currentLanguage] || supportedLanguages['en'];
  };

  const value = {
    currentLanguage,
    supportedLanguages,
    changeLanguage,
    translate,
    translateRecommendations,
    getCropInfo,
    getCurrentLanguageInfo
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
