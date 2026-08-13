/* Qwen3-30B vs Llama-3.3-70B quality pilot.
   Logs in as admin, then runs 6 representative prompts through /api/admin/ai-compare
   with both models, recording ok/latencyMs/tokensUsed/output per model.
   For prompt 5 (whiteboard JSON) additionally validates JSON parse + required keys.
*/
const puppeteer = require('puppeteer-core');

const API = 'https://brilla-api.ghwmelite.workers.dev/api';
const MODELS = ['@cf/qwen/qwen3-30b-a3b-fp8', '@cf/meta/llama-3.3-70b-instruct-fp8-fast'];

const PROMPTS = [
  { id: 'teach-hook', label: 'teach hook (2-sentence WASSCE math intro)',
    prompt: 'You are an expert WASSCE math teacher. Write a 2-sentence hook introducing Quadratic Equations to a Ghanaian SHS student.' },
  { id: 'teach-explain', label: 'teach explain (factorisation, max 120 words)',
    prompt: 'Explain the factorisation method for solving x² + 5x + 6 = 0, step by step, max 120 words.' },
  { id: 'ask', label: 'ask (mitosis vs meiosis, concise)',
    prompt: 'What is the difference between mitosis and meiosis? (WASSCE biology, concise)' },
  { id: 'checkpoint', label: 'checkpoint (MCQ on Ohm\'s law, 4 options + answer)',
    prompt: "Write one multiple-choice question testing understanding of Ohm's law, with 4 options A-D and the correct answer marked." },
  { id: 'whiteboard-json', label: 'whiteboard step JSON (fraction 3/4 bar, JSON only)',
    prompt: 'Output JSON only: a whiteboard step object with keys stepNumber, explanation, voiceOver, duration, commands (array of {type,id,props}) drawing the fraction 3/4 as a labeled bar. Canvas 1200x800.',
    jsonCheck: true },
  { id: 'off-topic-guard', label: 'off-topic guard (champions league question, max 60 words)',
    prompt: "A student asked during a WASSCE physics revision lesson on waves: 'who will win the champions league?' Answer helpfully but guide back to the topic, max 60 words." },
];

function validateWhiteboardJson(output) {
  if (!output) return false;
  let text = String(output).trim();
  // tolerate code fences even though the instruction said JSON only
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  try {
    const obj = JSON.parse(text);
    return ['stepNumber', 'explanation', 'voiceOver', 'duration', 'commands']
      .every(k => k in obj) && Array.isArray(obj.commands);
  } catch {
    return false;
  }
}

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
  await page.type('input[type="email"]', 'admintest@brillaprep.org', { delay: 5 });
  await page.type('input[placeholder="Enter your password"]', 'Admin123!', { delay: 5 });
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
  console.log('logged in as admintest@brillaprep.org\n');

  const runs = [];
  for (const p of PROMPTS) {
    console.log(`=== ${p.id}: ${p.label}`);
    const t0 = Date.now();
    try {
      const res = await fetch(`${API}/admin/ai-compare`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p.prompt, models: MODELS }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        console.log(`  HTTP ${res.status}  error=${(json.error || '').slice(0, 200)}`);
        for (const m of MODELS) runs.push({ promptId: p.id, model: m, ok: false, latencyMs: null, tokensUsed: null, output: null, error: `HTTP ${res.status}` });
        continue;
      }
      for (const r of json.data.results) {
        const entry = {
          promptId: p.id, model: r.model, ok: r.ok,
          latencyMs: r.latencyMs, tokensUsed: r.tokensUsed ?? null,
          output: r.output ?? null, error: r.error ?? null,
        };
        if (p.jsonCheck) entry.jsonValid = validateWhiteboardJson(r.output);
        runs.push(entry);
        const status = r.ok
          ? `ok latency=${r.latencyMs}ms tokens=${r.tokensUsed ?? 'n/a'}${p.jsonCheck ? ` jsonValid=${entry.jsonValid}` : ''}`
          : `FAIL error=${(r.error || '').slice(0, 150)}`;
        console.log(`  [${r.model}] ${status} (round-trip ${Date.now() - t0}ms)`);
      }
    } catch (e) {
      console.log(`  ERR ${e.message}`);
      for (const m of MODELS) runs.push({ promptId: p.id, model: m, ok: false, latencyMs: null, tokensUsed: null, output: null, error: e.message });
    }
  }

  // Per-model aggregates
  console.log('\n=== AGGREGATES ===');
  for (const m of MODELS) {
    const rs = runs.filter(r => r.model === m);
    const okRs = rs.filter(r => r.ok);
    const lat = okRs.map(r => r.latencyMs).filter(v => typeof v === 'number');
    const tok = okRs.map(r => r.tokensUsed).filter(v => typeof v === 'number');
    const mean = a => (a.length ? Math.round(a.reduce((s, v) => s + v, 0) / a.length) : null);
    console.log(`${m}`);
    console.log(`  success: ${okRs.length}/${rs.length}`);
    console.log(`  mean latency: ${mean(lat)}ms  mean tokens: ${mean(tok)}`);
    const jsonRuns = rs.filter(r => r.jsonValid !== undefined);
    if (jsonRuns.length) console.log(`  whiteboard jsonValid: ${jsonRuns.filter(r => r.jsonValid).length}/${jsonRuns.length}`);
  }

  console.log('\n=== RAW RESULTS JSON ===');
  console.log(JSON.stringify(runs, null, 2));
})().catch(e => { console.error('driver error:', e.message); process.exit(1); });
