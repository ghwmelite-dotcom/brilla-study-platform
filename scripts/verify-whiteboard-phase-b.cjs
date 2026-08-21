const { getQaCredentials } = require('./qa-credentials.cjs');

/* Probe: Phase B live verification — progressive whiteboard, content cache,
   TTS R2 cache, semantic answer cache. IDEMPOTENT, safe to re-run.

   What it asserts (exits non-zero on any FAIL):
     1. First whiteboard call (problem-solving on a WASSCE math topic) returns
        outline + step 0 with totalSteps >= 4, time-to-first-step < 5s, and no
        "Something went wrong" error payload.
     2. Every subsequent per-step fetch returns 200.
     3. At least one `math` OR `primitive` draw command appears across the
        lesson's steps (step JSON inspected). Model discretion: if a lesson
        yields none, the probe retries ONCE with a different math topic and
        records both attempts.
     4. Re-requesting the same lesson serves cached content (outline call
        cached:true, or every step re-fetch cached:true).
     5. POST /tts with a nonce text -> 200 audio/mpeg (X-TTS-Cache: miss),
        second identical call -> X-TTS-Cache: hit.
     6. Asking the same nonce question twice -> cached:true on the repeat
        (Vectorize is eventually consistent, so the repeat POLLS up to ~2 min,
        same pattern as scripts/probe-answer-cache.cjs).
     7. johndoe is restored to tier_free in a `finally`.

   Cleanup on exit (keeps runs probe-clean):
     - DELETE FROM ai_answer_cache WHERE question_text LIKE '%[probe %'
     - R2 delete of this run's tts/<sha256>.mp3 object (best effort)
     - whiteboard content rows are the PRODUCT's global per-topic cache and
       are intentionally left in place; assertions tolerate warm cache.

   Tier handling: johndoe -> tier_student_monthly (30 days), restored to
   tier_free with durationDays 1 (mandatory 1-3650 for any tier; the residual
   expiry on a tier_free row is inert — isPremiumUser ignores tier_free).
*/
const puppeteer = require('puppeteer-core');
const { execSync } = require('child_process');
const crypto = require('crypto');

