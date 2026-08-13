/* Spot-check: login as johndoe, open /revision-classroom, switch to WASSCE tab,
   click Elective Mathematics (id was misaligned before the fix), verify the
   classroom renders without the error boundary. */
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

  page.on('pageerror', e => console.log('PAGEERROR:', e.message.slice(0, 300)));
  page.on('response', async r => {
    if (!r.url().includes('/api/') || r.request().method() === 'OPTIONS') return;
    console.log(`API: ${r.request().method()} ${r.url().replace('https://brilla-api.ghwmelite.workers.dev/api', '')} → ${r.status()}`);
  });

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
  console.log('logged in');

  await page.goto('https://brillaprep.org/revision-classroom', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 4000));

  // Dismiss onboarding tour if present
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    const skip = btns.find(b => /skip|close|got it|later/i.test(b.textContent));
    if (skip) skip.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Switch to the WASSCE tab
  await page.evaluate(() => {
    const tab = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'WASSCE');
    if (tab) tab.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Click the Elective Mathematics card
  const clicked = await page.evaluate(() => {
    const card = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Elective Mathematics'));
    if (card) { card.click(); return true; }
    return false;
  });
  console.log('clicked Elective Mathematics card:', clicked);

  await new Promise(r => setTimeout(r, 20000));

  const isError = await page.evaluate(() => document.body.innerText.includes('Something went wrong'));
  const bodySnippet = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 300));
  console.log('error boundary shown:', isError);
  console.log('page state:', bodySnippet);
  await page.screenshot({ path: process.env.TEMP + '/revision-wassce-spotcheck.png' });
  await browser.close();
})().catch(e => { console.error('driver error:', e.message); process.exit(1); });
