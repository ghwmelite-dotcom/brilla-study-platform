import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';

interface CampaignSummary {
  id: string;
  name: string;
  subject: string;
  previewText: string;
  message: string;
  pilotPercent: number;
  status: 'draft' | 'audience_ready' | 'provider_draft' | 'cancelled';
  audienceCount: number;
  providerDraftCreated: boolean;
  dispatch: {
    status: 'preparing' | 'queued' | 'sent' | 'failed';
    expectedRecipientCount: number;
    providerStatus: string | null;
    failureCode: string | null;
    requestedAt: string;
    completedAt: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface CampaignOverview {
  audience: {
    activeVerified: number;
    explicitlyConsented: number;
    eligible: number;
    suppressed: number;
  };
  provider: {
    apiConfigured: boolean;
    webhookConfigured: boolean;
    topicConfigured: boolean;
  };
  campaigns: CampaignSummary[];
  safety: {
    sendEndpointAvailable: boolean;
    note: string;
  };
}

const DEFAULT_CAMPAIGN = {
  name: 'Referral rewards pilot',
  subject: 'Help a friend prepare with BrillaPrep',
  previewText: 'Share BrillaPrep with a friend and track eligible referral rewards.',
  message: 'Invite a friend who is preparing for BECE, WASSCE, Cambridge or NSMQ. Your referral dashboard makes it easy to share your link and follow qualifying rewards.',
  pilotPercent: 10,
};

function statusLabel(status: CampaignSummary['status']): string {
  return status.replace(/_/g, ' ');
}

export default function AdminCampaigns() {
  const [overview, setOverview] = useState<CampaignOverview | null>(null);
  const [form, setForm] = useState(DEFAULT_CAMPAIGN);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<CampaignOverview>('/marketing/admin/overview');
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load campaign controls');
      }
      setOverview(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load campaign controls');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const createCampaign = async () => {
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.post<{ id: string; status: string }>('/marketing/admin/campaigns', form);
      if (!response.success) throw new Error(response.error || 'Failed to create campaign draft');
      setSuccess('Internal campaign draft created. No email was sent.');
      await loadOverview();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create campaign draft');
    } finally {
      setCreating(false);
    }
  };

