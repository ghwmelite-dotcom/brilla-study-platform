import { useState, useEffect } from 'react';
import {
  Gift,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Loader2,
  AlertCircle,
  Calculator,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { teacherBonusService } from '@/lib/services';
import type { TeacherYearEndBonus } from '@/types/tutoring';

interface BonusWithTeacher extends TeacherYearEndBonus {
  teacherName?: string;
  teacherEmail?: string;
}

interface BonusStats {
  totalBonuses: number;
  pendingBonuses: number;
  approvedBonuses: number;
  paidBonuses: number;
  totalAmount: number;
  totalPaid: number;
}

function formatCurrency(amount: number): string {
  return `GH\u20B5${amount.toFixed(2)}`;
}

const statusConfig = {
  pending: { icon: <Clock className="w-4 h-4" />, label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  calculated: { icon: <Calculator className="w-4 h-4" />, label: 'Calculated', color: 'bg-blue-100 text-blue-700' },
  approved: { icon: <CheckCircle className="w-4 h-4" />, label: 'Approved', color: 'bg-green-100 text-green-700' },
  paid: { icon: <DollarSign className="w-4 h-4" />, label: 'Paid', color: 'bg-green-100 text-green-700' },
  rejected: { icon: <XCircle className="w-4 h-4" />, label: 'Rejected', color: 'bg-red-100 text-red-700' },
};

function BonusRow({
  bonus,
  onApprove,
  onReject,
  onPayout,
  isProcessing,
}: {
  bonus: BonusWithTeacher;
  onApprove: () => void;
  onReject: () => void;
  onPayout: () => void;
  isProcessing: boolean;
}) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const status = statusConfig[bonus.status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <tr className="border-b border-neutral-100 hover:bg-neutral-50">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-bold">
              {bonus.teacherName?.charAt(0) || 'T'}
            </span>
          </div>
          <div>
            <p className="font-medium text-neutral-900">{bonus.teacherName || 'Unknown Teacher'}</p>
            <p className="text-sm text-neutral-500">{bonus.teacherEmail}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className="font-medium text-neutral-900">{bonus.year}</span>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-neutral-400" />
          <span className="text-neutral-700">{bonus.activeStudents}</span>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className="text-neutral-700">{bonus.bonusPercentage}%</span>
      </td>
      <td className="px-4 py-4">
        <span className="text-neutral-700">{formatCurrency(bonus.totalStudentPayments)}</span>
      </td>
      <td className="px-4 py-4">
        <span className="font-bold text-blue-600">{formatCurrency(bonus.bonusAmount)}</span>
      </td>
      <td className="px-4 py-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${status.color}`}>
          {status.icon}
          {status.label}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          {(bonus.status === 'pending' || bonus.status === 'calculated') && (
            <>
              <button
                onClick={onApprove}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}
          {bonus.status === 'approved' && (
            <button
              onClick={onPayout}
              disabled={isProcessing}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
            >
              <DollarSign className="w-4 h-4" />
              Process Payout
            </button>
          )}
          {bonus.status === 'paid' && (
            <span className="text-sm text-green-600">Paid</span>
          )}
          {bonus.status === 'rejected' && (
            <span className="text-sm text-red-600">Rejected</span>
          )}
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Reject Bonus</h3>
              <p className="text-neutral-600 mb-4">
                Please provide a reason for rejecting this bonus.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg resize-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onReject();
                    setShowRejectModal(false);
                  }}
                  disabled={!rejectReason.trim() || isProcessing}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function AdminTeacherBonuses() {
  const [bonuses, setBonuses] = useState<BonusWithTeacher[]>([]);
  const [stats, setStats] = useState<BonusStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  useEffect(() => {
    loadData();
  }, [page, statusFilter, selectedYear]);

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [bonusesData, statsData] = await Promise.all([
        teacherBonusService.listBonuses({ year: selectedYear, status: statusFilter || undefined, page, pageSize: 20 }),
        teacherBonusService.getBonusStats(selectedYear),
      ]);

      const data = bonusesData as { bonuses: BonusWithTeacher[]; total: number; pageSize: number };
      setBonuses(data.bonuses || []);
      setTotalPages(Math.ceil((data.total || 0) / (data.pageSize || 20)));
      setStats(statsData as BonusStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      await teacherBonusService.calculateBonuses(selectedYear);
      setMessage({ type: 'success', text: 'Bonuses calculated successfully' });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Calculation failed' });
    } finally {
      setIsCalculating(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleApprove = async (bonusId: string) => {
    setProcessingId(bonusId);
    try {
      await teacherBonusService.approveBonus(bonusId);
      setMessage({ type: 'success', text: 'Bonus approved' });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Approval failed' });
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleReject = async (bonusId: string, reason: string) => {
    setProcessingId(bonusId);
    try {
      await teacherBonusService.rejectBonus(bonusId, reason);
      setMessage({ type: 'success', text: 'Bonus rejected' });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Rejection failed' });
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handlePayout = async (bonusId: string) => {
    setProcessingId(bonusId);
    try {
      await teacherBonusService.processPayout(bonusId);
      setMessage({ type: 'success', text: 'Payout processed' });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Payout failed' });
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Teacher Year-End Bonuses</h1>
            <p className="text-neutral-600 mt-1">
              Manage and process teacher referral bonuses
            </p>
          </div>
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isCalculating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4" />
            )}
            Calculate {selectedYear} Bonuses
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{stats.pendingBonuses}</p>
                  <p className="text-sm text-neutral-500">Pending Review</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{stats.approvedBonuses}</p>
                  <p className="text-sm text-neutral-500">Approved</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Gift className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{formatCurrency(stats.totalAmount)}</p>
                  <p className="text-sm text-neutral-500">Total Bonuses</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{formatCurrency(stats.totalPaid)}</p>
                  <p className="text-sm text-neutral-500">Total Paid</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="calculated">Calculated</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Bonuses Table */}
        {error ? (
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
        ) : bonuses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-neutral-200">
            <Gift className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Bonuses Found</h3>
            <p className="text-neutral-500 mb-4">
              No bonuses have been calculated for {selectedYear} yet.
            </p>
            <button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Calculate Bonuses
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                        Teacher
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                        Year
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                        Students
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                        Tier
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                        Payments
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                        Bonus
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bonuses.map((bonus) => (
                      <BonusRow
                        key={bonus.id}
                        bonus={bonus}
                        onApprove={() => handleApprove(bonus.id)}
                        onReject={() => handleReject(bonus.id, '')}
                        onPayout={() => handlePayout(bonus.id)}
                        isProcessing={processingId === bonus.id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-neutral-300 rounded-lg disabled:opacity-50 hover:bg-neutral-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 text-sm text-neutral-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-neutral-300 rounded-lg disabled:opacity-50 hover:bg-neutral-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
