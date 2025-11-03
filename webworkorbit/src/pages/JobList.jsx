import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock, DollarSign, Users, Search, Filter, Briefcase, Grid, List, SlidersHorizontal, TrendingUp, Star, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import JobCard from '../components/JobCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { getJobs } from '../services/api'

const JobList = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Optimized animations for better performance
  const customStyles = `
    @keyframes float-simple {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    @keyframes pulse-simple {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.6; }
    }
    @keyframes fade-in-up {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes fade-in-scale {
      0% { opacity: 0; transform: scale(0.95); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes scale-in {
      0% { opacity: 0; transform: scale(0.9); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes animated-gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes drive-across {
      0% {
        transform: translateX(-120px) translateY(0px) scale(0.8);
        opacity: 0;
      }
      10% {
        opacity: 1;
        transform: translateX(-100px) translateY(0px) scale(0.8);
      }
      50% {
        transform: translateX(50vw) translateY(-5px) scale(1);
        opacity: 1;
      }
      90% {
        opacity: 1;
        transform: translateX(calc(100vw + 50px)) translateY(0px) scale(0.8);
      }
      100% {
        transform: translateX(calc(100vw + 120px)) translateY(0px) scale(0.8);
        opacity: 0;
      }
    }
    @keyframes wheel-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes bounce-slight {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-2px); }
    }
    .animate-float-simple { animation: float-simple 8s ease-in-out infinite; will-change: transform; }
    .animate-pulse-simple { animation: pulse-simple 6s ease-in-out infinite; will-change: opacity; }
    .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
    .animate-fade-in-scale { animation: fade-in-scale 0.4s ease-out forwards; }
    .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
    .animate-gradient {
      background: linear-gradient(-45deg, #2563eb, #8b5cf6, #ec4899, #f97316, #06b6d4, #8b5cf6);
      background-size: 400% 400%;
      animation: animated-gradient 4s ease infinite;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .animate-car {
      animation: drive-across 12s ease-in-out infinite;
      will-change: transform, opacity;
    }
    .animate-wheel {
      animation: wheel-spin 0.5s linear infinite;
      transform-origin: center;
    }
    .animate-car-bounce {
      animation: bounce-slight 1s ease-in-out infinite;
    }

    /* Use transform3d for GPU acceleration */
    .gpu-accelerated { transform: translate3d(0, 0, 0); }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .animate-float-simple,
      .animate-pulse-simple,
      .animate-fade-in-up,
      .animate-fade-in-scale,
      .animate-scale-in,
      .animate-gradient {
        animation: none;
      }
    }
  `
  const [filters, setFilters] = useState({
    location: '',
    employmentType: '',
    department: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [jobsPerPage] = useState(8)

  const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations']
  const locations = ['Remote', 'New York', 'San Francisco', 'London', 'Berlin', 'Toronto']

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'title', label: 'Job Title A-Z' },
    { value: 'company', label: 'Company A-Z' },
    { value: 'salary', label: 'Highest Salary' }
  ]

  useEffect(() => {
    // Inject custom styles
    const styleElement = document.createElement('style')
    styleElement.textContent = customStyles
    document.head.appendChild(styleElement)

    fetchJobs()

    // Cleanup styles on unmount
    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement)
      }
    }
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching jobs with params:', { search: searchTerm, ...filters })
      const response = await getJobs({
        search: searchTerm,
        ...filters
      })
      console.log('✅ Jobs response:', response)
      console.log('📊 Jobs array:', response.jobs)
      console.log('📈 Total jobs:', response.jobs?.length || 0)
      setJobs(response.jobs || [])
    } catch (error) {
      console.error('❌ Error fetching jobs:', error)
      console.error('Error details:', error.message)
      console.error('Error stack:', error.stack)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchJobs()
  }

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }))
  }

  const clearFilters = () => {
    setFilters({
      location: '',
      employmentType: '',
      department: ''
    })
    setSearchTerm('')
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesLocation = !filters.location || job.location === filters.location
    const matchesEmploymentType = !filters.employmentType || job.employmentType === filters.employmentType
    const matchesDepartment = !filters.department || job.department === filters.department

    return matchesSearch && matchesLocation && matchesEmploymentType && matchesDepartment
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt)
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt)
      case 'title':
        return a.title.localeCompare(b.title)
      case 'company':
        return a.company.localeCompare(b.company)
      case 'salary':
        return (b.salaryMax || 0) - (a.salaryMax || 0)
      default:
        return 0
    }
  })

  // Pagination calculations
  const totalJobs = filteredJobs.length
  const totalPages = Math.ceil(totalJobs / jobsPerPage)
  const indexOfLastJob = currentPage * jobsPerPage
  const indexOfFirstJob = indexOfLastJob - jobsPerPage
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters, sortBy])

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Simplified Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10">
        {/* Reduced Floating Shapes */}
        <div className="absolute top-20 left-10 w-24 h-24 bg-gradient-to-br from-blue-400/15 to-purple-400/15 rounded-full blur-lg animate-float-simple gpu-accelerated"></div>
        <div className="absolute bottom-40 right-20 w-20 h-20 bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full blur-lg animate-pulse-simple gpu-accelerated"></div>

        {/* Static Gradient Orbs */}
        <div className="absolute -top-40 -right-40 w-60 h-60 bg-gradient-to-br from-blue-600/5 to-purple-600/5 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-40 -left-40 w-60 h-60 bg-gradient-to-tr from-purple-600/5 to-pink-600/5 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="relative text-center mb-16 py-12">
          {/* Simplified Hero Background */}
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full">
              <div className="w-full h-full bg-gradient-to-r from-primary-500/3 via-accent-500/3 to-primary-500/3 rounded-3xl blur-2xl"></div>
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-2 text-primary-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-primary-100 shadow-sm">
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm font-semibold tracking-wide uppercase">Featured Jobs</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold animate-gradient mb-6 animate-fade-in-up">
              Find Your Dream Career
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed px-4 bg-white/60 backdrop-blur-sm rounded-2xl py-4">
              Discover exciting career opportunities at innovative companies. Join thousands of professionals who found their perfect job match through our platform.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                <Briefcase className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{jobs.length}+ Active Jobs</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                <Users className="h-4 w-4 text-green-500" />
                <span className="font-medium">500+ Companies</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">95% Success Rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="relative">
          <div className="card-modern p-6 lg:p-8 mb-8 backdrop-blur-sm bg-white/95 border border-white/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-8">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search jobs, companies, or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input pl-4 pr-12 py-4 text-base w-full relative z-0"
                  />
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
                </div>
              </div>
              <div className="lg:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`btn-secondary w-full py-4 ${showFilters ? 'bg-primary-50 border-primary-200 text-primary-700' : ''}`}
                >
                  <SlidersHorizontal className="h-5 w-5 mr-2" />
                  Filters
                  {Object.values(filters).some(f => f) && (
                    <span className="ml-2 px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                      {Object.values(filters).filter(f => f).length}
                    </span>
                  )}
                </button>
              </div>
              <div className="lg:col-span-2">
                <button
                  type="submit"
                  className="btn-primary w-full py-4"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="border-t border-gray-200 pt-6 mt-6 bg-gray-50/50 rounded-xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="form-group">
                    <label className="form-label">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Location
                    </label>
                    <select
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className="form-input"
                    >
                      <option value="">All Locations</option>
                      {locations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Job Type
                    </label>
                    <select
                      value={filters.employmentType}
                      onChange={(e) => handleFilterChange('employmentType', e.target.value)}
                      className="form-input"
                    >
                      <option value="">All Types</option>
                      {employmentTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <Briefcase className="h-4 w-4 inline mr-1" />
                      Department
                    </label>
                    <select
                      value={filters.department}
                      onChange={(e) => handleFilterChange('department', e.target.value)}
                      className="form-input"
                    >
                      <option value="">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <Filter className="h-4 w-4 inline mr-1" />
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="form-input"
                    >
                      {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="btn-ghost text-sm"
                  >
                    Clear All Filters
                  </button>
                  <div className="text-sm text-gray-500">
                    {totalJobs} jobs match your criteria
                  </div>
                </div>
              </div>
            )}
          </form>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              {totalJobs} {totalJobs === 1 ? 'Job' : 'Jobs'} Found
            </h2>
            <p className="text-gray-600 mt-1">
              {searchTerm && `Showing results for "${searchTerm}" • `}
              {totalJobs > 0 && `Showing ${indexOfFirstJob + 1}-${Math.min(indexOfLastJob, totalJobs)} of ${totalJobs} jobs`}
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Job Cards */}
        {totalJobs === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Briefcase className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We couldn't find any jobs matching your criteria. Try adjusting your search terms or filters.
            </p>
            <button
              onClick={clearFilters}
              className="btn-primary hover:shadow-lg transition-shadow duration-200"
            >
              Clear Filters & Show All Jobs
            </button>
          </div>
        ) : (
          <div
            className={`grid gap-4 sm:gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            {currentJobs.map((job, index) => (
              <div
                key={job.id}
                className="animate-fade-in-scale"
                style={{ animationDelay: `${Math.min(index * 0.02, 0.3)}s` }}
              >
                <JobCard
                  job={job}
                  featured={index < 2 && currentPage === 1}
                />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalJobs > jobsPerPage && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Pagination Info */}
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{indexOfFirstJob + 1}</span> to{' '}
              <span className="font-medium">{Math.min(indexOfLastJob, totalJobs)}</span> of{' '}
              <span className="font-medium">{totalJobs}</span> results
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center space-x-2">
              {/* Previous Button */}
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => {
                  const pageNumber = i + 1
                  const isCurrentPage = pageNumber === currentPage

                  // Show first page, last page, current page, and pages around current page
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => paginate(pageNumber)}
                        className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          isCurrentPage
                            ? 'bg-primary-500 text-white'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  }

                  // Show ellipsis
                  if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return (
                      <span
                        key={pageNumber}
                        className="relative inline-flex items-center px-3 py-2 text-sm text-gray-500"
                      >
                        ...
                      </span>
                    )
                  }

                  return null
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default JobList