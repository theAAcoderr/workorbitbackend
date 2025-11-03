import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Saved jobs state
  const [savedJobs, setSavedJobs] = useState(() => {
    const saved = localStorage.getItem('savedJobs');
    return saved ? JSON.parse(saved) : [];
  });

  // Recent searches state
  const [recentSearches, setRecentSearches] = useState(() => {
    const recent = localStorage.getItem('recentSearches');
    return recent ? JSON.parse(recent) : [];
  });

  // User state
  const [user, setUser] = useState(null);

  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  // Global loading state
  const [isLoading, setIsLoading] = useState(false);

  // Persist saved jobs to localStorage
  useEffect(() => {
    localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
  }, [savedJobs]);

  // Persist recent searches to localStorage
  useEffect(() => {
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  // Toggle save job
  const toggleSaveJob = useCallback((jobId) => {
    setSavedJobs(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  }, []);

  // Check if job is saved
  const isJobSaved = useCallback((jobId) => {
    return savedJobs.includes(jobId);
  }, [savedJobs]);

  // Add recent search
  const addRecentSearch = useCallback((searchTerm) => {
    if (!searchTerm.trim()) return;

    setRecentSearches(prev => {
      const filtered = prev.filter(term => term !== searchTerm);
      return [searchTerm, ...filtered].slice(0, 5); // Keep only last 5
    });
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  }, []);

  // Show toast notification
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  // Remove toast
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Clear all toasts
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value = {
    // Saved jobs
    savedJobs,
    toggleSaveJob,
    isJobSaved,

    // Recent searches
    recentSearches,
    addRecentSearch,
    clearRecentSearches,

    // User
    user,
    setUser,

    // Toasts
    toasts,
    showToast,
    removeToast,
    clearToasts,

    // Global loading
    isLoading,
    setIsLoading
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export default AppContext;
