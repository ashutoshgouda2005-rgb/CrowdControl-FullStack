# 🚀 Django Backend Deployment Guide

## ✅ Backend Deployment Ready!

Your Django backend is now configured for production deployment with the following files:

### 📦 Deployment Files Created:
- ✅ `backend/Procfile` - Process configuration for Heroku/Railway
- ✅ `backend/runtime.txt` - Python version specification
- ✅ `backend/requirements.txt` - Updated with production dependencies
- ✅ `backend/railway.toml` - Railway-specific configuration
- ✅ `backend/deploy.bat` - Automated deployment script

### 🔧 Production Dependencies Added:
- `gunicorn==21.2.0` - WSGI HTTP Server
- `whitenoise==6.6.0` - Static file serving
- `dj-database-url==2.1.0` - Database URL parsing

### ⚙️ Settings Updated:
- Environment variable support for SECRET_KEY, DEBUG
- Production-ready ALLOWED_HOSTS
- Database configuration with dj-database-url
- WhiteNoise middleware for static files
- CORS settings for frontend integration

## 🌐 Deployment Options

### Option 1: Railway (Recommended)

#### Quick Deploy:
```bash
cd backend
# Run the deployment script
deploy.bat
```

#### Manual Deploy:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Navigate to backend
cd backend

# Login and deploy
railway login
railway init
railway up
```

#### Environment Variables (Set in Railway Dashboard):
```
SECRET_KEY=your-super-secret-key-here
DEBUG=False
DATABASE_URL=postgresql://... (Railway provides this automatically)
```

### Option 2: Heroku

```bash
cd backend

# Install Heroku CLI first
# Login
heroku login

# Create app
heroku create crowdcontrol-backend

# Set environment variables
heroku config:set SECRET_KEY=your-secret-key
heroku config:set DEBUG=False

# Deploy
git init
git add .
git commit -m "Initial commit"
heroku git:remote -a crowdcontrol-backend
git push heroku main

# Run migrations
heroku run python manage.py migrate
heroku run python manage.py createsuperuser
```

### Option 3: Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `gunicorn crowdcontrol.wsgi`
5. Add environment variables in Render dashboard

## 📋 Post-Deployment Steps

### 1. Set Environment Variables
```
SECRET_KEY=your-super-secret-key-generate-new-one
DEBUG=False
DATABASE_URL=postgresql://... (provided by hosting service)
```

### 2. Run Database Migrations
```bash
# Railway
railway run python manage.py migrate

# Heroku  
heroku run python manage.py migrate

# Render (via dashboard or CLI)
```

### 3. Create Superuser
```bash
# Railway
railway run python manage.py createsuperuser

# Heroku
heroku run python manage.py createsuperuser
```

### 4. Update Frontend API URL
Update `frontend/.env.production`:
```
VITE_API_BASE=https://your-backend-url.railway.app/api
```

Then rebuild frontend:
```bash
cd frontend
npm run build
```

## 🔗 API Endpoints

Once deployed, your API will be available at:
- `https://your-app.railway.app/api/auth/login/`
- `https://your-app.railway.app/api/media/upload/`
- `https://your-app.railway.app/api/streams/create/`
- `https://your-app.railway.app/admin/` (Django admin)

## 🚨 Important Notes

### Database
- Railway/Heroku provide PostgreSQL automatically
- Database URL is set via environment variable
- Migrations run automatically on Railway

### Static Files
- WhiteNoise serves static files in production
- No separate CDN needed for basic deployment

### ML Models
- Large model files (*.ckpt, *.xml) excluded from deployment
- Consider using cloud storage (AWS S3, Google Cloud) for models
- Update `ml_predictor.py` to load models from cloud storage

### Security
- Generate a strong SECRET_KEY for production
- Set DEBUG=False in production
- Use environment variables for sensitive data

## 🔧 Troubleshooting

### Common Issues:

1. **Build Fails**: Check requirements.txt for version conflicts
2. **Database Connection**: Verify DATABASE_URL environment variable
3. **Static Files**: Ensure WhiteNoise is in MIDDLEWARE
4. **CORS Errors**: Update CORS_ALLOWED_ORIGINS with frontend URL

### Logs:
```bash
# Railway
railway logs

# Heroku
heroku logs --tail
```

## 🎯 Next Steps

1. **Deploy Backend**: Choose Railway, Heroku, or Render
2. **Set Environment Variables**: SECRET_KEY, DEBUG=False
3. **Run Migrations**: Set up database tables
4. **Create Superuser**: For admin access
5. **Update Frontend**: Set production API URL
6. **Test Integration**: Verify frontend-backend communication

Your Django backend is now production-ready! 🚀
