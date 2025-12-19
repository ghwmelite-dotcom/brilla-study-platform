# BRILLA STUDY PLATFORM - Project Specification
## St John's Grammar School NSMQ Training Platform

**Version:** 1.0  
**Date:** December 19, 2025  
**Project Name:** Brilla (named after the original "Brilliant Soap" sponsor of NSMQ)

---

## 1. EXECUTIVE SUMMARY

The Brilla Study Platform is a comprehensive web-based training system designed specifically for St John's Grammar School students preparing for Ghana's National Science & Maths Quiz (NSMQ). The platform simulates the exact competition format, provides adaptive learning paths, and enables team-based practice sessions.

---

## 2. NSMQ COMPETITION FORMAT RESEARCH

### 2.1 Competition Overview

The NSMQ is Ghana's premier annual academic quiz competition for senior high schools, running since 1993. It tests knowledge in **Mathematics, Physics, Chemistry, and Biology**.

- **Teams:** 3 schools compete per contest
- **Contestants:** 2 students per school
- **Stages:** Regional qualifiers → One-eighth → Quarter-finals → Semi-finals → Grand Finale
- **Quiz Mistress:** Dr. Elsie Effah Kaufmann (current)
- **Venue:** University of Cape Coast (recent finals)

### 2.2 Competition Rounds (5 Rounds)

#### ROUND 1: Fundamentals
- **Format:** Questions organized in sets by subject
- **Questions per school:** 4 Biology + 4 Chemistry + 4 Physics + 4 Mathematics = 16 questions
- **Points:** Variable based on difficulty
- **Bonuses:** Wrongly answered questions may be carried over as bonus
- **Partial credit:** Sometimes awarded by quiz mistress
- **Time:** ~10-15 seconds per question

#### ROUND 2: Speed Race
- **Format:** All 3 schools presented with same question simultaneously
- **Response:** First to ring bell answers
- **Points:**
  - 1st attempt correct: 3 points
  - 2nd attempt correct: 2 points
  - 3rd attempt correct: 1 point
  - Wrong answer: -1 point penalty
- **Questions:** 12 total (3 per subject: Math, Physics, Chemistry, Biology)
- **No partial credits**

#### ROUND 3: Problem of the Day
- **Format:** Single complex problem for all schools
- **Time limit:** 3-4 minutes to solve
- **Points:** Maximum 10 points (can be partial)
- **Subjects rotate:** Can be Math, Physics, Chemistry, or Biology
- **Presentation:** Quiz mistress reads problem, contestants solve on paper
- **Judging:** Solutions assessed individually per school

#### ROUND 4: True or False
- **Format:** Statements given to contestants in turns
- **Points:**
  - Correct answer: +2 points
  - Wrong answer: -1 point penalty
  - No attempt: 0 points (passed as bonus to next school)
- **Calculation questions:** 30 seconds to respond
- **Non-calculation:** 10 seconds to respond
- **Bonus attempt:** 10 seconds to ring in

#### ROUND 5: Riddles
- **Format:** 4 riddles (one per subject), clues given progressively
- **Points based on clue number:**
  - Answer on 1st clue: 5 points
  - Answer on 2nd clue: 4 points
  - Answer on 3rd clue or later: 3 points
- **Style:** Multi-clue puzzles leading to a scientific term, concept, or person
- **Competition:** All schools compete simultaneously for each riddle

### 2.3 Sample Question Types

#### Fundamentals Examples:
- "What is the linear momentum of a 5 kg object moving at 4 m/s due east?"
- "Express the parametric equation x = t + 1, y = 2t - 3 in Cartesian form"
- "Name the organelle responsible for cellular respiration"

