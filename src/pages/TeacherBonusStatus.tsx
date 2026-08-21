import { useState, useEffect } from 'react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Gift,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  ChevronRight,
  Loader2,
  AlertCircle,
  Award,
  ArrowUp,
} from 'lucide-react';
import { teacherBonusService } from '@/lib/services';
import type { TeacherBonusConfig, TeacherYearEndBonus, TeacherBonusStudent } from '@/types/tutoring';

interface BonusStatusData {
  currentTier: TeacherBonusConfig | null;
  nextTier: TeacherBonusConfig | null;
  activeStudents: number;
  studentsToNextTier: number;
  totalReferredStudents: number;
  totalStudentPayments: number;
  estimatedBonus: number;
  bonusHistory: TeacherYearEndBonus[];
}

function formatCurrency(amount: number): string {
  return `GH\u20B5${amount.toFixed(2)}`;
}

function BonusProgressCard({ data }: { data: BonusStatusData }) {
  const progress = data.currentTier
    ? ((data.activeStudents - data.currentTier.minStudents) /
        ((data.nextTier?.minStudents || data.currentTier.minStudents + 10) - data.currentTier.minStudents)) *
      100
    : data.nextTier
    ? (data.activeStudents / data.nextTier.minStudents) * 100
    : 0;

  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold opacity-90">Year-End Bonus Progress</h2>
          <p className="text-3xl font-bold mt-1">{formatCurrency(data.estimatedBonus)}</p>
          <p className="text-sm opacity-75 mt-1">Estimated bonus for {new Date().getFullYear()}</p>
        </div>
        <div className="bg-white/20 rounded-xl p-3">
          <Gift className="w-8 h-8" />
        </div>
      </div>

      {/* Current Tier */}
      <div className="bg-white/10 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm opacity-75">Current Tier</span>
          <span className="font-bold">
            {data.currentTier ? `${data.currentTier.bonusPercentage}%` : 'Not Qualified Yet'}
          </span>
        </div>
        {data.currentTier && (
          <p className="text-sm opacity-75">
            {data.currentTier.minStudents}-
            {data.currentTier.maxStudents ? data.currentTier.maxStudents : '+'} active students
          </p>
        )}
      </div>

      {/* Progress Bar */}
      {data.nextTier && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="opacity-75">Progress to next tier ({data.nextTier.bonusPercentage}%)</span>
            <span className="font-medium">{data.studentsToNextTier} more students</span>
          </div>
          <div className="bg-white/20 rounded-full h-3 overflow-hidden">
            <div
              className="bg-white rounded-full h-full transition-all duration-500"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{data.activeStudents}</p>
          <p className="text-xs opacity-75">Active Students</p>
        </div>
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{formatCurrency(data.totalStudentPayments)}</p>
          <p className="text-xs opacity-75">Student Payments</p>
        </div>
      </div>
    </div>
  );
}

function TierCard({
  tier,
  isCurrent,
  isLocked,
  activeStudents,
}: {
  tier: TeacherBonusConfig;
  isCurrent: boolean;
  isLocked: boolean;
  activeStudents: number;
}) {
  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all ${
        isCurrent
          ? 'border-blue-500 bg-blue-50'
          : isLocked
          ? 'border-neutral-200 bg-neutral-50 opacity-60'
          : 'border-green-500 bg-green-50'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award
            className={`w-5 h-5 ${
              isCurrent ? 'text-blue-600' : isLocked ? 'text-neutral-400' : 'text-green-600'
            }`}
          />
          <span className="font-bold text-lg">{tier.bonusPercentage}%</span>
        </div>
        {isCurrent && (
          <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">Current</span>
        )}
        {!isLocked && !isCurrent && (
          <CheckCircle className="w-5 h-5 text-green-600" />
        )}
      </div>
      <p className="text-sm text-neutral-600">
        {tier.minStudents}-{tier.maxStudents ? tier.maxStudents : '+'} active students
      </p>
      {isLocked && (
        <p className="text-xs text-neutral-500 mt-2">
          Need {tier.minStudents - activeStudents} more students
        </p>
      )}
    </div>
  );
}

function StudentRow({ student }: { student: TeacherBonusStudent }) {
  const isQualified = student.activeMonths >= 3;
  return (
    <div className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-blue-600 font-bold">{student.studentName?.charAt(0) || 'S'}</span>
        </div>
        <div>
          <p className="font-medium text-neutral-900">{student.studentName || 'Student'}</p>
          <p className="text-sm text-neutral-500">{student.studentEmail}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-neutral-900">{formatCurrency(student.totalPayments / 100)}</p>
        <div className="flex items-center gap-1 text-sm">
          <span className={isQualified ? 'text-green-600' : 'text-neutral-500'}>
            {student.activeMonths} months
          </span>
          {isQualified && <CheckCircle className="w-4 h-4 text-green-600" />}
        </div>
      </div>
    </div>
  );
}

