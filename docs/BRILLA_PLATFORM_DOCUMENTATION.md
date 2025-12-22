# Brilla Study Platform
## Comprehensive Technical & Feature Documentation

**Document Version:** 1.0
**Date:** December 21, 2025
**Prepared by:** Hodges & Co.
**Client:** Brilla Study Platform

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Overview](#2-platform-overview)
3. [Technical Architecture](#3-technical-architecture)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Core Features](#5-core-features)
6. [E-Library System](#6-e-library-system)
7. [AI Student Counselor](#7-ai-student-counselor)
8. [Practice & Assessment System](#8-practice--assessment-system)
9. [Competition & Gamification](#9-competition--gamification)
10. [Analytics & Reporting](#10-analytics--reporting)
11. [Parent Portal](#11-parent-portal)
12. [Teacher Dashboard](#12-teacher-dashboard)
13. [Admin Panel](#13-admin-panel)
14. [Database Schema](#14-database-schema)
15. [API Reference](#15-api-reference)
16. [Deployment & Infrastructure](#16-deployment--infrastructure)
17. [Security Considerations](#17-security-considerations)
18. [Future Roadmap](#18-future-roadmap)

---

## 1. Executive Summary

Brilla Study Platform is a comprehensive educational technology solution designed specifically for Ghanaian students preparing for national examinations including NSMQ (National Science & Maths Quiz), WASSCE (West African Senior School Certificate Examination), and BECE (Basic Education Certificate Examination).

The platform combines modern web technologies with artificial intelligence to deliver personalized learning experiences, competitive practice environments, and robust progress tracking for students, teachers, and parents.

### Key Highlights

- **10,000+ Practice Questions** across all major subjects
- **AI-Powered Tutoring** with instant explanations and personalized guidance
- **E-Library** with multimedia educational resources (PDFs, videos, audio)
- **AI Student Counselor** for academic, career, and wellbeing support
- **NSMQ Competition Simulation** with all 5 rounds recreated
- **Live 1v1 Battles** for real-time competitive practice
- **Comprehensive Analytics** for tracking student progress
- **Parent Portal** for monitoring children's educational journey
- **Teacher Dashboard** for class management and assessment creation

---

## 2. Platform Overview

### 2.1 Target Audience

| User Type | Description |
|-----------|-------------|
| **Students** | JHS and SHS students (ages 12-18) preparing for BECE, WASSCE, and NSMQ |
| **Teachers** | Educators managing classes, creating assessments, and uploading resources |
| **Parents** | Guardians monitoring their children's academic progress |
| **Administrators** | Platform managers overseeing user management and content moderation |

### 2.2 Supported Examinations

#### NSMQ (National Science & Maths Quiz)
- Full 5-round competition simulation
- Speed training for quick recall
- Riddles and problem-solving challenges
- Live 1v1 battle mode

#### WASSCE (West African Senior School Certificate)
- 50+ subject coverage
- Past papers from 2015-2024
- AI-powered essay grading
- Theory and objective questions

#### BECE (Basic Education Certificate)
- Complete JHS curriculum coverage
- All 9 core subjects
- Practice tests with progress tracking

### 2.3 Platform URLs

| Environment | URL | Purpose |
|------------|-----|---------|
| Production (Frontend) | https://brillaprep.org | Main user-facing application |
| Production (API) | https://brilla-api.ghwmelite.workers.dev | Backend API services |
| Development | localhost:5173 | Local development environment |

---

## 3. Technical Architecture

### 3.1 Technology Stack

#### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type-safe JavaScript |
| Vite | 5.x | Build tool and dev server |
| Tailwind CSS | 3.x | Utility-first styling |
| Zustand | 4.x | State management |
| React Router | 6.x | Client-side routing |
| Lucide React | - | Icon library |

#### Backend
| Technology | Purpose |
|------------|---------|
| Cloudflare Workers | Serverless compute |
| Hono | Web framework for Workers |
| Cloudflare D1 | SQLite database |
| Cloudflare R2 | Object storage for files |
| JWT | Authentication tokens |

#### AI Integration
| Provider | Model | Use Case |
|----------|-------|----------|
| Anthropic | Haiku | AI Tutor, Essay Grading, Counselor |

### 3.2 Project Structure

```
brilla-study-platform/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── common/         # Shared components (Button, Modal, etc.)
│   │   ├── counselor/      # AI Counselor components
│   │   ├── dashboard/      # Dashboard widgets
│   │   ├── layout/         # Layout components (Sidebar, Header)
│   │   ├── library/        # E-Library components
│   │   └── practice/       # Practice session components
│   ├── pages/              # Route page components
│   ├── stores/             # Zustand state stores
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── data/               # Static data and constants
├── workers/
│   └── api/                # Cloudflare Workers API
│       ├── index.ts        # Main API router
│       ├── library.ts      # E-Library endpoints
│       └── counselor.ts    # AI Counselor endpoints
├── database/
│   └── migrations/         # D1 database migrations
├── public/                 # Static assets
└── docs/                   # Documentation
```

### 3.3 State Management

The platform uses Zustand for state management with the following stores:

| Store | Purpose |
|-------|---------|
| `authStore` | User authentication and session management |
| `practiceStore` | Practice session state and question management |
| `libraryStore` | E-Library resources and collections |
| `counselorStore` | AI Counselor conversations |
| `aiTutorStore` | AI Tutor chat and explanations |
| `questStore` | Daily quests and achievements |
| `battleStore` | 1v1 battle state |
| `subjectStore` | Subject and topic data |
| `leaderboardStore` | Rankings and leaderboard data |

---

## 4. User Roles & Permissions

### 4.1 Role Definitions

#### Student
- Access practice questions and assessments
- Use AI Tutor and AI Counselor
- Browse and download E-Library resources
- Participate in competitions and battles
- Track personal progress and analytics
- Complete daily quests and earn XP

#### Teacher
- All student permissions
- Create and manage classes
- Build custom assessments
- Upload resources to E-Library
- View student performance reports
- Grade essay submissions

#### Parent
- View linked children's progress
- Access performance reports
- Monitor study activity and streaks
- Receive notifications about child's performance

#### Administrator
- All teacher permissions
- User management (approve, suspend, delete)
- Content moderation
- System analytics and audit logs
- Platform configuration

### 4.2 Permission Matrix

| Feature | Student | Teacher | Parent | Admin |
|---------|:-------:|:-------:|:------:|:-----:|
| Practice Questions | ✓ | ✓ | - | ✓ |
| AI Tutor | ✓ | ✓ | - | ✓ |
| AI Counselor | ✓ | ✓ | - | ✓ |
| E-Library (View) | ✓ | ✓ | - | ✓ |
| E-Library (Upload) | - | ✓ | - | ✓ |
| E-Library (Delete Own) | - | ✓ | - | ✓ |
| E-Library (Delete Any) | - | - | - | ✓ |
| Create Assessments | - | ✓ | - | ✓ |
| View Child Progress | - | - | ✓ | - |
| User Management | - | - | - | ✓ |
| Audit Logs | - | - | - | ✓ |

---

## 5. Core Features

### 5.1 Authentication System

#### Registration Flow
1. User selects role (Student, Teacher, Parent)
2. Provides email, password, and profile information
3. Students/Teachers select school and grade level
4. Account created with email verification (optional)
5. Teachers/Students require admin approval

#### Login Methods
- Email and password
- Persistent sessions with JWT tokens
- Automatic session refresh

#### Security Features
- Password hashing with bcrypt
- JWT token expiration (7 days)
- Role-based access control
- Account suspension capability

### 5.2 Dashboard

Each user role has a customized dashboard:

#### Student Dashboard
- XP and level progress
- Current streak status
- Daily quest progress
- Quick access to practice
- Recent activity feed
- Upcoming assessments

#### Teacher Dashboard
- Class overview
- Pending assignments to grade
- Student performance summary
- Quick actions for common tasks

#### Parent Dashboard
- Children's progress overview
- Recent activity timeline
- Performance trends
- Study time statistics

### 5.3 Subject & Topic System

The platform organizes content into a hierarchical structure:

```
Subject (e.g., Mathematics)
└── Topic (e.g., Algebra)
    └── Questions (Multiple types)
```

#### Supported Subjects
- Mathematics
- English Language
- Integrated Science
- Social Studies
- French
- ICT
- Physics
- Chemistry
- Biology
- Geography
- History
- Economics
- And 40+ more subjects

### 5.4 Question Types

| Type | Description | Supported Exams |
|------|-------------|-----------------|
| Multiple Choice | 4 options, single correct answer | All |
| True/False | Binary choice questions | All |
| Fill in the Blank | Text input for missing words | All |
| Short Answer | Brief text responses | WASSCE, BECE |
| Essay | Long-form written responses with AI grading | WASSCE |
| Speed Round | Time-limited questions (NSMQ style) | NSMQ |
| Riddle | Word puzzles and brain teasers | NSMQ |

---

## 6. E-Library System

### 6.1 Overview

The E-Library is a comprehensive digital resource management system allowing teachers and administrators to upload, organize, and share educational materials with students.

### 6.2 Supported Resource Types

| Type | Extensions | Max Size | Features |
|------|------------|----------|----------|
| PDF | .pdf | 50 MB | In-browser viewing, progress tracking |
| Video | .mp4, .webm, .mov | 500 MB | Streaming playback, progress tracking |
| Audio | .mp3, .wav, .m4a | 100 MB | Audio player with controls |
| Document | .doc, .docx, .txt | 20 MB | Download only |
| Interactive | .html, .zip | 50 MB | Embedded iframe |
| Link | URL | - | External resource linking |

### 6.3 Resource Management

#### Upload Process
1. Select resource type
2. Drag and drop or browse for file
3. Enter metadata (title, description, subject, tags)
4. Set access level (Free, Basic, Premium)
5. Configure downloadable option
6. Optional: Mark as featured
7. Submit for processing

#### Resource Metadata
- Title (required)
- Description
- Resource type
- Subject association
- Topic association
- School level (JHS, SHS, Both)
- Access level
- Tags (comma-separated)
- Featured flag
- Downloadable flag

### 6.4 Collections

Users can organize resources into personal collections:
- Create named collections
- Add resources to multiple collections
- Reorder resources within collections
- Share public collections

### 6.5 Features

| Feature | Description |
|---------|-------------|
| Search | Full-text search across titles, descriptions, and tags |
| Filtering | Filter by type, subject, school level, access level |
| Sorting | Sort by newest, popular, rating, or title |
| Progress Tracking | Track viewing/reading progress per resource |
| Ratings & Reviews | 5-star rating system with optional reviews |
| View/Download Counts | Analytics on resource popularity |
| Bookmarking | Save resources for quick access |

### 6.6 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/library/resources` | List/search resources |
| GET | `/api/library/resources/:id` | Get resource details |
| GET | `/api/library/featured` | Get featured resources |
| POST | `/api/library/upload` | Upload new resource |
| PUT | `/api/library/resources/:id` | Update resource |
| DELETE | `/api/library/resources/:id` | Delete resource |
| GET | `/api/library/files/*` | Serve file from R2 |

---

## 7. AI Student Counselor

### 7.1 Overview

The AI Student Counselor provides personalized support to students across three specialized domains: academic guidance, career counseling, and wellbeing support.

### 7.2 Counselor Types

#### Academic Counselor
- Study strategy recommendations
- Subject selection guidance
- Exam preparation tips
- Time management advice
- Learning difficulty support

#### Career Counselor
- STEM career exploration
- University program guidance
- Scholarship information
- Career path planning
- Skills development advice

#### Wellbeing Counselor
- Stress management techniques
- Study-life balance guidance
- Motivation and confidence building
- Anxiety and pressure coping
- Mental health resources (referral when appropriate)

### 7.3 Features

| Feature | Description |
|---------|-------------|
| Conversation History | Persistent chat history across sessions |
| Context Awareness | Uses student's performance data for personalized advice |
| Resource Suggestions | Recommends relevant E-Library materials |
| Typing Animation | Natural message delivery experience |
| Feedback System | Rate message helpfulness |
| Quick Actions | Pre-defined prompts for common questions |

### 7.4 Safety Measures

- Sentiment detection for concerning messages
- Escalation protocols for crisis situations
- Professional referral recommendations
- Conversation flagging for admin review

### 7.5 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/counselor/conversations` | List user's conversations |
| POST | `/api/counselor/conversations` | Start new conversation |
| GET | `/api/counselor/conversations/:id` | Get conversation with messages |
| POST | `/api/counselor/chat` | Send message and get AI response |
| DELETE | `/api/counselor/conversations/:id` | Archive conversation |

---

## 8. Practice & Assessment System

### 8.1 Practice Modes

#### Topic Practice
- Select subject and topic
- Unlimited practice questions
- Immediate feedback with explanations
- AI Tutor available for help

#### Timed Practice
- Configurable time limits
- Question count selection
- Performance scoring
- Speed metrics tracking

#### Mock Exams
- Full exam simulation
- Realistic timing
- Question paper format
- Comprehensive results

#### Past Papers
- WASSCE papers (2015-2024)
- BECE papers
- Original marking schemes
- AI essay grading

### 8.2 Assessment Builder

Teachers can create custom assessments with:
- Multiple question types
- Time limits
- Randomized question order
- Scheduled availability
- Class/group assignment
- Grading rubrics

### 8.3 AI-Powered Essay Grading

For essay-type questions:
1. Student submits essay response
2. AI analyzes content, structure, grammar
3. Provides score based on rubric
4. Generates detailed feedback
5. Suggests improvements

### 8.4 Progress Tracking

| Metric | Description |
|--------|-------------|
| Accuracy | Percentage of correct answers |
| Speed | Average time per question |
| Streak | Consecutive days of practice |
| XP | Experience points earned |
| Level | Current proficiency level |
| Topics Mastered | Topics with >80% accuracy |

---

## 9. Competition & Gamification

### 9.1 NSMQ Competition Mode

Full simulation of the National Science & Maths Quiz:

#### Round 1: Fundamental
- Basic recall questions
- 30 seconds per question
- Individual scoring

#### Round 2: Speed Race
- First to answer correctly wins
- 10 seconds time limit
- Bonus points for speed

#### Round 3: Problem of the Day
- Complex multi-step problem
- Extended time allowed
- Partial credit available

#### Round 4: True or False
- Rapid-fire format
- 15 seconds per question
- Penalty for wrong answers

#### Round 5: Riddles
- Word puzzles and brain teasers
- Lateral thinking required
- Point multipliers

### 9.2 Live 1v1 Battles

Real-time competitive mode:
- Matchmaking by skill level
- Synchronized questions
- Live score updates
- Victory/defeat animations
- XP rewards

### 9.3 House System

School-based team competition:
- Join your school house
- Contribute to house points
- Weekly house rankings
- House Cup championship

### 9.4 Leaderboards

| Leaderboard | Scope | Ranking Criteria |
|-------------|-------|------------------|
| National | All users | Total XP |
| School | Same school | Weekly XP |
| Subject | Per subject | Accuracy + XP |
| Battle | Battle participants | Win rate |

### 9.5 Gamification Elements

#### XP System
| Action | XP Reward |
|--------|-----------|
| Answer correctly | 10 XP |
| Complete topic | 50 XP |
| Daily streak | 25 XP |
| Win battle | 100 XP |
| Complete quest | Variable |

#### Achievements
- First Steps: Complete first practice
- Streak Master: 30-day streak
- Battle Champion: Win 50 battles
- Subject Expert: Master all topics in a subject
- Speed Demon: Answer 100 questions under 5 seconds

#### Daily Quests
- Practice X questions
- Complete X topics
- Achieve X% accuracy
- Win X battles
- Use AI Tutor

---

## 10. Analytics & Reporting

### 10.1 Student Analytics

#### Performance Dashboard
- Overall accuracy trend graph
- Subject-by-subject breakdown
- Strength and weakness analysis
- Time spent studying
- Comparison to peers (percentile)

#### Progress Reports
- Weekly summary emails
- Monthly detailed reports
- Exportable PDF reports

### 10.2 Teacher Analytics

#### Class Performance
- Class average scores
- Individual student progress
- Topic coverage heatmap
- Assessment results analysis

#### Resource Engagement
- View counts per resource
- Download statistics
- Student completion rates

### 10.3 Admin Analytics

#### Platform Metrics
- Daily/weekly/monthly active users
- Question attempt volume
- Popular subjects and topics
- User growth trends

#### Audit Logs
- User actions tracking
- Content modifications
- System changes
- Security events

---

## 11. Parent Portal

### 11.1 Features

#### Child Linking
- Request link to child's account
- Child approves connection
- Multiple children support

#### Progress Monitoring
- Real-time activity feed
- Practice session summaries
- Assessment results
- Streak status

#### Reports
- Weekly email summaries
- Performance trend charts
- Study time analysis
- Subject-wise breakdown

#### Notifications
- Low activity alerts
- Achievement celebrations
- Assessment reminders
- Streak at-risk warnings

### 11.2 Settings

- Notification preferences
- Report frequency
- Privacy controls
- Child account management

---

## 12. Teacher Dashboard

### 12.1 Class Management

#### Create Classes
- Class name and description
- Grade level selection
- Subject assignment
- Enrollment settings

#### Student Management
- View enrolled students
- Add/remove students
- Assign groups within class
- View individual performance

### 12.2 Assessment Tools

#### Assessment Builder
- Question bank access
- Custom question creation
- Multiple assessment types
- Scheduling options

#### Grading
- Auto-graded objectives
- Manual essay grading
- AI-assisted essay scoring
- Feedback templates

### 12.3 Content Upload

#### E-Library Contributions
- Upload educational resources
- Organize by subject/topic
- Set access permissions
- Track engagement

---

## 13. Admin Panel

### 13.1 User Management

#### User Operations
- View all users
- Search and filter
- Edit user details
- Change user roles
- Suspend/activate accounts
- Delete accounts

#### Approval Workflow
- Pending teacher approvals
- Pending student approvals
- Bulk approval actions

### 13.2 Content Management

#### Question Management
- Add/edit/delete questions
- Import questions (CSV)
- Question quality review
- Tag management

#### Resource Moderation
- Review flagged content
- Approve/reject uploads
- Featured content curation

### 13.3 System Settings

#### Platform Configuration
- Feature toggles
- Rate limits
- Notification settings
- Maintenance mode

#### Analytics Access
- Full platform analytics
- Export capabilities
- Custom report generation

### 13.4 Audit System

- Complete action logging
- User activity trails
- Security event monitoring
- Data export for compliance

---

## 14. Database Schema

### 14.1 Core Tables

#### users
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT CHECK (role IN ('student', 'teacher', 'admin')),
    school TEXT,
    grade_level TEXT,
    house TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak_days INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_practice_date TEXT,
    is_verified INTEGER DEFAULT 0,
    is_approved INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);
```

#### library_resources
```sql
CREATE TABLE library_resources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    resource_type TEXT NOT NULL,
    content_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size INTEGER,
    duration INTEGER,
    subject_id TEXT,
    topic_id TEXT,
    school_level TEXT,
    access_level TEXT DEFAULT 'free',
    tags TEXT,
    uploaded_by TEXT NOT NULL,
    is_featured INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    is_downloadable INTEGER DEFAULT 1,
    views INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);
```

#### counselor_conversations
```sql
CREATE TABLE counselor_conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    counselor_type TEXT NOT NULL,
    title TEXT,
    status TEXT DEFAULT 'active',
    message_count INTEGER DEFAULT 0,
    last_message_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
```

### 14.2 Migration History

| Migration | Description |
|-----------|-------------|
| 001 | User verification system |
| 002 | Parent system |
| 003 | Audit logging |
| 004 | Assessment system |
| 005 | Quests system |
| 006 | Streak protection |
| 007 | Reminders system |
| 008 | E-Library system |
| 009 | AI Counselor |
| 010 | Counselor reports |
| 011 | Downloadable field |

---

## 15. API Reference

### 15.1 Authentication

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "role": "student",
  "school": "Presec Legon",
  "gradeLevel": "SHS 2"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "securepassword"
}

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "jwt-token-here"
  }
}
```

### 15.2 Protected Routes

All protected routes require:
```
Authorization: Bearer <jwt-token>
```

### 15.3 Response Format

Success:
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error:
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## 16. Deployment & Infrastructure

### 16.1 Cloudflare Services

| Service | Resource | Purpose |
|---------|----------|---------|
| Pages | brilla-study-platform | Frontend hosting |
| Workers | brilla-api | Backend API |
| D1 | brilla-db | SQLite database |
| R2 | brilla-library | File storage |

### 16.2 Environment Variables

#### Frontend (Cloudflare Pages)
| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API URL |

#### Backend (Cloudflare Workers)
| Variable | Description |
|----------|-------------|
| ENVIRONMENT | production/development |
| JWT_SECRET | JWT signing secret |
| ANTHROPIC_API_KEY | AI API key |
| AI_PROVIDER | AI service provider |
| AI_MODEL | AI model identifier |

### 16.3 Deployment Process

#### Frontend
```bash
npm run build
npx wrangler pages deploy dist --project-name=brilla-study-platform
```

#### Backend
```bash
npx wrangler deploy
```

#### Database Migrations
```bash
npx wrangler d1 execute brilla-db --remote --file=database/migrations/XXX.sql
```

---

## 17. Security Considerations

### 17.1 Authentication Security
- Passwords hashed with bcrypt (salt rounds: 10)
- JWT tokens with 7-day expiration
- Secure HTTP-only cookies option
- Rate limiting on auth endpoints

### 17.2 Data Protection
- HTTPS enforced in production
- Input validation on all endpoints
- SQL injection prevention via parameterized queries
- XSS protection through React's built-in escaping

### 17.3 Access Control
- Role-based permission system
- Resource ownership verification
- Admin approval for sensitive roles
- Audit logging for accountability

### 17.4 File Security
- File type validation on upload
- Size limits per resource type
- Virus scanning (recommended)
- Secure signed URLs for downloads

---

## 18. Future Roadmap

### Phase 1: Enhanced AI Features
- Voice-based AI tutoring
- Handwriting recognition for math
- Personalized study plan generation
- Predictive performance analytics

### Phase 2: Social Features
- Study groups
- Peer tutoring
- Discussion forums
- Collaborative note-taking

### Phase 3: Mobile Applications
- Native iOS application
- Native Android application
- Offline mode support
- Push notifications

### Phase 4: Institutional Features
- School dashboard
- District-level analytics
- Curriculum alignment tools
- LMS integration (Canvas, Moodle)

### Phase 5: Content Expansion
- More past papers
- Video explanations for all topics
- Interactive simulations
- Augmented reality labs

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| XP | Experience Points earned through platform activities |
| Streak | Consecutive days of practice |
| House | School-based team for competition |
| Quest | Daily or weekly challenge with rewards |
| Battle | Real-time 1v1 competitive practice session |
| Mock Exam | Full simulation of actual examination |
| AI Tutor | Intelligent assistant for explanations |
| AI Counselor | Virtual advisor for academic/career/wellbeing |

---

## Appendix B: Contact & Support

**Technical Support:**
For platform issues, contact the development team at Hodges & Co.

**Content Inquiries:**
For questions about educational content, contact platform administrators.

**Security Reports:**
For security vulnerabilities, report through responsible disclosure channels.

---

*This document is proprietary to Brilla Study Platform and Hodges & Co. Unauthorized distribution is prohibited.*

**Document End**
