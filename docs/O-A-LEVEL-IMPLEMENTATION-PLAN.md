# O-Level & A-Level Implementation Plan

## Overview

This document outlines the comprehensive plan to integrate Cambridge and Edexcel O-Level (IGCSE) and A-Level exam preparation into the Brilla Study Platform.

---

## Phase 1: Database Schema Extensions

### New Tables Required

#### 1. `exam_boards` - Examination Board Registry
```sql
CREATE TABLE IF NOT EXISTS exam_boards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,              -- "Cambridge International" / "Edexcel"
    code TEXT UNIQUE NOT NULL,       -- "CAIE" / "EDEXCEL"
    full_name TEXT,                  -- "Cambridge Assessment International Education"
    region TEXT DEFAULT 'International',
    website_url TEXT,
    logo_url TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);
```

#### 2. `subject_specifications` - Syllabus/Specification Registry
```sql
CREATE TABLE IF NOT EXISTS subject_specifications (
    id TEXT PRIMARY KEY,
    exam_board_id TEXT NOT NULL REFERENCES exam_boards(id),
    subject_id TEXT NOT NULL REFERENCES subjects(id),
    exam_type_id TEXT NOT NULL REFERENCES exam_types(id),
    syllabus_code TEXT NOT NULL,     -- "0625" for IGCSE Physics
    syllabus_name TEXT NOT NULL,     -- "Physics"
    specification_year TEXT,          -- "2023-2025"
    valid_from TEXT,
    valid_to TEXT,
    syllabus_pdf_url TEXT,
    specimen_papers_url TEXT,
    total_papers INTEGER,             -- Number of paper components
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(exam_board_id, syllabus_code, specification_year)
);
```

#### 3. `paper_components` - Paper Structure Definition
```sql
CREATE TABLE IF NOT EXISTS paper_components (
    id TEXT PRIMARY KEY,
    specification_id TEXT NOT NULL REFERENCES subject_specifications(id),
    paper_number INTEGER NOT NULL,    -- 1, 2, 3, 4, etc.
    paper_name TEXT NOT NULL,         -- "Multiple Choice", "Theory", "Practical"
    paper_code TEXT,                  -- "0625/11", "0625/21"
    duration_minutes INTEGER,
    total_marks INTEGER,
    weighting_percent REAL,           -- % of total grade
    question_format TEXT CHECK (question_format IN ('mcq', 'structured', 'essay', 'practical', 'coursework', 'mixed')),
    is_compulsory INTEGER DEFAULT 1,
    tier TEXT CHECK (tier IN ('core', 'extended', 'foundation', 'higher', NULL)),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(specification_id, paper_number)
);
```

#### 4. `syllabus_topics` - Official Syllabus Learning Objectives
```sql
CREATE TABLE IF NOT EXISTS syllabus_topics (
    id TEXT PRIMARY KEY,
    specification_id TEXT NOT NULL REFERENCES subject_specifications(id),
    parent_id TEXT REFERENCES syllabus_topics(id),
    topic_code TEXT NOT NULL,         -- "1.1", "2.3.4"
    title TEXT NOT NULL,
    learning_objectives TEXT,         -- JSON array of objectives
    assessment_objectives TEXT,       -- Which AO it tests (AO1, AO2, AO3)
    command_words TEXT,               -- JSON array of expected command words
    tier TEXT CHECK (tier IN ('core', 'extended', 'both', NULL)),
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(specification_id, topic_code)
);
```

#### 5. `topic_syllabus_mapping` - Link Platform Topics to Syllabus Points
```sql
CREATE TABLE IF NOT EXISTS topic_syllabus_mapping (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES topics(id),
    syllabus_topic_id TEXT NOT NULL REFERENCES syllabus_topics(id),
    coverage_level TEXT DEFAULT 'full' CHECK (coverage_level IN ('full', 'partial', 'introduces')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(topic_id, syllabus_topic_id)
);
```

#### 6. `grade_boundaries` - Historical Grade Boundaries
```sql
CREATE TABLE IF NOT EXISTS grade_boundaries (
    id TEXT PRIMARY KEY,
    specification_id TEXT NOT NULL REFERENCES subject_specifications(id),
    paper_component_id TEXT REFERENCES paper_components(id),
    session TEXT NOT NULL,            -- "June 2023", "November 2023"
    year INTEGER NOT NULL,
    grade TEXT NOT NULL,              -- "A*", "A", "B", etc. or "9", "8", "7"
    raw_mark INTEGER NOT NULL,
    ums_mark INTEGER,                 -- Uniform Mark Scale (if applicable)
    percentage REAL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(specification_id, paper_component_id, session, grade)
);
```

#### 7. `past_paper_files` - PDF Storage for Past Papers
```sql
CREATE TABLE IF NOT EXISTS past_paper_files (
    id TEXT PRIMARY KEY,
    past_paper_id TEXT NOT NULL REFERENCES past_papers(id),
    file_type TEXT NOT NULL CHECK (file_type IN ('question_paper', 'mark_scheme', 'examiner_report', 'specimen', 'insert')),
    file_url TEXT NOT NULL,           -- R2 storage URL
    file_size INTEGER,
    page_count INTEGER,
    is_premium INTEGER DEFAULT 0,
    uploaded_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(past_paper_id, file_type)
);
```

#### 8. `user_target_grades` - Student Grade Goals
```sql
CREATE TABLE IF NOT EXISTS user_target_grades (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    specification_id TEXT NOT NULL REFERENCES subject_specifications(id),
    target_grade TEXT NOT NULL,       -- "A*", "A", "B", etc.
    current_predicted TEXT,
    exam_session TEXT,                -- "June 2024"
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, specification_id)
);
```

#### 9. `command_words` - Assessment Command Word Definitions
```sql
CREATE TABLE IF NOT EXISTS command_words (
    id TEXT PRIMARY KEY,
    word TEXT UNIQUE NOT NULL,        -- "Explain", "Calculate", "Evaluate"
    definition TEXT NOT NULL,
    marks_guidance TEXT,              -- How to approach for marks
    example_usage TEXT,
    typical_marks_range TEXT,         -- "2-4 marks"
    exam_board_id TEXT REFERENCES exam_boards(id),
    created_at TEXT DEFAULT (datetime('now'))
);
```

### Schema Modifications

#### Extend `exam_types` table
```sql
ALTER TABLE exam_types ADD COLUMN exam_board_id TEXT REFERENCES exam_boards(id);
ALTER TABLE exam_types ADD COLUMN level TEXT CHECK (level IN ('GCSE', 'IGCSE', 'AS', 'A2', 'A-Level', 'O-Level', NULL));
ALTER TABLE exam_types ADD COLUMN grading_scale TEXT CHECK (grading_scale IN ('A*-G', '9-1', 'A*-E', NULL));
```

#### Extend `past_papers` table
```sql
ALTER TABLE past_papers ADD COLUMN exam_board_id TEXT REFERENCES exam_boards(id);
ALTER TABLE past_papers ADD COLUMN specification_id TEXT REFERENCES subject_specifications(id);
ALTER TABLE past_papers ADD COLUMN paper_component_id TEXT REFERENCES paper_components(id);
ALTER TABLE past_papers ADD COLUMN variant TEXT;          -- "11", "12", "13" etc.
ALTER TABLE past_papers ADD COLUMN session TEXT;          -- "June", "November"
ALTER TABLE past_papers ADD COLUMN tier TEXT;             -- "Core", "Extended"
ALTER TABLE past_papers ADD COLUMN has_mark_scheme INTEGER DEFAULT 0;
ALTER TABLE past_papers ADD COLUMN has_examiner_report INTEGER DEFAULT 0;
```

#### Extend `questions` table
```sql
ALTER TABLE questions ADD COLUMN syllabus_topic_id TEXT REFERENCES syllabus_topics(id);
ALTER TABLE questions ADD COLUMN command_word TEXT;
ALTER TABLE questions ADD COLUMN assessment_objective TEXT; -- "AO1", "AO2", "AO3"
ALTER TABLE questions ADD COLUMN source_paper_code TEXT;    -- "0625/21/M/J/23"
ALTER TABLE questions ADD COLUMN source_question_number TEXT;
```

---

## Phase 2: Initial Data Seeding

### Exam Boards
```javascript
const examBoards = [
  {
    id: 'board_cambridge',
    name: 'Cambridge International',
    code: 'CAIE',
    full_name: 'Cambridge Assessment International Education',
    website_url: 'https://www.cambridgeinternational.org'
  },
  {
    id: 'board_edexcel',
    name: 'Edexcel',
    code: 'EDEXCEL',
    full_name: 'Pearson Edexcel',
    website_url: 'https://qualifications.pearson.com'
  }
];
```

### Exam Types (O-Level & A-Level)
```javascript
const examTypes = [
  // Cambridge
  { id: 'igcse', name: 'IGCSE', slug: 'igcse', exam_board_id: 'board_cambridge', level: 'IGCSE', grading_scale: 'A*-G' },
  { id: 'cambridge_as', name: 'Cambridge AS Level', slug: 'cambridge-as', exam_board_id: 'board_cambridge', level: 'AS', grading_scale: 'A*-E' },
  { id: 'cambridge_a2', name: 'Cambridge A Level', slug: 'cambridge-a-level', exam_board_id: 'board_cambridge', level: 'A-Level', grading_scale: 'A*-E' },

  // Edexcel
  { id: 'edexcel_igcse', name: 'Edexcel IGCSE', slug: 'edexcel-igcse', exam_board_id: 'board_edexcel', level: 'IGCSE', grading_scale: '9-1' },
  { id: 'edexcel_as', name: 'Edexcel AS Level', slug: 'edexcel-as', exam_board_id: 'board_edexcel', level: 'AS', grading_scale: 'A*-E' },
  { id: 'edexcel_a2', name: 'Edexcel A Level', slug: 'edexcel-a-level', exam_board_id: 'board_edexcel', level: 'A-Level', grading_scale: 'A*-E' }
];
```

