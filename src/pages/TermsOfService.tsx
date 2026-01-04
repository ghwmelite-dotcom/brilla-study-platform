import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  ScrollText,
  UserCheck,
  CreditCard,
  ShieldCheck,
  Scale,
  Copyright,
  AlertTriangle,
  Ban,
  RefreshCw,
  Gavel,
  Mail,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ExternalLink,
  BookOpen,
  Users,
  Trophy,
  Gift
} from 'lucide-react';
import { cn } from '@/utils';

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
}

const sections: Section[] = [
  { id: 'acceptance', title: 'Acceptance of Terms', icon: ScrollText },
  { id: 'description', title: 'Description of Service', icon: BookOpen },
  { id: 'accounts', title: 'User Accounts', icon: UserCheck },
  { id: 'subscriptions', title: 'Subscriptions & Payments', icon: CreditCard },
  { id: 'acceptable-use', title: 'Acceptable Use', icon: ShieldCheck },
  { id: 'prohibited', title: 'Prohibited Conduct', icon: Ban },
  { id: 'intellectual-property', title: 'Intellectual Property', icon: Copyright },
  { id: 'user-content', title: 'User Content', icon: Users },
  { id: 'competitions', title: 'Competitions & Rewards', icon: Trophy },
  { id: 'affiliate', title: 'Affiliate Program', icon: Gift },
  { id: 'disclaimers', title: 'Disclaimers', icon: AlertTriangle },
  { id: 'liability', title: 'Limitation of Liability', icon: Scale },
  { id: 'termination', title: 'Termination', icon: XCircle },
  { id: 'changes', title: 'Changes to Terms', icon: RefreshCw },
  { id: 'governing-law', title: 'Governing Law', icon: Gavel },
  { id: 'contact', title: 'Contact Us', icon: Mail },
];

