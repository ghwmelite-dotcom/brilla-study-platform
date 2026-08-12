// Pure validation helpers for auth routes. Kept dependency-free so they can
// be unit-tested without the Workers runtime.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: unknown): email is string {
  return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email);
}

export function validatePassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

export function validateName(name: unknown): name is string {
  return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 100;
}

/** Returns an error message, or null when the input is valid. */
export function validateRegistration(body: { email?: unknown; password?: unknown; name?: unknown }): string | null {
  if (!validateEmail(body.email)) return 'A valid email address is required.';
  if (!validatePassword(body.password)) return 'Password must be at least 8 characters long.';
  if (!validateName(body.name)) return 'Name must be between 2 and 100 characters.';
  return null;
}
