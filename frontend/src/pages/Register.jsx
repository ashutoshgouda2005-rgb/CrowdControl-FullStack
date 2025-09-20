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
    <div className="max-w-md mx-auto mt-8 card">
      <div className="card-body">
        <h1 className="text-2xl font-semibold mb-2">Create Account</h1>
        <p className="text-gray-600 mb-6">Join CrowdControl to access AI-powered crowd analysis</p>
        
        {error && (
          <div className="p-3 rounded bg-red-50 text-red-700 mb-4 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-3 rounded bg-green-50 text-green-700 mb-4 text-sm">
            {success}
          </div>
        )}
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">First Name</label>
              <input 
                name="firstName"
                value={formData.firstName} 
                onChange={handleChange} 
                className="w-full border rounded px-3 py-2 text-sm" 
                placeholder="John" 
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Last Name</label>
              <input 
                name="lastName"
                value={formData.lastName} 
                onChange={handleChange} 
                className="w-full border rounded px-3 py-2 text-sm" 
                placeholder="Doe" 
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 mb-1">Username</label>
            <input 
              name="username"
              value={formData.username} 
              onChange={handleChange} 
              className="w-full border rounded px-3 py-2 text-sm" 
              placeholder="Choose a username" 
              required
              minLength={3}
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input 
              type="email"
              name="email"
              value={formData.email} 
              onChange={handleChange} 
              className="w-full border rounded px-3 py-2 text-sm" 
              placeholder="your@email.com" 
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 mb-1">Password</label>
            <input 
              type="password"
              name="password"
              value={formData.password} 
              onChange={handleChange} 
              className="w-full border rounded px-3 py-2 text-sm" 
              placeholder="Create a strong password" 
              required
              minLength={6}
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 mb-1">Confirm Password</label>
            <input 
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword} 
              onChange={handleChange} 
              className="w-full border rounded px-3 py-2 text-sm" 
              placeholder="Confirm your password" 
              required
              minLength={6}
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary w-full h-11" 
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="text-sm text-gray-600 mt-4 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  )
}