### STEM Core Subjects - Cambridge IGCSE
```javascript
const igcseSubjects = [
  { name: 'Mathematics', code: '0580', papers: 4 },
  { name: 'Additional Mathematics', code: '0606', papers: 2 },
  { name: 'Physics', code: '0625', papers: 3 },
  { name: 'Chemistry', code: '0620', papers: 3 },
  { name: 'Biology', code: '0610', papers: 3 }
];
```

### STEM Core Subjects - Cambridge A-Level
```javascript
const aLevelSubjects = [
  { name: 'Mathematics', code: '9709', papers: 6 },
  { name: 'Further Mathematics', code: '9231', papers: 4 },
  { name: 'Physics', code: '9702', papers: 5 },
  { name: 'Chemistry', code: '9701', papers: 5 },
  { name: 'Biology', code: '9700', papers: 5 }
];
```

---

## Phase 3: Frontend Components

### New Pages

#### 1. `/exam-setup` - Exam Configuration Wizard
- Select exam board (Cambridge/Edexcel)
- Select level (IGCSE, AS, A-Level)
- Choose subjects
- Set target grades
- Set exam session (June 2024, November 2024)

#### 2. `/syllabus/:specificationId` - Syllabus Browser
- Hierarchical view of syllabus topics
- Learning objectives per topic
- Coverage tracking (% complete)
- Link to relevant practice questions
- Command word reference

#### 3. `/past-papers/browse` - Enhanced Past Paper Browser
- Filter by: Board, Subject, Year, Session, Paper
- Show available materials (QP, MS, ER)
- Premium badge for restricted content
- Download/View options

#### 4. `/grade-predictor` - Grade Prediction Tool
- Input mock exam scores
- Compare against historical boundaries
- Show predicted grade range
- Improvement recommendations

#### 5. `/revision-planner` - Study Schedule Builder
- Input exam dates
- Auto-generate revision schedule
- Topic priority based on weakness
- Spaced repetition integration

### Component Modifications

#### TopicCard Enhancement
```tsx
// Add syllabus reference badge
<SyllabusBadge code="1.2.3" title="Forces and Motion" />

// Show exam board specific content
{examBoard === 'CAIE' && <CambridgeTips topic={topic} />}
```

#### QuestionCard Enhancement
```tsx
// Show source paper reference
<SourcePaper code="0625/21/M/J/23" questionNumber="4(a)" />

// Command word highlight
<CommandWordBadge word="Explain" marks={3} />
```

#### PastPaperViewer (New Component)
```tsx
// PDF viewer with annotation
// Side-by-side QP and MS view
// Mark tally calculator
// Timer for timed practice
```

---

## Phase 4: Content Migration Strategy

### Mapping WASSCE → O-Level Topics

| WASSCE Topic | Cambridge IGCSE Equivalent | Notes |
|--------------|---------------------------|-------|
| Mechanics | Forces and Motion (1.5) | 80% overlap |
| Waves | Waves (3) | 90% overlap |
| Electricity | Electricity (4) | 85% overlap |
| Heat | Thermal Physics (2) | 75% overlap |

### Content Gap Analysis Process

1. **Export existing topics** with question counts
2. **Map to Cambridge syllabus** points
3. **Identify gaps** where no existing questions
4. **Prioritize creation** based on:
   - Exam weighting
   - Past paper frequency
   - Student demand

### Question Tagging Workflow

```
For each existing question:
1. Identify closest syllabus point(s)
2. Add syllabus_topic_id reference
3. Tag with command_word
4. Assign assessment_objective (AO1/AO2/AO3)
5. Flag if needs modification for O/A Level
```

---

## Phase 5: Past Paper Integration

### Paper Digitization Pipeline

```
1. Upload PDF → R2 Storage
2. OCR Processing (optional AI-assisted)
3. Question extraction
4. Mark scheme linking
5. Topic tagging
6. Review & publish
```

### Available Years Target

| Board | Level | Years | Sessions | Status |
|-------|-------|-------|----------|--------|
| CAIE | IGCSE | 2015-2024 | June, Nov | Priority 1 |
| CAIE | AS/A2 | 2015-2024 | June, Nov | Priority 2 |
| Edexcel | IGCSE | 2018-2024 | Jan, June | Priority 3 |
| Edexcel | AS/A2 | 2018-2024 | Jan, June | Priority 4 |

