/* Experiment: llama-4-scout vs llama-3.3-70b-fp8-fast on the FUSED
   whiteboard outline+first-step prompt (Phase C Task 6 cold-TTFS decision).

   Mechanism: logs in as admintest (Turnstile), then drives the admin-only
   POST /api/admin/ai-compare endpoint with ONE model per call (sequential —
   the endpoint's parallel mode would skew latency). 3 timed runs per model,
   alternating to balance time-of-day variance.

   Fidelity notes:
   - The full fused prompt (WHITEBOARD_TEACHING_PROMPT + context + concept-map
     instructions + fused output format) is sent as the USER message because
     ai-compare slices systemPrompt at 4000 chars (the real prompt is ~4.9K).
     Content is identical to the production call; only the role differs.
   - ai-compare caps max_tokens at 1024 (production uses 1600). With the
     tightened <=6-commands step-0 budget the output should fit; a truncation
     shows up as invalid JSON and is reported, not hidden.
   - The prompt is extracted from workers/api/revision-classroom.ts at runtime
     so it cannot drift from the production wording.

   Output per run: latencyMs, tokensUsed, JSON validity against the same rules
   as parseWhiteboardOutline + isValidWhiteboardStep, outline/commands counts.
*/
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const API = 'https://brilla-api.ghwmelite.workers.dev/api';
const MODELS = [
  '@cf/meta/llama-4-scout-17b-16e-instruct',
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
];
const ADMIN_TEST_EMAIL = process.env.BRILLA_ADMIN_TEST_EMAIL;
const ADMIN_TEST_PASSWORD = process.env.BRILLA_ADMIN_TEST_PASSWORD;
if (!ADMIN_TEST_EMAIL || !ADMIN_TEST_PASSWORD) {
  throw new Error('BRILLA_ADMIN_TEST_EMAIL and BRILLA_ADMIN_TEST_PASSWORD are required');
}
const RUNS_PER_MODEL = 3;
const TOPIC = 'Photosynthesis';
const SUBJECT = 'Integrated Science';
const EXAM = 'wassce';
const LESSON_TYPE = 'concept-map';

// --- Rebuild the exact production prompt from the worker source ------------
function buildFusedPrompt() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'workers', 'api', 'revision-classroom.ts'), 'utf8');
  const m = src.match(/const WHITEBOARD_TEACHING_PROMPT = `([\s\S]*?)`;\r?\n/);
  if (!m) throw new Error('WHITEBOARD_TEACHING_PROMPT not found in source');
  const teaching = m[1];

  // Static lesson-type instruction for concept-map (verbatim from source).
  const lessonInstructions = `Create a concept map/mind map for ${TOPIC}. Include:
- Central concept in the middle
- Related sub-concepts branching out
- Connecting lines with relationship labels
- Use different colors for different branches
- Keep it organized and readable`;

  return `${teaching}

Context:
- Subject: ${SUBJECT}
- Topic: ${TOPIC}
- Exam: ${EXAM.toUpperCase()}
- Lesson Type: ${LESSON_TYPE}

${lessonInstructions}

Output ONE JSON object only — the lesson outline AND its first step together — in this exact format:
{
  "outline": ["4-6 step titles"],
  "firstStep": {
    "stepNumber": 1,
    "explanation": "What the student should understand from this step",
    "voiceOver": "What to say while showing this step",
    "duration": 5,
    "commands": [ { "type": "text", "id": "title1", "props": { "left": 100, "top": 50, "text": "Title Text", "fontSize": 32, "fontWeight": "bold", "fill": "#1e40af" } } ],
    "highlights": [],
    "clearPrevious": false
  }
}
The first step ONLY opens the lesson for the first outline title — keep it light: at most 6 commands (a title plus a few elements). Later steps carry the detail. Canvas is 1200x800.`;
}

