import { useState } from 'react'
import { Search, Clock, CheckCircle, AlertCircle, User, Building, MapPin } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { trackApplication } from '../services/api'

const TrackApplication = () => {
  const [formData, setFormData] = useState({
    trackingCode: '',
    securityPin: ''
  })
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.trackingCode.trim() || !formData.securityPin.trim()) {
      setError('Please enter both tracking code and security PIN')
      return
    }

    try {
      setLoading(true)
      setError('')
      const response = await trackApplication(formData)
      setApplication(response.application)
    } catch (error) {
      console.error('Error tracking application:', error)
      setError('Invalid tracking code or security PIN. Please check and try again.')
      setApplication(null)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'applied':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'screening':
        return <Search className="h-5 w-5 text-yellow-500" />
      case 'interview':
        return <User className="h-5 w-5 text-purple-500" />
      case 'selected':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'applied':
        return 'bg-blue-100 text-blue-800'
      case 'screening':
        return 'bg-yellow-100 text-yellow-800'
      case 'interview':
        return 'bg-purple-100 text-purple-800'
      case 'selected':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getNextSteps = (status) => {
    switch (status.toLowerCase()) {
      case 'applied':
        return 'Your application is being reviewed by our recruitment team. You will be notified once the initial screening is complete.'
      case 'screening':
        return 'Your application has passed the initial review. Our HR team is conducting a detailed screening of your profile.'
      case 'interview':
        return 'Congratulations! You have been shortlisted for an interview. Our team will contact you soon with interview details.'
      case 'selected':
        return 'Congratulations! You have been selected for this position. Our HR team will contact you with the next steps.'
      case 'rejected':
        return 'Thank you for your interest. While we were impressed with your background, we have decided to move forward with other candidates.'
      default:
        return 'Please check back later for updates on your application status.'
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8 px-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          Track Your Application
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
          Enter your tracking code and security PIN to check your application status
        </p>
      </div>

      {/* Tracking Form */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8 mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tracking Code
              </label>
              <input
                type="text"
                value={formData.trackingCode}
                onChange={(e) => handleInputChange('trackingCode', e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
                placeholder="WO2024ABC123"
                maxLength={12}
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: WO2024ABC123 (received via email/SMS)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Security PIN
              </label>
              <input
                type="text"
                value={formData.securityPin}
                onChange={(e) => handleInputChange('securityPin', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
                placeholder="4567"
                maxLength={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                4-digit PIN (received via email/SMS)
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Tracking...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Track Application
              </>
            )}
          </button>
        </form>
      </div>

      {/* Application Details */}
      {application && (
        <div className="space-y-6">
          {/* Application Overview */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Application Status</h2>
              <span className={`px-4 py-2 rounded-full text-sm font-medium self-start sm:self-auto ${getStatusColor(application.status)}`}>
                {application.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
              <div className="flex items-center">
                <Building className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="font-medium text-gray-900">{application.jobTitle}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Building className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium text-gray-900">{application.company}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Applied On</p>
                  <p className="font-medium text-gray-900">{formatDate(application.appliedAt)}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Search className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Tracking Code</p>
                  <p className="font-medium text-gray-900 font-mono">{formData.trackingCode}</p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">What's Next?</h3>
              <p className="text-sm sm:text-base text-gray-700">{getNextSteps(application.status)}</p>
            </div>
          </div>

          {/* Status Timeline */}
          {application.statusHistory && application.statusHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Application Timeline</h3>

              <div className="space-y-6">
                {application.statusHistory.map((history, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-gray-200">
                        {getStatusIcon(history.status)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h4 className="text-base sm:text-lg font-medium text-gray-900 capitalize">
                          {history.status}
                        </h4>
                        <time className="text-xs sm:text-sm text-gray-500">
                          {formatDate(history.changedAt)}
                        </time>
                      </div>

                      {history.remarks && (
                        <p className="mt-1 text-gray-600">{history.remarks}</p>
                      )}

                      {history.changedBy && (
                        <p className="mt-1 text-sm text-gray-500">
                          Updated by: {history.changedBy}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Need Help?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">General Inquiries</h4>
                <p className="text-gray-600">
                  For general questions about your application or the recruitment process, please contact our HR team.
                </p>
                <p className="text-primary-600 mt-2">
                  <a href="mailto:careers@workorbit.com">careers@workorbit.com</a>
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Technical Support</h4>
                <p className="text-gray-600">
                  Having trouble with tracking your application? Contact our technical support team.
                </p>
                <p className="text-primary-600 mt-2">
                  <a href="mailto:support@workorbit.com">support@workorbit.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      {!application && (
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6 lg:p-8">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Don't have your tracking details?
          </h3>
          <div className="space-y-4 text-sm sm:text-base text-gray-600">
            <p>
              Your tracking code and security PIN were sent to you via email and SMS immediately after submitting your application.
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Check your email inbox and spam folder</li>
              <li>Check your SMS messages</li>
              <li>The tracking code format is: WO2024ABC123</li>
              <li>The security PIN is a 4-digit number</li>
            </ul>
            <p>
              If you still can't find your tracking details, please contact us at{' '}
              <a href="mailto:support@workorbit.com" className="text-primary-600 hover:underline">
                support@workorbit.com
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrackApplication