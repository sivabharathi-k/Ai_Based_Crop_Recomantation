# 🚀 CropAI Setup Guide

This guide will help you set up the CropAI platform on your local machine for development and testing.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download here](https://python.org/)
- **MongoDB** (v4.4 or higher) - [Download here](https://mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/)

### Optional but Recommended
- **MongoDB Compass** - GUI for MongoDB
- **Postman** - API testing
- **VS Code** - Code editor with extensions

## 🔧 Installation Steps

### Step 1: Clone the Repository
```bash
git clone <your-repository-url>
cd crop_predication
```

### Step 2: Install Dependencies
```bash
# Install all dependencies (root, backend, and frontend)
npm run install-all

# Or install manually:
npm install
cd owner && npm install
cd ../client && npm install
cd ..
```

### Step 3: Set Up MongoDB

#### Option A: Local MongoDB
1. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

2. Verify MongoDB is running:
   ```bash
   mongosh
   ```

#### Option B: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster
3. Get your connection string
4. Update the `MONGODB_URI` in your `.env` file

### Step 4: Configure Environment Variables

1. Copy the environment template:
   ```bash
   cp owner/env.example owner/.env
   ```

2. Edit the `.env` file with your configuration:
   ```bash
   nano owner/.env
   # or use your preferred editor
   ```

3. Update the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database - Update with your MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/crop_prediction
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/crop_prediction

# JWT Configuration - Generate a secure secret
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRE=7d

# Python ML Model Path
ML_MODEL_PATH=./ml_models/crop_recommendation_model.pkl
PYTHON_SCRIPT_PATH=./scripts/predict_crop.py

# Cloudinary Configuration (for image uploads)
# Sign up at https://cloudinary.com/ for free account
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# External APIs (Optional - for enhanced features)
WEATHER_API_KEY=your_weather_api_key
MARKET_API_KEY=your_market_api_key

# CORS
FRONTEND_URL=http://localhost:3000
```

### Step 5: Set Up Cloudinary (for Image Uploads)

1. Create a free account at [Cloudinary](https://cloudinary.com/)
2. Get your credentials from the dashboard
3. Update the Cloudinary variables in your `.env` file

### Step 6: Python Dependencies

The Python scripts require additional packages. Install them:

```bash
# Install Python dependencies
pip install scikit-learn numpy pandas pillow requests

# Or create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `requirements.txt` file in the `owner` directory:
```txt
scikit-learn>=1.0.0
numpy>=1.21.0
pandas>=1.3.0
Pillow>=8.0.0
requests>=2.25.0
```

### Step 7: Start the Application

#### Development Mode (Recommended)
```bash
# This starts both frontend and backend simultaneously
npm run dev
```

#### Manual Start (Alternative)
```bash
# Terminal 1 - Backend
cd owner
npm run dev

# Terminal 2 - Frontend
cd client
npm start
```

### Step 8: Verify Installation

1. **Backend Health Check**: Visit http://localhost:5000/api/health
   - Should return: `{"status":"success","message":"Crop Prediction API is running"}`

2. **Frontend**: Visit http://localhost:3000
   - Should show the CropAI homepage

3. **Database Connection**: Check the console for MongoDB connection message

## 🧪 Testing the Setup

### 1. Test User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "farmer"
  }'
```

### 2. Test User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Test Crop Prediction
```bash
curl -X POST http://localhost:5000/api/predictions/crop \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "nitrogen": 50,
    "phosphorus": 30,
    "potassium": 40,
    "temperature": 25,
    "humidity": 60,
    "ph": 6.5,
    "rainfall": 800,
    "soilType": "Loamy"
  }'
```

## 🔧 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure MongoDB is running and the connection string is correct.

#### 2. Python Script Error
```
Error: Python script failed
```
**Solution**: 
- Check Python version: `python --version`
- Install required packages: `pip install scikit-learn numpy pandas pillow requests`
- Verify Python path in the script

#### 3. Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution**: 
- Change the PORT in `.env` file
- Or kill the process using the port: `lsof -ti:5000 | xargs kill -9`

#### 4. CORS Error
```
Access to fetch at 'http://localhost:5000' from origin 'http://localhost:3000' has been blocked by CORS policy
```
**Solution**: Check that `FRONTEND_URL` in `.env` matches your frontend URL.

#### 5. Cloudinary Upload Error
```
Error: Cloudinary configuration missing
```
**Solution**: Ensure Cloudinary credentials are correctly set in `.env`.

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=*
```

### Logs Location
- Backend logs: Console output
- Frontend logs: Browser console
- MongoDB logs: Check MongoDB log files

## 📁 File Structure After Setup

```
crop_predication/
├── client/                 # React frontend
│   ├── node_modules/      # Frontend dependencies
│   ├── public/
│   ├── src/
│   └── package.json
├── owner/                 # Node.js backend
│   ├── node_modules/      # Backend dependencies
│   ├── .env              # Environment variables
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   └── package.json
├── ml_models/            # ML model files (create this)
├── node_modules/         # Root dependencies
├── package.json
├── README.md
└── SETUP.md
```

## 🚀 Next Steps

After successful setup:

1. **Explore the Application**: Navigate through all features
2. **Add Your ML Model**: Place your trained model in `ml_models/` directory
3. **Customize**: Modify the UI, add new features, or integrate additional APIs
4. **Test**: Run comprehensive tests on all features
5. **Deploy**: Follow deployment guide for production setup

## 📞 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Verify all environment variables are set correctly
4. Ensure all dependencies are installed
5. Check that all services (MongoDB, Node.js, Python) are running

## 🎯 Demo Credentials

For testing purposes, you can use these demo credentials:
- **Email**: demo@cropai.com
- **Password**: demo123
- **Role**: farmer

## 🔄 Updates and Maintenance

To update the application:

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm run install-all

# Restart the application
npm run dev
```

---

**Happy Coding! 🌱**

*If you need further assistance, please refer to the main README.md or create an issue in the repository.*