### Mark Scheme Integration

- **MCQ papers**: Auto-mark with key
- **Structured papers**: Show marking points
- **Essay papers**: AI-grading with mark scheme rubric

---

## Phase 6: Advanced Features

### 1. Intelligent Question Selection
```javascript
// Select questions based on syllabus coverage gaps
function getRecommendedQuestions(userId, specificationId) {
  // Get user's syllabus progress
  // Identify weak areas
  // Weight recent papers higher
  // Mix difficulty levels
  // Ensure command word variety
}
```

### 2. Grade Boundary Analysis
```javascript
// Show historical trends
function getGradeTrends(specificationId, grade) {
  // Fetch last 5 years
  // Calculate averages
  // Show difficulty trends
  // Predict next session
}
```

### 3. Examiner Tips System
```javascript
const examinerTips = {
  topic: 'Equilibrium',
  tips: [
    'Always state the principle first',
    'Show clear working for moments',
    'Include direction of forces'
  ],
  commonMistakes: [
    'Forgetting to include reaction force',
    'Wrong units in calculation'
  ]
};
```

### 4. Paper Walker Mode
Interactive guided experience through a full paper:
- Question-by-question navigation
- Time tracking per question
- Instant feedback option
- Mark scheme reveal
- Running total display

---

## Phase 7: API Endpoints

### New Endpoints Required

```
GET  /api/exam-boards
GET  /api/specifications?boardId=&level=
GET  /api/specifications/:id/syllabus
GET  /api/specifications/:id/papers
GET  /api/papers/:id/files
GET  /api/grade-boundaries?specId=&session=
POST /api/users/target-grades
GET  /api/users/syllabus-progress/:specId
GET  /api/topics/:id/syllabus-mapping
POST /api/papers/upload (admin)
POST /api/questions/import-from-paper (admin)
```

### Enhanced Endpoints

```
GET /api/questions?syllabusTopicId=&commandWord=&ao=
GET /api/past-papers?boardId=&subjectCode=&year=&session=
GET /api/progress/by-syllabus/:specificationId
```

---

## Phase 8: Admin Tools

### Content Management Additions

#### 1. Syllabus Manager
- Import syllabus structure from JSON/CSV
- Edit learning objectives
- Map existing topics
- Track coverage %

#### 2. Paper Importer
- Bulk upload past papers
- Auto-detect paper details from filename
- OCR question extraction
- Mark scheme parser

#### 3. Grade Boundary Manager
- Import boundaries from CSV
- Visualize trends
- Set predicted boundaries

#### 4. Content Mapping Tool
- Side-by-side WASSCE ↔ O-Level view
- Drag-drop topic mapping
- Gap highlighting
- Bulk operations

---

## Implementation Timeline (Suggested Order)

### Milestone 1: Foundation
- [ ] Create database migrations
- [ ] Seed exam boards and exam types
- [ ] Create subject specifications for STEM
- [ ] Build exam setup wizard UI

### Milestone 2: Syllabus System
- [ ] Import Cambridge syllabus structure
- [ ] Build syllabus browser page
- [ ] Create topic-syllabus mapping tool
- [ ] Display syllabus references in UI

### Milestone 3: Past Papers
- [ ] Set up R2 storage for PDFs
- [ ] Build paper upload admin tool
- [ ] Create PDF viewer component
- [ ] Implement paper browser filters

### Milestone 4: Content Integration
- [ ] Map existing WASSCE questions to O-Level
- [ ] Tag questions with syllabus points
- [ ] Create question import pipeline
- [ ] Build coverage reports

### Milestone 5: Advanced Features
- [ ] Implement grade boundary system
- [ ] Build grade predictor
- [ ] Create revision planner
- [ ] Add examiner tips system

### Milestone 6: Polish & Scale
- [ ] Add Edexcel support
- [ ] Performance optimization
- [ ] Premium tier features
- [ ] Analytics dashboard

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| O-Level subjects available | 4+ | Subject count |
| Questions per subject | 500+ | Question bank size |
| Past papers digitized | 50+ per subject | Paper count |
| Syllabus coverage | 90%+ | Mapped topics |
| User adoption | 30% selecting O/A Level | User preferences |
| Paper completion rate | 70%+ | Attempt completion |

---

## Notes & Considerations

### Legal/Copyright
- Past paper content is copyrighted
- Consider licensing arrangements
- User-generated content policy
- Fair use for educational purposes

### Performance
- PDF lazy loading
- Question pagination
- Cache grade boundaries
- CDN for paper files

### Localization
- Cambridge uses UK English
- Formula notation differences
- Unit conventions (SI)

### Accessibility
- PDF alternative formats
- Screen reader support
- High contrast mode for papers
