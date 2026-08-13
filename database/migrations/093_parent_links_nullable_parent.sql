-- Migration 093: parent_student_links.parent_id must be nullable.
-- The student generates an invite BEFORE any parent exists; the handler
-- inserts parent_id = '' which violates the FK (no user with id=''), so
-- POST /students/parent-invite 500'd in prod. The redeem flow fills
-- parent_id in when the parent accepts the code.
-- Table has 0 rows in prod; rebuild follows the proven 092 pattern.

PRAGMA foreign_keys = OFF;

CREATE TABLE parent_student_links_new (
    id TEXT PRIMARY KEY,
    parent_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE,
    invite_code_expires_at TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked', 'expired')),
    relationship_type TEXT DEFAULT 'parent' CHECK (relationship_type IN ('parent', 'guardian')),
    student_opted_out INTEGER DEFAULT 0,
    opted_out_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    verified_at TEXT,
    UNIQUE(parent_id, student_id)
);

INSERT INTO parent_student_links_new SELECT * FROM parent_student_links;

DROP TABLE parent_student_links;

ALTER TABLE parent_student_links_new RENAME TO parent_student_links;

CREATE INDEX idx_parent_links_parent ON parent_student_links(parent_id);
CREATE INDEX idx_parent_links_student ON parent_student_links(student_id);
CREATE INDEX idx_parent_links_code ON parent_student_links(invite_code);
CREATE INDEX idx_parent_links_status ON parent_student_links(status);

PRAGMA foreign_keys = ON;
