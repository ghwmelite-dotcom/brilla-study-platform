// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { communityStatsText, formatStatCount, heroStatsText, type PublicStats } from './publicStats';

// Landing stats copy: real rounded-down counts when /api/public/stats
// succeeds, static strings as fallback when it doesn't.

const realStats: PublicStats = {
  students: 4567,
  questions: 4812,
  subjectsWithQuestions: 44,
  chatRooms: 12,
  studyGroups: 87,
  pastPapers: 46,
};

describe('formatStatCount', () => {
  it('floors to the step and appends +', () => {
    expect(formatStatCount(4567, 100)).toBe('4,500+');
    expect(formatStatCount(87, 10)).toBe('80+');
    expect(formatStatCount(100, 100)).toBe('100+');
  });

  it('shows the exact number below the step (never "0+")', () => {
    expect(formatStatCount(7, 10)).toBe('7');
    expect(formatStatCount(0, 100)).toBe('0');
  });

  it('guards non-finite/negative input', () => {
    expect(formatStatCount(NaN, 100)).toBe('0');
    expect(formatStatCount(-5, 10)).toBe('0');
  });
});

describe('landing stats text', () => {
  it('uses rounded-down real counts when stats load', () => {
    expect(heroStatsText(realStats)).toEqual({ questions: '4,800+', subjects: '40+' });
    expect(communityStatsText(realStats)).toEqual({
      students: '4,500+',
      studyGroups: '80+',
      chatRooms: '10+',
    });
  });

  it('falls back to the static strings when the fetch fails', () => {
    expect(heroStatsText(null)).toEqual({ questions: '4,000+', subjects: '50+' });
    expect(communityStatsText(null)).toEqual({ students: '10K+', studyGroups: '500+', chatRooms: '50+' });
  });
});
