import { useEffect } from 'react';
import { useGuideStore } from '@/stores/guideStore';
import { useAuthStore } from '@/stores/authStore';

/**
 * This component automatically triggers the onboarding modal
 * for authenticated users who haven't completed onboarding yet.
 * It should be placed in the app root, after authentication is available.
 */
export function OnboardingTrigger() {
  const { isAuthenticated } = useAuthStore();
  const { hasCompletedOnboarding, showOnboarding, startOnboarding } = useGuideStore();

  useEffect(() => {
    // Only trigger if:
    // 1. User is authenticated
    // 2. User hasn't completed onboarding
    // 3. Onboarding isn't already showing
    if (isAuthenticated && !hasCompletedOnboarding && !showOnboarding) {
      // Small delay to let the dashboard render first
      const timer = setTimeout(() => {
        startOnboarding();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, hasCompletedOnboarding, showOnboarding, startOnboarding]);

  return null;
}
