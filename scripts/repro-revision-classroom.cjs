const { getQaCredentials } = require('./qa-credentials.cjs');
const [qaEmail, qaPassword] = getQaCredentials('student');

/* Quick repro: login as student, open /revision-classroom, capture the crash. */
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
    defaultViewport: { width: 1366, height: 900 },
  });
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();

  page.on('pageerror', e => console.log('PAGEERROR:', e.message.slice(0, 500)));
  page.on('console', m => {
    if (m.type() === 'error') console.log('CONSOLE:', m.text().slice(0, 400));
  });
  page.on('response', async r => {
    if (!r.url().includes('/api/')) return;
    const body = await r.text().catch(() => '');
    console.log(`API: ${r.request().method()} ${r.url().replace('https://brilla-api.ghwmelite.workers.dev/api', '')} → ${r.status()} ${body.slice(0, 120)}`);
  });
  page.on('requestfailed', r => {
    if (r.url().includes('/api/')) console.log('API REQ FAILED:', r.request().method(), r.url(), r.failure()?.errorText);
  });

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
  const loginTraffic = [];
  const onResp = async (r) => {
    if (!r.url().includes('/api/auth/login')) return;
    const body = r.request().method() === 'POST' ? (await r.text().catch(() => '')) : '';
    loginTraffic.push(`${r.request().method()} → HTTP ${r.status()} ${body.slice(0, 150)}`);
  };
  page.on('response', onResp);
  await page.evaluate(() => {
    const form = document.querySelector('input[type="email"]')?.closest('form');
    form?.requestSubmit ? form.requestSubmit() : form?.querySelector('button[type="submit"]')?.click();
  });
  try {
    await page.waitForFunction(() => !!localStorage.getItem('brilla_token'), { timeout: 30000 });
  } catch {
    console.log('LOGIN FAILED. traffic:', loginTraffic.join(' | ') || 'none');
    await browser.close();
    process.exit(1);
  }
  console.log('logged in');

  await page.goto('https://brillaprep.org/revision-classroom', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 4000));

  // Dismiss onboarding tour if present
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    const skip = btns.find(b => /skip|close|got it|later/i.test(b.textContent));
    if (skip) skip.click();
    const x = document.querySelector('[class*="fixed"] button svg')?.closest('button');
    if (x) x.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Click the first subject card ("Start Revision") — exercises startRevisionSession
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('button')].filter(b => b.textContent.includes('Start Revision'));
    if (cards[0]) cards[0].click();
  });
  await new Promise(r => setTimeout(r, 25000));

  const isError = await page.evaluate(() => document.body.innerText.includes('Something went wrong'));
  const bodySnippet = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 300));
  console.log('error boundary shown:', isError);
  console.log('page state:', bodySnippet);
  await page.screenshot({ path: process.env.TEMP + '/revision-classroom-repro.png' });
  await browser.close();
})().catch(e => { console.error('driver error:', e.message); process.exit(1); });