// --- Same rules as the worker's parseWhiteboardOutline + isValidWhiteboardStep
const COMMAND_TYPES = new Set(['rect', 'circle', 'line', 'arrow', 'text', 'path', 'polygon', 'primitive', 'math']);
function validateFused(output) {
  const text = String(output || '');
  const candidate = text.match(/\{[\s\S]*\}/)?.[0];
  if (!candidate) return { valid: false, why: 'no JSON object found' };
  let parsed;
  try {
    parsed = JSON.parse(candidate);
  } catch (e) {
    return { valid: false, why: `JSON.parse failed: ${e.message.slice(0, 80)}` };
  }
  const outline = parsed.outline;
  if (!Array.isArray(outline) || outline.length < 4 || outline.length > 6 ||
      !outline.every((t) => typeof t === 'string' && t.trim().length > 0)) {
    return { valid: false, why: `bad outline (${Array.isArray(outline) ? outline.length : typeof outline})` };
  }
  const s = parsed.firstStep;
  if (!s || typeof s !== 'object') return { valid: false, why: 'firstStep missing' };
  if (typeof s.explanation !== 'string' || typeof s.duration !== 'number') return { valid: false, why: 'bad explanation/duration' };
  if (!Array.isArray(s.commands) || s.commands.length === 0) return { valid: false, why: 'no commands' };
  for (const cmd of s.commands) {
    if (!cmd || typeof cmd.id !== 'string' || !COMMAND_TYPES.has(cmd.type)) return { valid: false, why: `bad command type ${cmd && cmd.type}` };
    if (!cmd.props || typeof cmd.props !== 'object') return { valid: false, why: 'bad props' };
    for (const v of Object.values(cmd.props)) {
      if (typeof v === 'number' && !Number.isFinite(v)) return { valid: false, why: 'non-finite prop' };
    }
  }
  return { valid: true, outlineCount: outline.length, commandCount: s.commands.length, commandTypes: [...new Set(s.commands.map((c) => c.type))] };
}

(async () => {
  const prompt = buildFusedPrompt();
  console.log(`fused prompt: ${prompt.length} chars (as user message; role differs from prod, content identical)`);

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
  await page.type('input[type="email"]', ADMIN_TEST_EMAIL, { delay: 5 });
  await page.type('input[placeholder="Enter your password"]', ADMIN_TEST_PASSWORD, { delay: 5 });
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
  console.log('logged in as admintest\n');

  const runs = [];
  // Alternate models across rounds to balance time-of-day variance.
  for (let round = 1; round <= RUNS_PER_MODEL; round++) {
    for (const model of MODELS) {
      const res = await fetch(`${API}/admin/ai-compare`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, models: [model] }),
      });
      const json = await res.json().catch(() => ({}));
      const r = json?.data?.results?.[0] || { ok: false, error: `HTTP ${res.status}` };
      const v = r.ok ? validateFused(r.output) : { valid: false, why: r.error || 'call failed' };
      runs.push({ round, model, ok: r.ok, latencyMs: r.latencyMs, tokensUsed: r.tokensUsed, ...v, outputHead: String(r.output || '').slice(0, 300) });
      console.log(`[round ${round}] ${model}`);
      console.log(`  ok=${r.ok} latency=${r.latencyMs}ms tokens=${r.tokensUsed ?? 'n/a'} valid=${v.valid}${v.valid ? ` outline=${v.outlineCount} commands=${v.commandCount} (${v.commandTypes.join(',')})` : ` why=${v.why}`}`);
      if (v.valid) console.log(`  head: ${String(r.output).slice(0, 160).replace(/\n/g, ' | ')}`);
    }
  }

  console.log('\n=== SUMMARY ===');
  for (const model of MODELS) {
    const rs = runs.filter((r) => r.model === model);
    const lat = rs.map((r) => r.latencyMs).sort((a, b) => a - b);
    console.log(`${model}`);
    console.log(`  latencies: ${lat.join(', ')}ms  (median ${lat[Math.floor(lat.length / 2)]}ms)`);
    console.log(`  valid fused JSON: ${rs.filter((r) => r.valid).length}/${rs.length}`);
  }
  const rawOut = path.join(__dirname, '..', '.superpowers', 'sdd', '2026-08-13-whiteboard-phase-c-two-way', 'outline-model-latency.json');
  fs.mkdirSync(path.dirname(rawOut), { recursive: true });
  fs.writeFileSync(rawOut, JSON.stringify({ ranAt: new Date().toISOString(), promptChars: prompt.length, runs }, null, 2));
  console.log(`\nraw results written to ${path.relative(process.cwd(), rawOut)}`);
})().catch((e) => { console.error('driver error:', e.message); process.exit(1); });
