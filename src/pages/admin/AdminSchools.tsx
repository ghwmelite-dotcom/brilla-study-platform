import { useEffect, useMemo, useRef, useState } from 'react';
import {
  School,
  RefreshCw,
  Plus,
  Ticket,
  Copy,
  CheckCircle,
  Users,
  Upload,
  Search,
  UserPlus,
  UserMinus,
  Send,
  UserCog,
  MinusCircle,
} from 'lucide-react';
import { AdminCard, AdminCardHeader, AdminButton, AdminBadge, AdminInput, AdminTextarea, AdminConfirmModal } from '@/components/admin';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils';

interface SchoolRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  studentCount: number;
  ambassadorCode: string | null;
  telegramChannelId: string | null;
  telegramChannelName: string | null;
  telegramChannelBroken: boolean;
  seatCap: number;
  seatTierId: string | null;
  seatExpiresAt: string | null;
  seatCodeUses: number;
  createdAt: string;
}

interface SchoolAdminRow {
  userId: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
}

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

interface BulkResult {
  assigned: number;
  skipped: { email: string; reason: string }[];
}

const SHARE_LINK_BASE = 'https://brillaprep.org/?register=true&ref=';

// Bulk-assign skip reasons returned by POST /admin/schools/:id/students.
// The raw reason string is rendered verbatim (code chip) so ops can match
// API output; the label is the human explanation.
const SKIP_REASON_LABELS: Record<string, string> = {
  not_found: 'No account exists with this email',
  already_assigned: 'Already assigned to a school',
  not_eligible: 'Not an approved student account',
  invalid_email: 'Invalid email address',
};

function suggestSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 40);
}

// Extract emails from a CSV text: prefer a column named "email" (from the
// header row), otherwise fall back to the first column of every row.
function extractEmailsFromCsv(text: string): string[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const splitRow = (row: string) => row.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''));
  const header = splitRow(lines[0]).map((h) => h.toLowerCase());
  const emailCol = header.findIndex((h) => h === 'email' || h === 'email address' || h === 'e-mail');

  if (emailCol >= 0) {
    return lines.slice(1).map((row) => splitRow(row)[emailCol] || '').filter(Boolean);
  }
  return lines.map((row) => splitRow(row)[0] || '').filter(Boolean);
}

