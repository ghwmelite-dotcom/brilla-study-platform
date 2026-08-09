import { describe, it, expect } from 'vitest';
import { escapeHtml, formatInline } from './html';

describe('escapeHtml', () => {
  it('escapes all HTML-significant characters', () => {
    expect(escapeHtml(`<img src=x onerror=alert(1)>`)).toBe(
      '&lt;img src=x onerror=alert(1)&gt;'
    );
    expect(escapeHtml(`"><script>alert(1)</script>`)).toBe(
      '&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;'
    );
    expect(escapeHtml(`a & b's "c"`)).toBe('a &amp; b&#39;s &quot;c&quot;');
  });
});

describe('formatInline', () => {
  it('renders bold and code', () => {
    expect(formatInline('**bold** and `code`')).toBe(
      '<strong class="font-semibold">bold</strong> and <code class="bg-neutral-200/50 px-1.5 py-0.5 rounded text-sm font-mono">code</code>'
    );
  });

  it('renders an img/onerror payload completely inert', () => {
    const out = formatInline('<img src=x onerror=alert(document.cookie)>');
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;img src=x onerror=alert(document.cookie)&gt;');
  });

  it('renders a script payload inert even inside **bold**', () => {
    const out = formatInline('**<script>alert(1)</script>**');
    expect(out).not.toContain('<script>');
    expect(out).toBe(
      '<strong class="font-semibold">&lt;script&gt;alert(1)&lt;/script&gt;</strong>'
    );
  });

  it('does not let a crafted payload break out of the code span', () => {
    const out = formatInline('`</code><img src=x onerror=alert(1)>`');
    expect(out).not.toContain('<img');
    expect(out).not.toContain('</code><');
  });
});
