import { useEffect, useState } from 'react';
import { ArrowRight, Check, Copy, Medal, Sparkles, Users, WalletCards } from 'lucide-react';
import type { AffiliateProfile } from '@/types';

interface AffiliateOnboardingSpotlightProps {
  profile: AffiliateProfile | null;
  isLoading: boolean;
  onExplore: () => void;
}

export function AffiliateOnboardingSpotlight({
  profile,
  isLoading,
  onExplore,
}: AffiliateOnboardingSpotlightProps) {
  const [copied, setCopied] = useState(false);
  const commissionRate = Math.round((profile?.tier.commissionRate ?? 0.25) * 100);

  useEffect(() => {
    setCopied(false);
  }, [profile?.referralLink]);

  const handleCopy = async () => {
    if (!profile?.referralLink) return;

    try {
      await navigator.clipboard.writeText(profile.referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section aria-labelledby="affiliate-spotlight-heading" className="space-y-4">
      <h3 id="affiliate-spotlight-heading" className="sr-only">
        Your Brilla Scout benefits
      </h3>

      <div className="relative overflow-hidden rounded-xl border border-primary-200 bg-primary-900 px-4 py-4 text-white shadow-card">
        <div className="absolute inset-x-0 top-0 flex h-1.5" aria-hidden="true">
          <span className="flex-1 bg-primary-light" />
          <span className="flex-1 bg-secondary" />
          <span className="flex-1 bg-accent" />
          <span className="flex-1 bg-secondary" />
          <span className="flex-1 bg-primary-light" />
        </div>
        <div className="flex items-start gap-3 pt-1">
          <div className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-secondary text-primary-900 shadow-sm">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
              Brilla Scout
            </p>
            <p className="mt-1 text-sm leading-5 text-white/90">
              You are ready to invite classmates, track every referral, and grow into higher ambassador tiers.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3" aria-label="Scout benefits">
        <article className="rounded-xl border border-neutral-200 bg-white p-3">
          <Users className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />
          <h4 className="text-sm font-semibold text-neutral-900">Easy invitations</h4>
          <p className="mt-1 text-xs leading-5 text-neutral-600">
            Friends join instantly with your link—no approval queue.
          </p>
        </article>
        <article className="rounded-xl border border-neutral-200 bg-white p-3">
          <WalletCards className="mb-2 h-5 w-5 text-accent" aria-hidden="true" />
          <h4 className="text-sm font-semibold text-neutral-900">{commissionRate}% starting rate</h4>
          <p className="mt-1 text-xs leading-5 text-neutral-600">
            Earn commission when an eligible referral buys a subscription.
          </p>
        </article>
        <article className="rounded-xl border border-neutral-200 bg-white p-3">
          <Medal className="mb-2 h-5 w-5 text-secondary-700" aria-hidden="true" />
          <h4 className="text-sm font-semibold text-neutral-900">Rewards that grow</h4>
          <p className="mt-1 text-xs leading-5 text-neutral-600">
            Earn 100 reward points per referred signup and progress through tiers.
          </p>
        </article>
      </div>

      <div className="rounded-xl border border-primary-200 bg-primary-50 p-3.5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Your personal Scout link</p>
            <p className="mt-0.5 text-xs text-neutral-600">Share it only with people who may genuinely benefit.</p>
          </div>
          {profile?.tier.title && (
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-primary-700 shadow-sm">
              {profile.tier.title}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="h-11 animate-pulse rounded-lg bg-primary-100 motion-reduce:animate-none" aria-label="Preparing your personal link" />
        ) : profile ? (
          <div className="flex items-stretch gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg border border-primary-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-800">
              {profile.referralCode}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={copied ? 'Referral link copied' : 'Copy referral link'}
            >
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              <span>{copied ? 'Copied' : 'Copy link'}</span>
            </button>
          </div>
        ) : (
          <p className="rounded-lg border border-primary-200 bg-white px-3 py-2.5 text-sm text-neutral-700">
            Your link is available in the Affiliate hub.
          </p>
        )}
        <p className="sr-only" aria-live="polite">{copied ? 'Referral link copied to clipboard.' : ''}</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-neutral-500">
          Commissions and payouts follow the Affiliate Program terms.
        </p>
        <button
          type="button"
          onClick={onExplore}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-primary-200 bg-white px-4 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Explore Affiliate hub
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
