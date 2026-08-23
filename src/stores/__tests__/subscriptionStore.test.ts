// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { normalizeSubscriptionPlan } from '../subscriptionStore';

describe('normalizeSubscriptionPlan', () => {
  it('maps the Worker snake_case pricing contract into the frontend plan contract', () => {
    expect(normalizeSubscriptionPlan({
      id: 'tier_student_yearly',
      name: 'Student Yearly',
      description: 'Full access for students - yearly billing',
      price_monthly: null,
      price_yearly: 480,
      features: ['unlimited_questions'],
      ai_grading_quota: -1,
      is_active: 1,
      userType: 'student',
    })).toEqual({
      id: 'tier_student_yearly',
      name: 'Student Yearly',
      description: 'Full access for students - yearly billing',
      priceMonthly: null,
      priceYearly: 480,
      features: ['unlimited_questions'],
      aiGradingQuota: -1,
      isActive: true,
      userType: 'student',
    });
  });
});
