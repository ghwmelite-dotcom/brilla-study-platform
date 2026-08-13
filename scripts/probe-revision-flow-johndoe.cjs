/* Probe: login as johndoe, then exercise the revision session flow directly:
   1. POST /sessions with a bogus subjectId (deployment check: 400 = new worker, 500 = old)
   2. POST /sessions with subj_nsmq_math (valid) — status + timing
   3. PATCH first lesson in_progress — status + timing
   4. POST /lessons/:id/teach (the AI call) — status + timing
*/
const puppeteer = require('puppeteer-core');

const API = 'https://brilla-api.ghwmelite.workers.dev/api';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
    defaultViewport: { width: 1366, height: 900 },
  });
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('brilla_promo_dismissed', 'true');
    sessionStorage.setItem('brilla_splash_shown', 'true');
  });
  await page.goto('https://brillaprep.org/?login=true', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.type('input[type="email"]', 'johndoe@gmail.com', { delay: 5 });
  await page.type('input[placeholder="Enter your password"]', 'Student123!', { delay: 5 });
  await page.waitForFunction(
    () => (document.querySelector('input[name="cf-turnstile-response"]')?.value || '').length > 10,
    { timeout: 45000 }
  );
  await page.evaluate(() => {
    const form = document.querySelector('input[type="email"]')?.closest('form');
    form?.requestSubmit ? form.requestSubmit() : form?.querySelector('button[type="submit"]')?.click();
  });
  await page.waitForFunction(() => !!localStorage.getItem('brilla_token'), { timeout: 30000 });
  const token = await page.evaluate(() => localStorage.getItem('brilla_token'));
  await browser.close();
  console.log('logged in as johndoe');

  const call = async (label, method, path, body) => {
    const t0 = Date.now();
    try {
      const res = await fetch(API + path, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      console.log(`${label}: HTTP ${res.status} in ${Date.now() - t0}ms :: ${text.slice(0, 200)}`);
      return { status: res.status, text };
    } catch (e) {
      console.log(`${label}: FETCH ERROR after ${Date.now() - t0}ms :: ${e.message}`);
      return { status: 0, text: '' };
    }
  };

  // 1. deployment check
  await call('bogus-subject POST /sessions', 'POST', '/revision-classroom/sessions',
    { examType: 'nsmq', subjectId: 'subj_does_not_exist' });

  // 2. valid session
  const created = await call('valid POST /sessions (nsmq math)', 'POST', '/revision-classroom/sessions',
    { examType: 'nsmq', subjectId: 'subj_nsmq_math' });

  let lessonId = null, sessionId = null;
  try {
    const data = JSON.parse(created.text).data;
    sessionId = data.session.id;
    lessonId = data.lessons[0].id;
  } catch {}

  if (lessonId) {
    // 3. patch lesson
    await call(`PATCH lesson ${lessonId}`, 'PATCH', `/revision-classroom/lessons/${lessonId}`, { status: 'in_progress' });
    // 3b. patch session currentLessonId
    await call(`PATCH session ${sessionId}`, 'PATCH', `/revision-classroom/sessions/${sessionId}`, { currentLessonId: lessonId });
    // 4. AI teach (the suspected hang)
    await call(`POST teach (hook)`, 'POST', `/revision-classroom/lessons/${lessonId}/teach`, { phase: 'hook', previousMessages: [] });
  } else {
    console.log('no lesson created — skipping lesson probes');
  }
})().catch(e => { console.error('driver error:', e.message); process.exit(1); });
