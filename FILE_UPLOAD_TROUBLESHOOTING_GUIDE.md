# CrowdControl File Upload Troubleshooting Guide

## ✅ Issues Fixed

### 1. **Field Name Mismatch Fixed**
- **Issue**: Frontend sent `file_type` but backend expected `media_type`
- **Fix**: Updated frontend to send `media_type` field
- **Location**: `frontend/src/services/api.js`

### 2. **Enhanced Error Handling**
- **Issue**: Generic 400 errors with no helpful messages
- **Fix**: Added detailed validation with specific error messages
- **Location**: `backend/api/views.py` - `upload_media` function

### 3. **File Size Validation**
- **Issue**: No clear file size limit enforcement
- **Fix**: Added 100MB limit with clear error messages
- **Location**: Backend upload validation

### 4. **File Type Validation**
- **Issue**: No file type restrictions
- **Fix**: Added support for images and videos with type validation
- **Supported Types**: 
  - Images: JPEG, PNG, WebP, GIF
  - Videos: MP4, AVI, MOV, WMV, WebM

## 🔧 Current Configuration

### Backend Settings (Django)
```python
# File upload limits (100MB)
FILE_UPLOAD_MAX_MEMORY_SIZE = 100 * 1024 * 1024  # 100MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 100 * 1024 * 1024  # 100MB

# Upload endpoint: /api/media/upload/
# Method: POST
# Authentication: JWT Bearer token required
```

### Frontend API (JavaScript)
```javascript
// Updated upload function
mediaAPI.uploadFile(file, onProgress)
// Automatically detects image vs video
// Sends proper FormData with media_type field
```

## 🧪 Test Results

File upload tests show:
- ✅ Small files (1MB) upload successfully
- ✅ Medium files (10MB) upload successfully  
- ✅ Video files (5MB) upload successfully
- ✅ Invalid file types are rejected
- ✅ Missing file requests are rejected
- ✅ Large files up to 100MB are supported

## 🚀 How to Test File Uploads

### Option 1: Automated Testing
```bash
# Run comprehensive upload tests
python TEST_FILE_UPLOAD.py
```

### Option 2: Manual Browser Testing
1. **Open Application**: Go to `http://localhost:5176`
2. **Login**: Use your credentials
3. **Navigate to Upload**: Find the file upload component
4. **Test Different Files**:
   - Small image (< 1MB)
   - Large image (10-50MB)
   - Video file (MP4, AVI, etc.)
   - Invalid file type (should be rejected)

### Option 3: DevTools Verification
1. **Open DevTools**: Press F12 in browser
2. **Go to Network Tab**: Monitor requests
3. **Upload a File**: Watch the request
4. **Verify Request**:
   - Method: POST
   - URL: `/api/media/upload/`
   - Headers: `Authorization: Bearer <token>`
   - Body: FormData with `file` and `media_type`

## 🔍 Expected Request Format

### Correct FormData Structure
```
file: [File object]
media_type: "image" or "video"
description: "" (optional)
location: "" (optional)
```

### Expected Response (Success - 201)
```json
{
  "id": 123,
  "user": {...},
  "media_type": "image",
  "file": "/media/uploads/2025/09/21/filename.jpg",
  "filename": "filename.jpg",
  "file_size": 1234567,
  "uploaded_at": "2025-09-21T08:30:00Z",
  "analysis_status": "pending",
  "description": "",
  "location": ""
}
```

### Expected Response (Error - 400)
```json
{
  "error": "File too large",
  "detail": "File size (150.5MB) exceeds the 100MB limit"
}
```

## 🐛 Common Issues & Solutions

### Issue: "No file provided"
**Cause**: FormData doesn't contain 'file' field
**Solution**: 
```javascript
const formData = new FormData();
formData.append('file', fileObject);  // Make sure this line exists
```

### Issue: "Invalid file type"
**Cause**: Unsupported file format
**Solution**: Use supported formats:
- Images: .jpg, .jpeg, .png, .webp, .gif
- Videos: .mp4, .avi, .mov, .wmv, .webm

### Issue: "File too large"
**Cause**: File exceeds 100MB limit
**Solution**: 
- Compress the file before upload
- Or increase limits in Django settings (not recommended)

### Issue: "Validation failed"
**Cause**: Missing required fields
**Solution**: Ensure FormData includes:
```javascript
formData.append('file', file);
formData.append('media_type', 'image'); // or 'video'
```

### Issue: "Authentication required"
**Cause**: Missing or invalid JWT token
**Solution**: 
```javascript
headers: {
  'Authorization': `Bearer ${accessToken}`
}
```

### Issue: Upload hangs or times out
**Cause**: Large file upload taking too long
**Solution**: 
- Check network connection
- Verify backend is running
- Monitor upload progress

## 📊 Upload Flow Diagram

```
1. User selects file → Frontend
2. Frontend validates file (size, type)
3. Create FormData with file + metadata
4. POST /api/media/upload/ with JWT token
5. Backend validates request
6. Backend saves file to media/uploads/
7. Backend starts AI analysis (background)
8. Return upload confirmation to frontend
9. Frontend shows success message
10. AI analysis completes asynchronously
```

## 🔐 Security Considerations

- File type validation prevents malicious uploads
- File size limits prevent DoS attacks
- JWT authentication required for all uploads
- Files stored outside web root for security
- Virus scanning recommended for production

## 📈 Performance Tips

- Use progress callbacks for large files
- Implement client-side compression for images
- Consider chunked uploads for very large files
- Monitor server disk space
- Implement cleanup for failed uploads

## 🛠️ Debugging Steps

1. **Check Backend Logs**: Look for upload errors in Django console
2. **Verify File Size**: Ensure file is under 100MB
3. **Check File Type**: Verify MIME type is supported
4. **Test Authentication**: Confirm JWT token is valid
5. **Monitor Network**: Check for connection issues
6. **Validate FormData**: Ensure all required fields are present

## 📞 Support

If uploads still fail:

1. Run the test script: `python TEST_FILE_UPLOAD.py`
2. Check browser DevTools Network tab
3. Review Django server logs
4. Verify file meets requirements (size, type)
5. Test with a small, simple image first

## 🎯 Next Steps

Your file upload system is now fully functional! You can:

1. **Upload images and videos** up to 100MB
2. **Get detailed error messages** for any issues
3. **Monitor upload progress** with progress callbacks
4. **View uploaded files** in the dashboard
5. **Analyze files** with AI processing

The system handles both images and videos with comprehensive validation and error handling!
