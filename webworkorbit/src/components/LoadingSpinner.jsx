import { Briefcase, Sparkles } from 'lucide-react'

const LoadingSpinner = ({ size = 'default', text = 'Loading amazing opportunities...', fullScreen = true }) => {
  const content = (
    <div className="relative text-center p-12 rounded-3xl">
      {/* Main Spinner Container */}
      <div className="relative mb-8">
        {/* Outer Ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full border-4 border-primary-200 animate-pulse"></div>
        </div>

        {/* Middle Ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-t-primary-500 border-r-accent-500 border-b-primary-400 border-l-transparent animate-spin"></div>
        </div>

        {/* Inner Ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary-500 to-accent-500 animate-spin shadow-lg shadow-primary-500/50">
            <div className="w-full h-full rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
        </div>

        {/* Center Content */}
        <div className="w-32 h-32"></div>
      </div>

      {/* Loading Text with Animation */}
      <div className="space-y-3">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent animate-pulse">
          {text}
        </h3>

        {/* Loading Dots */}
        <div className="flex items-center justify-center space-x-2">
          <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
          <span className="w-2 h-2 bg-accent-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
          <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
          <span className="w-2 h-2 bg-accent-500 rounded-full animate-bounce" style={{ animationDelay: '0.6s' }}></span>
          <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.8s' }}></span>
        </div>

        {/* Sparkles Animation */}
        <div className="flex justify-center space-x-4 mt-4">
          <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
          <Sparkles className="w-6 h-6 text-primary-500 animate-spin" style={{ animationDuration: '3s' }} />
          <Sparkles className="w-5 h-5 text-accent-500 animate-pulse" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-8 w-64 mx-auto">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full shimmer"></div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 text-sm text-gray-500 animate-fade-in">
        <p className="italic">Finding the perfect match for your career...</p>
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-accent-50 to-primary-50 opacity-30 animate-pulse"></div>

        {content}

        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary-200 rounded-full blur-xl animate-float-1 opacity-50"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-accent-200 rounded-full blur-xl animate-float-2 opacity-50"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-yellow-200 rounded-full blur-xl animate-float-3 opacity-50"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {content}
    </div>
  )
}

export default LoadingSpinner