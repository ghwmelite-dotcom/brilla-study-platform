-- Migration: Add Chat System
-- Description: Tables for real-time messaging, rooms, and direct messages

-- Chat rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('dm', 'public', 'private', 'subject')),
    subject_id TEXT,
    exam_type_id TEXT,
    avatar_url TEXT,
    is_archived INTEGER DEFAULT 0,
    max_members INTEGER DEFAULT 500,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Chat room members table
CREATE TABLE IF NOT EXISTS chat_room_members (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
    nickname TEXT,
    is_muted INTEGER DEFAULT 0,
    muted_until TEXT,
    joined_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_read_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(room_id, user_id),
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'system')),
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    reply_to_id TEXT,
    is_edited INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    deleted_by TEXT,
    deleted_reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (reply_to_id) REFERENCES chat_messages(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Chat message reactions table
CREATE TABLE IF NOT EXISTS chat_message_reactions (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(message_id, user_id, emoji),
    FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chat user blocks table
CREATE TABLE IF NOT EXISTS chat_user_blocks (
    id TEXT PRIMARY KEY,
    blocker_id TEXT NOT NULL,
    blocked_id TEXT NOT NULL,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(blocker_id, blocked_id),
    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chat typing indicators (for polling)
CREATE TABLE IF NOT EXISTS chat_typing_indicators (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    UNIQUE(room_id, user_id),
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON chat_rooms(type);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON chat_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_subject ON chat_rooms(subject_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room ON chat_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user ON chat_room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply ON chat_messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_message ON chat_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_user ON chat_message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_blocks_blocker ON chat_user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_chat_blocks_blocked ON chat_user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_chat_typing_room ON chat_typing_indicators(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_typing_expires ON chat_typing_indicators(expires_at);
