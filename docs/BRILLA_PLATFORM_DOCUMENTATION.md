# Brilla Study Platform
## Comprehensive Technical & Feature Documentation

**Document Version:** 2.0
**Last Updated:** December 26, 2025
**Prepared by:** Hodges & Co.
**Platform:** Brilla Study Platform

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Overview](#2-platform-overview)
3. [Technical Architecture](#3-technical-architecture)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Core Features](#5-core-features)
6. [AI Tutor System](#6-ai-tutor-system)
7. [E-Library System](#7-e-library-system)
8. [AI Student Counselor](#8-ai-student-counselor)
9. [Practice & Assessment System](#9-practice--assessment-system)
10. [Flashcard System](#10-flashcard-system)
11. [Competition & Gamification](#11-competition--gamification)
12. [Whiteboard & Recording System](#12-whiteboard--recording-system)
13. [Teacher Tutoring Directory](#13-teacher-tutoring-directory)
14. [Affiliate Program](#14-affiliate-program)
15. [Analytics & Reporting](#15-analytics--reporting)
16. [Parent Portal](#16-parent-portal)
17. [Teacher Dashboard](#17-teacher-dashboard)
18. [Admin Panel](#18-admin-panel)
19. [Progressive Web App (PWA)](#19-progressive-web-app-pwa)
20. [Database Schema](#20-database-schema)
21. [API Reference](#21-api-reference)
22. [Deployment & Infrastructure](#22-deployment--infrastructure)
23. [Security Considerations](#23-security-considerations)
24. [Troubleshooting Guide](#24-troubleshooting-guide)
25. [Future Roadmap](#25-future-roadmap)

---

## 1. Executive Summary

Brilla Study Platform is Ghana's premier educational technology solution designed for students preparing for national examinations including **NSMQ** (National Science & Maths Quiz), **WASSCE** (West African Senior School Certificate Examination), and **BECE** (Basic Education Certificate Examination).

The platform combines cutting-edge web technologies with artificial intelligence to deliver personalized learning experiences, competitive practice environments, and robust progress tracking for students, teachers, and parents.

### Key Highlights

| Feature | Description |
|---------|-------------|
| **10,000+ Practice Questions** | Comprehensive question bank across all major subjects |
| **AI-Powered Tutoring** | Instant explanations with image analysis capabilities |
| **E-Library** | Multimedia educational resources (PDFs, videos, audio) |
| **AI Student Counselor** | Academic, career, and wellbeing support |
| **NSMQ Competition Simulation** | All 5 rounds faithfully recreated |
| **Live 1v1 Battles** | Real-time competitive practice |
| **Flashcard System** | Spaced repetition learning |
| **Interactive Whiteboard** | Teacher recording and playback |
| **Teacher Directory** | Find and book tutoring sessions |
| **Affiliate Program** | Earn commissions through referrals |
| **PWA Support** | Install on any device, works offline |

### What's New in Version 2.0

- **AI Tutor File Upload**: Upload images of homework for AI analysis
- **Flashcard System**: Create and study with spaced repetition
- **Whiteboard Recording**: Teachers can record lessons
- **Teacher Tutoring Directory**: Find and book private tutors
- **Affiliate Program**: Earn money through referrals
- **PWA Enhancements**: Full offline support and device installation
- **Loading Animations**: Beautiful animated loading screens

---

## 2. Platform Overview

### 2.1 Target Audience

| User Type | Description | Age Range |
|-----------|-------------|-----------|
| **Students** | JHS and SHS students preparing for examinations | 12-18 years |
| **Teachers** | Educators managing classes and creating content | Adults |
| **Parents** | Guardians monitoring academic progress | Adults |
| **Administrators** | Platform managers and content moderators | Adults |

### 2.2 Supported Examinations

#### NSMQ (National Science & Maths Quiz)
- Full 5-round competition simulation
- Speed training for quick recall
- Riddles and problem-solving challenges
- Live 1v1 battle mode
- Team competition format

#### WASSCE (West African Senior School Certificate)
- 50+ subject coverage
- Past papers from 2015-2025
- AI-powered essay grading
- Theory and objective questions
- Practical exam preparation

#### BECE (Basic Education Certificate)
- Complete JHS curriculum coverage
- All 9 core subjects
- Practice tests with progress tracking
- Mock examination mode

### 2.3 Platform URLs

| Environment | URL | Purpose |
|-------------|-----|---------|
| Production (Frontend) | https://brillaprep.org | Main user-facing application |
| Production (API) | https://brilla-api.ghwmelite.workers.dev | Backend API services |
| Development | localhost:5173 | Local development |

### 2.4 Supported Browsers & Devices

| Platform | Browsers/Requirements |
|----------|----------------------|
| Desktop | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| Mobile | iOS Safari 14+, Chrome Mobile, Samsung Internet |
| Tablets | All modern tablet browsers |
| PWA | Installable on all platforms |

---

## 3. Technical Architecture

### 3.1 Technology Stack

#### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework with hooks |
| TypeScript | 5.x | Type-safe JavaScript |
| Vite | 5.x | Build tool and dev server |
| Tailwind CSS | 3.x | Utility-first styling |
| Zustand | 4.x | Lightweight state management |
| React Router | 6.x | Client-side routing |
| Lucide React | Latest | Modern icon library |
| Recharts | Latest | Data visualization |
| KaTeX | Latest | Mathematical notation |

#### Backend
| Technology | Purpose |
|------------|---------|
| Cloudflare Workers | Serverless compute (global edge) |
| Hono | Lightweight web framework |
| Cloudflare D1 | SQLite database (distributed) |
| Cloudflare R2 | Object storage for files |
| JWT | Stateless authentication |

#### AI Integration
| Provider | Model | Use Case |
|----------|-------|----------|
| Anthropic | Claude Sonnet 4 | AI Tutor with vision |
| Anthropic | Claude Sonnet 4 | Essay Grading |
| Anthropic | Claude Sonnet 4 | AI Counselor |

### 3.2 Project Structure

```
brilla-study-platform/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ai/              # AI Tutor components
│   │   ├── auth/            # Authentication components
│   │   ├── chat/            # Peer chat components
│   │   ├── common/          # Shared components
│   │   ├── counselor/       # AI Counselor components
│   │   ├── dashboard/       # Dashboard widgets
│   │   ├── layout/          # Layout components
│   │   ├── library/         # E-Library components
│   │   ├── practice/        # Practice components
│   │   └── whiteboard/      # Whiteboard components
│   ├── pages/               # Route page components
│   ├── stores/              # Zustand state stores
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript definitions
│   ├── utils/               # Utility functions
│   └── data/                # Static data & constants
├── workers/
│   └── api/                 # Cloudflare Workers API
│       ├── index.ts         # Main API router
│       ├── tutor.ts         # AI Tutor endpoints
│       ├── library.ts       # E-Library endpoints
│       ├── counselor.ts     # AI Counselor endpoints
│       ├── flashcards.ts    # Flashcard endpoints
│       ├── recordings.ts    # Recording endpoints
│       ├── tutoring.ts      # Tutoring directory
│       └── affiliate.ts     # Affiliate system
├── database/
│   └── migrations/          # D1 database migrations
├── public/
│   ├── icons/              # PWA icons
│   ├── splash/             # iOS splash screens
│   └── screenshots/        # PWA screenshots
├── scripts/                # Build and utility scripts
└── docs/                   # Documentation
```

### 3.3 State Management

| Store | Purpose |
|-------|---------|
| `authStore` | User authentication and sessions |
| `aiTutorStore` | AI Tutor chat and file uploads |
| `practiceStore` | Practice session management |
| `flashcardStore` | Flashcard decks and reviews |
| `libraryStore` | E-Library resources |
| `counselorStore` | AI Counselor conversations |
| `whiteboardStore` | Whiteboard and recordings |
| `tutoringStore` | Tutoring sessions |
| `affiliateStore` | Affiliate program data |
| `questStore` | Daily quests and achievements |
| `battleStore` | 1v1 battle state |
| `chatStore` | Peer messaging |

---

## 4. User Roles & Permissions

### 4.1 Role Definitions

#### Student
- Access practice questions and assessments
- Use AI Tutor with file upload capability
- Use AI Counselor for guidance
- Browse and download E-Library resources
- Create and study flashcards
- Participate in competitions and battles
- Track personal progress and analytics
- Complete daily quests and earn XP
- Book tutoring sessions
- Participate in affiliate program

#### Teacher
- All student permissions
- Create and manage classes
- Build custom assessments
- Upload resources to E-Library
- Create and share flashcard decks
- Use whiteboard with recording
- List in tutoring directory
- View student performance reports
- Grade essay submissions
- Earn through tutoring and referrals

#### Parent
- View linked children's progress
- Access performance reports
- Monitor study activity and streaks
- Receive notifications
- Manage subscription settings
- Participate in affiliate program

#### Administrator
- All teacher permissions
- User management (approve, suspend, delete)
- Content moderation
- System analytics and audit logs
- Platform configuration
- Affiliate payout management
- Teacher verification

### 4.2 Permission Matrix

| Feature | Student | Teacher | Parent | Admin |
|---------|:-------:|:-------:|:------:|:-----:|
| Practice Questions | ✓ | ✓ | - | ✓ |
| AI Tutor (with file upload) | ✓ | ✓ | - | ✓ |
| AI Counselor | ✓ | ✓ | - | ✓ |
| E-Library (View) | ✓ | ✓ | - | ✓ |
| E-Library (Upload) | - | ✓ | - | ✓ |
| Flashcards (Create) | ✓ | ✓ | - | ✓ |
| Flashcards (Public) | - | ✓ | - | ✓ |
| Whiteboard Recording | - | ✓ | - | ✓ |
| Tutoring Directory | View | List & Manage | - | Manage |
| Create Assessments | - | ✓ | - | ✓ |
| View Child Progress | - | - | ✓ | - |
| Affiliate Program | ✓ | ✓ | ✓ | ✓ |
| User Management | - | - | - | ✓ |
| Audit Logs | - | - | - | ✓ |

---

## 5. Core Features

### 5.1 Authentication System

#### Registration Flow
1. User selects role (Student, Teacher, Parent)
2. Provides email, password, and profile information
3. Students/Teachers select school and grade level
4. Teachers can set up tutoring profile
5. Account created (email verification optional)
6. Teachers require admin approval

#### Login Methods
- Email and password authentication
- Persistent sessions with JWT tokens (7-day expiry)
- Automatic session refresh
- "Remember me" functionality

#### Password Management
- Secure password reset via email
- Password strength requirements
- bcrypt hashing with salt

### 5.2 Dashboard

Each user role has a customized dashboard:

#### Student Dashboard
| Widget | Description |
|--------|-------------|
| XP Progress | Current level and XP to next level |
| Streak Status | Current streak with flame animation |
| Daily Quests | Progress on today's challenges |
| Quick Practice | One-click access to practice modes |
| Recent Activity | Timeline of recent actions |
| Upcoming Assessments | Scheduled tests and deadlines |
| Leaderboard Position | Current ranking |

#### Teacher Dashboard
| Widget | Description |
|--------|-------------|
| Class Overview | Student count and activity |
| Pending Grading | Assessments awaiting review |
| Tutoring Requests | Pending session bookings |
| Performance Summary | Class analytics |
| Quick Actions | Common task shortcuts |

#### Parent Dashboard
| Widget | Description |
|--------|-------------|
| Children Overview | All linked children's status |
| Activity Timeline | Recent study activities |
| Performance Trends | Weekly/monthly progress |
| Study Time | Hours studied this week |
| Alerts | Important notifications |

### 5.3 Subject & Topic System

The platform organizes content hierarchically:

```
Exam Type (NSMQ, WASSCE, BECE)
└── Subject (e.g., Mathematics)
    └── Topic (e.g., Algebra)
        └── Subtopic (e.g., Linear Equations)
            └── Questions (Multiple types)
```

#### Supported Subjects (50+)

**Core Subjects:**
- Mathematics (Core & Elective)
- English Language
- Integrated Science
- Social Studies

**Sciences:**
- Physics
- Chemistry
- Biology

**Languages:**
- French
- Literature in English
- Ghanaian Languages (Akan, Ga, Ewe)

**Humanities:**
- Geography
- History
- Economics
- Government
- Religious Studies

**Vocational/Technical:**
- ICT
- Business Management
- Accounting
- And more...

### 5.4 Question Types

| Type | Description | Scoring | Exams |
|------|-------------|---------|-------|
| Multiple Choice | 4 options, single answer | Auto-graded | All |
| True/False | Binary choice | Auto-graded | All |
| Fill in the Blank | Text input | Auto-graded | All |
| Short Answer | Brief response | Auto-graded | WASSCE, BECE |
| Essay | Long-form writing | AI + Manual | WASSCE |
| Speed Round | Time-limited (10s) | Auto-graded | NSMQ |
| Riddle | Word puzzles | Auto-graded | NSMQ |
| Problem of the Day | Multi-step | Partial credit | NSMQ |

---

## 6. AI Tutor System

### 6.1 Overview

The AI Tutor is powered by Claude Sonnet 4 and provides personalized tutoring assistance with advanced capabilities including image analysis for homework help.

### 6.2 Features

| Feature | Description |
|---------|-------------|
| Natural Conversation | Chat-based interface with typing animations |
| Image Analysis | Upload photos of homework for AI analysis |
| Step-by-Step Solutions | Detailed problem breakdowns |
| Concept Explanations | Clear explanations with examples |
| Hints System | Progressive hints (Level 1-3) |
| Exam-Specific Mode | NSMQ, WASSCE, or BECE context |
| Personalization | Uses student name and performance data |
| Quick Actions | Pre-defined prompts for common questions |

### 6.3 File Upload Feature

Students can upload files for AI analysis:

| File Type | Extensions | Max Size | Use Cases |
|-----------|------------|----------|-----------|
| Images | JPG, PNG, GIF, WebP | 10 MB | Homework photos, diagrams, handwriting |
| Documents | PDF | 10 MB | Past papers, textbook pages |

**Upload Process:**
1. Click the 📎 paperclip button
2. Select up to 3 files
3. Preview files before sending
4. Add optional message
5. AI analyzes and responds

**What AI Can Analyze:**
- Handwritten math problems
- Science diagrams and graphs
- Chemistry equations
- Physics circuit diagrams
- Biology diagrams
- Past paper questions
- Textbook pages

### 6.4 Conversation Modes

| Mode | System Prompt | Use Case |
|------|---------------|----------|
| General | Open-ended tutoring | Any question |
| Explanation | Explain a concept | After answering wrong |
| Hint | Progressive guidance | Stuck on a question |
| Step-by-Step | Detailed solution | Complex problems |

### 6.5 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tutor/chat` | Send message with optional attachments |
| POST | `/api/tutor/explain` | Get question explanation |
| POST | `/api/tutor/hint` | Get progressive hint |
| POST | `/api/tutor/step-by-step` | Get step-by-step solution |
| GET | `/api/tutor/conversations` | List conversations |
| GET | `/api/tutor/conversations/:id` | Get conversation |
| POST | `/api/tutor/feedback` | Rate response helpfulness |

---

## 7. E-Library System

### 7.1 Overview

The E-Library is a comprehensive digital resource management system for educational materials.

### 7.2 Supported Resource Types

| Type | Extensions | Max Size | Features |
|------|------------|----------|----------|
| PDF | .pdf | 50 MB | In-browser viewing, progress tracking |
| Video | .mp4, .webm, .mov | 500 MB | Streaming playback, chapters |
| Audio | .mp3, .wav, .m4a | 100 MB | Audio player with speed control |
| Document | .doc, .docx, .txt | 20 MB | Download only |
| Interactive | .html, .zip | 50 MB | Embedded iframe |
| Link | URL | - | External resource linking |

### 7.3 Resource Management

#### Upload Process
1. Select resource type
2. Drag and drop or browse for file
3. Enter metadata:
   - Title (required)
   - Description
   - Subject association
   - Topic association
   - School level (JHS, SHS, Both)
   - Access level (Free, Basic, Premium)
   - Tags (comma-separated)
4. Configure options:
   - Downloadable toggle
   - Featured toggle
5. Submit for processing

### 7.4 Collections

Users can organize resources:
- Create named collections
- Add resources to multiple collections
- Reorder resources
- Share public collections
- Collaborate on collections

### 7.5 Features

| Feature | Description |
|---------|-------------|
| Full-text Search | Search titles, descriptions, and tags |
| Advanced Filtering | Filter by type, subject, level, access |
| Smart Sorting | Newest, popular, rating, alphabetical |
| Progress Tracking | Track viewing/reading progress |
| Ratings & Reviews | 5-star system with comments |
| Bookmarking | Save for quick access |
| Download Tracking | Analytics on downloads |

---

## 8. AI Student Counselor

### 8.1 Overview

AI-powered guidance across three specialized domains.

### 8.2 Counselor Types

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
- Motivation and confidence
- Anxiety coping strategies
- Professional referrals when needed

### 8.3 Safety Measures

- Sentiment detection for concerning messages
- Automatic escalation protocols
- Professional referral recommendations
- Conversation flagging for review
- Crisis resource provision

---

## 9. Practice & Assessment System

### 9.1 Practice Modes

#### Topic Drill
- Select subject and topic
- Choose difficulty level
- Set question count
- Immediate feedback
- AI Tutor available

#### Speed Race
- NSMQ-style rapid questions
- 10-second timer
- First-correct scoring
- Leaderboard ranking

#### Flashcard Mode
- Study flashcard decks
- Spaced repetition
- Self-rating system
- Progress tracking

### 9.2 Mock Exams

Full examination simulation:
- Realistic timing
- Question paper format
- All question types
- Comprehensive results
- Performance analysis

### 9.3 Past Papers

Available papers:
- WASSCE (2015-2025)
- BECE (2015-2025)
- NSMQ regional qualifiers
- Original marking schemes
- AI essay grading

### 9.4 AI Essay Grading

Process:
1. Student submits essay
2. AI analyzes:
   - Content accuracy
   - Structure and organization
   - Grammar and spelling
   - Argument quality
3. Generates score based on rubric
4. Provides detailed feedback
5. Suggests improvements

---

## 10. Flashcard System

### 10.1 Overview

Spaced repetition learning system for effective memorization.

### 10.2 Features

| Feature | Description |
|---------|-------------|
| Create Decks | Organize cards by subject/topic |
| Card Types | Text, image, formula (LaTeX) |
| Spaced Repetition | Optimized review schedule |
| Self-Rating | Rate difficulty (1-5) |
| Progress Tracking | Mastery percentage |
| Public Decks | Browse community decks |
| Import/Export | Share deck files |

### 10.3 Review Process

1. Card front shown
2. User recalls answer
3. Reveal back of card
4. Self-rate difficulty:
   - 1: Again (show soon)
   - 2: Hard (show later today)
   - 3: Good (show in a few days)
   - 4: Easy (show in a week+)
5. Algorithm schedules next review

### 10.4 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/flashcards/decks` | List user's decks |
| POST | `/api/flashcards/decks` | Create new deck |
| GET | `/api/flashcards/decks/:id` | Get deck with cards |
| GET | `/api/flashcards/due` | Get cards due for review |
| POST | `/api/flashcards/:id/review` | Submit review rating |
| GET | `/api/flashcards/public` | Browse public decks |

---

## 11. Competition & Gamification

### 11.1 NSMQ Competition Mode

Full simulation of all 5 rounds:

#### Round 1: Fundamentals
- 16 questions
- 30 seconds each
- Basic recall
- Individual scoring

#### Round 2: Speed Race
- 12 questions
- First correct wins
- 10 seconds limit
- Bonus for speed

#### Round 3: Problem of the Day
- 1 complex problem
- Extended time (5 minutes)
- Up to 10 points
- Partial credit available

#### Round 4: True or False
- Rapid-fire format
- 15 seconds each
- +2/-2 points
- Strategy important

#### Round 5: Riddles
- Word puzzles
- 3 clues per riddle
- 5-3 points based on clue number
- Lateral thinking required

### 11.2 Live 1v1 Battles

Real-time competitive mode:
- Skill-based matchmaking
- Synchronized questions
- Live score updates
- Victory animations
- XP rewards
- Battle history

### 11.3 House System

School team competition:
- Join your school house
- Contribute points
- Weekly rankings
- House Cup championship
- Special house events

### 11.4 Leaderboards

| Leaderboard | Scope | Criteria |
|-------------|-------|----------|
| National | All users | Total XP |
| School | Same school | Weekly XP |
| Subject | Per subject | Accuracy + XP |
| Battle | Battle mode | Win rate |
| Weekly | All users | This week's XP |

### 11.5 XP System

| Action | XP Reward |
|--------|-----------|
| Answer correctly | 10 XP |
| Complete topic | 50 XP |
| Daily streak | 25 XP |
| Win battle | 100 XP |
| Complete quest | Variable |
| First time correct | Bonus 5 XP |

### 11.6 Achievements

- **First Steps**: Complete first practice session
- **Streak Master**: Maintain 30-day streak
- **Battle Champion**: Win 50 battles
- **Subject Expert**: Master all topics in a subject
- **Speed Demon**: Answer 100 questions under 5 seconds
- **Social Butterfly**: Add 10 friends
- **Helpful Hand**: Get 50 upvotes on forum posts
- **Flashcard Guru**: Review 1000 cards

---

## 12. Whiteboard & Recording System

### 12.1 Overview

Interactive whiteboard for teachers with recording capability.

### 12.2 Features

| Feature | Description |
|---------|-------------|
| Drawing Tools | Pen, highlighter, shapes, text |
| Colors | Full color palette |
| Undo/Redo | Complete action history |
| Pages | Multiple whiteboard pages |
| Recording | Record teaching sessions |
| Playback | Students watch recordings |
| Cloud Storage | Recordings saved to R2 |
| Sharing | Share with classes or publicly |

### 12.3 Recording Process

1. Teacher creates new whiteboard
2. Clicks "Start Recording"
3. All actions captured in real-time
4. Teacher explains using audio (optional)
5. Clicks "Stop Recording"
6. Recording saved and processed
7. Students can access and playback

### 12.4 Playback Features

- Play/pause controls
- Speed adjustment (0.5x - 2x)
- Seek to any point
- Full-screen mode
- Download option (teachers)

---

## 13. Teacher Tutoring Directory

### 13.1 Overview

Marketplace connecting students with verified tutors.

### 13.2 For Teachers

#### Profile Setup
- Professional bio
- Teaching subjects
- Qualifications
- Experience years
- Hourly rate
- Availability schedule
- Teaching style

#### Management
- Accept/decline requests
- Schedule sessions
- Conduct sessions
- Track earnings
- Receive reviews

### 13.3 For Students

#### Finding Tutors
- Browse directory
- Filter by subject, price, rating
- View teacher profiles
- Check availability
- Read reviews

#### Booking Process
1. Select teacher
2. Choose subject/topic
3. Pick available slot
4. Write session goals
5. Submit request
6. Wait for acceptance
7. Attend session

### 13.4 Session Types

| Type | Description | Duration |
|------|-------------|----------|
| One-on-One | Private session | 30-120 min |
| Group Session | Multiple students | 60-120 min |
| Quick Help | Brief questions | 15-30 min |

---

## 14. Affiliate Program

### 14.1 Overview

Earn commissions by referring new users to Brilla Prep.

### 14.2 How It Works

1. **Get Your Link**: Unique referral code/link
2. **Share**: Send to friends, post on social media
3. **Track**: Monitor clicks and signups
4. **Earn**: Receive commission on paid subscriptions

### 14.3 Commission Structure

| Action | Commission |
|--------|------------|
| Free Signup | GHS 0 (tracked) |
| Basic Subscription | 15% of payment |
| Premium Subscription | 20% of payment |
| Recurring (Monthly) | 10% ongoing |

### 14.4 Payout

- Minimum payout: GHS 50
- Payment methods: Mobile Money, Bank Transfer
- Payout schedule: Monthly (1st of month)
- Dashboard for tracking earnings

### 14.5 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/affiliate/stats` | Get referral statistics |
| GET | `/api/affiliate/referrals` | List referred users |
| GET | `/api/affiliate/earnings` | View earnings history |
| POST | `/api/affiliate/withdraw` | Request payout |

---

## 15. Analytics & Reporting

### 15.1 Student Analytics

#### Performance Dashboard
- Overall accuracy trend
- Subject-by-subject breakdown
- Strength/weakness analysis
- Time spent studying
- Peer comparison (percentile)

#### Exportable Reports
- Weekly summaries
- Monthly detailed reports
- PDF export
- Share with parents

### 15.2 Teacher Analytics

#### Class Performance
- Class averages
- Individual progress
- Topic coverage heatmap
- Assessment analysis

#### Engagement Metrics
- Resource views
- Session attendance
- Question attempts
- Completion rates

### 15.3 Admin Analytics

#### Platform Metrics
- DAU/WAU/MAU
- Question attempts
- Popular content
- Revenue tracking

#### Audit System
- User actions
- Content changes
- Security events
- Data export

---

## 16. Parent Portal

### 16.1 Features

#### Child Linking
- Request link via child's email
- Child approves in-app
- Support for multiple children

#### Progress Monitoring
- Real-time activity feed
- Session summaries
- Assessment results
- Streak status
- XP and level

#### Reports & Notifications
- Weekly email summaries
- Performance alerts
- Achievement celebrations
- Study time reminders

### 16.2 Settings

- Notification preferences
- Report frequency
- Privacy controls
- Child account oversight

---

## 17. Teacher Dashboard

### 17.1 Class Management

#### Create Classes
- Class name and description
- Grade level
- Subject assignment
- Enrollment settings (code, open, invite)

#### Student Management
- View enrolled students
- Add/remove students
- Assign groups
- Track individual progress

### 17.2 Assessment Tools

#### Assessment Builder
- Question bank access
- Custom question creation
- Multiple types
- Time limits
- Scheduling
- Auto-grading + manual review

### 17.3 Content Creation

- Upload to E-Library
- Create flashcard decks
- Record whiteboard lessons
- Share with classes

---

## 18. Admin Panel

### 18.1 User Management

- View all users
- Search and filter
- Edit profiles
- Change roles
- Suspend/activate
- Delete accounts
- Bulk actions

### 18.2 Content Management

- Question CRUD
- CSV import
- Quality review
- Resource moderation
- Featured curation

### 18.3 System Settings

- Feature toggles
- Rate limits
- Email templates
- Maintenance mode

### 18.4 Financial

- Subscription management
- Affiliate payouts
- Revenue reports
- Teacher payments

---

## 19. Progressive Web App (PWA)

### 19.1 Overview

Brilla Prep is a fully-featured Progressive Web App, installable on any device.

### 19.2 Installation

#### Android (Chrome)
1. Visit brillaprep.org
2. Tap "Add to Home Screen" prompt
3. Or: Menu → "Install app"
4. Confirm installation
5. App appears on home screen

#### iOS (Safari)
1. Visit brillaprep.org
2. Tap Share button
3. Select "Add to Home Screen"
4. Confirm with "Add"
5. App appears on home screen

#### Desktop (Chrome/Edge)
1. Visit brillaprep.org
2. Click install icon in address bar
3. Or: Menu → "Install Brilla Prep"
4. Confirm installation
5. App opens in own window

### 19.3 Features

| Feature | Description |
|---------|-------------|
| Offline Support | Core features work offline |
| Push Notifications | Quest reminders, streak alerts |
| Background Sync | Sync data when online |
| App-like Experience | Full-screen, no browser UI |
| Auto-Update | Always latest version |
| Shortcuts | Quick access to Practice, Dashboard |

### 19.4 Splash Screens

Custom splash screens for all devices:
- iPhone SE through iPhone 15 Pro Max
- All iPad models
- Android devices
- Desktop browsers

---

## 20. Database Schema

### 20.1 Core Tables

```sql
-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT CHECK (role IN ('student', 'teacher', 'parent', 'admin')),
    school TEXT,
    school_level TEXT,
    year_group TEXT,
    house TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak_days INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_practice_date TEXT,
    referral_code TEXT UNIQUE,
    referred_by TEXT,
    is_verified INTEGER DEFAULT 0,
    is_approved INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Flashcard tables
CREATE TABLE flashcard_decks (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    name TEXT NOT NULL,
    description TEXT,
    subject_id TEXT,
    topic_id TEXT,
    is_public INTEGER DEFAULT 0,
    card_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE flashcards (
    id TEXT PRIMARY KEY,
    deck_id TEXT REFERENCES flashcard_decks(id),
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    image_url TEXT,
    ease_factor REAL DEFAULT 2.5,
    interval INTEGER DEFAULT 1,
    next_review_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Whiteboard recordings
CREATE TABLE whiteboard_recordings (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    subject_id TEXT,
    topic_id TEXT,
    duration INTEGER,
    recording_url TEXT,
    thumbnail_url TEXT,
    is_public INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Affiliate system
CREATE TABLE affiliate_referrals (
    id TEXT PRIMARY KEY,
    referrer_id TEXT REFERENCES users(id),
    referred_id TEXT REFERENCES users(id),
    status TEXT DEFAULT 'pending',
    commission_earned REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE affiliate_payouts (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    amount REAL NOT NULL,
    payment_method TEXT,
    payment_details TEXT,
    status TEXT DEFAULT 'pending',
    processed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
```

### 20.2 Migration History

| # | Migration | Description |
|---|-----------|-------------|
| 001 | User verification | Email verification system |
| 002 | Parent system | Parent-child linking |
| 003 | Audit logging | Action tracking |
| 004 | Assessments | Teacher assessments |
| 005 | Quests | Daily quest system |
| 006 | Streak protection | Streak freeze feature |
| 007 | Reminders | Study reminders |
| 008 | E-Library | Resource management |
| 009 | AI Counselor | Counselor conversations |
| 010 | Counselor reports | Report generation |
| ... | ... | ... |
| 025 | Whiteboard recordings | Recording system |
| 026 | Whiteboards | Whiteboard management |
| 027+ | Ongoing | New features |

---

## 21. API Reference

### 21.1 Authentication

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "securepassword123",
  "name": "Kofi Mensah",
  "role": "student",
  "school": "Presec Legon",
  "schoolLevel": "shs",
  "yearGroup": "2"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "securepassword123"
}

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 21.2 Protected Routes

All authenticated routes require:
```http
Authorization: Bearer <jwt-token>
```

### 21.3 Response Format

**Success:**
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

**Error:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

### 21.4 Key Endpoints

| Category | Endpoints |
|----------|-----------|
| Auth | `/auth/register`, `/auth/login`, `/auth/me` |
| Practice | `/questions`, `/practice/sessions`, `/practice/submit` |
| AI Tutor | `/tutor/chat`, `/tutor/explain`, `/tutor/hint` |
| Flashcards | `/flashcards/decks`, `/flashcards/due`, `/flashcards/review` |
| Library | `/library/resources`, `/library/upload`, `/library/collections` |
| Battles | `/battles/create`, `/battles/join`, `/battles/submit` |
| Analytics | `/analytics/user`, `/analytics/progress` |

---

## 22. Deployment & Infrastructure

### 22.1 Cloudflare Services

| Service | Resource | Purpose |
|---------|----------|---------|
| Pages | brilla-study-platform | Frontend hosting |
| Workers | brilla-api | Backend API |
| D1 | brilla-db | SQLite database |
| R2 | brilla-library | File storage |

### 22.2 Environment Variables

#### Frontend
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |

#### Backend
| Variable | Description |
|----------|-------------|
| `ENVIRONMENT` | production/development |
| `JWT_SECRET` | JWT signing secret |
| `ANTHROPIC_API_KEY` | Claude API key |

### 22.3 Deployment Commands

```bash
# Build frontend
npm run build

# Deploy frontend
npx wrangler pages deploy dist --project-name=brilla-study-platform

# Deploy backend
npx wrangler deploy

# Run database migration
npx wrangler d1 execute brilla-db --remote --file=database/migrations/XXX.sql
```

---

## 23. Security Considerations

### 23.1 Authentication Security
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 7-day expiration
- Rate limiting on auth endpoints
- Account lockout after failed attempts

### 23.2 Data Protection
- HTTPS enforced
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)
- XSS protection (React escaping)
- CORS configuration

### 23.3 Access Control
- Role-based permissions
- Resource ownership verification
- Admin approval workflows
- Complete audit logging

### 23.4 File Security
- Type validation on upload
- Size limits enforced
- Secure signed URLs
- Content-Type verification

---

## 24. Troubleshooting Guide

### 24.1 Common Issues

#### "Login Failed"
- Verify email and password
- Check if account is approved
- Clear browser cache
- Try password reset

#### "AI Tutor Not Responding"
- Check internet connection
- Refresh the page
- Try again in a few minutes
- File may be too large (max 10MB)

#### "PWA Not Installing"
- Ensure HTTPS connection
- Use supported browser
- Check browser settings
- Try clearing cache

#### "Practice Not Loading"
- Check internet connection
- Verify subscription status
- Clear cache and refresh
- Contact support if persists

### 24.2 Contact Support

- **Email**: support@brillaprep.org
- **In-App**: Help Center → Contact Us
- **Response Time**: Within 24 hours

---

## 25. Future Roadmap

### Phase 1: Enhanced AI (Q1 2026)
- Voice-based tutoring
- Handwriting recognition
- Personalized study plans
- Predictive analytics

### Phase 2: Social Features (Q2 2026)
- Study groups
- Peer tutoring
- Discussion forums
- Collaborative notes

### Phase 3: Mobile Apps (Q3 2026)
- Native iOS app
- Native Android app
- Full offline mode
- Push notifications

### Phase 4: Institutional (Q4 2026)
- School dashboards
- District analytics
- LMS integration
- Curriculum alignment

### Phase 5: Content Expansion (2027)
- Video explanations
- Interactive simulations
- AR/VR labs
- More past papers

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| XP | Experience Points earned through activities |
| Streak | Consecutive days of practice |
| House | School-based team for competition |
| Quest | Daily or weekly challenge |
| Battle | Real-time 1v1 competitive practice |
| Mock Exam | Full examination simulation |
| AI Tutor | Intelligent tutoring assistant |
| AI Counselor | Virtual advisor |
| PWA | Progressive Web App |
| Spaced Repetition | Learning technique for memorization |

---

## Appendix B: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Submit answer / Send message |
| `Esc` | Close modal / Cancel |
| `Ctrl/Cmd + K` | Open quick search |
| `Space` | Flip flashcard |
| `1-5` | Rate flashcard difficulty |

---

## Appendix C: API Rate Limits

| Endpoint | Limit |
|----------|-------|
| Auth | 10 requests/minute |
| AI Tutor | 30 requests/minute |
| Questions | 100 requests/minute |
| File Upload | 10 requests/minute |
| General | 200 requests/minute |

---

## Appendix D: Contact & Support

**Technical Support:**
support@brillaprep.org

**Business Inquiries:**
business@brillaprep.org

**Security Reports:**
security@brillaprep.org

---

*This document is proprietary to Brilla Study Platform. Unauthorized distribution is prohibited.*

**Document Version:** 2.0
**Last Updated:** December 26, 2025
**Document End**