const API = 'https://brilla-api.ghwmelite.workers.dev/api';
const NONCE = Date.now();
const TTS_MODEL = '@cf/deepgram/aura-2-en';
const TTS_SPEAKER = 'luna';
const TTS_TEXT = `In a right angled triangle, the square of the hypotenuse equals the sum of the squares of the other two sides. [probe ${NONCE}]`;
const ASK_QUESTION = `What is algebra? [probe ${NONCE}]`;

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const failures = [];
  const check = (name, ok, detail) => {
    console.log(`  ${name}  -> ${ok ? 'PASS' : 'FAIL'}${detail ? ` (${detail})` : ''}`);
    if (!ok) failures.push(name);
  };

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

  let sessionId = null;
  try {
    const up = await api(adminToken, 'POST', `/admin/users/${studentId}/set-tier`, { tierId: 'tier_student_monthly', durationDays: 30 });
    console.log(`set-tier premium: ${up.status} ${up.json.success ? 'ok' : JSON.stringify(up.json).slice(0, 120)}\n`);

    const sess = await api(studentToken, 'POST', '/revision-classroom/sessions', { examType: 'wassce', subjectId: 'subj_wassce_core_math' });
    sessionId = sess.json?.data?.session?.id;
    const lessons = sess.json?.data?.lessons || [];
    console.log(`session=${sessionId} lessons=${lessons.length}`);
    if (!sessionId || lessons.length === 0) throw new Error('session creation failed: ' + JSON.stringify(sess.json).slice(0, 200));

    // Prefer topics most likely to exercise math/primitive commands.
    const pickLesson = (re) => lessons.find((l) => re.test(l.title || '') && l.topic_id);
    const attemptLessons = [pickLesson(/algebra/i), pickLesson(/quadratic/i)].filter(Boolean);
    if (attemptLessons.length === 0) attemptLessons.push(lessons.find((l) => l.topic_id) || lessons[0]);
    console.log(`attempt topics: ${attemptLessons.map((l) => l.title).join(' | ')}\n`);

    // ---- Progressive whiteboard: outline + per-step fetches -------------
    console.log('--- progressive whiteboard (problem-solving) ---');
    let sawMathOrPrimitive = false;
    let successLesson = null;
    let successOutline = null;
    let successSteps = null;
    let firstOutlineMs = null;
    let firstCallHadFallback = false;

    for (let attempt = 0; attempt < Math.min(2, attemptLessons.length) && !sawMathOrPrimitive; attempt++) {
      const lesson = attemptLessons[attempt];
      console.log(`attempt ${attempt + 1}: lesson "${lesson.title}" (${lesson.id})`);

      const t0 = Date.now();
      const outline = await api(studentToken, 'POST', `/revision-classroom/lessons/${lesson.id}/whiteboard-teach`, { lessonType: 'problem-solving' });
      const ms = Date.now() - t0;
      if (attempt === 0) {
        firstOutlineMs = ms;
        firstCallHadFallback = outline.json?.data?.fallback === true;
      }
      const d = outline.json?.data || {};
      const outlineOk = outline.status === 200 && Array.isArray(d.outline) && typeof d.totalSteps === 'number' && d.step;
      console.log(`  outline call: ${outline.status} ${ms}ms totalSteps=${d.totalSteps} cached=${d.cached} fallback=${d.fallback}`);
      if (attempt === 0) {
        check('first call 200 + outline + step', !!outlineOk);
        check('totalSteps >= 4', (d.totalSteps || 0) >= 4, `totalSteps=${d.totalSteps}`);
        check('time-to-first-step < 5s', ms < 5000, `${ms}ms`);
        check('no "Something went wrong" payload', !JSON.stringify(outline.json).includes('Something went wrong'));
      }
      if (!outlineOk) { console.log('  outline unusable — skipping to next attempt'); continue; }

      const steps = [d.step];
      let allSteps200 = true;
      for (let i = 1; i < d.totalSteps; i++) {
        const r = await api(studentToken, 'POST', `/revision-classroom/lessons/${lesson.id}/whiteboard-teach`, {
          lessonType: 'problem-solving', stepIndex: i, outline: d.outline,
        });
        const sd = r.json?.data || {};
        console.log(`  step ${i}: ${r.status} cached=${sd.cached} fallback=${sd.fallback} cmds=${(sd.step?.commands || []).length}`);
        if (r.status !== 200 || !sd.step) allSteps200 = false;
        else steps[i] = sd.step;
      }
      if (attempt === 0) check('per-step fetches all 200', allSteps200);

      const cmdTypes = steps.flatMap((s) => (s?.commands || []).map((c) => c.type));
      const hits = cmdTypes.filter((t) => t === 'math' || t === 'primitive');
      console.log(`  command types across steps: ${[...new Set(cmdTypes)].join(', ') || '(none)'} — math/primitive hits: ${hits.length}`);
      if (hits.length > 0) {
        sawMathOrPrimitive = true;
        successLesson = lesson;
        successOutline = d.outline;
        successSteps = steps;
      } else {
        console.log('  no math/primitive commands (model discretion)' + (attempt === 0 ? ' — retrying with a different math topic' : ''));
      }
    }
    check('math OR primitive command present across a math lesson', sawMathOrPrimitive);

    // ---- Whiteboard content cache: second identical request -------------
    console.log('\n--- whiteboard content cache (second identical request) ---');
    if (successLesson && successOutline) {
      let secondCached = false;
      for (let i = 0; i < 3 && !secondCached; i++) {
        if (i > 0) await sleep(3000);
        const r = await api(studentToken, 'POST', `/revision-classroom/lessons/${successLesson.id}/whiteboard-teach`, { lessonType: 'problem-solving' });
        const rd = r.json?.data || {};
        console.log(`  outline re-request #${i + 2}: ${r.status} cached=${rd.cached} fallback=${rd.fallback}`);
        if (r.status === 200 && rd.cached === true) secondCached = true;
      }
      let allStepsCached = false;
      if (successSteps) {
        let cachedCount = 0;
        for (let i = 1; i < successOutline.length; i++) {
          const r = await api(studentToken, 'POST', `/revision-classroom/lessons/${successLesson.id}/whiteboard-teach`, {
            lessonType: 'problem-solving', stepIndex: i, outline: successOutline,
          });
          if (r.json?.data?.cached === true) cachedCount++;
        }
        allStepsCached = cachedCount === successOutline.length - 1;
        console.log(`  step re-fetches from cache: ${cachedCount}/${successOutline.length - 1}`);
      }
      check('second identical request serves cached', secondCached || allStepsCached,
        `outline cached=${secondCached}, all steps cached=${allStepsCached}${firstCallHadFallback ? ' (first call had fallback — cache write skipped by design)' : ''}`);
    } else {
      check('second identical request serves cached', false, 'no successful lesson to re-request');
    }

    // ---- TTS: miss -> hit ------------------------------------------------
    console.log('\n--- TTS R2 cache (miss -> hit) ---');
    const ttsCall = async () => {
      const res = await fetch(`${API}/revision-classroom/tts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: TTS_TEXT }),
      });
      const buf = await res.arrayBuffer();
      return { status: res.status, cache: res.headers.get('x-tts-cache'), type: res.headers.get('content-type'), bytes: buf.byteLength };
    };
    const t1 = await ttsCall();
    console.log(`  tts#1: ${t1.status} ${t1.type} cache=${t1.cache} bytes=${t1.bytes}`);
    check('tts#1 200 audio/mpeg', t1.status === 200 && (t1.type || '').includes('audio/mpeg') && t1.bytes > 0, `cache=${t1.cache}`);
    const t2 = await ttsCall();
    console.log(`  tts#2: ${t2.status} ${t2.type} cache=${t2.cache} bytes=${t2.bytes}`);
    check('tts#2 X-TTS-Cache: hit', t2.status === 200 && t2.cache === 'hit', `cache=${t2.cache}`);

    // ---- Semantic answer cache: ask twice --------------------------------
    console.log('\n--- semantic answer cache (ask twice) ---');
    const ask = async () => {
      const t = Date.now();
      const r = await api(studentToken, 'POST', `/revision-classroom/lessons/${successLesson?.id || attemptLessons[0].id}/ask`, { question: ASK_QUESTION });
      return { status: r.status, ms: Date.now() - t, cached: r.json?.data?.cached === true };
    };
    const a1 = await ask();
    console.log(`  ask#1: ${a1.status} cached=${a1.cached} ${a1.ms}ms`);
    let askHit = a1.status === 200 && a1.cached;
    if (askHit) console.log('  ask#1 already cached (served from an earlier store) — hit proven');
    for (let i = 1; i <= 12 && !askHit; i++) {
      await sleep(10000);
      const r = await ask();
      console.log(`  poll#${i}: ${r.status} cached=${r.cached} ${r.ms}ms`);
      if (r.status === 200 && r.cached) askHit = true;
    }
    check('ask twice -> cached:true on repeat', askHit);
  } finally {
    if (sessionId) await api(studentToken, 'PATCH', `/revision-classroom/sessions/${sessionId}`, { status: 'abandoned' });
    const down = await api(adminToken, 'POST', `/admin/users/${studentId}/set-tier`, { tierId: 'tier_free', durationDays: 1 });
    console.log(`\nrestore tier_free: ${down.status} ${down.json.success ? 'ok (residual expiry inert per isPremiumUser)' : JSON.stringify(down.json).slice(0, 120)}`);
    try {
      execSync(
        `npx wrangler d1 execute brilla-db --remote --command "DELETE FROM ai_answer_cache WHERE question_text LIKE '%[probe %'"`,
        { stdio: 'pipe' },
      );
      console.log('cleanup: probe-tagged ai_answer_cache rows deleted');
    } catch (e) {
      console.log(`cleanup FAILED (delete probe rows manually): ${e.message}`);
    }
    try {
      const hex = crypto.createHash('sha256').update(`${TTS_MODEL}|${TTS_SPEAKER}|${TTS_TEXT}`).digest('hex');
      execSync(`npx wrangler r2 object delete "brilla-recordings/tts/${hex}.mp3" --remote`, { stdio: 'pipe' });
      console.log('cleanup: probe TTS R2 object deleted');
    } catch (e) {
      console.log(`cleanup note: probe TTS R2 object not deleted (harmless orphan): ${e.message.split('\n')[0]}`);
    }
  }

  console.log(`\n=== ${failures.length === 0 ? 'ALL PASS' : `FAILURES: ${failures.join('; ')}`} ===`);
  process.exit(failures.length === 0 ? 0 : 1);
})().catch((e) => { console.error('driver error:', e.message); process.exit(1); });
