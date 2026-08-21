const { getQaCredentials } = require('./qa-credentials.cjs');

/* Probe: semantic answer cache (task 9) — IDEMPOTENT, safe to re-run.
   Every probe question embeds a per-run tag `[probe <nonce>]` and the probe
   DELETES all tagged cache rows on exit (via `wrangler d1 execute`, so it must
   be run from the repo root with wrangler authenticated). Each run therefore
   starts from a probe-clean cache:
     - "must miss" assertions can never self-invalidate on a stored copy from a
       previous run (note: the tag alone does NOT make a question semantically
       new — embeddings near-match identical question bodies across nonces —
       which is why cleanup, not just tagging, is required for idempotency).
     - orphaned Vectorize vectors whose D1 rows were deleted are harmless:
       lookupAnswer loads the D1 row per match id and skips missing rows.

   Scenarios per run:
     ask#1  tagged question under MATH lesson     -> assert 200 cached:false
     poll   same question under MATH lesson       -> assert cached:true within
            ~2 min (Vectorize upserts are eventually consistent; polling proves
            the store+index+hit path end-to-end). Hit latency is RECORDED, not
            asserted (cold-start noise makes a timing assert flaky).
     ask#2  variant wording of tagged question    -> recorded, not asserted
     ask#3  SAME text under PHYSICS lesson        -> assert cached:false
            (cross-topic rejection LIVE: the vector is proven indexed under the
            math topic by the poll, so only the mandatory topic_id post-filter
            can produce the miss)
     ask#4  second, different tagged question     -> assert 200 cached:false

   Tier handling: johndoe is upgraded to tier_student_monthly so generation is
   premium-quality, then restored with { tierId: 'tier_free', durationDays: 1 }.
   set-tier requires durationDays (1-3650) for ANY tier, so the restore leaves a
   +1-day subscription_expires_at on the row. That residue is INERT and needs no
   manual cleanup: isPremiumUser (workers/api/usage-limits.ts:82-89) only honors
   a subscription when subscription_tier_id !== 'tier_free', and checkAiAllowance
   (usage-limits.ts:210-216) gates purely on isPremiumUser — an expiry timestamp
   on a tier_free row is never read as premium.

   Exits non-zero if any assertion FAILs.
*/
const puppeteer = require('puppeteer-core');
const { execSync } = require('child_process');

