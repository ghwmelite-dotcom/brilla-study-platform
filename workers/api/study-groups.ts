import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';
import { parseLimit, parseJsonBody } from './http';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface UserPayload {
  userId: string;
  email?: string;
  role?: string;
}

const studyGroupsApp = new Hono<{ Bindings: Env; Variables: { user: UserPayload } }>();

// All study group routes require a verified JWT (sets user on context).
studyGroupsApp.use('*', requireAuth);

const generateId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const NAME_MAX = 80;
const DESCRIPTION_MAX = 500;
const MESSAGE_MAX = 2000;
const MAX_MEMBERS_CAP = 100;
const WEEKLY_GOAL_CAP = 1_000_000;

interface StudyGroupRow {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  owner_id: string;
  subject_id: string | null;
  is_public: number;
  max_members: number;
  weekly_goal_xp: number;
  created_at: string;
}

const GROUP_LIST_SELECT = `
  SELECT g.id, g.name, g.description, g.icon, g.color, g.owner_id, g.subject_id,
         g.is_public, g.max_members, g.weekly_goal_xp, g.created_at,
         (SELECT COUNT(*) FROM study_group_members m WHERE m.group_id = g.id) AS member_count,
         (SELECT COALESCE(SUM(m.weekly_xp_contribution), 0) FROM study_group_members m WHERE m.group_id = g.id) AS weekly_progress
  FROM study_groups g
`;

async function getGroup(db: D1Database, groupId: string): Promise<StudyGroupRow | null> {
  return db
    .prepare(
      `SELECT id, name, description, icon, color, owner_id, subject_id, is_public,
              max_members, weekly_goal_xp, created_at
       FROM study_groups WHERE id = ?`,
    )
    .bind(groupId)
    .first<StudyGroupRow>();
}

async function getMembership(
  db: D1Database,
  groupId: string,
  userId: string,
): Promise<{ id: string; role: string } | null> {
  return db
    .prepare('SELECT id, role FROM study_group_members WHERE group_id = ? AND user_id = ?')
    .bind(groupId, userId)
    .first<{ id: string; role: string }>();
}

function sanitizeName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const name = raw.trim();
  if (name.length < 2 || name.length > NAME_MAX) return null;
  return name;
}

function sanitizeDescription(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.slice(0, DESCRIPTION_MAX) || null;
}

// GET /my — groups the authed user belongs to.
studyGroupsApp.get('/my', async (c) => {
  const user = c.get('user');
  try {
    const { results } = await c.env.DB.prepare(
      `${GROUP_LIST_SELECT}
       JOIN study_group_members me ON me.group_id = g.id AND me.user_id = ?
       ORDER BY g.created_at DESC`,
    )
      .bind(user.userId)
      .all();
    return c.json({ success: true, data: { groups: results } });
  } catch (error) {
    console.error('Error fetching my study groups:', error);
    return c.json({ success: false, error: 'Failed to fetch groups' }, 500);
  }
});

// GET /public — discoverable public groups.
studyGroupsApp.get('/public', async (c) => {
  const limit = parseLimit(c, 50, 100);
  try {
    const { results } = await c.env.DB.prepare(
      `${GROUP_LIST_SELECT}
       WHERE g.is_public = 1
       ORDER BY member_count DESC, g.created_at DESC
       LIMIT ?`,
    )
      .bind(limit)
      .all();
    return c.json({ success: true, data: { groups: results } });
  } catch (error) {
    console.error('Error fetching public study groups:', error);
    return c.json({ success: false, error: 'Failed to fetch groups' }, 500);
  }
});

