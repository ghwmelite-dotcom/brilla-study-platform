// Guide System Types

export type ExamType = 'wassce' | 'bece' | 'nsmq' | 'all';

export interface FeatureGuide {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: GuideCategory;
  examTypes: ExamType[];
  steps?: GuideStep[];
  tips?: string[];
  videoUrl?: string;
  relatedFeatures?: string[];
}

export type GuideCategory =
  | 'getting-started'
  | 'practice'
  | 'exams'
  | 'social'
  | 'progress'
  | 'tools'
  | 'advanced'
  | 'library'
  | 'counselor';

export interface GuideStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'scroll' | 'type';
  highlightPadding?: number;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  image?: string;
  icon?: string;
  features?: string[];
  action?: {
    label: string;
    onClick?: () => void;
  };
}

export interface TourConfig {
  id: string;
  name: string;
  description: string;
  steps: TourStep[];
  triggerOnFirstVisit?: boolean;
  showProgress?: boolean;
}

export interface TourStep {
  id: string;
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  spotlightPadding?: number;
  disableInteraction?: boolean;
  beforeStep?: () => void | Promise<void>;
  afterStep?: () => void | Promise<void>;
}

export interface TooltipHint {
  id: string;
  target: string;
  content: string;
  trigger: 'hover' | 'focus' | 'click' | 'auto';
  showOnce?: boolean;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface UserGuideProgress {
  completedOnboarding: boolean;
  completedTours: string[];
  dismissedHints: string[];
  viewedGuides: string[];
  lastVisitedGuide?: string;
}
