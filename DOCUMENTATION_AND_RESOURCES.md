# 📚 CrowdControl: Documentation & Resources

**Complete Installation, Setup, and Usage Guide**

---

## 🚀 **Quick Start Installation**

### **Prerequisites**
- **Python 3.11+** with pip
- **Node.js 18+** with npm
- **Git** for version control
- **Windows 10/11** (Linux/Mac support available)

### **One-Click Setup**
```bash
# Clone the repository
git clone https://github.com/your-org/crowdcontrol.git
cd crowdcontrol

# Run the automated setup
START_EVERYTHING.bat
```

---

## 🔧 **Detailed Installation Guide**

### **Backend Setup (Django + AI Models)**

#### **1. Environment Setup**
```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate.bat

# Install dependencies
pip install -r backend/requirements.txt
```

#### **2. Database Configuration**
```bash
# Navigate to backend
cd backend

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load sample data (optional)
python manage.py loaddata fixtures/sample_data.json
```

#### **3. AI Model Setup**
```bash
# Download pre-trained models
python manage.py download_models

# Test model loading
python manage.py test_ai_models
```

### **Frontend Setup (React + Vite)**

#### **1. Dependencies Installation**
```bash
# Navigate to frontend
cd frontend

# Install packages
npm install

# Install additional mobile dependencies
npm install @capacitor/core @capacitor/ios @capacitor/android
```

#### **2. Configuration**
```bash
# Copy environment template
cp .env.example .env.local

# Edit configuration (optional)
# VITE_API_URL=http://localhost:8000
# VITE_WS_URL=ws://localhost:8000
```

---

## 📱 **Mobile Setup Guide**

### **Universal Device Access**
```bash
# Start servers with network access
START_UNIVERSAL_ACCESS.bat

# Or manually:
# Backend: python manage.py runserver 0.0.0.0:8000
# Frontend: npm run dev -- --host 0.0.0.0 --port 5174
```

### **PWA Installation**
1. **Open site on mobile browser**
2. **Tap browser menu** (three dots)
3. **Select "Add to Home Screen"**
4. **Confirm installation**
5. **Launch from home screen** for app-like experience

---

## 📦 **Downloadable Resources**