export default function AdminSchools() {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // New school form
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Selected school for the ambassador / assign cards
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  // Ambassador card
  const [ambassadorCodeInput, setAmbassadorCodeInput] = useState('');
  const [ambassadorLoading, setAmbassadorLoading] = useState(false);
  const [ambassadorError, setAmbassadorError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Telegram channel card
  const [channelIdInput, setChannelIdInput] = useState('');
  const [channelNameInput, setChannelNameInput] = useState('');
  const [channelLoading, setChannelLoading] = useState(false);
  const [channelError, setChannelError] = useState<string | null>(null);

  // Bulk assign card
  const [bulkText, setBulkText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Individual assign card
  const { allUsers, loadAllUsers } = useAuthStore();
  const [userSearch, setUserSearch] = useState('');
  const [individualLoading, setIndividualLoading] = useState<string | null>(null);
  const [individualError, setIndividualError] = useState<string | null>(null);
  const [individualNotice, setIndividualNotice] = useState<string | null>(null);
  const [forceUserId, setForceUserId] = useState<string | null>(null);

  // School admin management (phase 2: /admin/schools/:id/school-admins).
  // The list shows current school_admins; the search below assigns new ones.
  const [schoolAdmins, setSchoolAdmins] = useState<SchoolAdminRow[]>([]);
  const [schoolAdminsLoading, setSchoolAdminsLoading] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [schoolAdminLoading, setSchoolAdminLoading] = useState<string | null>(null);
  const [schoolAdminError, setSchoolAdminError] = useState<string | null>(null);
  const [schoolAdminNotice, setSchoolAdminNotice] = useState<string | null>(null);
  const [demoteTarget, setDemoteTarget] = useState<{ id: string; name: string } | null>(null);

  // Prorated seat reduction (phase 2: /admin/schools/:id/seats/reduce)
  const [reduceSeatsInput, setReduceSeatsInput] = useState('');
  const [reduceOpen, setReduceOpen] = useState(false);
  const [reduceLoading, setReduceLoading] = useState(false);
  const [reduceError, setReduceError] = useState<string | null>(null);
  const [reduceResult, setReduceResult] = useState<{
    seatsRemoved: number;
    newCap: number;
    billingCycle: string;
    remainingDays: number;
    creditGhs: number;
    seatCredit: number;
  } | null>(null);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    setIsLoading(true);
    setListError(null);
    const res = await api.get<{ schools: SchoolRow[] }>('/admin/schools');
    setIsLoading(false);
    if (res.success && res.data) {
      setSchools(res.data.schools);
    } else {
      setListError(res.error || 'Failed to load schools');
    }
  };

  const selectedSchool = useMemo(
    () => schools.find((s) => s.id === selectedSchoolId) || null,
    [schools, selectedSchoolId]
  );

  const loadSchoolAdmins = async (schoolId: string) => {
    setSchoolAdminsLoading(true);
    const res = await api.get<SchoolAdminRow[]>(`/admin/schools/${schoolId}/school-admins`);
    setSchoolAdminsLoading(false);
    if (res.success && res.data) {
      setSchoolAdmins(res.data);
    } else {
      setSchoolAdmins([]);
      setSchoolAdminError(res.error || 'Failed to load school admins');
    }
  };

  const handleSelectSchool = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    // Reset per-school action state so stale results never leak across schools
    setAmbassadorCodeInput('');
    setAmbassadorError(null);
    setBulkText('');
    setBulkError(null);
    setBulkResult(null);
    setUserSearch('');
    setIndividualError(null);
    setIndividualNotice(null);
    setForceUserId(null);
    setAdminSearch('');
    setSchoolAdminError(null);
    setSchoolAdminNotice(null);
    setDemoteTarget(null);
    setReduceSeatsInput('');
    setReduceOpen(false);
    setReduceError(null);
    setReduceResult(null);
    setSchoolAdmins([]);
    loadSchoolAdmins(schoolId);
    // Prefill the channel form from the school's current row
    const school = schools.find((s) => s.id === schoolId);
    setChannelIdInput(school?.telegramChannelId ?? '');
    setChannelNameInput(school?.telegramChannelName ?? '');
    setChannelError(null);
  };

  const handleNameChange = (name: string) => {
    setNewName(name);
    if (!slugTouched) setNewSlug(suggestSlug(name));
  };

  const handleCreateSchool = async () => {
    setCreateLoading(true);
    setCreateError(null);
    const res = await api.post<{ id: string }>('/admin/schools', {
      name: newName.trim(),
      slug: newSlug.trim(),
    });
    setCreateLoading(false);
    if (res.success && res.data) {
      setNewName('');
      setNewSlug('');
      setSlugTouched(false);
      await loadSchools();
      handleSelectSchool(res.data.id);
    } else {
      setCreateError(res.error || 'Failed to create school');
    }
  };

  const handleProvisionAmbassador = async () => {
    if (!selectedSchool) return;
    const code = ambassadorCodeInput.trim().toUpperCase();
    if (!code) return;
    setAmbassadorLoading(true);
    setAmbassadorError(null);
    const res = await api.post<{ userId: string; code: string }>(
      `/admin/schools/${selectedSchool.id}/ambassador`,
      { code }
    );
    setAmbassadorLoading(false);
    if (res.success) {
      setAmbassadorCodeInput('');
      await loadSchools();
    } else {
      setAmbassadorError(res.error || 'Failed to provision ambassador');
    }
  };

  const handleSaveChannel = async () => {
    if (!selectedSchool) return;
    setChannelLoading(true);
    setChannelError(null);
    const res = await api.put<{ schoolId: string }>(
      `/admin/schools/${selectedSchool.id}/channel`,
      {
        channelId: channelIdInput.trim(),
        channelName: channelNameInput.trim() || undefined,
      }
    );
    setChannelLoading(false);
    if (res.success) {
      await loadSchools();
    } else {
      setChannelError(res.error || 'Failed to save channel');
    }
  };

  const handleCopy = async (field: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const parseBulkEmails = (): string[] =>
    bulkText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

  const handleCsvFile = async (file: File) => {
    const text = await file.text();
    const emails = extractEmailsFromCsv(text);
    if (emails.length > 0) {
      setBulkText((prev) => (prev.trim() ? `${prev.trim()}\n${emails.join('\n')}` : emails.join('\n')));
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedSchool) return;
    const emails = parseBulkEmails();
    if (emails.length === 0) {
      setBulkError('Enter at least one email (one per line)');
      return;
    }
    setBulkLoading(true);
    setBulkError(null);
    setBulkResult(null);
    const res = await api.post<BulkResult>(`/admin/schools/${selectedSchool.id}/students`, { emails });
    setBulkLoading(false);
    if (res.success && res.data) {
      setBulkResult(res.data);
      loadSchools();
    } else {
      setBulkError(res.error || 'Failed to assign students');
    }
  };

  // Individual assign: reuse the admin user list (same source as
  // UserManagement) to resolve an email to a userId for the
  // single-student endpoints. Ambassador system mailboxes are excluded.
  const userMatches = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (q.length < 3) return [];
    return allUsers
      .filter(
        (u) =>
          u.email.toLowerCase().includes(q) &&
          !u.email.endsWith('@ambassador.brilla')
      )
      .slice(0, 8);
  }, [allUsers, userSearch]);

  const handleAssignUser = async (userId: string, force = false) => {
    if (!selectedSchool) return;
    setIndividualLoading(userId);
    setIndividualError(null);
    setIndividualNotice(null);
    setForceUserId(null);
    const res = await api.post<{ userId: string; schoolId: string }>(
      `/admin/schools/${selectedSchool.id}/students/${userId}`,
      { force }
    );
    setIndividualLoading(null);
    if (res.success) {
      setIndividualNotice('Student assigned to school');
      loadSchools();
    } else {
      const message = res.error || 'Failed to assign student';
      setIndividualError(message);
      if (message.includes('force')) setForceUserId(userId);
    }
  };

  const handleUnassignUser = async (userId: string) => {
    if (!selectedSchool) return;
    setIndividualLoading(userId);
    setIndividualError(null);
    setIndividualNotice(null);
    setForceUserId(null);
    const res = await api.delete<{ userId: string }>(
      `/admin/schools/${selectedSchool.id}/students/${userId}`
    );
    setIndividualLoading(null);
    if (res.success) {
      setIndividualNotice('Student unassigned from school');
      loadSchools();
    } else {
      setIndividualError(res.error || 'Failed to unassign student');
    }
  };

  // School admin search: same admin user list as the individual assign card.
  const adminMatches = useMemo(() => {
    const q = adminSearch.trim().toLowerCase();
    if (q.length < 3) return [];
    return allUsers
      .filter(
        (u) =>
          u.email.toLowerCase().includes(q) &&
          !u.email.endsWith('@ambassador.brilla')
      )
      .slice(0, 8);
  }, [allUsers, adminSearch]);

  const handleAssignSchoolAdmin = async (userId: string) => {
    if (!selectedSchool) return;
    setSchoolAdminLoading(userId);
    setSchoolAdminError(null);
    setSchoolAdminNotice(null);
    const res = await api.post<{
      schoolId: string;
      userId: string;
      role: string;
      alreadyAssigned?: boolean;
    }>(`/admin/schools/${selectedSchool.id}/school-admins`, { userId });
    setSchoolAdminLoading(null);
    if (res.success && res.data) {
      setSchoolAdminNotice(
        res.data.alreadyAssigned
          ? 'User is already a school admin of this school'
          : 'School admin assigned — they now have the self-serve school dashboard'
      );
      loadSchoolAdmins(selectedSchool.id);
    } else {
      setSchoolAdminError(res.error || 'Failed to assign school admin');
    }
  };

  const handleDemoteSchoolAdmin = async () => {
    if (!selectedSchool || !demoteTarget) return;
    setSchoolAdminLoading(demoteTarget.id);
    setSchoolAdminError(null);
    setSchoolAdminNotice(null);
    const res = await api.delete<{ schoolId: string; userId: string; role: string }>(
      `/admin/schools/${selectedSchool.id}/school-admins/${demoteTarget.id}`
    );
    setSchoolAdminLoading(null);
    if (res.success && res.data) {
      setSchoolAdminNotice(`School admin removed — role restored to ${res.data.role}`);
      setDemoteTarget(null);
      loadSchoolAdmins(selectedSchool.id);
    } else {
      setSchoolAdminError(res.error || 'Failed to remove school admin');
      setDemoteTarget(null);
    }
  };

  const reduceSeatsValue = parseInt(reduceSeatsInput, 10);
  const reduceSeatsValid = Number.isInteger(reduceSeatsValue) && reduceSeatsValue > 0;

  const handleReduceSeats = async () => {
    if (!selectedSchool || !reduceSeatsValid) return;
    setReduceLoading(true);
    setReduceError(null);
    setReduceResult(null);
    const res = await api.post<{
      schoolId: string;
      seatsRemoved: number;
      newCap: number;
      billingCycle: string;
      remainingDays: number;
      creditGhs: number;
      seatCredit: number;
    }>(`/admin/schools/${selectedSchool.id}/seats/reduce`, { seats: reduceSeatsValue });
    setReduceLoading(false);
    setReduceOpen(false);
    if (res.success && res.data) {
      setReduceResult(res.data);
      setReduceSeatsInput('');
      // Refresh the school row so the displayed cap reflects the reduction
      loadSchools();
    } else {
      setReduceError(res.error || 'Failed to reduce seats');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'emerald' | 'amber' | 'neutral'> = {
      active: 'emerald',
      inactive: 'neutral',
      pilot: 'amber',
    };
    return <AdminBadge variant={variants[status] || 'neutral'}>{status}</AdminBadge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-admin-text">Pilot Schools</h1>
          <p className="text-admin-text-secondary">
            Manage pilot schools, ambassador codes, and student assignment
          </p>
        </div>
        <AdminButton
          variant="secondary"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={loadSchools}
          isLoading={isLoading}
        >
          Refresh
        </AdminButton>
      </div>

      {listError && <p className="text-sm text-admin-accent-rose">{listError}</p>}

      {/* Schools list */}
      <AdminCard padding="none">
        <div className="px-6 pt-4">
          <AdminCardHeader
            title="Schools"
            subtitle={`${schools.length} pilot ${schools.length === 1 ? 'school' : 'schools'}`}
            icon={<School className="w-5 h-5" />}
          />
        </div>

        {/* New school inline form */}
        <div className="px-6 pb-4 flex flex-col sm:flex-row gap-3 items-start">
          <div className="flex-1">
            <AdminInput
              placeholder="School name, e.g. St. John's School"
              value={newName}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <AdminInput
              placeholder="slug"
              value={newSlug}
              hint="Auto-suggested from the name; a-z, 0-9 and hyphens"
              onChange={(e) => {
                setSlugTouched(true);
                setNewSlug(e.target.value.toLowerCase());
              }}
            />
          </div>
          <AdminButton
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            isLoading={createLoading}
            disabled={newName.trim().length < 2 || newSlug.trim().length < 2}
            onClick={handleCreateSchool}
          >
            New school
          </AdminButton>
        </div>
        {createError && <p className="px-6 pb-4 text-sm text-admin-accent-rose">{createError}</p>}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Slug</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Students</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Ambassador Code</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {schools.map((school) => (
                <tr
                  key={school.id}
                  className={cn(
                    'hover:bg-admin-bg-tertiary/50 transition-colors',
                    selectedSchoolId === school.id && 'bg-admin-bg-tertiary/50'
                  )}
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-admin-text">{school.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <code className="px-2 py-1 bg-admin-bg-tertiary rounded text-xs text-admin-accent-cyan">
                      {school.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-sm text-admin-text">{school.studentCount}</td>
                  <td className="px-6 py-4">
                    {school.ambassadorCode ? (
                      <code className="px-2 py-1 bg-admin-bg-tertiary rounded text-xs text-admin-accent-cyan">
                        {school.ambassadorCode}
                      </code>
                    ) : (
                      <span className="text-sm text-admin-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(school.status)}</td>
                  <td className="px-6 py-4">
                    <AdminButton
                      variant={selectedSchoolId === school.id ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => handleSelectSchool(school.id)}
                    >
                      Manage
                    </AdminButton>
                  </td>
                </tr>
              ))}
              {schools.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-admin-text-muted">
                    {isLoading ? 'Loading schools…' : 'No schools yet — create the first one above'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {selectedSchool && (
        <>
          {/* Ambassador card */}
          <AdminCard>
            <AdminCardHeader
              title={`Ambassador — ${selectedSchool.name}`}
              subtitle="The ambassador referral code doubles as the school's invite code"
              icon={<Ticket className="w-5 h-5" />}
            />
            {selectedSchool.ambassadorCode ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-admin-text-secondary">Code</span>
                  <code className="px-3 py-1.5 bg-admin-bg-tertiary rounded text-lg font-semibold text-admin-accent-cyan tracking-wider">
                    {selectedSchool.ambassadorCode}
                  </code>
                  <AdminButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy('code', selectedSchool.ambassadorCode!)}
                  >
                    {copiedField === 'code' ? (
                      <CheckCircle className="w-4 h-4 text-admin-accent-emerald" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </AdminButton>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-admin-text-secondary">Shareable link</span>
                  <code className="px-3 py-1.5 bg-admin-bg-tertiary rounded text-xs text-admin-text break-all">
                    {SHARE_LINK_BASE}{selectedSchool.ambassadorCode}
                  </code>
                  <AdminButton
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleCopy('link', `${SHARE_LINK_BASE}${selectedSchool.ambassadorCode}`)
                    }
                  >
                    {copiedField === 'link' ? (
                      <CheckCircle className="w-4 h-4 text-admin-accent-emerald" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </AdminButton>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-admin-text-secondary">
                  No ambassador yet. Provision one to generate the school's invite code.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  <div className="flex-1">
                    <AdminInput
                      placeholder="Ambassador code, e.g. STJOHNS"
                      value={ambassadorCodeInput}
                      onChange={(e) => setAmbassadorCodeInput(e.target.value.toUpperCase())}
                    />
                  </div>
                  <AdminButton
                    variant="primary"
                    leftIcon={<Ticket className="w-4 h-4" />}
                    isLoading={ambassadorLoading}
                    disabled={!ambassadorCodeInput.trim()}
                    onClick={handleProvisionAmbassador}
                  >
                    Provision ambassador
                  </AdminButton>
                </div>
                {ambassadorError && (
                  <p className="text-sm text-admin-accent-rose">{ambassadorError}</p>
                )}
              </div>
            )}
          </AdminCard>

          {/* Telegram channel card */}
          <AdminCard>
            <AdminCardHeader
              title={`Telegram channel — ${selectedSchool.name}`}
              subtitle="Channel the bot posts race alerts to; the bot must be a channel admin"
              icon={<Send className="w-5 h-5" />}
            />
            {selectedSchool.telegramChannelBroken && (
              <div className="mb-4">
                <AdminBadge variant="rose">
                  Channel broken — re-add the bot as admin and re-save
                </AdminBadge>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="flex-1">
                <AdminInput
                  placeholder="Channel ID, e.g. -1001234567890"
                  value={channelIdInput}
                  hint="Clear the field and save to remove the channel"
                  onChange={(e) => setChannelIdInput(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <AdminInput
                  placeholder="Display name (optional)"
                  value={channelNameInput}
                  onChange={(e) => setChannelNameInput(e.target.value)}
                />
              </div>
              <AdminButton
                variant="primary"
                leftIcon={<Send className="w-4 h-4" />}
                isLoading={channelLoading}
                onClick={handleSaveChannel}
              >
                Save channel
              </AdminButton>
            </div>
            {channelError && (
              <p className="mt-3 text-sm text-admin-accent-rose">{channelError}</p>
            )}
          </AdminCard>

          {/* Bulk assign card */}
          <AdminCard>
            <AdminCardHeader
              title={`Bulk assign students — ${selectedSchool.name}`}
              subtitle="One email per line, or import a CSV with an email column"
              icon={<Users className="w-5 h-5" />}
              action={
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCsvFile(file);
                      e.target.value = '';
                    }}
                  />
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    leftIcon={<Upload className="w-4 h-4" />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Import CSV
                  </AdminButton>
                </>
              }
            />
            <AdminTextarea
              rows={6}
              placeholder={'student1@example.com\nstudent2@example.com'}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              hint={`${parseBulkEmails().length} email(s) entered — max 500 per request`}
            />
            <div className="mt-3 flex items-center gap-3">
              <AdminButton
                variant="primary"
                leftIcon={<UserPlus className="w-4 h-4" />}
                isLoading={bulkLoading}
                disabled={parseBulkEmails().length === 0}
                onClick={handleBulkAssign}
              >
                Assign students
              </AdminButton>
              {bulkResult && (
                <p className="text-sm text-admin-accent-emerald">
                  {bulkResult.assigned} assigned
                  {bulkResult.skipped.length > 0 && `, ${bulkResult.skipped.length} skipped`}
                </p>
              )}
            </div>
            {bulkError && <p className="mt-3 text-sm text-admin-accent-rose">{bulkError}</p>}
            {bulkResult && bulkResult.skipped.length > 0 && (
              <div className="mt-4 overflow-x-auto border border-admin-border rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-admin-border">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Reason</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border">
                    {bulkResult.skipped.map((skip, i) => (
                      <tr key={`${skip.email}-${i}`} className="hover:bg-admin-bg-tertiary/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-admin-text">{skip.email}</td>
                        <td className="px-4 py-3">
                          <code className="px-2 py-1 bg-admin-bg-tertiary rounded text-xs text-admin-accent-amber">
                            {skip.reason}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-sm text-admin-text-secondary">
                          {SKIP_REASON_LABELS[skip.reason] || skip.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminCard>

          {/* Individual assign card */}
          <AdminCard>
            <AdminCardHeader
              title={`Individual assign — ${selectedSchool.name}`}
              subtitle="Search a student by email, then assign or unassign"
              icon={<Search className="w-5 h-5" />}
            />
            <AdminInput
              placeholder="Search by email…"
              value={userSearch}
              leftIcon={<Search className="w-4 h-4" />}
              onFocus={() => {
                if (allUsers.length === 0) loadAllUsers();
              }}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setIndividualError(null);
                setIndividualNotice(null);
                setForceUserId(null);
              }}
            />
            {individualNotice && (
              <p className="mt-3 text-sm text-admin-accent-emerald">{individualNotice}</p>
            )}
            {individualError && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p className="text-sm text-admin-accent-rose">{individualError}</p>
                {forceUserId && (
                  <AdminButton
                    variant="danger"
                    size="sm"
                    isLoading={individualLoading === forceUserId}
                    onClick={() => handleAssignUser(forceUserId, true)}
                  >
                    Reassign anyway
                  </AdminButton>
                )}
              </div>
            )}
            {userSearch.trim().length >= 3 && (
              <div className="mt-4 overflow-x-auto border border-admin-border rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-admin-border">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border">
                    {userMatches.map((u) => (
                      <tr key={u.id} className="hover:bg-admin-bg-tertiary/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-admin-text">{u.name}</td>
                        <td className="px-4 py-3 text-sm text-admin-text">{u.email}</td>
                        <td className="px-4 py-3 text-sm text-admin-text capitalize">{u.role}</td>
                        <td className="px-4 py-3 text-sm text-admin-text capitalize">{u.status}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <AdminButton
                              variant="primary"
                              size="sm"
                              isLoading={individualLoading === u.id}
                              onClick={() => handleAssignUser(u.id)}
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              Assign
                            </AdminButton>
                            <AdminButton
                              variant="ghost"
                              size="sm"
                              isLoading={individualLoading === u.id}
                              onClick={() => handleUnassignUser(u.id)}
                            >
                              <UserMinus className="w-4 h-4 mr-1" />
                              Unassign
                            </AdminButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {userMatches.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-admin-text-muted">
                          No users match this email
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </AdminCard>
          {/* School admins card (phase 2) */}
          <AdminCard>
            <AdminCardHeader
              title={`School admins — ${selectedSchool.name}`}
              subtitle="School admins get the self-serve school dashboard (/school-admin) scoped to this school"
              icon={<UserCog className="w-5 h-5" />}
            />

            {/* Current school admins (GET /admin/schools/:id/school-admins) */}
            {schoolAdminsLoading ? (
              <p className="mb-4 text-sm text-admin-text-muted">Loading school admins…</p>
            ) : schoolAdmins.length > 0 ? (
              <div className="mb-4 overflow-x-auto border border-admin-border rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-admin-border">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Since</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border">
                    {schoolAdmins.map((a) => (
                      <tr key={a.userId} className="hover:bg-admin-bg-tertiary/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-admin-text">{a.name}</td>
                        <td className="px-4 py-3 text-sm text-admin-text">{a.email}</td>
                        <td className="px-4 py-3 text-sm text-admin-text-secondary">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <AdminButton
                            variant="ghost"
                            size="sm"
                            isLoading={schoolAdminLoading === a.userId}
                            onClick={() => setDemoteTarget({ id: a.userId, name: a.name })}
                          >
                            <UserMinus className="w-4 h-4 mr-1" />
                            Remove
                          </AdminButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mb-4 text-sm text-admin-text-muted">
                No school admins yet — search a user below to assign one.
              </p>
            )}

            <AdminInput
              placeholder="Search a user by email…"
              value={adminSearch}
              leftIcon={<Search className="w-4 h-4" />}
              onFocus={() => {
                if (allUsers.length === 0) loadAllUsers();
              }}
              onChange={(e) => {
                setAdminSearch(e.target.value);
                setSchoolAdminError(null);
                setSchoolAdminNotice(null);
              }}
            />
            {schoolAdminNotice && (
              <p className="mt-3 text-sm text-admin-accent-emerald">{schoolAdminNotice}</p>
            )}
            {schoolAdminError && (
              <p className="mt-3 text-sm text-admin-accent-rose">{schoolAdminError}</p>
            )}
            {adminSearch.trim().length >= 3 && (
              <div className="mt-4 overflow-x-auto border border-admin-border rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-admin-border">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border">
                    {adminMatches.map((u) => (
                      <tr key={u.id} className="hover:bg-admin-bg-tertiary/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-admin-text">{u.name}</td>
                        <td className="px-4 py-3 text-sm text-admin-text">{u.email}</td>
                        <td className="px-4 py-3 text-sm text-admin-text capitalize">{u.role.replace('_', ' ')}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <AdminButton
                              variant="primary"
                              size="sm"
                              isLoading={schoolAdminLoading === u.id}
                              onClick={() => handleAssignSchoolAdmin(u.id)}
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              Make school admin
                            </AdminButton>
                            <AdminButton
                              variant="ghost"
                              size="sm"
                              isLoading={schoolAdminLoading === u.id}
                              onClick={() => setDemoteTarget({ id: u.id, name: u.name })}
                            >
                              <UserMinus className="w-4 h-4 mr-1" />
                              Remove
                            </AdminButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {adminMatches.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-admin-text-muted">
                          No users match this email
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </AdminCard>

          {/* Reduce seats card (phase 2, prorated credit) */}
          <AdminCard>
            <AdminCardHeader
              title={`Reduce seats — ${selectedSchool.name}`}
              subtitle="Lower the seat cap mid-cycle; the unused remainder is credited to the school, prorated by remaining days"
              icon={<MinusCircle className="w-5 h-5" />}
            />
            <div className="mb-4 p-4 border border-admin-border rounded-lg flex flex-wrap gap-x-8 gap-y-1 text-sm">
              <p className="text-admin-text-secondary">
                Current cap: <span className="font-semibold text-admin-text">{selectedSchool.seatCap} seats</span>
              </p>
              <p className="text-admin-text-secondary">
                Package: <span className="font-semibold text-admin-text">{tierLabel(selectedSchool.seatTierId)}</span>
              </p>
              <p className="text-admin-text-secondary">
                Expires: <span className="font-semibold text-admin-text">
                  {selectedSchool.seatExpiresAt
                    ? new Date(selectedSchool.seatExpiresAt).toLocaleDateString()
                    : '—'}
                </span>
              </p>
              <p className="text-admin-text-secondary">
                Code redemptions: <span className="font-semibold text-admin-text">{selectedSchool.seatCodeUses}</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="flex-1">
                <AdminInput
                  type="number"
                  min={1}
                  placeholder="Seats to remove, e.g. 10"
                  value={reduceSeatsInput}
                  hint="Fails when active seats would exceed the new cap — revoke seats first"
                  onChange={(e) => {
                    setReduceSeatsInput(e.target.value);
                    setReduceError(null);
                  }}
                />
              </div>
              <AdminButton
                variant="danger"
                leftIcon={<MinusCircle className="w-4 h-4" />}
                disabled={!reduceSeatsValid}
                onClick={() => setReduceOpen(true)}
              >
                Reduce seats
              </AdminButton>
            </div>
            {reduceError && (
              <p className="mt-3 text-sm text-admin-accent-rose">{reduceError}</p>
            )}
            {reduceResult && (
              <div className="mt-4 p-4 border border-admin-border rounded-lg">
                <p className="text-sm text-admin-accent-emerald">
                  Removed {reduceResult.seatsRemoved} seat{reduceResult.seatsRemoved === 1 ? '' : 's'} — new cap is {reduceResult.newCap}.
                </p>
                <p className="mt-1 text-sm text-admin-text-secondary">
                  Prorated credit: <span className="font-semibold text-admin-text">GHS {reduceResult.creditGhs.toLocaleString()}</span>
                  {' '}({reduceResult.billingCycle} cycle, {reduceResult.remainingDays} days remaining).
                  Total seat credit: GHS {reduceResult.seatCredit.toLocaleString()}.
                </p>
              </div>
            )}
          </AdminCard>

          <AdminConfirmModal
            isOpen={demoteTarget !== null}
            onClose={() => setDemoteTarget(null)}
            onConfirm={handleDemoteSchoolAdmin}
            title="Remove school admin?"
            message={`Remove ${demoteTarget?.name ?? 'this user'} as a school admin of ${selectedSchool.name}? Their role is restored (teacher when they have a teacher profile, otherwise student) and the school link is cleared.`}
            confirmText="Remove school admin"
            variant="danger"
            isLoading={schoolAdminLoading === demoteTarget?.id}
          />

          <AdminConfirmModal
            isOpen={reduceOpen}
            onClose={() => setReduceOpen(false)}
            onConfirm={handleReduceSeats}
            title="Reduce seat cap?"
            message={`Reduce the seat cap of ${selectedSchool.name} by ${reduceSeatsValid ? reduceSeatsValue : 0} seat(s)? The reduction fails when active seats would exceed the new cap — revoke seats first. The unused remainder becomes prorated seat credit.`}
            confirmText="Reduce seats"
            variant="danger"
            isLoading={reduceLoading}
          />
        </>
      )}
    </div>
  );
}
