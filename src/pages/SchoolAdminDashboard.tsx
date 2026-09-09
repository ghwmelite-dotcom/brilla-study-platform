import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Users,
  Ticket,
  Copy,
  Check,
  RefreshCw,
  CreditCard,
  AlertTriangle,
  Eye,
  Flame,
  Star,
  Target,
  Award,
  BookOpen,
  ShieldOff,
  Clock,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, Button, Badge, ConfirmModal } from '@/components/common';
import { api, fetchWithAuth, getApiUrl } from '@/lib/api';
import { cn } from '@/utils';

// Mirrors workers/api/school-admin.ts response shapes (phase 2 self-serve API).

interface SchoolOverview {
  school: {
    id: string;
    name: string;
    status: string;
    seatTierId: string | null;
    seatExpiresAt: string | null;
    seatCode: string | null;
  };
  usage: {
    cap: number;
    codeUses: number;
    activeCount: number;
    expiredCount: number;
    revokedCount: number;
    drift: number;
  };
  daysRemaining: number | null;
  seatCredit: number;
  renewal: {
    renewalRemindedAt: string | null;
    renewalDue: boolean;
  };
}

interface SeatHolder {
  userId: string;
  fullName: string;
  username: string;
  grantedAt: string;
  analyticsOptedOut: boolean;
}

interface TopicArea {
  topicId: string;
  topicName: string;
  subjectName: string;
  mastery: number;
  questionsAttempted: number;
  questionsCorrect: number;
}

interface StudentProgress {
  studentId: string;
  studentName: string;
  studentAvatar: string | null;
  schoolLevel: string | null;
  yearGroup: number | null;
  house: string | null;
  xpPoints: number;
  level: number;
  streakDays: number;
  longestStreak: number;
  totalQuestionsAttempted: number;
  totalCorrect: number;
  overallAccuracy: number;
  topicsStarted: number;
  topicsMastered: number;
  strengthAreas: TopicArea[];
  weakAreas: TopicArea[];
  recentAchievements: {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: string;
  }[];
  lastActiveAt: string | null;
}

interface RenewResponse {
  authorizationUrl: string;
  reference: string;
  accessCode: string;
  amount: number;
  originalAmount: number;
  creditApplied: number;
}

type BillingCycle = 'monthly' | 'yearly';

// Package seat counts keyed by tier id — same mapping as
// SCHOOL_TIER_SEATS in workers/api/school-seats.ts (migration 372).
const SCHOOL_TIER_SEATS: Record<string, number> = {
  tier_school_25: 25,
  tier_school_50: 50,
  tier_school_100: 100,
  tier_school_250: 250,
};

function tierLabel(tierId: string | null): string {
  if (!tierId) return 'No package';
  const seats = SCHOOL_TIER_SEATS[tierId];
  return seats ? `${seats}-seat package` : 'Custom package';
}

