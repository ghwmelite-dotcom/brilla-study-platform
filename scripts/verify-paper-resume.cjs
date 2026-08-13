/* Verify the resume-attempt flow in a real browser as johndoe:
   1. Via API: create an in-progress attempt on pp_bece_math_2024_1 with 2 saved answers.
   2. In the browser: open the paper, click Start Paper → expect the
      "Attempt in progress" notice → click Resume Attempt.
   3. Verify the exam UI loads with answers restored (no error, timer visible).
*/
const puppeteer = require('puppeteer-core');

const API = 'https://brilla-api.ghwmelite.workers.dev/api';
const PAPER = 'pp_bece_math_2024_1';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
    defaultViewport: { width: 1366, height: 900 },
  });
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message.slice(0, 300)));

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
  console.log('logged in');

  // Seed an in-progress attempt with 2 answers via the API
  const call = async (method, path, body) => {
    const res = await fetch(API + path, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, json: await res.json().catch(() => ({})) };
  };
  await call('POST', `/papers/${PAPER}/abandon`, {});
  const start = await call('POST', `/papers/${PAPER}/attempt`, {});
  const attemptId = start.json?.data?.attemptId;
  const paperRes = await call('GET', `/papers/${PAPER}`);
  const qs = paperRes.json?.data?.questions || [];
  const firstTwo = qs.slice(0, 2);
  for (const q of firstTwo) {
    await call('PUT', `/papers/attempts/${attemptId}/answer`, { questionId: q.id, answer: 'A' });
  }
  console.log(`seeded attempt ${attemptId} with ${firstTwo.length} answers`);

  // Open the paper page and click Start Paper
  await page.goto(`https://brillaprep.org/past-papers/${PAPER}`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 3000));
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Start Paper');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  const notice = await page.evaluate(() => {
    const t = document.body.innerText.replace(/\s+/g, ' ');
    const m = t.match(/Attempt in progress[^.]*\./);
    return m ? m[0] : null;
  });
  console.log('resume notice:', notice || 'NOT SHOWN');

  // Click Resume Attempt
  const clicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Resume Attempt');
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('clicked Resume Attempt:', clicked);
  await new Promise(r => setTimeout(r, 4000));

  const state = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 350));
  const isError = await page.evaluate(() => document.body.innerText.includes('Something went wrong') || document.body.innerText.includes('Failed to'));
  console.log('error shown:', isError);
  console.log('page state:', state);
  await page.screenshot({ path: process.env.TEMP + '/paper-resume-verify.png' });
  await browser.close();
})().catch(e => { console.error('driver error:', e.message); process.exit(1); });
