import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Privacy = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
            </div>
            <p className="text-gray-600">Last updated: October 3, 2025</p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
              <p className="text-gray-700 mb-3">
                We collect information that you provide directly to us when you:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Create an account or apply for a job</li>
                <li>Submit job applications, resumes, or cover letters</li>
                <li>Contact us through our website or email</li>
                <li>Use our services or interact with our platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-3">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Process and manage job applications</li>
                <li>Communicate with you about job opportunities</li>
                <li>Improve our services and user experience</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraud and ensure platform security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Information Sharing</h2>
              <p className="text-gray-700">
                We do not sell your personal information. We may share your information with:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mt-3">
                <li>Employers when you apply for jobs (with your consent)</li>
                <li>Service providers who assist our operations</li>
                <li>Legal authorities when required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Security</h2>
              <p className="text-gray-700">
                We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Your Rights</h2>
              <p className="text-gray-700 mb-3">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Access and review your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account and data</li>
                <li>Opt-out of marketing communications</li>
                <li>Download your data in a portable format</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies and Tracking</h2>
              <p className="text-gray-700">
                We use cookies and similar tracking technologies to enhance your experience, analyze usage, and provide personalized content. You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact Us</h2>
              <p className="text-gray-700">
                If you have questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="mt-3 p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> privacy@workorbit.com<br />
                  <strong>Address:</strong> WorkOrbit Inc., 123 Business St, City, State 12345
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Privacy;