export default function SchoolAdminDashboard() {
  const [overview, setOverview] = useState<SchoolOverview | null>(null);
  const [seats, setSeats] = useState<SeatHolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Seat code card
  const [copied, setCopied] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  // Progress viewer
  const [selectedStudent, setSelectedStudent] = useState<SeatHolder | null>(null);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressOptedOut, setProgressOptedOut] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  // Billing card
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [targetTierId, setTargetTierId] = useState<string>('');
  const [renewLoading, setRenewLoading] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    const [overviewRes, seatsRes] = await Promise.all([
      api.get<SchoolOverview>('/school-admin/overview'),
      api.get<SeatHolder[]>('/school-admin/seats'),
    ]);
    setIsLoading(false);
    if (overviewRes.success && overviewRes.data) {
      setOverview(overviewRes.data);
    } else {
      setLoadError(overviewRes.error || 'Failed to load school overview');
    }
    if (seatsRes.success && seatsRes.data) {
      setSeats(seatsRes.data);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const currentTierSeats = overview?.school.seatTierId
    ? SCHOOL_TIER_SEATS[overview.school.seatTierId] ?? null
    : null;

  // Upgrade targets: standard tiers at least as large as the current package
  // (renewing into a smaller package is admin-led and rejected by the API).
  const tierOptions = useMemo(
    () =>
      Object.entries(SCHOOL_TIER_SEATS)
        .filter(([, seats]) => currentTierSeats === null || seats >= currentTierSeats)
        .map(([id, seats]) => ({ id, label: `${seats} seats` })),
    [currentTierSeats],
  );

  useEffect(() => {
    if (overview?.school.seatTierId) {
      setTargetTierId(overview.school.seatTierId);
    }
  }, [overview?.school.seatTierId]);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleRegenerate = async () => {
    setRegenLoading(true);
    setRegenError(null);
    const res = await api.post<{ schoolId: string; seatCode: string }>(
      '/school-admin/seat-code/regenerate',
    );
    setRegenLoading(false);
    if (res.success && res.data) {
      setRegenOpen(false);
      setOverview((prev) =>
        prev ? { ...prev, school: { ...prev.school, seatCode: res.data!.seatCode } } : prev,
      );
    } else {
      setRegenError(res.error || 'Failed to regenerate seat code');
    }
  };

  const handleSelectStudent = async (seat: SeatHolder) => {
    setSelectedStudent(seat);
    setProgress(null);
    setProgressOptedOut(false);
    setProgressError(null);
    setProgressLoading(true);
    try {
      // fetchWithAuth (not the envelope client) so the 403 consent gate is
      // distinguishable from a generic failure by status code.
      const response = await fetchWithAuth(
        getApiUrl(`/api/school-admin/students/${seat.userId}/progress`),
      );
      const body = (await response.json()) as {
        success: boolean;
        data?: StudentProgress;
        error?: string;
      };
      if (response.status === 403) {
        setProgressOptedOut(true);
      } else if (body.success && body.data) {
        setProgress(body.data);
      } else {
        setProgressError(body.error || 'Failed to load student progress');
      }
    } catch (error) {
      setProgressError(error instanceof Error ? error.message : 'Failed to load student progress');
    } finally {
      setProgressLoading(false);
    }
  };

  const handleRenew = async () => {
    setRenewLoading(true);
    setRenewError(null);
    const body: { billingCycle: BillingCycle; tierId?: string } = { billingCycle };
    if (targetTierId && targetTierId !== overview?.school.seatTierId) {
      body.tierId = targetTierId;
    }
    const res = await api.post<RenewResponse>('/school-admin/billing/renew', body);
    if (res.success && res.data) {
      window.location.href = res.data.authorizationUrl;
      return;
    }
    setRenewLoading(false);
    setRenewError(res.error || 'Failed to start renewal checkout');
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError || !overview) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Card className="p-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <p className="font-medium">{loadError || 'Failed to load school overview'}</p>
          </div>
          <p className="mt-2 text-sm text-neutral-500">
            This dashboard is available to school administrator accounts linked to a school.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={loadDashboard}
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const { school, usage, daysRemaining, seatCredit, renewal } = overview;
  const expiryUrgent = daysRemaining !== null && daysRemaining <= 7;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            {school.name}
          </h1>
          <p className="text-neutral-500">School dashboard — seats, analytics and billing</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={loadDashboard}
        >
          Refresh
        </Button>
      </div>

      {renewal.renewalDue && (
        <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Your seat package
          {daysRemaining === 0 ? ' has expired' : ` expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`}
          — renew below to keep student access uninterrupted.
        </div>
      )}

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Ticket className="w-4 h-4 text-primary" />
            <p className="text-xs text-neutral-500">Package</p>
          </div>
          <p className="text-lg font-bold text-neutral-900">{tierLabel(school.seatTierId)}</p>
          <p className="text-xs text-neutral-400 capitalize">{school.status}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-neutral-500">Seats in use</p>
          </div>
          <p className="text-lg font-bold text-neutral-900">
            {usage.activeCount} <span className="text-sm font-normal text-neutral-500">/ {usage.cap}</span>
          </p>
          <p className="text-xs text-neutral-400">
            {usage.expiredCount} expired · {usage.revokedCount} revoked
            {usage.drift !== 0 && ` · drift ${usage.drift > 0 ? '+' : ''}${usage.drift}`}
          </p>
        </Card>

        <Card className={cn('p-4', expiryUrgent && 'ring-2 ring-red-300')}>
          <div className="flex items-center gap-2 mb-1">
            <Clock className={cn('w-4 h-4', expiryUrgent ? 'text-red-500' : 'text-orange-500')} />
            <p className="text-xs text-neutral-500">Package expiry</p>
          </div>
          {school.seatExpiresAt ? (
            <>
              <p className={cn('text-lg font-bold', expiryUrgent ? 'text-red-600' : 'text-neutral-900')}>
                {daysRemaining} day{daysRemaining === 1 ? '' : 's'} left
              </p>
              <p className="text-xs text-neutral-400">
                until {new Date(school.seatExpiresAt).toLocaleDateString()}
              </p>
            </>
          ) : (
            <p className="text-lg font-bold text-neutral-900">No expiry set</p>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-green-500" />
            <p className="text-xs text-neutral-500">Seat credit</p>
          </div>
          <p className="text-lg font-bold text-neutral-900">
            {seatCredit > 0 ? `GHS ${seatCredit.toLocaleString()}` : '—'}
          </p>
          <p className="text-xs text-neutral-400">
            {seatCredit > 0 ? 'Applied automatically at renewal' : 'From prorated seat reductions'}
          </p>
        </Card>
      </div>

      {/* Seat code card */}
      <Card className="p-6">
        <CardHeader
          title="Student Seat Code"
          subtitle="Share this code with students — they redeem it in Settings → School to get premium access"
        />
        {regenError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {regenError}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {school.seatCode ? (
            <code className="px-4 py-2 bg-neutral-100 rounded-lg text-xl font-semibold tracking-widest text-neutral-900">
              {school.seatCode}
            </code>
          ) : (
            <span className="text-sm text-neutral-500">No seat code set</span>
          )}
          {school.seatCode && (
            <Button variant="ghost" size="sm" onClick={() => handleCopyCode(school.seatCode!)}>
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setRegenOpen(true)}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Regenerate
          </Button>
        </div>
        <p className="mt-2 text-xs text-neutral-400">
          Redeemed {usage.codeUses} time{usage.codeUses === 1 ? '' : 's'}. Regenerating invalidates
          outstanding copies of the old code; students who already redeemed keep their seats.
        </p>
      </Card>

      {/* Seat holders + progress viewer */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Card className="p-6">
          <CardHeader
            title="Seat Holders"
            subtitle={`${seats.length} active seat${seats.length === 1 ? '' : 's'}`}
          />
          {seats.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No students have redeemed the seat code yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-2 pr-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Student</th>
                    <th className="text-left py-2 pr-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Joined</th>
                    <th className="text-left py-2 pr-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Analytics</th>
                    <th className="text-right py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {seats.map((seat) => (
                    <tr
                      key={seat.userId}
                      className={cn(
                        selectedStudent?.userId === seat.userId && 'bg-primary-50/50',
                      )}
                    >
                      <td className="py-3 pr-3">
                        <p className="text-sm font-medium text-neutral-900">{seat.fullName}</p>
                        <p className="text-xs text-neutral-500">{seat.username}</p>
                      </td>
                      <td className="py-3 pr-3 text-sm text-neutral-600">
                        {new Date(seat.grantedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-3">
                        {seat.analyticsOptedOut ? (
                          <Badge variant="warning" size="sm">Opted out</Badge>
                        ) : (
                          <Badge variant="success" size="sm">Shared</Badge>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          isLoading={progressLoading && selectedStudent?.userId === seat.userId}
                          onClick={() => handleSelectStudent(seat)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Per-student progress (read-only) */}
        <Card className="p-6">
          <CardHeader
            title="Student Progress"
            subtitle={
              selectedStudent
                ? `${selectedStudent.fullName} — read-only`
                : 'Select a seat holder to view their analytics'
            }
          />
          {!selectedStudent && (
            <p className="text-sm text-neutral-500">
              Pick a student from the seat holders table. Students who opted out of analytics
              sharing are hidden by their own choice.
            </p>
          )}
          {selectedStudent && progressLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          {selectedStudent && !progressLoading && progressOptedOut && (
            <div className="p-4 bg-amber-50 rounded-lg flex items-start gap-3">
              <ShieldOff className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {selectedStudent.fullName} has opted out of analytics sharing
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  This student chose not to share their learning analytics with the school.
                  Their progress becomes visible again only if they opt back in from their own
                  Settings → School page.
                </p>
              </div>
            </div>
          )}
          {selectedStudent && !progressLoading && progressError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {progressError}
            </div>
          )}
          {selectedStudent && !progressLoading && progress && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center">
                  {progress.studentAvatar ? (
                    <img
                      src={progress.studentAvatar}
                      alt={progress.studentName}
                      className="w-11 h-11 rounded-full"
                    />
                  ) : (
                    <span className="text-lg font-bold text-primary">
                      {progress.studentName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">{progress.studentName}</p>
                  <p className="text-xs text-neutral-500">
                    {progress.schoolLevel?.toUpperCase()}
                    {progress.yearGroup ? ` Year ${progress.yearGroup}` : ''}
                    {progress.house ? ` · ${progress.house}` : ''}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1">
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span className="font-bold text-neutral-900">{progress.streakDays}</span>
                  </div>
                  <p className="text-xs text-neutral-500">Streak</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-3 h-3 text-blue-500" />
                    <span className="font-bold text-neutral-900">{progress.level}</span>
                  </div>
                  <p className="text-xs text-neutral-500">Level</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1">
                    <Target className="w-3 h-3 text-green-500" />
                    <span className="font-bold text-neutral-900">{progress.overallAccuracy}%</span>
                  </div>
                  <p className="text-xs text-neutral-500">Accuracy</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <p className="text-neutral-500">Questions attempted</p>
                <p className="text-right font-medium text-neutral-900">
                  {progress.totalQuestionsAttempted.toLocaleString()}
                </p>
                <p className="text-neutral-500">Correct answers</p>
                <p className="text-right font-medium text-neutral-900">
                  {progress.totalCorrect.toLocaleString()}
                </p>
                <p className="text-neutral-500">Topics started / mastered</p>
                <p className="text-right font-medium text-neutral-900">
                  {progress.topicsStarted} / {progress.topicsMastered}
                </p>
                <p className="text-neutral-500">XP points</p>
                <p className="text-right font-medium text-neutral-900">
                  {progress.xpPoints.toLocaleString()}
                </p>
                <p className="text-neutral-500">Longest streak</p>
                <p className="text-right font-medium text-neutral-900">
                  {progress.longestStreak} days
                </p>
                {progress.lastActiveAt && (
                  <>
                    <p className="text-neutral-500">Last active</p>
                    <p className="text-right font-medium text-neutral-900">
                      {new Date(progress.lastActiveAt).toLocaleDateString()}
                    </p>
                  </>
                )}
              </div>

              {progress.strengthAreas.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-neutral-900 mb-2">Strengths</p>
                  <div className="space-y-1.5">
                    {progress.strengthAreas.map((area) => (
                      <div key={area.topicId} className="flex items-center gap-2 text-sm">
                        <span className="flex-1 truncate text-neutral-700">
                          {area.topicName}
                          <span className="text-neutral-400"> · {area.subjectName}</span>
                        </span>
                        <Badge variant="success" size="sm">{Math.round(area.mastery)}%</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {progress.weakAreas.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-neutral-900 mb-2">Needs attention</p>
                  <div className="space-y-1.5">
                    {progress.weakAreas.map((area) => (
                      <div key={area.topicId} className="flex items-center gap-2 text-sm">
                        <span className="flex-1 truncate text-neutral-700">
                          {area.topicName}
                          <span className="text-neutral-400"> · {area.subjectName}</span>
                        </span>
                        <Badge variant="error" size="sm">{Math.round(area.mastery)}%</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {progress.recentAchievements.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-neutral-900 mb-2 flex items-center gap-1">
                    <Award className="w-4 h-4 text-accent" />
                    Recent achievements
                  </p>
                  <div className="space-y-1.5">
                    {progress.recentAchievements.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 text-sm">
                        <BookOpen className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                        <span className="flex-1 truncate text-neutral-700">{a.name}</span>
                        <span className="text-xs text-neutral-400">
                          {new Date(a.unlockedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Billing card */}
      <Card className="p-6">
        <CardHeader
          title="Billing & Renewal"
          subtitle={`Current package: ${tierLabel(school.seatTierId)}`}
        />
        {!school.seatTierId ? (
          <p className="text-sm text-neutral-500">
            No seat package to renew — the first purchase is handled by Brilla. Contact
            admissions@brillaprep.org to get started.
          </p>
        ) : currentTierSeats === null ? (
          <div className="p-4 bg-neutral-50 rounded-lg text-sm text-neutral-700">
            Your school is on a custom package. Renewals and changes are handled by Brilla —
            contact admissions@brillaprep.org.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Package</label>
                <select
                  value={targetTierId}
                  onChange={(e) => setTargetTierId(e.target.value)}
                  className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {tierOptions.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Billing cycle</label>
                <div className="inline-flex rounded-lg border border-neutral-200 overflow-hidden">
                  {(['monthly', 'yearly'] as const).map((cycle) => (
                    <button
                      key={cycle}
                      onClick={() => setBillingCycle(cycle)}
                      className={cn(
                        'px-4 py-2 text-sm font-medium capitalize transition-colors',
                        billingCycle === cycle
                          ? 'bg-primary text-white'
                          : 'bg-white text-neutral-600 hover:bg-neutral-50',
                      )}
                    >
                      {cycle}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                variant="primary"
                isLoading={renewLoading}
                leftIcon={<CreditCard className="w-4 h-4" />}
                onClick={handleRenew}
              >
                {targetTierId !== school.seatTierId ? 'Upgrade & pay' : 'Renew package'}
              </Button>
            </div>
            {seatCredit > 0 && (
              <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                GHS {seatCredit.toLocaleString()} seat credit will be applied to this payment
                automatically.
              </p>
            )}
            {renewError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {renewError}
              </div>
            )}
            <p className="text-xs text-neutral-400">
              You will be redirected to Paystack to complete payment. To reduce seats instead,
              contact Brilla — reductions are prorated into seat credit.
            </p>
          </div>
        )}
      </Card>

      <ConfirmModal
        isOpen={regenOpen}
        onClose={() => setRegenOpen(false)}
        onConfirm={handleRegenerate}
        title="Regenerate seat code?"
        message="The current seat code stops working immediately for students who have not redeemed it yet. Students who already joined keep their seats. Continue?"
        confirmText="Regenerate"
        variant="danger"
        isLoading={regenLoading}
      />
    </div>
  );
}
