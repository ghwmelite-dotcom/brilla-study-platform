/* Vision spike probe (whiteboard Phase C, task 1) — IDEMPOTENT, read-only.
   Logs in as admintest via the real UI (Turnstile), renders two synthetic
   "student worked solution" fixtures client-side on a canvas 2D context
   (no fabric), then drives POST /api/admin/vision-spike:

   Phase 1 — INPUT SHAPE DISCOVERY: tries the candidate image-input shapes in
     priority order (message-image-array → message-image-base64 → content-parts)
     per model until one returns ok:true. The first working shape is recorded
     as that model's contract.

   Phase 2 — TRANSCRIPTION QUALITY: with the winning shape, asks each model to
     transcribe the work line-by-line and identify the wrong line, on both
     fixtures (clean + rotated/low-contrast). Accuracy is scored by checking
     whether the output contains the key line contents and flags line 3.

   Phase 3 — GUIDED_JSON CONFORMANCE: one call per model with guided_json set
     to the annotation schema; checks the output parses and conforms.

   Fixtures (both 1024x768, 'Comic Sans MS' cursive, slight per-line rotation):
     line 1: "x + 2 = 5"   line 2: "x = 5 - 2"   line 3: "x = 4" (WRONG: x = 3)
     plus a stray squiggle. Fixture B adds global rotation + low contrast.

   Raw results are written to
   .superpowers/sdd/2026-08-13-whiteboard-phase-c-two-way/vision-spike-raw.json
   and a PASS/FAIL summary is printed. Exits non-zero if no model can read the
   clean fixture (that outcome means the feature is BLOCKED).
*/
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const API = 'https://brilla-api.ghwmelite.workers.dev/api';
const MODELS = [
  '@cf/meta/llama-4-scout-17b-16e-instruct',
  '@cf/meta/llama-3.2-11b-vision-instruct',
];
const SHAPES = [
  'message-image-array',
  'message-image-base64',
  'content-parts',
  'content-parts-base64',
  'toplevel-array',
  'openai-image-url',
];
const RAW_OUT = path.join(__dirname, '..', '.superpowers', 'sdd', '2026-08-13-whiteboard-phase-c-two-way', 'vision-spike-raw.json');

const TRANSCRIBE_PROMPT = [
  'You are looking at a photo of a student\'s handwritten math work solving an equation.',
  'Transcribe each line of work exactly as written, numbered.',
  'Then state which line number contains an algebraic mistake and explain the correct step.',
].join(' ');

const ANNOTATION_SCHEMA = {
  type: 'object',
  properties: {
    transcription: { type: 'array', items: { type: 'string' } },
    wrongLine: { type: 'integer' },
    explanation: { type: 'string' },
  },
  required: ['transcription', 'wrongLine', 'explanation'],
};

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
  try {
    await page.waitForFunction(
      () => (document.querySelector('input[name="cf-turnstile-response"]')?.value || '').length > 10,
      { timeout: 45000 }
    );
  } catch (e) {
    await page.screenshot({ path: 'scripts/spike-vision-login-fail.png' });
    throw new Error(`turnstile token wait failed: ${e.message}`);
  }
  await page.evaluate(() => {
    const form = document.querySelector('input[type="email"]')?.closest('form');
    form?.requestSubmit ? form.requestSubmit() : form?.querySelector('button[type="submit"]')?.click();
  });
  try {
    await page.waitForFunction(() => !!localStorage.getItem('brilla_token'), { timeout: 45000 });
  } catch (e) {
    await page.screenshot({ path: 'scripts/spike-vision-login-fail.png' });
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 400));
    throw new Error(`token wait failed: ${e.message} | page says: ${bodyText.replace(/\n/g, ' | ')}`);
  }
  const token = await page.evaluate(() => localStorage.getItem('brilla_token'));
  return { ctx, page, token };
}

