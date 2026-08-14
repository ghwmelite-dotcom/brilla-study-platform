/* Probe: live verification of whiteboard monetization gating (Phase A).

   As johndoe (free tier):
     1. GET /subscriptions/features        -> whiteboard === false, dailyAiLimit === 10
     2. POST /revision-classroom/sessions  -> 200, capture first lesson id
     3. POST /lessons/:id/whiteboard-teach -> 403 with upgradeRequired: true
     4. POST /lessons/:id/teach (hook)     -> 200, remainingFreeToday present and >= 0

   Tier visibility (Task 9 /plans change):
     5. GET /subscriptions/plans (admin Bearer) -> includes teacher tiers
     6. GET /subscriptions/plans (anonymous)    -> student-visible tiers only

   As admintest (admin):
     7. POST /admin/users/:id/set-tier (tier_student_monthly) -> 200, creditsAdded 50
     8. johndoe GET /subscriptions/features    -> whiteboard === true
     9. johndoe POST whiteboard-teach          -> 200, real content + fallback boolean
    10. GET /admin/users/:id/subscription      -> 200, subscription.planName present
        (checked while premium: tier_free rows return subscription: null by design)
    11. Restore: set-tier tier_free            -> 200 (always attempted)
    12. johndoe GET /subscriptions/features    -> whiteboard === false again
    13. GET /admin/users/:id/subscription      -> 200 (not 500), subscription null on free

   Prints one line per step with expected vs actual; exits non-zero on any mismatch.
*/
const puppeteer = require('puppeteer-core');

const API = 'https://brilla-api.ghwmelite.workers.dev/api';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const ACCOUNTS = {
  johndoe: {
    email: requiredEnv('BRILLA_E2E_STUDENT_EMAIL'),
    password: requiredEnv('BRILLA_E2E_STUDENT_PASSWORD'),
  },
  admin: {
    email: requiredEnv('BRILLA_E2E_ADMIN_EMAIL'),
    password: requiredEnv('BRILLA_E2E_ADMIN_PASSWORD'),
  },
};

let failures = 0;