  const buildAudience = async (campaign: CampaignSummary) => {
    setWorkingId(campaign.id);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.post<{
        eligiblePool: number;
        audienceCount: number;
        pilotPercent: number;
      }>(`/marketing/admin/campaigns/${campaign.id}/build-audience`);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to build consent-filtered audience');
      }
      setSuccess(`Audience snapshot ready: ${response.data.audienceCount} of ${response.data.eligiblePool} eligible users. No email was sent.`);
      await loadOverview();
    } catch (audienceError) {
      setError(audienceError instanceof Error ? audienceError.message : 'Failed to build audience');
    } finally {
      setWorkingId(null);
    }
  };

  const createProviderDraft = async (campaign: CampaignSummary) => {
    setWorkingId(campaign.id);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.post<{
        synced: number;
        suppressed: number;
        failed: number;
        message: string;
      }>(`/marketing/admin/campaigns/${campaign.id}/provider-draft`);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create provider draft');
      }
      setSuccess(`${response.data.message} ${response.data.synced} synchronized, ${response.data.suppressed} suppressed, ${response.data.failed} failed.`);
      await loadOverview();
    } catch (draftError) {
      setError(draftError instanceof Error ? draftError.message : 'Failed to create provider draft');
    } finally {
      setWorkingId(null);
    }
  };

  const sendCampaign = async (campaign: CampaignSummary) => {
    const confirmation = window.prompt(
      `This will email ${campaign.audienceCount} explicitly consented recipient${campaign.audienceCount === 1 ? '' : 's'}. Type SEND ${campaign.id} to confirm.`,
    );
    if (confirmation === null) return;
    setWorkingId(campaign.id);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.post<{ status: string; recipientCount: number }>(
        `/marketing/admin/campaigns/${campaign.id}/send`,
        { confirmation },
      );
      if (!response.success || !response.data) throw new Error(response.error || 'Campaign dispatch failed');
      setSuccess(`Campaign queued for ${response.data.recipientCount} consented recipient${response.data.recipientCount === 1 ? '' : 's'}.`);
      await loadOverview();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Campaign dispatch failed');
    } finally {
      setWorkingId(null);
    }
  };

  const refreshDispatch = async (campaign: CampaignSummary) => {
    setWorkingId(campaign.id);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.post<{ status: string; providerStatus: string; recipientCount: number }>(
        `/marketing/admin/campaigns/${campaign.id}/refresh-dispatch`,
      );
      if (!response.success || !response.data) throw new Error(response.error || 'Could not refresh dispatch status');
      setSuccess(`Provider status: ${response.data.providerStatus}.`);
      await loadOverview();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Could not refresh dispatch status');
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="space-y-6 text-admin-text">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Referral email campaigns</h1>
          <p className="mt-1 text-sm text-admin-text-muted">
            Prepare and dispatch consent-filtered Resend pilots with duplicate-send protection.
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
      </div>

      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Consent and one-dispatch safety locks are active</p>
            <p className="mt-1 text-emerald-100/80">
              Existing users are opted out by default. Only verified, explicitly consented, adult-eligible,
              unsuppressed accounts with referral profiles can enter an audience snapshot.
              Sending rechecks that snapshot and requires a typed campaign-specific confirmation.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200" role="status">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {loading && !overview ? (
        <div className="flex min-h-48 items-center justify-center rounded-xl border border-admin-border bg-admin-bg-secondary">
          <Loader2 className="h-7 w-7 animate-spin text-admin-accent-cyan" />
        </div>
      ) : overview && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Verified active', overview.audience.activeVerified, Users],
              ['Explicitly consented', overview.audience.explicitlyConsented, ShieldCheck],
              ['Eligible now', overview.audience.eligible, CheckCircle2],
              ['Suppressed', overview.audience.suppressed, Mail],
            ].map(([label, value, Icon]) => {
              const MetricIcon = Icon as typeof Users;
              return (
                <div key={String(label)} className="rounded-xl border border-admin-border bg-admin-bg-secondary p-5">
                  <MetricIcon className="h-5 w-5 text-admin-accent-cyan" />
                  <p className="mt-3 text-3xl font-bold">{Number(value)}</p>
                  <p className="mt-1 text-sm text-admin-text-muted">{String(label)}</p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr,1.35fr]">
            <section className="rounded-xl border border-admin-border bg-admin-bg-secondary p-5">
              <h2 className="text-lg font-semibold">Create an internal draft</h2>
              <p className="mt-1 text-sm text-admin-text-muted">Plain text is escaped by the server and placed in a fixed, accessible template.</p>
              <div className="mt-5 space-y-4">
                <label className="block text-sm">
                  <span className="mb-1 block text-admin-text-secondary">Internal name</span>
                  <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={100} className="min-h-11 w-full rounded-lg border border-admin-border bg-admin-bg px-3" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-admin-text-secondary">Subject</span>
                  <input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} maxLength={150} className="min-h-11 w-full rounded-lg border border-admin-border bg-admin-bg px-3" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-admin-text-secondary">Preview text</span>
                  <input value={form.previewText} onChange={(event) => setForm({ ...form, previewText: event.target.value })} maxLength={180} className="min-h-11 w-full rounded-lg border border-admin-border bg-admin-bg px-3" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-admin-text-secondary">Message</span>
                  <textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} maxLength={800} rows={5} className="w-full rounded-lg border border-admin-border bg-admin-bg p-3" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-admin-text-secondary">Pilot percentage (1–10%)</span>
                  <input type="number" min={1} max={10} value={form.pilotPercent} onChange={(event) => setForm({ ...form, pilotPercent: Number(event.target.value) })} className="min-h-11 w-full rounded-lg border border-admin-border bg-admin-bg px-3" />
                </label>
                <button type="button" onClick={() => void createCampaign()} disabled={creating} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-admin-accent-cyan px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
                  Create draft
                </button>
              </div>
            </section>

            <section className="space-y-4">
              <div className="rounded-xl border border-admin-border bg-admin-bg-secondary p-4 text-sm">
                <p className="font-semibold">Provider readiness</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <span>{overview.provider.apiConfigured ? 'Ready' : 'Missing'}: API key</span>
                  <span>{overview.provider.webhookConfigured ? 'Ready' : 'Missing'}: signed webhook</span>
                  <span>{overview.provider.topicConfigured ? 'Ready' : 'Optional'}: referral topic</span>
                </div>
              </div>

              {overview.campaigns.length === 0 ? (
                <div className="rounded-xl border border-dashed border-admin-border bg-admin-bg-secondary p-8 text-center text-admin-text-muted">No campaign drafts yet.</div>
              ) : overview.campaigns.map((campaign) => (
                <article key={campaign.id} className="rounded-xl border border-admin-border bg-admin-bg-secondary p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <p className="mt-1 text-sm text-admin-text-muted">{campaign.subject}</p>
                    </div>
                    <span className="rounded-full bg-admin-bg-tertiary px-3 py-1 text-xs font-semibold uppercase tracking-wide">{statusLabel(campaign.status)}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-admin-text-secondary">
                    <span>Pilot: {campaign.pilotPercent}%</span>
                    <span>Snapshot: {campaign.audienceCount}</span>
                    <span>Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {(campaign.status === 'draft' || campaign.status === 'audience_ready') && (
                      <button type="button" onClick={() => void buildAudience(campaign)} disabled={workingId === campaign.id} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-admin-border px-4 py-2 text-sm font-semibold hover:bg-admin-bg-tertiary disabled:opacity-50">
                        {workingId === campaign.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                        {campaign.status === 'audience_ready' ? 'Rebuild audience' : 'Build pilot audience'}
                      </button>
                    )}
                    {campaign.status === 'audience_ready' && campaign.audienceCount > 0 && (
                      <button type="button" onClick={() => void createProviderDraft(campaign)} disabled={workingId === campaign.id || !overview.provider.apiConfigured} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-admin-accent-cyan px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">
                        {workingId === campaign.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        Create Resend draft
                      </button>
                    )}
                    {campaign.status === 'provider_draft' && (
                      campaign.dispatch ? (
                        <>
                          <span className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
                            <CheckCircle2 className="h-4 w-4" /> Dispatch: {campaign.dispatch.providerStatus || campaign.dispatch.status}
                          </span>
                          <button type="button" onClick={() => void refreshDispatch(campaign)} disabled={workingId === campaign.id} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-admin-border px-4 py-2 text-sm font-semibold hover:bg-admin-bg-tertiary disabled:opacity-50">
                            {workingId === campaign.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Refresh provider status
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={() => void sendCampaign(campaign)} disabled={workingId === campaign.id || !overview.provider.apiConfigured || !overview.provider.webhookConfigured || !overview.provider.topicConfigured} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">
                          {workingId === campaign.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                          Send consented pilot
                        </button>
                      )
                    )}
                  </div>
                </article>
              ))}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
