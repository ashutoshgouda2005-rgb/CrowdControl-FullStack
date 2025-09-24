import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, ExternalLink } from 'lucide-react';

class EnhancedErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Enhanced error logging
    console.group('🚨 ENHANCED ERROR BOUNDARY - CRITICAL ERROR CAUGHT');
    console.error('Error ID:', this.state.errorId);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Stack:', error.stack);
    console.error('Props:', this.props);
    console.error('Timestamp:', new Date().toISOString());
    console.groupEnd();

    // Try to identify common error patterns
    this.analyzeError(error, errorInfo);
  }

  analyzeError = (error, errorInfo) => {
    const errorMessage = error.message || error.toString();
    const componentStack = errorInfo.componentStack || '';
    
    console.group('🔍 ERROR ANALYSIS');
    
    // Common error patterns
    if (errorMessage.includes('Cannot read property') || errorMessage.includes('Cannot read properties')) {
      console.warn('💡 LIKELY CAUSE: Trying to access property of undefined/null object');
      console.warn('💡 SOLUTION: Add null checks or default values');
    }
    
    if (errorMessage.includes('is not a function')) {
      console.warn('💡 LIKELY CAUSE: Calling undefined function or wrong import');
      console.warn('💡 SOLUTION: Check function imports and definitions');
    }
    
    if (errorMessage.includes('Cannot resolve module') || errorMessage.includes('Module not found')) {
      console.warn('💡 LIKELY CAUSE: Missing file or incorrect import path');
      console.warn('💡 SOLUTION: Check file paths and ensure files exist');
    }
    
    if (errorMessage.includes('Unexpected token')) {
      console.warn('💡 LIKELY CAUSE: Syntax error in JSX or JavaScript');
      console.warn('💡 SOLUTION: Check for unclosed tags, missing commas, or syntax issues');
    }
    
    if (componentStack.includes('AppContext') || componentStack.includes('AppProvider')) {
      console.warn('💡 LIKELY CAUSE: Error in App Context initialization');
      console.warn('💡 SOLUTION: Check API connections, WebSocket setup, or context state');
    }
    
    if (componentStack.includes('Router') || componentStack.includes('Route')) {
      console.warn('💡 LIKELY CAUSE: Routing configuration error');
      console.warn('💡 SOLUTION: Check route definitions and component imports');
    }
    
    console.groupEnd();
  };

  handleRetry = () => {
    console.log('🔄 User clicked retry - resetting error boundary');
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      showDetails: false
    });
  };

  handleGoHome = () => {
    console.log('🏠 User clicked go home - redirecting');
    window.location.href = '/';
  };

  handleReload = () => {
    console.log('🔄 User clicked reload - reloading page');
    window.location.reload();
  };

  copyErrorDetails = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      error: this.state.error?.toString(),
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    const errorText = JSON.stringify(errorDetails, null, 2);
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(errorText).then(() => {
        alert('Error details copied to clipboard!');
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = errorText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Error details copied to clipboard!');
    }
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Unknown error occurred';
      const errorStack = this.state.error?.stack || '';
      const componentStack = this.state.errorInfo?.componentStack || '';

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-red-500 dark:bg-red-600 text-white p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Application Error</h1>
                  <p className="text-red-100">Something went wrong in the React application</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Error Summary */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Error Summary
                </h2>
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-200 font-medium">
                    {errorMessage}
                  </p>
                  <p className="text-red-600 dark:text-red-300 text-sm mt-1">
                    Error ID: {this.state.errorId}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={this.handleRetry}
                    className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </button>
                  
                  <button
                    onClick={this.handleReload}
                    className="flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Reload Page
                  </button>
                  
                  <button
                    onClick={this.handleGoHome}
                    className="flex items-center justify-center px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </button>
                </div>
              </div>

              {/* Error Details Toggle */}
              <div className="mb-4">
                <button
                  onClick={this.toggleDetails}
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  {this.state.showDetails ? 'Hide' : 'Show'} Technical Details
                </button>
              </div>

              {/* Technical Details */}
              {this.state.showDetails && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                      Technical Details
                    </h3>
                    <button
                      onClick={this.copyErrorDetails}
                      className="flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Details
                    </button>
                  </div>

                  {/* Error Stack */}
                  {errorStack && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Error Stack:
                      </h4>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded-lg overflow-auto max-h-40 text-red-600 dark:text-red-400">
                        {errorStack}
                      </pre>
                    </div>
                  )}

                  {/* Component Stack */}
                  {componentStack && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Component Stack:
                      </h4>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded-lg overflow-auto max-h-40 text-blue-600 dark:text-blue-400">
                        {componentStack}
                      </pre>
                    </div>
                  )}

                  {/* Environment Info */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Environment:
                    </h4>
                    <div className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded-lg">
                      <div>URL: {window.location.href}</div>
                      <div>User Agent: {navigator.userAgent}</div>
                      <div>Timestamp: {new Date().toISOString()}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Help Text */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  💡 Debugging Tips:
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Check the browser console (F12) for additional error details</li>
                  <li>• Verify all imported components and files exist</li>
                  <li>• Check for syntax errors in JSX components</li>
                  <li>• Ensure the backend API is running if using API calls</li>
                  <li>• Try refreshing the page or clearing browser cache</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EnhancedErrorBoundary;
