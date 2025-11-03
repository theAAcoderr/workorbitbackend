import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, Menu, X, Briefcase, MapPin } from 'lucide-react'
import appIcon from '../assets/app_icon.png'

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const isActiveLink = (path) => {
    return location.pathname === path || location.pathname.startsWith(path)
  }

  const navLinks = [
    { to: '/jobs', label: 'Browse Jobs', icon: Briefcase },
    { to: '/track', label: 'Track Application', icon: Search },
  ]

  return (
    <header className="bg-white/95 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 animate-slide-down">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 lg:h-18">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="relative">
                <img
                  src={appIcon}
                  alt="WorkOrbit Logo"
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg sm:rounded-xl shadow-md sm:shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105"
                />
                {/* <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-500 rounded-full animate-pulse"></div> */}
              </div>
              <div className="block">
                <span className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  WorkOrbit
                </span>
                <div className="text-xs text-gray-500 font-medium tracking-wide hidden sm:block">CAREERS</div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center space-x-1.5 lg:space-x-2 px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl text-xs lg:text-sm font-medium transition-all duration-200 hover:bg-gray-100 ${
                  isActiveLink(to)
                    ? 'text-primary-600 bg-primary-50 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                <span className="hidden lg:inline">{label}</span>
                <span className="lg:hidden">{label.split(' ')[0]}</span>
              </Link>
            ))}
          </nav>

          {/* Desktop CTA & Mobile Menu Button */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            {/* Desktop CTA */}
            <Link
              to="/track"
              className="hidden md:inline-flex items-center btn-primary text-xs lg:text-sm px-3 lg:px-4 py-1.5 lg:py-2"
            >
              <Search className="h-3.5 w-3.5 lg:h-4 lg:w-4 mr-1.5 lg:mr-2" />
              <span className="hidden lg:inline">Track Status</span>
              <span className="lg:hidden">Track</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="md:hidden inline-flex items-center justify-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 relative z-50"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`md:hidden transition-all duration-300 ease-in-out bg-white border-t border-gray-100 relative z-40 ${
          isMobileMenuOpen
            ? 'max-h-screen opacity-100 visible'
            : 'max-h-0 opacity-0 invisible overflow-hidden'
        }`}
      >
        <div className="px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
          {/* Mobile Navigation Links */}
          <div className="space-y-1.5 sm:space-y-2">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-2.5 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-200 ${
                  isActiveLink(to)
                    ? 'text-primary-600 bg-primary-50 border border-primary-200'
                    : 'text-gray-800 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate font-medium">{label}</span>
              </Link>
            ))}
          </div>

          {/* Mobile CTA */}
          <div className="pt-3 sm:pt-4 border-t border-gray-100">
            <Link
              to="/track"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full btn-primary mobile-full-width justify-center text-sm sm:text-base py-2.5 sm:py-3"
            >
              <Search className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="sm:hidden">Track Application</span>
              <span className="hidden sm:inline">Track Your Application</span>
            </Link>
          </div>

          {/* Mobile Info */}
          <div className="pt-3 sm:pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Find your dream job today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </header>
  )
}

export default Header