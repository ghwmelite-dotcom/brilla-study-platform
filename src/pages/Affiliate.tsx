import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  Trophy,
  Target,
  Gift,
  Sparkles,
  Crown,
  ArrowRight,
  School,
  Wallet,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { useAffiliateStore } from '@/stores/affiliateStore';
import { useAuthStore } from '@/stores/authStore';
import { AffiliateGuide, ReferralEmailConsentCard } from '@/components/affiliate';
import { Modal } from '@/components/common/Modal';

type TabType = 'overview' | 'referrals' | 'leaderboard' | 'challenges' | 'earnings';
type MobileMoneyProvider = 'mtn' | 'vodafone' | 'airteltigo';

function normalizeGhanaPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('233') && digits.length === 12
    ? `0${digits.slice(3)}`
    : digits;
}

export default function Affiliate() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const {
    profile,
    dashboard,
    referrals,
    challenges,
    leaderboard,
    schoolLeaderboard,
    isAffiliate,
    fetchProfile,
    fetchDashboard,
    fetchReferrals,
    fetchChallenges,
    fetchLeaderboard,
    fetchSchoolLeaderboard,
    joinProgram,
    claimChallenge,
    copyReferralLink,
    updateMobileMoneyDetails,
  } = useAffiliateStore();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [copied, setCopied] = useState(false);
  const [leaderboardType, setLeaderboardType] = useState<'individual' | 'school'>('individual');
  const [isJoining, setIsJoining] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showMobileMoneySetup, setShowMobileMoneySetup] = useState(false);
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState<MobileMoneyProvider>('mtn');
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState('');
  const [mobileMoneyError, setMobileMoneyError] = useState<string | null>(null);
  const [isSavingMobileMoney, setIsSavingMobileMoney] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, fetchProfile]);

  useEffect(() => {
    if (isAffiliate) {
      fetchDashboard();
      fetchChallenges();
    }
  }, [isAffiliate, fetchDashboard, fetchChallenges]);

  useEffect(() => {
    if (activeTab === 'referrals' && isAffiliate) {
      fetchReferrals();
    } else if (activeTab === 'leaderboard') {
      fetchLeaderboard();
      fetchSchoolLeaderboard();
    }
  }, [activeTab, isAffiliate, fetchReferrals, fetchLeaderboard, fetchSchoolLeaderboard]);

  const handleJoinProgram = async () => {
    if (!isAuthenticated) {
      navigate('/register?affiliate=true');
      return;
    }

    setIsJoining(true);
    const success = await joinProgram();
    setIsJoining(false);

    if (success) {
      fetchDashboard();
    }
  };

  const handleCopyLink = async () => {
    const success = await copyReferralLink();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClaimChallenge = async (challengeId: string) => {
    await claimChallenge(challengeId);
  };

  const openMobileMoneySetup = () => {
    setMobileMoneyProvider(profile?.mobileMoneyProvider || 'mtn');
    setMobileMoneyNumber(profile?.mobileMoneyNumber || '');
    setMobileMoneyError(null);
    setShowMobileMoneySetup(true);
  };

  const closeMobileMoneySetup = () => {
    if (!isSavingMobileMoney) {
      setShowMobileMoneySetup(false);
    }
  };

  const handleMobileMoneySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedNumber = normalizeGhanaPhoneNumber(mobileMoneyNumber);

    if (!/^0[235][0-9]{8}$/.test(normalizedNumber)) {
      setMobileMoneyError('Enter a valid 10-digit Ghana mobile number, for example 0241234567.');
      return;
    }

    setMobileMoneyError(null);
    setIsSavingMobileMoney(true);
    const saved = await updateMobileMoneyDetails(normalizedNumber, mobileMoneyProvider);
    setIsSavingMobileMoney(false);

    if (saved) {
      setShowMobileMoneySetup(false);
      return;
    }

    setMobileMoneyError('We could not save your Mobile Money details. Please try again.');
  };

  // If not an affiliate, show join page
  if (!isAffiliate) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary to-accent rounded-2xl mb-6">
              <Gift className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">
              Become a Brilla Ambassador
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Share Brilla with your friends and classmates. Earn up to 50% commission
              on every subscription while helping others excel in their exams!
            </p>
            <button
              onClick={() => setShowGuide(true)}
              className="mt-4 inline-flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">View Complete Guide</span>
            </button>
          </div>

          {/* Affiliate Guide Modal */}
          <AffiliateGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />

          {/* Tier Cards */}
          <div className="grid md:grid-cols-5 gap-4 mb-12">
            {[
              { name: 'Scout', icon: '🔰', rate: '25%', referrals: '1-5', color: 'bg-green-100' },
              { name: 'Champion', icon: '⚔️', rate: '30%', referrals: '6-15', color: 'bg-blue-100' },
              { name: 'Ambassador', icon: '🛡️', rate: '40%', referrals: '16-30', color: 'bg-purple-100' },
              { name: 'Legend', icon: '👑', rate: '50%', referrals: '31-50', color: 'bg-amber-100' },
              { name: 'Elite', icon: '💎', rate: '50%+', referrals: '51+', color: 'bg-pink-100' },
            ].map((tier) => (
              <div key={tier.name} className={`${tier.color} rounded-xl p-4 text-center`}>
                <span className="text-3xl mb-2 block">{tier.icon}</span>
                <h3 className="font-semibold text-neutral-900">{tier.name}</h3>
                <p className="text-2xl font-bold text-neutral-900 mt-1">{tier.rate}</p>
                <p className="text-xs text-neutral-600">{tier.referrals} referrals</p>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 border border-neutral-200">
              <DollarSign className="w-10 h-10 text-green-500 mb-4" />
              <h3 className="font-semibold text-neutral-900 mb-2">Earn Real Money</h3>
              <p className="text-sm text-neutral-600">
                Withdraw your earnings directly to your Mobile Money account
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-neutral-200">
              <Trophy className="w-10 h-10 text-amber-500 mb-4" />
              <h3 className="font-semibold text-neutral-900 mb-2">Compete & Win</h3>
              <p className="text-sm text-neutral-600">
                Top affiliates get featured on leaderboards and win prizes
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-neutral-200">
              <Sparkles className="w-10 h-10 text-purple-500 mb-4" />
              <h3 className="font-semibold text-neutral-900 mb-2">Earn XP & Badges</h3>
              <p className="text-sm text-neutral-600">
                Complete challenges to earn XP, unlock badges, and level up
              </p>
            </div>
          </div>

          {/* Teacher Bonus */}
          {user?.role === 'teacher' && (
            <div className="bg-gradient-to-r from-accent-100 to-purple-100 rounded-xl p-6 mb-12">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <Crown className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">Teacher Bonus!</h3>
                  <p className="text-sm text-neutral-600">
                    Your referrals count as <span className="font-bold">1.5x</span> toward tier progression
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="text-center">
            <button
              onClick={handleJoinProgram}
              disabled={isJoining}
              className="bg-gradient-to-r from-primary to-accent text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {isJoining ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  Join Affiliate Program
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            <p className="text-sm text-neutral-500 mt-4">
              Free to join. Start earning today!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Affiliate Dashboard
  return (
    <div className="min-h-screen bg-neutral-50 py-6 px-4">
      {/* Affiliate Guide Modal */}
      <AffiliateGuide
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        referralLink={profile?.referralLink}
      />

      <Modal
        isOpen={showMobileMoneySetup}
        onClose={closeMobileMoneySetup}
        title={profile?.mobileMoneyNumber ? 'Change Mobile Money account' : 'Set up Mobile Money'}
        description="Add your Mobile Money details for future affiliate withdrawals."
        size="sm"
        closeOnOverlayClick={!isSavingMobileMoney}
      >
        <form id="mobile-money-form" className="space-y-4" onSubmit={handleMobileMoneySubmit}>
          <div>
            <label
              htmlFor="mobile-money-provider"
              className="mb-1.5 block text-sm font-medium text-neutral-800"
            >
              Network
            </label>
            <select
              id="mobile-money-provider"
              value={mobileMoneyProvider}
              onChange={(event) => setMobileMoneyProvider(event.target.value as MobileMoneyProvider)}
              disabled={isSavingMobileMoney}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="mtn">MTN Mobile Money</option>
              <option value="vodafone">Telecel Cash</option>
              <option value="airteltigo">AT Money</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="mobile-money-number"
              className="mb-1.5 block text-sm font-medium text-neutral-800"
            >
              Mobile Money number
            </label>
            <input
              id="mobile-money-number"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={mobileMoneyNumber}
              onChange={(event) => setMobileMoneyNumber(event.target.value)}
              disabled={isSavingMobileMoney}
              aria-describedby="mobile-money-help mobile-money-error"
              placeholder="0241234567"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p id="mobile-money-help" className="mt-1.5 text-xs text-neutral-500">
              Use the Ghana number registered to the selected Mobile Money account.
            </p>
          </div>

          {mobileMoneyError && (
            <p
              id="mobile-money-error"
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {mobileMoneyError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeMobileMoneySetup}
              disabled={isSavingMobileMoney}
              className="min-h-11 rounded-lg border border-neutral-300 px-4 py-2 font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingMobileMoney}
              className="min-h-11 rounded-lg bg-primary px-5 py-2 font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingMobileMoney ? 'Saving...' : 'Save Mobile Money'}
            </button>
          </div>
        </form>
      </Modal>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Affiliate Dashboard</h1>
              <p className="text-neutral-600">Track your referrals and earnings</p>
            </div>
            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Guide</span>
            </button>
          </div>

          {/* Referral Link */}
          <div className="flex items-center gap-2 bg-white rounded-xl border border-neutral-200 p-2">
            <div className="px-3 py-2 bg-neutral-50 rounded-lg">
              <code className="text-sm text-neutral-600">
                {profile?.referralLink?.replace('https://', '').substring(0, 30)}...
              </code>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {user?.role === 'student' && (
          <ReferralEmailConsentCard surface="affiliate_dashboard" className="mb-8" />
        )}

        {/* Tier Progress */}
        {profile && (
          <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-6 text-white mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl">{profile.tier.badgeIcon}</div>
                <div>
                  <p className="text-white/80 text-sm">Current Rank</p>
                  <h2 className="text-2xl font-bold">{profile.tier.title}</h2>
                  <p className="text-white/90">
                    {Math.round(profile.tier.commissionRate * 100)}% commission rate
                  </p>
                </div>
              </div>

              {profile.nextTier && (
                <div className="text-right">
                  <p className="text-white/80 text-sm">Next Rank</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{profile.nextTier.badgeIcon}</span>
                    <span className="font-bold">{profile.nextTier.title}</span>
                  </div>
                  <p className="text-white/90">
                    {profile.nextTier.referralsNeeded} more referrals
                  </p>
                </div>
              )}
            </div>

            {profile.nextTier && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>{profile.stats.effectiveReferrals} referrals</span>
                  <span>{profile.nextTier.minReferrals} needed</span>
                </div>
                <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        (profile.stats.effectiveReferrals / profile.nextTier.minReferrals) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {profile.isTeacher && (
              <div className="mt-4 bg-white/20 rounded-lg px-4 py-2 inline-flex items-center gap-2">
                <Crown className="w-4 h-4" />
                <span className="text-sm">Teacher Bonus: 1.5x tier progression</span>
              </div>
            )}
          </div>
        )}

        {/* Stats Grid */}
        {dashboard && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 border border-neutral-200">
              <div className="flex items-center gap-2 text-neutral-500 mb-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">Total Referrals</span>
              </div>
              <p className="text-2xl font-bold text-neutral-900">{dashboard.stats.totalReferrals}</p>
              <p className="text-xs text-green-600">+{dashboard.stats.referralsThisMonth} this month</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-neutral-200">
              <div className="flex items-center gap-2 text-neutral-500 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Conversions</span>
              </div>
              <p className="text-2xl font-bold text-neutral-900">{dashboard.stats.successfulConversions}</p>
              <p className="text-xs text-neutral-500">{dashboard.stats.conversionRate}% rate</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-neutral-200">
              <div className="flex items-center gap-2 text-neutral-500 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Total Earnings</span>
              </div>
              <p className="text-2xl font-bold text-neutral-900">{dashboard.stats.totalEarnings} GHS</p>
              <p className="text-xs text-green-600">+{dashboard.stats.earningsThisMonth} this month</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-neutral-200">
              <div className="flex items-center gap-2 text-neutral-500 mb-2">
                <Wallet className="w-4 h-4" />
                <span className="text-sm">Available</span>
              </div>
              <p className="text-2xl font-bold text-neutral-900">{dashboard.stats.availableEarnings} GHS</p>
              <button
                onClick={() => setActiveTab('earnings')}
                className="text-xs text-primary hover:underline"
              >
                Withdraw
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-neutral-200 mb-8">
          <div className="flex border-b border-neutral-200 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'referrals', label: 'Referrals', icon: Users },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
              { id: 'challenges', label: 'Challenges', icon: Target },
              { id: 'earnings', label: 'Earnings', icon: DollarSign },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && dashboard && (
              <div className="space-y-6">
                {/* Recent Referrals */}
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-4">Recent Referrals</h3>
                  {dashboard.recentReferrals.length > 0 ? (
                    <div className="space-y-3">
                      {dashboard.recentReferrals.map((ref) => (
                        <div
                          key={ref.id}
                          className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary font-semibold">
                                {ref.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900">{ref.name}</p>
                              <p className="text-xs text-neutral-500">{ref.role}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                ref.status === 'converted'
                                  ? 'bg-green-100 text-green-700'
                                  : ref.status === 'trial'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-neutral-100 text-neutral-600'
                              }`}
                            >
                              {ref.status}
                            </span>
                            <p className="text-xs text-neutral-500 mt-1">
                              {new Date(ref.signupAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-500 text-center py-8">
                      No referrals yet. Share your link to get started!
                    </p>
                  )}
                </div>

                {/* Active Campaigns */}
                {dashboard.activeCampaigns.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-4">Active Campaigns</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {dashboard.activeCampaigns.map((campaign) => (
                        <div
                          key={campaign.id}
                          className="bg-gradient-to-r from-accent-100 to-purple-100 rounded-xl p-4"
                        >
                          <h4 className="font-semibold text-neutral-900">{campaign.name}</h4>
                          <p className="text-sm text-neutral-600 mt-1">{campaign.description}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-sm font-medium text-accent">
                              {campaign.commissionMultiplier}x commission
                            </span>
                            <span className="text-xs text-neutral-500">
                              Ends {new Date(campaign.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Referrals Tab */}
            {activeTab === 'referrals' && (
              <div>
                {referrals.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-neutral-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">User</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Signup Date</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-neutral-500">Commission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrals.map((ref) => (
                          <tr key={ref.id} className="border-b border-neutral-100">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                  <span className="text-primary text-sm font-semibold">
                                    {ref.referredUser.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-neutral-900">{ref.referredUser.name}</p>
                                  <p className="text-xs text-neutral-500">{ref.referredUser.schoolName}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  ref.status === 'converted'
                                    ? 'bg-green-100 text-green-700'
                                    : ref.status === 'trial'
                                    ? 'bg-blue-100 text-blue-700'
                                    : ref.status === 'churned'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-neutral-100 text-neutral-600'
                                }`}
                              >
                                {ref.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-neutral-600">
                              {new Date(ref.signupAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {ref.commission ? (
                                <span className="font-medium text-green-600">
                                  {ref.commission.amount} GHS
                                </span>
                              ) : (
                                <span className="text-neutral-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-neutral-500 text-center py-8">
                    No referrals yet. Share your link to get started!
                  </p>
                )}
              </div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <div>
                {/* Leaderboard Type Toggle */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setLeaderboardType('individual')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      leaderboardType === 'individual'
                        ? 'bg-primary text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Individual
                  </button>
                  <button
                    onClick={() => setLeaderboardType('school')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      leaderboardType === 'school'
                        ? 'bg-primary text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    <School className="w-4 h-4" />
                    Schools
                  </button>
                </div>

                {leaderboardType === 'individual' ? (
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={entry.affiliateId}
                        className={`flex items-center justify-between p-4 rounded-xl ${
                          index < 3 ? 'bg-gradient-to-r from-amber-50 to-orange-50' : 'bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0
                                ? 'bg-amber-400 text-white'
                                : index === 1
                                ? 'bg-neutral-400 text-white'
                                : index === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-neutral-200 text-neutral-600'
                            }`}
                          >
                            {entry.rank}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-neutral-900">{entry.name}</span>
                              <span>{entry.tier.badgeIcon}</span>
                              {entry.isTeacher && (
                                <span className="bg-accent-100 text-accent text-xs px-2 py-0.5 rounded-full">
                                  Teacher
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-500">{entry.schoolName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-neutral-900">{entry.conversions} conversions</p>
                          <p className="text-xs text-green-600">{entry.earnings} GHS earned</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {schoolLeaderboard.map((entry) => (
                      <div
                        key={entry.schoolName}
                        className={`flex items-center justify-between p-4 rounded-xl ${
                          entry.rank <= 3 ? 'bg-gradient-to-r from-blue-50 to-purple-50' : 'bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              entry.rank === 1
                                ? 'bg-amber-400 text-white'
                                : entry.rank === 2
                                ? 'bg-neutral-400 text-white'
                                : entry.rank === 3
                                ? 'bg-amber-700 text-white'
                                : 'bg-neutral-200 text-neutral-600'
                            }`}
                          >
                            {entry.rank}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">{entry.schoolName}</p>
                            <p className="text-xs text-neutral-500">
                              {entry.totalAffiliates} affiliates
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-neutral-900">{entry.totalConversions} conversions</p>
                          <p className="text-xs text-neutral-500">{entry.totalReferrals} referrals</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Challenges Tab */}
            {activeTab === 'challenges' && (
              <div className="grid md:grid-cols-2 gap-4">
                {challenges.map((challenge) => {
                  const progress = Math.min(
                    (challenge.progress / challenge.requirementValue) * 100,
                    100
                  );
                  const isCompleted = challenge.status === 'completed';
                  const isClaimed = challenge.status === 'claimed';

                  return (
                    <div
                      key={challenge.id}
                      className={`p-4 rounded-xl border ${
                        isClaimed
                          ? 'border-green-200 bg-green-50'
                          : isCompleted
                          ? 'border-primary-200 bg-primary-50'
                          : 'border-neutral-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{challenge.badgeIcon || '🎯'}</span>
                            <h4 className="font-semibold text-neutral-900">{challenge.name}</h4>
                          </div>
                          <p className="text-sm text-neutral-600 mt-1">{challenge.description}</p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            challenge.type === 'daily'
                              ? 'bg-blue-100 text-blue-700'
                              : challenge.type === 'weekly'
                              ? 'bg-purple-100 text-purple-700'
                              : challenge.type === 'monthly'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {challenge.type}
                        </span>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-600">
                            {challenge.progress} / {challenge.requirementValue}
                          </span>
                          <span className="text-neutral-500">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isClaimed ? 'bg-green-500' : 'bg-primary'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {challenge.xpReward > 0 && (
                            <span className="flex items-center gap-1 text-sm text-purple-600">
                              <Sparkles className="w-4 h-4" />
                              {challenge.xpReward} XP
                            </span>
                          )}
                          {challenge.cashBonus > 0 && (
                            <span className="flex items-center gap-1 text-sm text-green-600">
                              <DollarSign className="w-4 h-4" />
                              {challenge.cashBonus} GHS
                            </span>
                          )}
                        </div>

                        {isCompleted && !isClaimed && (
                          <button
                            onClick={() => handleClaimChallenge(challenge.id)}
                            className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                          >
                            Claim Reward
                          </button>
                        )}
                        {isClaimed && (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <Check className="w-4 h-4" />
                            Claimed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Earnings Tab */}
            {activeTab === 'earnings' && profile && (
              <div className="space-y-6">
                {/* Balance Summary */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <p className="text-sm text-neutral-500 mb-1">Total Earned</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {profile.stats.totalEarnings} GHS
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4">
                    <p className="text-sm text-amber-600 mb-1">Pending</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {profile.stats.pendingEarnings} GHS
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-sm text-green-600 mb-1">Available to Withdraw</p>
                    <p className="text-2xl font-bold text-green-700">
                      {profile.stats.availableEarnings} GHS
                    </p>
                  </div>
                </div>

                {/* Withdraw Section */}
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                  <h3 className="font-semibold text-neutral-900 mb-4">Withdraw Funds</h3>

                  {profile.mobileMoneyNumber ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                        <div>
                          <p className="text-sm text-neutral-500">Mobile Money</p>
                          <p className="font-medium text-neutral-900">
                            {profile.mobileMoneyProvider?.toUpperCase()} - {profile.mobileMoneyNumber}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={openMobileMoneySetup}
                          className="min-h-11 px-3 text-sm font-medium text-primary hover:underline"
                        >
                          Change
                        </button>
                      </div>

                      <button
                        disabled={profile.stats.availableEarnings < 100}
                        className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {profile.stats.availableEarnings < 100
                          ? 'Minimum withdrawal: 100 GHS'
                          : `Withdraw ${profile.stats.availableEarnings} GHS`}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Wallet className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                      <p className="text-neutral-600 mb-4">
                        Set up your Mobile Money account to withdraw earnings
                      </p>
                      <button
                        type="button"
                        onClick={openMobileMoneySetup}
                        className="min-h-11 bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors"
                      >
                        Set Up Mobile Money
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
