/* Probe: login as johndoe, then try starting revision sessions across exam types.
   Expectations after id-alignment fix:
   - wassce core/elective/bus-mgmt: 200 (topics exist)
   - bece/igcse/alevel: graceful 400 "being prepared" (0 topics seeded yet)
*/
const puppeteer = require('puppeteer-core');

const API = 'https://brilla-api.ghwmelite.workers.dev/api';

const CASES = [
  ['wassce', 'subj_wassce_core_math'],
  ['wassce', 'subj_wassce_elect_math'],
  ['wassce', 'subj_wassce_bus_mgmt'],
  ['wassce', 'subj_wassce_english'],
  ['bece', 'subj_bece_math'],
  ['igcse', 'subj_igcse_math'],
  ['cambridge-a-level', 'subj_alevel_math'],
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
  await browser.close();
  console.log('logged in as johndoe\n');

  for (const [examType, subjectId] of CASES) {
    const t0 = Date.now();
    try {
      const res = await fetch(`${API}/revision-classroom/sessions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ examType, subjectId }),
      });
      const json = await res.json().catch(() => ({}));
      const lessons = json?.data?.lessons?.length;
      const detail = res.status === 200
        ? `lessons=${lessons}`
        : (json.error || '').slice(0, 90);
      console.log(`${res.status}  ${examType}/${subjectId}  (${Date.now() - t0}ms)  ${detail}`);
      // Abandon the session so johndoe doesn't accumulate dangling actives
      if (res.status === 200 && json?.data?.session?.id) {
        await fetch(`${API}/revision-classroom/sessions/${json.data.session.id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'abandoned' }),
        });
      }
    } catch (e) {
      console.log(`ERR  ${examType}/${subjectId}  (${Date.now() - t0}ms)  ${e.message}`);
    }
  }
})().catch(e => { console.error('driver error:', e.message); process.exit(1); });