function report(name, expected, actual, ok) {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  | expected: ${expected}  | actual: ${actual}`);
}

async function login(email, password) {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
    defaultViewport: { width: 1366, height: 900 },
  });
  try {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    let userId = null;
    page.on('response', async (res) => {
      if (res.url().includes('/auth/login')) {
        try {
          const json = await res.json();
          userId = json?.data?.user?.id || null;
        } catch { /* ignore */ }
      }
    });
    await page.evaluateOnNewDocument(() => {
      sessionStorage.setItem('brilla_promo_dismissed', 'true');
      sessionStorage.setItem('brilla_splash_shown', 'true');
    });
    await page.goto('https://brillaprep.org/?login=true', { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.type('input[type="email"]', email, { delay: 5 });
    await page.type('input[placeholder="Enter your password"]', password, { delay: 5 });
    await page.waitForFunction(
      () => (document.querySelector('input[name="cf-turnstile-response"]')?.value || '').length > 10,
      { timeout: 45000 }
    );
    await page.evaluate(() => {
      const form = document.querySelector('input[type="email"]')?.closest('form');
      form?.requestSubmit ? form.requestSubmit() : form?.querySelector('button[type="submit"]')?.click();
    });
    await page.waitForFunction(() => !!localStorage.getItem('brilla_token'), { timeout: 60000 });
    const token = await page.evaluate(() => localStorage.getItem('brilla_token'));
    // Fallback: read userId from the JWT payload if the response listener missed it
    if (!userId && token) {
      try {
        userId = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).userId;
      } catch { /* ignore */ }
    }
    return { token, userId };
  } finally {
    await browser.close();
  }
}

async function api(method, path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

(async () => {
  console.log('logging in as johndoe (free)...');
  const johndoe = await login(ACCOUNTS.johndoe.email, ACCOUNTS.johndoe.password);
  console.log('logging in as admin...');
  const admin = await login(ACCOUNTS.admin.email, ACCOUNTS.admin.password);
  console.log(`johndoe id: ${johndoe.userId}\n`);

  const authed = (method, path, body) => api(method, path, johndoe.token, body);
  const asAdmin = (method, path, body) => api(method, path, admin.token, body);

  // 1. Free-tier features
  {
    const { status, json } = await authed('GET', '/subscriptions/features');
    const f = json?.data?.features || {};
    report('1. free features', '200 whiteboard=false dailyAiLimit=10',
      `${status} whiteboard=${f.whiteboard} dailyAiLimit=${f.dailyAiLimit}`,
      status === 200 && f.whiteboard === false && f.dailyAiLimit === 10);
  }

  // 2. Create revision session, take first lesson id
  let lessonId = null;
  let sessionId = null;
  {
    const { status, json } = await authed('POST', '/revision-classroom/sessions',
      { examType: 'wassce', subjectId: 'subj_nsmq_math' });
    lessonId = json?.data?.lessons?.[0]?.id || null;
    sessionId = json?.data?.session?.id || null;
    report('2. create session (nsmq math)', '200 with lessons',
      `${status} lessonId=${lessonId || 'none'}`,
      status === 200 && !!lessonId);
  }

  // D1 read replicas can briefly serve stale reads after the session write;
  // poll the lesson route until it sees the row before the gated checks.
  if (lessonId) {
    let ready = false;
    for (let i = 0; i < 10 && !ready; i++) {
      const { status } = await authed('GET', `/revision-classroom/lessons/${lessonId}`);
      ready = status === 200;
      if (!ready) await new Promise((r) => setTimeout(r, 2000));
    }
    report('2b. lesson readable after create', '200 within ~20s',
      ready ? '200' : 'still 404 after polling', ready);
  }

  if (lessonId) {
    // 3. Whiteboard gated for free users
    {
      const { status, json } = await authed('POST', `/revision-classroom/lessons/${lessonId}/whiteboard-teach`,
        { lessonType: 'step-by-step' });
      report('3. whiteboard-teach as free', '403 upgradeRequired=true',
        `${status} upgradeRequired=${json?.upgradeRequired}`,
        status === 403 && json?.upgradeRequired === true);
    }

    // 4. Metered free chat still works
    {
      const { status, json } = await authed('POST', `/revision-classroom/lessons/${lessonId}/teach`, { phase: 'hook' });
      const rem = json?.data?.remainingFreeToday;
      report('4. teach hook as free', '200 remainingFreeToday>=0',
        `${status} remainingFreeToday=${rem}`,
        status === 200 && typeof rem === 'number' && rem >= 0);
    }
  } else {
    report('3. whiteboard-teach as free', '403', 'skipped (no lesson)', false);
    report('4. teach hook as free', '200', 'skipped (no lesson)', false);
  }

  // 5. Admin sees teacher tiers in /plans
  {
    const { status, json } = await asAdmin('GET', '/subscriptions/plans');
    const plans = Array.isArray(json?.data) ? json.data : (json?.data?.plans || json?.data?.tiers || []);
    const teacherTier = plans.find((p) => String(p.id).includes('teacher'));
    report('5. plans as admin', '200 with teacher tier',
      `${status} teacherTier=${teacherTier?.id || 'none'}`,
      status === 200 && !!teacherTier);
  }

  // 6. Anonymous sees student-visible tiers only
  {
    const { status, json } = await api('GET', '/subscriptions/plans', null);
    const plans = Array.isArray(json?.data) ? json.data : (json?.data?.plans || json?.data?.tiers || []);
    const teacherTier = plans.find((p) => String(p.id).includes('teacher'));
    report('6. plans anonymous', '200 without teacher tier',
      `${status} teacherTier=${teacherTier?.id || 'none'} planCount=${plans.length}`,
      status === 200 && !teacherTier && plans.length > 0);
  }

  // 7-13. Admin set-tier round trip (restore ALWAYS attempted)
  let upgraded = false;
  try {
    {
      const { status, json } = await asAdmin('POST', `/admin/users/${johndoe.userId}/set-tier`,
        { tierId: 'tier_student_monthly', durationDays: 1 });
      upgraded = status === 200;
      report('7. set-tier student_monthly', '200 creditsAdded=50',
        `${status} creditsAdded=${json?.data?.creditsAdded}`,
        status === 200 && json?.data?.creditsAdded === 50);
    }

    {
      const { status, json } = await authed('GET', '/subscriptions/features');
      const f = json?.data?.features || {};
      report('8. features after upgrade', '200 whiteboard=true',
        `${status} whiteboard=${f.whiteboard}`,
        status === 200 && f.whiteboard === true);
    }

    if (lessonId) {
      const { status, json } = await authed('POST', `/revision-classroom/lessons/${lessonId}/whiteboard-teach`,
        { lessonType: 'step-by-step' });
      const d = json?.data || {};
      report('9. whiteboard-teach as premium', '200 outline + step + fallback boolean',
        `${status} hasOutline=${Array.isArray(d.outline)} hasStep=${!!d.step} fallback=${d.fallback}`,
        status === 200 && Array.isArray(d.outline) && !!d.step && typeof d.fallback === 'boolean');
    } else {
      report('9. whiteboard-teach as premium', '200', 'skipped (no lesson)', false);
    }

    {
      const { status, json } = await asAdmin('GET', `/admin/users/${johndoe.userId}/subscription`);
      const planName = json?.data?.subscription?.planName;
      report('10. admin subscription view (premium)', '200 planName present',
        `${status} planName=${planName || 'none'}`,
        status === 200 && !!planName);
    }
  } finally {
    if (upgraded) {
      const { status, json } = await asAdmin('POST', `/admin/users/${johndoe.userId}/set-tier`,
        { tierId: 'tier_free', durationDays: 1 });
      report('11. restore tier_free', '200',
        `${status} tier=${json?.data?.tierId || 'none'}`,
        status === 200);
    } else {
      console.log('SKIP  11. restore tier_free  | upgrade never succeeded, nothing to restore');
    }
  }

  {
    const { status, json } = await authed('GET', '/subscriptions/features');
    const f = json?.data?.features || {};
    report('12. features after restore', '200 whiteboard=false',
      `${status} whiteboard=${f.whiteboard}`,
      status === 200 && f.whiteboard === false);
  }

  {
    const { status, json } = await asAdmin('GET', `/admin/users/${johndoe.userId}/subscription`);
    report('13. admin subscription view (free)', '200 (not 500), subscription=null',
      `${status} subscription=${JSON.stringify(json?.data?.subscription)}`,
      status === 200 && json?.data?.subscription === null);
  }

  // Cleanup: abandon the probe session so johndoe doesn't accumulate dangling actives
  if (sessionId) {
    await authed('PATCH', `/revision-classroom/sessions/${sessionId}`, { status: 'abandoned' });
  }

  console.log(failures === 0 ? '\nALL STEPS PASSED' : `\n${failures} STEP(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error('driver error:', e.message); process.exit(1); });
