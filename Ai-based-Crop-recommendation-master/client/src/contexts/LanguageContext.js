import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { nlpAPI } from '../services/api';
import * as translations from '../i18n';

const LanguageContext = createContext();

const supportedLanguages = {
  'en': { name: 'English', flag: '🇺🇸', dir: 'ltr' },
  'ta': { name: 'தமிழ்', flag: '🇮🇳', dir: 'ltr' },
  'ml': { name: 'മലയാളം', flag: '🇮🇳', dir: 'ltr' }
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

  const t = useMemo(() => {
    const langTranslations = translations[currentLanguage] || translations.en;
    return (key, params = {}) => {
      let text = langTranslations;
      const keys = key.split('.');
      for (const k of keys) {
        text = text?.[k];
        if (text === undefined) break;
      }
      if (!text) return key;

      if (params && typeof params === 'object') {
        Object.keys(params).forEach(param => {
          const placeholder = `{{${param}}}`;
          text = text.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'g'), params[param]);
        });
      }
      return text;
    };
  }, [currentLanguage]);

  const value = {
    currentLanguage,
    supportedLanguages,
    changeLanguage,
    translate,
    translateRecommendations,
    getCropInfo,
    getCurrentLanguageInfo,
    t
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

export const useTranslate = () => {
  const { t } = useLanguage();
  return t;
};
