import React from 'react'

export default function Test() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            🚀 CrowdControl Test
          </h1>
          <p className="text-gray-600 mb-6">
            If you can see this page, React is working correctly!
          </p>
          <div className="space-y-4">
            <div className="p-4 bg-green-100 rounded-lg border border-green-200">
              <span className="text-green-800 font-semibold">✅ React: Working</span>
            </div>
            <div className="p-4 bg-blue-100 rounded-lg border border-blue-200">
              <span className="text-blue-800 font-semibold">✅ Tailwind: Working</span>
            </div>
            <div className="p-4 bg-purple-100 rounded-lg border border-purple-200">
              <span className="text-purple-800 font-semibold">✅ Vite: Working</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
