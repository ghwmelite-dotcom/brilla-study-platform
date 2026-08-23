import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Coins,
  Copy,
  MousePointerClick,
  RefreshCw,
  Share2,
  Users,
} from 'lucide-react';
import { api, type ApiResponse } from '@/lib/api';
import type { AffiliateDashboard } from '@/types';

type ScoutNetworkState =
  | { kind: 'loading' }
  | { kind: 'ready'; dashboard: AffiliateDashboard }
  | { kind: 'inactive' }
  | { kind: 'error' };

interface ScoutNetworkCardProps {
  loadDashboard?: () => Promise<ApiResponse<AffiliateDashboard>>;
}

const loadScoutDashboard = () => api.get<AffiliateDashboard>('/affiliates/dashboard?summary=1');

const currency = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
  minimumFractionDigits: 2,
});

export function ScoutNetworkCard({ loadDashboard = loadScoutDashboard }: ScoutNetworkCardProps) {
  const [state, setState] = useState<ScoutNetworkState>({ kind: 'loading' });
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);
  const mounted = useRef(false);

  const refresh = useCallback(async () => {
    setState({ kind: 'loading' });
    const response = await loadDashboard();
    if (!mounted.current) return;

    if (response.success && response.data) {
      setState({ kind: 'ready', dashboard: response.data });
      return;
    }

    if (response.error === 'Affiliate profile not found') {
      setState({ kind: 'inactive' });
      return;
    }

    setState({ kind: 'error' });
  }, [loadDashboard]);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => {
      mounted.current = false;
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    };
  }, [refresh]);

  const handleCopy = async (referralLink: string) => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (state.kind === 'loading') {
    return (
      <section
        aria-label="Loading your Scout network"
        aria-busy="true"
        className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-card"
      >
        <div className="h-1.5 animate-pulse bg-primary-200 motion-reduce:animate-none" />
        <div className="space-y-4 p-5 sm:p-6">
          <div className="h-7 w-52 animate-pulse rounded bg-neutral-200 motion-reduce:animate-none" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-20 animate-pulse rounded-xl bg-neutral-100 motion-reduce:animate-none" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (state.kind === 'inactive') {
    return (
      <section className="rounded-2xl border border-primary-200 bg-primary-50 p-5 sm:p-6" aria-labelledby="scout-inactive-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-primary text-white">
              <Share2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="scout-inactive-heading" className="font-display text-lg font-bold text-neutral-900">Activate your Scout hub</h2>
              <p className="mt-1 text-sm leading-6 text-neutral-600">Create your personal invite link, then track every signup and reward here.</p>
            </div>
          </div>
          <Link
            to="/affiliate"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Activate Scout hub
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  if (state.kind === 'error') {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6" aria-labelledby="scout-error-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="scout-error-heading" className="font-semibold text-neutral-900">Scout stats are temporarily unavailable</h2>
            <p className="mt-1 text-sm text-neutral-600">Your link and rewards are safe. Refresh this panel to load the latest totals.</p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-neutral-800 transition-colors hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      </section>
    );
  }

  const { dashboard } = state;
  // The fallback keeps Pages safe during a rolling Worker/Pages deployment.
  const networkStatus = dashboard.networkStatus ?? { pending: 0, trial: 0, converted: 0, churned: 0 };
  const hasNetwork = dashboard.stats.totalReferrals > 0;
  const commissionRate = Math.round((dashboard.tier?.commissionRate ?? 0) * 100);
  const statusItems = [
    { label: 'new', value: networkStatus.pending, color: 'bg-sky-500' },
    { label: 'in trial', value: networkStatus.trial, color: 'bg-amber-500' },
    { label: 'subscribed', value: networkStatus.converted, color: 'bg-emerald-500' },
    { label: 'ended', value: networkStatus.churned, color: 'bg-neutral-400' },
  ];
  const metrics = [
    { label: 'Link visits', value: dashboard.stats.totalClicks, detail: `${dashboard.stats.clicksThisWeek} this week`, icon: MousePointerClick },
    { label: 'Students joined', value: dashboard.stats.totalReferrals, detail: `${dashboard.stats.referralsThisMonth} this month`, icon: Users },
    { label: 'Subscribed', value: dashboard.stats.successfulConversions, detail: `${dashboard.stats.conversionRate}% conversion`, icon: BadgeCheck },
    { label: 'Available', value: currency.format(dashboard.stats.availableEarnings), detail: `${currency.format(dashboard.stats.pendingEarnings)} pending`, icon: Coins },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-card" aria-labelledby="scout-network-heading">
      <div className="flex h-1.5" aria-hidden="true">
        <span className="flex-1 bg-primary" />
        <span className="flex-1 bg-secondary" />
        <span className="flex-1 bg-accent" />
        <span className="flex-1 bg-secondary" />
        <span className="flex-1 bg-primary" />
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-primary-900 text-secondary shadow-sm">
              <Share2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Brilla Scout</p>
              <h2 id="scout-network-heading" className="mt-0.5 font-display text-xl font-bold text-neutral-900">Your Scout network</h2>
              <p className="mt-1 text-sm text-neutral-600">See how your invitations become learners, rewards, and tier progress.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-primary-50 px-3 py-1.5 text-primary-700">
              {dashboard.tier?.title ?? 'Scout'} · {commissionRate}% rate
            </span>
            <span className="rounded-full bg-secondary-100 px-3 py-1.5 text-secondary-800">
              #{dashboard.ranking.rank} of {dashboard.ranking.totalParticipants}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Scout performance">
          {metrics.map(({ label, value, detail, icon: Icon }) => (
            <article key={label} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5">
              <div className="flex items-center gap-2 text-neutral-500">
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-xs font-medium">{label}</span>
              </div>
              <p className="mt-2 text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">{value}</p>
              <p className="mt-0.5 text-xs text-neutral-500">{detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Network status</h3>
              <p className="mt-0.5 text-xs text-neutral-500">Current totals across your own referrals</p>
            </div>
            {hasNetwork && (
              <div className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Referral statuses">
                {statusItems.map((item) => (
                  <span key={item.label} className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700">
                    <span className={`h-2 w-2 rounded-full ${item.color}`} aria-hidden="true" />
                    {item.value} {item.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {!hasNetwork && (
            <div className="mt-3 rounded-lg bg-primary-50 px-3.5 py-3">
              <p className="text-sm font-semibold text-primary-900">Your Scout trail starts here</p>
              <p className="mt-1 text-xs leading-5 text-primary-800">Share your personal link with a classmate who could benefit from BrillaPrep. Their status will appear here after they join.</p>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-neutral-200 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Your invite code</p>
            <code className="mt-1 block truncate text-sm font-bold tracking-wide text-neutral-900">{dashboard.referralCode}</code>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleCopy(dashboard.referralLink)}
              aria-label={copied ? 'Scout invite link copied' : 'Copy Scout invite link'}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 text-sm font-semibold text-primary-800 transition-colors hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy invite link'}
            </button>
            <Link
              to="/affiliate"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Open Scout hub
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <p className="sr-only" aria-live="polite">{copied ? 'Scout invite link copied to clipboard.' : ''}</p>
      </div>
    </section>
  );
}