### **Source Code**
- **Main Repository**: [GitHub - CrowdControl](https://github.com/your-org/crowdcontrol)
- **Release Packages**: [Latest Releases](https://github.com/your-org/crowdcontrol/releases)
- **Docker Images**: `docker pull crowdcontrol/app:latest`

### **Pre-trained AI Models**
- **Crowd Detection Model**: [Download (245MB)](https://models.crowdcontrol.ai/crowd-detection-v2.1.h5)
- **Stampede Risk Model**: [Download (189MB)](https://models.crowdcontrol.ai/stampede-risk-v1.3.h5)
- **Person Tracking Model**: [Download (156MB)](https://models.crowdcontrol.ai/person-tracking-v1.8.h5)
- **Model Documentation**: [AI Models Guide](https://docs.crowdcontrol.ai/models)

### **Sample Datasets**
- **Training Dataset**: [Crowd Scenarios (2.1GB)](https://datasets.crowdcontrol.ai/training-v2.zip)
- **Test Videos**: [Sample Footage (450MB)](https://datasets.crowdcontrol.ai/test-videos.zip)
- **Benchmark Data**: [Performance Tests (89MB)](https://datasets.crowdcontrol.ai/benchmarks.zip)

---

## 🔌 **API Reference**

### **Authentication Endpoints**
```http
POST /api/auth/login/
POST /api/auth/register/
POST /api/auth/refresh/
POST /api/auth/logout/
```

### **Stream Management**
```http
GET    /api/streams/                 # List all streams
POST   /api/streams/                 # Create new stream
GET    /api/streams/{id}/            # Get stream details
PUT    /api/streams/{id}/            # Update stream
DELETE /api/streams/{id}/            # Delete stream
POST   /api/streams/{id}/start/      # Start detection
POST   /api/streams/{id}/stop/       # Stop detection
```

### **Detection & Analytics**
```http
GET /api/detections/                 # Get detection history
GET /api/analytics/crowd-density/    # Crowd density data
GET /api/analytics/risk-assessment/  # Risk analysis
GET /api/alerts/                     # Alert history
POST /api/alerts/test/               # Test alert system
```

### **WebSocket Endpoints**
```javascript
// Real-time updates
ws://localhost:8000/ws/streams/{stream_id}/

// Global notifications
ws://localhost:8000/ws/notifications/

// System status
ws://localhost:8000/ws/system/
```

---

## 👨‍💻 **Developer Guides**

### **Custom Model Integration**
```python
# backend/ai/custom_model.py
from ai.base_model import BaseDetectionModel

class CustomCrowdModel(BaseDetectionModel):
    def __init__(self):
        super().__init__()
        self.model_path = "path/to/your/model.h5"
    
    def detect(self, frame):
        # Your detection logic here
        return detection_results
```

### **Frontend Component Development**
```jsx
// frontend/src/components/CustomDetector.jsx
import React from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

export default function CustomDetector({ streamId }) {
    const { data, isConnected } = useWebSocket(`/ws/streams/${streamId}/`);
    
    return (
        <div className="detector-container">
            {/* Your custom UI here */}
        </div>
    );
}
```

### **Plugin Development**
```python
# backend/plugins/custom_alert.py
from plugins.base import BaseAlertPlugin

class CustomAlertPlugin(BaseAlertPlugin):
    def send_alert(self, alert_data):
        # Custom alert logic (Slack, Discord, etc.)
        pass
```

---

## 🔧 **Configuration Guide**

### **Environment Variables**
```bash
# Backend (.env)
DEBUG=False
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost/crowdcontrol
REDIS_URL=redis://localhost:6379
AI_MODEL_PATH=/path/to/models/
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Frontend (.env.local)
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_ENABLE_PWA=true
VITE_SENTRY_DSN=your-sentry-dsn
```

### **Advanced Configuration**
```python
# backend/settings/production.py
ALLOWED_HOSTS = ['your-domain.com', 'api.crowdcontrol.ai']
CORS_ALLOWED_ORIGINS = ['https://your-frontend.com']

# AI Model Settings
AI_MODELS = {
    'crowd_detection': {
        'model_path': 'models/crowd_detection_v2.h5',
        'confidence_threshold': 0.7,
        'batch_size': 8,
    },
    'stampede_risk': {
        'model_path': 'models/stampede_risk_v1.h5',
        'risk_threshold': 0.8,
        'update_interval': 5,  # seconds
    }
}
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

#### **"Site can't be reached" on mobile**
```bash
# Solution 1: Check firewall
netsh advfirewall set allprofiles state off  # Temporarily
# Test access, then turn firewall back on

# Solution 2: Verify network binding
python manage.py runserver 0.0.0.0:8000
npm run dev -- --host 0.0.0.0 --port 5174

# Solution 3: Check same Wi-Fi network
ipconfig  # Note your IP address
# Use http://YOUR_IP:5174 on mobile
```

#### **AI Models not loading**
```bash
# Download models manually
python manage.py download_models --force

# Check model paths
python manage.py check_models

# Test with demo mode
python manage.py runserver --demo-mode
```

#### **WebSocket connection failed**
```bash
# Check Redis server
redis-cli ping

# Verify channels configuration
python manage.py shell
>>> from channels.layers import get_channel_layer
>>> channel_layer = get_channel_layer()
>>> channel_layer
```

---

## 📖 **Usage Examples**

### **Basic Stream Setup**
```python
# Create a new detection stream
import requests

response = requests.post('http://localhost:8000/api/streams/', {
    'name': 'Main Entrance Camera',
    'source_url': 'rtmp://camera-ip/stream',
    'detection_enabled': True,
    'alert_threshold': 0.8
})
```

### **Real-time Monitoring**
```javascript
// Connect to WebSocket for live updates
const ws = new WebSocket('ws://localhost:8000/ws/streams/1/');

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Detection update:', data);
    
    if (data.risk_level > 0.8) {
        showAlert('High crowd risk detected!');
    }
};
```

---

## 🎓 **Training & Tutorials**

### **Video Tutorials**
- **[Getting Started (10 min)](https://youtube.com/watch?v=example1)** - Basic setup and first detection
- **[Advanced Configuration (15 min)](https://youtube.com/watch?v=example2)** - Custom models and alerts
- **[Mobile Deployment (8 min)](https://youtube.com/watch?v=example3)** - PWA installation and usage

### **Interactive Guides**
- **[Interactive Setup Wizard](https://setup.crowdcontrol.ai)** - Step-by-step guided installation
- **[API Playground](https://api.crowdcontrol.ai/playground)** - Test API endpoints interactively
- **[Model Training Lab](https://lab.crowdcontrol.ai)** - Train custom detection models

---

## 📞 **Support Resources**

### **Community Support**
- **[GitHub Discussions](https://github.com/your-org/crowdcontrol/discussions)** - Community Q&A
- **[Discord Server](https://discord.gg/crowdcontrol)** - Real-time chat support
- **[Stack Overflow](https://stackoverflow.com/questions/tagged/crowdcontrol)** - Technical questions

### **📞 Professional Support**
- **Email**: ashutoshgouda2005@gmail.com
- **Phone/WhatsApp**: +91 8456949047
- **Developer**: Ashutosh Gouda

---

*This documentation is continuously updated. For the latest information, visit [docs.crowdcontrol.ai](https://docs.crowdcontrol.ai)*
