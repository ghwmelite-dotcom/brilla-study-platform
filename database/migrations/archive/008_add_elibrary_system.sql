-- E-Library System Migration
-- Adds tables for digital library with multimedia resources, collections, ratings, and progress tracking

-- Library Resources (PDFs, videos, audio, documents, interactive content, links)
CREATE TABLE IF NOT EXISTS library_resources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('pdf', 'video', 'audio', 'document', 'interactive', 'link')),
    content_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size INTEGER,
    duration INTEGER,
    subject_id TEXT REFERENCES subjects(id),
    topic_id TEXT REFERENCES topics(id),
    school_level TEXT CHECK (school_level IN ('jhs', 'shs', 'both')),
    access_level TEXT DEFAULT 'free' CHECK (access_level IN ('free', 'basic', 'premium')),
    tags TEXT,
    uploaded_by TEXT NOT NULL REFERENCES users(id),
    is_featured INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    views INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- User Collections (Bookmarks/Playlists)
CREATE TABLE IF NOT EXISTS library_collections (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public INTEGER DEFAULT 0,
    color TEXT DEFAULT '#3B82F6',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Collection Items
CREATE TABLE IF NOT EXISTS library_collection_items (
    id TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL REFERENCES library_collections(id) ON DELETE CASCADE,
    resource_id TEXT NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    added_at TEXT DEFAULT (datetime('now')),
    UNIQUE(collection_id, resource_id)
);

-- Resource Ratings
CREATE TABLE IF NOT EXISTS library_ratings (
    id TEXT PRIMARY KEY,
    resource_id TEXT NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(resource_id, user_id)
);

-- Access Logs (for analytics)
CREATE TABLE IF NOT EXISTS library_access_logs (
    id TEXT PRIMARY KEY,
    resource_id TEXT NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('view', 'download', 'complete')),
    progress INTEGER DEFAULT 0,
    accessed_at TEXT DEFAULT (datetime('now'))
);

-- Reading/Viewing Progress (for PDFs/videos)
CREATE TABLE IF NOT EXISTS library_progress (
    id TEXT PRIMARY KEY,
    resource_id TEXT NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    progress_percent INTEGER DEFAULT 0,
    last_position TEXT,
    completed INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(resource_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_library_resources_type ON library_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_library_resources_subject ON library_resources(subject_id);
CREATE INDEX IF NOT EXISTS idx_library_resources_topic ON library_resources(topic_id);
CREATE INDEX IF NOT EXISTS idx_library_resources_level ON library_resources(school_level);
CREATE INDEX IF NOT EXISTS idx_library_resources_featured ON library_resources(is_featured);
CREATE INDEX IF NOT EXISTS idx_library_resources_active ON library_resources(is_active);
CREATE INDEX IF NOT EXISTS idx_library_collections_owner ON library_collections(owner_id);
CREATE INDEX IF NOT EXISTS idx_library_collection_items_collection ON library_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_library_ratings_resource ON library_ratings(resource_id);
CREATE INDEX IF NOT EXISTS idx_library_ratings_user ON library_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_library_access_logs_resource ON library_access_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_library_access_logs_user ON library_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_library_progress_user ON library_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_library_progress_resource ON library_progress(resource_id);