#### True/False Examples:
- "The common difference of the linear sequence 9, 6, 3, 0, ... is 3" (False - it's -3)
- "A square is a rhombus" (True)
- "Blood gains pressure as it moves from the heart to the capillaries" (False)
- "An equilateral quadrilateral is equiangular" (False)

#### Riddle Examples:
- Clue 1: "I am the basic building blocks of Mathematics"
- Clue 2: "I am often considered reasonable or rational as well as crazy or irrational"
- Clue 3: "I may be terminating or repeating"
- Clue 4: "You can locate me on a line bearing my name"
- **Answer:** Real Numbers

### 2.4 Subject Topics (Aligned with Ghana SHS/WASSCE Syllabus)

#### Mathematics Topics:
- Algebra (Linear equations, Quadratics, Polynomials, Indices, Logarithms)
- Sequences and Series (AP, GP, Summation)
- Trigonometry (Identities, Equations, Graphs)
- Calculus (Differentiation, Integration, Applications)
- Vectors (2D and 3D operations)
- Matrices and Determinants
- Statistics and Probability
- Coordinate Geometry (Lines, Circles, Loci)
- Number Theory
- Complex Numbers

#### Physics Topics:
- Mechanics (Motion, Forces, Energy, Momentum)
- Waves (Properties, Sound, Light, EM spectrum)
- Electricity (Circuits, Electrostatics, Magnetism)
- Modern Physics (Atomic structure, Radioactivity)
- Thermodynamics (Heat, Gas Laws)
- Electronics (Semiconductors, Transistors, Logic gates)
- Measurements and Units

#### Chemistry Topics:
- Atomic Structure and Periodicity
- Chemical Bonding
- States of Matter
- Stoichiometry
- Acids, Bases, and Salts
- Redox Reactions
- Electrochemistry
- Organic Chemistry (Hydrocarbons, Functional groups)
- Thermochemistry
- Chemical Kinetics and Equilibrium
- Industrial Chemistry

#### Biology Topics:
- Cell Biology (Structure, Division, Transport)
- Genetics (Mendelian, Molecular)
- Ecology (Ecosystems, Population dynamics)
- Evolution and Classification
- Plant Biology (Photosynthesis, Transport, Reproduction)
- Human Physiology (Systems: Circulatory, Nervous, Digestive, etc.)
- Microbiology
- Biochemistry (Enzymes, Nutrients)

---

## 3. PLATFORM FEATURES SPECIFICATION

### 3.1 Core Features

#### A. Topic Library
```
- Hierarchical organization by subject > topic > subtopic
- Concise theory summaries with key formulas
- Worked examples with step-by-step solutions
- "Quick Recall" cards for rapid revision
- Difficulty rating (BECE, WASSCE, NSMQ-level)
- Search and filter functionality
```

#### B. Question Bank
```
- Questions tagged by: subject, topic, difficulty, round type
- Multiple question formats:
  - Multiple choice
  - Direct answer (numerical/text)
  - True/False with reasoning
  - Problem solving (multi-step)
  - Riddle-style clues
- Step-by-step solutions with alternative methods
- "Similar questions" recommendations
- Report/flag feature for errors
```

#### C. Practice Modes

**Individual Practice:**
- Topic-focused drills
- Timed quick-fire rounds
- Adaptive difficulty progression
- Spaced repetition for weak areas

**Competition Simulation:**
- Full 5-round mock contests
- Timed rounds matching real competition
- Score tracking and leaderboards
- Round-specific practice (e.g., "Speed Race only")

**Team Practice:**
- Real-time multiplayer rooms
- Role assignment (Contestant 1, 2, Reserve)
- Voice chat integration (optional)
- Team vs Team scrimmages

### 3.2 Gamification & Engagement

```
- XP points and leveling system
- Achievement badges (Topic Master, Speed Demon, Streak Keeper)
- Daily challenges ("Question of the Day")
- Weekly mini-competitions
- School-wide leaderboards
- House/Form competitions
- Streak tracking with rewards
```

### 3.3 Analytics & Progress Tracking

```
Student Dashboard:
- Overall progress percentage by subject
- Strength/weakness heatmap
- Time spent per topic
- Accuracy trends over time
- Recommended focus areas

Teacher/Coach Portal:
- Class-wide performance overview
- Individual student deep-dives
- Custom assignment creation
- Progress reports (PDF export)
- Competition readiness assessment
```

### 3.4 Offline & Accessibility

```
- Progressive Web App (PWA) architecture
- Offline mode with downloadable content packs
- Low-data mode for limited connectivity
- Mobile-responsive design
- Keyboard navigation support
- High contrast mode option
```

---

## 4. TECHNICAL ARCHITECTURE

### 4.1 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| State Management | Zustand or React Query |
| Routing | React Router v6 |
| Backend/API | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Caching | Cloudflare KV |
| Real-time | Cloudflare Durable Objects |
| Hosting | Cloudflare Pages |
| Auth | Cloudflare Access / Custom JWT |
| File Storage | Cloudflare R2 (optional) |

### 4.2 Project Structure

```
brilla-study-platform/
├── README.md
├── package.json
├── tsconfig.json
├── wrangler.toml                    # Cloudflare Workers config
├── tailwind.config.js
├── vite.config.ts
│
├── public/
│   ├── favicon.ico
│   ├── manifest.json                # PWA manifest
│   └── icons/
│
├── src/
│   ├── main.tsx                     # App entry point
│   ├── App.tsx                      # Root component
│   ├── index.css                    # Global styles
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Timer.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Loader.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── MainLayout.tsx
│   │   │
│   │   ├── questions/
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── MultipleChoice.tsx
│   │   │   ├── TrueFalse.tsx
│   │   │   ├── DirectAnswer.tsx
│   │   │   ├── RiddleClue.tsx
│   │   │   └── ProblemOfDay.tsx
│   │   │
│   │   ├── practice/
│   │   │   ├── TopicDrill.tsx
│   │   │   ├── SpeedRace.tsx
│   │   │   ├── QuizSimulator.tsx
│   │   │   └── Flashcard.tsx
│   │   │
│   │   ├── competition/
│   │   │   ├── RoundOne.tsx         # Fundamentals
│   │   │   ├── RoundTwo.tsx         # Speed Race
│   │   │   ├── RoundThree.tsx       # Problem of the Day
│   │   │   ├── RoundFour.tsx        # True or False
│   │   │   ├── RoundFive.tsx        # Riddles
│   │   │   ├── Scoreboard.tsx
│   │   │   └── BuzzerButton.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── ProgressChart.tsx
│   │   │   ├── StrengthWeakness.tsx
│   │   │   ├── RecentActivity.tsx
│   │   │   └── Recommendations.tsx
│   │   │
│   │   ├── leaderboard/
│   │   │   ├── GlobalLeaderboard.tsx
│   │   │   ├── WeeklyChallenge.tsx
│   │   │   └── HouseRankings.tsx
│   │   │
│   │   └── admin/
│   │       ├── QuestionManager.tsx
│   │       ├── UserManager.tsx
│   │       ├── ContentEditor.tsx
│   │       └── AnalyticsDashboard.tsx
│   │
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Topics.tsx
│   │   ├── TopicDetail.tsx
│   │   ├── Practice.tsx
│   │   ├── Competition.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── Profile.tsx
│   │   ├── Settings.tsx
│   │   └── Admin.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useQuestions.ts
│   │   ├── useTimer.ts
│   │   ├── useScore.ts
│   │   ├── useProgress.ts
│   │   ├── useLeaderboard.ts
│   │   └── useOffline.ts
│   │
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── quizStore.ts
│   │   ├── progressStore.ts
│   │   └── settingsStore.ts
│   │
│   ├── services/
│   │   ├── api.ts                   # API client
│   │   ├── auth.ts
│   │   ├── questions.ts
│   │   ├── progress.ts
│   │   └── leaderboard.ts
│   │
│   ├── types/
│   │   ├── question.ts
│   │   ├── user.ts
│   │   ├── progress.ts
│   │   ├── competition.ts
│   │   └── api.ts
│   │
│   ├── utils/
│   │   ├── scoring.ts               # NSMQ scoring logic
│   │   ├── timer.ts
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── constants.ts
│   │
│   └── data/
│       ├── topics.json              # Topic hierarchy
│       ├── achievements.json
│       └── sample-questions.json
│
├── workers/
│   ├── api/
│   │   ├── index.ts                 # Main API router
│   │   ├── auth.ts                  # Auth handlers
│   │   ├── questions.ts             # Question CRUD
│   │   ├── progress.ts              # Progress tracking
│   │   ├── leaderboard.ts           # Leaderboard logic
│   │   └── competition.ts           # Competition sessions
│   │
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── cors.ts
│   │   └── rateLimit.ts
│   │
│   └── utils/
│       ├── db.ts                    # D1 helpers
│       ├── kv.ts                    # KV helpers
│       └── scoring.ts
│
├── database/
│   ├── schema.sql                   # D1 schema
│   ├── seed.sql                     # Initial data
│   └── migrations/
│       └── 001_initial.sql
│
└── scripts/
    ├── seed-questions.ts            # Import questions
    ├── generate-riddles.ts
    └── backup-db.ts
```

---

## 5. DATABASE SCHEMA

### 5.1 D1 (SQLite) Schema

```sql
-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'student' CHECK(role IN ('student', 'teacher', 'admin')),
    house TEXT,                       -- School house/form
    year_group INTEGER,               -- SHS 1, 2, or 3
    avatar_url TEXT,
    xp_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak_days INTEGER DEFAULT 0,
    last_active_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,               -- Mathematics, Physics, Chemistry, Biology
    slug TEXT UNIQUE NOT NULL,
    icon TEXT,
    color TEXT,                       -- For UI theming
    order_index INTEGER DEFAULT 0
);

-- Topics table
CREATE TABLE topics (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES subjects(id),
    parent_id TEXT REFERENCES topics(id),  -- For subtopics
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    theory_content TEXT,              -- Markdown content
    key_formulas TEXT,                -- JSON array
    difficulty_level TEXT DEFAULT 'intermediate',
    order_index INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE questions (
    id TEXT PRIMARY KEY,
    topic_id TEXT REFERENCES topics(id),
    subject_id TEXT NOT NULL REFERENCES subjects(id),
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK(question_type IN (
        'multiple_choice', 'true_false', 'direct_answer', 
        'problem', 'riddle'
    )),
    round_type TEXT CHECK(round_type IN (
        'fundamentals', 'speed_race', 'problem_of_day', 
        'true_false', 'riddles'
    )),
    options TEXT,                     -- JSON for multiple choice
    correct_answer TEXT NOT NULL,
    explanation TEXT,                 -- Step-by-step solution
    alternative_methods TEXT,         -- JSON array
    difficulty INTEGER DEFAULT 2 CHECK(difficulty BETWEEN 1 AND 5),
    points INTEGER DEFAULT 1,
    time_limit_seconds INTEGER,
    image_url TEXT,
    tags TEXT,                        -- JSON array
    source TEXT,                      -- e.g., "NSMQ 2023 Contest 5"
    is_verified INTEGER DEFAULT 0,
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Riddles table (special structure for riddle rounds)
CREATE TABLE riddles (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES subjects(id),
    topic_id TEXT REFERENCES topics(id),
    answer TEXT NOT NULL,
    clue_1 TEXT NOT NULL,             -- Most vague (5 points)
    clue_2 TEXT NOT NULL,             -- (4 points)
    clue_3 TEXT NOT NULL,             -- (3 points)
    clue_4 TEXT,                      -- Optional (3 points)
    clue_5 TEXT,                      -- Optional (3 points)
    difficulty INTEGER DEFAULT 3,
    source TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- User progress table
CREATE TABLE user_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    topic_id TEXT NOT NULL REFERENCES topics(id),
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    mastery_level REAL DEFAULT 0,     -- 0 to 100
    last_practiced_at TEXT,
    next_review_at TEXT,              -- For spaced repetition
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, topic_id)
);

-- Question attempts table
CREATE TABLE question_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    question_id TEXT NOT NULL REFERENCES questions(id),
    session_id TEXT,                  -- For grouping practice sessions
    user_answer TEXT,
    is_correct INTEGER NOT NULL,
    time_taken_seconds INTEGER,
    points_earned INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Competition sessions table
CREATE TABLE competition_sessions (
    id TEXT PRIMARY KEY,
    name TEXT,
    mode TEXT CHECK(mode IN ('solo', 'team', 'class')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'completed')),
    current_round INTEGER DEFAULT 1,
    settings TEXT,                    -- JSON: time limits, subjects included, etc.
    created_by TEXT REFERENCES users(id),
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Competition participants
CREATE TABLE competition_participants (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES competition_sessions(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    team_name TEXT,
    total_score INTEGER DEFAULT 0,
    round_scores TEXT,                -- JSON: {1: 25, 2: 18, ...}
    rank INTEGER,
    joined_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Achievements table
CREATE TABLE achievements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    category TEXT,
    requirement_type TEXT,            -- e.g., 'questions_answered', 'streak', 'score'
    requirement_value INTEGER,
    xp_reward INTEGER DEFAULT 0
);

-- User achievements
CREATE TABLE user_achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    achievement_id TEXT NOT NULL REFERENCES achievements(id),
    earned_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- Daily challenges
CREATE TABLE daily_challenges (
    id TEXT PRIMARY KEY,
    date TEXT UNIQUE NOT NULL,        -- YYYY-MM-DD
    question_id TEXT NOT NULL REFERENCES questions(id),
    bonus_xp INTEGER DEFAULT 50
);

-- Leaderboard cache (updated periodically)
CREATE TABLE leaderboard (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    period TEXT NOT NULL,             -- 'daily', 'weekly', 'monthly', 'alltime'
    score INTEGER DEFAULT 0,
    rank INTEGER,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, period)
);

-- Indexes for performance
CREATE INDEX idx_questions_subject ON questions(subject_id);
CREATE INDEX idx_questions_topic ON questions(topic_id);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_round ON questions(round_type);
CREATE INDEX idx_progress_user ON user_progress(user_id);
CREATE INDEX idx_attempts_user ON question_attempts(user_id);
CREATE INDEX idx_attempts_session ON question_attempts(session_id);
CREATE INDEX idx_leaderboard_period ON leaderboard(period, rank);
```

### 5.2 KV Store Structure

```
// User sessions
sessions:{session_id} -> { userId, createdAt, expiresAt }

// Leaderboard caches
leaderboard:daily -> [{ userId, name, score, rank }, ...]
leaderboard:weekly -> [...]

// Question of the day
daily_challenge:{date} -> { questionId, bonusXp }

// Real-time competition state (use Durable Objects for actual state)
competition:{session_id}:state -> { currentRound, scores, ... }
```

---

## 6. API ENDPOINTS

### 6.1 Authentication

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
PUT  /api/auth/profile
```

### 6.2 Topics & Content

```
GET  /api/subjects                   # List all subjects
GET  /api/subjects/:slug             # Subject details with topics
GET  /api/topics/:id                 # Topic with theory content
GET  /api/topics/:id/questions       # Questions for a topic
```

### 6.3 Questions & Practice

```
GET  /api/questions                  # List with filters
GET  /api/questions/:id              # Single question with solution
GET  /api/questions/random           # Random question(s)
POST /api/questions/:id/attempt      # Submit answer
GET  /api/practice/session           # Start practice session
POST /api/practice/session/:id/end   # End session, get summary
```

### 6.4 Competition

```
POST /api/competition/create         # Create new session
GET  /api/competition/:id            # Get session details
POST /api/competition/:id/join       # Join session
POST /api/competition/:id/start      # Start competition
POST /api/competition/:id/answer     # Submit answer in competition
GET  /api/competition/:id/results    # Final results
```

### 6.5 Progress & Stats

```
GET  /api/progress                   # User's overall progress
GET  /api/progress/topics            # Progress by topic
GET  /api/progress/history           # Recent activity
GET  /api/stats/summary              # Performance summary
```

### 6.6 Leaderboard

```
GET  /api/leaderboard                # Global leaderboard
GET  /api/leaderboard/weekly         # Weekly rankings
GET  /api/leaderboard/house          # House rankings
```

### 6.7 Admin (Protected)

```
POST /api/admin/questions            # Create question
PUT  /api/admin/questions/:id        # Update question
DELETE /api/admin/questions/:id      # Delete question
POST /api/admin/riddles              # Create riddle
GET  /api/admin/users                # List users
PUT  /api/admin/users/:id            # Update user role
GET  /api/admin/analytics            # Platform analytics
```

---

## 7. SCORING LOGIC

### 7.1 NSMQ Scoring Implementation

```typescript
// src/utils/scoring.ts

export const SCORING = {
  ROUND_ONE: {
    CORRECT: 3,
    BONUS: 2,
    PARTIAL_MAX: 2
  },
  ROUND_TWO: {
    FIRST_CORRECT: 3,
    SECOND_CORRECT: 2,
    THIRD_CORRECT: 1,
    WRONG: -1
  },
  ROUND_THREE: {
    MAX_POINTS: 10,
    PARTIAL_ALLOWED: true
  },
  ROUND_FOUR: {
    CORRECT: 2,
    WRONG: -1,
    PASS: 0,
    BONUS_CORRECT: 2
  },
  ROUND_FIVE: {
    CLUE_1: 5,
    CLUE_2: 4,
    CLUE_3_PLUS: 3
  }
};

export function calculateRiddleScore(clueNumber: number): number {
  if (clueNumber === 1) return SCORING.ROUND_FIVE.CLUE_1;
  if (clueNumber === 2) return SCORING.ROUND_FIVE.CLUE_2;
  return SCORING.ROUND_FIVE.CLUE_3_PLUS;
}

export function calculateXP(params: {
  isCorrect: boolean;
  difficulty: number;
  timeBonus: boolean;
  streakMultiplier: number;
}): number {
  const baseXP = params.isCorrect ? 10 : 2;
  const difficultyBonus = params.difficulty * 2;
  const timeBonus = params.timeBonus ? 5 : 0;
  return Math.floor((baseXP + difficultyBonus + timeBonus) * params.streakMultiplier);
}
```

---

## 8. SAMPLE DATA

### 8.1 Topics Hierarchy

```json
{
  "subjects": [
    {
      "id": "math",
      "name": "Mathematics",
      "icon": "📐",
      "color": "#3B82F6",
      "topics": [
        {
          "id": "algebra",
          "name": "Algebra",
          "subtopics": [
            { "id": "linear-equations", "name": "Linear Equations" },
            { "id": "quadratics", "name": "Quadratic Equations" },
            { "id": "polynomials", "name": "Polynomials" },
            { "id": "indices", "name": "Indices and Logarithms" }
          ]
        },
        {
          "id": "calculus",
          "name": "Calculus",
          "subtopics": [
            { "id": "differentiation", "name": "Differentiation" },
            { "id": "integration", "name": "Integration" },
            { "id": "applications", "name": "Applications of Calculus" }
          ]
        }
      ]
    },
    {
      "id": "physics",
      "name": "Physics",
      "icon": "⚛️",
      "color": "#8B5CF6"
    },
    {
      "id": "chemistry",
      "name": "Chemistry",
      "icon": "🧪",
      "color": "#10B981"
    },
    {
      "id": "biology",
      "name": "Biology",
      "icon": "🧬",
      "color": "#F59E0B"
    }
  ]
}
```

### 8.2 Sample Questions

```json
{
  "questions": [
    {
      "id": "q001",
      "subject_id": "physics",
      "topic_id": "mechanics",
      "question_type": "direct_answer",
      "round_type": "fundamentals",
      "question_text": "What is the linear momentum of a 5 kg object moving at 4 m/s due east?",
      "correct_answer": "20 kg⋅m/s due east",
      "explanation": "Linear momentum p = mv = 5 kg × 4 m/s = 20 kg⋅m/s. Direction is east (same as velocity).",
      "difficulty": 2,
      "time_limit_seconds": 15
    },
    {
      "id": "q002",
      "subject_id": "math",
      "topic_id": "algebra",
      "question_type": "true_false",
      "round_type": "true_false",
      "question_text": "The common difference of the linear sequence 9, 6, 3, 0, ... is 3.",
      "correct_answer": "False",
      "explanation": "Common difference d = 6 - 9 = -3 (not +3). The sequence is decreasing.",
      "difficulty": 2,
      "time_limit_seconds": 10
    },
    {
      "id": "q003",
      "subject_id": "chemistry",
      "topic_id": "solutions",
      "question_type": "multiple_choice",
      "round_type": "speed_race",
      "question_text": "Which of the following is NOT a colligative property?",
      "options": ["Boiling point elevation", "Freezing point depression", "Osmotic pressure", "Specific heat capacity"],
      "correct_answer": "Specific heat capacity",
      "explanation": "Colligative properties depend on the number of solute particles, not their nature. Specific heat is an intensive property.",
      "difficulty": 3
    }
  ],
  "riddles": [
    {
      "id": "r001",
      "subject_id": "math",
      "answer": "Real Numbers",
      "clue_1": "I am the basic building blocks of Mathematics.",
      "clue_2": "I am often considered reasonable or rational as well as crazy or irrational.",
      "clue_3": "I may be terminating or repeating.",
      "clue_4": "You can locate me on a line bearing my name.",
      "difficulty": 3
    },
    {
      "id": "r002",
      "subject_id": "physics",
      "answer": "Polarization",
      "clue_1": "I am a property of a periodic propagating disturbance.",
      "clue_2": "Therefore, I am a property of a wave.",
      "clue_3": "I describe a relationship that can exist between particle displacement and wave propagation direction.",
      "difficulty": 3
    }
  ]
}
```

---

## 9. UI/UX GUIDELINES

### 9.1 Design Principles

- **Ghana-inspired colors**: Green, Gold, Red accents (national colors)
- **Clean, distraction-free interface** for studying
- **Large, readable fonts** for formulas and questions
- **Mobile-first responsive design**
- **Dark mode support** for night studying
- **Accessibility**: WCAG 2.1 AA compliance

### 9.2 Key Screens

1. **Dashboard**: Progress overview, daily challenge, quick actions
2. **Topic Browser**: Subject cards → Topic list → Subtopics → Content
3. **Practice Mode**: Question display, timer, answer input, feedback
4. **Competition Simulator**: Round selection, buzzer, scoreboard
5. **Leaderboard**: Rankings, filters, personal stats
6. **Profile**: Achievements, stats, settings

---

## 10. DEVELOPMENT PHASES

### Phase 1: MVP (Weeks 1-4)
- [x] Project setup and architecture
- [ ] Authentication system
- [ ] Topic library with basic content
- [ ] Question bank CRUD
- [ ] Individual practice mode
- [ ] Basic progress tracking

### Phase 2: Competition Features (Weeks 5-8)
- [ ] All 5 NSMQ rounds simulation
- [ ] Timer and scoring system
- [ ] Mock competition flow
- [ ] Leaderboards
- [ ] Daily challenges

### Phase 3: Collaboration (Weeks 9-12)
- [ ] Team practice rooms (Durable Objects)
- [ ] Real-time multiplayer
- [ ] Teacher/Coach portal
- [ ] Analytics dashboard
- [ ] Custom quiz creation

### Phase 4: Polish & Scale (Weeks 13-16)
- [ ] PWA and offline mode
- [ ] Performance optimization
- [ ] Content expansion (more questions)
- [ ] Advanced gamification
- [ ] Mobile app consideration

---

## 11. CLAUDE CODE INITIALIZATION PROMPT

Copy the following prompt to Claude Code to initialize the project:

```
Initialize a new project called "brilla-study-platform" for St John's Grammar School NSMQ training.

Tech stack:
- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS
- Backend: Cloudflare Workers (Hono framework)
- Database: Cloudflare D1
- Caching: Cloudflare KV
- Hosting: Cloudflare Pages

Please create:
1. Vite + React + TypeScript project structure
2. Tailwind CSS configuration with Ghana-inspired color palette (green: #006B3F, gold: #FCD116, red: #CE1126)
3. Basic folder structure as specified in the project spec
4. Cloudflare Workers API setup with Hono router
5. D1 database schema for users, subjects, topics, questions, progress, and leaderboards
6. Authentication hooks and context
7. Basic layout components (Header, Sidebar, MainLayout)
8. Home page with subject cards
9. Sample data seeding script

Focus on:
- Clean, maintainable code
- TypeScript types for all entities
- Mobile-responsive design
- Accessibility best practices

Start by setting up the project structure and configuration files, then implement the core components.
```

---

## 12. SUCCESS METRICS

| Metric | Target |
|--------|--------|
| Daily Active Users | 50+ students |
| Questions Answered/Day | 500+ |
| Average Session Duration | 20+ minutes |
| Streak Retention (7-day) | 60%+ |
| Competition Simulations/Week | 10+ |
| Teacher Adoption | All NSMQ coaches |

---

## 13. FUTURE ENHANCEMENTS

- AI-powered question generation
- Voice input for answers (accessibility)
- Video explanations for complex topics
- Integration with Ghana SHS syllabus updates
- Multi-school competition leagues
- Parent progress notifications
- Spaced repetition optimization with ML
- AR/VR lab simulations for practical concepts

---

**Document prepared for St John's Grammar School NSMQ Training Initiative**

*Let's bring that trophy home! 🏆*