export default function TermsOfService() {
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
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[80px]" />
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
            <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-2">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-secondary/20 to-primary/10 text-white border border-secondary/30"
                          : "text-white/50 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-secondary")} />
                      <span className="text-sm font-medium truncate">{section.title}</span>
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto text-secondary flex-shrink-0" />}
                    </button>
                  );
                })}
              </nav>

              {/* Quick Links Card */}
              <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-secondary/10 to-primary/5 border border-white/10">
                <h4 className="font-semibold text-white mb-2">Related Documents</h4>
                <div className="space-y-2">
                  <Link
                    to="/privacy"
                    className="flex items-center gap-2 text-sm text-white/60 hover:text-secondary transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Privacy Policy
                  </Link>
                  <Link
                    to="/help"
                    className="flex items-center gap-2 text-sm text-white/60 hover:text-secondary transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Help Center
                  </Link>
                </div>
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
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary via-secondary to-primary flex items-center justify-center shadow-lg shadow-secondary/25">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-display">
                    Terms of Service
                  </h1>
                  <p className="text-white/50 mt-1">Please read carefully before using Brilla Prep</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="px-3 py-1.5 rounded-full bg-white/5 text-white/60 border border-white/10">
                  Last updated: {lastUpdated}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Effective Immediately
                </span>
              </div>
            </div>

            {/* Introduction */}
            <div className="prose prose-invert max-w-none mb-12">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <p className="text-white/80 leading-relaxed m-0">
                  Welcome to <strong className="text-white">Brilla Prep</strong>! These Terms of Service ("Terms") govern
                  your access to and use of our educational platform, including our website, mobile applications, and
                  all related services. By creating an account or using Brilla Prep, you agree to be bound by these Terms.
                  If you do not agree to these Terms, please do not use our services.
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
                <nav className="mt-2 p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 max-h-64 overflow-y-auto">
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

            {/* Terms Sections */}
            <div className="space-y-12">
              {/* Section 1: Acceptance of Terms */}
              <section id="acceptance" className="scroll-mt-24">
                <SectionHeader icon={ScrollText} number={1} title="Acceptance of Terms" />
                <div className="mt-6 space-y-4 text-white/80">
                  <p>
                    By accessing or using Brilla Prep, you acknowledge that you have read, understood, and agree to be
                    bound by these Terms of Service and our Privacy Policy. These Terms constitute a legally binding
                    agreement between you and Brilla Prep.
                  </p>
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="text-sm text-white/70">
                      <strong className="text-white">Important:</strong> If you are under 18 years of age, you represent
                      that your parent or legal guardian has reviewed and agreed to these Terms on your behalf.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 2: Description of Service */}
              <section id="description" className="scroll-mt-24">
                <SectionHeader icon={BookOpen} number={2} title="Description of Service" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>
                    Brilla Prep is an educational technology platform designed to help students in Ghana and West Africa
                    prepare for academic examinations. Our services include:
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <ServiceCard
                      title="Practice Questions"
                      description="Thousands of questions covering BECE, WASSCE, and NSMQ syllabi across Mathematics, Physics, Chemistry, and Biology."
                    />
                    <ServiceCard
                      title="Mock Examinations"
                      description="Full-length practice exams that simulate real examination conditions with timing and scoring."
                    />
                    <ServiceCard
                      title="Competition Simulation"
                      description="NSMQ-style quiz competitions with real-time scoring and leaderboards."
                    />
                    <ServiceCard
                      title="AI-Powered Learning"
                      description="Personalized study recommendations and AI tutoring assistance."
                    />
                    <ServiceCard
                      title="Progress Tracking"
                      description="Detailed analytics to monitor your learning progress and identify areas for improvement."
                    />
                    <ServiceCard
                      title="Tutoring Services"
                      description="Connect with qualified tutors for personalized instruction and support."
                    />
                  </div>
                </div>
              </section>

              {/* Section 3: User Accounts */}
              <section id="accounts" className="scroll-mt-24">
                <SectionHeader icon={UserCheck} number={3} title="User Accounts" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>To access most features of Brilla Prep, you must create an account. By creating an account, you agree to:</p>

                  <div className="space-y-3">
                    <RequirementItem text="Provide accurate, current, and complete information during registration" />
                    <RequirementItem text="Maintain and promptly update your account information" />
                    <RequirementItem text="Keep your password secure and confidential" />
                    <RequirementItem text="Accept responsibility for all activities under your account" />
                    <RequirementItem text="Notify us immediately of any unauthorized access" />
                  </div>

                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="font-semibold text-white mb-3">Age Requirements</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-secondary">•</span>
                        <span>You must be at least <strong className="text-white">13 years old</strong> to create an account</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-secondary">•</span>
                        <span>Users under 18 should have parental or guardian consent</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-secondary">•</span>
                        <span>Parents may create accounts on behalf of their children</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 4: Subscriptions & Payments */}
              <section id="subscriptions" className="scroll-mt-24">
                <SectionHeader icon={CreditCard} number={4} title="Subscriptions & Payments" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>
                    Brilla Prep offers both free and premium subscription plans. By subscribing to a paid plan, you agree
                    to the following terms:
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <PaymentCard
                      title="Billing"
                      items={[
                        "Payments processed securely via Paystack",
                        "Subscriptions billed monthly or annually",
                        "Prices displayed in Ghana Cedis (GHS)",
                        "All fees are non-refundable unless stated"
                      ]}
                    />
                    <PaymentCard
                      title="Auto-Renewal"
                      items={[
                        "Subscriptions auto-renew unless cancelled",
                        "Cancel anytime before renewal date",
                        "Access continues until period ends",
                        "No refunds for partial periods"
                      ]}
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <h4 className="font-semibold text-amber-200 mb-2">Refund Policy</h4>
                    <p className="text-sm text-amber-200/80">
                      Refunds are considered on a case-by-case basis within 7 days of purchase for annual subscriptions,
                      provided less than 10% of premium content has been accessed. Monthly subscriptions are generally
                      non-refundable. Contact support@brillaprep.org for refund requests.
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="font-semibold text-white mb-3">Free Trial</h4>
                    <p className="text-sm text-white/70">
                      New users may be eligible for a 7-day free trial of premium features. Only one free trial per user
                      is permitted. We reserve the right to modify or discontinue free trials at any time.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 5: Acceptable Use */}
              <section id="acceptable-use" className="scroll-mt-24">
                <SectionHeader icon={ShieldCheck} number={5} title="Acceptable Use" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>You agree to use Brilla Prep only for lawful educational purposes. Acceptable use includes:</p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <AcceptableCard
                      title="Learning & Practice"
                      items={[
                        "Completing practice questions and quizzes",
                        "Taking mock examinations",
                        "Tracking your progress",
                        "Participating in competitions"
                      ]}
                      type="allowed"
                    />
                    <AcceptableCard
                      title="Community Engagement"
                      items={[
                        "Joining study groups",
                        "Participating in discussions respectfully",
                        "Sharing study tips (not answers)",
                        "Connecting with tutors"
                      ]}
                      type="allowed"
                    />
                  </div>
                </div>
              </section>

              {/* Section 6: Prohibited Conduct */}
              <section id="prohibited" className="scroll-mt-24">
                <SectionHeader icon={Ban} number={6} title="Prohibited Conduct" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>The following activities are strictly prohibited on Brilla Prep:</p>

                  <div className="space-y-4">
                    <ProhibitedCategory
                      title="Academic Dishonesty"
                      items={[
                        "Sharing quiz or exam answers with others",
                        "Using unauthorized tools during timed assessments",
                        "Creating multiple accounts to manipulate scores",
                        "Impersonating another user"
                      ]}
                    />
                    <ProhibitedCategory
                      title="Harmful Behavior"
                      items={[
                        "Harassing, bullying, or threatening other users",
                        "Posting offensive, discriminatory, or inappropriate content",
                        "Spamming or sending unsolicited messages",
                        "Engaging in any form of fraud"
                      ]}
                    />
                    <ProhibitedCategory
                      title="Technical Violations"
                      items={[
                        "Attempting to hack or compromise the platform",
                        "Scraping or automated data collection",
                        "Reverse engineering our software",
                        "Circumventing security measures or access controls"
                      ]}
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-200 text-sm">
                      <strong>Warning:</strong> Violation of these rules may result in immediate account suspension or
                      permanent ban, without refund. Severe violations may be reported to appropriate authorities.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 7: Intellectual Property */}
              <section id="intellectual-property" className="scroll-mt-24">
                <SectionHeader icon={Copyright} number={7} title="Intellectual Property" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>
                    All content on Brilla Prep, including but not limited to questions, explanations, graphics, logos,
                    designs, and software, is the property of Brilla Prep or its licensors and is protected by copyright,
                    trademark, and other intellectual property laws.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <h4 className="font-semibold text-green-300 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        You May
                      </h4>
                      <ul className="space-y-2 text-sm text-green-200/80">
                        <li>• Access content for personal educational use</li>
                        <li>• Take notes and screenshots for personal study</li>
                        <li>• Share your own progress and achievements</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                      <h4 className="font-semibold text-red-300 mb-3 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        You May Not
                      </h4>
                      <ul className="space-y-2 text-sm text-red-200/80">
                        <li>• Copy, reproduce, or distribute our content</li>
                        <li>• Create derivative works from our materials</li>
                        <li>• Use our content for commercial purposes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 8: User Content */}
              <section id="user-content" className="scroll-mt-24">
                <SectionHeader icon={Users} number={8} title="User Content" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>
                    You may submit content to Brilla Prep, including profile information, forum posts, and study group
                    contributions ("User Content"). By submitting User Content, you:
                  </p>

                  <div className="space-y-3">
                    <RequirementItem text="Grant us a non-exclusive, worldwide license to use, display, and distribute your content" />
                    <RequirementItem text="Represent that you own or have rights to the content you submit" />
                    <RequirementItem text="Agree that your content does not violate any third-party rights" />
                    <RequirementItem text="Acknowledge that we may remove content that violates these Terms" />
                  </div>

                  <p>
                    You retain ownership of your User Content, but grant us the rights necessary to operate and improve
                    the platform.
                  </p>
                </div>
              </section>

              {/* Section 9: Competitions & Rewards */}
              <section id="competitions" className="scroll-mt-24">
                <SectionHeader icon={Trophy} number={9} title="Competitions & Rewards" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>
                    Brilla Prep may offer competitions, challenges, and reward programs. Participation is subject to:
                  </p>

                  <div className="space-y-4">
                    <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="font-semibold text-white mb-3">Competition Rules</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-secondary">•</span>
                          <span>All participants must have valid accounts in good standing</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-secondary">•</span>
                          <span>Cheating or manipulation results in disqualification</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-secondary">•</span>
                          <span>Winners are determined by our scoring systems</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-secondary">•</span>
                          <span>Decisions by Brilla Prep administrators are final</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="font-semibold text-white mb-3">Rewards & Prizes</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-secondary">•</span>
                          <span>Prizes are non-transferable and cannot be exchanged for cash</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-secondary">•</span>
                          <span>We reserve the right to substitute prizes of equal or greater value</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-secondary">•</span>
                          <span>Winners may be required to verify their identity</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-secondary">•</span>
                          <span>Tax obligations are the responsibility of the winner</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 10: Affiliate Program */}
              <section id="affiliate" className="scroll-mt-24">
                <SectionHeader icon={Gift} number={10} title="Affiliate Program" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>
                    Brilla Prep offers an affiliate program that allows users to earn commissions by referring new
                    subscribers. Participation is subject to the following terms:
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="font-semibold text-white mb-3">Earning Commissions</h4>
                      <ul className="space-y-2 text-sm text-white/70">
                        <li>• Commission rates vary by referral tier</li>
                        <li>• Commissions paid on valid subscriptions only</li>
                        <li>• Self-referrals are not permitted</li>
                        <li>• Minimum payout threshold applies</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="font-semibold text-white mb-3">Program Rules</h4>
                      <ul className="space-y-2 text-sm text-white/70">
                        <li>• No spam or misleading promotions</li>
                        <li>• Must disclose affiliate relationship</li>
                        <li>• We may modify commission rates</li>
                        <li>• Fraudulent activity forfeits earnings</li>
                      </ul>
                    </div>
                  </div>

                  <p className="text-sm text-white/60">
                    Complete affiliate program terms are available in your affiliate dashboard. We reserve the right
                    to terminate affiliate accounts for violations.
                  </p>
                </div>
              </section>

              {/* Section 11: Disclaimers */}
              <section id="disclaimers" className="scroll-mt-24">
                <SectionHeader icon={AlertTriangle} number={11} title="Disclaimers" />
                <div className="mt-6 space-y-6 text-white/80">
                  <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <h4 className="font-semibold text-amber-200 mb-3">Service Provided "As Is"</h4>
                    <p className="text-sm text-amber-200/80">
                      BRILLA PREP IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND,
                      EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY,
                      FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                    </p>
                  </div>

                  <p>We do not warrant that:</p>

                  <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>The service will be uninterrupted, secure, or error-free</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>Results obtained from the service will be accurate or reliable</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>Using our platform will guarantee success in any examination</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>Any errors in the service will be corrected</span>
                    </li>
                  </ul>

                  <p>
                    <strong className="text-white">Educational Disclaimer:</strong> While we strive to provide accurate
                    and helpful educational content, Brilla Prep is a supplementary learning tool. Success in examinations
                    depends on individual effort, preparation, and many other factors beyond our control.
                  </p>
                </div>
              </section>

              {/* Section 12: Limitation of Liability */}
              <section id="liability" className="scroll-mt-24">
                <SectionHeader icon={Scale} number={12} title="Limitation of Liability" />
                <div className="mt-6 space-y-6 text-white/80">
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm">
                      TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, BRILLA PREP AND ITS OFFICERS, DIRECTORS,
                      EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
                      OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR
                      OTHER INTANGIBLE LOSSES, RESULTING FROM:
                    </p>
                  </div>

                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-white/50">(i)</span>
                      <span>Your access to or use of or inability to access or use the service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white/50">(ii)</span>
                      <span>Any conduct or content of any third party on the service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white/50">(iii)</span>
                      <span>Any content obtained from the service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white/50">(iv)</span>
                      <span>Unauthorized access, use, or alteration of your transmissions or content</span>
                    </li>
                  </ul>

                  <p>
                    In no event shall our total liability exceed the amount you paid to Brilla Prep in the twelve (12)
                    months preceding the claim.
                  </p>
                </div>
              </section>

              {/* Section 13: Termination */}
              <section id="termination" className="scroll-mt-24">
                <SectionHeader icon={XCircle} number={13} title="Termination" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>
                    We may terminate or suspend your account and access to the service immediately, without prior notice
                    or liability, for any reason, including if you breach these Terms.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="font-semibold text-white mb-3">You May</h4>
                      <ul className="space-y-2 text-sm text-white/70">
                        <li>• Delete your account at any time</li>
                        <li>• Request data export before deletion</li>
                        <li>• Cancel subscriptions before renewal</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="font-semibold text-white mb-3">Upon Termination</h4>
                      <ul className="space-y-2 text-sm text-white/70">
                        <li>• Your right to use the service ceases</li>
                        <li>• No refund for remaining subscription</li>
                        <li>• Your data may be deleted after 30 days</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 14: Changes to Terms */}
              <section id="changes" className="scroll-mt-24">
                <SectionHeader icon={RefreshCw} number={14} title="Changes to Terms" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>
                    We reserve the right to modify or replace these Terms at any time at our sole discretion. If a
                    revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
                  </p>

                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="font-semibold text-white mb-3">How We'll Notify You</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-secondary">•</span>
                        <span>Email notification to your registered email address</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-secondary">•</span>
                        <span>In-app notification when you log in</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-secondary">•</span>
                        <span>Banner notice on our website</span>
                      </li>
                    </ul>
                  </div>

                  <p>
                    By continuing to access or use our service after any revisions become effective, you agree to be
                    bound by the revised terms. If you do not agree to the new terms, you must stop using the service.
                  </p>
                </div>
              </section>

              {/* Section 15: Governing Law */}
              <section id="governing-law" className="scroll-mt-24">
                <SectionHeader icon={Gavel} number={15} title="Governing Law" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>
                    These Terms shall be governed and construed in accordance with the laws of the Republic of Ghana,
                    without regard to its conflict of law provisions.
                  </p>

                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="font-semibold text-white mb-3">Dispute Resolution</h4>
                    <p className="text-sm text-white/70 mb-4">
                      Any dispute arising out of or relating to these Terms or the service shall be resolved through:
                    </p>
                    <ol className="space-y-2 text-sm">
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary flex-shrink-0">1</span>
                        <span>Good faith negotiation between the parties</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary flex-shrink-0">2</span>
                        <span>Mediation, if negotiation fails</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary flex-shrink-0">3</span>
                        <span>Binding arbitration in Accra, Ghana</span>
                      </li>
                    </ol>
                  </div>
                </div>
              </section>

              {/* Section 16: Contact Us */}
              <section id="contact" className="scroll-mt-24">
                <SectionHeader icon={Mail} number={16} title="Contact Us" />
                <div className="mt-6 space-y-6 text-white/80">
                  <p>
                    If you have any questions about these Terms of Service, please contact us:
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-secondary" />
                        Email
                      </h4>
                      <a
                        href="mailto:legal@brillaprep.org"
                        className="text-secondary hover:underline block mb-1"
                      >
                        legal@brillaprep.org
                      </a>
                      <p className="text-sm text-white/50">For legal inquiries</p>
                    </div>

                    <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-primary" />
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
                    <p className="text-sm text-white/70">
                      <strong className="text-white">Brilla Prep</strong><br />
                      Accra, Ghana<br />
                      <br />
                      We aim to respond to all inquiries within 2-3 business days.
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
                    to="/privacy"
                    className="text-white/60 hover:text-white text-sm transition-colors flex items-center gap-1"
                  >
                    Privacy Policy
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
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/20 to-primary/10 border border-white/10">
        <Icon className="w-6 h-6 text-secondary" />
      </div>
      <div>
        <span className="text-xs text-white/40 uppercase tracking-wider">Section {number}</span>
        <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
      </div>
    </div>
  );
}

