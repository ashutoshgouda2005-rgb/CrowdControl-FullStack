import React, { useState, useRef } from 'react'
import { 
  PhotoIcon, 
  CloudArrowUpIcon, 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { mediaApi } from '../utils/api'

const PhotoUpload = () => {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    handleFiles(selectedFiles)
  }

  const handleFiles = (newFiles) => {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const imageFiles = newFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > maxSize) {
        alert(`${file.name} is too large. Maximum size is 100MB`);
        return false;
      }
      return true;
    });
    setFiles(prev => [...prev, ...imageFiles.slice(0, 5 - prev.length)])
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const analyzePhotos = async () => {
    if (files.length === 0) return

    setAnalyzing(true)
    setResults(null)

    try {
      // Upload files to backend for analysis
      const uploadPromises = files.map(async (file) => {
        try {
          console.log('Uploading file:', file.name)
          const uploadResult = await mediaApi.upload(file)
          console.log('Upload successful:', uploadResult)
          return uploadResult
        } catch (error) {
          console.error('Upload failed for file:', file.name, error)
          throw error
        }
      })

      const uploadResults = await Promise.all(uploadPromises)
      console.log('All uploads completed:', uploadResults)

      // Wait for analysis to complete and get results
      const analysisResults = await Promise.all(
        uploadResults.map(async (upload) => {
          // Poll for analysis completion
          let attempts = 0
          const maxAttempts = 30 // 30 seconds timeout
          
          while (attempts < maxAttempts) {
            try {
              const mediaDetails = await mediaApi.get(upload.id)
              console.log(`Analysis status for ${upload.id}:`, mediaDetails.analysis_status)
              
              if (mediaDetails.analysis_status === 'completed' && mediaDetails.analysis_result) {
                return mediaDetails.analysis_result
              } else if (mediaDetails.analysis_status === 'failed') {
                throw new Error('Analysis failed on server')
              }
              
              // Wait 1 second before next check
              await new Promise(resolve => setTimeout(resolve, 1000))
              attempts++
            } catch (error) {
              console.error('Error checking analysis status:', error)
              attempts++
            }
          }
          
          throw new Error('Analysis timeout - please try again')
        })
      )

      // Combine results from multiple files
      const combinedResults = {
        people_count: analysisResults.reduce((sum, result) => sum + (result.people_count || 0), 0),
        confidence_score: analysisResults.reduce((sum, result) => sum + (result.confidence_score || 0), 0) / analysisResults.length,
        is_stampede_risk: analysisResults.some(result => result.is_stampede_risk),
        crowd_density: analysisResults.reduce((sum, result) => sum + (result.crowd_density || 0), 0) / analysisResults.length,
        processing_time_ms: analysisResults.reduce((sum, result) => sum + (result.processing_time_ms || 0), 0) / analysisResults.length,
        risk_level: analysisResults.some(result => result.is_stampede_risk) ? 'high_risk' : 
                   analysisResults.some(result => result.people_count > 15) ? 'crowded' : 'normal',
        bounding_boxes: analysisResults.flatMap(result => result.bounding_boxes || []),
        upload_ids: uploadResults.map(upload => upload.id),
        individual_results: analysisResults
      }

      console.log('Combined analysis results:', combinedResults)
      setResults(combinedResults)

    } catch (error) {
      console.error('Analysis failed:', error)
      alert(`Analysis failed: ${error.message || 'Please check your connection and try again.'}`)
    } finally {
      setAnalyzing(false)
    }
  }

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high_risk': return 'text-red-600 bg-red-50 border-red-200'
      case 'crowded': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'high_risk': return <ExclamationTriangleIcon className="w-6 h-6" />
      case 'crowded': return <ExclamationTriangleIcon className="w-6 h-6" />
      default: return <CheckCircleIcon className="w-6 h-6" />
    }
  }

  const getRiskMessage = (riskLevel, peopleCount) => {
    switch (riskLevel) {
      case 'high_risk': return `High stampede risk detected with ${peopleCount} people. Immediate action recommended.`
      case 'crowded': return `Moderate crowd density with ${peopleCount} people. Monitor situation closely.`
      default: return `Safe crowd level with ${peopleCount} people. No immediate concerns.`
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Photo Analysis</h1>
        <p className="text-lg text-gray-600">
          Upload crowd photos for instant AI-powered safety analysis
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <CloudArrowUpIcon className="w-8 h-8 text-blue-600" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Drop your photos here
              </h3>
              <p className="text-gray-600 mb-4">
                or click to browse files
              </p>
              <p className="text-sm text-gray-500">
                Supports JPG, PNG, WebP up to 100MB each (max 5 files)
              </p>
            </div>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Choose Files
            </button>
          </div>
        </div>

        {/* File Preview */}
        {files.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Selected Files ({files.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-center">
              <button
                onClick={analyzePhotos}
                disabled={analyzing}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors flex items-center space-x-3"
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <EyeIcon className="w-5 h-5" />
                    <span>Analyze Photos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {results && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Analysis Results</h2>
          
          {/* Risk Alert */}
          <div className={`rounded-xl p-6 mb-6 border-2 ${getRiskColor(results.risk_level)}`}>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {getRiskIcon(results.risk_level)}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {results.risk_level === 'high_risk' ? 'High Risk Alert' :
                   results.risk_level === 'crowded' ? 'Moderate Risk' : 'Safe Conditions'}
                </h3>
                <p className="text-sm">
                  {getRiskMessage(results.risk_level, results.people_count)}
                </p>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-xl p-6 text-center">
              <UsersIcon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-blue-900 mb-1">
                {results.people_count}
              </div>
              <div className="text-blue-700 font-medium">People Detected</div>
            </div>

            <div className="bg-green-50 rounded-xl p-6 text-center">
              <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-green-900 mb-1">
                {(results.confidence_score * 100).toFixed(1)}%
              </div>
              <div className="text-green-700 font-medium">Confidence</div>
            </div>

            <div className="bg-purple-50 rounded-xl p-6 text-center">
              <UsersIcon className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-purple-900 mb-1">
                {(results.crowd_density * 100).toFixed(0)}%
              </div>
              <div className="text-purple-700 font-medium">Crowd Density</div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <ClockIcon className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {results.processing_time_ms}ms
              </div>
              <div className="text-gray-700 font-medium">Processing Time</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setFiles([])
                setResults(null)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Analyze New Photos
            </button>
            
            <button className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
              Download Report
            </button>
            
            <button className="border-2 border-green-300 hover:border-green-400 text-green-700 px-6 py-3 rounded-lg font-medium transition-colors">
              Share Results
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoUpload
