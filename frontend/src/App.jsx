import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Uploads from './pages/Uploads'
import LiveStream from './pages/LiveStream'
import NavBar from './components/NavBar'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('access')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="max-w-6xl mx-auto p-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/uploads" element={<PrivateRoute><Uploads /></PrivateRoute>} />
          <Route path="/live" element={<PrivateRoute><LiveStream /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/uploads" replace />} />
        </Routes>
      </div>
    </div>
  )
}