// Component: Service Card
function ServiceCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-secondary/30 transition-colors">
      <h4 className="font-semibold text-white mb-2">{title}</h4>
      <p className="text-sm text-white/60">{description}</p>
    </div>
  );
}

// Component: Requirement Item
function RequirementItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
      <span>{text}</span>
    </div>
  );
}

// Component: Payment Card
function PaymentCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="p-5 rounded-xl bg-white/5 border border-white/10">
      <h4 className="font-semibold text-white mb-3">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-white/70">
            <span className="text-secondary">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Component: Acceptable Card
function AcceptableCard({ title, items, type }: { title: string; items: string[]; type: 'allowed' | 'prohibited' }) {
  const isAllowed = type === 'allowed';
  return (
    <div className={cn(
      "p-4 rounded-xl border",
      isAllowed ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
    )}>
      <h4 className={cn(
        "font-semibold mb-3 flex items-center gap-2",
        isAllowed ? "text-green-300" : "text-red-300"
      )}>
        {isAllowed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className={cn(
            "text-sm",
            isAllowed ? "text-green-200/80" : "text-red-200/80"
          )}>
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Component: Prohibited Category
function ProhibitedCategory({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
      <h4 className="font-semibold text-red-300 mb-3 flex items-center gap-2">
        <Ban className="w-4 h-4" />
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-red-200/70">
            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
