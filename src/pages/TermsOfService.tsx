import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Terms of Service</h1>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-8 text-white/80">
          <p className="text-white/60">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Brilla Prep, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p>
              Brilla Prep is an educational platform designed to help students prepare for
              BECE, WASSCE, and NSMQ examinations. Our services include practice questions,
              mock exams, competition simulations, and AI-powered tutoring.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. User Accounts</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must be at least 13 years old to create an account</li>
              <li>Students under 18 should have parental consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Subscription and Payments</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Some features require a paid subscription</li>
              <li>Payments are processed securely through Paystack</li>
              <li>Subscriptions auto-renew unless cancelled</li>
              <li>Refunds are handled on a case-by-case basis</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Acceptable Use</h2>
            <p className="mb-4">You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Share your account credentials with others</li>
              <li>Attempt to cheat or manipulate the system</li>
              <li>Copy or distribute our content without permission</li>
              <li>Use the platform for any illegal purposes</li>
              <li>Harass or harm other users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Intellectual Property</h2>
            <p>
              All content on Brilla Prep, including questions, explanations, and materials,
              is protected by copyright. You may not reproduce, distribute, or create
              derivative works without our express permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Disclaimer</h2>
            <p>
              While we strive to provide accurate and helpful educational content,
              Brilla Prep does not guarantee specific exam results. Success depends
              on individual effort and preparation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
            <p>
              Brilla Prep shall not be liable for any indirect, incidental, special,
              or consequential damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify
              users of significant changes via email or through the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Contact</h2>
            <p>
              For questions about these Terms of Service, contact us at:{' '}
              <a href="mailto:support@brillaprep.org" className="text-secondary hover:underline">
                support@brillaprep.org
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