// POST / — create a group; the creator becomes its owner member.
studyGroupsApp.post('/', async (c) => {
  const user = c.get('user');
  const body = await parseJsonBody(c);
  if (!body) return c.json({ success: false, error: 'Invalid JSON body' }, 400);

  const name = sanitizeName(body.name);
  if (!name) {
    return c.json(
      { success: false, error: `Group name must be between 2 and ${NAME_MAX} characters` },
      400,
    );
  }
  const description = sanitizeDescription(body.description);
  if (body.description != null && typeof body.description !== 'string') {
    return c.json({ success: false, error: 'Description must be a string' }, 400);
  }

  const isPublic = body.is_public === undefined ? 1 : body.is_public ? 1 : 0;

  let maxMembers = 20;
  if (body.max_members !== undefined) {
    const n = Number(body.max_members);
    if (!Number.isInteger(n) || n < 2 || n > MAX_MEMBERS_CAP) {
      return c.json(
        { success: false, error: `max_members must be an integer between 2 and ${MAX_MEMBERS_CAP}` },
        400,
      );
    }
    maxMembers = n;
  }

  let weeklyGoalXp = 1000;
  if (body.weekly_goal_xp !== undefined) {
    const n = Number(body.weekly_goal_xp);
    if (!Number.isInteger(n) || n < 0 || n > WEEKLY_GOAL_CAP) {
      return c.json(
        { success: false, error: `weekly_goal_xp must be an integer between 0 and ${WEEKLY_GOAL_CAP}` },
        400,
      );
    }
    weeklyGoalXp = n;
  }

  const subjectId = typeof body.subject_id === 'string' && body.subject_id ? body.subject_id : null;

  const groupId = generateId('sg');
  const memberId = generateId('sgm');
  try {
    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO study_groups (id, name, description, owner_id, subject_id, is_public, max_members, weekly_goal_xp, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ).bind(groupId, name, description, user.userId, subjectId, isPublic, maxMembers, weeklyGoalXp),
      c.env.DB.prepare(
        `INSERT INTO study_group_members (id, group_id, user_id, role, joined_at, last_active)
         VALUES (?, ?, ?, 'owner', datetime('now'), datetime('now'))`,
      ).bind(memberId, groupId, user.userId),
    ]);
    return c.json({ success: true, data: { group_id: groupId } });
  } catch (error) {
    console.error('Error creating study group:', error);
    return c.json({ success: false, error: 'Failed to create group' }, 500);
  }
});

// GET /:id — group detail + members. Members always; non-members only for
// public groups (private group details stay behind membership).
studyGroupsApp.get('/:id', async (c) => {
  const user = c.get('user');
  const groupId = c.req.param('id');
  try {
    const group = await getGroup(c.env.DB, groupId);
    if (!group) return c.json({ success: false, error: 'Group not found' }, 404);

    const membership = await getMembership(c.env.DB, groupId, user.userId);
    if (!membership && group.is_public !== 1) {
      return c.json({ success: false, error: 'Group not found' }, 404);
    }

    const { results: members } = await c.env.DB.prepare(
      `SELECT m.id, m.group_id, m.user_id, u.name AS user_name, u.avatar_url AS user_avatar,
              m.role, m.weekly_xp_contribution, m.joined_at, m.last_active
       FROM study_group_members m
       JOIN users u ON u.id = m.user_id
       WHERE m.group_id = ?
       ORDER BY m.weekly_xp_contribution DESC, m.joined_at ASC`,
    )
      .bind(groupId)
      .all();

    return c.json({ success: true, data: { group, members } });
  } catch (error) {
    console.error('Error fetching study group:', error);
    return c.json({ success: false, error: 'Failed to fetch group' }, 500);
  }
});

