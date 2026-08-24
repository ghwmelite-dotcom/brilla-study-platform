import { describe, expect, it } from 'vitest'
import { CORE_SUBJECTS, DAILY_QUESTION_LIMIT, getCoreSubjects, isCoreSubject } from './usage-limits'

describe('usage-limits', () => {
  it('exposes the daily question limit', () => {
    expect(DAILY_QUESTION_LIMIT).toBe(10)
  })

  it('identifies core subjects per exam type', () => {
    expect(isCoreSubject('bece', 'mathematics')).toBe(true)
    expect(isCoreSubject('bece', 'physics')).toBe(false)
    expect(isCoreSubject('wassce', 'core-mathematics')).toBe(true)
  })

  it('fails closed for unknown exam types', () => {
    expect(isCoreSubject('unknown-exam', 'anything')).toBe(false)
    expect(getCoreSubjects('unknown-exam')).toEqual([])
  })

  it('lists NSMQ core subjects', () => {
    expect(CORE_SUBJECTS.nsmq).toEqual(['mathematics', 'physics', 'chemistry', 'biology'])
  })
})
