import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  Server, 
  Database, 
  Shield, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Info,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { healthAPI, authAPI, mediaAPI, API_BASE_URL } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import toast from 'react-hot-toast';

const ConnectionTester = () => {
  const { showNotification } = useApp();
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);
  const [showTokens, setShowTokens] = useState(false);

  // Test scenarios
  const tests = [
    {
      id: 'backend_health',
      name: 'Backend Health Check',
      description: 'Test if Django backend is running and healthy',
      icon: Server,
      test: async () => {
        const result = await healthAPI.checkBackend();
        if (result.status === 'connected') {
          setSystemInfo(result.data);
          return { success: true, message: 'Backend is healthy', data: result.data };
        } else {
          return { success: false, message: result.error || 'Backend unreachable', error: result };
        }
      }
    },
    {
      id: 'cors_config',
      name: 'CORS Configuration',
      description: 'Verify Cross-Origin Resource Sharing is properly configured',
      icon: Shield,
      test: async () => {
        try {
          // Test preflight request
          const response = await fetch(`${API_BASE_URL}/health/`, {
            method: 'OPTIONS',
            headers: {
              'Origin': window.location.origin,
              'Access-Control-Request-Method': 'POST',
              'Access-Control-Request-Headers': 'Content-Type, Authorization'
            }
          });
          
          if (response.ok) {
            const corsHeaders = {
              'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
              'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
              'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            };
            return { success: true, message: 'CORS is properly configured', data: corsHeaders };
          } else {
            return { success: false, message: `CORS preflight failed: ${response.status}` };
          }
        } catch (error) {
          return { success: false, message: `CORS test failed: ${error.message}` };
        }
      }
    },
    {
      id: 'authentication',
      name: 'JWT Authentication',
      description: 'Test user authentication and token management',
      icon: Database,
      test: async () => {
        try {
          // Create test user
          const testUser = {
            username: `conntest_${Date.now()}`,
            email: `conntest_${Date.now()}@example.com`,
            password: 'TestPassword123!',
            first_name: 'Connection',
            last_name: 'Test'
          };

          // Register
          await authAPI.register(testUser);
          
          // Login
          const loginResult = await authAPI.login({
            username: testUser.username,
            password: testUser.password
          });

          if (loginResult.access) {
            // Test profile access
            const profile = await authAPI.getProfile();
            return { 
              success: true, 
              message: 'Authentication working correctly',
              data: { 
                user: profile.username,
                tokenLength: loginResult.access.length,
                hasRefreshToken: !!loginResult.refresh
              }
            };
          } else {
            return { success: false, message: 'Login failed - no access token received' };
          }
        } catch (error) {
          return { 
            success: false, 
            message: `Authentication failed: ${error.response?.data?.detail || error.message}`,
            error: error.response?.data
          };
        }
      }
    },
    {
      id: 'file_upload',
      name: 'File Upload Test',
      description: 'Test file upload functionality with a small test image',
      icon: Upload,
      test: async () => {
        try {
          // Create a small test image (1x1 pixel)
          const canvas = document.createElement('canvas');
          canvas.width = 1;
          canvas.height = 1;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = 'red';
          ctx.fillRect(0, 0, 1, 1);
          
          // Convert to blob
          const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', 0.8);
          });
          
          // Create file object
          const testFile = new File([blob], 'connection_test.jpg', { type: 'image/jpeg' });
          
          // Upload file
          const result = await mediaAPI.uploadFile(testFile);
          
          return {
            success: true,
            message: 'File upload working correctly',
            data: {
              fileId: result.id,
              filename: result.filename,
              size: result.file_size,
              analysisStatus: result.analysis_status
            }
          };
        } catch (error) {
          return {
            success: false,
            message: `File upload failed: ${error.response?.data?.detail || error.message}`,
            error: error.response?.data
          };
        }
      }
    }
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults({});
    
    for (const test of tests) {
      try {
        const result = await test.test();
        setTestResults(prev => ({
          ...prev,
          [test.id]: result
        }));
      } catch (error) {
        setTestResults(prev => ({
          ...prev,
          [test.id]: {
            success: false,
            message: `Test failed: ${error.message}`,
            error
          }
        }));
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
    
    // Show summary notification
    const totalTests = tests.length;
    const passedTests = Object.values(testResults).filter(r => r?.success).length;
    
    if (passedTests === totalTests) {
      toast.success('All connection tests passed!');
      showNotification({
        type: 'success',
        title: 'Connection Tests Complete',
        message: `All ${totalTests} tests passed successfully`,
        timestamp: Date.now(),
        id: Date.now()
      });
    } else {
      toast.error(`${totalTests - passedTests} tests failed`);
      showNotification({
        type: 'error',
        title: 'Connection Issues Found',
        message: `${totalTests - passedTests} out of ${totalTests} tests failed`,
        timestamp: Date.now(),
        id: Date.now()
      });
    }
  };

  const runSingleTest = async (test) => {
    setTestResults(prev => ({
      ...prev,
      [test.id]: { running: true }
    }));
    
    try {
      const result = await test.test();
      setTestResults(prev => ({
        ...prev,
        [test.id]: result
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [test.id]: {
          success: false,
          message: `Test failed: ${error.message}`,
          error
        }
      }));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusIcon = (result) => {
    if (!result) return <Info className="w-5 h-5 text-gray-400" />;
    if (result.running) return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
    if (result.success) return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusColor = (result) => {
    if (!result) return 'border-gray-200 bg-gray-50';
    if (result.running) return 'border-blue-200 bg-blue-50';
    if (result.success) return 'border-green-200 bg-green-50';
    return 'border-red-200 bg-red-50';
  };

  useEffect(() => {
    // Get system info on component mount
    const info = healthAPI.getSystemInfo();
    setSystemInfo(info);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Connection & Integration Tester
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test Django backend and Vite frontend integration
        </p>
      </div>

      {/* System Information */}
      {systemInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Info className="w-5 h-5 mr-2" />
            System Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">Frontend</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>API URL:</span>
                  <span className="font-mono text-xs">{systemInfo.apiUrl}</span>
                </div>
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <span>{systemInfo.environment}</span>
                </div>
                <div className="flex justify-between">
                  <span>Has Token:</span>
                  <span>{systemInfo.hasToken ? '✅' : '❌'}</span>
                </div>
              </div>
            </div>
            
            {systemInfo.database && (
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700 dark:text-gray-300">Backend</h3>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span>{systemInfo.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Database:</span>
                    <span>{systemInfo.database}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ML Predictor:</span>
                    <span>{systemInfo.ml_predictor}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">Tokens</h3>
              <div className="text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span>Access Token:</span>
                  <button
                    onClick={() => setShowTokens(!showTokens)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {showTokens && (
                  <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded break-all">
                    {localStorage.getItem('access_token') || 'Not set'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Test Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? (
            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Wifi className="w-5 h-5 mr-2" />
          )}
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </button>
        
        <button
          onClick={() => copyToClipboard(JSON.stringify(testResults, null, 2))}
          className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Copy className="w-5 h-5 mr-2" />
          Copy Results
        </button>
      </div>

      {/* Test Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tests.map((test, index) => {
          const result = testResults[test.id];
          const IconComponent = test.icon;
          
          return (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`border rounded-lg p-6 transition-all ${getStatusColor(result)}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <IconComponent className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {test.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {test.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getStatusIcon(result)}
                  <button
                    onClick={() => runSingleTest(test)}
                    disabled={result?.running}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${result?.running ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              
              {result && (
                <div className="space-y-2">
                  <div className={`text-sm font-medium ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.message}
                  </div>
                  
                  {result.data && (
                    <div className="text-xs bg-white dark:bg-gray-800 p-3 rounded border">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="text-xs bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200">
                      <pre className="whitespace-pre-wrap text-red-700 dark:text-red-300">
                        {JSON.stringify(result.error, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* DevTools Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          DevTools Debugging Guide
        </h2>
        
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Network Tab Verification:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open DevTools (F12) → Network tab</li>
              <li>Clear existing requests (🗑️ button)</li>
              <li>Run a test or upload a file</li>
              <li>Check for requests to <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{API_BASE_URL}</code></li>
              <li>Verify Authorization header is present</li>
              <li>Check response status codes (200/201 = success, 400/401/500 = error)</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Console Tab Debugging:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Look for red error messages</li>
              <li>Check for "🔴 API Error Details" groups</li>
              <li>CORS errors will mention "Access-Control-Allow-Origin"</li>
              <li>Network errors show as "ERR_NETWORK" or "ECONNABORTED"</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Common Issues:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>CORS errors:</strong> Check backend CORS settings</li>
              <li><strong>401 Unauthorized:</strong> Check JWT token in localStorage</li>
              <li><strong>Network errors:</strong> Verify backend is running on port 8000</li>
              <li><strong>File upload fails:</strong> Check file size (max 100MB) and type</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ConnectionTester;
