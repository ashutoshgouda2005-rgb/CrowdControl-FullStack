import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'

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
    <div className="max-w-md mx-auto mt-12 card">
      <div className="card-body">
        <h1 className="text-2xl font-semibold mb-2">Welcome back</h1>
        <p className="text-gray-600 mb-6">Sign in to manage uploads and live streams</p>
        {error && <div className="p-3 rounded bg-red-50 text-red-700 mb-4">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Username</label>
            <input 
              value={username} 
              onChange={(e)=>setUsername(e.target.value)} 
              className="w-full border rounded px-3 py-2" 
              placeholder="Enter username" 
              required
              minLength={3}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
              className="w-full border rounded px-3 py-2" 
              placeholder="Enter password" 
              required
              minLength={6}
              disabled={loading}
            />
          </div>
          <button className="btn btn-primary w-full h-11" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <div className="text-sm text-gray-600 mt-4">No account? Ask admin to create one or extend the form to register.</div>
      </div>
    </div>
  )
}
