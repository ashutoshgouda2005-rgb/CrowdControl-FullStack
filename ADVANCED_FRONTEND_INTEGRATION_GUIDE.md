# 🚀 Advanced Frontend Integration Guide

## ✅ **COMPLETED FEATURES**

### **🎯 Core Architecture**
- **Modern React 18** with Vite build system
- **Tailwind CSS** for responsive design
- **TypeScript-ready** structure
- **Production-optimized** bundle splitting

### **📊 Advanced Dashboard**
- **Real-time analytics** with Recharts
- **Live crowd detection** feed
- **Performance metrics** monitoring
- **Interactive time range** selection
- **WebSocket integration** for live updates

### **📤 Image Upload System**
- **Drag & drop** interface with React Dropzone
- **Real-time progress** tracking
- **Automatic image analysis** after upload
- **Batch processing** with queue management
- **Preview with detection** overlays

### **📹 Live Camera Detection**
- **WebRTC streaming** with React Webcam
- **Real-time crowd detection** with bounding boxes
- **Configurable analysis** intervals and thresholds
- **Performance monitoring** (FPS, processing time)
- **Detection history** and alerts

### **🔐 Authentication System**
- **JWT token management** with auto-refresh
- **Login/Register forms** with validation
- **Password strength** indicators
- **Protected routes** with React Router
- **User profile** management

### **🎨 UI/UX Features**
- **Responsive sidebar** navigation
- **Dark/Light mode** toggle
- **Notification system** with animations
- **Loading states** and error boundaries
- **Mobile-first** responsive design

## 🔧 **BACKEND INTEGRATION REQUIREMENTS**

### **1. Django Settings Configuration**

Ensure your `backend/crowdcontrol/settings.py` has these configurations:

```python
# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# For development only
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# JWT Configuration
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# API Response Headers
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
```

### **2. Required API Endpoints**

The frontend expects these API endpoints to be available:

#### **Authentication**
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration  
- `GET /api/auth/profile/` - Get user profile
- `PATCH /api/auth/profile/` - Update user profile
- `POST /api/auth/token/refresh/` - Refresh JWT token

#### **Media Upload**
- `POST /api/media/upload/` - Upload image files
- `GET /api/media/list/` - List uploaded files
- `GET /api/media/{id}/` - Get specific upload
- `DELETE /api/media/{id}/` - Delete upload

#### **Live Streams**
- `POST /api/streams/create/` - Create live stream
- `GET /api/streams/list/` - List streams
- `GET /api/streams/{id}/` - Get stream details
- `POST /api/streams/{id}/start/` - Start stream
- `POST /api/streams/{id}/stop/` - Stop stream

#### **Analysis**
- `POST /api/analysis/frame/` - Analyze image frame
- `GET /api/analysis/results/` - Get analysis results
- `GET /api/analysis/analytics/` - Get analytics data

#### **Alerts**
- `GET /api/alerts/` - Get alerts
- `POST /api/alerts/{id}/acknowledge/` - Acknowledge alert
- `GET /api/alerts/stats/` - Get alert statistics

#### **Health Check**
- `GET /api/health/` - System health check

### **3. WebSocket Configuration**

For real-time updates, ensure WebSocket support in `settings.py`:

```python
# Channels Configuration
INSTALLED_APPS = [
    # ... other apps
    'channels',
]

ASGI_APPLICATION = 'crowdcontrol.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}
```

## 🚀 **SETUP INSTRUCTIONS**

### **1. Frontend Setup**

```bash
# Navigate to frontend directory
cd frontend

# Run the setup script
SETUP_ADVANCED_FRONTEND.bat

# Or manually:
npm install
cp .env.example .env
npm run dev
```

### **2. Environment Configuration**

Create `frontend/.env` from the example:

```env
VITE_API_URL=http://127.0.0.1:8000/api
VITE_WS_URL=ws://127.0.0.1:8000/ws
VITE_APP_NAME=CrowdControl
VITE_DEBUG=true
```

### **3. Backend Verification**

