import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'database/migrations/archive/084_alevel_further_math_questions.sql'),
  'utf8',
);

describe('Cambridge content-correction proposal source evidence', () => {
  it('pins the exact incorrect answer and self-contradictory explanation for q_alevel_fm_050', () => {
    expect(source).toContain(
      "('q_alevel_fm_050', 'subj_alevel_further_math', NULL, 'Find the distance from point (1, 2, 3) to the plane 2x + 2y + z = 10.', 'calculation', NULL, '1 unit'",
    );
    expect(source).toContain("d = |9-10|/3 = 1/3'");
  });

  it('pins the mathematically equivalent A and D options for q_alevel_fm_051', () => {
    expect(source).toContain(
      "('q_alevel_fm_051', 'subj_alevel_further_math', NULL, 'Find the Maclaurin series expansion of eˣ up to the x³ term.'",
    );
    expect(source).toContain(
      `'["A. 1 + x + x²/2 + x³/6", "B. 1 + x + x² + x³", "C. x + x²/2 + x³/6", "D. 1 + x + x²/2! + x³/3!"]'`,
    );
  });
});
