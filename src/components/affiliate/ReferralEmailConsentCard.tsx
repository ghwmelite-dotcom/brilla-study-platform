import { useCallback, useEffect, useId, useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  Check,
  Loader2,
  MailCheck,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';

type ConsentSurface = 'student_onboarding' | 'affiliate_dashboard';

interface ReferralEmailConsentCardProps {
  surface: ConsentSurface;
  className?: string;
}

interface MarketingPreference {
  referralRewardsOptIn: boolean;
  consentVersion: string | null;
  consentedAt: string | null;
  providerSyncStatus: string;
  emailVerified: boolean;
  consentCopyVersion: string;
}

const EMPTY_PREFERENCE: MarketingPreference = {
  referralRewardsOptIn: false,
  consentVersion: null,
  consentedAt: null,
  providerSyncStatus: 'not_synced',
  emailVerified: false,
  consentCopyVersion: '',
};

function statusCopy(status: string, optedIn: boolean): string {
  if (!optedIn) return 'Off';
  if (status === 'synced') return 'Connected';
  if (status === 'pending') return 'Connecting';
  if (status === 'failed') return 'Needs attention';
  if (status === 'suppressed') return 'Suppressed';
  return 'Not connected';
}

export function ReferralEmailConsentCard({
  surface,
  className = '',
}: ReferralEmailConsentCardProps) {
  const headingId = useId();
  const [preference, setPreference] = useState<MarketingPreference>(EMPTY_PREFERENCE);
  const [draftOptIn, setDraftOptIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPreference = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await api.get<MarketingPreference>('/marketing/preferences');
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Email choice could not be loaded');
      }
      setPreference(response.data);
      setDraftOptIn(response.data.referralRewardsOptIn);
    } catch (loadError) {
      setLoadError(loadError instanceof Error ? loadError.message : 'Email choice could not be loaded');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPreference();
  }, [loadPreference]);

  const isDirty = draftOptIn !== preference.referralRewardsOptIn;
  const canSave = !isLoading &&
    !isSaving &&
    (isDirty || (draftOptIn && preference.providerSyncStatus === 'failed')) &&
    (!draftOptIn || preference.emailVerified);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSuccess(null);
    try {
      const response = await api.put<{
        referralRewardsOptIn: boolean;
        providerSyncStatus: string;
      }>('/marketing/preferences', {
        referralRewardsOptIn: draftOptIn,
        consentSource: surface,
      });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Email choice could not be saved');
      }
      setPreference((current) => ({
        ...current,
        referralRewardsOptIn: response.data!.referralRewardsOptIn,
        providerSyncStatus: response.data!.providerSyncStatus,
      }));
      setDraftOptIn(response.data.referralRewardsOptIn);
      setSuccess(response.data.referralRewardsOptIn
        ? response.data.providerSyncStatus === 'synced'
          ? 'You will now receive occasional Scout referral and reward updates.'
          : 'Your choice was saved. Email delivery is still connecting.'
        : 'Referral and reward marketing emails are now off.');
    } catch (saveError) {
      setSaveError(saveError instanceof Error ? saveError.message : 'Email choice could not be saved');
    } finally {
      setIsSaving(false);
    }
  };

  const isOnboarding = surface === 'student_onboarding';

  return (
    <section
      aria-labelledby={headingId}
      className={'relative overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm ' + className}
    >
      <div className="flex h-1.5" aria-hidden="true">
        <span className="flex-1 bg-red-600" />
        <span className="flex-1 bg-amber-400" />
        <span className="flex-1 bg-emerald-700" />
        <span className="flex-1 bg-amber-400" />
        <span className="flex-1 bg-red-600" />
      </div>

      <div className={isOnboarding ? 'p-4' : 'p-5 sm:p-6'}>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <BellRing className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  Scout signal
                </p>
                <h3 id={headingId} className="mt-1 text-base font-bold text-neutral-900 sm:text-lg">
                  Keep referral opportunities within reach
                </h3>
              </div>
              {!isLoading && !loadError && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-600">
                  {preference.referralRewardsOptIn && preference.providerSyncStatus === 'synced' && (
                    <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                  )}
                  {statusCopy(preference.providerSyncStatus, preference.referralRewardsOptIn)}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Choose occasional emails with practical sharing ideas and updates about eligible Brilla rewards.
              This is optional and never affects your account, lessons, or results.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-4 space-y-3" aria-label="Loading referral email choice">
            <div className="h-14 animate-pulse rounded-xl bg-neutral-100 motion-reduce:animate-none" />
            <div className="h-11 animate-pulse rounded-xl bg-neutral-100 motion-reduce:animate-none" />
          </div>
        ) : loadError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
            <div className="flex items-start gap-2 text-sm text-red-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
              <span>{loadError}</span>
            </div>
            <button
              type="button"
              onClick={() => void loadPreference()}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-800 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
          </div>
        ) : (
          <>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 transition-colors hover:bg-emerald-50">
              <input
                type="checkbox"
                checked={draftOptIn}
                disabled={!preference.emailVerified || isSaving}
                onChange={(event) => {
                  setDraftOptIn(event.target.checked);
                  setSuccess(null);
                  setSaveError(null);
                }}
                aria-label="Email me Scout referral ideas and reward updates"
                className="mt-0.5 h-5 w-5 flex-none rounded text-emerald-700 focus:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <span>
                <span className="block text-sm font-semibold text-neutral-900">
                  Email me Scout referral ideas and reward updates
                </span>
                <span className="mt-1 block text-xs leading-5 text-neutral-600">
                  No daily blasts. You can switch this off here or in Settings at any time.
                </span>
              </span>
            </label>

            {!preference.emailVerified && (
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                <MailCheck className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
                Confirm your email address before choosing referral emails.
              </p>
            )}

            <div className="mt-4 flex flex-col gap-3 border-t border-neutral-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2 text-xs leading-5 text-neutral-500">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-emerald-700" aria-hidden="true" />
                Essential security, learning, and payment emails stay separate from this choice.
              </p>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!canSave}
                className="inline-flex min-h-11 flex-none items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                ) : (
                  <MailCheck className="h-4 w-4" aria-hidden="true" />
                )}
                Save email choice
              </button>
            </div>

            <div className="mt-3 min-h-5" aria-live="polite">
              {success && (
                <p className="flex items-start gap-2 text-sm text-emerald-800" role="status">
                  <Check className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
                  {success}
                </p>
              )}
              {saveError && (
                <p className="flex items-start gap-2 text-sm text-red-700" role="alert">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
                  {saveError}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
