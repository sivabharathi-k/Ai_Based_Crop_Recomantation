const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User registration validation
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('role')
    .optional()
    .isIn(['farmer', 'advisor', 'admin'])
    .withMessage('Role must be farmer, advisor, or admin'),
  
  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Crop prediction validation
const validatePrediction = [
  body('nitrogen')
    .isFloat({ min: 0, max: 200 })
    .withMessage('Nitrogen must be between 0 and 200'),
  
  body('phosphorus')
    .isFloat({ min: 0, max: 200 })
    .withMessage('Phosphorus must be between 0 and 200'),
  
  body('potassium')
    .isFloat({ min: 0, max: 200 })
    .withMessage('Potassium must be between 0 and 200'),
  
  body('temperature')
    .isFloat({ min: -50, max: 60 })
    .withMessage('Temperature must be between -50°C and 60°C'),
  
  body('humidity')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Humidity must be between 0% and 100%'),
  
  body('ph')
    .isFloat({ min: 0, max: 14 })
    .withMessage('pH must be between 0 and 14'),
  
  body('rainfall')
    .isFloat({ min: 0, max: 3000 })
    .withMessage('Rainfall must be between 0 and 3000mm'),
  
  body('soilType')
    .isIn(['Sandy', 'Loamy', 'Clay', 'Black', 'Red', 'Laterite'])
    .withMessage('Soil type must be one of: Sandy, Loamy, Clay, Black, Red, Laterite'),
  
  handleValidationErrors
];

// Location validation
const validateLocation = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  handleValidationErrors
];

// User profile update validation
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('location.country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters'),
  
  body('location.state')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  
  body('location.city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  
  body('preferences.language')
    .optional()
    .isIn(['en', 'hi', 'ta', 'te', 'bn', 'gu', 'mr', 'kn', 'ml', 'pa'])
    .withMessage('Language must be a supported language code'),
  
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validatePrediction,
  validateLocation,
  validateProfileUpdate,
  handleValidationErrors
};
