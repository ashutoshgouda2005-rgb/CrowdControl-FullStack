import React, { useState, useEffect } from 'react'
import { mediaApi } from '../lib/api'

export default function Uploads() {
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')

  const loadUploads = async () => {
    setLoading(true)
    try {
      const { data } = await mediaApi.list()
      setUploads(data.results || [])
    } catch (err) {
      console.error('Failed to load uploads:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUploads()
  }, [])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!selectedFile) return

    setUploading(true)
    try {
      const mediaType = selectedFile.type.startsWith('image/') ? 'image' : 'video'
      await mediaApi.upload({
        file: selectedFile,
        media_type: mediaType,
        description,
        location
      })
      
      setSelectedFile(null)
      setDescription('')
      setLocation('')
      loadUploads()
    } catch (err) {
      console.error('Upload failed:', err)
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.message || 
                          err?.message || 
                          'Upload failed. Please try again.'
      alert(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    }
    return `px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`
  }

  const getRiskBadge = (isRisk) => {
    if (isRisk === null) return null
    return isRisk 
      ? <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">⚠️ Stampede Risk</span>
      : <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✅ Normal</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Media Uploads</h1>
        <button onClick={loadUploads} className="btn btn-primary">Refresh</button>
      </div>

      {/* Upload Form */}
      <div className="card">
        <div className="card-body">
          <h2 className="text-lg font-medium mb-4">Upload Photo or Video</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File (Image or Video)
              </label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the content..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where was this taken?"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="btn btn-primary"
            >
              {uploading ? 'Uploading...' : 'Upload & Analyze'}
            </button>
          </form>
        </div>
      </div>

      {/* Uploads List */}
      <div className="card">
        <div className="card-body">
          <h2 className="text-lg font-medium mb-4">Your Uploads</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading uploads...</p>
            </div>
          ) : uploads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No uploads yet. Upload your first photo or video above!
            </div>
          ) : (
            <div className="space-y-4">
              {uploads.map((upload) => (
                <div key={upload.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{upload.filename}</h3>
                        <span className={getStatusBadge(upload.analysis_status)}>
                          {upload.analysis_status}
                        </span>
                        {getRiskBadge(upload.is_stampede_risk)}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Type: {upload.media_type} • Size: {(upload.file_size / 1024 / 1024).toFixed(2)} MB</p>
                        <p>Uploaded: {new Date(upload.uploaded_at).toLocaleString()}</p>
                        {upload.description && <p>Description: {upload.description}</p>}
                        {upload.location && <p>Location: {upload.location}</p>}
                      </div>

                      {upload.analysis_status === 'completed' && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <h4 className="font-medium text-sm mb-2">Analysis Results:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Crowd Detected:</span>
                              <p className="font-medium">{upload.crowd_detected ? 'Yes' : 'No'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">People Count:</span>
                              <p className="font-medium">{upload.people_count || 0}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Confidence:</span>
                              <p className="font-medium">{upload.confidence_score?.toFixed(2) || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Completed:</span>
                              <p className="font-medium">
                                {upload.analysis_completed_at ? 
                                  new Date(upload.analysis_completed_at).toLocaleString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
