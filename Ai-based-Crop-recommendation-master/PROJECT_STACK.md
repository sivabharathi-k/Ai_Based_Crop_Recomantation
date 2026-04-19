# Project Overview: Crop Prediction Platform

This project is a full-stack crop prediction platform designed for smart agriculture. It leverages machine learning, a modern web frontend, and a robust backend to deliver crop recommendations and analysis.

---

## Tech Stack & Resources

### 1. **Frontend**
- **Framework:** React.js
- **Styling:** Tailwind CSS
- **State Management:** React Context API
- **HTTP Client:** Axios
- **Location:** `client/`
  - Main entry: `client/src/App.js`
  - API services: `client/src/services/api.js`
  - Pages: `client/src/pages/`
  - Components: `client/src/components/`

### 2. **Backend**
- **Runtime:** Node.js
- **Framework:** Express.js
- **Authentication:** JWT (JSON Web Token)
- **Database:** (Assumed MongoDB, based on common stack, check `config/database.js`)
- **Python Integration:** `python-shell` (to run ML scripts)
- **Location:** `owner/`
  - Server entry: `owner/server.js`
  - Routes: `owner/routes/`
  - Middleware: `owner/middleware/`
  - Models: `owner/models/`
  - Config: `owner/config/`
  - Scripts: `owner/scripts/`

### 3. **Machine Learning**
- **Language:** Python
- **Libraries:** joblib, scikit-learn (assumed from `.joblib` files)
- **Model Artifacts:**
  - `ml_train/crop_model.joblib`
  - `ml_train/scaler.joblib`
  - `ml_train/label_encoder.joblib`
- **Prediction Script:** `owner/scripts/predict_crop.py`
- **Image Analysis Script:** `owner/scripts/analyze_image.py`

### 4. **Deployment & DevOps**
- **Version Control:** Git, GitHub
- **Environment Variables:** `.env` (see `owner/env.example`)
- **Package Management:** npm (Node), pip (Python)
- **Documentation:** `README.md`, `SETUP.md`, `DEPLOYMENT.md`

---

## How It Works
- **Frontend** sends crop data to the backend via REST API.
- **Backend** authenticates the user, saves the request, and calls the Python ML script for prediction.
- **ML Script** loads the trained model and returns the prediction to the backend.
- **Backend** sends the prediction result back to the frontend for display.

---

## Key Resources
- `client/` - React frontend
- `owner/` - Node.js backend
- `ml_train/` - ML model files
- `owner/scripts/` - Python scripts for ML
- `README.md`, `SETUP.md`, `DEPLOYMENT.md` - Documentation

---

## Example API Usage
POST `/api/predictions/crop`
```json
{
  "N": 90,
  "P": 42,
  "K": 43,
  "temperature": 22,
  "humidity": 80,
  "ph": 6.5,
  "rainfall": 120
}
```

---

## Contributors
- Dhruv Andhariya (and team)

---

This file can be used as a quick reference to explain your project and its stack at a hackathon.
