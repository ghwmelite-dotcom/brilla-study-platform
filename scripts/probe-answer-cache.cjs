/* Probe: semantic answer cache (task 9).
   NOTE: Vectorize upserts are eventually consistent — a freshly stored vector
   can take ~a minute to become queryable. On a cold index the SECOND ask may
   still miss; re-run the probe (or wait ~60s between rounds) and the identical
   question then returns cached:true. Rows from earlier runs persist, so ask#1
   may already be cached:true on re-runs.

   1. Login as johndoe (student) + admintest (admin) via the real UI (Turnstile).
   2. Admin upgrades johndoe to premium so generation is premium-quality.
   3. Start an nsmq/math revision session, then on its first lesson:
      - ask "What is photosynthesis?"          → expect 200, cached:false
      - ask the SAME question again            → expect 200, cached:true, faster
      - ask "Explain photosynthesis please"    → record outcome (not asserted)
      - ask an unrelated question              → expect 200, cached:false
   4. Restore johndoe to tier_free; abandon the session.
*/
const puppeteer = require('puppeteer-core');

const API = 'https://brilla-api.ghwmelite.workers.dev/api';

async function uiLogin(browser, email, password) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
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
  await page.waitForFunction(() => !!localStorage.getItem('brilla_token'), { timeout: 30000 });
  const token = await page.evaluate(() => localStorage.getItem('brilla_token'));
  await ctx.close();
  return token;
}

function decodeUserId(token) {
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
  return payload.userId || payload.sub;
}

async function api(token, method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function ask(token, lessonId, question) {
  const t0 = Date.now();
  const { status, json } = await api(token, 'POST', `/revision-classroom/lessons/${lessonId}/ask`, { question });
  const ms = Date.now() - t0;
  const d = json?.data || {};
  return { status, ms, cached: d.cached === true, remaining: d.remainingFreeToday, answerHead: String(d.answer || json.error || '').slice(0, 60) };
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
    defaultViewport: { width: 1366, height: 900 },
  });

  const studentToken = await uiLogin(browser, 'johndoe@gmail.com', 'Student123!');
  const studentId = decodeUserId(studentToken);
  console.log(`logged in as johndoe (${studentId})`);
  const adminToken = await uiLogin(browser, 'admintest@brillaprep.org', 'Admin123!');
  console.log('logged in as admintest\n');
  await browser.close();

  const results = [];
  const record = (name, r) => {
    results.push({ name, ...r });
    console.log(`${r.status}  ${name}  cached=${r.cached}  ${r.ms}ms  remaining=${r.remaining}  "${r.answerHead}"`);
  };

  try {
    // Upgrade johndoe so generation is premium-quality
    const up = await api(adminToken, 'POST', `/admin/users/${studentId}/set-tier`, { tierId: 'tier_student_monthly', durationDays: 1 });
    console.log(`set-tier premium: ${up.status} ${up.json.success ? 'ok' : JSON.stringify(up.json).slice(0, 120)}\n`);

    // Start nsmq math session
    const sess = await api(studentToken, 'POST', '/revision-classroom/sessions', { examType: 'nsmq', subjectId: 'subj_nsmq_math' });
    const sessionId = sess.json?.data?.session?.id;
    const lessonId = sess.json?.data?.lessons?.[0]?.id;
    console.log(`session: ${sess.status} session=${sessionId} lesson=${lessonId}\n`);
    if (!lessonId) throw new Error('no lesson in session response');

    const q1 = await ask(studentToken, lessonId, 'What is photosynthesis?');
    record('ask#1 "What is photosynthesis?"', q1);
    const q2 = await ask(studentToken, lessonId, 'What is photosynthesis?');
    record('ask#2 same question', q2);
    const q3 = await ask(studentToken, lessonId, 'Explain photosynthesis please');
    record('ask#3 variant wording', q3);
    const q4 = await ask(studentToken, lessonId, 'Who was the first President of Ghana?');
    record('ask#4 unrelated question', q4);

    console.log('\n--- assertions ---');
    console.log(`ask#1 cached:false        -> ${!q1.cached && q1.status === 200 ? 'PASS' : 'FAIL'}`);
    console.log(`ask#2 cached:true         -> ${q2.cached && q2.status === 200 ? 'PASS' : 'FAIL'}`);
    console.log(`ask#2 faster than ask#1   -> ${q2.ms < q1.ms ? 'PASS' : 'FAIL'} (${q2.ms}ms vs ${q1.ms}ms)`);
    console.log(`ask#3 variant cached      -> ${q3.cached ? 'cached:true (recorded)' : 'cached:false (recorded)'} [not asserted]`);
    console.log(`ask#4 cached:false        -> ${!q4.cached && q4.status === 200 ? 'PASS' : 'FAIL'}`);

    if (sessionId) {
      await api(studentToken, 'PATCH', `/revision-classroom/sessions/${sessionId}`, { status: 'abandoned' });
    }
  } finally {
    // set-tier requires durationDays even for tier_free; expiry is irrelevant on the free tier.
    const down = await api(adminToken, 'POST', `/admin/users/${studentId}/set-tier`, { tierId: 'tier_free', durationDays: 1 });
    console.log(`\nrestore tier_free: ${down.status} ${down.json.success ? 'ok' : JSON.stringify(down.json).slice(0, 120)}`);
  }
})().catch((e) => { console.error('driver error:', e.message); process.exit(1); });
