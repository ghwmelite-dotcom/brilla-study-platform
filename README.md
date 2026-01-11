# Brilla Study Platform

<div align="center">

![Brilla Logo](public/icons/icon-192.png)

**Ghana's Premier AI-Powered Exam Preparation Platform**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-brillaprep.org-brightgreen?style=for-the-badge)](https://brillaprep.org)
[![License](https://img.shields.io/badge/License-Proprietary-blue?style=for-the-badge)](#license)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare)](https://workers.cloudflare.com/)

*Empowering Ghanaian students to excel in BECE, WASSCE, IGCSE, and A-Level examinations through intelligent, personalized learning.*

</div>

---

## Overview

Brilla Study Platform is a comprehensive, AI-powered educational platform designed specifically for Ghanaian students preparing for national and international examinations. Built with cutting-edge technology and a deep understanding of the Ghanaian educational system, Brilla provides an engaging, gamified learning experience that makes exam preparation effective and enjoyable.

### Mission

To democratize quality education in Ghana by providing every student, regardless of their background or location, access to world-class exam preparation resources powered by artificial intelligence.

### Key Statistics

- **4,000+** Practice Questions across all subjects
- **100+** Database migrations for robust data management
- **4** Major Exam Systems (BECE, WASSCE, IGCSE, A-Level)
- **20+** Subjects covered with detailed syllabi

---

## Features

### Core Learning Features

| Feature | Description |
|---------|-------------|
| **Smart Practice Mode** | Adaptive question selection based on student performance and weak areas |
| **Exam Simulation** | Timed mock exams replicating real exam conditions with authentic question formats |
| **AI Tutor** | 24/7 intelligent tutoring powered by Llama 3.3 70B for personalized explanations |
| **Essay Practice** | AI-graded essay writing with detailed feedback and improvement suggestions |
| **Syllabus Browser** | Complete WAEC and Cambridge syllabi with topic-wise practice |

### Gamification & Engagement

| Feature | Description |
|---------|-------------|
| **XP & Levels** | Earn experience points for every activity and level up |
| **Daily Streaks** | Maintain study streaks with streak protection shields |
| **House Cup** | Compete in school houses (Ashanti, Volta, Northern, Coastal) |
| **Leaderboards** | Weekly, monthly, and all-time rankings |
| **Achievements** | Unlock badges for milestones and accomplishments |
| **Quests** | Daily and weekly challenges for bonus rewards |

### Social Learning

| Feature | Description |
|---------|-------------|
| **Battle Mode** | Real-time quiz battles against friends or random opponents |
| **Study Groups** | Create and join study groups with classmates |
| **Community** | Discussion forums and peer support |
| **Friends System** | Connect with classmates and track each other's progress |

### Advanced Features

| Feature | Description |
|---------|-------------|
| **AI Career Counselor** | Personalized career guidance based on performance and interests |
| **Parent Dashboard** | Real-time progress monitoring for parents |
| **Teacher Portal** | Tools for teachers to create assessments and track students |
| **E-Library** | Digital textbooks, past papers, and study materials |
| **Whiteboard** | Interactive drawing tool for math and science problems |
| **Competition Mode** | Participate in regional and national academic competitions |

### Supported Examinations

#### Ghana National Exams
- **BECE** (Basic Education Certificate Examination)
  - English Language, Mathematics, Integrated Science, Social Studies
  - RME, BDT, ICT, French

- **WASSCE** (West African Senior School Certificate Examination)
  - Core: English, Core Mathematics, Integrated Science, Social Studies
  - Sciences: Physics, Chemistry, Biology, Elective Mathematics
  - Business: Economics, Accounting, Business Management, Cost Accounting
  - Arts: Literature, Government, History, Geography, CRS
  - Vocational: Foods & Nutrition, Technical Drawing

#### International Examinations
- **Cambridge IGCSE** (O-Level)
  - Physics, Chemistry, Biology, Mathematics (40 questions each)

- **Cambridge A-Level**
  - Physics, Chemistry, Biology, Mathematics (40 questions each)
  - Advanced topics including mechanics, organic chemistry, genetics, calculus

---

## Tech Stack

### Frontend
- **React 18** - Modern UI library with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Zustand** - Lightweight state management
- **React Router v6** - Client-side routing
- **Recharts** - Data visualization
- **KaTeX** - Mathematical equation rendering
- **Lucide React** - Beautiful icons

### Backend
- **Cloudflare Workers** - Edge computing for global low-latency
- **Hono** - Ultra-fast web framework
- **Cloudflare D1** - SQLite at the edge
- **Cloudflare R2** - Object storage for media
- **Workers AI** - AI inference with Llama 3.3 70B

### Infrastructure
- **Vite** - Next-generation build tool
- **PWA** - Installable progressive web app
- **Cloudflare Pages** - Global CDN deployment

---

## Project Structure

```
brilla-study-platform/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ai/             # AI tutor and counselor
│   │   ├── auth/           # Authentication flows
│   │   ├── battle/         # Quiz battle system
│   │   ├── dashboard/      # Dashboard widgets
│   │   ├── exam/           # Exam mode components
│   │   ├── gamification/   # XP, streaks, achievements
│   │   └── ...
│   ├── pages/              # Route pages
│   ├── stores/             # Zustand state stores
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and API client
│   ├── types/              # TypeScript definitions
│   └── config/             # App configuration
├── workers/
│   └── api/                # Cloudflare Workers API
│       └── index.ts        # API routes and handlers
├── database/
│   └── migrations/         # D1 database migrations (100+)
├── public/                 # Static assets and PWA manifest
└── docs/                   # Documentation
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account (for Workers and D1)
- Wrangler CLI

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ghwmelite-dotcom/brilla-study-platform.git
   cd brilla-study-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Configure the following in `.env.local`:
   ```
   VITE_API_URL=http://localhost:8787
   ```

4. **Set up Cloudflare secrets**
   ```bash
   wrangler secret put JWT_SECRET
   wrangler secret put RESEND_API_KEY
   wrangler secret put GOOGLE_CLIENT_ID
   wrangler secret put GOOGLE_CLIENT_SECRET
   ```

5. **Initialize the database**
   ```bash
   # Create D1 database
   wrangler d1 create brilla-db

   # Run migrations
   for file in database/migrations/*.sql; do
     wrangler d1 execute brilla-db --file="$file"
   done
   ```

6. **Start development servers**
   ```bash
   # Start both frontend and API
   npm run dev:all

   # Or separately:
   npm run dev      # Frontend on http://localhost:5173
   npm run dev:api  # API on http://localhost:8787
   ```

### Deployment

```bash
# Build frontend
npm run build

# Deploy API to Cloudflare Workers
wrangler deploy

# Deploy frontend to Cloudflare Pages
# (Configure Pages to build from the dist/ directory)
```

---

## Database Schema

The platform uses a comprehensive SQLite schema with 100+ migrations covering:

- **Users & Authentication** - Multi-role system (students, parents, teachers, admins)
- **Questions & Answers** - 4,000+ questions across all subjects and exam types
- **Progress Tracking** - XP, levels, streaks, and performance analytics
- **Gamification** - Achievements, quests, house points, and leaderboards
- **Social Features** - Friends, study groups, chat, and battles
- **Content Management** - E-library, syllabi, and past papers
- **AI Interactions** - Tutor conversations and counselor sessions

---

## API Endpoints

The API is built with Hono and provides RESTful endpoints for:

| Category | Endpoints |
|----------|-----------|
| Authentication | `/api/auth/*` - Login, register, OAuth, verification |
| Questions | `/api/questions/*` - Practice, exams, topic-based |
| Progress | `/api/progress/*` - XP, streaks, achievements |
| Social | `/api/friends/*`, `/api/groups/*`, `/api/battle/*` |
| AI | `/api/ai/*` - Tutor, counselor, essay grading |
| Admin | `/api/admin/*` - User management, analytics |

---

## Screenshots

<div align="center">

| Dashboard | Practice Mode | AI Tutor |
|:---------:|:-------------:|:--------:|
| Student dashboard with progress tracking | Adaptive question practice | 24/7 AI-powered tutoring |

| Exam Mode | Leaderboard | Mobile View |
|:---------:|:-----------:|:-----------:|
| Timed mock examinations | Competitive rankings | Responsive PWA design |

</div>

---

## Contributing

We welcome contributions from the community! Please read our contribution guidelines before submitting PRs.

### Development Guidelines

1. Follow TypeScript best practices
2. Use meaningful commit messages
3. Write tests for new features
4. Update documentation as needed
5. Follow the existing code style

### Reporting Issues

Found a bug or have a suggestion? Please open an issue on GitHub with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

---

## Roadmap

### Upcoming Features

- [ ] Offline mode with service worker caching
- [ ] Voice-based AI tutoring
- [ ] Video lessons integration
- [ ] School administration portal
- [ ] Regional competitions and tournaments
- [ ] Mobile apps (iOS & Android)
- [ ] More West African exam boards (NECO, JAMB)

---

## Support

- **Website**: [brillaprep.org](https://brillaprep.org)
- **Email**: brillaprepgh@gmail.com
- **Help Center**: [brillaprep.org/help](https://brillaprep.org/help)

---

## License

This project is proprietary software. All rights reserved.

Copyright (c) 2024-2025 Brilla Study Platform

---

## Acknowledgments

- Ghana Education Service for curriculum guidance
- WAEC for examination standards reference
- Cambridge Assessment for international examination frameworks
- The open-source community for amazing tools and libraries

---

<div align="center">

**Built with love for Ghanaian students**

*"Sanbra Brilla - Shine Bright, Study Smart"*

</div>
