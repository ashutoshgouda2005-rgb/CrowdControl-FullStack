# CrowdControl Web Application Setup

A modern crowd control and stampede detection system with Django + DRF backend and Vite + React + Tailwind frontend.

## 🚀 Features

- **Live Video Streaming**: Real-time crowd analysis using webcam
- **Photo/Video Upload**: Upload and analyze media files for crowd detection
- **ML-Powered Analysis**: Uses existing TensorFlow model for stampede prediction
- **Real-time Alerts**: WebSocket-based notifications for stampede risks
- **JWT Authentication**: Secure user authentication
- **Modern UI**: Beautiful, responsive interface with Tailwind CSS

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Git

## 🛠️ Backend Setup (Django + DRF)

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Create and activate virtual environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 4. Setup PostgreSQL Database
Create a PostgreSQL database and user:
```sql
CREATE DATABASE crowdcontrol_db;
CREATE USER crowdcontrol_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE crowdcontrol_db TO crowdcontrol_user;
```

### 5. Configure Environment Variables
Create a `.env` file in the backend directory:
```env
DB_NAME=crowdcontrol_db
DB_USER=crowdcontrol_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=your-secret-key-here
DEBUG=True
```

### 6. Run Database Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 7. Create Superuser
```bash
python manage.py createsuperuser
```

### 8. Start Django Development Server
```bash
python manage.py runserver
```

The backend will be available at `http://127.0.0.1:8000`

## 🎨 Frontend Setup (Vite + React + Tailwind)

### 1. Navigate to frontend directory
```bash
cd frontend
```

### 2. Install Node.js dependencies
```bash
npm install
```

### 3. Configure Environment (Optional)
Create a `.env` file in the frontend directory:
```env
VITE_API_BASE=http://127.0.0.1:8000/api
```

### 4. Start Vite Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🔧 ML Model Setup

The application uses the existing TensorFlow model files:
- `stampede_model.ckpt.*` - Trained model files
- `haarcascade_frontalface_default.xml` - Face detection cascade

These files should be in the root directory (same level as backend/frontend folders).

## 📱 Usage

### 1. Authentication
- Navigate to `http://localhost:5173`
- Login with your superuser credentials
- Or create new users via Django admin at `http://127.0.0.1:8000/admin`

### 2. Upload Media
- Go to "Uploads" page
- Upload photos or videos
- View analysis results including crowd detection and stampede risk

### 3. Live Streaming
- Go to "Live Stream" page
- Create a new stream
- Start streaming to analyze live webcam feed
- Real-time analysis with alerts for stampede risks

## 🏗️ Architecture

### Backend (Django + DRF)
- **Models**: MediaUpload, LiveStream, AnalysisResult, Alert
- **API**: RESTful endpoints with JWT authentication
- **WebSockets**: Real-time updates using Django Channels
- **ML Integration**: TensorFlow model for crowd analysis

### Frontend (React + Vite + Tailwind)
- **Pages**: Login, Uploads, LiveStream
- **Components**: NavBar, reusable UI components
- **API Client**: Axios-based API integration
- **WebSocket**: Real-time updates for live streams

### Tech Stack
- **Backend**: Django 4.2, DRF, PostgreSQL, Channels, TensorFlow
- **Frontend**: React 18, Vite, Tailwind CSS, Axios
- **Authentication**: JWT tokens
- **Real-time**: WebSockets for live updates

## 🔍 API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `GET /api/auth/profile/` - Get user profile

### Media Uploads
- `POST /api/media/upload/` - Upload photo/video
- `GET /api/media/list/` - List user uploads
- `GET /api/media/{id}/` - Get upload details

### Live Streams
- `POST /api/streams/create/` - Create stream
- `GET /api/streams/list/` - List user streams
- `POST /api/streams/{id}/start/` - Start stream
- `POST /api/streams/{id}/stop/` - Stop stream
- `POST /api/analysis/frame/` - Analyze frame

### Analysis & Alerts
- `GET /api/analysis/results/` - Get analysis results
- `GET /api/alerts/` - Get alerts
- `POST /api/alerts/{id}/acknowledge/` - Acknowledge alert

## 🚨 WebSocket Endpoints

- `ws://127.0.0.1:8000/ws/stream/{stream_id}/` - Stream updates
- `ws://127.0.0.1:8000/ws/alerts/` - Alert notifications

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`

2. **ML Model Not Loading**
   - Verify model files are in the correct location
   - Check file permissions

3. **WebSocket Connection Failed**
   - Ensure Django Channels is properly configured
   - Check CORS settings

4. **Camera Access Denied**
   - Use HTTPS in production for camera access
   - Grant camera permissions in browser

### Development Tips

- Use `python manage.py shell` for Django debugging
- Check browser console for frontend errors
- Monitor Django logs for backend issues
- Use Django admin for data inspection

## 📦 Production Deployment

### Backend
1. Set `DEBUG=False` in settings
2. Configure proper database settings
3. Use Redis for Channels in production
4. Set up proper static file serving
5. Use WSGI/ASGI server like Gunicorn + Uvicorn

### Frontend
1. Build production assets: `npm run build`
2. Serve built files with nginx or similar
3. Configure proper API base URL

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.
