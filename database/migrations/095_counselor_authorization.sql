-- Migration 095: Counselor privacy and schema alignment.
-- The API already presents an alert title; the original table omitted it.
ALTER TABLE wellbeing_alerts ADD COLUMN title TEXT;

-- Support the canonical relationship predicate used by every Counselor route.
CREATE INDEX IF NOT EXISTS idx_parent_links_access
ON parent_student_links(parent_id, student_id, status, student_opted_out);

-- Support assigned-teacher student authorization without a table scan.
CREATE INDEX IF NOT EXISTS idx_class_members_student_active
ON class_members(student_id, is_active, class_id);
