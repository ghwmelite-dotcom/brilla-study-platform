/* Probe: Phase C live verification — two-way whiteboard: check-work (ink +
   photo), point-and-ask, fused cold TTFS. IDEMPOTENT, safe to re-run.

   What it asserts (exits non-zero on any FAIL):
     1. FREE-TIER GATES (before any upgrade): POST check-work and POST
        ask-about as johndoe both return 403 with upgradeRequired:true
        (the premium gate runs before body validation, so a minimal body
        with a tiny image + valid x/y is enough).
     2. Admin upgrades johndoe to tier_student_monthly (30 days).
     3. Fixtures are generated in a browser page (no node deps): a 1200x800
        whiteboard PNG with handwritten-looking math (incl. a deliberate
        slip "x = 7") and a 1000x1400 ruled exercise-book JPEG. Both must be
        <= 700_000 base64 chars (the endpoint's hard limit).
     4. check-work (ink path): 200; data.verdict is one of
        correct/partial/incorrect/unknown OR data.fallback === true (recorded
        either way — an honest fallback is acceptable, a fabricated shape is
        not). Annotations (if any): <= 8, type in circle/arrow/text/rect, ids
        start with "annot-", numeric props finite and inside 0..1200/0..800.
        If the verdict is 'correct', an identical re-POST must return
        cached:true (conditional — skipped with a note otherwise).
     5. ask-about: 200; data.answer is a non-empty string; the optional
        annotation is a clamped circle with an "annot-" id. fallback:true is
        acceptable — recorded.
     6. Photo path: check-work with imageWidth/imageHeight 1000x1400 -> 200;
        any annotation coords must clamp to 0..1000/0..1400 (NOT 1200x800).
        imageWidth:50 -> 400.
     7. Cold TTFS: outline-mode whiteboard-teach calls across this session's
        lessons (then other subjects if needed, max ~5 attempts) until one
        returns cached:false; that first uncached call must take <= 6000ms.
        If every attempt is warm, recorded as PASS-with-note.
     8. johndoe is restored to tier_free in a `finally`.

   Cleanup on exit (keeps runs probe-clean):
     - all created revision sessions are abandoned;
     - DELETE FROM revision_ai_interactions WHERE interaction_type =
       'checkwork_correct' AND user_response IN (<sha256 hex of this run's
       fixtures>) — the endpoint keys its correct-verdict cache on that hash;
     - whiteboard content rows are the PRODUCT's global per-topic cache and
       are intentionally left in place (same as Phase B).

   Tier handling: johndoe -> tier_student_monthly (30 days), restored to
   tier_free with durationDays 1 (mandatory 1-3650 for any tier; the residual
   expiry on a tier_free row is inert — isPremiumUser ignores tier_free).
*/
const puppeteer = require('puppeteer-core');
const { execSync } = require('child_process');
const crypto = require('crypto');

const API = 'https://brilla-api.ghwmelite.workers.dev/api';
const NONCE = Date.now();

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
  // Surface server error detail immediately — a bare "500" is undiagnosable.
  if (res.status >= 400) {
    console.log(`  [api ${res.status}] ${method} ${path}: ${String(json.error || JSON.stringify(json)).slice(0, 200)}`);
  }
  return { status: res.status, json };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha256Hex = (s) => crypto.createHash('sha256').update(s).digest('hex');

// --- Fixture rendering (runs in a browser page; no node canvas dep) --------
async function renderFixtures(browser) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  const fixtures = await page.evaluate(() => {
    const HAND = '"Comic Sans MS", "Segoe Script", cursive';
    const jot = (ctx, lines, left, top0, dy, font) => {
      ctx.fillStyle = '#1e293b';
      ctx.font = font;
      lines.forEach((t, i) => {
        if (!t) return;
        ctx.save();
        ctx.translate(left, top0 + i * dy);
        ctx.rotate((Math.random() - 0.5) * 0.03);
        ctx.fillText(t, 0, 0);
        ctx.restore();
      });
    };

    // 1200x800 whiteboard snapshot (ink path): clean work plus a slip.
    const board = document.createElement('canvas');
    board.width = 1200;
    board.height = 800;
    const b = board.getContext('2d');
    b.fillStyle = '#ffffff';
    b.fillRect(0, 0, 1200, 800);
    jot(b, ['Solve for x:', '2x + 5 = 15', '2x = 15 - 5', '2x = 10', 'x = 5', '', 'Check: 2(5) + 5 = 15', '', 'x = 7'], 130, 110, 75, `44px ${HAND}`);
    const png = board.toDataURL('image/png').split(',')[1];

    // 1000x1400 exercise-book photo: off-white, ruled, red margin.
    const book = document.createElement('canvas');
    book.width = 1000;
    book.height = 1400;
    const k = book.getContext('2d');
    k.fillStyle = '#f8f5ec';
    k.fillRect(0, 0, 1000, 1400);
    k.strokeStyle = 'rgba(100, 149, 237, 0.35)';
    k.lineWidth = 1;
    for (let y = 60; y < 1400; y += 44) {
      k.beginPath(); k.moveTo(0, y); k.lineTo(1000, y); k.stroke();
    }
    k.strokeStyle = 'rgba(220, 38, 38, 0.45)';
    k.beginPath(); k.moveTo(90, 0); k.lineTo(90, 1400); k.stroke();
    jot(k, ['Solve: 3y - 7 = 11', '3y = 11 + 7', '3y = 18', 'y = 6', '', 'Check: 3(6) - 7 = 11', '', 'y = 9'], 135, 150, 70, `40px ${HAND}`);
    const jpeg = book.toDataURL('image/jpeg', 0.85).split(',')[1];

    return { png, jpeg };
  });
  await ctx.close();
  return fixtures;
}

