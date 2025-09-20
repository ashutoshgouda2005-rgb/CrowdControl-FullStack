# 🚀 CrowdControl: Quick Start Guide

**Get your AI-powered stampede detection system running in 5 minutes!**

---

## 🎯 **What You Get**

✅ **Real-time crowd monitoring** with AI analysis  
✅ **Stampede risk detection** with instant alerts  
✅ **File upload analysis** for photos and videos  
✅ **Live camera streaming** with crowd counting  
✅ **Mobile-friendly interface** works on any device  
✅ **Professional dashboard** with detailed analytics  

---

## ⚡ **Quick Start (3 Steps)**

### **Step 1: Test Your System** 
```bash
# Run the system test (takes 2 minutes)
TEST_SYSTEM.bat
```
**What it does**: Checks Python, Node.js, installs dependencies, tests database

### **Step 2: Start the Application**
```bash
# Launch both frontend and backend servers
START_UNIVERSAL_ACCESS.bat
```
**What it does**: Starts Django backend + React frontend with universal access

### **Step 3: Access Your Site**
- **On your computer**: http://localhost:5174
- **On phone/tablet**: http://192.168.1.26:5174
- **Admin panel**: http://localhost:8000/admin (admin/admin123)

---

## 📱 **Using the System**

### **1. Create Your Account**
1. Open the site in your browser
2. Click "Register" 
3. Fill in your details
4. Login with your credentials

### **2. Upload Files for Analysis**
1. Go to "Uploads" page
2. Select a photo or video file
3. Add description (optional)
4. Click "Upload & Analyze"
5. **Result**: Get AI analysis with crowd count and risk assessment

### **3. Live Streaming Analysis**
1. Go to "Live Stream" page
2. Click "Create New Stream"
3. Enter a stream name
4. Click "Start Stream" 
5. Allow camera access
6. **Result**: Real-time AI analysis with stampede risk alerts

---

## 🚨 **Understanding AI Alerts**

### **Status Indicators**
- **✅ NORMAL CONDITIONS**: Safe crowd levels
- **⚠️ CROWD DETECTED**: Monitor the situation  
- **🚨 STAMPEDE RISK DETECTED**: Take immediate action!

### **What the AI Analyzes**
- **People Count**: Number of individuals detected
- **Crowd Density**: How packed the area is
- **Movement Patterns**: Unusual crowd behavior
- **Risk Factors**: Multiple indicators combined

### **Alert Actions**
When you see **🚨 STAMPEDE RISK**:
1. Alert security personnel immediately
2. Activate crowd control measures
3. Monitor exit routes
4. Consider area evacuation if needed

---

## 🔧 **Troubleshooting**

### **Common Issues & Solutions**

#### **"Upload Failed" Error**
- **Check**: File size under 50MB
- **Check**: Supported formats (JPG, PNG, MP4, AVI)
- **Fix**: Try smaller file or different format

#### **Camera Not Working**
- **Check**: Browser permissions for camera access
- **Check**: Camera not used by other applications
- **Fix**: Refresh page and allow camera access

#### **Site Not Loading**
- **Check**: Both servers are running (green text in terminal)
- **Check**: No firewall blocking ports 5174 and 8000
- **Fix**: Restart START_UNIVERSAL_ACCESS.bat

#### **Mobile Access Issues**
- **Check**: Phone/tablet on same Wi-Fi network
- **Check**: Use IP address: http://192.168.1.26:5174
- **Fix**: Check Windows Firewall settings

---

## 📊 **Features Overview**

### **Dashboard Features**
- **Live monitoring** with real-time updates
- **Historical analysis** of past detections
- **Alert management** with acknowledgment system
- **User management** with role-based access
- **System health** monitoring and status

### **AI Capabilities**
- **Face detection** for people counting
- **Crowd density** analysis
- **Movement pattern** recognition
- **Risk assessment** with multiple factors
- **Real-time processing** under 3 seconds

### **Mobile Features**
- **Responsive design** for all screen sizes
- **Touch-friendly** controls and navigation
- **Camera access** for mobile streaming
- **Push notifications** for critical alerts
- **Offline capability** for basic functions

---

## 🌐 **Access URLs Reference**

### **Development URLs**
```
Frontend (Main App):     http://localhost:5174
Backend API:             http://localhost:8000  
Admin Panel:             http://localhost:8000/admin
API Health Check:        http://localhost:8000/api/health/
```

### **Network Access URLs**
```
Frontend (Universal):    http://192.168.1.26:5174
Backend API:             http://192.168.1.26:8000
Admin Panel:             http://192.168.1.26:8000/admin
```

### **Default Login**
```
Admin Username: admin
Admin Password: admin123
```

---

## 📞 **Support & Contact**

### **Developer Support**
**Name**: Ashutosh Gouda  
**Email**: ashutoshgouda2005@gmail.com  
**Phone**: +91 8456949047  
**WhatsApp**: +91 8456949047  

### **Available Support**
- ✅ Technical troubleshooting
- ✅ Feature requests and customization  
- ✅ Installation and setup assistance
- ✅ Performance optimization
- ✅ Integration with existing systems

### **Response Times**
- **WhatsApp**: Same day response
- **Email**: Within 24 hours  
- **Phone**: Immediate during available hours

---

## 🎯 **Next Steps**

### **For Testing**
1. Upload sample photos with crowds
2. Test live streaming with your camera
3. Try accessing from your phone
4. Check admin panel features

### **For Production Use**
1. Run `DEPLOY_PRODUCTION.bat` for production build
2. Configure your domain and SSL certificate
3. Set up proper database (PostgreSQL recommended)
4. Configure email notifications for alerts

### **For Customization**
1. Modify alert thresholds in admin panel
2. Customize UI colors and branding
3. Add custom notification channels
4. Integrate with existing security systems

---

**🎉 Congratulations! Your CrowdControl system is now ready to help prevent stampedes and keep crowds safe!**

*For the latest updates and documentation, check the included files or contact support.*
