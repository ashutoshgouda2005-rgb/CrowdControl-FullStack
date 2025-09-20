import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../utils/api'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.login(username, password)
      navigate('/uploads')
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto animate-slide-in">
      <div className="card">
        <div className="card-body">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to access your CrowdControl dashboard</p>
          </div>
          
          {error && (
            <div className="alert alert-error mb-6">
              <span className="mr-2">⚠️</span>
              {error}
            </div>
          )}
          
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="form-group">
              <label className="form-label">
                <span className="mr-2">👤</span>
                Username
              </label>
              <input 
                value={username} 
                onChange={(e)=>setUsername(e.target.value)} 
                className="form-input" 
                placeholder="Enter your username" 
                required
                minLength={3}
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
                value={password} 
                onChange={(e)=>setPassword(e.target.value)} 
                className="form-input" 
                placeholder="Enter your password" 
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
                  Signing in...
                </>
              ) : (
                <>
                  <span className="mr-2">🚀</span>
                  Sign In
                </>
              )}
            </button>
          </form>
          
          <div className="text-center mt-8 pt-6 border-t border-gray-100">
            <p className="text-gray-600 mb-4">Don't have an account?</p>
            <Link 
              to="/register" 
              className="btn btn-outline w-full"
            >
              <span className="mr-2">✨</span>
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
