import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Terms = () => {
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
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Terms & Conditions</h1>
            </div>
            <p className="text-gray-600">Last updated: October 3, 2025</p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-700">
                By accessing and using WorkOrbit's recruitment platform, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. User Accounts</h2>
              <p className="text-gray-700 mb-3">
                When creating an account, you agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
                <li>Not share your account with others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Job Applications</h2>
              <p className="text-gray-700 mb-3">
                By submitting a job application, you:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Warrant that all information provided is truthful and accurate</li>
                <li>Grant permission to share your application with potential employers</li>
                <li>Understand that applications cannot be withdrawn after submission</li>
                <li>Agree to receive communications regarding your application</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Prohibited Conduct</h2>
              <p className="text-gray-700 mb-3">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Provide false or misleading information</li>
                <li>Impersonate another person or entity</li>
                <li>Use automated systems to access our platform</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Upload malicious code or viruses</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Intellectual Property</h2>
              <p className="text-gray-700">
                All content on WorkOrbit, including text, graphics, logos, and software, is the property of WorkOrbit Inc. and protected by copyright laws. You may not reproduce, distribute, or create derivative works without our explicit permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Disclaimer of Warranties</h2>
              <p className="text-gray-700">
                WorkOrbit is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, error-free, or free from harmful components. We are not responsible for job offers, employment decisions, or the conduct of employers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Limitation of Liability</h2>
              <p className="text-gray-700">
                WorkOrbit shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services. Our total liability shall not exceed the amount you paid us (if any) in the past 12 months.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Termination</h2>
              <p className="text-gray-700">
                We reserve the right to suspend or terminate your account at any time for violations of these terms, illegal activity, or other reasons we deem necessary. You may also terminate your account at any time through your account settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Changes to Terms</h2>
              <p className="text-gray-700">
                We may modify these Terms and Conditions at any time. Continued use of our services after changes constitutes acceptance of the new terms. We will notify you of significant changes via email or platform notification.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Governing Law</h2>
              <p className="text-gray-700">
                These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Information</h2>
              <p className="text-gray-700">
                For questions about these Terms and Conditions, please contact us:
              </p>
              <div className="mt-3 p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@workorbit.com<br />
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

export default Terms;
