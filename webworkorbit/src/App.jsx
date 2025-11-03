import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastContainer } from './components/Toast'
import LoadingSpinner from './components/LoadingSpinner'
import Header from './components/Header'
import Footer from './components/Footer'
import './App.css'

// Lazy load pages for code splitting
const JobList = lazy(() => import('./pages/JobList'))
const JobDetails = lazy(() => import('./pages/JobDetails'))
const ApplicationFormEnhanced = lazy(() => import('./pages/ApplicationFormEnhanced'))
const TrackApplication = lazy(() => import('./pages/TrackApplication'))
const SavedJobs = lazy(() => import('./pages/SavedJobs'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Inner App component with access to AppContext
function AppContent() {
  const { toasts, removeToast } = useApp()

  useEffect(() => {
    // Create floating particles (only in development for performance)
    if (import.meta.env.MODE === 'development') {
      const createParticles = () => {
        const particlesContainer = document.createElement('div')
        particlesContainer.className = 'particles'

        for (let i = 0; i < 20; i++) {
          const particle = document.createElement('span')
          particle.className = 'particle'
          particle.style.left = `${Math.random() * 100}%`
          particle.style.animationDelay = `${Math.random() * 20}s`
          particle.style.animationDuration = `${15 + Math.random() * 20}s`
          particlesContainer.appendChild(particle)
        }

        document.body.appendChild(particlesContainer)

        return () => {
          document.body.removeChild(particlesContainer)
        }
      }

      const cleanup = createParticles()
      return cleanup
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col relative bg-white">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Animated Background Orbs */}
      <div className="floating-orb orb-1"></div>
      <div className="floating-orb orb-2"></div>
      <div className="floating-orb orb-3"></div>

      <Header />
      <main className="flex-1 relative z-10">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <LoadingSpinner />
          </div>
        }>
          <Routes>
            <Route path="/" element={<JobList />} />
            <Route path="/jobs" element={<JobList />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="/jobs/:id/apply" element={<ApplicationFormEnhanced />} />
            <Route path="/track" element={<TrackApplication />} />
            <Route path="/saved" element={<SavedJobs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

// Main App component with providers
function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <AppContent />
        </Router>
      </AppProvider>
    </ErrorBoundary>
  )
}

export default App
