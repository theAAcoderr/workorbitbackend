import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning page
  },
})

// Request interceptor for adding auth token (if needed in the future)
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error)

    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 'An error occurred'
      throw new Error(message)
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error - please check your connection')
    } else {
      // Something else happened
      throw new Error('An unexpected error occurred')
    }
  }
)

// Job-related API calls
export const getJobs = async (params = {}) => {
  const searchParams = new URLSearchParams()

  if (params.search) searchParams.append('search', params.search)
  if (params.status) searchParams.append('status', params.status)
  if (params.location) searchParams.append('location', params.location)
  if (params.employmentType) searchParams.append('employmentType', params.employmentType)
  if (params.department) searchParams.append('department', params.department)
  if (params.page) searchParams.append('page', params.page)
  if (params.limit) searchParams.append('limit', params.limit)

  const url = `/public/jobs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  console.log('🌐 API Base URL:', API_BASE_URL)
  console.log('🔗 Full URL:', `${API_BASE_URL}${url}`)
  return api.get(url)
}

export const getJob = async (jobId) => {
  return api.get(`/public/jobs/${jobId}`)
}

export const getPublicJob = async (jobId) => {
  // Public endpoint that doesn't require authentication
  return api.get(`/public/jobs/${jobId}`)
}

// Application-related API calls
export const submitApplication = async (jobId, applicationData) => {
  return api.post(`/applications`, {
    jobId,
    ...applicationData
  })
}

export const trackApplication = async (trackingData) => {
  return api.post(`/applications/track`, trackingData)
}

export const getApplications = async (params = {}) => {
  const searchParams = new URLSearchParams()

  if (params.jobId) searchParams.append('jobId', params.jobId)
  if (params.status) searchParams.append('status', params.status)
  if (params.search) searchParams.append('search', params.search)
  if (params.page) searchParams.append('page', params.page)
  if (params.limit) searchParams.append('limit', params.limit)

  const url = `/applications${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  return api.get(url)
}

export const getApplication = async (applicationId) => {
  return api.get(`/applications/${applicationId}`)
}

export const updateApplicationStatus = async (applicationId, status, remarks) => {
  return api.patch(`/applications/${applicationId}/status`, { status, remarks })
}

export const addApplicationNote = async (applicationId, note) => {
  return api.post(`/applications/${applicationId}/notes`, { note })
}

export const bulkUpdateApplications = async (applicationIds, status) => {
  return api.post(`/applications/bulk-update`, { applicationIds, status })
}

export const sendNotification = async (applicationId, type, message) => {
  return api.post(`/applications/${applicationId}/notify`, { type, message })
}

// Statistics and Analytics
export const getRecruitmentStatistics = async () => {
  return api.get(`/recruitment/statistics`)
}

export const getJobAnalytics = async (jobId) => {
  return api.get(`/jobs/${jobId}/analytics`)
}

// File upload
export const uploadFile = async (file, type = 'resume') => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)

  return axios.post(`${API_BASE_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// Utility functions for API calls with better error handling
export const withErrorHandling = async (apiCall, defaultReturn = null) => {
  try {
    return await apiCall()
  } catch (error) {
    console.error('API call failed:', error)
    return defaultReturn
  }
}

// Helper function to create query string from object
export const createQueryString = (params) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value)
    }
  })

  return searchParams.toString()
}

export default api