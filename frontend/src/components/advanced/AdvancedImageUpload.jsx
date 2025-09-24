import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  Trash2,
  RefreshCw,
  Users,
  Clock,
  MapPin,
  Zap,
} from 'lucide-react';
import { mediaAPI, analysisAPI } from '../../services/api';
import { fileUtils, dateUtils, colorUtils, cn } from '../../utils';
import { useApp } from '../../contexts/AppContext';
import toast from 'react-hot-toast';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorBoundary from '../ui/ErrorBoundary';

const AdvancedImageUpload = () => {
  const { showNotification } = useApp();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResults, setAnalysisResults] = useState({});
  const fileInputRef = useRef(null);

  // File upload handler
  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    rejectedFiles.forEach((file) => {
      const error = file.errors[0];
      toast.error(`${file.file.name}: ${error.message}`);
    });

    // Process accepted files
    const newFiles = acceptedFiles.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'pending', // pending, uploading, uploaded, analyzing, analyzed, error
      uploadResult: null,
      analysisResult: null,
      error: null,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Auto-upload files
    for (const fileData of newFiles) {
      await uploadFile(fileData);
    }
  }, []);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true,
  });

  // Upload individual file
  const uploadFile = async (fileData) => {
    try {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileData.id ? { ...f, status: 'uploading' } : f
        )
      );

      // Upload file with progress tracking
      const result = await mediaAPI.uploadFile(
        fileData.file,
        (progress) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileData.id ? { ...f, progress } : f
            )
          );
        }
      );

      // Update status to uploaded
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileData.id
            ? { ...f, status: 'uploaded', uploadResult: result, progress: 100 }
            : f
        )
      );

      // Auto-analyze the uploaded image
      await analyzeImage(fileData.id, result.id);

      toast.success(`${fileData.file.name} uploaded successfully!`);
    } catch (error) {
      console.error('Upload failed:', error);
      
      let errorMessage = 'Upload failed';
      if (error.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData.detail || errorData.error || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileData.id
            ? { ...f, status: 'error', error: errorMessage }
            : f
        )
      );
      
      toast.error(`Failed to upload ${fileData.file.name}: ${errorMessage}`);
      
      // Show notification for upload failure
      showNotification({
        type: 'error',
        title: 'Upload Failed',
        message: `${fileData.file.name}: ${errorMessage}`,
        timestamp: Date.now(),
        id: Date.now()
      });
    }
  };

  // Analyze uploaded image
  const analyzeImage = async (fileId, uploadId) => {
    try {
      // Update status to analyzing
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: 'analyzing' } : f
        )
      );

      // Wait for backend analysis to complete (it runs automatically after upload)
      // Poll the upload status until analysis is complete
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max wait
      let uploadData;
      
      while (attempts < maxAttempts) {
        uploadData = await mediaAPI.getUpload(uploadId);
        
        if (uploadData.analysis_status === 'completed') {
          // Analysis completed successfully
          const analysisResult = {
            people_count: uploadData.people_count || 0,
            confidence: uploadData.confidence_score || 0,
            risk_level: uploadData.is_stampede_risk ? 'high' : 'low',
            processing_time: 'N/A',
            crowd_detected: uploadData.crowd_detected || false,
            detections: uploadData.analysis_result?.bounding_boxes || []
          };
          
          // Update status to analyzed
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? { ...f, status: 'analyzed', analysisResult }
                : f
            )
          );

          // Store analysis results
          setAnalysisResults((prev) => ({
            ...prev,
            [fileId]: analysisResult,
          }));

          // Show notification for high-risk detections
          if (analysisResult.risk_level === 'high' || analysisResult.risk_level === 'critical') {
            showNotification({
              type: 'warning',
              title: 'High Risk Detection',
              message: `Detected ${analysisResult.people_count} people with ${analysisResult.risk_level} risk level`,
            });
          }

          toast.success('Image analysis completed!');
          return;
        } else if (uploadData.analysis_status === 'failed') {
          throw new Error('Backend analysis failed');
        }
        
        // Wait 1 second before next attempt
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
      
      // If we get here, analysis timed out
      throw new Error('Analysis timed out - please try again');

    } catch (error) {
      console.error('Analysis failed:', error);
      
      let errorMessage = 'Analysis failed';
      if (error.message) {
        errorMessage = error.message;
      }
      
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, status: 'error', error: errorMessage }
            : f
        )
      );
      
      toast.error(`Analysis failed: ${errorMessage}`);
      
      // Show notification for analysis failure
      showNotification({
        type: 'error',
        title: 'Analysis Failed',
        message: errorMessage,
        timestamp: Date.now(),
        id: Date.now()
      });
    }
  };

  // Remove file
  const removeFile = (fileId) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  };

  // Retry upload/analysis
  const retryFile = async (fileId) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    if (file.status === 'error' && !file.uploadResult) {
      // Retry upload
      await uploadFile(file);
    } else if (file.uploadResult && (!file.analysisResult || file.error)) {
      // Retry analysis
      await analyzeImage(fileId, file.uploadResult.id);
    }
  };

  // Clear all files
  const clearAll = () => {
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    setAnalysisResults({});
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'uploading':
      case 'analyzing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'uploaded':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'analyzed':
        return <Zap className="w-4 h-4 text-purple-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Get status text
  const getStatusText = (file) => {
    switch (file.status) {
      case 'pending':
        return 'Pending upload...';
      case 'uploading':
        return `Uploading... ${file.progress}%`;
      case 'uploaded':
        return 'Upload complete';
      case 'analyzing':
        return 'Analyzing image...';
      case 'analyzed':
        return 'Analysis complete';
      case 'error':
        return file.error || 'Error occurred';
      default:
        return 'Unknown status';
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Image Upload & Analysis
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Upload images for crowd detection and risk assessment
            </p>
          </div>
          
          {files.length > 0 && (
            <button
              onClick={clearAll}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900 dark:text-red-400 dark:hover:bg-red-800 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Upload Zone */}
        <motion.div
          {...getRootProps()}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive && 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
            isDragAccept && 'border-green-500 bg-green-50 dark:bg-green-900/20',
            isDragReject && 'border-red-500 bg-red-50 dark:bg-red-900/20',
            !isDragActive && 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          )}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <input {...getInputProps()} ref={fileInputRef} />
          
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {isDragActive ? 'Drop images here' : 'Upload images for analysis'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Drag and drop images or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supports JPEG, PNG, WebP up to 100MB
              </p>
            </div>
          </div>
        </motion.div>

        {/* Upload Queue */}
        {files.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upload Queue ({files.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {files.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    {/* Image Preview */}
                    <div className="relative">
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-full h-48 object-cover"
                      />
                      
                      {/* Overlay for analysis results */}
                      {file.analysisResult && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="text-center text-white">
                            <Users className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-lg font-bold">
                              {file.analysisResult.people_count} People
                            </p>
                            <p className={cn(
                              'text-sm px-2 py-1 rounded-full inline-block',
                              colorUtils.getRiskColor(file.analysisResult.risk_level)
                            )}>
                              {file.analysisResult.risk_level} Risk
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Remove button */}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* File Info */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.file.name}
                        </h4>
                        {getStatusIcon(file.status)}
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-2">
                        {fileUtils.formatFileSize(file.file.size)}
                      </p>
                      
                      {/* Progress Bar */}
                      {(file.status === 'uploading' || file.status === 'analyzing') && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                            <span>{getStatusText(file)}</span>
                            {file.status === 'uploading' && <span>{file.progress}%</span>}
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={cn(
                                'h-2 rounded-full transition-all duration-300',
                                file.status === 'uploading' ? 'bg-blue-500' : 'bg-purple-500'
                              )}
                              style={{
                                width: file.status === 'uploading' ? `${file.progress}%` : '100%',
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          'text-xs px-2 py-1 rounded-full',
                          file.status === 'error' && 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
                          file.status === 'analyzed' && 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
                          file.status === 'uploaded' && 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
                          (file.status === 'pending' || file.status === 'uploading' || file.status === 'analyzing') && 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        )}>
                          {getStatusText(file)}
                        </span>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-1">
                          {file.status === 'error' && (
                            <button
                              onClick={() => retryFile(file.id)}
                              className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                              title="Retry"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          
                          {file.analysisResult && (
                            <button
                              onClick={() => setSelectedFile(file)}
                              className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Analysis Results Summary */}
                      {file.analysisResult && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">People:</span>
                              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                                {file.analysisResult.people_count}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Confidence:</span>
                              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                                {Math.round(file.analysisResult.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Analysis Results Modal */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedFile(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Analysis Results
                    </h3>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Image */}
                    <div>
                      <img
                        src={selectedFile.preview}
                        alt={selectedFile.file.name}
                        className="w-full rounded-lg"
                      />
                    </div>
                    
                    {/* Results */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Detection Summary
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">People Count:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {selectedFile.analysisResult?.people_count || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Risk Level:</span>
                            <span className={cn(
                              'px-2 py-1 text-sm rounded-full',
                              colorUtils.getRiskColor(selectedFile.analysisResult?.risk_level)
                            )}>
                              {selectedFile.analysisResult?.risk_level}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {Math.round((selectedFile.analysisResult?.confidence || 0) * 100)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Processing Time:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {selectedFile.analysisResult?.processing_time || 'N/A'}ms
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {selectedFile.analysisResult?.detections && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            Individual Detections
                          </h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {selectedFile.analysisResult.detections.map((detection, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                              >
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Person #{index + 1}
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {Math.round(detection.confidence * 100)}% confidence
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          File Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Filename:</span>
                            <span className="font-medium text-gray-900 dark:text-white truncate ml-2">
                              {selectedFile.file.name}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">File Size:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {fileUtils.formatFileSize(selectedFile.file.size)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Upload Time:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {selectedFile.uploadResult?.created_at
                                ? dateUtils.formatDateTime(selectedFile.uploadResult.created_at)
                                : 'N/A'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
};

export default AdvancedImageUpload;
