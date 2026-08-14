import { describe, expect, it } from 'vitest';
import { createMockD1 } from './helpers/mockD1';
import {
  FAMILY_STAFF_ACCESS,
  PARENT_ADMIN_ACCESS,
  REPORT_ACCESS,
  STAFF_ACCESS,
  buildStudentAccessPredicate,
  hasStudentAccess,
  isRoleAllowed,
} from '../counselor-authorization';

describe('Counselor row-level authorization', () => {
  it('fails closed for missing, unknown, and disabled roles', () => {
    expect(isRoleAllowed(undefined, REPORT_ACCESS)).toBe(false);
    expect(isRoleAllowed('counselor', REPORT_ACCESS)).toBe(false);
    expect(isRoleAllowed('student', FAMILY_STAFF_ACCESS)).toBe(false);
    expect(isRoleAllowed('teacher', PARENT_ADMIN_ACCESS)).toBe(false);

    expect(buildStudentAccessPredicate('student', 'student_1', 'wa.student_id', FAMILY_STAFF_ACCESS))
      .toEqual({ sql: '0 = 1', binds: [] });
  });

  it('scopes students to their own row', () => {
    expect(buildStudentAccessPredicate('student', 'student_1', 'cr.student_id', REPORT_ACCESS))
      .toEqual({ sql: 'cr.student_id = ?', binds: ['student_1'] });
  });

  it('uses the canonical active, non-opted-out parent relationship', () => {
    const scope = buildStudentAccessPredicate('parent', 'parent_1', 'wa.student_id', FAMILY_STAFF_ACCESS);
    expect(scope.binds).toEqual(['parent_1']);
    expect(scope.sql).toMatch(/FROM parent_student_links psl/);
    expect(scope.sql).toMatch(/psl\.student_id = wa\.student_id/);
    expect(scope.sql).toMatch(/psl\.status = 'active'/);
    expect(scope.sql).toMatch(/psl\.student_opted_out = 0/);
    expect(scope.sql).not.toMatch(/student_parent_links/);
  });

  it('scopes teachers through active class membership and ownership', () => {
    const scope = buildStudentAccessPredicate('teacher', 'teacher_1', 'pcm.student_id', STAFF_ACCESS);
    expect(scope.binds).toEqual(['teacher_1']);
    expect(scope.sql).toMatch(/FROM class_members cm/);
    expect(scope.sql).toMatch(/JOIN classes cl ON cl\.id = cm\.class_id/);
    expect(scope.sql).toMatch(/cm\.student_id = pcm\.student_id/);
    expect(scope.sql).toMatch(/cl\.teacher_id = \?/);
  });

  it('allows admin scope without accepting a caller-provided SQL column', () => {
    expect(buildStudentAccessPredicate('admin', 'admin_1', 'rs.student_id', PARENT_ADMIN_ACCESS))
      .toEqual({ sql: '1 = 1', binds: [] });
  });

  it('checks a target student and the role predicate in one query', async () => {
    const db = createMockD1([{
      match: /SELECT 1 AS allowed[\s\S]*FROM users student/,
      first: () => ({ allowed: 1 }),
    }]);

    await expect(hasStudentAccess(
      db as unknown as D1Database,
      'teacher',
      'teacher_1',
      'student_1',
      STAFF_ACCESS,
    )).resolves.toBe(true);

    expect(db.calls[0].binds).toEqual(['student_1', 'teacher_1']);
    expect(db.calls[0].sql).toMatch(/cm\.student_id = student\.id/);
  });

  it('does not query when the role is denied by policy', async () => {
    const db = createMockD1([]);
    await expect(hasStudentAccess(
      db as unknown as D1Database,
      'student',
      'student_1',
      'student_1',
      FAMILY_STAFF_ACCESS,
    )).resolves.toBe(false);
    expect(db.calls).toHaveLength(0);
  });
});
