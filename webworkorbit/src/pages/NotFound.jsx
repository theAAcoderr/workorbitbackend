import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            404
          </h1>
          <div className="mt-4 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
            </div>
            <Search className="w-20 h-20 text-blue-600 mx-auto relative z-10" />
          </div>
        </div>

        {/* Error Message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            Go to Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-gray-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4">You might be interested in:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/jobs"
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Browse Jobs
            </Link>
            <span className="text-gray-400">•</span>
            <Link
              to="/track"
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Track Application
            </Link>
            <span className="text-gray-400">•</span>
            <Link
              to="/saved"
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Saved Jobs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
