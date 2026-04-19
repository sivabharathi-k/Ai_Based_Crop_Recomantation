const express = require('express');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Language mapping for supported local languages
const supportedLanguages = {
  'en': 'English',
  'hi': 'Hindi',
  'ta': 'Tamil',
  'te': 'Telugu',
  'bn': 'Bengali',
  'gu': 'Gujarati',
  'mr': 'Marathi',
  'kn': 'Kannada',
  'ml': 'Malayalam',
  'pa': 'Punjabi'
};

// Translation mappings for common agricultural terms
const translations = {
  'hi': {
    'crop': 'फसल',
    'soil': 'मिट्टी',
    'fertilizer': 'उर्वरक',
    'irrigation': 'सिंचाई',
    'pest': 'कीट',
    'disease': 'रोग',
    'harvest': 'फसल कटाई',
    'yield': 'उपज',
    'weather': 'मौसम',
    'rainfall': 'वर्षा',
    'temperature': 'तापमान',
    'humidity': 'नमी',
    'nitrogen': 'नाइट्रोजन',
    'phosphorus': 'फॉस्फोरस',
    'potassium': 'पोटेशियम',
    'rice': 'चावल',
    'wheat': 'गेहूं',
    'maize': 'मक्का',
    'cotton': 'कपास',
    'sugarcane': 'गन्ना'
  },
  'ta': {
    'crop': 'பயிர்',
    'soil': 'மண்',
    'fertilizer': 'உரம்',
    'irrigation': 'பாசனம்',
    'pest': 'பூச்சி',
    'disease': 'நோய்',
    'harvest': 'அறுவடை',
    'yield': 'விளைச்சல்',
    'weather': 'வானிலை',
    'rainfall': 'மழை',
    'temperature': 'வெப்பநிலை',
    'humidity': 'ஈரப்பதம்',
    'nitrogen': 'நைட்ரஜன்',
    'phosphorus': 'பாஸ்பரஸ்',
    'potassium': 'பொட்டாசியம்',
    'rice': 'அரிசி',
    'wheat': 'கோதுமை',
    'maize': 'சோளம்',
    'cotton': 'பருத்தி',
    'sugarcane': 'கரும்பு'
  },
  'te': {
    'crop': 'పంట',
    'soil': 'నేల',
    'fertilizer': 'ఎరువు',
    'irrigation': 'నీటిపారుదల',
    'pest': 'కీటకం',
    'disease': 'వ్యాధి',
    'harvest': 'పంట కోత',
    'yield': 'ఉత్పత్తి',
    'weather': 'వాతావరణం',
    'rainfall': 'వర్షపాతం',
    'temperature': 'ఉష్ణోగ్రత',
    'humidity': 'తేమ',
    'nitrogen': 'నత్రజని',
    'phosphorus': 'భాస్వరం',
    'potassium': 'పొటాషియం',
    'rice': 'వరి',
    'wheat': 'గోధుమలు',
    'maize': 'మొక్కజొన్న',
    'cotton': 'పత్తి',
    'sugarcane': 'చెరకు'
  }
};

// @desc    Get supported languages
// @route   GET /api/nlp/languages
// @access  Public
router.get('/languages', optionalAuth, (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        supportedLanguages,
        defaultLanguage: 'en'
      }
    });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @desc    Translate text to local language
// @route   POST /api/nlp/translate
// @access  Public
router.post('/translate', optionalAuth, async (req, res) => {
  try {
    const { text, targetLanguage = 'en', sourceLanguage = 'en' } = req.body;

    if (!text) {
      return res.status(400).json({
        status: 'error',
        message: 'Text to translate is required'
      });
    }

    if (!supportedLanguages[targetLanguage]) {
      return res.status(400).json({
        status: 'error',
        message: 'Unsupported target language'
      });
    }

    // Simple translation using predefined mappings
    let translatedText = text;
    
    if (targetLanguage !== 'en' && translations[targetLanguage]) {
      const languageTranslations = translations[targetLanguage];
      
      // Replace English terms with local language terms
      Object.keys(languageTranslations).forEach(englishTerm => {
        const regex = new RegExp(`\\b${englishTerm}\\b`, 'gi');
        translatedText = translatedText.replace(regex, languageTranslations[englishTerm]);
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        originalText: text,
        translatedText,
        sourceLanguage,
        targetLanguage,
        confidence: 0.85 // Mock confidence score
      }
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during translation'
    });
  }
});

// @desc    Get crop recommendations in local language
// @route   POST /api/nlp/local-recommendations
// @access  Public
router.post('/local-recommendations', optionalAuth, async (req, res) => {
  try {
    const { recommendations, language = 'en' } = req.body;

    if (!recommendations || !Array.isArray(recommendations)) {
      return res.status(400).json({
        status: 'error',
        message: 'Recommendations array is required'
      });
    }

    if (!supportedLanguages[language]) {
      return res.status(400).json({
        status: 'error',
        message: 'Unsupported language'
      });
    }

    // Translate recommendations to local language
    const translatedRecommendations = recommendations.map(rec => {
      let translatedRec = { ...rec };
      
      if (language !== 'en' && translations[language]) {
        const languageTranslations = translations[language];
        
        // Translate description
        if (rec.description) {
          let translatedDesc = rec.description;
          Object.keys(languageTranslations).forEach(englishTerm => {
            const regex = new RegExp(`\\b${englishTerm}\\b`, 'gi');
            translatedDesc = translatedDesc.replace(regex, languageTranslations[englishTerm]);
          });
          translatedRec.description = translatedDesc;
        }
        
        // Translate type
        if (rec.type) {
          let translatedType = rec.type;
          Object.keys(languageTranslations).forEach(englishTerm => {
            const regex = new RegExp(`\\b${englishTerm}\\b`, 'gi');
            translatedType = translatedType.replace(regex, languageTranslations[englishTerm]);
          });
          translatedRec.type = translatedType;
        }
      }
      
      return translatedRec;
    });

    res.status(200).json({
      status: 'success',
      data: {
        originalLanguage: 'en',
        targetLanguage: language,
        recommendations: translatedRecommendations
      }
    });
  } catch (error) {
    console.error('Local recommendations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during translation'
    });
  }
});

