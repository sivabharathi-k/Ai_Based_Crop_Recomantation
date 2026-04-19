# 🚀 CropAI Deployment Guide

This guide covers deploying the CropAI platform to various cloud platforms and hosting services.

## 🌐 Deployment Options

### Frontend Deployment
- **Vercel** (Recommended for React)
- **Netlify**
- **GitHub Pages**
- **AWS S3 + CloudFront**

### Backend Deployment
- **Railway** (Recommended for Node.js)
- **Heroku**
- **DigitalOcean App Platform**
- **AWS EC2**
- **Google Cloud Run**

### Database
- **MongoDB Atlas** (Recommended)
- **Railway MongoDB**
- **DigitalOcean Managed MongoDB**

## 🎯 Quick Deployment (Recommended)

### Frontend: Vercel + Backend: Railway

#### 1. Deploy Backend to Railway

1. **Create Railway Account**
   - Go to [Railway.app](https://railway.app/)
   - Sign up with GitHub

2. **Deploy Backend**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Navigate to backend directory
   cd owner
   
   # Deploy
   railway deploy
   ```

3. **Set Environment Variables in Railway**
   - Go to your project dashboard
   - Add the following variables:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crop_prediction
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   ```

#### 2. Deploy Frontend to Vercel

1. **Create Vercel Account**
   - Go to [Vercel.com](https://vercel.com/)
   - Sign up with GitHub

2. **Deploy Frontend**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Navigate to frontend directory
   cd client
   
   # Deploy
   vercel
   ```

3. **Set Environment Variables in Vercel**
   - Go to your project settings
   - Add the following variable:
   ```
   REACT_APP_API_URL=https://your-backend-domain.railway.app
   ```

4. **Update API Configuration**
   ```javascript
   // client/src/services/api.js
   const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
   ```

## 🔧 Detailed Deployment Steps

### Option 1: Heroku Deployment

#### Backend to Heroku

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Create Heroku App**
   ```bash
   cd owner
   heroku create your-app-name
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   heroku config:set CLOUDINARY_API_KEY=your_cloudinary_key
   heroku config:set CLOUDINARY_API_SECRET=your_cloudinary_secret
   heroku config:set FRONTEND_URL=https://your-frontend-domain.com
   ```

4. **Deploy**
   ```bash
   git subtree push --prefix owner heroku main
   ```

#### Frontend to Netlify

1. **Build Frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy to Netlify**
   - Go to [Netlify.com](https://netlify.com/)
   - Drag and drop the `build` folder
   - Or connect your GitHub repository

3. **Set Environment Variables**
   ```
   REACT_APP_API_URL=https://your-backend-domain.herokuapp.com
   ```

### Option 2: AWS Deployment

#### Backend to AWS EC2

1. **Launch EC2 Instance**
   - Choose Ubuntu 20.04 LTS
   - Configure security groups (ports 22, 80, 443, 5000)

2. **Connect and Setup**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Install Python
   sudo apt install python3 python3-pip -y
   ```

3. **Deploy Application**
   ```bash
   # Clone repository
   git clone your-repo-url
   cd crop_predication/owner
   
   # Install dependencies
   npm install
   
   # Install Python dependencies
   pip3 install -r requirements.txt
   
   # Set environment variables
   nano .env
   ```

4. **Start with PM2**
   ```bash
   pm2 start server.js --name "cropai-backend"
   pm2 startup
   pm2 save
   ```

#### Frontend to AWS S3 + CloudFront

1. **Build and Upload to S3**
   ```bash
   cd client
   npm run build
   aws s3 sync build/ s3://your-bucket-name
   ```

2. **Configure CloudFront**
   - Create CloudFront distribution
   - Set S3 bucket as origin
   - Configure custom domain (optional)

### Option 3: DigitalOcean App Platform

#### Deploy Both Frontend and Backend

1. **Create App Spec File**
   ```yaml
   # .do/app.yaml
   name: cropai
   services:
   - name: backend
     source_dir: /owner
     github:
       repo: your-username/your-repo
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
     - key: MONGODB_URI
       value: ${MONGODB_URI}
       type: SECRET
     - key: JWT_SECRET
       value: ${JWT_SECRET}
       type: SECRET
   
   - name: frontend
     source_dir: /client
     github:
       repo: your-username/your-repo
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: REACT_APP_API_URL
       value: ${BACKEND_URL}
   ```

2. **Deploy**
   ```bash
   doctl apps create --spec .do/app.yaml
   ```

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)

1. **Create Cluster**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Create a new cluster
   - Choose M0 (Free) tier for development

2. **Configure Access**
   - Create database user
   - Whitelist IP addresses (0.0.0.0/0 for all IPs)
   - Get connection string

3. **Connection String Format**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/crop_prediction?retryWrites=true&w=majority
   ```

### Railway MongoDB

1. **Add MongoDB Service**
   - In Railway dashboard
   - Click "New" → "Database" → "MongoDB"
   - Copy connection string

## 🔐 Environment Variables for Production

### Backend Variables
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crop_prediction
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRE=7d
ML_MODEL_PATH=./ml_models/crop_recommendation_model.pkl
PYTHON_SCRIPT_PATH=./scripts/predict_crop.py
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
WEATHER_API_KEY=your_weather_api_key
MARKET_API_KEY=your_market_api_key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend Variables
```env
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_ENVIRONMENT=production
```

## 🚀 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to Railway
      run: |
        npm install -g @railway/cli
        railway login --token ${{ secrets.RAILWAY_TOKEN }}
        cd owner
        railway deploy

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to Vercel
      run: |
        npm install -g vercel
        cd client
        vercel --token ${{ secrets.VERCEL_TOKEN }} --prod
```

## 📊 Monitoring and Logs

### Backend Monitoring

1. **Railway Logs**
   ```bash
   railway logs
   ```

2. **Heroku Logs**
   ```bash
   heroku logs --tail
   ```

3. **PM2 Monitoring**
   ```bash
   pm2 monit
   pm2 logs
   ```

### Frontend Monitoring

1. **Vercel Analytics**
   - Enable in Vercel dashboard
   - View performance metrics

2. **Error Tracking**
   - Integrate Sentry for error tracking
   - Monitor user experience

## 🔒 Security Considerations

### Production Security

1. **Environment Variables**
   - Never commit `.env` files
   - Use secure secret management
   - Rotate secrets regularly

2. **HTTPS**
   - Always use HTTPS in production
   - Configure SSL certificates
   - Use secure headers

3. **Rate Limiting**
   - Implement API rate limiting
   - Monitor for abuse
   - Use CDN for DDoS protection

4. **Database Security**
   - Use strong passwords
   - Enable IP whitelisting
   - Regular backups

## 🧪 Testing in Production

### Health Checks

1. **Backend Health**
   ```bash
   curl https://your-backend-domain.com/api/health
   ```

2. **Frontend Health**
   ```bash
   curl https://your-frontend-domain.com
   ```

### API Testing

```bash
# Test registration
curl -X POST https://your-backend-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'

# Test prediction
curl -X POST https://your-backend-domain.com/api/predictions/crop \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"nitrogen":50,"phosphorus":30,"potassium":40,"temperature":25,"humidity":60,"ph":6.5,"rainfall":800,"soilType":"Loamy"}'
```

## 📈 Performance Optimization

### Backend Optimization

1. **Enable Compression**
   ```javascript
   app.use(compression());
   ```

2. **Database Indexing**
   ```javascript
   // Add indexes in MongoDB
   db.predictions.createIndex({ user: 1, createdAt: -1 })
   ```

3. **Caching**
   ```javascript
   // Implement Redis caching
   const redis = require('redis');
   const client = redis.createClient();
   ```

### Frontend Optimization

1. **Code Splitting**
   ```javascript
   const LazyComponent = React.lazy(() => import('./Component'));
   ```

2. **Image Optimization**
   - Use WebP format
   - Implement lazy loading
   - Optimize image sizes

3. **Bundle Analysis**
   ```bash
   npm install -g webpack-bundle-analyzer
   npm run build
   webpack-bundle-analyzer build/static/js/*.js
   ```

## 🔄 Backup and Recovery

### Database Backup

1. **MongoDB Atlas Backup**
   - Enable automatic backups
   - Test restore procedures

2. **Manual Backup**
   ```bash
   mongodump --uri="mongodb+srv://..." --out=backup/
   ```

### Application Backup

1. **Code Backup**
   - Use Git for version control
   - Tag releases
   - Maintain multiple branches

2. **Configuration Backup**
   - Document all environment variables
   - Backup configuration files
   - Maintain deployment scripts

## 📞 Support and Maintenance

### Monitoring Setup

1. **Uptime Monitoring**
   - Use UptimeRobot or Pingdom
   - Set up alerts for downtime

2. **Error Monitoring**
   - Integrate Sentry
   - Monitor application errors

3. **Performance Monitoring**
   - Use New Relic or DataDog
   - Monitor response times

### Maintenance Tasks

1. **Regular Updates**
   - Update dependencies monthly
   - Security patches immediately
   - Monitor for vulnerabilities

2. **Database Maintenance**
   - Regular backups
   - Index optimization
   - Query performance monitoring

---

**Deployment Complete! 🎉**

*Your CropAI platform is now live and ready to help farmers make data-driven decisions.*