function BonusHistoryRow({ bonus }: { bonus: TeacherYearEndBonus }) {
  const statusConfig = {
    pending: { icon: <Clock className="w-4 h-4" />, label: 'Pending', color: 'text-amber-600 bg-amber-50' },
    calculated: { icon: <Clock className="w-4 h-4" />, label: 'Calculated', color: 'text-blue-600 bg-blue-50' },
    approved: { icon: <CheckCircle className="w-4 h-4" />, label: 'Approved', color: 'text-green-600 bg-green-50' },
    paid: { icon: <DollarSign className="w-4 h-4" />, label: 'Paid', color: 'text-green-600 bg-green-50' },
    rejected: { icon: <XCircle className="w-4 h-4" />, label: 'Rejected', color: 'text-red-600 bg-red-50' },
  };

  const status = statusConfig[bonus.status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <div className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
      <div>
        <p className="font-medium text-neutral-900">{bonus.year} Year-End Bonus</p>
        <p className="text-sm text-neutral-500">
          {bonus.activeStudents} students | {bonus.bonusPercentage}% tier
        </p>
      </div>
      <div className="text-right">
        <p className="font-bold text-neutral-900">{formatCurrency(bonus.bonusAmount)}</p>
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${status.color}`}>
          {status.icon}
          {status.label}
        </span>
      </div>
    </div>
  );
}

export default function TeacherBonusStatus() {
  const [bonusData, setBonusData] = useState<BonusStatusData | null>(null);
  const [students, setStudents] = useState<TeacherBonusStudent[]>([]);
  const [tiers, setTiers] = useState<TeacherBonusConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const currentYear = new Date().getFullYear();
  const loadDataRef = useRef<() => void>(() => {});

  useEffect(() => {
    loadDataRef.current();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [statusData, studentsData, configData] = await Promise.all([
        teacherBonusService.getMyBonusStatus(),
        teacherBonusService.getMyReferredStudents(currentYear),
        teacherBonusService.getBonusConfig(),
      ]);

      setBonusData(statusData as BonusStatusData);
      setStudents((studentsData as { students: TeacherBonusStudent[] }).students || []);
      setTiers((configData as { tiers: TeacherBonusConfig[] }).tiers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bonus status');
    } finally {
      setIsLoading(false);
    }
  };

  loadDataRef.current = loadData;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center py-20 bg-white rounded-xl border border-neutral-200">
            <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Year-End Bonus</h1>
            <p className="text-neutral-600 mt-1">
              Earn bonuses by referring students to the platform
            </p>
          </div>
          <Link
            to="/teacher/tutoring"
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
          >
            Back to Dashboard
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Progress Card */}
        {bonusData && <BonusProgressCard data={bonusData} />}

        {/* How It Works */}
        <div className="mt-8 bg-white rounded-xl border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">Refer Students</p>
                <p className="text-sm text-neutral-500">Share your referral link with students</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">They Subscribe</p>
                <p className="text-sm text-neutral-500">Students must stay active 3+ months</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Gift className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">Earn Bonus</p>
                <p className="text-sm text-neutral-500">Get % of their annual payments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bonus Tiers */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Bonus Tiers</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {tiers.map((tier) => (
              <TierCard
                key={tier.id}
                tier={tier}
                isCurrent={bonusData?.currentTier?.id === tier.id}
                isLocked={(bonusData?.activeStudents || 0) < tier.minStudents}
                activeStudents={bonusData?.activeStudents || 0}
              />
            ))}
          </div>
        </div>

        {/* Referred Students */}
        <div className="mt-8 bg-white rounded-xl border border-neutral-200">
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">
              Your Referred Students ({currentYear})
            </h3>
            <span className="text-sm text-neutral-500">
              {students.filter((s) => s.activeMonths >= 3).length} qualified
            </span>
          </div>
          <div className="p-6">
            {students.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                {students.map((student) => (
                  <StudentRow key={student.id} student={student} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
                <p className="text-neutral-500">No referred students yet</p>
                <p className="text-sm text-neutral-400 mt-1">
                  Share your referral link to start earning bonuses
                </p>
                <Link
                  to="/affiliate"
                  className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700"
                >
                  Get Referral Link
                  <ArrowUp className="w-4 h-4 rotate-45" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bonus History */}
        {bonusData && bonusData.bonusHistory.length > 0 && (
          <div className="mt-8 bg-white rounded-xl border border-neutral-200">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">Bonus History</h3>
            </div>
            <div className="p-6">
              <div className="divide-y divide-neutral-100">
                {bonusData.bonusHistory.map((bonus) => (
                  <BonusHistoryRow key={bonus.id} bonus={bonus} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