// Draw the fixtures in the browser page; returns base64 PNG payloads (prefix stripped).
async function buildFixtures(page) {
  return page.evaluate(() => {
    const draw = (degraded) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 768;
      const g = canvas.getContext('2d');
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, 1024, 768);
      if (degraded) {
        g.translate(512, 384);
        g.rotate((8 * Math.PI) / 180);
        g.translate(-512, -384);
        g.fillStyle = '#8a8a8a'; // low contrast
      } else {
        g.fillStyle = '#1a1a2e';
      }
      g.font = '52px "Comic Sans MS", cursive';
      const lines = [
        { text: 'x + 2 = 5', x: 120, y: 220, rot: -2 },
        { text: 'x = 5 - 2', x: 160, y: 380, rot: 1.5 },
        { text: 'x = 4', x: 200, y: 540, rot: -1 },
      ];
      for (const l of lines) {
        g.save();
        g.translate(l.x, l.y);
        g.rotate((l.rot * Math.PI) / 180);
        g.fillText(l.text, 0, 0);
        g.restore();
      }
      // stray squiggle (eraser mark / doodle)
      g.strokeStyle = degraded ? '#9a9a9a' : '#33334d';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(700, 150);
      g.bezierCurveTo(760, 120, 800, 220, 860, 180);
      g.bezierCurveTo(900, 150, 880, 260, 940, 240);
      g.stroke();
      return canvas.toDataURL('image/png').replace(/^data:[^,]+,/, '');
    };
    return { clean: draw(false), degraded: draw(true) };
  });
}