// --- Annotation contract (mirrors the worker's validator + clamping) -------
const ANN_TYPES = new Set(['circle', 'arrow', 'text', 'rect']);
const X_BOUNDED = new Set(['left', 'x1', 'x2', 'cx', 'width', 'radius']);
const Y_BOUNDED = new Set(['top', 'y1', 'y2', 'cy', 'height']);

function annotationError(ann, maxW, maxH) {
  if (!ann || typeof ann !== 'object') return 'not an object';
  if (!ANN_TYPES.has(ann.type)) return `bad type ${ann.type}`;
  if (typeof ann.id !== 'string' || !ann.id.startsWith('annot-')) return `id "${ann.id}" missing annot- prefix`;
  if (!ann.props || typeof ann.props !== 'object' || Array.isArray(ann.props)) return 'props not an object';
  for (const [key, val] of Object.entries(ann.props)) {
    if (typeof val !== 'number') continue;
    if (!Number.isFinite(val)) return `prop ${key} not finite`;
    if (X_BOUNDED.has(key) && (val < 0 || val > maxW)) return `prop ${key}=${val} outside 0..${maxW}`;
    if (Y_BOUNDED.has(key) && (val < 0 || val > maxH)) return `prop ${key}=${val} outside 0..${maxH}`;
  }
  return null;
}

function annotationsError(annotations, maxW, maxH) {
  if (!Array.isArray(annotations)) return 'not an array';
  if (annotations.length > 8) return `${annotations.length} annotations (> 8)`;
  for (const ann of annotations) {
    const err = annotationError(ann, maxW, maxH);
    if (err) return err;
  }
  return null;
}

