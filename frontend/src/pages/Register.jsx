import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../utils/api'

export default function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    try {
      const response = await authApi.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName
      })
      
      setSuccess('Account created successfully! Redirecting to login...')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.message || 
                          'Registration failed. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto animate-slide-in">
      <div className="card">
        <div className="card-body">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✨</span>
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Join CrowdControl</h1>
            <p className="text-gray-600">Create your account to access AI-powered crowd analysis</p>
          </div>
        
          {error && (
            <div className="alert alert-error mb-6">
              <span className="mr-2">⚠️</span>
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success mb-6">
              <span className="mr-2">✅</span>
              {success}
            </div>
          )}
        
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">
                  <span className="mr-2">👤</span>
                  First Name
                </label>
                <input 
                  name="firstName"
                  value={formData.firstName} 
                  onChange={handleChange} 
                  className="form-input" 
                  placeholder="John" 
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <span className="mr-2">👤</span>
                  Last Name
                </label>
                <input 
                  name="lastName"
                  value={formData.lastName} 
                  onChange={handleChange} 
                  className="form-input" 
                  placeholder="Doe" 
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">
                <span className="mr-2">🏷️</span>
                Username
              </label>
              <input 
                name="username"
                value={formData.username} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="Choose a username" 
                required
                minLength={3}
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                <span className="mr-2">📧</span>
                Email
              </label>
              <input 
                type="email"
                name="email"
                value={formData.email} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="your@email.com" 
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                <span className="mr-2">🔒</span>
                Password
              </label>
              <input 
                type="password"
                name="password"
                value={formData.password} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="Create a strong password" 
                required
                minLength={6}
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                <span className="mr-2">🔐</span>
                Confirm Password
              </label>
              <input 
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="Confirm your password" 
                required
                minLength={6}
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner mr-2"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <span className="mr-2">✨</span>
                  Create Account
                </>
              )}
            </button>
          </form>
          
          <div className="text-center mt-8 pt-6 border-t border-gray-100">
            <p className="text-gray-600 mb-4">Already have an account?</p>
            <Link 
              to="/login" 
              className="btn btn-outline w-full"
            >
              <span className="mr-2">🔐</span>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
