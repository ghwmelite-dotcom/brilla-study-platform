import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  Database,
  Share2,
  UserCheck,
  Bell,
  Cookie,
  Globe,
  Mail,
  ChevronRight,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/utils';

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
}

const sections: Section[] = [
  { id: 'information-collection', title: 'Information We Collect', icon: Database },
  { id: 'how-we-use', title: 'How We Use Your Information', icon: Eye },
  { id: 'data-security', title: 'Data Security', icon: Lock },
  { id: 'data-sharing', title: 'Data Sharing', icon: Share2 },
  { id: 'your-rights', title: 'Your Rights', icon: UserCheck },
  { id: 'childrens-privacy', title: "Children's Privacy", icon: Shield },
  { id: 'cookies', title: 'Cookies & Tracking', icon: Cookie },
  { id: 'international', title: 'International Data Transfers', icon: Globe },
  { id: 'updates', title: 'Policy Updates', icon: Bell },
  { id: 'contact', title: 'Contact Us', icon: Mail },
];

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const lastUpdated = new Date('2026-01-04').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-display font-semibold text-white hidden sm:block">Brilla Prep</span>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-12">
          {/* Sidebar Navigation - Desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-primary/20 to-secondary/10 text-white border border-primary/30"
                          : "text-white/50 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-secondary")} />
                      <span className="text-sm font-medium">{section.title}</span>
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto text-secondary" />}
                    </button>
                  );
                })}
              </nav>

              {/* Quick Contact Card */}
              <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/5 border border-white/10">
                <h4 className="font-semibold text-white mb-2">Have Questions?</h4>
                <p className="text-sm text-white/60 mb-4">
                  Our privacy team is here to help with any concerns.
                </p>
                <a
                  href="mailto:privacy@brillaprep.org"
                  className="inline-flex items-center gap-2 text-secondary hover:text-secondary/80 text-sm font-medium transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  privacy@brillaprep.org
                </a>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className={cn(
            "transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}>
            {/* Hero Section */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-display">
                    Privacy Policy
                  </h1>
                  <p className="text-white/50 mt-1">Your privacy matters to us</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="px-3 py-1.5 rounded-full bg-white/5 text-white/60 border border-white/10">
                  Last updated: {lastUpdated}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  GDPR Compliant
                </span>
              </div>
            </div>

            {/* Introduction */}
            <div className="prose prose-invert max-w-none mb-12">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <p className="text-white/80 leading-relaxed m-0">
                  At <strong className="text-white">Brilla Prep</strong>, we are committed to protecting your privacy and ensuring
                  the security of your personal information. This Privacy Policy explains how we collect, use,
                  disclose, and safeguard your information when you use our educational platform. Please read
                  this policy carefully. By accessing or using Brilla Prep, you agree to the terms of this Privacy Policy.
                </p>
              </div>
            </div>

            {/* Mobile Table of Contents */}
            <div className="lg:hidden mb-8">
              <details className="group">
                <summary className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer list-none">
                  <span className="font-semibold text-white">Table of Contents</span>
                  <ChevronRight className="w-5 h-5 text-white/50 group-open:rotate-90 transition-transform" />
                </summary>
                <nav className="mt-2 p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 text-left transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{section.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </details>
            </div>

            {/* Policy Sections */}
            <div className="space-y-12">
              {/* Section 1: Information We Collect */}
              <section id="information-collection" className="scroll-mt-24">
                <SectionHeader icon={Database} number={1} title="Information We Collect" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>
                    We collect information you provide directly to us, as well as information collected automatically
                    when you use our services.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <InfoCard
                      title="Personal Information"
                      items={[
                        "Full name and email address",
                        "Phone number (optional)",
                        "School name and grade level",
                        "Profile photo (optional)",
                        "Date of birth (for age verification)"
                      ]}
                    />
                    <InfoCard
                      title="Account & Usage Data"
                      items={[
                        "Login credentials (encrypted)",
                        "Practice session history",
                        "Quiz scores and progress",
                        "Time spent on platform",
                        "Feature usage patterns"
                      ]}
                    />
                    <InfoCard
                      title="Payment Information"
                      items={[
                        "Transaction history",
                        "Subscription details",
                        "Payment method (via Paystack)",
                        "Billing address (if applicable)"
                      ]}
                    />
                    <InfoCard
                      title="Technical Data"
                      items={[
                        "Device type and browser",
                        "IP address",
                        "Operating system",
                        "Cookies and session data",
                        "Referral source"
                      ]}
                    />
                  </div>
                </div>
              </section>

              {/* Section 2: How We Use Your Information */}
              <section id="how-we-use" className="scroll-mt-24">
                <SectionHeader icon={Eye} number={2} title="How We Use Your Information" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>
                    We use the information we collect to provide, maintain, and improve our educational services:
                  </p>

                  <div className="space-y-4">
                    <UsageItem
                      title="Personalized Learning Experience"
                      description="Adapt content difficulty, recommend topics, and track your progress to optimize your learning journey."
                    />
                    <UsageItem
                      title="Account Management"
                      description="Create and manage your account, process subscriptions, and provide customer support."
                    />
                    <UsageItem
                      title="Communication"
                      description="Send important updates, study reminders, achievement notifications, and respond to your inquiries."
                    />
                    <UsageItem
                      title="Analytics & Improvement"
                      description="Analyze usage patterns to improve our platform, develop new features, and fix issues."
                    />
                    <UsageItem
                      title="Safety & Security"
                      description="Detect and prevent fraud, abuse, and security threats to protect our users and platform."
                    />
                    <UsageItem
                      title="Legal Compliance"
                      description="Comply with legal obligations and enforce our terms of service."
                    />
                  </div>
                </div>
              </section>

              {/* Section 3: Data Security */}
              <section id="data-security" className="scroll-mt-24">
                <SectionHeader icon={Lock} number={3} title="Data Security" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>
                    We implement industry-standard security measures to protect your personal information from
                    unauthorized access, alteration, disclosure, or destruction.
                  </p>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <SecurityFeature
                      icon="🔐"
                      title="Encryption"
                      description="All data is encrypted in transit (TLS 1.3) and at rest (AES-256)"
                    />
                    <SecurityFeature
                      icon="🛡️"
                      title="Secure Infrastructure"
                      description="Hosted on enterprise-grade cloud infrastructure with 24/7 monitoring"
                    />
                    <SecurityFeature
                      icon="🔑"
                      title="Access Controls"
                      description="Strict role-based access controls and authentication protocols"
                    />
                    <SecurityFeature
                      icon="🔍"
                      title="Regular Audits"
                      description="Periodic security assessments and vulnerability testing"
                    />
                    <SecurityFeature
                      icon="💾"
                      title="Data Backups"
                      description="Automated backups with secure off-site storage"
                    />
                    <SecurityFeature
                      icon="🚨"
                      title="Incident Response"
                      description="Dedicated team for rapid response to security incidents"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-amber-200 text-sm">
                      <strong>Note:</strong> While we strive to protect your information, no method of transmission
                      over the Internet or electronic storage is 100% secure. We encourage you to use strong passwords
                      and keep your login credentials confidential.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 4: Data Sharing */}
              <section id="data-sharing" className="scroll-mt-24">
                <SectionHeader icon={Share2} number={4} title="Data Sharing" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>
                    We do not sell, rent, or trade your personal information. We may share your data only in the
                    following circumstances:
                  </p>

                  <div className="space-y-4">
                    <SharingItem
                      title="Service Providers"
                      description="Trusted third-party vendors who assist in operating our platform (e.g., Paystack for payments, cloud hosting providers). These providers are contractually bound to protect your data."
                    />
                    <SharingItem
                      title="Parents & Guardians"
                      description="For student accounts where applicable, parents or guardians may have access to progress reports and account information with proper verification."
                    />
                    <SharingItem
                      title="Educational Institutions"
                      description="If you're using Brilla Prep through a school or institution, your school administrators may have access to your usage data and progress."
                    />
                    <SharingItem
                      title="Legal Requirements"
                      description="When required by law, court order, or governmental request, or to protect our rights, safety, or property."
                    />
                    <SharingItem
                      title="Business Transfers"
                      description="In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity."
                    />
                  </div>
                </div>
              </section>

              {/* Section 5: Your Rights */}
              <section id="your-rights" className="scroll-mt-24">
                <SectionHeader icon={UserCheck} number={5} title="Your Rights" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>
                    You have certain rights regarding your personal information. We are committed to honoring these
                    rights in accordance with applicable data protection laws:
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <RightCard
                      title="Access"
                      description="Request a copy of the personal data we hold about you"
                    />
                    <RightCard
                      title="Correction"
                      description="Request correction of inaccurate or incomplete data"
                    />
                    <RightCard
                      title="Deletion"
                      description="Request deletion of your personal data (right to be forgotten)"
                    />
                    <RightCard
                      title="Portability"
                      description="Export your data in a structured, machine-readable format"
                    />
                    <RightCard
                      title="Restriction"
                      description="Request restriction of processing in certain circumstances"
                    />
                    <RightCard
                      title="Objection"
                      description="Object to processing of your data for marketing purposes"
                    />
                  </div>

                  <p>
                    To exercise any of these rights, please contact us at{' '}
                    <a href="mailto:privacy@brillaprep.org" className="text-secondary hover:underline">
                      privacy@brillaprep.org
                    </a>. We will respond to your request within 30 days.
                  </p>
                </div>
              </section>

              {/* Section 6: Children's Privacy */}
              <section id="childrens-privacy" className="scroll-mt-24">
                <SectionHeader icon={Shield} number={6} title="Children's Privacy" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>
                    Brilla Prep is designed for students, including those under 18 years of age. We take special
                    precautions to protect the privacy of young users:
                  </p>

                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>We collect only the minimum information necessary to provide our educational services</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Students under 13 require parental consent to create an account</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Parents can review, modify, or delete their child's information at any time</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>We do not display targeted advertising to users under 18</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Social features have additional safeguards for younger users</span>
                    </li>
                  </ul>

                  <p>
                    If you believe we have inadvertently collected information from a child without proper consent,
                    please contact us immediately so we can take appropriate action.
                  </p>
                </div>
              </section>

              {/* Section 7: Cookies & Tracking */}
              <section id="cookies" className="scroll-mt-24">
                <SectionHeader icon={Cookie} number={7} title="Cookies & Tracking Technologies" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>
                    We use cookies and similar tracking technologies to enhance your experience on our platform:
                  </p>

                  <div className="space-y-4">
                    <CookieType
                      title="Essential Cookies"
                      description="Required for the platform to function properly. These cannot be disabled."
                      examples="Session management, authentication, security"
                    />
                    <CookieType
                      title="Performance Cookies"
                      description="Help us understand how you use the platform to improve performance."
                      examples="Page load times, error tracking, usage analytics"
                    />
                    <CookieType
                      title="Functional Cookies"
                      description="Remember your preferences and settings for a better experience."
                      examples="Language preferences, theme settings, login status"
                    />
                  </div>

                  <p>
                    You can manage cookie preferences through your browser settings. Note that disabling certain
                    cookies may affect the functionality of our platform.
                  </p>
                </div>
              </section>

              {/* Section 8: International Data Transfers */}
              <section id="international" className="scroll-mt-24">
                <SectionHeader icon={Globe} number={8} title="International Data Transfers" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>
                    Brilla Prep is based in Ghana and primarily serves users in West Africa. However, your data
                    may be processed in other countries where our service providers operate.
                  </p>

                  <p>
                    When we transfer data internationally, we ensure appropriate safeguards are in place, including:
                  </p>

                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Standard contractual clauses approved by data protection authorities</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Encryption of data during transfer and storage</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Compliance with the Ghana Data Protection Act, 2012 (Act 843)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Adherence to GDPR principles for users in the European Economic Area</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 9: Policy Updates */}
              <section id="updates" className="scroll-mt-24">
                <SectionHeader icon={Bell} number={9} title="Policy Updates" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>
                    We may update this Privacy Policy from time to time to reflect changes in our practices,
                    technology, legal requirements, or other factors.
                  </p>

                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="font-semibold text-white mb-3">How We'll Notify You</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-secondary">•</span>
                        <span>Email notification for significant changes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-secondary">•</span>
                        <span>In-app notification when you next log in</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-secondary">•</span>
                        <span>Updated "Last modified" date at the top of this policy</span>
                      </li>
                    </ul>
                  </div>

                  <p>
                    We encourage you to review this Privacy Policy periodically. Your continued use of Brilla Prep
                    after any changes indicates your acceptance of the updated policy.
                  </p>
                </div>
              </section>

              {/* Section 10: Contact Us */}
              <section id="contact" className="scroll-mt-24">
                <SectionHeader icon={Mail} number={10} title="Contact Us" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>
                    If you have any questions, concerns, or requests regarding this Privacy Policy or our data
                    practices, please don't hesitate to reach out:
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-primary" />
                        Email
                      </h4>
                      <a
                        href="mailto:privacy@brillaprep.org"
                        className="text-secondary hover:underline block mb-1"
                      >
                        privacy@brillaprep.org
                      </a>
                      <p className="text-sm text-white/50">For privacy-related inquiries</p>
                    </div>

                    <div className="p-5 rounded-xl bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-secondary" />
                        General Support
                      </h4>
                      <a
                        href="mailto:support@brillaprep.org"
                        className="text-secondary hover:underline block mb-1"
                      >
                        support@brillaprep.org
                      </a>
                      <p className="text-sm text-white/50">For general questions</p>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="font-semibold text-white mb-2">Response Time</h4>
                    <p className="text-sm">
                      We aim to respond to all privacy-related inquiries within <strong className="text-white">48 hours</strong> on
                      business days. For data access or deletion requests, we will respond within <strong className="text-white">30 days</strong> as
                      required by applicable regulations.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-white/10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-white/40 text-sm">
                  © {new Date().getFullYear()} Brilla Prep. All rights reserved.
                </p>
                <div className="flex items-center gap-4">
                  <Link
                    to="/terms"
                    className="text-white/60 hover:text-white text-sm transition-colors flex items-center gap-1"
                  >
                    Terms of Service
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <Link
                    to="/help"
                    className="text-white/60 hover:text-white text-sm transition-colors flex items-center gap-1"
                  >
                    Help Center
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// Component: Section Header
function SectionHeader({ icon: Icon, number, title }: { icon: React.ElementType; number: number; title: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/10 border border-white/10">
        <Icon className="w-6 h-6 text-secondary" />
      </div>
      <div>
        <span className="text-xs text-white/40 uppercase tracking-wider">Section {number}</span>
        <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
      </div>
    </div>
  );
}

// Component: Info Card
function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
      <h4 className="font-semibold text-white mb-3">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-white/70">
            <span className="text-secondary mt-1">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Component: Usage Item
function UsageItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="w-2 h-2 rounded-full bg-secondary mt-2 flex-shrink-0" />
      <div>
        <h4 className="font-semibold text-white mb-1">{title}</h4>
        <p className="text-sm text-white/60">{description}</p>
      </div>
    </div>
  );
}

// Component: Security Feature
function SecurityFeature({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center hover:border-primary/30 transition-colors">
      <span className="text-2xl mb-2 block">{icon}</span>
      <h4 className="font-semibold text-white text-sm mb-1">{title}</h4>
      <p className="text-xs text-white/50">{description}</p>
    </div>
  );
}

// Component: Sharing Item
function SharingItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <h4 className="font-semibold text-white mb-2">{title}</h4>
      <p className="text-sm text-white/60">{description}</p>
    </div>
  );
}

// Component: Right Card
function RightCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-primary/30 transition-colors">
      <h4 className="font-semibold text-white mb-1 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-400" />
        {title}
      </h4>
      <p className="text-sm text-white/60">{description}</p>
    </div>
  );
}

// Component: Cookie Type
function CookieType({ title, description, examples }: { title: string; description: string; examples: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <h4 className="font-semibold text-white mb-1">{title}</h4>
      <p className="text-sm text-white/60 mb-2">{description}</p>
      <p className="text-xs text-white/40">
        <span className="text-white/50">Examples:</span> {examples}
      </p>
    </div>
  );
}