// PUT /:id — update group settings (owner/admin members only).
studyGroupsApp.put('/:id', async (c) => {
  const user = c.get('user');
  const groupId = c.req.param('id');
  const body = await parseJsonBody(c);
  if (!body) return c.json({ success: false, error: 'Invalid JSON body' }, 400);

  try {
    const group = await getGroup(c.env.DB, groupId);
    if (!group) return c.json({ success: false, error: 'Group not found' }, 404);

    const membership = await getMembership(c.env.DB, groupId, user.userId);
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return c.json({ success: false, error: 'Only group owners and admins can update the group' }, 403);
    }

    const updates: { sql: string; value: unknown }[] = [];

    if (body.name !== undefined) {
      const name = sanitizeName(body.name);
      if (!name) {
        return c.json(
          { success: false, error: `Group name must be between 2 and ${NAME_MAX} characters` },
          400,
        );
      }
      updates.push({ sql: 'name = ?', value: name });
    }
    if (body.description !== undefined) {
      if (body.description !== null && typeof body.description !== 'string') {
        return c.json({ success: false, error: 'Description must be a string' }, 400);
      }
      updates.push({ sql: 'description = ?', value: sanitizeDescription(body.description) });
    }
    if (body.is_public !== undefined) {
      updates.push({ sql: 'is_public = ?', value: body.is_public ? 1 : 0 });
    }
    if (body.max_members !== undefined) {
      const n = Number(body.max_members);
      if (!Number.isInteger(n) || n < 2 || n > MAX_MEMBERS_CAP) {
        return c.json(
          { success: false, error: `max_members must be an integer between 2 and ${MAX_MEMBERS_CAP}` },
          400,
        );
      }
      const countRow = await c.env.DB.prepare(
        'SELECT COUNT(*) AS cnt FROM study_group_members WHERE group_id = ?',
      )
        .bind(groupId)
        .first<{ cnt: number }>();
      if ((countRow?.cnt ?? 0) > n) {
        return c.json(
          { success: false, error: 'max_members cannot be below the current member count' },
          400,
        );
      }
      updates.push({ sql: 'max_members = ?', value: n });
    }
    if (body.weekly_goal_xp !== undefined) {
      const n = Number(body.weekly_goal_xp);
      if (!Number.isInteger(n) || n < 0 || n > WEEKLY_GOAL_CAP) {
        return c.json(
          { success: false, error: `weekly_goal_xp must be an integer between 0 and ${WEEKLY_GOAL_CAP}` },
          400,
        );
      }
      updates.push({ sql: 'weekly_goal_xp = ?', value: n });
    }

    if (updates.length === 0) {
      return c.json({ success: false, error: 'No valid fields to update' }, 400);
    }

    await c.env.DB.prepare(
      `UPDATE study_groups SET ${updates.map((u) => u.sql).join(', ')}, updated_at = datetime('now') WHERE id = ?`,
    )
      .bind(...updates.map((u) => u.value), groupId)
      .run();

    return c.json({ success: true, message: 'Group updated' });
  } catch (error) {
    console.error('Error updating study group:', error);
    return c.json({ success: false, error: 'Failed to update group' }, 500);
  }
});

// DELETE /:id — owner only; memberships/messages cascade via schema.
studyGroupsApp.delete('/:id', async (c) => {
  const user = c.get('user');
  const groupId = c.req.param('id');
  try {
    const group = await getGroup(c.env.DB, groupId);
    if (!group) return c.json({ success: false, error: 'Group not found' }, 404);
    if (group.owner_id !== user.userId) {
      return c.json({ success: false, error: 'Only the group owner can delete the group' }, 403);
    }
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM study_group_messages WHERE group_id = ?').bind(groupId),
      c.env.DB.prepare('DELETE FROM study_group_members WHERE group_id = ?').bind(groupId),
      c.env.DB.prepare('DELETE FROM study_groups WHERE id = ?').bind(groupId),
    ]);
    return c.json({ success: true, message: 'Group deleted' });
  } catch (error) {
    console.error('Error deleting study group:', error);
    return c.json({ success: false, error: 'Failed to delete group' }, 500);
  }
});

// POST /:id/join — public groups only, capped at max_members.
studyGroupsApp.post('/:id/join', async (c) => {
  const user = c.get('user');
  const groupId = c.req.param('id');
  try {
    const group = await getGroup(c.env.DB, groupId);
    if (!group) return c.json({ success: false, error: 'Group not found' }, 404);
    if (group.is_public !== 1) {
      return c.json({ success: false, error: 'This group is private' }, 403);
    }

    const existing = await getMembership(c.env.DB, groupId, user.userId);
    if (existing) return c.json({ success: true, message: 'Already a member' });

    const countRow = await c.env.DB.prepare(
      'SELECT COUNT(*) AS cnt FROM study_group_members WHERE group_id = ?',
    )
      .bind(groupId)
      .first<{ cnt: number }>();
    if ((countRow?.cnt ?? 0) >= group.max_members) {
      return c.json({ success: false, error: 'This group is full' }, 409);
    }

    await c.env.DB.prepare(
      `INSERT INTO study_group_members (id, group_id, user_id, role, joined_at, last_active)
       VALUES (?, ?, ?, 'member', datetime('now'), datetime('now'))`,
    )
      .bind(generateId('sgm'), groupId, user.userId)
      .run();

    return c.json({ success: true, message: 'Joined group successfully' });
  } catch (error) {
    console.error('Error joining study group:', error);
    return c.json({ success: false, error: 'Failed to join group' }, 500);
  }
});

