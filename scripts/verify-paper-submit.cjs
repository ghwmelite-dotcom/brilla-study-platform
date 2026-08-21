const { getQaCredentials } = require('./qa-credentials.cjs');
const [qaEmail, qaPassword] = getQaCredentials('student');

/* Verify paper submit flow E2E as johndoe across several papers:
   for each paper: abandon stale attempt → start attempt → fetch paper →
   answer first 2 questions → submit → fetch results. Also GET /papers/attempts.
*/
const puppeteer = require('puppeteer-core');

const API = 'https://brilla-api.ghwmelite.workers.dev/api';

const PAPERS = [
  'pp_wassce_math_2024_1',
  'pp_bece_math_2024_1',
  'pp_wassce_eng_2024_1',
  'pp_wassce_phy_2023_1',
  'pp_bece_eng_2024_1',
];

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
  await page.type('input[type="email"]', qaEmail, { delay: 5 });
  await page.type('input[placeholder="Enter your password"]', qaPassword, { delay: 5 });
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
  console.log('logged in as johndoe\n');

  const call = async (method, path, body) => {
    const res = await fetch(API + path, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
  };

  // Attempts list (was also broken: pa.percentage_score)
  const list = await call('GET', '/papers/attempts?limit=5');
  console.log(`GET /papers/attempts → ${list.status}${list.status === 200 ? ` (${Array.isArray(list.json) ? list.json.length : '?'} rows)` : ' ' + JSON.stringify(list.json).slice(0, 120)}\n`);

  for (const paperId of PAPERS) {
    await call('POST', `/papers/${paperId}/abandon`, {});
    const start = await call('POST', `/papers/${paperId}/attempt`, {});
    if (start.status !== 200) {
      console.log(`${paperId}: START FAILED ${start.status} ${JSON.stringify(start.json).slice(0, 120)}`);
      continue;
    }
    const attemptId = start.json.data.attemptId;

    const paper = await call('GET', `/papers/${paperId}`);
    const qs = paper.json?.data?.questions || [];
    for (const q of qs.slice(0, 2)) {
      await call('PUT', `/papers/attempts/${attemptId}/answer`, { questionId: q.id, answer: 'A' });
    }

    const submit = await call('POST', `/papers/attempts/${attemptId}/submit`, { timeUsed: 65 });
    if (submit.status !== 200) {
      console.log(`${paperId}: SUBMIT FAILED ${submit.status} ${JSON.stringify(submit.json).slice(0, 150)}`);
      continue;
    }
    const s = submit.json.data;

    const results = await call('GET', `/papers/attempts/${attemptId}/results`);
    const att = results.json?.data?.attempt || {};
    console.log(`${paperId}: submit 200 score=${s.totalScore}/${s.totalMarks} (${s.percentageScore}%) | results ${results.status} percentage_score=${att.percentage_score} status=${att.status}`);
  }
})().catch(e => { console.error('driver error:', e.message); process.exit(1); });
