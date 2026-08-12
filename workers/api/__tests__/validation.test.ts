import { describe, it, expect } from 'vitest';
import { validateRegistration, validateEmail, validatePassword, validateName } from '../validation';

describe('validateEmail', () => {
  it('accepts valid emails and rejects invalid input', () => {
    expect(validateEmail('student@example.com')).toBe(true);
    expect(validateEmail('a@b.co')).toBe(true);
    expect(validateEmail('not-an-email')).toBe(false);
    expect(validateEmail('missing@tld')).toBe(false);
    expect(validateEmail('')).toBe(false);
    expect(validateEmail(undefined)).toBe(false);
    expect(validateEmail(42)).toBe(false);
    expect(validateEmail(`${'a'.repeat(250)}@b.co`)).toBe(false); // >254 chars
  });
});

describe('validatePassword', () => {
  it('enforces 8-128 character length', () => {
    expect(validatePassword('12345678')).toBe(true);
    expect(validatePassword('1234567')).toBe(false); // too short
    expect(validatePassword('')).toBe(false);
    expect(validatePassword(undefined)).toBe(false);
    expect(validatePassword('x'.repeat(129))).toBe(false); // too long
  });
});

describe('validateName', () => {
  it('enforces 2-100 trimmed character length', () => {
    expect(validateName('Kofi Mensah')).toBe(true);
    expect(validateName('Ab')).toBe(true);
    expect(validateName('A')).toBe(false); // too short
    expect(validateName('   ')).toBe(false); // whitespace-only
    expect(validateName('x'.repeat(101))).toBe(false); // too long
    expect(validateName(null)).toBe(false);
  });
});

describe('validateRegistration', () => {
  it('returns first error or null', () => {
    expect(validateRegistration({ email: 'a@b.co', password: '12345678', name: 'Ab' })).toBeNull();
    expect(validateRegistration({ email: 'bad', password: '12345678', name: 'Ab' })).toMatch(/email/i);
    expect(validateRegistration({ email: 'a@b.co', password: 'short', name: 'Ab' })).toMatch(/8 characters/i);
    expect(validateRegistration({ email: 'a@b.co', password: '12345678', name: '' })).toMatch(/Name/i);
  });
});
