/**
 * Live probe for the mock-exam theory-marking lifecycle. Run manually against
 * staging after the marking deploy:
 *
 *   node scripts/verify-mock-marking.cjs                 # staging (default)
 *   node scripts/verify-mock-marking.cjs --env=production
 *
 * Requires BRILLA_E2E_STUDENT_EMAIL / BRILLA_E2E_STUDENT_PASSWORD env vars
 * (see scripts/qa-credentials.cjs) and a local Chrome for the login step
 * (same convention as verify-paper-submit.cjs / verify-paper-resume.cjs).
 *
 * Probe sequence (all against a real theory paper from migration 363+):
 *   1. Baseline GET /progress (question_attempts count).
 *   2. Start an attempt on pp_wassce_math_2024_2, answer 3 theory questions.
 *   3. Submit → 200; status graded|partially_graded; marking counts add up;
 *      when fully graded, a grade is present and graded === theoryTotal.
 *   4. POST /remark → 200; re-fetch results; fully graded, or an honest
 *      remaining > 0 when the shortfall was credit-driven.
 *   5. GET results → every graded theory answer carries parseable
 *      ai_feedback (score/maxScore/feedback/perPoint); GET /progress moved.
 *   6. Over-time submit on a fresh attempt → 400 time_limit_exceeded and the
 *      attempt stays in_progress (a subsequent in-bound submit succeeds).
 *
 * Exit 0 = all checks passed. Exit 1 = any check failed.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { getQaCredentials } = require('./qa-credentials.cjs');

const envArg = (process.argv.find((a) => a.startsWith('--env=')) || '--env=staging').split('=')[1];
const deployments = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'deployments.json'), 'utf8'));
const target = deployments[envArg];
if (!target) {
  console.error(`verify-mock-marking: unknown --env=${envArg} (have: ${Object.keys(deployments).join(', ')})`);
  process.exit(1);
}
const API = `${target.apiOrigin}/api`;
const PAGES = target.pagesOrigin;
const THEORY_PAPER = 'pp_wassce_math_2024_2';

const [qaEmail, qaPassword] = getQaCredentials('student');

const failures = [];
function check(name, condition, detail = '') {
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!condition) failures.push(name);
}

const THEORY_ANSWERS = [
  'Profit is 12% of GH₵4,500 which is GH₵540, so the selling price is GH₵5,040. As a fraction of the cost price the profit is 540/4500, which reduces to 3/25. If instead the trader made an 8% loss, the loss would be GH₵360 and the selling price would be GH₵4,140.',
  'Adding the two equations eliminates y: 3x = 9, so x = 3. Substituting back into x − y = 2 gives y = 1. For the first equation, 3x − 7 = 11 gives 3x = 18 and x = 6. To make r the subject of V = πr²h, divide both sides by πh to get r² = V/(πh), then take the positive square root: r = √(V/(πh)).',
  'The angles sum to 180°, so 9x = 180 and x = 20. The largest angle is 4x = 80°. Since all three angles — 40°, 60° and 80° — are less than 90°, the triangle is acute.',
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
  await page.goto(`${PAGES}/?login=true`, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.type('input[type="email"]', qaEmail, { delay: 5 });
  await page.type('input[placeholder="Enter your password"]', qaPassword, { delay: 5 });
  const hasTurnstile = await page.$('input[name="cf-turnstile-response"]');
  if (hasTurnstile) {
    await page.waitForFunction(
      () => (document.querySelector('input[name="cf-turnstile-response"]')?.value || '').length > 10,
      { timeout: 45000 },
    );
  }
  await page.evaluate(() => {
    const form = document.querySelector('input[type="email"]')?.closest('form');
    form?.requestSubmit ? form.requestSubmit() : form?.querySelector('button[type="submit"]')?.click();
  });
  await page.waitForFunction(() => !!localStorage.getItem('brilla_token'), { timeout: 30000 });
  const token = await page.evaluate(() => localStorage.getItem('brilla_token'));
  await browser.close();
  console.log(`logged in via ${PAGES} (env=${envArg})\n`);

  const call = async (method, p, body) => {
    const res = await fetch(API + p, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, json: await res.json().catch(() => ({})) };
  };

  // 1. Analytics baseline
  const progressBefore = await call('GET', '/progress');
  const attemptedBefore = Number(progressBefore.json?.data?.totalAttempted) || 0;

  // 2. Seed an attempt with 3 theory answers
  await call('POST', `/papers/${THEORY_PAPER}/abandon`, {});
  const start = await call('POST', `/papers/${THEORY_PAPER}/attempt`, {});
  const attemptId = start.json?.data?.attemptId;
  check('start attempt on theory paper', start.status === 200 && !!attemptId, `status=${start.status}`);
  if (!attemptId) throw new Error('cannot continue without an attempt');

  const paper = await call('GET', `/papers/${THEORY_PAPER}`);
  const questions = (paper.json?.data?.questions || [])
    .filter((q) => ['essay', 'structured', 'short_answer', 'calculation'].includes(q.question_type))
    .slice(0, 3);
  check('theory paper exposes theory questions', questions.length === 3, `found ${questions.length}`);
  const timeAllowedMinutes = Number(paper.json?.data?.time_allowed) || 150;

  for (const [i, q] of questions.entries()) {
    const saved = await call('PUT', `/papers/attempts/${attemptId}/answer`, { questionId: q.id, answer: THEORY_ANSWERS[i] });
    check(`save answer ${q.id}`, saved.status === 200, `status=${saved.status}`);
  }

  // 3. Submit inside the time bound
  const submit = await call('POST', `/papers/attempts/${attemptId}/submit`, { timeUsed: 600 });
  const s = submit.json?.data || {};
  check('submit returns 200', submit.status === 200, `status=${submit.status} ${submit.status === 200 ? '' : JSON.stringify(submit.json).slice(0, 150)}`);
  const ms = s.markingStatus || {};
  const countsAddUp = (ms.graded ?? 0) + (ms.failed ?? 0) + (ms.pending ?? 0) === ms.theoryTotal;
  check('marking counts add up', submit.status === 200 && countsAddUp, JSON.stringify(ms));
  const fullyGraded = s.status === 'graded' && ms.theoryTotal > 0 && ms.graded === ms.theoryTotal;
  if (fullyGraded) {
    check('fully graded submit carries a grade', typeof s.grade === 'string' && s.grade.length > 0, `grade=${s.grade}`);
  } else {
    console.log(`  note: submit status=${s.status} — credit- or failure-driven partial marking; remark step decides`);
    check('partial submit is honestly partially_graded', s.status === 'partially_graded', `status=${s.status}`);
  }

  // 4. Remark lifecycle
  const remark = await call('POST', `/papers/attempts/${attemptId}/remark`, {});
  const r = remark.json?.data || {};
  check('remark returns 200', remark.status === 200, `status=${remark.status}`);
  const remarkHonest = r.status === 'graded' || (r.remaining ?? 0) > 0 || (r.failed ?? 0) > 0 || (r.remarked ?? 0) > 0;
  check('remark ends graded or reports honest remainder', remark.status === 200 && remarkHonest, JSON.stringify(r));

  // 5. Results render AI feedback; analytics moved
  const results = await call('GET', `/papers/attempts/${attemptId}/results`);
  const resAnswers = (results.json?.data?.answers || []).filter((a) => a.marking_status);
  check('results expose marking_status on theory answers', results.status === 200 && resAnswers.length >= ms.theoryTotal, `answers=${resAnswers.length}`);
  const gradedAnswers = resAnswers.filter((a) => a.marking_status === 'graded');
  let feedbackOk = gradedAnswers.length > 0;
  for (const a of gradedAnswers) {
    try {
      const fb = JSON.parse(a.ai_feedback);
      if (typeof fb.score !== 'number' || typeof fb.maxScore !== 'number'
        || typeof fb.feedback !== 'string' || !Array.isArray(fb.perPoint)) feedbackOk = false;
    } catch {
      feedbackOk = false;
    }
  }
  check('graded answers carry parseable ai_feedback', feedbackOk, `graded=${gradedAnswers.length}`);

  const progressAfter = await call('GET', '/progress');
  const attemptedAfter = Number(progressAfter.json?.data?.totalAttempted) || 0;
  check(
    'question_attempts moved for the probe user',
    attemptedAfter >= attemptedBefore + gradedAnswers.length,
    `before=${attemptedBefore} after=${attemptedAfter}`,
  );

  // 6. Over-time submit is rejected and the attempt stays resubmittable
  await call('POST', `/papers/${THEORY_PAPER}/abandon`, {});
  const start2 = await call('POST', `/papers/${THEORY_PAPER}/attempt`, {});
  const attemptId2 = start2.json?.data?.attemptId;
  check('start second attempt', start2.status === 200 && !!attemptId2, `status=${start2.status}`);
  if (attemptId2) {
    await call('PUT', `/papers/attempts/${attemptId2}/answer`, { questionId: questions[0]?.id, answer: THEORY_ANSWERS[0] });
    const overTime = await call('POST', `/papers/attempts/${attemptId2}/submit`, { timeUsed: timeAllowedMinutes * 60 + 600 });
    check(
      'over-time submit rejected with time_limit_exceeded',
      overTime.status === 400 && overTime.json?.code === 'time_limit_exceeded',
      `status=${overTime.status} code=${overTime.json?.code}`,
    );
    const inBound = await call('POST', `/papers/attempts/${attemptId2}/submit`, { timeUsed: 300 });
    check('attempt stays in_progress and accepts an in-bound resubmit', inBound.status === 200, `status=${inBound.status}`);
  }

  if (failures.length > 0) {
    console.error(`\nverify-mock-marking: ${failures.length} check(s) failed: ${failures.join('; ')}`);
    process.exit(1);
  }
  console.log('\nverify-mock-marking: all checks passed.');
})().catch((e) => { console.error('driver error:', e.message); process.exit(1); });
