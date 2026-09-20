import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Loader2,
  Mail,
  Megaphone,
  MessageSquare,
  RefreshCw,
  Send,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';

type AudienceType = 'all' | 'exam' | 'school' | 'tier' | 'chatrooms';

interface SelectOption {
  id: string;
  name: string;
  memberCount?: number;
}

interface AnnouncementSummary {
  id: string;
  title: string;
  message: string;
  link: string | null;
  audienceType: AudienceType;
  audienceIds: string[];
  channels: { inApp: boolean; email: boolean; chatrooms: boolean };
  status: 'draft' | 'dispatching' | 'sent' | 'partial' | 'failed';
  results: {
    matchedUsers: number;
    inAppSent: number;
    emailQueued: number;
    emailSkipped: number;
    emailFailed: number;
    chatroomsPosted: number;
  };
  createdAt: string;
  dispatchedAt: string | null;
}

interface AnnouncementOverview {
  provider: { emailConfigured: boolean };
  options: {
    examTypes: SelectOption[];
    schools: SelectOption[];
    tiers: SelectOption[];
    chatrooms: Array<SelectOption & { type: string }>;
  };
  announcements: AnnouncementSummary[];
}

interface AudiencePreview {
  matchedUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  emailCandidates: number;
  selectedChatrooms: number;
}

const DEFAULT_MESSAGE = `We'd love to know how your experience with Brilla has been so far. Your honest feedback—positive or negative—will help us improve the platform for you.

Please tell us:
1. How would you rate your overall experience: Great, Good, Okay, or Needs Improvement?
2. Which Brilla feature has helped you most?
3. Have you experienced any difficulty, confusion, or technical problem?
4. What is the one improvement you would most like us to make?

You may reply in the community chatroom or send us a private message. Please do not share passwords, phone numbers, school IDs, or other sensitive personal information.

Thank you for helping us build a better Brilla.`;

const AUDIENCE_LABELS: Record<AudienceType, string> = {
  all: 'All approved users',
  exam: 'Exam groups',
  school: 'Schools',
  tier: 'Subscription tiers',
  chatrooms: 'Selected chatrooms',
};

const DEFAULT_FORM = {
  title: 'How has your Brilla experience been?',
  message: DEFAULT_MESSAGE,
  link: '/community',
  audienceType: 'all' as AudienceType,
  audienceIds: [] as string[],
  sendInApp: true,
  sendEmail: true,
  postToChatrooms: false,
};

function statusClasses(status: AnnouncementSummary['status']): string {
  if (status === 'sent') return 'bg-emerald-500/15 text-emerald-300';
  if (status === 'partial') return 'bg-amber-500/15 text-amber-300';
  if (status === 'failed') return 'bg-red-500/15 text-red-300';
  if (status === 'dispatching') return 'bg-cyan-500/15 text-cyan-300';
  return 'bg-admin-bg-tertiary text-admin-text-secondary';
}

