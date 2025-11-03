import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, FileText,
  Upload, ArrowLeft, CheckCircle, Award, Globe, Calendar,
  DollarSign, Shield, Paperclip, X, AlertCircle, Plus, Trash2,
  Building, Users, Languages, Star, Link, Github, Twitter
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { getJob, submitApplication } from '../services/api'
import axios from 'axios'

const ApplicationFormEnhanced = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [applicationResult, setApplicationResult] = useState(null)
  const [activeTab, setActiveTab] = useState('personal')

  // Form Data State
  const [formData, setFormData] = useState({
    candidateInfo: {
      // Personal Information
      name: '',
      email: '',
      phone: '',
      alternatePhone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      dateOfBirth: '',
      gender: '',
      maritalStatus: '',
      nationality: '',

      // Professional Information
      currentCompany: '',
      currentPosition: '',
      experience: '',
      totalExperience: '',
      relevantExperience: '',
      currentSalary: '',
      expectedSalary: '',
      noticePeriod: '',
      availableFrom: '',
      willingToRelocate: '',
      preferredLocation: '',

      // Education
      education: '',
      highestQualification: '',
      university: '',
      graduationYear: '',
      specialization: '',

      // Skills & Languages
      skills: [],
      languages: [],
      certifications: [],

      // Online Profiles
      linkedin: '',
      portfolio: '',
      github: '',
      twitter: '',

      // References
      references: [],

      // Emergency Contact
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: ''
    },
    coverLetter: '',
    whyJoin: '',
    achievements: '',
    additionalInfo: {},
    documents: []
  })

  // File Upload State
  const [uploadedFiles, setUploadedFiles] = useState({
    resume: null,
    coverLetter: null,
    portfolio: null,
    certificates: [],
    otherDocuments: []
  })

  // Dynamic Fields State
  const [skills, setSkills] = useState([])
  const [currentSkill, setCurrentSkill] = useState('')
  const [languages, setLanguages] = useState([])
  const [currentLanguage, setCurrentLanguage] = useState({ name: '', proficiency: '' })
  const [certifications, setCertifications] = useState([])
  const [currentCertification, setCurrentCertification] = useState({ name: '', issuer: '', year: '' })
  const [references, setReferences] = useState([])
  const [currentReference, setCurrentReference] = useState({ name: '', position: '', company: '', email: '', phone: '' })

  const [errors, setErrors] = useState({})
  const [uploadProgress, setUploadProgress] = useState({})

  const fileInputRefs = {
    resume: useRef(null),
    coverLetter: useRef(null),
    portfolio: useRef(null),
    certificates: useRef(null),
    otherDocuments: useRef(null)
  }

  // Tab Configuration
  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills & Languages', icon: Award },
    { id: 'documents', label: 'Documents', icon: Paperclip },
    { id: 'additional', label: 'Additional Info', icon: FileText }
  ]

  useEffect(() => {
    fetchJobDetails()
  }, [id])

  const fetchJobDetails = async () => {
    try {
      setLoading(true)
      const response = await getJob(id)
      setJob(response.job)
    } catch (error) {
      console.error('Error fetching job details:', error)
      navigate('/jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value, nested = false) => {
    if (nested) {
      setFormData(prev => ({
        ...prev,
        candidateInfo: {
          ...prev.candidateInfo,
          [field]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  // File upload handler
  const handleFileUpload = async (event, fileType) => {
    const files = Array.from(event.target.files)
    if (!files.length) return

    const formData = new FormData()

    // Determine if this is a multiple file upload
    const isMultiple = fileType === 'certificates' || fileType === 'otherDocuments'

    if (isMultiple) {
      files.forEach(file => {
        formData.append('files', file)
      })
    } else {
      formData.append('file', files[0])
    }

    formData.append('folder', `recruitment/${fileType}`)

    try {
      setUploadProgress(prev => ({ ...prev, [fileType]: 0 }))

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/media/upload/${isMultiple ? 'multiple' : 'single'}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(prev => ({ ...prev, [fileType]: percentCompleted }))
          }
        }
      )

      if (response.data.success) {
        if (fileType === 'certificates' || fileType === 'otherDocuments') {
          setUploadedFiles(prev => ({
            ...prev,
            [fileType]: [...prev[fileType], ...(response.data.data.uploaded || [response.data.data])]
          }))
        } else {
          setUploadedFiles(prev => ({
            ...prev,
            [fileType]: response.data.data
          }))
        }
      }

      setUploadProgress(prev => ({ ...prev, [fileType]: null }))
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file. Please try again.')
      setUploadProgress(prev => ({ ...prev, [fileType]: null }))
    }
  }

  const removeUploadedFile = (fileType, index = null) => {
    if (fileType === 'certificates' || fileType === 'otherDocuments') {
      setUploadedFiles(prev => ({
        ...prev,
        [fileType]: prev[fileType].filter((_, i) => i !== index)
      }))
    } else {
      setUploadedFiles(prev => ({
        ...prev,
        [fileType]: null
      }))
    }
  }

  // Add/Remove Skills
  const addSkill = () => {
    if (currentSkill.trim()) {
      const newSkills = [...skills, currentSkill.trim()]
      setSkills(newSkills)
      setCurrentSkill('')
      setFormData(prev => ({
        ...prev,
        candidateInfo: {
          ...prev.candidateInfo,
          skills: newSkills
        }
      }))
    }
  }

  const removeSkill = (index) => {
    const newSkills = skills.filter((_, i) => i !== index)
    setSkills(newSkills)
    setFormData(prev => ({
      ...prev,
      candidateInfo: {
        ...prev.candidateInfo,
        skills: newSkills
      }
    }))
  }

  // Add/Remove Languages
  const addLanguage = () => {
    if (currentLanguage.name && currentLanguage.proficiency) {
      const newLanguages = [...languages, currentLanguage]
      setLanguages(newLanguages)
      setCurrentLanguage({ name: '', proficiency: '' })
      setFormData(prev => ({
        ...prev,
        candidateInfo: {
          ...prev.candidateInfo,
          languages: newLanguages
        }
      }))
    }
  }

  const removeLanguage = (index) => {
    const newLanguages = languages.filter((_, i) => i !== index)
    setLanguages(newLanguages)
    setFormData(prev => ({
      ...prev,
      candidateInfo: {
        ...prev.candidateInfo,
        languages: newLanguages
      }
    }))
  }

  // Add/Remove Certifications
  const addCertification = () => {
    if (currentCertification.name && currentCertification.issuer) {
      const newCertifications = [...certifications, currentCertification]
      setCertifications(newCertifications)
      setCurrentCertification({ name: '', issuer: '', year: '' })
      setFormData(prev => ({
        ...prev,
        candidateInfo: {
          ...prev.candidateInfo,
          certifications: newCertifications
        }
      }))
    }
  }

  const removeCertification = (index) => {
    const newCertifications = certifications.filter((_, i) => i !== index)
    setCertifications(newCertifications)
    setFormData(prev => ({
      ...prev,
      candidateInfo: {
        ...prev.candidateInfo,
        certifications: newCertifications
      }
    }))
  }

  // Add/Remove References
  const addReference = () => {
    if (currentReference.name && currentReference.email) {
      const newReferences = [...references, currentReference]
      setReferences(newReferences)
      setCurrentReference({ name: '', position: '', company: '', email: '', phone: '' })
      setFormData(prev => ({
        ...prev,
        candidateInfo: {
          ...prev.candidateInfo,
          references: newReferences
        }
      }))
    }
  }

  const removeReference = (index) => {
    const newReferences = references.filter((_, i) => i !== index)
    setReferences(newReferences)
    setFormData(prev => ({
      ...prev,
      candidateInfo: {
        ...prev.candidateInfo,
        references: newReferences
      }
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.candidateInfo.name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (!formData.candidateInfo.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.candidateInfo.email)) {
      newErrors.email = 'Email is invalid'
    }
    if (!formData.candidateInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      setActiveTab('personal')
      return
    }

    try {
      setSubmitting(true)

      const submissionData = {
        ...formData,
        documents: [],
        resume: uploadedFiles.resume?.url || formData.resume,
        portfolioUrl: uploadedFiles.portfolio?.url || formData.candidateInfo.portfolio
      }

      // Add document URLs
      if (uploadedFiles.resume) {
        submissionData.documents.push({
          type: 'resume',
          url: uploadedFiles.resume.url,
          key: uploadedFiles.resume.key
        })
      }

      if (uploadedFiles.certificates) {
        uploadedFiles.certificates.forEach(cert => {
          submissionData.documents.push({
            type: 'certificate',
            url: cert.url,
            key: cert.key,
            originalName: cert.originalName
          })
        })
      }

      const response = await submitApplication(id, submissionData)
      setApplicationResult(response.application)
      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading application form..." />
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h2>
          <p className="text-gray-600 mb-6">The job you are trying to apply for does not exist.</p>
          <button
            onClick={() => navigate('/jobs')}
            className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </button>
        </div>
      </div>
    )
  }

  if (submitted && applicationResult) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your application for <strong>{job.title}</strong> at <strong>{job.company}</strong> has been successfully submitted.
          </p>
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Important: Save These Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Tracking Code</p>
                <p className="text-2xl font-bold text-primary-600 font-mono">
                  {applicationResult.trackingCode}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Security PIN</p>
                <p className="text-xl font-bold text-primary-600 font-mono">
                  {applicationResult.securityPin}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/track')}
              className="px-6 py-3 bg-primary-500 text-white rounded-md hover:bg-primary-600"
            >
              Track Application
            </button>
            <button
              onClick={() => navigate('/jobs')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Browse More Jobs
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Apply for {job.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
            <span>{job.company}</span>
            <span className="hidden sm:inline mx-2">•</span>
            <span>{job.location}</span>
            <span className="hidden sm:inline mx-2">•</span>
            <span>{job.employmentType}</span>
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-fit px-3 sm:px-4 py-3 flex items-center justify-center gap-1 sm:gap-2 border-b-2 transition-colors text-xs sm:text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium whitespace-nowrap">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.candidateInfo.name}
                    onChange={(e) => handleInputChange('name', e.target.value, true)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.candidateInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value, true)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="email@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.candidateInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value, true)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+1234567890"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alternate Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.candidateInfo.alternatePhone}
                    onChange={(e) => handleInputChange('alternatePhone', e.target.value, true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.candidateInfo.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value, true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.candidateInfo.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value, true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marital Status
                  </label>
                  <select
                    value={formData.candidateInfo.maritalStatus}
                    onChange={(e) => handleInputChange('maritalStatus', e.target.value, true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nationality
                  </label>
                  <input
                    type="text"
                    value={formData.candidateInfo.nationality}
                    onChange={(e) => handleInputChange('nationality', e.target.value, true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Your nationality"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={formData.candidateInfo.address}
                      onChange={(e) => handleInputChange('address', e.target.value, true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="123 Main Street, Apt 4B"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.candidateInfo.city}
                      onChange={(e) => handleInputChange('city', e.target.value, true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State/Province
                    </label>
                    <input
                      type="text"
                      value={formData.candidateInfo.state}
                      onChange={(e) => handleInputChange('state', e.target.value, true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="NY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.candidateInfo.country}
                      onChange={(e) => handleInputChange('country', e.target.value, true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="United States"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP/Postal Code
                    </label>
                    <input
                      type="text"
                      value={formData.candidateInfo.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value, true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="10001"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.candidateInfo.emergencyContactName}
                      onChange={(e) => handleInputChange('emergencyContactName', e.target.value, true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Emergency contact name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.candidateInfo.emergencyContactPhone}
                      onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value, true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Emergency contact phone"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship
                    </label>
                    <input
                      type="text"
                      value={formData.candidateInfo.emergencyContactRelation}
                      onChange={(e) => handleInputChange('emergencyContactRelation', e.target.value, true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Relationship"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Professional Information Tab */}
          {activeTab === 'professional' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Professional Information</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Company
                  </label>
                  <input
                    type="text"
                    value={formData.candidateInfo.currentCompany}
                    onChange={(e) => handleInputChange('currentCompany', e.target.value, true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Current company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Position
                  </label>
                  <input
                    type="text"
                    value={formData.candidateInfo.currentPosition}
                    onChange={(e) => handleInputChange('currentPosition', e.target.value, true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Current job title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Experience
                  </label>
                  <select
                    value={formData.candidateInfo.totalExperience}
                    onChange={(e) => handleInputChange('totalExperience', e.target.value, true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select experience</option>
                    <option value="Fresher">Fresher</option>
                    <option value="0-1 years">0-1 years</option>
                    <option value="1-3 years">1-3 years</option>
                    <option value="3-5 years">3-5 years</option>
                    <option value="5-8 years">5-8 years</option>
                    <option value="8-10 years">8-10 years</option>
                    <option value="10+ years">10+ years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relevant Experience
                  </label>
                  <input
                    type="text"
                    value={formData.candidateInfo.relevantExperience}
                    onChange={(e) => handleInputChange('relevantExperience', e.target.value, true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Years of relevant experience"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Salary (Annual)
                  </label>
                  <input
                    type="text"
                    value={formData.candidateInfo.currentSalary}
                    onChange={(e) => handleInputChange('currentSalary', e.target.value, true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="$50,000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Salary (Annual)
                  </label>
                  <input
                    type="text"
                    value={formData.candidateInfo.expectedSalary}
                    onChange={(e) => handleInputChange('expectedSalary', e.target.value, true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="$60,000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notice Period
                  </label>
                  <select
                    value={formData.candidateInfo.noticePeriod}
                    onChange={(e) => handleInputChange('noticePeriod', e.target.value, true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select notice period</option>
                    <option value="Immediate">Immediate</option>
                    <option value="15 days">15 days</option>
                    <option value="1 month">1 month</option>
                    <option value="2 months">2 months</option>
                    <option value="3 months">3 months</option>
                    <option value="More than 3 months">More than 3 months</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available From
                  </label>
                  <input
                    type="date"
                    value={formData.candidateInfo.availableFrom}
                    onChange={(e) => handleInputChange('availableFrom', e.target.value, true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Willing to Relocate?
                  </label>
                  <select
                    value={formData.candidateInfo.willingToRelocate}
                    onChange={(e) => handleInputChange('willingToRelocate', e.target.value, true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Depends on opportunity">Depends on opportunity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Location
                  </label>
                  <input
                    type="text"
                    value={formData.candidateInfo.preferredLocation}
                    onChange={(e) => handleInputChange('preferredLocation', e.target.value, true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Preferred work location"
                  />
                </div>
              </div>

              {/* References Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Professional References</h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <input
                      type="text"
                      value={currentReference.name}
                      onChange={(e) => setCurrentReference({...currentReference, name: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      value={currentReference.position}
                      onChange={(e) => setCurrentReference({...currentReference, position: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Position"
                    />
                    <input
                      type="text"
                      value={currentReference.company}
                      onChange={(e) => setCurrentReference({...currentReference, company: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Company"
                    />
                    <input
                      type="email"
                      value={currentReference.email}
                      onChange={(e) => setCurrentReference({...currentReference, email: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Email"
                    />
                    <button
                      type="button"
                      onClick={addReference}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                    >
                      <Plus className="h-5 w-5 mx-auto" />
                    </button>
                  </div>

                  {references.length > 0 && (
                    <div className="space-y-2">
                      {references.map((ref, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{ref.name}</p>
                            <p className="text-sm text-gray-600">{ref.position} at {ref.company}</p>
                            <p className="text-sm text-gray-500">{ref.email}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeReference(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Education Tab */}
          {activeTab === 'education' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Education Details</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Highest Qualification
                  </label>
                  <select
                    value={formData.candidateInfo.highestQualification}
                    onChange={(e) => handleInputChange('highestQualification', e.target.value, true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select qualification</option>
                    <option value="High School">High School</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Bachelor's Degree">Bachelor's Degree</option>
                    <option value="Master's Degree">Master's Degree</option>
                    <option value="PhD">PhD</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization/Major
                  </label>
                  <input
                    type="text"
                    value={formData.candidateInfo.specialization}
                    onChange={(e) => handleInputChange('specialization', e.target.value, true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Computer Science, MBA, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    University/College
                  </label>
                  <input
                    type="text"
                    value={formData.candidateInfo.university}
                    onChange={(e) => handleInputChange('university', e.target.value, true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="University name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Graduation Year
                  </label>
                  <input
                    type="text"
                    value={formData.candidateInfo.graduationYear}
                    onChange={(e) => handleInputChange('graduationYear', e.target.value, true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="2020"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Education Details
                </label>
                <textarea
                  value={formData.candidateInfo.education}
                  onChange={(e) => handleInputChange('education', e.target.value, true)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Provide additional education details, certifications, courses, etc."
                />
              </div>
            </div>
          )}

          {/* Skills & Languages Tab */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Skills & Languages</h2>

              {/* Skills Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Technical Skills</h3>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter a skill (e.g., JavaScript, Project Management)"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    Add Skill
                  </button>
                </div>

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className="ml-2 text-primary-500 hover:text-primary-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Languages Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Languages</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={currentLanguage.name}
                    onChange={(e) => setCurrentLanguage({...currentLanguage, name: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Language (e.g., English)"
                  />
                  <select
                    value={currentLanguage.proficiency}
                    onChange={(e) => setCurrentLanguage({...currentLanguage, proficiency: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select proficiency</option>
                    <option value="Native">Native</option>
                    <option value="Fluent">Fluent</option>
                    <option value="Professional">Professional</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Basic">Basic</option>
                  </select>
                  <button
                    type="button"
                    onClick={addLanguage}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    Add Language
                  </button>
                </div>

                {languages.length > 0 && (
                  <div className="space-y-2">
                    {languages.map((lang, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">{lang.name}</span>
                          <span className="ml-2 text-sm text-gray-600">({lang.proficiency})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLanguage(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Certifications Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Professional Certifications</h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={currentCertification.name}
                    onChange={(e) => setCurrentCertification({...currentCertification, name: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Certification name"
                  />
                  <input
                    type="text"
                    value={currentCertification.issuer}
                    onChange={(e) => setCurrentCertification({...currentCertification, issuer: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Issuing organization"
                  />
                  <input
                    type="text"
                    value={currentCertification.year}
                    onChange={(e) => setCurrentCertification({...currentCertification, year: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Year"
                  />
                  <button
                    type="button"
                    onClick={addCertification}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    Add Certification
                  </button>
                </div>

                {certifications.length > 0 && (
                  <div className="space-y-2">
                    {certifications.map((cert, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{cert.name}</p>
                          <p className="text-sm text-gray-600">{cert.issuer} • {cert.year}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCertification(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Online Profiles */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Online Profiles</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Globe className="inline h-4 w-4 mr-1" />
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      value={formData.candidateInfo.linkedin}
                      onChange={(e) => handleInputChange('linkedin', e.target.value, true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Github className="inline h-4 w-4 mr-1" />
                      GitHub Profile
                    </label>
                    <input
                      type="url"
                      value={formData.candidateInfo.github}
                      onChange={(e) => handleInputChange('github', e.target.value, true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Link className="inline h-4 w-4 mr-1" />
                      Portfolio Website
                    </label>
                    <input
                      type="url"
                      value={formData.candidateInfo.portfolio}
                      onChange={(e) => handleInputChange('portfolio', e.target.value, true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Twitter className="inline h-4 w-4 mr-1" />
                      Twitter/X Profile
                    </label>
                    <input
                      type="url"
                      value={formData.candidateInfo.twitter}
                      onChange={(e) => handleInputChange('twitter', e.target.value, true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="https://twitter.com/yourusername"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Documents</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Resume Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resume/CV *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {uploadedFiles.resume ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{uploadedFiles.resume.originalName}</span>
                        <button
                          type="button"
                          onClick={() => removeUploadedFile('resume')}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          ref={fileInputRefs.resume}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileUpload(e, 'resume')}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRefs.resume.current?.click()}
                          className="w-full flex items-center justify-center gap-2 py-2 text-primary-600 hover:text-primary-700"
                        >
                          <Upload className="h-5 w-5" />
                          <span>Upload Resume</span>
                        </button>
                      </>
                    )}
                    {uploadProgress.resume !== null && uploadProgress.resume !== undefined && (
                      <div className="mt-2">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full"
                            style={{ width: `${uploadProgress.resume}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cover Letter Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {uploadedFiles.coverLetter ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{uploadedFiles.coverLetter.originalName}</span>
                        <button
                          type="button"
                          onClick={() => removeUploadedFile('coverLetter')}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          ref={fileInputRefs.coverLetter}
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={(e) => handleFileUpload(e, 'coverLetter')}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRefs.coverLetter.current?.click()}
                          className="w-full flex items-center justify-center gap-2 py-2 text-primary-600 hover:text-primary-700"
                        >
                          <Upload className="h-5 w-5" />
                          <span>Upload Cover Letter</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Portfolio Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Portfolio (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {uploadedFiles.portfolio ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{uploadedFiles.portfolio.originalName}</span>
                        <button
                          type="button"
                          onClick={() => removeUploadedFile('portfolio')}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          ref={fileInputRefs.portfolio}
                          type="file"
                          accept=".pdf,.zip"
                          onChange={(e) => handleFileUpload(e, 'portfolio')}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRefs.portfolio.current?.click()}
                          className="w-full flex items-center justify-center gap-2 py-2 text-primary-600 hover:text-primary-700"
                        >
                          <Upload className="h-5 w-5" />
                          <span>Upload Portfolio</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Certificates Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificates (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      ref={fileInputRefs.certificates}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      onChange={(e) => handleFileUpload(e, 'certificates')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.certificates.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-2 text-primary-600 hover:text-primary-700"
                    >
                      <Upload className="h-5 w-5" />
                      <span>Upload Certificates</span>
                    </button>
                    {uploadedFiles.certificates.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {uploadedFiles.certificates.map((cert, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{cert.originalName}</span>
                            <button
                              type="button"
                              onClick={() => removeUploadedFile('certificates', index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Information Tab */}
          {activeTab === 'additional' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why do you want to join our company?
                </label>
                <textarea
                  value={formData.whyJoin}
                  onChange={(e) => handleInputChange('whyJoin', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Tell us why you're interested in this position and our company..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Achievements
                </label>
                <textarea
                  value={formData.achievements}
                  onChange={(e) => handleInputChange('achievements', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Share your most significant professional achievements..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter
                </label>
                <textarea
                  value={formData.coverLetter}
                  onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Write your cover letter here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Comments
                </label>
                <textarea
                  value={formData.additionalInfo.comments || ''}
                  onChange={(e) => handleInputChange('additionalInfo', {...formData.additionalInfo, comments: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Any other information you'd like to share..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={() => {
              const currentIndex = tabs.findIndex(tab => tab.id === activeTab)
              if (currentIndex > 0) {
                setActiveTab(tabs[currentIndex - 1].id)
              }
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={activeTab === tabs[0].id}
          >
            Previous
          </button>

          {activeTab === tabs[tabs.length - 1].id ? (
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-400"
            >
              {submitting ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const currentIndex = tabs.findIndex(tab => tab.id === activeTab)
                if (currentIndex < tabs.length - 1) {
                  setActiveTab(tabs[currentIndex + 1].id)
                }
              }}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              Next
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default ApplicationFormEnhanced