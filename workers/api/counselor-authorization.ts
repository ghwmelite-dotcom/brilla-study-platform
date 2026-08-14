export type CounselorRole = 'student' | 'parent' | 'teacher' | 'admin';

export type StudentColumn =
  | 'student.id'
  | 'cr.student_id'
  | 'wa.student_id'
  | 'pcm.student_id'
  | 'rs.student_id'
  | 'cc.user_id';

export interface CounselorAccessPolicy {
  student: boolean;
  parent: boolean;
  teacher: boolean;
  admin: boolean;
}

export interface StudentAccessPredicate {
  sql: string;
  binds: string[];
}

export const REPORT_ACCESS: CounselorAccessPolicy = {
  student: true,
  parent: true,
  teacher: true,
  admin: true,
};

export const FAMILY_STAFF_ACCESS: CounselorAccessPolicy = {
  student: false,
  parent: true,
  teacher: true,
  admin: true,
};

export const PARENT_ADMIN_ACCESS: CounselorAccessPolicy = {
  student: false,
  parent: true,
  teacher: false,
  admin: true,
};

export const PARENT_ONLY_ACCESS: CounselorAccessPolicy = {
  student: false,
  parent: true,
  teacher: false,
  admin: false,
};

export const STAFF_ACCESS: CounselorAccessPolicy = {
  student: false,
  parent: false,
  teacher: true,
  admin: true,
};

export function isCounselorRole(role: string | undefined): role is CounselorRole {
  return role === 'student' || role === 'parent' || role === 'teacher' || role === 'admin';
}

export function isRoleAllowed(
  role: string | undefined,
  policy: CounselorAccessPolicy,
): role is CounselorRole {
  return isCounselorRole(role) && policy[role];
}

/**
 * Builds a row-level student scope using only trusted, compile-time column
 * names. Callers must still reject roles that are disabled by their policy;
 * the deny predicate is a final fail-closed backstop.
 */
export function buildStudentAccessPredicate(
  role: string | undefined,
  userId: string,
  studentColumn: StudentColumn,
  policy: CounselorAccessPolicy,
): StudentAccessPredicate {
  if (!isRoleAllowed(role, policy)) {
    return { sql: '0 = 1', binds: [] };
  }

  switch (role) {
    case 'student':
      return { sql: `${studentColumn} = ?`, binds: [userId] };
    case 'parent':
      return {
        sql: `EXISTS (
          SELECT 1
          FROM parent_student_links psl
          WHERE psl.parent_id = ?
            AND psl.student_id = ${studentColumn}
            AND psl.status = 'active'
            AND psl.student_opted_out = 0
        )`,
        binds: [userId],
      };
    case 'teacher':
      return {
        sql: `EXISTS (
          SELECT 1
          FROM class_members cm
          JOIN classes cl ON cl.id = cm.class_id
          WHERE cm.student_id = ${studentColumn}
            AND cm.is_active = 1
            AND cl.teacher_id = ?
            AND cl.is_active = 1
        )`,
        binds: [userId],
      };
    case 'admin':
      return { sql: '1 = 1', binds: [] };
  }
}

export async function hasStudentAccess(
  db: D1Database,
  role: string | undefined,
  userId: string,
  studentId: string,
  policy: CounselorAccessPolicy,
): Promise<boolean> {
  if (!isRoleAllowed(role, policy)) return false;

  const scope = buildStudentAccessPredicate(role, userId, 'student.id', policy);
  const result = await db.prepare(`
    SELECT 1 AS allowed
    FROM users student
    WHERE student.id = ?
      AND student.role = 'student'
      AND ${scope.sql}
    LIMIT 1
  `).bind(studentId, ...scope.binds).first<{ allowed: number }>();

  return !!result;
}
