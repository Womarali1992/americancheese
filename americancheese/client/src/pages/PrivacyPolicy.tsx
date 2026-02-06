export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: February 6, 2026</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to SiteSetups ("we," "our," or "us"). We are committed to protecting your privacy
              and ensuring the security of your personal information. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you use our project management
              and social media automation platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Account information (name, email, password)</li>
              <li>Project and task data you create</li>
              <li>API credentials for third-party services (Facebook, X/Twitter, etc.)</li>
              <li>Contact information for team members and contractors</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Log data (IP address, browser type, pages visited)</li>
              <li>Device information</li>
              <li>Usage patterns and analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>To provide and maintain our services</li>
              <li>To authenticate your identity and manage your account</li>
              <li>To process and post content to connected social media platforms on your behalf</li>
              <li>To send you service-related communications</li>
              <li>To improve and optimize our platform</li>
              <li>To detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Encryption:</strong> All sensitive credentials are encrypted using AES-256-GCM encryption</li>
              <li><strong>HTTPS:</strong> All data transmitted between your browser and our servers is encrypted via TLS/SSL</li>
              <li><strong>Access Control:</strong> Your data is isolated and accessible only to your authenticated account</li>
              <li><strong>Secure Storage:</strong> API keys and tokens are stored encrypted and never in plain text</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Third-Party Services</h2>
            <p className="text-gray-700 mb-4">
              Our platform integrates with third-party services including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Facebook/Meta (for page posting)</li>
              <li>X/Twitter (for tweet posting)</li>
              <li>Other social media platforms as added</li>
            </ul>
            <p className="text-gray-700 mb-4">
              When you connect these services, you authorize us to access and use your accounts according
              to their respective terms of service. We only access the permissions necessary to provide
              our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your information for as long as your account is active or as needed to provide
              services. You may request deletion of your account and associated data at any time by
              contacting us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Revoke access to connected third-party services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Cookies</h2>
            <p className="text-gray-700 mb-4">
              We use essential cookies to maintain your session and authentication state. These are
              necessary for the platform to function and cannot be disabled.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              Our services are not intended for individuals under 18 years of age. We do not knowingly
              collect personal information from children.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-gray-700">
              <strong>Email:</strong> privacy@sitesetups.com<br />
              <strong>Website:</strong> https://sitesetups.com
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <a href="/" className="text-blue-600 hover:text-blue-800">
            &larr; Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
