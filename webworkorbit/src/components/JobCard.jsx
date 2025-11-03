import { Link } from 'react-router-dom'
import { MapPin, Clock, Calendar, Building, TrendingUp, Users, Bookmark, ExternalLink } from 'lucide-react'
import appIcon from '../assets/app_icon.png'

const JobCard = ({ job, featured = false, showHotBadge = true }) => {
  const formatSalary = (min, max, currency = 'INR') => {
    if (!min && !max) return 'Salary not specified'
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`
    if (min) return `From ${currency} ${min.toLocaleString()}`
    return `Up to ${currency} ${max.toLocaleString()}`
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now - date
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'status-active'
      case 'draft':
        return 'status-draft'
      case 'closed':
        return 'status-closed'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isUrgent = () => {
    // Only show hot badge if job has a valid createdAt date
    if (!job.createdAt) return false

    const posted = new Date(job.createdAt)
    const now = new Date()

    // Check if date is valid
    if (isNaN(posted.getTime())) return false

    // Calculate difference in milliseconds
    const diffTime = now - posted

    // If the date is in the future, don't show hot badge
    if (diffTime < 0) return false

    // Convert to days
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // Only show hot badge for jobs posted within last 3 days
    return diffDays >= 0 && diffDays <= 3
  }

  const getCompanyInitials = (companyName) => {
    return companyName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={`group relative card-modern ${featured ? 'card-featured' : ''} animate-fade-in`}>
      {/* Urgent Badge - Only show if enabled and job is recent */}
      {showHotBadge && isUrgent() && (
        <div className="absolute top-2 left-4 sm:top-4 sm:left-6 lg:left-8 z-10">
          <div className="flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 bg-red-500 text-white text-xs font-semibold rounded-full animate-pulse">
            <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
            <span>New</span>
          </div>
        </div>
      )}

      {/* Bookmark Button */}
      <button className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-1.5 sm:p-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100">
        <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>

      <div className="p-3 pl-6 sm:p-4 sm:pl-8 lg:p-6 lg:pl-10">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-start space-x-2 sm:space-x-3 lg:space-x-4 flex-1">
            {/* Company Logo/Avatar */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow flex-shrink-0">
              {job.companyLogo ? (
                <img
                  src={job.companyLogo}
                  alt={`${job.company} logo`}
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = appIcon;
                  }}
                />
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src={appIcon}
                    alt="Company logo"
                    className="w-full h-full object-contain p-2"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-accent-50 opacity-30"></div>
                </div>
              )}
            </div>

            {/* Job Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                <Link
                  to={`/jobs/${job.id}`}
                  className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 hover:text-primary-600 transition-colors line-clamp-2 sm:line-clamp-1 group-hover:text-primary-600 leading-tight"
                >
                  {job.title}
                </Link>
                <span className={`status-badge ${getStatusColor(job.status)} self-start sm:self-center text-xs`}>
                  {job.status}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center text-gray-600 mb-2 gap-1 sm:gap-0">
                <div className="flex items-center">
                  <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium truncate">{job.company}</span>
                </div>
                {job.department && (
                  <>
                    <span className="mx-2 text-gray-300 hidden sm:inline">•</span>
                    <span className="text-xs sm:text-sm text-gray-500 sm:text-gray-600 ml-4 sm:ml-0">{job.department}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Job Details Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="flex items-center text-gray-600">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-gray-400" />
            <span className="text-xs sm:text-sm truncate">{job.location}</span>
          </div>

          <div className="flex items-center text-gray-600">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-gray-400" />
            <span className="text-xs sm:text-sm truncate">{job.employmentType}</span>
          </div>

          <div className="flex items-center text-gray-600">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-gray-400" />
            <span className="text-xs sm:text-sm truncate">{job.experienceLevel}</span>
          </div>

          {(job.salaryMin || job.salaryMax) && (
            <div className="flex items-center">
              <span className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-primary-600 font-bold text-sm sm:text-base">₹</span>
              <span className="text-xs sm:text-sm font-semibold text-primary-600 truncate">
                {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-700 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3 leading-relaxed">
          {job.description}
        </p>

        {/* Skills Tags */}
        {job.skills && job.skills.length > 0 && (
          <div className="mb-3 sm:mb-4">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <div className="sm:hidden flex flex-wrap gap-1.5">
                {job.skills.slice(0, 2).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full border border-primary-200 truncate max-w-20"
                  >
                    {skill}
                  </span>
                ))}
                {job.skills.length > 2 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    +{job.skills.length - 2}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-wrap gap-2">
                {job.skills.slice(0, 3).map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full border border-primary-200"
                  >
                    {skill}
                  </span>
                ))}
                {job.skills.length > 3 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    +{job.skills.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 sm:pt-4 border-t border-gray-100 gap-3 sm:gap-0">
          <div className="flex flex-col xs:flex-row xs:items-center text-gray-500 text-xs gap-2 xs:gap-3">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{formatDate(job.createdAt)}</span>
            </div>
            {job.applicationsCount > 0 && (
              <div className="flex items-center">
                <Users className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{job.applicationsCount} applied</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:space-x-2">
            <Link
              to={`/jobs/${job.id}`}
              className="btn-secondary text-xs px-3 py-1.5 sm:px-4 sm:py-2 flex-1 sm:flex-none text-center"
            >
              <span className="sm:hidden">Details</span>
              <span className="hidden sm:inline">View Details</span>
            </Link>
            <Link
              to={`/jobs/${job.id}/apply`}
              className={`btn-primary text-xs px-3 py-1.5 sm:px-4 sm:py-2 flex-1 sm:flex-none text-center ${
                job.status !== 'active'
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:shadow-lg transform hover:scale-105'
              }`}
              {...(job.status !== 'active' && { onClick: (e) => e.preventDefault() })}
            >
              <ExternalLink className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="sm:hidden">{job.status === 'active' ? 'Apply' : 'Closed'}</span>
              <span className="hidden sm:inline">{job.status === 'active' ? 'Apply Now' : 'Closed'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Hover Effect Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-accent-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  )
}

export default JobCard