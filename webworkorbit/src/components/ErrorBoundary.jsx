import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // TODO: Send error to error tracking service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
          <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl overflow-hidden">
            <div className="bg-red-500 p-6">
              <div className="flex items-center justify-center">
                <AlertTriangle className="w-16 h-16 text-white" />
              </div>
            </div>

            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 mb-6 text-center">
                We're sorry for the inconvenience. An unexpected error occurred while processing your request.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <summary className="cursor-pointer font-semibold text-sm text-gray-700 mb-2">
                    Error Details (Dev Mode)
                  </summary>
                  <div className="text-xs text-red-600 font-mono overflow-auto">
                    <p className="font-bold mb-2">{this.state.error.toString()}</p>
                    <pre className="whitespace-pre-wrap">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Go to Home
                </button>
              </div>

              <p className="mt-6 text-xs text-gray-500 text-center">
                If this problem persists, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