(async () => {
  const failures = [];
  const check = (name, ok, detail) => {
    console.log(`  ${name}  -> ${ok ? 'PASS' : 'FAIL'}${detail ? ` (${detail})` : ''}`);
    if (!ok) failures.push(name);
  };
  const VERDICTS = new Set(['correct', 'partial', 'incorrect', 'unknown']);

  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
    defaultViewport: { width: 1366, height: 900 },
  });

  const studentToken = await uiLogin(browser, 'johndoe@gmail.com', 'Student123!');
  const studentId = decodeUserId(studentToken);
  console.log(`logged in as johndoe (${studentId}), nonce=${NONCE}`);
  const adminToken = await uiLogin(browser, 'admintest@brillaprep.org', 'Admin123!');
  console.log('logged in as admintest');

  const fixtures = await renderFixtures(browser);
  await browser.close();
  console.log(`fixtures: whiteboard png=${fixtures.png.length} chars, photo jpeg=${fixtures.jpeg.length} chars`);
  check('fixtures within the 700_000 char endpoint limit',
    fixtures.png.length <= 700_000 && fixtures.jpeg.length <= 700_000,
    `png=${fixtures.png.length}, jpeg=${fixtures.jpeg.length}`);
  const fixtureHashes = [sha256Hex(fixtures.png), sha256Hex(fixtures.jpeg)];

  const sessionIds = [];
  try {
    // ---- 1. Free-tier gates (BEFORE upgrade) ------------------------------
    console.log('\n--- free-tier gates (check-work + ask-about as free) ---');
    const freeSess = await api(studentToken, 'POST', '/revision-classroom/sessions', { examType: 'wassce', subjectId: 'subj_wassce_core_math' });
    const sessionId = freeSess.json?.data?.session?.id;
    const lessons = freeSess.json?.data?.lessons || [];
    if (sessionId) sessionIds.push(sessionId);
    const lesson = lessons.find((l) => l.topic_id) || lessons[0];
    console.log(`session=${sessionId} lessons=${lessons.length} lesson="${lesson?.title}" (${lesson?.id})`);
    if (!sessionId || !lesson) throw new Error('session creation failed: ' + JSON.stringify(freeSess.json).slice(0, 200));

    // D1 read replicas can briefly serve stale reads after the session write.
    let lessonReady = false;
    for (let i = 0; i < 10 && !lessonReady; i++) {
      const { status } = await api(studentToken, 'GET', `/revision-classroom/lessons/${lesson.id}`);
      lessonReady = status === 200;
      if (!lessonReady) await sleep(2000);
    }
    check('lesson readable after create', lessonReady);

    const tinyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    {
      const { status, json } = await api(studentToken, 'POST', `/revision-classroom/lessons/${lesson.id}/check-work`,
        { imageBase64: tinyPng, stepIndex: 0 });
      check('check-work as free -> 403 upgradeRequired', status === 403 && json?.upgradeRequired === true,
        `${status} upgradeRequired=${json?.upgradeRequired}`);
    }
    {
      const { status, json } = await api(studentToken, 'POST', `/revision-classroom/lessons/${lesson.id}/ask-about`,
        { imageBase64: tinyPng, x: 100, y: 100 });
      check('ask-about as free -> 403 upgradeRequired', status === 403 && json?.upgradeRequired === true,
        `${status} upgradeRequired=${json?.upgradeRequired}`);
    }

    // ---- 2. Upgrade --------------------------------------------------------
    const up = await api(adminToken, 'POST', `/admin/users/${studentId}/set-tier`, { tierId: 'tier_student_monthly', durationDays: 30 });
    console.log(`\nset-tier premium: ${up.status} ${up.json.success ? 'ok' : JSON.stringify(up.json).slice(0, 120)}`);
    check('upgrade to tier_student_monthly', up.status === 200 && up.json.success === true);

    // ---- 3. check-work (ink path, 1200x800 fixture) ------------------------
    console.log('\n--- check-work (ink path) ---');
    const cw1 = await api(studentToken, 'POST', `/revision-classroom/lessons/${lesson.id}/check-work`,
      { imageBase64: fixtures.png, stepIndex: 0 });
    const cd = cw1.json?.data || {};
    console.log(`  check-work: ${cw1.status} verdict=${cd.verdict} fallback=${cd.fallback} cached=${cd.cached} annotations=${(cd.annotations || []).length}`);
    check('check-work 200', cw1.status === 200);
    check('check-work verdict valid OR honest fallback',
      VERDICTS.has(cd.verdict) || cd.fallback === true,
      `verdict=${cd.verdict} fallback=${cd.fallback}`);
    if (cd.fallback === true) {
      console.log('  note: honest fallback served (vision unavailable/unreadable) — acceptable');
      check('fallback verdict is unknown with empty annotations',
        cd.verdict === 'unknown' && Array.isArray(cd.annotations) && cd.annotations.length === 0,
        `verdict=${cd.verdict}`);
    } else {
      const annErr = annotationsError(cd.annotations, 1200, 800);
      check('check-work annotations valid + clamped to 1200x800', annErr === null, annErr || `${cd.annotations.length} annotations`);
    }
    if (cd.verdict === 'correct') {
      if (cd.cached === true) {
        console.log('  note: first POST already cached (earlier run) — cache proven');
        check('correct verdict served from cache', true);
      } else {
        const cw2 = await api(studentToken, 'POST', `/revision-classroom/lessons/${lesson.id}/check-work`,
          { imageBase64: fixtures.png, stepIndex: 0 });
        const cd2 = cw2.json?.data || {};
        check('identical correct work re-POST -> cached:true', cw2.status === 200 && cd2.cached === true,
          `${cw2.status} cached=${cd2.cached}`);
      }
    } else {
      console.log(`  note: verdict=${cd.verdict} — correct-verdict cache check skipped (only correct verdicts are cached)`);
    }

    // ---- 4. ask-about ------------------------------------------------------
    console.log('\n--- ask-about (point-and-ask) ---');
    const aa = await api(studentToken, 'POST', `/revision-classroom/lessons/${lesson.id}/ask-about`,
      { imageBase64: fixtures.png, x: 400, y: 300, question: `What does this step mean? [probe ${NONCE}]` });
    const ad = aa.json?.data || {};
    console.log(`  ask-about: ${aa.status} fallback=${ad.fallback} answer="${String(ad.answer || '').slice(0, 90)}"`);
    check('ask-about 200', aa.status === 200);
    check('ask-about answer is a non-empty string', typeof ad.answer === 'string' && ad.answer.trim().length > 0);
    if (ad.fallback === true) {
      console.log('  note: honest fallback served — acceptable');
      check('ask-about fallback carries the honest message and no annotation',
        String(ad.answer).includes("couldn't make out that spot") && ad.annotation === null);
    } else if (ad.annotation) {
      const annErr = annotationError(ad.annotation, 1200, 800);
      check('ask-about annotation is a clamped annot- circle',
        annErr === null && ad.annotation.type === 'circle', annErr || `type=${ad.annotation.type}`);
    } else {
      console.log('  note: no annotation returned (optional per contract)');
    }

    // ---- 5. photo path (1000x1400 exercise book) ---------------------------
    console.log('\n--- check-work (photo path, declared dims) ---');
    const pw = await api(studentToken, 'POST', `/revision-classroom/lessons/${lesson.id}/check-work`,
      { imageBase64: fixtures.jpeg, imageWidth: 1000, imageHeight: 1400, stepIndex: 0 });
    const pd = pw.json?.data || {};
    console.log(`  photo check-work: ${pw.status} verdict=${pd.verdict} fallback=${pd.fallback} annotations=${(pd.annotations || []).length}`);
    check('photo check-work 200', pw.status === 200);
    check('photo verdict valid OR honest fallback', VERDICTS.has(pd.verdict) || pd.fallback === true,
      `verdict=${pd.verdict} fallback=${pd.fallback}`);
    if (pd.fallback !== true) {
      const annErr = annotationsError(pd.annotations, 1000, 1400);
      check('photo annotations clamped to 1000x1400 (not 1200x800)', annErr === null, annErr || `${pd.annotations.length} annotations`);
    }
    {
      const { status } = await api(studentToken, 'POST', `/revision-classroom/lessons/${lesson.id}/check-work`,
        { imageBase64: fixtures.jpeg, imageWidth: 50 });
      check('imageWidth:50 -> 400', status === 400, `status=${status}`);
    }

    // ---- 6. Cold TTFS (fused outline+first step) ---------------------------
    console.log('\n--- cold TTFS (fused outline+step 0, <= 6000ms) ---');
    const candidateLessons = [lesson, ...lessons.filter((l) => l.topic_id && l.id !== lesson.id)];
    let coldMs = null;
    let attempts = 0;
    const tryOutline = async (lessonId) => {
      attempts++;
      const t0 = Date.now();
      const r = await api(studentToken, 'POST', `/revision-classroom/lessons/${lessonId}/whiteboard-teach`, { lessonType: 'concept-map' });
      const ms = Date.now() - t0;
      const d = r.json?.data || {};
      console.log(`  attempt ${attempts}: lesson ${lessonId} -> ${r.status} cached=${d.cached} fallback=${d.fallback} ${ms}ms`);
      if (r.status === 200 && d.cached === false) coldMs = ms;
    };
    for (const l of candidateLessons) {
      if (coldMs !== null || attempts >= 5) break;
      await tryOutline(l.id);
    }
    if (coldMs === null && attempts < 5) {
      // All warm in core math — try a different subject's session.
      const alt = await api(studentToken, 'POST', '/revision-classroom/sessions', { examType: 'nsmq', subjectId: 'subj_nsmq_math' });
      const altId = alt.json?.data?.session?.id;
      if (altId) sessionIds.push(altId);
      const altLessons = (alt.json?.data?.lessons || []).filter((l) => l.topic_id);
      console.log(`  core-math topics all warm; trying nsmq math session ${altId} (${altLessons.length} lessons)`);
      for (const l of altLessons) {
        if (coldMs !== null || attempts >= 5) break;
        await tryOutline(l.id);
      }
    }
    if (coldMs === null) {
      console.log('  note: all warm — cold TTFS not measurable this run (PASS-with-note)');
    } else {
      check('cold TTFS <= 6000ms (fused call)', coldMs <= 6000, `${coldMs}ms`);
    }
  } finally {
    for (const id of sessionIds) {
      await api(studentToken, 'PATCH', `/revision-classroom/sessions/${id}`, { status: 'abandoned' });
    }
    console.log(`\nabandoned ${sessionIds.length} session(s)`);
    const down = await api(adminToken, 'POST', `/admin/users/${studentId}/set-tier`, { tierId: 'tier_free', durationDays: 1 });
    console.log(`restore tier_free: ${down.status} ${down.json.success ? 'ok (residual expiry inert per isPremiumUser)' : JSON.stringify(down.json).slice(0, 120)}`);
    try {
      const sql = `DELETE FROM revision_ai_interactions WHERE interaction_type = 'checkwork_correct' AND user_response IN ('${fixtureHashes.join("','")}')`;
      execSync(`npx wrangler d1 execute brilla-db --remote --command "${sql}"`, { stdio: 'pipe' });
      console.log('cleanup: this run\'s checkwork_correct rows deleted (keyed by fixture hashes)');
    } catch (e) {
      console.log(`cleanup FAILED (delete probe rows manually): ${e.message}`);
    }
  }

  console.log(`\n=== ${failures.length === 0 ? 'ALL PASS' : `FAILURES: ${failures.join('; ')}`} ===`);
  process.exit(failures.length === 0 ? 0 : 1);
})().catch((e) => { console.error('driver error:', e.message); process.exit(1); });
