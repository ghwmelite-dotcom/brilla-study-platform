import { describe, expect, it } from 'vitest'
import { formatNumber, formatTime } from './formatters'

describe('formatTime', () => {
  it('formats seconds as MM:SS', () => {
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(65)).toBe('01:05')
    expect(formatTime(600)).toBe('10:00')
  })
})

describe('formatNumber', () => {
  it('formats with K and M suffixes', () => {
    expect(formatNumber(999)).toBe('999')
    expect(formatNumber(1500)).toBe('1.5K')
    expect(formatNumber(2000000)).toBe('2.0M')
  })
})
