import React, { useState } from 'react';
import { Upload, File, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { mediaAPI } from '../../services/api';
import toast from 'react-hot-toast';

const FileUploadTest = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
      setError(null);
      setUploadProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const result = await mediaAPI.uploadFile(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      setUploadResult(result);
      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Upload failed';
      if (error.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData.detail || errorData.error || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return '🖼️';
    } else if (file.type.startsWith('video/')) {
      return '🎥';
    }
    return '📄';
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        File Upload Test
      </h2>

      {/* File Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select File (Images or Videos, up to 100MB)
        </label>
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getFileTypeIcon(selectedFile)}</span>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(selectedFile.size)} • {selectedFile.type}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="mb-6">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? (
            <>
              <Loader className="w-5 h-5 animate-spin mr-2" />
              Uploading... {uploadProgress}%
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Upload File
            </>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      {uploading && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {uploadProgress}% uploaded
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-800 dark:text-red-200 font-medium">Upload Failed</p>
          </div>
          <p className="text-red-700 dark:text-red-300 mt-1 text-sm">{error}</p>
        </div>
      )}

      {/* Success Display */}
      {uploadResult && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center mb-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
            <p className="text-green-800 dark:text-green-200 font-medium">Upload Successful!</p>
          </div>
          <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <p><strong>File ID:</strong> {uploadResult.id}</p>
            <p><strong>Filename:</strong> {uploadResult.filename}</p>
            <p><strong>Size:</strong> {formatFileSize(uploadResult.file_size)}</p>
            <p><strong>Type:</strong> {uploadResult.media_type}</p>
            <p><strong>Status:</strong> {uploadResult.analysis_status}</p>
            <p><strong>Uploaded:</strong> {new Date(uploadResult.uploaded_at).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
        <h3 className="font-medium text-gray-900 dark:text-white">Test Instructions:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Try uploading different file types (JPEG, PNG, MP4, etc.)</li>
          <li>Test with files of various sizes (small to large)</li>
          <li>Check browser DevTools Network tab during upload</li>
          <li>Verify the Authorization header is present</li>
          <li>Monitor upload progress and error handling</li>
        </ul>
      </div>

      {/* DevTools Instructions */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
          DevTools Verification:
        </h3>
        <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <p>1. Open DevTools (F12) → Network tab</p>
          <p>2. Upload a file and watch for POST request to /api/media/upload/</p>
          <p>3. Check request headers include: Authorization: Bearer [token]</p>
          <p>4. Verify FormData contains: file, media_type fields</p>
          <p>5. Response should be 201 (success) or 400 (validation error)</p>
        </div>
      </div>
    </div>
  );
};

export default FileUploadTest;
