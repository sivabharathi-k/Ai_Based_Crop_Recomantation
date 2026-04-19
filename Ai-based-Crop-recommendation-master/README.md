# 🌱 CropAI - Intelligent Crop Recommendation Platform

A comprehensive full-stack web application for intelligent crop recommendation using machine learning, AI-powered image analysis, and market intelligence. Built for the SIH (Smart India Hackathon) with modern technologies and a beautiful UI inspired by smartfarm.ch.

## ✨ Features

### 🤖 AI-Powered Crop Prediction
- **Machine Learning Integration**: Uses trained ML models for accurate crop recommendations
- **Multi-factor Analysis**: Considers soil nutrients, weather conditions, pH levels, and rainfall
- **Confidence Scoring**: Provides confidence levels for each recommendation
- **Real-time Processing**: Fast predictions with processing time tracking

### 📸 Image Analysis & Disease Detection
- **Computer Vision**: AI-powered pest and disease detection from crop images
- **Instant Analysis**: Upload images for immediate health assessment
- **Treatment Recommendations**: Provides specific treatment options and effectiveness ratings
- **Severity Assessment**: Categorizes issues by severity (Low, Medium, High, Critical)

### 📊 Market Intelligence
- **Real-time Prices**: Current market prices for various crops
- **Trend Analysis**: Price trends and market sentiment analysis
- **Demand Forecasting**: Future demand predictions with confidence scores
- **Weather Impact**: Analysis of weather conditions on crop markets

### 🌍 Multi-Language Support
- **10+ Languages**: Support for Hindi, Tamil, Telugu, Bengali, Gujarati, Marathi, Kannada, Malayalam, Punjabi, and English
- **NLP Integration**: Natural language processing for local language support
- **Voice Features**: Text-to-speech and voice-to-text capabilities
- **Cultural Adaptation**: Region-specific crop information and recommendations

### 🔐 Secure Authentication
- **JWT-based Auth**: Secure token-based authentication
- **Role-based Access**: Support for farmers, advisors, and admin roles
- **Profile Management**: Comprehensive user profile with farm details
- **Data Security**: Encrypted data storage and transmission

## 🛠️ Tech Stack

### Frontend
- **React.js 18**: Modern React with hooks and functional components
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Framer Motion**: Smooth animations and transitions
- **React Query**: Data fetching and caching
- **React Hook Form**: Form handling and validation
- **Lucide React**: Beautiful icon library

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database with Mongoose ODM
- **JWT**: JSON Web Tokens for authentication
- **Python Shell**: Integration with Python ML models
- **Cloudinary**: Image storage and processing
- **Multer**: File upload handling

### Machine Learning
- **Python**: ML model development and inference
- **Scikit-learn**: Machine learning algorithms
- **Joblib**: Model serialization and loading
- **Computer Vision**: Image analysis and processing

### DevOps & Tools
- **Concurrently**: Run multiple npm scripts simultaneously
- **Nodemon**: Development server with auto-restart
- **ESLint**: Code linting and formatting
- **Git**: Version control

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB (local or cloud instance)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crop_predication
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp owner/env.example owner/.env
   
   # Edit the .env file with your configuration
   nano owner/.env
   ```

4. **Configure Environment Variables**
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/crop_prediction
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   
   # Python ML Model Path
   ML_MODEL_PATH=./ml_models/crop_recommendation_model.pkl
   PYTHON_SCRIPT_PATH=./scripts/predict_crop.py
   
   # Cloudinary Configuration (for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # External APIs
   WEATHER_API_KEY=your_weather_api_key
   MARKET_API_KEY=your_market_api_key
   
   # CORS
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start the application**
   ```bash
   # Development mode (runs both frontend and backend)
   npm run dev
   
   # Or run separately:
   # Backend only
   npm run server
   
   # Frontend only
   npm run client
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/api/health

## 📁 Project Structure