// POST /:id/leave — members can leave; the owner must delete the group instead.
studyGroupsApp.post('/:id/leave', async (c) => {
  const user = c.get('user');
  const groupId = c.req.param('id');
  try {
    const membership = await getMembership(c.env.DB, groupId, user.userId);
    if (!membership) return c.json({ success: false, error: 'You are not a member of this group' }, 404);
    if (membership.role === 'owner') {
      return c.json(
        { success: false, error: 'The group owner cannot leave; delete the group instead' },
        400,
      );
    }
    await c.env.DB.prepare('DELETE FROM study_group_members WHERE id = ?').bind(membership.id).run();
    return c.json({ success: true, message: 'Left group successfully' });
  } catch (error) {
    console.error('Error leaving study group:', error);
    return c.json({ success: false, error: 'Failed to leave group' }, 500);
  }
});

// GET /:id/messages — group feed, members only. Newest last for chat rendering.
studyGroupsApp.get('/:id/messages', async (c) => {
  const user = c.get('user');
  const groupId = c.req.param('id');
  const limit = parseLimit(c, 50, 100);
  try {
    const membership = await getMembership(c.env.DB, groupId, user.userId);
    if (!membership) {
      return c.json({ success: false, error: 'You must be a member to read messages' }, 403);
    }
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM (
         SELECT m.id, m.group_id, m.user_id, u.name AS user_name, u.avatar_url AS user_avatar,
                m.message, m.message_type, m.created_at
         FROM study_group_messages m
         JOIN users u ON u.id = m.user_id
         WHERE m.group_id = ?
         ORDER BY m.created_at DESC
         LIMIT ?
       ) ORDER BY created_at ASC`,
    )
      .bind(groupId, limit)
      .all();
    return c.json({ success: true, data: { messages: results } });
  } catch (error) {
    console.error('Error fetching study group messages:', error);
    return c.json({ success: false, error: 'Failed to fetch messages' }, 500);
  }
});

// POST /:id/messages — members only; user posts are always message_type 'text'
// so clients cannot spoof achievement/milestone system messages.
studyGroupsApp.post('/:id/messages', async (c) => {
  const user = c.get('user');
  const groupId = c.req.param('id');
  const body = await parseJsonBody(c);
  if (!body) return c.json({ success: false, error: 'Invalid JSON body' }, 400);

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > MESSAGE_MAX) {
    return c.json(
      { success: false, error: `Message must be between 1 and ${MESSAGE_MAX} characters` },
      400,
    );
  }

  try {
    const membership = await getMembership(c.env.DB, groupId, user.userId);
    if (!membership) {
      return c.json({ success: false, error: 'You must be a member to post messages' }, 403);
    }

    const messageId = generateId('sgmsg');
    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO study_group_messages (id, group_id, user_id, message, message_type, created_at)
         VALUES (?, ?, ?, ?, 'text', datetime('now'))`,
      ).bind(messageId, groupId, user.userId, message),
      c.env.DB.prepare(
        `UPDATE study_group_members SET last_active = datetime('now') WHERE id = ?`,
      ).bind(membership.id),
    ]);

    return c.json({ success: true, data: { message_id: messageId } });
  } catch (error) {
    console.error('Error posting study group message:', error);
    return c.json({ success: false, error: 'Failed to send message' }, 500);
  }
});

export { studyGroupsApp };