// @desc    Voice-to-text conversion (mock implementation)
// @route   POST /api/nlp/voice-to-text
// @access  Public
router.post('/voice-to-text', optionalAuth, async (req, res) => {
  try {
    const { audioData, language = 'en' } = req.body;

    if (!audioData) {
      return res.status(400).json({
        status: 'error',
        message: 'Audio data is required'
      });
    }

    // Mock voice-to-text conversion
    // In production, this would use services like Google Speech-to-Text or Azure Speech
    const mockTranscriptions = {
      'en': 'The soil pH is 6.5 and nitrogen level is 45',
      'hi': 'मिट्टी का पीएच 6.5 है और नाइट्रोजन स्तर 45 है',
      'ta': 'மண்ணின் pH 6.5 மற்றும் நைட்ரஜன் அளவு 45',
      'te': 'నేల pH 6.5 మరియు నత్రజని స్థాయి 45'
    };

    const transcribedText = mockTranscriptions[language] || mockTranscriptions['en'];

    res.status(200).json({
      status: 'success',
      data: {
        transcribedText,
        language,
        confidence: 0.92,
        duration: 3.5 // Mock duration in seconds
      }
    });
  } catch (error) {
    console.error('Voice-to-text error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during voice-to-text conversion'
    });
  }
});

// @desc    Text-to-speech conversion (mock implementation)
// @route   POST /api/nlp/text-to-speech
// @access  Public
router.post('/text-to-speech', optionalAuth, async (req, res) => {
  try {
    const { text, language = 'en', voice = 'default' } = req.body;

    if (!text) {
      return res.status(400).json({
        status: 'error',
        message: 'Text to convert is required'
      });
    }

    // Mock text-to-speech conversion
    // In production, this would use services like Google Text-to-Speech or Azure Speech
    const mockAudioUrl = `https://api.example.com/tts/${language}/${encodeURIComponent(text)}.mp3`;

    res.status(200).json({
      status: 'success',
      data: {
        audioUrl: mockAudioUrl,
        text,
        language,
        voice,
        duration: Math.ceil(text.length / 10) // Mock duration based on text length
      }
    });
  } catch (error) {
    console.error('Text-to-speech error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during text-to-speech conversion'
    });
  }
});

// @desc    Get localized crop information
// @route   GET /api/nlp/crop-info/:crop/:language
// @access  Public
router.get('/crop-info/:crop/:language', optionalAuth, async (req, res) => {
  try {
    const { crop, language } = req.params;

    if (!supportedLanguages[language]) {
      return res.status(400).json({
        status: 'error',
        message: 'Unsupported language'
      });
    }

    // Mock crop information in different languages
    const cropInfo = {
      'Rice': {
        'en': {
          name: 'Rice',
          description: 'Rice is a staple food crop that requires warm temperatures and plenty of water.',
          season: 'Kharif (Monsoon)',
          duration: '120-150 days',
          tips: [
            'Maintain proper water level in fields',
            'Apply nitrogen fertilizer in split doses',
            'Control weeds regularly'
          ]
        },
        'hi': {
          name: 'चावल',
          description: 'चावल एक मुख्य खाद्य फसल है जिसे गर्म तापमान और भरपूर पानी की आवश्यकता होती है।',
          season: 'खरीफ (मानसून)',
          duration: '120-150 दिन',
          tips: [
            'खेतों में उचित जल स्तर बनाए रखें',
            'नाइट्रोजन उर्वरक को विभाजित खुराक में डालें',
            'खरपतवार को नियमित रूप से नियंत्रित करें'
          ]
        },
        'ta': {
          name: 'அரிசி',
          description: 'அரிசி ஒரு முக்கிய உணவு பயிர், இதற்கு சூடான வெப்பநிலை மற்றும் நிறைய தண்ணீர் தேவை.',
          season: 'காரிப் (மழைக்காலம்)',
          duration: '120-150 நாட்கள்',
          tips: [
            'வயல்களில் சரியான நீர் மட்டத்தை பராமரிக்கவும்',
            'நைட்ரஜன் உரத்தை பிரிக்கப்பட்ட அளவுகளில் பயன்படுத்தவும்',
            'களைகளை தவறாமல் கட்டுப்படுத்தவும்'
          ]
        }
      }
    };

    const localizedInfo = cropInfo[crop]?.[language] || cropInfo[crop]?.['en'];

    if (!localizedInfo) {
      return res.status(404).json({
        status: 'error',
        message: 'Crop information not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        crop,
        language,
        information: localizedInfo
      }
    });
  } catch (error) {
    console.error('Get crop info error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

module.exports = router;
