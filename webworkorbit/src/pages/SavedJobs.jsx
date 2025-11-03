import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Briefcase, MapPin, DollarSign, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getJobs } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';

const SavedJobs = () => {
  const { savedJobs, toggleSaveJob, showToast } = useApp();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSavedJobs();
  }, [savedJobs]);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      if (savedJobs.length === 0) {
        setJobs([]);
        setLoading(false);
        return;
      }

      // Fetch all jobs and filter by saved IDs
      const response = await getJobs();
      const savedJobsData = response.data.jobs.filter(job =>
        savedJobs.includes(job.id)
      );
      setJobs(savedJobsData);
    } catch (err) {
      console.error('Error fetching saved jobs:', err);
      setError('Failed to load saved jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (jobId, jobTitle) => {
    toggleSaveJob(jobId);
    showToast(`Removed "${jobTitle}" from saved jobs`, 'info');
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Bookmark className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Saved Jobs</h1>
            </div>
            <p className="text-gray-600">
              {jobs.length === 0
                ? 'No saved jobs yet'
                : `You have ${jobs.length} saved job${jobs.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {jobs.length === 0 && !error && (
            <div className="text-center py-12">
              <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No saved jobs yet
              </h2>
              <p className="text-gray-600 mb-6">
                Start exploring jobs and save your favorites for later
              </p>
              <Link
                to="/jobs"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Browse Jobs
              </Link>
            </div>
          )}

          {/* Jobs List */}
          {jobs.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map(job => (
                <div
                  key={job.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  {/* Company Logo */}
                  {job.companyLogo && (
                    <div className="mb-4">
                      <img
                        src={job.companyLogo}
                        alt={job.companyName}
                        className="h-12 w-12 object-contain"
                      />
                    </div>
                  )}

                  {/* Job Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {job.title}
                  </h3>

                  {/* Company Name */}
                  <p className="text-gray-600 mb-4">{job.companyName}</p>

                  {/* Job Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase className="w-4 h-4" />
                      <span>{job.jobType}</span>
                    </div>
                    {job.salary && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span>{job.salary}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="flex-1 text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleRemove(job.id, job.title)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Remove from saved jobs"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SavedJobs;