```
crop_predication/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── index.js       # Entry point
│   ├── package.json
│   └── tailwind.config.js
├── owner/                 # Node.js backend
│   ├── config/           # Configuration files
│   ├── middleware/       # Express middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── scripts/         # Python ML scripts
│   ├── server.js        # Server entry point
│   └── package.json
├── ml_models/           # Trained ML models
├── package.json         # Root package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/logout` - User logout
- `PUT /api/auth/updatepassword` - Update password

### Predictions
- `POST /api/predictions/crop` - Get crop prediction
- `GET /api/predictions/history` - Get prediction history
- `GET /api/predictions/:id` - Get specific prediction
- `DELETE /api/predictions/:id` - Delete prediction
- `GET /api/predictions/stats/overview` - Get prediction statistics

### Image Analysis
- `POST /api/images/analyze` - Analyze crop image
- `GET /api/images/history` - Get analysis history
- `GET /api/images/:id` - Get specific analysis
- `DELETE /api/images/:id` - Delete analysis
- `GET /api/images/stats/overview` - Get analysis statistics

### Market Intelligence
- `GET /api/market/prices` - Get market prices
- `GET /api/market/trends` - Get market trends
- `GET /api/market/demand-forecast` - Get demand forecast
- `GET /api/market/weather-impact` - Get weather impact

### NLP & Localization
- `GET /api/nlp/languages` - Get supported languages
- `POST /api/nlp/translate` - Translate text
- `POST /api/nlp/local-recommendations` - Translate recommendations
- `GET /api/nlp/crop-info/:crop/:language` - Get localized crop info

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/profile` - Delete user account
- `GET /api/users/stats` - Get user statistics

## 🤖 Machine Learning Integration

### Adding Your Trained Model

1. **Place your model file** in the `owner/ml_models/` directory
2. **Update the model path** in your `.env` file
3. **Modify the prediction script** (`owner/scripts/predict_crop.py`) to load your model
4. **Test the integration** using the prediction API

### Model Requirements
- **Format**: Pickle (.pkl) file
- **Input Features**: nitrogen, phosphorus, potassium, temperature, humidity, pH, rainfall, soil_type
- **Output**: Crop recommendations with confidence scores

### Example Model Integration
```python
import pickle
import numpy as np

def load_model():
    with open('path/to/your/model.pkl', 'rb') as f:
        model = pickle.load(f)
    return model

def predict_crop(features):
    model = load_model()
    prediction = model.predict(features)
    confidence = model.predict_proba(features)
    return prediction, confidence
```

## 🌐 Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy the build folder
```

### Backend Deployment (Heroku/Railway)
```bash
cd owner
# Set environment variables in your hosting platform
# Deploy the owner folder
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use production MongoDB URI
- Configure production Cloudinary credentials
- Set secure JWT secrets
- Configure CORS for production domain

## 🧪 Testing

### Backend Testing
```bash
cd owner
npm test
```

### Frontend Testing
```bash
cd client
npm test
```

## 📱 Mobile Responsiveness

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones
- Various screen sizes and orientations

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for password security
- **Input Validation**: Comprehensive input validation and sanitization
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Cross-origin resource sharing protection
- **Helmet Security**: Security headers with Helmet.js
- **Data Encryption**: Sensitive data encryption

## 🌍 Localization Support

### Supported Languages
- English (en)
- Hindi (hi)
- Tamil (ta)
- Telugu (te)
- Bengali (bn)
- Gujarati (gu)
- Marathi (mr)
- Kannada (kn)
- Malayalam (ml)
- Punjabi (pa)

### Adding New Languages
1. Update the language mapping in `client/src/contexts/LanguageContext.js`
2. Add translations in `owner/routes/nlp.js`
3. Update the language selector in the UI

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 SIH Hackathon

This project was developed for the Smart India Hackathon (SIH) 2024. It demonstrates the integration of:
- Machine Learning and AI
- Modern Web Technologies
- Agricultural Domain Knowledge
- User Experience Design
- Scalable Architecture

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🙏 Acknowledgments

- SmartFarm.ch for UI/UX inspiration
- SIH Hackathon organizers
- Open source community
- Agricultural experts and farmers who provided domain knowledge

---

**Built with ❤️ for the Smart India Hackathon 2024**

*Empowering farmers with AI-driven agricultural insights*