const API = 'https://brilla-api.ghwmelite.workers.dev/api';
const NONCE = Date.now();
const Q_MAIN = `Why do metal objects feel colder than wooden objects at the same temperature? [probe ${NONCE}]`;
const Q_VARIANT = `Please explain why metals feel colder than wood at the same temperature [probe ${NONCE}]`;
const Q_FRESH = `What is the escape velocity of Earth? [probe ${NONCE}]`;

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
  return { status, ms, cached: d.cached === true, remaining: d.remainingFreeToday, answerHead: String(d.answer || json.error || '').slice(0, 50) };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const failures = [];
  const check = (name, ok, detail) => {
    console.log(`${name}  -> ${ok ? 'PASS' : 'FAIL'}${detail ? ` (${detail})` : ''}`);
    if (!ok) failures.push(name);
  };
  const log = (name, r) =>
    console.log(`${r.status}  ${name}  cached=${r.cached}  ${r.ms}ms  remaining=${r.remaining}  "${r.answerHead}"`);

  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
    defaultViewport: { width: 1366, height: 900 },
  });

  const studentToken = await uiLogin(browser, ...getQaCredentials('student'));
  const studentId = decodeUserId(studentToken);
  console.log(`logged in as johndoe (${studentId}), nonce=${NONCE}`);
  const adminToken = await uiLogin(browser, ...getQaCredentials('admin'));
  console.log('logged in as admintest\n');
  await browser.close();

  let mathSessionId, physicsSessionId;
  try {
    const up = await api(adminToken, 'POST', `/admin/users/${studentId}/set-tier`, { tierId: 'tier_student_monthly', durationDays: 1 });
    console.log(`set-tier premium: ${up.status} ${up.json.success ? 'ok' : JSON.stringify(up.json).slice(0, 120)}\n`);

    const mathSess = await api(studentToken, 'POST', '/revision-classroom/sessions', { examType: 'nsmq', subjectId: 'subj_nsmq_math' });
    mathSessionId = mathSess.json?.data?.session?.id;
    const mathLesson = mathSess.json?.data?.lessons?.[0]?.id;
    const physSess = await api(studentToken, 'POST', '/revision-classroom/sessions', { examType: 'nsmq', subjectId: 'subj_nsmq_physics' });
    physicsSessionId = physSess.json?.data?.session?.id;
    const physLesson = physSess.json?.data?.lessons?.[0]?.id;
    console.log(`sessions: math=${mathSessionId} lesson=${mathLesson} | physics=${physicsSessionId} lesson=${physLesson}\n`);
    if (!mathLesson || !physLesson) throw new Error('missing lesson in a session response');

    // ask#1: brand-new nonce question under math -> must miss
    const a1 = await ask(studentToken, mathLesson, Q_MAIN);
    log('ask#1 nonce question (math)', a1);
    check('ask#1 cached:false (genuinely new)', a1.status === 200 && !a1.cached);

    // poll: same question under math -> must hit once Vectorize has indexed it
    let hit = null;
    for (let i = 1; i <= 12 && !hit; i++) {
      await sleep(10000);
      const r = await ask(studentToken, mathLesson, Q_MAIN);
      log(`poll#${i} same question (math)`, r);
      if (r.status === 200 && r.cached) hit = r;
    }
    check('poll cached:true within ~2min (store+index+hit works)', !!hit);
    if (hit) {
      console.log(`cached hit latency: ${hit.ms}ms vs generation ${a1.ms}ms [recorded, not asserted — cold-start noise]`);
    }

    // ask#2: variant wording -> recorded only
    const a2 = await ask(studentToken, mathLesson, Q_VARIANT);
    log('ask#2 variant wording (math)', a2);
    console.log(`ask#2 variant cached -> ${a2.cached ? 'cached:true' : 'cached:false'} [recorded, not asserted]`);

    // ask#3: SAME text under physics -> must miss (cross-topic topic_id filter).
    // Strict because the poll proved this exact vector is indexed.
    const a3 = await ask(studentToken, physLesson, Q_MAIN);
    log('ask#3 same text (physics, cross-topic)', a3);
    check('ask#3 cached:false (cross-topic rejection, live)', a3.status === 200 && !a3.cached);

    // ask#4: second fresh nonce question under math -> must miss
    const a4 = await ask(studentToken, mathLesson, Q_FRESH);
    log('ask#4 fresh nonce question (math)', a4);
    check('ask#4 cached:false (genuinely new)', a4.status === 200 && !a4.cached);
  } finally {
    if (mathSessionId) await api(studentToken, 'PATCH', `/revision-classroom/sessions/${mathSessionId}`, { status: 'abandoned' });
    if (physicsSessionId) await api(studentToken, 'PATCH', `/revision-classroom/sessions/${physicsSessionId}`, { status: 'abandoned' });
    // durationDays is mandatory for any tier; the +1-day expiry left on a
    // tier_free row is inert — see header (isPremiumUser ignores tier_free).
    const down = await api(adminToken, 'POST', `/admin/users/${studentId}/set-tier`, { tierId: 'tier_free', durationDays: 1 });
    console.log(`\nrestore tier_free: ${down.status} ${down.json.success ? 'ok (residual expiry inert per isPremiumUser)' : JSON.stringify(down.json).slice(0, 120)}`);
    // Idempotency cleanup: remove this (and any earlier) run's probe rows so
    // the next run starts probe-clean. Orphaned vectors are harmless (the D1
    // row lookup in lookupAnswer skips them).
    try {
      execSync(
        `npx wrangler d1 execute brilla-db --remote --command "DELETE FROM ai_answer_cache WHERE question_text LIKE '%[probe %'"`,
        { stdio: 'pipe' },
      );
      console.log('cleanup: probe-tagged ai_answer_cache rows deleted');
    } catch (e) {
      console.log(`cleanup FAILED (delete probe rows manually): ${e.message}`);
    }
  }

  console.log(`\n=== ${failures.length === 0 ? 'ALL PASS' : `FAILURES: ${failures.join('; ')}`} ===`);
  process.exit(failures.length === 0 ? 0 : 1);
})().catch((e) => { console.error('driver error:', e.message); process.exit(1); });
