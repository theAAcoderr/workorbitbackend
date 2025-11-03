import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  MapPin,
  Clock,
  Calendar,
  Building,
  Users,
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  QrCode,
  Share2,
  Copy,
  Check
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import QRCodeDisplay from '../components/QRCodeDisplay'
import { getJob } from '../services/api'

const JobDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showQR, setShowQR] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    fetchJobDetails()
  }, [id])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showShareMenu && !event.target.closest('.share-menu-container')) {
        setShowShareMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showShareMenu])

  const fetchJobDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getJob(id)
      setJob(response.job)
    } catch (error) {
      console.error('Error fetching job details:', error)
      setError('Failed to load job details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatSalary = (min, max, currency = 'INR') => {
    if (!min && !max) return 'Salary not specified'
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`
    if (min) return `From ${currency} ${min.toLocaleString()}`
    return `Up to ${currency} ${max.toLocaleString()}`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'closed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleShare = (method) => {
    const jobUrl = window.location.href
    const jobTitle = job?.title || 'Job Opportunity'
    const company = job?.company || 'WorkOrbit'
    const shareText = `Check out this job opportunity: ${jobTitle} at ${company}`

    switch (method) {
      case 'copy':
        navigator.clipboard.writeText(jobUrl).then(() => {
          setCopiedLink(true)
          setTimeout(() => setCopiedLink(false), 2000)
        })
        break
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + jobUrl)}`, '_blank')
        break
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`, '_blank')
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(jobUrl)}`, '_blank')
        break
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(jobTitle + ' at ' + company)}&body=${encodeURIComponent(shareText + '\n\n' + jobUrl)}`, '_blank')
        break
      default:
        // Native share API for mobile or toggle menu
        if (navigator.share) {
          navigator.share({
            title: jobTitle,
            text: shareText,
            url: jobUrl
          }).catch(err => console.log('Error sharing:', err))
        } else {
          setShowShareMenu(!showShareMenu)
          return // Don't close menu when toggling
        }
    }
    // Only close menu for specific share methods
    if (method) {
      setShowShareMenu(false)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading job details..." />
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The job you are looking for does not exist.'}</p>
          <Link
            to="/jobs"
            className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 transition-colors text-sm sm:text-base"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5 sm:mr-2" />
        Back
      </button>

      {/* Job Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start mb-4 sm:mb-6 gap-3 sm:gap-4">
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 leading-tight">{job.title}</h1>
                <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium self-start ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center text-gray-600 mb-3 sm:mb-4 gap-1 sm:gap-0">
                <div className="flex items-center">
                  <Building className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                  <span className="text-base sm:text-lg font-medium">{job.company}</span>
                </div>
                {job.department && (
                  <>
                    <span className="mx-3 text-gray-300 hidden sm:inline">•</span>
                    <span className="text-sm sm:text-lg text-gray-500 ml-5 sm:ml-0">{job.department}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
              <button
                onClick={() => setShowQR(true)}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors text-xs sm:text-sm"
              >
                <QrCode className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="sm:hidden">QR</span>
                <span className="hidden sm:inline">QR Code</span>
              </button>
            </div>
          </div>

          {/* Job Info Grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500">Location</p>
                <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{job.location}</p>
              </div>
            </div>

            <div className="flex items-center">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500">Employment Type</p>
                <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{job.employmentType}</p>
              </div>
            </div>

            <div className="flex items-center">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500">Experience Level</p>
                <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{job.experienceLevel}</p>
              </div>
            </div>

            {(job.salaryMin || job.salaryMax) && (
              <div className="flex items-center">
                <span className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-gray-400 text-base sm:text-lg font-bold flex-shrink-0">₹</span>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">Salary</p>
                  <p className="font-medium text-primary-600 text-sm sm:text-base truncate">
                    {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            <Link
              to={`/jobs/${job.id}/apply`}
              className={`inline-flex items-center justify-center px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 rounded-md text-sm sm:text-base lg:text-lg font-medium transition-colors w-full sm:w-auto ${
                job.status === 'active'
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              {...(job.status !== 'active' && { disabled: true })}
            >
              <span className="sm:hidden">{job.status === 'active' ? 'Apply' : 'Closed'}</span>
              <span className="hidden sm:inline">{job.status === 'active' ? 'Apply Now' : 'Applications Closed'}</span>
            </Link>

            <div className="relative share-menu-container w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleShare()}
                className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors w-full sm:w-auto text-sm sm:text-base"
              >
                <Share2 className="h-4 w-4 mr-1.5 sm:mr-2" />
                <span className="sm:hidden">Share</span>
                <span className="hidden sm:inline">Share Job</span>
              </button>

              {/* Share Menu Dropdown */}
              {showShareMenu && (
                <div className="absolute right-0 sm:right-0 left-0 sm:left-auto mt-2 w-full sm:w-56 md:w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-[60] overflow-hidden" style={{display: 'block', visibility: 'visible'}}>
                  <button
                    onClick={() => handleShare('copy')}
                    className="w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3 text-green-500 flex-shrink-0" />
                        <span className="text-green-600 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3 flex-shrink-0" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                      <path d="M12 2C6.486 2 2 6.486 2 12c0 1.793.473 3.473 1.298 4.928L2 22l5.197-1.362A9.954 9.954 0 0012 22c5.514 0 10-4.486 10-10S17.514 2 12 2zm0 18c-1.601 0-3.099-.423-4.398-1.158l-.315-.186-3.267.856.869-3.173-.203-.324A7.959 7.959 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
                    </svg>
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => handleShare('linkedin')}
                    className="w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    <span>LinkedIn</span>
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    <span>Twitter</span>
                  </button>
                  <button
                    onClick={() => handleShare('email')}
                    className="w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Email</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="mt-8 space-y-8">
        {/* Description */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Description</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>
        </div>

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Requirements</h2>
            <ul className="space-y-3">
              {job.requirements.map((requirement, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{requirement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Responsibilities */}
        {job.responsibilities && job.responsibilities.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Responsibilities</h2>
            <ul className="space-y-3">
              {job.responsibilities.map((responsibility, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{responsibility}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Benefits */}
        {job.benefits && job.benefits.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Benefits & Perks</h2>
            <ul className="space-y-3">
              {job.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Required Skills</h2>
            <div className="flex flex-wrap gap-3">
              {job.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-primary-100 text-primary-800 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Job Meta Info */}
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm">
            <div>
              <p className="text-gray-500">Posted on</p>
              <p className="font-medium text-gray-900">{formatDate(job.createdAt)}</p>
            </div>
            {job.deadline && (
              <div>
                <p className="text-gray-500">Application Deadline</p>
                <p className="font-medium text-gray-900">{formatDate(job.deadline)}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500">Applications</p>
              <p className="font-medium text-gray-900">{job.applicationsCount || 0} received</p>
            </div>
            <div>
              <p className="text-gray-500">Job ID</p>
              <p className="font-medium text-gray-900">{job.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <QRCodeDisplay
          job={job}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  )
}

export default JobDetails