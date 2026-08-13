/* Spike: login as admin, then POST /api/admin/tts-spike to learn the true
   response shape of the Deepgram Aura 2 TTS model via Workers AI.
   Prints { shape, contentType, byteLength, isBase64, firstBytes }.
*/
const puppeteer = require('puppeteer-core');

const API = 'https://brilla-api.ghwmelite.workers.dev/api';

const TEXT = process.argv[2] || 'Photosynthesis is how plants turn sunlight into energy.';

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
  console.log('logged in as admintest\n');

  const t0 = Date.now();
  try {
    const res = await fetch(`${API}/admin/tts-spike`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: TEXT }),
    });
    const json = await res.json().catch(() => ({}));
    console.log(`${res.status}  (${Date.now() - t0}ms)`);
    console.log(JSON.stringify(json, null, 2));
  } catch (e) {
    console.log(`ERR  (${Date.now() - t0}ms)  ${e.message}`);
    process.exit(1);
  }
})().catch(e => { console.error('driver error:', e.message); process.exit(1); });
