import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Heart, Mail, Phone, MapPin, Search } from 'lucide-react'
import appIcon from '../assets/app_icon.png'
import { getJobs } from '../services/api'

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch active jobs count
        const jobsResponse = await getJobs({})
        const activeJobsCount = jobsResponse.jobs ? jobsResponse.jobs.length : 0

        // TODO: Add API call to get total applications count
        // For now, we'll calculate based on jobs (estimated)
        const estimatedApplications = activeJobsCount * 5 // Rough estimate

        setStats({
          activeJobs: activeJobsCount,
          totalApplications: estimatedApplications
        })
      } catch (error) {
        console.error('Error fetching footer stats:', error)
        // Fallback to default values
        setStats({
          activeJobs: 0,
          totalApplications: 0
        })
      }
    }

    fetchStats()
  }, [])

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="w-96 h-96 bg-primary-500 rounded-full filter blur-3xl animate-float-1"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-500 rounded-full filter blur-3xl animate-float-2"></div>
        </div>
      </div>

      {/* Top Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500"></div>

      <div className="relative max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-xl p-2 shadow-lg">
                <img
                  src={appIcon}
                  alt="WorkOrbit Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold">WorkOrbit</h2>
                <p className="text-xs text-gray-400">Careers Platform</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Find your next career opportunity with WorkOrbit. We connect talented professionals with innovative companies.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/jobs" className="text-gray-300 hover:text-primary-400 text-sm transition-colors flex items-center">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link to="/track" className="text-gray-300 hover:text-primary-400 text-sm transition-colors flex items-center">
                  <Search className="w-4 h-4 mr-2" />
                  Track Application
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Contact Us
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2 text-sm text-gray-300">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>support@workorbit.com</span>
              </li>
              <li className="flex items-start space-x-2 text-sm text-gray-300">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start space-x-2 text-sm text-gray-300">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>123 Business Ave, Tech City</span>
              </li>
            </ul>
          </div>

          {/* Application Stats */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Platform Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-400">
                  {stats.activeJobs > 0 ? `${stats.activeJobs}+` : '0'}
                </p>
                <p className="text-xs text-gray-400">Active Jobs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-400">
                  {stats.totalApplications > 0 ? `${stats.totalApplications}+` : '0'}
                </p>
                <p className="text-xs text-gray-400">Applications</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <p className="text-sm text-gray-400">
              © {currentYear} WorkOrbit. All rights reserved.
            </p>
            <p className="text-sm text-gray-400">
              Made with <Heart className="w-4 h-4 inline text-red-500" /> for job seekers
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer