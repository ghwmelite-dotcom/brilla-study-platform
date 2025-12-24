import { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Share2,
  Users,
  DollarSign,
  Trophy,
  Wallet,
  Sparkles,
  Gift,
  Target,
  TrendingUp,
  CheckCircle,
  Copy,
  Calculator,
  HelpCircle,
  ChevronDown,
  Lightbulb,
  Star,
  Crown,
  Zap,
  ArrowRight,
  Play,
} from 'lucide-react';
import { cn } from '@/utils';

interface AffiliateGuideProps {
  isOpen: boolean;
  onClose: () => void;
  referralLink?: string;
}

// Tier data
const TIERS = [
  { name: 'Scout', icon: '🔰', rate: 25, minReferrals: 1, maxReferrals: 5, color: 'from-green-400 to-emerald-500', perks: ['Basic commission rate', 'Access to challenges'] },
  { name: 'Champion', icon: '⚔️', rate: 30, minReferrals: 6, maxReferrals: 15, color: 'from-blue-400 to-indigo-500', perks: ['Higher commission', 'Early campaign access', 'Badge on profile'] },
  { name: 'Ambassador', icon: '🛡️', rate: 40, minReferrals: 16, maxReferrals: 30, color: 'from-purple-400 to-violet-500', perks: ['Premium support', 'Exclusive resources', 'Featured on leaderboard'] },
  { name: 'Legend', icon: '👑', rate: 50, minReferrals: 31, maxReferrals: 50, color: 'from-amber-400 to-orange-500', perks: ['Maximum commission', 'VIP events access', 'Custom promo codes'] },
  { name: 'Elite', icon: '💎', rate: 50, minReferrals: 51, maxReferrals: null, color: 'from-pink-400 to-rose-500', perks: ['50%+ with bonuses', 'Direct support line', 'Revenue share bonuses'] },
];

// FAQ data
const FAQS = [
  {
    question: 'How do I get paid?',
    answer: 'Earnings are paid directly to your Mobile Money account. Set up your payment details in the Earnings tab, and request a withdrawal once you reach the minimum balance of 10 GHS.',
  },
  {
    question: 'When do I earn commission?',
    answer: 'You earn commission when someone signs up using your referral link AND subscribes to a premium plan. Trial signups become pending commissions that convert when they subscribe.',
  },
  {
    question: 'How long does withdrawal take?',
    answer: 'Withdrawals are typically processed within 24-48 hours on business days. You\'ll receive a notification once your payment is complete.',
  },
  {
    question: 'Do referrals expire?',
    answer: 'No! Once someone signs up with your link, they\'re linked to you forever. Even if they subscribe months later, you\'ll still earn the commission.',
  },
  {
    question: 'What\'s the teacher bonus?',
    answer: 'Teachers get a 1.5x multiplier on tier progression. This means if you refer 10 students, it counts as 15 toward your next tier!',
  },
  {
    question: 'Can I promote on social media?',
    answer: 'Absolutely! Share your link on WhatsApp, Facebook, Instagram, Twitter, or any platform. We provide marketing materials in the Resources section.',
  },
];

// Tips data
const TIPS = [
  { icon: Share2, title: 'Share Strategically', description: 'Post during exam seasons when students are actively looking for study resources.' },
  { icon: Users, title: 'Target Study Groups', description: 'Join WhatsApp groups and forums where students discuss exams and studying.' },
  { icon: Star, title: 'Share Your Experience', description: 'Personal testimonials convert better. Tell people how Brilla helped you!' },
  { icon: Target, title: 'Focus on Benefits', description: 'Highlight AI grading, instant feedback, and exam preparation features.' },
  { icon: Trophy, title: 'Complete Challenges', description: 'Daily and weekly challenges give you extra cash bonuses and XP.' },
  { icon: TrendingUp, title: 'Track Your Progress', description: 'Check your dashboard regularly to see what\'s working and optimize.' },
];

// Step content
const STEPS = [
  {
    title: 'Welcome to the Affiliate Program!',
    subtitle: 'Earn money while helping students succeed',
    icon: Gift,
    content: 'join',
  },
  {
    title: 'How It Works',
    subtitle: 'Three simple steps to start earning',
    icon: Zap,
    content: 'how-it-works',
  },
  {
    title: 'Tier System',
    subtitle: 'Unlock higher commissions as you grow',
    icon: Crown,
    content: 'tiers',
  },
  {
    title: 'Commission Calculator',
    subtitle: 'See your earning potential',
    icon: Calculator,
    content: 'calculator',
  },
  {
    title: 'Pro Tips',
    subtitle: 'Maximize your success',
    icon: Lightbulb,
    content: 'tips',
  },
  {
    title: 'FAQs',
    subtitle: 'Common questions answered',
    icon: HelpCircle,
    content: 'faq',
  },
];

export default function AffiliateGuide({ isOpen, onClose, referralLink }: AffiliateGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [calcReferrals, setCalcReferrals] = useState(10);
  const [calcPlan, setCalcPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [animateIn, setAnimateIn] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAnimateIn(true);
      setCurrentStep(0);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  // Auto-rotate tips
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Calculate commission based on tier
  const getCommissionRate = (referrals: number) => {
    const tier = TIERS.find(t => referrals >= t.minReferrals && (t.maxReferrals === null || referrals <= t.maxReferrals));
    return tier?.rate || 25;
  };

  const calculateEarnings = () => {
    const rate = getCommissionRate(calcReferrals);
    const planPrice = calcPlan === 'monthly' ? 50 : 480;
    return {
      perReferral: Math.round(planPrice * (rate / 100)),
      total: Math.round(calcReferrals * planPrice * (rate / 100)),
      rate,
    };
  };

  if (!isOpen) return null;

  const earnings = calculateEarnings();
  const currentTier = TIERS.find(t => calcReferrals >= t.minReferrals && (t.maxReferrals === null || calcReferrals <= t.maxReferrals));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          animateIn ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500",
          animateIn ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-8"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary via-accent to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                {(() => {
                  const StepIcon = STEPS[currentStep].icon;
                  return <StepIcon className="w-6 h-6" />;
                })()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{STEPS[currentStep].title}</h2>
                <p className="text-white/80 text-sm">{STEPS[currentStep].subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  index === currentStep
                    ? "w-8 bg-white"
                    : index < currentStep
                    ? "bg-white/80"
                    : "bg-white/40"
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Welcome */}
          {currentStep === 0 && (
            <div className="text-center animate-fadeIn">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full mb-6">
                <Gift className="w-12 h-12 text-primary animate-bounce" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                Turn Your Network Into Earnings!
              </h3>
              <p className="text-neutral-600 max-w-lg mx-auto mb-8">
                Share Brilla with friends, classmates, and study groups. Every time someone subscribes
                using your link, you earn up to <span className="font-bold text-primary">50% commission</span>!
              </p>

              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: Share2, label: 'Share Your Link', value: 'Easy to share' },
                  { icon: Users, label: 'Friends Subscribe', value: 'They get premium' },
                  { icon: DollarSign, label: 'You Earn Cash', value: 'Up to 50%' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-4 bg-neutral-50 rounded-xl animate-slideUp"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-semibold text-neutral-900">{item.label}</h4>
                    <p className="text-sm text-neutral-500">{item.value}</p>
                  </div>
                ))}
              </div>

              {referralLink && (
                <div className="bg-neutral-100 rounded-xl p-4 flex items-center gap-3 max-w-md mx-auto">
                  <code className="flex-1 text-sm text-neutral-600 truncate">
                    {referralLink}
                  </code>
                  <button
                    onClick={handleCopyLink}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                      copied
                        ? "bg-green-500 text-white"
                        : "bg-primary text-white hover:bg-primary-dark"
                    )}
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: How It Works */}
          {currentStep === 1 && (
            <div className="animate-fadeIn">
              <div className="relative">
                {[
                  { icon: Share2, title: 'Share Your Link', description: 'Copy your unique referral link and share it on WhatsApp, social media, or with friends directly.', color: 'bg-blue-500' },
                  { icon: Users, title: 'Friends Sign Up', description: 'When someone clicks your link and creates an account, they\'re linked to you as the referrer.', color: 'bg-purple-500' },
                  { icon: Play, title: 'They Start Trial', description: 'Your referral gets a 14-day free trial with full premium access. Your commission becomes "pending".', color: 'bg-amber-500' },
                  { icon: DollarSign, title: 'They Subscribe', description: 'When they subscribe to premium, your pending commission is confirmed and added to your balance!', color: 'bg-green-500' },
                  { icon: Wallet, title: 'You Withdraw', description: 'Once you have 10 GHS or more, withdraw directly to your Mobile Money account anytime.', color: 'bg-pink-500' },
                ].map((step, index) => (
                  <div
                    key={index}
                    className="flex gap-4 mb-6 animate-slideUp"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="relative flex flex-col items-center">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white", step.color)}>
                        <step.icon className="w-6 h-6" />
                      </div>
                      {index < 4 && (
                        <div className="w-0.5 h-full bg-neutral-200 absolute top-14" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <h4 className="font-semibold text-neutral-900 mb-1">{step.title}</h4>
                      <p className="text-sm text-neutral-600">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-800">Pro Tip</h4>
                    <p className="text-sm text-amber-700">
                      Share during exam seasons (BECE, WASSCE prep time) when students are actively looking for study resources!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Tiers */}
          {currentStep === 2 && (
            <div className="animate-fadeIn">
              <p className="text-center text-neutral-600 mb-6">
                The more referrals you make, the higher your commission rate!
              </p>

              <div className="space-y-4">
                {TIERS.map((tier, index) => (
                  <div
                    key={tier.name}
                    className="animate-slideUp"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      "hover:shadow-lg hover:scale-[1.02]",
                      "border-neutral-200"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-r",
                            tier.color
                          )}>
                            {tier.icon}
                          </div>
                          <div>
                            <h4 className="font-bold text-neutral-900">{tier.name}</h4>
                            <p className="text-sm text-neutral-500">
                              {tier.minReferrals}{tier.maxReferrals ? `-${tier.maxReferrals}` : '+'} referrals
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{tier.rate}%</p>
                          <p className="text-xs text-neutral-500">commission</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {tier.perks.map((perk, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full"
                          >
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            {perk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-purple-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-start gap-3">
                  <Crown className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-purple-800">Teacher Bonus</h4>
                    <p className="text-sm text-purple-700">
                      Teachers get 1.5x tier progression! 10 referrals count as 15 toward your next tier.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Calculator */}
          {currentStep === 3 && (
            <div className="animate-fadeIn">
              <div className="bg-neutral-50 rounded-xl p-6 mb-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Number of Referrals
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={calcReferrals}
                      onChange={(e) => setCalcReferrals(Number(e.target.value))}
                      className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-sm text-neutral-500 mt-1">
                      <span>1</span>
                      <span className="font-bold text-primary text-lg">{calcReferrals}</span>
                      <span>100</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Subscription Plan
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCalcPlan('monthly')}
                        className={cn(
                          "flex-1 py-3 rounded-xl font-medium transition-all",
                          calcPlan === 'monthly'
                            ? "bg-primary text-white"
                            : "bg-white text-neutral-600 border border-neutral-200"
                        )}
                      >
                        Monthly (50 GHS)
                      </button>
                      <button
                        onClick={() => setCalcPlan('yearly')}
                        className={cn(
                          "flex-1 py-3 rounded-xl font-medium transition-all",
                          calcPlan === 'yearly'
                            ? "bg-primary text-white"
                            : "bg-white text-neutral-600 border border-neutral-200"
                        )}
                      >
                        Yearly (480 GHS)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-neutral-200 text-center">
                  <p className="text-sm text-neutral-500 mb-1">Your Tier</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl">{currentTier?.icon}</span>
                    <span className="font-bold text-neutral-900">{currentTier?.name}</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-neutral-200 text-center">
                  <p className="text-sm text-neutral-500 mb-1">Commission Rate</p>
                  <p className="text-2xl font-bold text-primary">{earnings.rate}%</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-neutral-200 text-center">
                  <p className="text-sm text-neutral-500 mb-1">Per Referral</p>
                  <p className="text-2xl font-bold text-green-600">{earnings.perReferral} GHS</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white text-center">
                <p className="text-white/80 mb-2">Your Total Earnings</p>
                <p className="text-5xl font-bold mb-2 animate-pulse">{earnings.total} GHS</p>
                <p className="text-white/80">
                  from {calcReferrals} {calcPlan} subscribers
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Tips */}
          {currentStep === 4 && (
            <div className="animate-fadeIn">
              {/* Featured Tip */}
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    {(() => {
                      const TipIcon = TIPS[tipIndex].icon;
                      return (
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white">
                          <TipIcon className="w-6 h-6" />
                        </div>
                      );
                    })()}
                    <div>
                      <p className="text-xs text-primary font-medium">TIP {tipIndex + 1} OF {TIPS.length}</p>
                      <h4 className="font-bold text-neutral-900">{TIPS[tipIndex].title}</h4>
                    </div>
                  </div>
                  <p className="text-neutral-600">{TIPS[tipIndex].description}</p>
                </div>

                {/* Tip indicators */}
                <div className="flex justify-center gap-1 mt-4">
                  {TIPS.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setTipIndex(index)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        index === tipIndex ? "w-6 bg-primary" : "bg-neutral-300"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* All Tips Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {TIPS.map((tip, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all cursor-pointer animate-slideUp",
                      index === tipIndex
                        ? "border-primary bg-primary/5"
                        : "border-neutral-200 hover:border-primary/50"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => setTipIndex(index)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        index === tipIndex ? "bg-primary text-white" : "bg-neutral-100 text-neutral-600"
                      )}>
                        <tip.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-neutral-900">{tip.title}</h4>
                        <p className="text-sm text-neutral-500">{tip.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: FAQ */}
          {currentStep === 5 && (
            <div className="animate-fadeIn">
              <div className="space-y-3">
                {FAQS.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-neutral-200 rounded-xl overflow-hidden animate-slideUp"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 transition-colors"
                    >
                      <span className="font-medium text-neutral-900">{faq.question}</span>
                      <ChevronDown
                        className={cn(
                          "w-5 h-5 text-neutral-400 transition-transform duration-300",
                          expandedFaq === index && "rotate-180"
                        )}
                      />
                    </button>
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-300",
                        expandedFaq === index ? "max-h-48" : "max-h-0"
                      )}
                    >
                      <div className="p-4 pt-0 text-neutral-600 text-sm">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800">Still have questions?</h4>
                    <p className="text-sm text-blue-700">
                      Contact our support team at support@brillaprep.org or use the Help Center in the app.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-neutral-200 p-4 flex items-center justify-between bg-neutral-50">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all",
              currentStep === 0
                ? "text-neutral-300 cursor-not-allowed"
                : "text-neutral-600 hover:bg-neutral-200"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-center gap-3">
            {currentStep === STEPS.length - 1 ? (
              <button
                onClick={onClose}
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white px-6 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(Math.min(STEPS.length - 1, currentStep + 1))}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-xl font-medium hover:bg-primary-dark transition-colors"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
