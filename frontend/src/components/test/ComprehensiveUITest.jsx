import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Sun, 
  Moon, 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  TestTube,
  Zap
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { mediaAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ComprehensiveUITest = () => {
  const { theme, toggleTheme, showNotification } = useApp();
  const [testFile, setTestFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Test notifications
  const testNotifications = () => {
    const notifications = [
      {
        type: 'success',
        title: 'Success Test',
        message: 'This is a success notification test',
        timestamp: Date.now()
      },
      {
        type: 'warning',
        title: 'Warning Test',
        message: 'This is a warning notification test',
        timestamp: Date.now()
      },
      {
        type: 'error',
        title: 'Error Test',
        message: 'This is an error notification test',
        timestamp: Date.now()
      },
      {
        type: 'info',
        title: 'Info Test',
        message: 'This is an info notification test',
        timestamp: Date.now()
      }
    ];

    notifications.forEach((notification, index) => {
      setTimeout(() => {
        showNotification({
          ...notification,
          id: Date.now() + index
        });
      }, index * 500);
    });
  };

  // Test file upload
  const testFileUpload = async () => {
    if (!testFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await mediaAPI.uploadFile(testFile, (progress) => {
        setUploadProgress(progress);
      });

      toast.success('File uploaded successfully!');
      showNotification({
        type: 'success',
        title: 'Upload Complete',
        message: `${testFile.name} has been uploaded and is being analyzed`,
        timestamp: Date.now(),
        id: Date.now()
      });

      console.log('Upload result:', result);
    } catch (error) {
      console.error('Upload failed:', error);
      
      let errorMessage = 'Upload failed';
      if (error.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData.detail || errorData.error || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      showNotification({
        type: 'error',
        title: 'Upload Failed',
        message: errorMessage,
        timestamp: Date.now(),
        id: Date.now()
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Test theme toggle
  const testThemeToggle = () => {
    toggleTheme();
    toast.success(`Switched to ${theme === 'light' ? 'dark' : 'light'} mode`);
    showNotification({
      type: 'info',
      title: 'Theme Changed',
      message: `Switched to ${theme === 'light' ? 'dark' : 'light'} mode`,
      timestamp: Date.now(),
      id: Date.now()
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          CrowdControl UI Test Suite
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test all UI components and functionality
        </p>
      </div>

      {/* Theme Toggle Test */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Sun className="w-5 h-5 mr-2" />
          Theme Toggle Test
        </h2>
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Current theme: <span className="font-medium">{theme}</span>
          </p>
          <button
            onClick={testThemeToggle}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {theme === 'light' ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
            Toggle to {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
        </div>
      </motion.div>

      {/* Notifications Test */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Notifications Test
        </h2>
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Test the notification system with different types of notifications.
          </p>
          <button
            onClick={testNotifications}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Bell className="w-4 h-4 mr-2" />
            Test All Notification Types
          </button>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => showNotification({
                type: 'success',
                title: 'Success',
                message: 'Operation completed successfully',
                timestamp: Date.now(),
                id: Date.now()
              })}
              className="flex items-center justify-center px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-sm"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Success
            </button>
            <button
              onClick={() => showNotification({
                type: 'warning',
                title: 'Warning',
                message: 'Please check your settings',
                timestamp: Date.now(),
                id: Date.now()
              })}
              className="flex items-center justify-center px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              Warning
            </button>
            <button
              onClick={() => showNotification({
                type: 'error',
                title: 'Error',
                message: 'Something went wrong',
                timestamp: Date.now(),
                id: Date.now()
              })}
              className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-sm"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Error
            </button>
            <button
              onClick={() => showNotification({
                type: 'info',
                title: 'Info',
                message: 'Here is some information',
                timestamp: Date.now(),
                id: Date.now()
              })}
              className="flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm"
            >
              <Info className="w-4 h-4 mr-1" />
              Info
            </button>
          </div>
        </div>
      </motion.div>

      {/* File Upload Test */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Upload className="w-5 h-5 mr-2" />
          File Upload Test (100MB Support)
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select File (Images or Videos, up to 100MB)
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setTestFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {testFile && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">
                  {testFile.type.startsWith('image/') ? '🖼️' : '🎥'}
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {testFile.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(testFile.size)} • {testFile.type}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={testFileUpload}
            disabled={!testFile || uploading}
            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading... {uploadProgress}%
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Test File Upload
              </>
            )}
          </button>

          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* Test Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <TestTube className="w-5 h-5 mr-2" />
          Test Instructions
        </h2>
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Theme Toggle Test:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Click the theme toggle button to switch between light and dark modes</li>
              <li>Verify the entire UI changes theme immediately</li>
              <li>Check that the theme persists after page refresh</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Notifications Test:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Click the notification button in the top-right corner</li>
              <li>Test different notification types using the buttons above</li>
              <li>Verify notifications appear in the dropdown panel</li>
              <li>Test clearing individual notifications and clearing all</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">File Upload Test:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Select an image or video file (test with different sizes)</li>
              <li>Verify files up to 100MB are accepted</li>
              <li>Check that upload progress is displayed</li>
              <li>Confirm successful uploads show analysis status</li>
              <li>Test with invalid file types to see error messages</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">DevTools Verification:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Open DevTools (F12) → Network tab</li>
              <li>Upload a file and watch for POST request to /api/media/upload/</li>
              <li>Verify Authorization header is present</li>
              <li>Check FormData contains file and media_type fields</li>
              <li>Confirm response is 201 (success) or 400 (validation error)</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ComprehensiveUITest;