export default function AdminAnnouncements() {
  const [overview, setOverview] = useState<AnnouncementOverview | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<AnnouncementOverview>('/announcements/admin/overview');
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load announcements');
      }
      setOverview(response.data);
      if (!response.data.provider.emailConfigured) {
        setForm((current) => ({ ...current, sendEmail: false }));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const audienceOptions = useMemo<SelectOption[]>(() => {
    if (!overview) return [];
    if (form.audienceType === 'exam') return overview.options.examTypes;
    if (form.audienceType === 'school') return overview.options.schools;
    if (form.audienceType === 'tier') return overview.options.tiers;
    if (form.audienceType === 'chatrooms') return overview.options.chatrooms;
    return [];
  }, [form.audienceType, overview]);

  const audienceValid = form.audienceType === 'all' || form.audienceIds.length > 0;
  const channelsValid = form.sendInApp || form.sendEmail || form.postToChatrooms;

  const selectAudienceType = (audienceType: AudienceType) => {
    setForm((current) => ({
      ...current,
      audienceType,
      audienceIds: [],
      postToChatrooms: audienceType === 'chatrooms' ? current.postToChatrooms : false,
    }));
    setPreview(null);
  };

  const toggleAudienceId = (id: string) => {
    setForm((current) => ({
      ...current,
      audienceIds: current.audienceIds.includes(id)
        ? current.audienceIds.filter((value) => value !== id)
        : [...current.audienceIds, id],
    }));
    setPreview(null);
  };

  const previewAudience = async () => {
    setPreviewing(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.post<AudiencePreview>('/announcements/admin/preview', {
        audienceType: form.audienceType,
        audienceIds: form.audienceIds,
      });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to preview audience');
      }
      setPreview(response.data);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : 'Failed to preview audience');
    } finally {
      setPreviewing(false);
    }
  };

  const createAnnouncement = async () => {
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.post<{ id: string; status: string }>(
        '/announcements/admin/announcements',
        form,
      );
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create announcement draft');
      }
      setSuccess('Announcement draft created. Nothing has been sent yet.');
      setPreview(null);
      await loadOverview();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create announcement');
    } finally {
      setCreating(false);
    }
  };

  const sendAnnouncement = async (announcement: AnnouncementSummary) => {
    const confirmation = window.prompt(
      `This will dispatch “${announcement.title}” to its saved audience. Type SEND ${announcement.id} to confirm.`,
    );
    if (confirmation === null) return;
    setWorkingId(announcement.id);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.post<{
        status: string;
        matchedUsers: number;
        inAppSent: number;
        emailQueued: number;
        emailSkipped: number;
        emailFailed: number;
        chatroomsPosted: number;
      }>(`/announcements/admin/announcements/${announcement.id}/send`, { confirmation });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Announcement dispatch failed');
      }
      setSuccess(
        `Dispatch ${response.data.status}: ${response.data.inAppSent} in-app, ${response.data.emailQueued} email, and ${response.data.chatroomsPosted} chatroom deliveries.`,
      );
      await loadOverview();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Announcement dispatch failed');
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="space-y-6 text-admin-text">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold">
            <Megaphone className="h-6 w-6 text-admin-accent-cyan" />
            Platform announcements
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-admin-text-muted">
            Send one controlled message through in-app notifications, registered email addresses,
            and selected community chatrooms.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadOverview()}
          disabled={loading}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-admin-border bg-admin-bg-secondary px-4 py-2 text-sm font-semibold hover:bg-admin-bg-tertiary disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-100">
        <p className="font-semibold">Inactive approved accounts are included</p>
        <p className="mt-1 text-cyan-100/80">
          Suspended, rejected, pending, demo, and administrator accounts are excluded. Email requires
          a verified address, user permission, and a configured Resend key.
        </p>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {loading && !overview ? (
        <div className="flex min-h-56 items-center justify-center rounded-xl border border-admin-border bg-admin-bg-secondary">
          <Loader2 className="h-7 w-7 animate-spin text-admin-accent-cyan" />
        </div>
      ) : overview && (
        <div className="grid gap-6 xl:grid-cols-[1.05fr,1fr]">
          <section className="rounded-xl border border-admin-border bg-admin-bg-secondary p-5">
            <h2 className="text-lg font-semibold">Compose announcement</h2>
            <p className="mt-1 text-sm text-admin-text-muted">
              Create a reviewable draft first. Dispatch requires a typed confirmation.
            </p>

            <div className="mt-5 space-y-5">
              <label className="block text-sm">
                <span className="mb-1 block text-admin-text-secondary">Title and email subject</span>
                <input
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  maxLength={120}
                  className="min-h-11 w-full rounded-lg border border-admin-border bg-admin-bg px-3"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-admin-text-secondary">Message</span>
                <textarea
                  value={form.message}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                  maxLength={3000}
                  rows={12}
                  className="w-full rounded-lg border border-admin-border bg-admin-bg p-3 leading-6"
                />
                <span className="mt-1 block text-right text-xs text-admin-text-muted">
                  {form.message.length}/3000
                </span>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-admin-text-secondary">Open link</span>
                <input
                  value={form.link}
                  onChange={(event) => setForm({ ...form, link: event.target.value })}
                  maxLength={500}
                  placeholder="/community"
                  className="min-h-11 w-full rounded-lg border border-admin-border bg-admin-bg px-3"
                />
              </label>

              <fieldset>
                <legend className="text-sm font-semibold text-admin-text-secondary">Audience</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {(Object.keys(AUDIENCE_LABELS) as AudienceType[]).map((type) => (
                    <label
                      key={type}
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-sm hover:bg-admin-bg-tertiary"
                    >
                      <input
                        type="radio"
                        name="audience"
                        checked={form.audienceType === type}
                        onChange={() => selectAudienceType(type)}
                        className="h-4 w-4 accent-cyan-400"
                      />
                      {AUDIENCE_LABELS[type]}
                    </label>
                  ))}
                </div>
              </fieldset>

              {form.audienceType !== 'all' && (
                <fieldset>
                  <legend className="text-sm font-semibold text-admin-text-secondary">
                    Select {AUDIENCE_LABELS[form.audienceType].toLowerCase()}
                  </legend>
                  <div className="mt-2 max-h-56 space-y-2 overflow-y-auto rounded-lg border border-admin-border bg-admin-bg p-3 admin-scrollbar">
                    {audienceOptions.length === 0 ? (
                      <p className="text-sm text-admin-text-muted">No options are currently available.</p>
                    ) : audienceOptions.map((option) => (
                      <label key={option.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-admin-bg-tertiary">
                        <input
                          type="checkbox"
                          checked={form.audienceIds.includes(option.id)}
                          onChange={() => toggleAudienceId(option.id)}
                          className="h-4 w-4 accent-cyan-400"
                        />
                        <span className="flex-1 text-sm">{option.name}</span>
                        {option.memberCount !== undefined && (
                          <span className="text-xs text-admin-text-muted">{option.memberCount} members</span>
                        )}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              <fieldset>
                <legend className="text-sm font-semibold text-admin-text-secondary">Delivery channels</legend>
                <div className="mt-2 space-y-2">
                  <label className="flex min-h-11 items-center gap-3 rounded-lg border border-admin-border bg-admin-bg px-3 py-2">
                    <input
                      type="checkbox"
                      checked={form.sendInApp}
                      onChange={(event) => setForm({ ...form, sendInApp: event.target.checked })}
                      className="h-4 w-4 accent-cyan-400"
                    />
                    <Bell className="h-4 w-4 text-admin-accent-cyan" />
                    <span className="text-sm">In-app notification</span>
                  </label>
                  <label className="flex min-h-11 items-center gap-3 rounded-lg border border-admin-border bg-admin-bg px-3 py-2">
                    <input
                      type="checkbox"
                      checked={form.sendEmail}
                      disabled={!overview.provider.emailConfigured}
                      onChange={(event) => setForm({ ...form, sendEmail: event.target.checked })}
                      className="h-4 w-4 accent-cyan-400 disabled:opacity-50"
                    />
                    <Mail className="h-4 w-4 text-admin-accent-cyan" />
                    <span className="flex-1 text-sm">Registered email address</span>
                    {!overview.provider.emailConfigured && (
                      <span className="text-xs text-amber-300">Resend key missing</span>
                    )}
                  </label>
                  <label className={`flex min-h-11 items-center gap-3 rounded-lg border border-admin-border bg-admin-bg px-3 py-2 ${form.audienceType !== 'chatrooms' ? 'opacity-50' : ''}`}>
                    <input
                      type="checkbox"
                      checked={form.postToChatrooms}
                      disabled={form.audienceType !== 'chatrooms'}
                      onChange={(event) => setForm({ ...form, postToChatrooms: event.target.checked })}
                      className="h-4 w-4 accent-cyan-400"
                    />
                    <MessageSquare className="h-4 w-4 text-admin-accent-cyan" />
                    <span className="text-sm">Post once inside each selected chatroom</span>
                  </label>
                </div>
              </fieldset>

              <div className="flex flex-wrap gap-3 border-t border-admin-border pt-5">
                <button
                  type="button"
                  onClick={() => void previewAudience()}
                  disabled={previewing || !audienceValid}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-admin-border px-4 py-2 text-sm font-semibold hover:bg-admin-bg-tertiary disabled:opacity-50"
                >
                  {previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                  Preview audience
                </button>
                <button
                  type="button"
                  onClick={() => void createAnnouncement()}
                  disabled={creating || !audienceValid || !channelsValid || !form.title.trim() || !form.message.trim()}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-admin-accent-cyan px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
                  Create draft
                </button>
              </div>
            </div>
          </section>

          <div className="space-y-5">
            <section className="rounded-xl border border-admin-border bg-admin-bg-secondary p-5">
              <h2 className="text-lg font-semibold">Audience preview</h2>
              {!preview ? (
                <p className="mt-3 text-sm text-admin-text-muted">
                  Choose an audience, then preview it before creating the draft.
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    ['Matched users', preview.matchedUsers],
                    ['Active', preview.activeUsers],
                    ['Inactive', preview.inactiveUsers],
                    ['Email candidates', preview.emailCandidates],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-lg border border-admin-border bg-admin-bg p-4">
                      <p className="text-2xl font-bold">{Number(value)}</p>
                      <p className="mt-1 text-xs text-admin-text-muted">{String(label)}</p>
                    </div>
                  ))}
                  {form.audienceType === 'chatrooms' && (
                    <div className="col-span-2 rounded-lg border border-admin-border bg-admin-bg p-4">
                      <p className="text-2xl font-bold">{preview.selectedChatrooms}</p>
                      <p className="mt-1 text-xs text-admin-text-muted">Valid selected chatrooms</p>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Drafts and dispatches</h2>
                <span className="text-xs text-admin-text-muted">{overview.announcements.length} records</span>
              </div>
              {overview.announcements.length === 0 ? (
                <div className="rounded-xl border border-dashed border-admin-border bg-admin-bg-secondary p-8 text-center text-admin-text-muted">
                  No announcements have been created.
                </div>
              ) : overview.announcements.map((announcement) => (
                <article key={announcement.id} className="rounded-xl border border-admin-border bg-admin-bg-secondary p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{announcement.title}</h3>
                      <p className="mt-1 text-xs text-admin-text-muted">
                        {AUDIENCE_LABELS[announcement.audienceType]} · {new Date(announcement.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusClasses(announcement.status)}`}>
                      {announcement.status}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-admin-text-secondary sm:grid-cols-3">
                    <span>Matched: {announcement.results.matchedUsers}</span>
                    <span>In-app: {announcement.results.inAppSent}</span>
                    <span>Email queued: {announcement.results.emailQueued}</span>
                    <span>Email skipped: {announcement.results.emailSkipped}</span>
                    <span>Email failed: {announcement.results.emailFailed}</span>
                    <span>Rooms: {announcement.results.chatroomsPosted}</span>
                  </div>
                  {announcement.status !== 'sent' && (
                    <button
                      type="button"
                      onClick={() => void sendAnnouncement(announcement)}
                      disabled={workingId === announcement.id}
                      className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50"
                    >
                      {workingId === announcement.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {announcement.status === 'draft' ? 'Review and dispatch' : 'Retry incomplete delivery'}
                    </button>
                  )}
                </article>
              ))}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
