/**
 * Credentialed E2E per-role test against production (brillaprep.org).
 * Uses the system Chrome via puppeteer-core — no browser download needed.
 *
 *   node scripts/e2e-roles.cjs
 *
 * Flow per account: open landing → Sign In → fill credentials → wait for
 * Turnstile token → submit → wait for app → extract JWT → run API role
 * matrix (allowed endpoints must 2xx, foreign-role endpoints must 403).
 * Screenshots + console errors are captured under the OS temp dir.
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SITE = 'https://brillaprep.org';
const API = 'https://brilla-api.ghwmelite.workers.dev/api';
const OUT = path.join(os.tmpdir(), 'brilla-e2e');
fs.mkdirSync(OUT, { recursive: true });

const ACCOUNTS = [
  {
    role: 'student',
    email: 'johndoe@gmail.com',
    password: 'Student123!',
    allowed: ['/progress', '/subscriptions/status', '/quests/daily', '/race/current',
      '/engagement/status', '/notifications/telegram/status', '/streak/info'],
    forbidden: ['/admin/users', '/parents/students'],
    // Teacher endpoints are self-scoped (WHERE teacher_id = caller) — a student
    // gets 200 with EMPTY data, never other users' data. Assert the empty shape.
    selfScopedEmpty: ['/teacher/dashboard', '/classes'],
  },
  {
    role: 'teacher',
    email: 'janetdoe@gmail.com',
    password: 'Teacher123!',
    allowed: ['/teacher/dashboard', '/classes', '/assessments', '/tutoring/teacher/earnings',
      '/teacher-bonuses/my-status'],
    forbidden: ['/admin/users', '/parents/students', '/admin/dashboard/stats'],
    selfScopedEmpty: [],
  },
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function clickButtonByText(page, texts) {
  return page.evaluate((texts) => {
    const btns = [...document.querySelectorAll('button')];
    const b = btns.find(x => texts.some(t => x.textContent.trim().toLowerCase().includes(t)));
    if (b) { b.click(); return true; }
    return false;
  }, texts.map(t => t.toLowerCase()));
}

async function apiGet(path_, token) {
  const res = await fetch(`${API}${path_}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, ok: body && body.success !== false, data: body?.data };
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    // Headed: Cloudflare Turnstile withholds tokens from headless Chrome.
    headless: false,
    args: ['--window-size=1366,900', '--disable-blink-features=AutomationControlled'],
    defaultViewport: { width: 1366, height: 900 },
  });

  const results = [];
  let pass = 0, fail = 0;
  const record = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
    ok ? pass++ : fail++;
    console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  };

  for (const acct of ACCOUNTS) {
    console.log(`\n=== ${acct.role.toUpperCase()}: ${acct.email} ===`);
    // Fresh incognito context per account — the default context shares
    // localStorage across pages, leaking the previous account's session.
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    const consoleErrors = [];
    const failedRequests = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', e => consoleErrors.push(`pageerror: ${e.message}`));
    page.on('requestfailed', r => failedRequests.push(`${r.url().slice(0, 110)} (${r.failure()?.errorText})`));

    try {
      // Suppress the 8-second promo popup before any page script runs
      await page.evaluateOnNewDocument(() => {
        sessionStorage.setItem('brilla_promo_dismissed', 'true');
      });
      await page.goto(`${SITE}/?login=true`, { waitUntil: 'networkidle2', timeout: 60000 });
      // The ?login=true deep link auto-opens the auth modal in sign-in mode
      let opened = true;
      try {
        await page.waitForSelector('input[type="email"]', { timeout: 15000 });
      } catch {
        opened = false;
        const dbg = await page.evaluate(() => ({
          url: location.href,
          buttons: [...document.querySelectorAll('button')].map(b => b.textContent.trim()).slice(0, 15),
          hasLoader: !!document.getElementById('initial-loader'),
        }));
        console.log('    debug:', JSON.stringify(dbg).slice(0, 400));
        await page.screenshot({ path: path.join(OUT, `${acct.role}-landing-debug.png`) });
      }
      record('landing: auth modal open with email field', opened);

      await page.type('input[type="email"]', acct.email, { delay: 10 });
      await page.type('input[placeholder="Enter your password"]', acct.password, { delay: 10 });

      // Wait for Turnstile to issue a token (managed mode auto-passes)
      let tsOk = true;
      try {
        await page.waitForFunction(
          () => (document.querySelector('input[name="cf-turnstile-response"]')?.value || '').length > 10,
          { timeout: 45000 }
        );
      } catch { tsOk = false; }
      record('turnstile: token issued (headless)', tsOk);
      if (!tsOk) {
        await page.screenshot({ path: path.join(OUT, `${acct.role}-turnstile-stuck.png`) });
        results.push({ name: `${acct.role} aborted`, ok: false, detail: 'no turnstile token' });
        fail++;
        await page.close();
        continue;
      }

      // Capture EVERY login request (OPTIONS preflight + POST) with methods
      const loginTraffic = [];
      const onResp = async (r) => {
        if (!r.url().includes('/api/auth/login')) return;
        const body = r.request().method() === 'POST' ? (await r.text().catch(() => '')) : '';
        loginTraffic.push(`${r.request().method()} → HTTP ${r.status()} ${body.slice(0, 200)}`);
      };
      page.on('response', onResp);
      await page.evaluate(() => {
        const form = document.querySelector('input[type="email"]')?.closest('form');
        if (form?.requestSubmit) form.requestSubmit();
        else form?.querySelector('button[type="submit"]')?.click();
      });
      await sleep(8000);
      page.off('response', onResp);
      console.log(`    login traffic: ${loginTraffic.length ? loginTraffic.join(' | ') : 'NONE — no request fired'}`);

      // Wait for the modal to close / app route to load
      let loggedIn = true;
      try {
        await page.waitForFunction(
          () => !!localStorage.getItem('brilla_token'),
          { timeout: 30000 }
        );
      } catch { loggedIn = false; }
      record('login: JWT stored (UI login works)', loggedIn);
      if (!loggedIn) {
        await page.screenshot({ path: path.join(OUT, `${acct.role}-login-failed.png`) });
        await page.close();
        fail++;
        continue;
      }
      await sleep(4000); // let the dashboard render
      await page.screenshot({ path: path.join(OUT, `${acct.role}-dashboard.png`), fullPage: false });

      const token = await page.evaluate(() => localStorage.getItem('brilla_token'));

      // API role matrix
      for (const ep of acct.allowed) {
        const r = await apiGet(ep, token);
        record(`api ${acct.role} → ${ep}`, r.status < 400, `HTTP ${r.status}`);
      }
      for (const ep of acct.forbidden) {
        const r = await apiGet(ep, token);
        record(`api ${acct.role} ✗ ${ep} (must be 403)`, r.status === 403 || r.status === 401, `HTTP ${r.status}`);
      }
      for (const ep of acct.selfScopedEmpty) {
        const r = await apiGet(ep, token);
        const d = r.data;
        const empty = r.status === 200 && (
          (Array.isArray(d) && d.length === 0) ||
          (d && typeof d === 'object' && !Array.isArray(d) &&
            (d.totalAssessments === 0 || Object.keys(d).length === 0))
        );
        record(`api ${acct.role} → ${ep} (200 but self-scoped empty)`, empty, `HTTP ${r.status}`);
      }

      // Key UI content check on dashboard
      const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 4000));
      record('dashboard renders role content', bodyText.length > 200, `${bodyText.length} chars`);

      const realErrors = consoleErrors.filter(e =>
        !e.includes('fonts.googleapis') && !e.includes('cloudflareinsights') &&
        !e.includes('Content Security Policy') && !e.includes('preload') &&
        !e.includes('Failed to load resource') &&
        !e.includes('font-size:0;color:transparent')); // chart-lib NaN debug noise
      record('no unexpected console errors', realErrors.length === 0,
        realErrors.slice(0, 2).join(' | ').slice(0, 180));
      const realFailed = failedRequests.filter(u =>
        !u.includes('fonts.g') && !u.includes('cloudflareinsights') &&
        !u.includes('challenges.cloudflare.com')); // turnstile telemetry subdomain DNS blips
      record('no failed network requests', realFailed.length === 0,
        realFailed.slice(0, 2).join(' | ').slice(0, 200));
    } catch (err) {
      record(`${acct.role} journey`, false, err.message.slice(0, 150));
    }
    await context.close();
  }

  await browser.close();

  console.log(`\n=========================================`);
  console.log(`E2E RESULT: ${pass} passed, ${fail} failed`);
  console.log(`Screenshots: ${OUT}`);
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
