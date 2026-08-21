const { getQaCredentials } = require('./qa-credentials.cjs');

/* QA: Phase C visual verification — two-way whiteboard in a REAL browser
   (headful Chrome) as premium johndoe. EVIDENCE GATHERING, not pass/fail:
   exits 0 unless the driver itself breaks; every major step is screenshotted
   to qa-shots/ so failures are diagnosable.

   Flow:
     1. UI login as johndoe (full turnstile flow), admin set-tier upgrade to
        tier_student_monthly BEFORE the QA page loads entitlements.
     2. Navigate the real UI: /revision-classroom -> WASSCE -> Core
        Mathematics -> first lesson -> Whiteboard mode -> Worked Example.
     3. Ink + Check my work: enable ink (PenLine), draw strokes with trusted
        mouse events on the ink canvas, click "Check my work", wait up to 60s
        for the verdict banner -> check-work-result.png.
     4. Point-and-ask: arm the "?" tool, tap a point on the canvas, wait up to
        60s for the explanation-panel answer -> ask-about-result.png.
     5. Photo flow: generate an exercise-book JPEG in the page, uploadFile it
        onto the hidden input[type=file], confirm "Use this photo", wait up to
        60s for the annotated result -> photo-result.png.
     6. Prints honest observations: what rendered, what didn't, and every
        console error captured along the way.

   Environment seeding (learned the hard way — 2026-08-14 debug run):
   - A FRESH browser context has no brilla-guide-storage, so OnboardingTrigger
     fires the OnboardingModal (fixed z-[100] + bg-black/60 backdrop). The
     backdrop INTERCEPTS ALL TRUSTED CLICKS (page.click/page.mouse) while
     evaluate-clicks bypass hit-testing and work — this exact asymmetry
     dead-ended the ink/check-work/ask-about steps once. We therefore seed
     hasCompletedOnboarding:true (plus the promo/splash flags and the
     persisted brilla-auth store, which also removes a second flaky turnstile
     login), and dismissBlockingOverlays() runs before every trusted-click
     step as a safety net.
   - Trusted clicks are verified after the fact: if the ink toggle doesn't
     produce the Check-my-work button within 4s, the script logs what
     elementFromPoint sees at the toggle's center and falls back to an
     evaluate-click.

   If a selector can't be found in a reasonable time the script screenshots
   dead-end-<step>.png, logs it, and skips to cleanup — it never hangs.
   Tier is restored to tier_free in `finally` REUSING the run's initial
   tokens (no re-login — repeated turnstile logins get rate-limited).
   The created revision session is abandoned in `finally`.
*/
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const API = 'https://brilla-api.ghwmelite.workers.dev/api';
const APP = 'https://brillaprep.org';
const SHOTS = path.join(__dirname, '..', 'qa-shots');
const NONCE = Date.now();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Logs in via the real UI and returns the persisted auth state so the QA
// context can be seeded WITHOUT a second turnstile login.
async function uiLogin(browser, email, password) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('brilla_promo_dismissed', 'true');
    sessionStorage.setItem('brilla_splash_shown', 'true');
  });
  await page.goto(`${APP}/?login=true`, { waitUntil: 'networkidle2', timeout: 60000 });
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
  await page.waitForFunction(() => !!localStorage.getItem('brilla_token'), { timeout: 45000 });
  const storage = await page.evaluate(() => ({
    token: localStorage.getItem('brilla_token'),
    auth: localStorage.getItem('brilla-auth'),
  }));
  await ctx.close();
  return storage;
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
  return { status: res.status, json };
}