async function spike(token, body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 150000);
  try {
    const res = await fetch(`${API}/admin/vision-spike`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

function scoreTranscription(output) {
  const t = (output || '').toLowerCase();
  // Normalize math formatting ($-wraps, spacing) — content, not style, is scored.
  const m = t.replace(/[$\s]/g, '');
  const hasL1 = m.includes('x+2=5');
  const hasL2 = m.includes('x=5-2');
  const hasL3 = m.includes('x=4');
  // "line 3" / "lines 2 and 3" / "third line" + a wrongness word nearby
  const flagsWrongLine3 =
    /\blines?\b[^.\n]{0,25}\b3\b|third\s*line/.test(t) && /wrong|incorrect|mistake|error|should be/.test(t);
  const mentionsXeq3 = m.includes('x=3');
  return { hasL1, hasL2, hasL3, flagsWrongLine3, mentionsXeq3 };
}

(async () => {
  const failures = [];
  const check = (name, ok, detail) => {
    console.log(`${name}  -> ${ok ? 'PASS' : 'FAIL'}${detail ? ` (${detail})` : ''}`);
    if (!ok) failures.push(name);
  };
  const results = { ranAt: new Date().toISOString(), shapeDiscovery: {}, transcription: {}, guidedJson: {} };

  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
    defaultViewport: { width: 1366, height: 900 },
  });

  const { ctx, page, token } = await uiLogin(browser, 'admintest@brillaprep.org', 'Admin123!');
  console.log('logged in as admintest');
  const fixtures = await buildFixtures(page);
  console.log(`fixtures built: clean=${fixtures.clean.length}b64 degraded=${fixtures.degraded.length}b64\n`);
  await ctx.close();
  await browser.close();

  const winners = {};

  // ---- Phase 1: input shape discovery -------------------------------------
  // ok:true only proves the request didn't throw — a shape "works" only when
  // the model demonstrably SAW the image. Discovery prompt forces reading.
  const BLIND = /don'?t see|do not see|no image|cannot see|can'?t see|please (provide|share|upload|describe)|unable to (see|view)|didn'?t (see|receive)|not (see|receive)d? an image|without (an|the) image/i;
  const sawImage = (out) => {
    const t = String(out || '');
    return /x\s*\+\s*2\s*=\s*5/.test(t) || (t.includes('=') && /x/i.test(t) && !BLIND.test(t));
  };
  const DISCOVERY_PROMPT = 'What text is written in this image? Reply with the exact text only, nothing else.';
  for (const model of MODELS) {
    results.shapeDiscovery[model] = [];
    for (const shape of SHAPES) {
      const { status, json } = await spike(token, {
        model, inputShape: shape, imageBase64: fixtures.clean,
        prompt: DISCOVERY_PROMPT,
      });
      const d = json?.data || {};
      const saw = d.ok === true && sawImage(d.output);
      const entry = { shape, status, ok: d.ok === true, sawImage: saw, latencyMs: d.latencyMs, rawShape: d.rawShape, error: d.error || null, outputHead: String(d.output || '').slice(0, 150) };
      results.shapeDiscovery[model].push(entry);
      console.log(`[shape] ${model}  ${shape}  ok=${entry.ok} sawImage=${saw} ${d.latencyMs ?? '-'}ms rawShape=${d.rawShape ?? '-'}${d.error ? ` err=${String(d.error).slice(0, 100)}` : ''}`);
      console.log(`    out: ${String(d.output || d.error || '').slice(0, 120).replace(/\n/g, ' | ')}`);
      if (!winners[model] && status === 200 && saw) winners[model] = shape;
    }
    check(`shape discovery: ${model} has a working input shape`, !!winners[model], winners[model] || 'none delivered the image');
  }
  console.log('');

  // ---- Phase 2: transcription quality --------------------------------------
  for (const model of MODELS) {
    const shape = winners[model];
    if (!shape) { console.log(`[skip] ${model}: no working shape, skipping transcription\n`); continue; }
    results.transcription[model] = {};
    for (const [fname, imageBase64] of Object.entries(fixtures)) {
      const { status, json } = await spike(token, { model, inputShape: shape, imageBase64, prompt: TRANSCRIBE_PROMPT });
      const d = json?.data || {};
      const score = scoreTranscription(d.output);
      results.transcription[model][fname] = { status, ok: d.ok === true, latencyMs: d.latencyMs, rawShape: d.rawShape, error: d.error || null, output: d.output || '', score };
      console.log(`[transcribe] ${model}  ${fname}  ok=${d.ok} ${d.latencyMs}ms`);
      console.log(`  score: L1=${score.hasL1} L2=${score.hasL2} L3=${score.hasL3} flagsLine3=${score.flagsWrongLine3} mentions x=3: ${score.mentionsXeq3}`);
      console.log(`  output head: ${String(d.output || d.error || '').slice(0, 200).replace(/\n/g, ' | ')}`);
    }
    const clean = results.transcription[model].clean;
    check(
      `transcription: ${model} reads clean fixture and flags line 3`,
      clean.ok && clean.score.hasL1 && clean.score.hasL3 && clean.score.flagsWrongLine3,
      clean.ok ? `L1=${clean.score.hasL1} L2=${clean.score.hasL2} L3=${clean.score.hasL3} flags3=${clean.score.flagsWrongLine3}` : clean.error,
    );
    console.log('');
  }

  // ---- Phase 3: guided_json conformance ------------------------------------
  for (const model of MODELS) {
    const shape = winners[model];
    if (!shape) continue;
    const { status, json } = await spike(token, {
      model, inputShape: shape, imageBase64: fixtures.clean,
      prompt: 'Transcribe the handwritten work and identify the wrong line. Respond as JSON matching the schema.',
      guidedJson: ANNOTATION_SCHEMA,
    });
    const d = json?.data || {};
    let conforms = false;
    let parsed = null;
    try {
      parsed = JSON.parse(d.output || '');
      conforms = Array.isArray(parsed.transcription)
        && typeof parsed.wrongLine === 'number'
        && typeof parsed.explanation === 'string';
    } catch { /* not JSON */ }
    results.guidedJson[model] = { status, ok: d.ok === true, latencyMs: d.latencyMs, rawShape: d.rawShape, error: d.error || null, output: d.output || '', conforms, parsed };
    check(`guided_json: ${model} output conforms to annotation schema`, d.ok === true && conforms, `ok=${d.ok} conforms=${conforms}`);
    console.log(`  guided_json output head: ${String(d.output || d.error || '').slice(0, 200).replace(/\n/g, ' | ')}\n`);
  }

  fs.mkdirSync(path.dirname(RAW_OUT), { recursive: true });
  fs.writeFileSync(RAW_OUT, JSON.stringify(results, null, 2));
  console.log(`raw results written to ${path.relative(process.cwd(), RAW_OUT)}`);
  console.log(`\n=== ${failures.length === 0 ? 'ALL PASS' : `FAILURES: ${failures.join('; ')}`} ===`);
  process.exit(failures.length === 0 ? 0 : 1);
})().catch((e) => { console.error('driver error:', e.message); process.exit(1); });
