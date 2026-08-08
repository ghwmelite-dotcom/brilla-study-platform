import { describe, it, expect } from 'vitest';
import {
  getVerificationEmailHTML,
  getPasswordResetEmailHTML,
  getApprovalEmailHTML,
  getRejectionEmailHTML,
  getNewRegistrationEmailHTML,
  getSecurityAlertEmailHTML,
} from '../index';

// Regression tests for task 15: user/request-derived data interpolated into
// outbound email HTML must be HTML-escaped so a malicious name/email/reason/
// user-agent cannot inject markup into emails sent to users or admins.
const XSS = '<img src=x onerror=alert(1)>';
const XSS_ESCAPED = '&lt;img src=x onerror=alert(1)&gt;';

describe('email HTML escaping', () => {
  it('escapes userName in the new-registration admin email', () => {
    const html = getNewRegistrationEmailHTML(XSS, 'a@b.com', 'student', 'https://app.example');
    expect(html).toContain(XSS_ESCAPED);
    expect(html).not.toContain(XSS);
  });

  it('escapes userEmail and userRole in the new-registration admin email', () => {
    const html = getNewRegistrationEmailHTML('Ama', XSS, XSS, 'https://app.example');
    expect(html).not.toContain(XSS);
    expect(html).toContain(XSS_ESCAPED);
  });

  it('escapes name in the verification email', () => {
    const html = getVerificationEmailHTML(XSS, 'https://app.example/verify?token=abc');
    expect(html).toContain(`<strong>${XSS_ESCAPED}</strong>`);
    expect(html).not.toContain(XSS);
  });

  it('escapes name in the password-reset email', () => {
    const html = getPasswordResetEmailHTML(XSS, 'https://app.example/reset?token=abc');
    expect(html).toContain(XSS_ESCAPED);
    expect(html).not.toContain(XSS);
  });

  it('escapes userName in the approval email', () => {
    const html = getApprovalEmailHTML(XSS, 'https://app.example');
    expect(html).toContain(XSS_ESCAPED);
    expect(html).not.toContain(XSS);
  });

  it('escapes userName and reason in the rejection email', () => {
    const html = getRejectionEmailHTML(XSS, '<script>alert(1)</script>', 'https://app.example');
    expect(html).not.toContain(XSS);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('handles a null rejection reason', () => {
    const html = getRejectionEmailHTML('Ama', null, 'https://app.example');
    expect(html).toContain('Ama');
    expect(html).not.toContain('Reason:');
  });

  it('escapes targetEmail, ipAddress, and country in the security alert email', () => {
    const html = getSecurityAlertEmailHTML(
      {
        targetEmail: XSS,
        ipAddress: '<b>1.2.3.4</b>',
        attemptCount: 12,
        blockDuration: '30 minutes',
        country: '<i>GH</i>',
      },
      'https://app.example'
    );
    expect(html).not.toContain(XSS);
    expect(html).not.toContain('<b>1.2.3.4</b>');
    expect(html).not.toContain('<i>GH</i>');
    expect(html).toContain('&lt;b&gt;1.2.3.4&lt;/b&gt;');
    expect(html).toContain('&lt;i&gt;GH&lt;/i&gt;');
  });

  it('escapes quotes and ampersands', () => {
    const html = getNewRegistrationEmailHTML('a&"\'b', 'a@b.com', 'student', 'https://app.example');
    expect(html).toContain('a&amp;&quot;&#39;b');
  });

  it('does not escape constructed URLs or constant content', () => {
    const html = getApprovalEmailHTML('Ama', 'https://app.example');
    expect(html).toContain('href="https://app.example/login"');
  });
});