// Central dead-end signal: any step can bail to cleanup without hanging.
class DeadEnd extends Error {}

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const observations = [];
  const consoleErrors = [];
  const note = (s) => { console.log(s); observations.push(s); };

  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
    defaultViewport: { width: 1366, height: 900 },
  });

  let studentId = null;
  let studentToken = null;
  let adminToken = null;
  let qaCtx = null;
  let sessionId = null;

  try {
    // ---- Tokens + premium upgrade BEFORE the QA app loads ------------------
    const student = await uiLogin(browser, ...getQaCredentials('student'));
    studentToken = student.token;
    studentId = decodeUserId(studentToken);
    adminToken = (await uiLogin(browser, ...getQaCredentials('admin'))).token;
    note(`logged in as johndoe (${studentId}) + admintest, nonce=${NONCE}`);
    const up = await api(adminToken, 'POST', `/admin/users/${studentId}/set-tier`, { tierId: 'tier_student_monthly', durationDays: 30 });
    note(`set-tier premium: ${up.status} ${up.json.success ? 'ok' : JSON.stringify(up.json).slice(0, 120)}`);

    // ---- QA page: seeded auth (no second turnstile login) ------------------
    qaCtx = await browser.createBrowserContext();
    const page = await qaCtx.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 300));
    });
    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${String(err).slice(0, 300)}`));
    // Capture the session id for cleanup when the UI creates it.
    page.on('response', async (res) => {
      if (res.url().includes('/revision-classroom/sessions') && res.request().method() === 'POST') {
        try {
          const json = await res.json();
          sessionId = json?.data?.session?.id || sessionId;
        } catch { /* ignore */ }
      }
    });

    const shot = async (name) => {
      const file = path.join(SHOTS, name);
      await page.screenshot({ path: file });
      note(`  screenshot: qa-shots/${name}`);
    };

    const clickButtonByText = async (re, timeout = 12000) => {
      await page.waitForFunction((src) => {
        const rx = new RegExp(src, 'i');
        return [...document.querySelectorAll('button')].some((b) => rx.test(b.textContent || '') && !b.disabled);
      }, { timeout }, re.source);
      const clicked = await page.evaluate((src) => {
        const rx = new RegExp(src, 'i');
        const b = [...document.querySelectorAll('button')].find((x) => rx.test(x.textContent || '') && !x.disabled);
        if (!b) return false;
        b.click();
        return true;
      }, re.source);
      if (!clicked) throw new DeadEnd(`button ${re} not clickable`);
    };

    // Safety net for modal overlays (onboarding, achievements, streaks):
    // dismiss anything with a fixed full-screen backdrop before trusted clicks.
    const dismissBlockingOverlays = async () => {
      const dismissed = await page.evaluate(() => {
        const out = [];
        // Explicit close/skip controls first.
        for (const sel of ['button[aria-label="Skip onboarding"]', 'button[aria-label="Close"]']) {
          for (const b of document.querySelectorAll(sel)) {
            b.click();
            out.push(sel);
          }
        }
        // Backdrop click dismisses the onboarding modal (onClick=skipOnboarding).
        for (const bd of document.querySelectorAll('div.fixed.inset-0 > div.absolute.inset-0')) {
          bd.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          out.push('backdrop');
        }
        return out;
      });
      if (dismissed.length > 0) {
        note(`  dismissed overlay(s): ${[...new Set(dismissed)].join(', ')}`);
        await sleep(600);
      }
    };

    // Trusted click with verification: if the expected result doesn't appear,
    // log what elementFromPoint sees at the target and evaluate-click instead.
    const trustedClickWithFallback = async (selector, verifySelector, label) => {
      await page.waitForSelector(selector, { timeout: 10000 });
      await page.click(selector);
      try {
        await page.waitForSelector(verifySelector, { timeout: 4000 });
        return;
      } catch {
        const diag = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return 'target gone';
          const r = el.getBoundingClientRect();
          const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return `elementFromPoint at target center: ${at ? `${at.tagName}.${String(at.className).slice(0, 120)}` : 'null'}`;
        }, selector);
        note(`  trusted click on ${label} had no effect (${diag}) — using evaluate-click fallback`);
        await page.evaluate((sel) => document.querySelector(sel)?.click(), selector);
        await page.waitForSelector(verifySelector, { timeout: 5000 });
      }
    };

    // Seed persisted state: promo/splash flags, onboarding DISMISSED (fresh
    // contexts otherwise get the OnboardingModal backdrop, which swallows
    // trusted clicks), and the brilla-auth store from the temp login.
    await page.evaluateOnNewDocument((s) => {
      sessionStorage.setItem('brilla_promo_dismissed', 'true');
      sessionStorage.setItem('brilla_splash_shown', 'true');
      localStorage.setItem(
        'brilla-guide-storage',
        JSON.stringify({ state: { hasCompletedOnboarding: true, completedTours: [], dismissedHints: [], viewedGuides: [] }, version: 0 })
      );
      if (s.auth) localStorage.setItem('brilla-auth', s.auth);
      if (s.token) localStorage.setItem('brilla_token', s.token);
    }, student);
    await page.goto(`${APP}/revision-classroom`, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(2000);
    note('QA page loaded with seeded premium auth');

    // ---- Step 1: revision classroom -> subject -> lesson -> whiteboard -----
    const step1 = async () => {
      await shot('01-subject-selector.png');

      // Exam type: WASSCE (a no-op click if already selected).
      await clickButtonByText(/^WASSCE$/i, 8000).catch(() => note('  note: WASSCE exam button not found — assuming preselected'));
      await sleep(800);
      await clickButtonByText(/Core Mathematics/i);
      note('  clicked Core Mathematics — session starting');
      await page.waitForFunction(
        () => [...document.querySelectorAll('button')].some((b) => /Whiteboard/i.test(b.textContent || '')),
        { timeout: 45000 }
      );
      await sleep(1500);
      await shot('02-classroom.png');

      // Ensure a lesson is active: click the first sidebar lesson unless the
      // app auto-started one (the active lesson's button is disabled).
      await page.evaluate(() => {
        const lessonBtns = [...document.querySelectorAll('button')].filter((b) => /^\s*1\./.test(b.textContent || ''));
        const first = lessonBtns[0];
        if (first && !first.disabled) first.click();
      });
      await sleep(2000);
      await shot('03-lesson.png');

      // Whiteboard mode toggle.
      await clickButtonByText(/Whiteboard/i);
      await sleep(1500);
      await shot('04-whiteboard-selector.png');

      // Lesson type: Worked Example (problem-solving).
      await clickButtonByText(/Worked Example/i);
      note('  requested a Worked Example whiteboard lesson — waiting for step 1 (fused cold call)');
      await page.waitForFunction(() => /Step 1 of/.test(document.body.innerText), { timeout: 90000 });
      await sleep(2500);
      await shot('05-whiteboard-lesson.png');
      note('  whiteboard lesson rendered (Step 1 visible)');
    };
    await step1().catch(async (e) => {
      await shot('dead-end-navigation.png');
      throw new DeadEnd(`navigation to whiteboard failed: ${e.message}`);
    });

    // ---- Step 2: ink + Check my work ---------------------------------------
    const step2 = async () => {
      await dismissBlockingOverlays();
      // Enable ink — trusted click, verified, with evaluate-click fallback.
      await trustedClickWithFallback(
        'button[title="Draw on the whiteboard"]',
        'button[title="Have the AI teacher mark the work you drew"]',
        'ink toggle'
      );
      note('  ink enabled (Check my work button present)');
      await sleep(500);

      const ink = await page.waitForSelector('[data-testid="student-ink-layer"] canvas.upper-canvas', { timeout: 8000 });
      const box = await ink.boundingBox();
      if (!box) throw new DeadEnd('ink canvas has no bounding box');
      const stroke = async (x1, y1, x2, y2) => {
        await page.mouse.move(box.x + x1, box.y + y1);
        await page.mouse.down();
        await page.mouse.move(box.x + (x1 + x2) / 2, box.y + (y1 + y2) / 2, { steps: 5 });
        await page.mouse.move(box.x + x2, box.y + y2, { steps: 5 });
        await page.mouse.up();
      };
      // A few "worked" strokes: two horizontals, a vertical, a cross.
      await stroke(box.width * 0.2, box.height * 0.3, box.width * 0.6, box.height * 0.32);
      await stroke(box.width * 0.22, box.height * 0.45, box.width * 0.55, box.height * 0.47);
      await stroke(box.width * 0.3, box.height * 0.25, box.width * 0.32, box.height * 0.55);
      await stroke(box.width * 0.65, box.height * 0.6, box.width * 0.8, box.height * 0.75);
      await sleep(500);
      // Verify the strokes actually landed on the ink layer (fabric objects).
      const inkObjectCount = await page.evaluate(() => {
        const layer = document.querySelector('[data-testid="student-ink-layer"] canvas.lower-canvas');
        if (!layer) return -1;
        // A blank ink layer exports an empty (or near-empty) pixel buffer.
        const ctx = layer.getContext('2d');
        if (!ctx) return -1;
        const data = ctx.getImageData(0, 0, layer.width, layer.height).data;
        let painted = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) painted++;
        return painted;
      });
      note(`  drew 4 ink strokes (painted px on ink layer: ${inkObjectCount})`);
      if (inkObjectCount <= 0) throw new DeadEnd('ink strokes did not land (ink layer blank)');
      await shot('06-ink.png');

      await page.click('button[title="Have the AI teacher mark the work you drew"]');
      note('  clicked Check my work — waiting for the verdict (vision call, up to 60s)');
      await page.waitForFunction(
        () => /Correct — great work|Almost there|Let's look at this again|Couldn't check your work/.test(document.body.innerText),
        { timeout: 60000 }
      );
      await sleep(1200);
      const verdict = await page.evaluate(() => {
        const m = document.body.innerText.match(/Correct — great work|Almost there|Let's look at this again|Couldn't check your work/);
        return m ? m[0] : 'unknown';
      });
      await shot('check-work-result.png');
      note(`  check-work verdict banner: "${verdict}"`);
    };
    await step2().catch(async (e) => {
      await shot('dead-end-check-work.png');
      note(`  DEAD-END at ink/check-work: ${e.message}`);
    });

    // ---- Step 3: point-and-ask ---------------------------------------------
    const step3 = async () => {
      await dismissBlockingOverlays();
      // Explanation panel text before asking (detect the answer as a change).
      const PANEL = 'p.min-h-\\[2\\.5rem\\]';
      const before = await page.evaluate((sel) => document.querySelector(sel)?.textContent || '', PANEL);

      await page.waitForSelector('button[title="Ask about a spot on the whiteboard"]', { timeout: 8000 });
      await page.click('button[title="Ask about a spot on the whiteboard"]');
      await sleep(400);
      // Tap the middle of the lesson canvas (first canvas-container).
      const point = await page.evaluate(() => {
        const el = document.querySelector('.canvas-container');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width * 0.42, y: r.top + r.height * 0.45 };
      });
      if (!point) throw new DeadEnd('lesson canvas not found for tap');
      await page.mouse.click(point.x, point.y);
      note('  armed the "?" tool and tapped the canvas — waiting for the answer (up to 60s)');
      await page.waitForFunction(
        (sel, prev) => {
          const t = document.querySelector(sel)?.textContent || '';
          return t.trim().length > 0 && t !== prev && !/Preparing next step|Loading/.test(t);
        },
        { timeout: 60000 },
        PANEL,
        before
      );
      await sleep(1500);
      const answer = await page.evaluate((sel) => document.querySelector(sel)?.textContent || '', PANEL);
      await shot('ask-about-result.png');
      note(`  ask-about answer: "${answer.slice(0, 140)}"`);
    };
    await step3().catch(async (e) => {
      await shot('dead-end-ask-about.png');
      note(`  DEAD-END at point-and-ask: ${e.message}`);
    });

    // ---- Step 4: photo flow -------------------------------------------------
    const step4 = async () => {
      await dismissBlockingOverlays();
      // Exercise-book JPEG fixture, rendered in-page (no node deps).
      const jpeg = await page.evaluate(() => {
        const c = document.createElement('canvas');
        c.width = 1000;
        c.height = 1400;
        const k = c.getContext('2d');
        k.fillStyle = '#f8f5ec';
        k.fillRect(0, 0, 1000, 1400);
        k.strokeStyle = 'rgba(100, 149, 237, 0.35)';
        for (let y = 60; y < 1400; y += 44) { k.beginPath(); k.moveTo(0, y); k.lineTo(1000, y); k.stroke(); }
        k.strokeStyle = 'rgba(220, 38, 38, 0.45)';
        k.beginPath(); k.moveTo(90, 0); k.lineTo(90, 1400); k.stroke();
        k.fillStyle = '#1e293b';
        k.font = '40px "Comic Sans MS", "Segoe Script", cursive';
        ['Solve: 3y - 7 = 11', '3y = 18', 'y = 6', '', 'y = 9'].forEach((t, i) => {
          if (!t) return;
          k.save(); k.translate(135, 150 + i * 70); k.rotate((Math.random() - 0.5) * 0.03); k.fillText(t, 0, 0); k.restore();
        });
        return c.toDataURL('image/jpeg', 0.85).split(',')[1];
      });
      const fixturePath = path.join(SHOTS, 'fixture-photo.jpg');
      fs.writeFileSync(fixturePath, Buffer.from(jpeg, 'base64'));
      note(`  photo fixture written (${Math.round(jpeg.length * 0.75 / 1024)}KB)`);

      const input = await page.waitForSelector('input[type="file"][accept="image/*"]', { timeout: 8000 });
      await input.uploadFile(fixturePath);
      await page.waitForFunction(() => /Your photo/.test(document.body.innerText), { timeout: 15000 });
      await sleep(800);
      await shot('07-photo-preview.png');
      note('  preview modal open');

      await clickButtonByText(/Use this photo/i);
      note('  confirmed photo — waiting for the annotated result (vision call, up to 60s)');
      await page.waitForFunction(
        () => [...document.querySelectorAll('button')].some((b) => /^\s*Done\s*$/.test(b.textContent || '')),
        { timeout: 60000 }
      );
      await sleep(1200);
      await shot('photo-result.png');
      const summary = await page.evaluate(() => {
        const m = document.body.innerText.match(/Correct — great work|Almost there|Let's look at this again|Couldn't check your work/);
        return m ? m[0] : 'no verdict banner found';
      });
      note(`  photo result: "${summary}" (annotations, if any, are in photo-result.png)`);
      await clickButtonByText(/^\s*Done\s*$/i, 5000).catch(() => {});
    };
    await step4().catch(async (e) => {
      await shot('dead-end-photo.png');
      note(`  DEAD-END at photo flow: ${e.message}`);
    });
  } catch (e) {
    if (e instanceof DeadEnd) note(`DEAD-END: ${e.message}`);
    else throw e;
  } finally {
    if (qaCtx) await qaCtx.close().catch(() => {});
    // Cleanup REUSES the run's initial tokens — no re-login (repeated
    // turnstile logins within minutes get rate-limited, observed 2026-08-14).
    if (sessionId && studentToken) {
      await api(studentToken, 'PATCH', `/revision-classroom/sessions/${sessionId}`, { status: 'abandoned' }).catch(() => {});
      note(`abandoned session ${sessionId}`);
    }
    if (studentId && adminToken) {
      const down = await api(adminToken, 'POST', `/admin/users/${studentId}/set-tier`, { tierId: 'tier_free', durationDays: 1 }).catch(() => null);
      note(`restore tier_free: ${down ? down.status : 'request failed'} (residual expiry inert per isPremiumUser)`);
    }
    await browser.close().catch(() => {});
  }

  console.log('\n=== OBSERVATIONS ===');
  observations.forEach((o) => console.log(` ${o}`));
  console.log(`\n=== CONSOLE ERRORS (${consoleErrors.length}) ===`);
  consoleErrors.slice(0, 20).forEach((e) => console.log(`  ${e}`));
  console.log('\nQA run complete — review qa-shots/*.png');
  process.exit(0);
})().catch((e) => { console.error('driver error:', e.message); process.exit(1); });