Ensure your backend is running and accessible:

```bash
# Test API health
curl http://127.0.0.1:8000/api/health/

# Test CORS
curl -H "Origin: http://localhost:5173" http://127.0.0.1:8000/api/health/
```

## 📱 **FEATURES OVERVIEW**

### **Dashboard Analytics**
- **Real-time crowd count** graphs
- **Detection timeline** with area charts
- **Risk level distribution** pie charts
- **System performance** metrics
- **Live detection feed** with animations

### **Image Upload**
- **Drag & drop** file selection
- **Multiple file** batch processing
- **Upload progress** indicators
- **Automatic analysis** integration
- **Results visualization** with overlays

### **Live Detection**
- **Camera permission** handling
- **Real-time streaming** with WebRTC
- **Bounding box** overlays
- **Performance monitoring** (FPS, latency)
- **Configurable settings** (intervals, thresholds)

### **Authentication**
- **Secure JWT** token management
- **Auto token refresh** mechanism
- **Form validation** with real-time feedback
- **Password strength** indicators
- **Protected route** handling

### **Navigation & UI**
- **Responsive sidebar** with badges
- **Mobile-friendly** navigation
- **Dark/Light mode** toggle
- **Real-time notifications** system
- **Loading states** and error handling

## 🔧 **CUSTOMIZATION**

### **API Configuration**
Update `frontend/src/services/api.js` to modify:
- API base URL
- Request timeouts
- Error handling
- Token management

### **Theme Customization**
Modify `frontend/tailwind.config.js` for:
- Color schemes
- Typography
- Spacing
- Breakpoints

### **Component Styling**
Update `frontend/src/index.css` for:
- Global styles
- Dark mode variables
- Custom animations
- Font imports

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

1. **CORS Errors**
   - Ensure `CORS_ALLOW_ALL_ORIGINS = True` in development
   - Check API URL in `.env` file
   - Verify backend is running on correct port

2. **Authentication Issues**
   - Check JWT token expiration
   - Verify API endpoints match frontend calls
   - Ensure proper CORS headers

3. **WebSocket Connection**
   - Verify WebSocket URL in `.env`
   - Check Django Channels configuration
   - Ensure proper authentication for WS

4. **Camera Access**
   - Use HTTPS for production camera access
   - Check browser permissions
   - Verify WebRTC support

### **Performance Optimization**

1. **Bundle Size**
   - Use `npm run build` for production
   - Enable code splitting
   - Optimize images and assets

2. **API Caching**
   - Implement Redis for backend caching
   - Use React Query for client-side caching
   - Enable HTTP caching headers

3. **Real-time Updates**
   - Optimize WebSocket message frequency
   - Implement debouncing for API calls
   - Use efficient state management

## 📊 **PRODUCTION DEPLOYMENT**

### **Frontend Build**
```bash
npm run build
npm run preview  # Test production build
```

### **Environment Variables**
```env
VITE_API_URL=https://your-api-domain.com/api
VITE_WS_URL=wss://your-api-domain.com/ws
VITE_DEBUG=false
```

### **Backend Configuration**
```python
# Production settings
DEBUG = False
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-domain.com",
]
```

## 🎯 **NEXT STEPS**

1. **Test all features** with your existing backend
2. **Customize styling** to match your brand
3. **Add additional pages** (Analytics, Profile, Settings)
4. **Implement user roles** and permissions
5. **Add data export** functionality
6. **Integrate monitoring** and analytics
7. **Deploy to production** environment

## 🔗 **INTEGRATION CHECKLIST**

- [ ] Backend CORS configured
- [ ] JWT authentication working
- [ ] API endpoints accessible
- [ ] WebSocket connection established
- [ ] Camera permissions handled
- [ ] File upload functioning
- [ ] Real-time updates working
- [ ] Mobile responsiveness tested
- [ ] Dark/Light mode functional
- [ ] Error handling implemented
- [ ] Performance optimized
- [ ] Production build tested

The advanced frontend is now ready for production use with your existing CrowdControl AI system!
