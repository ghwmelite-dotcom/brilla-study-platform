<p align="center">
  <img src="docs/assets/hero-banner.svg" alt="Brilla Study Platform" width="100%">
</p>

<p align="center">
  <a href="https://brillaprep.org"><img src="https://img.shields.io/badge/Live-brillaprep.org-fcd116?style=for-the-badge&logo=googlechrome&logoColor=050807" alt="Live site"></a>
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=050807" alt="React 18.3">
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5.6">
  <img src="https://img.shields.io/badge/Cloudflare-Workers%20%C2%B7%20D1%20%C2%B7%20R2%20%C2%B7%20AI-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 3.4">
  <img src="https://img.shields.io/badge/License-Proprietary-ce1126?style=for-the-badge" alt="Proprietary license">
</p>

<p align="center">
  <strong>AI-powered exam preparation for BECE, WASSCE, NSMQ, and Cambridge IGCSE / A-Level — built in Ghana, for Ghanaian students first.</strong>
</p>

<p align="center">
  <a href="#overview">Overview</a> ·
  <a href="#key-features">Features</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#project-structure">Structure</a> ·
  <a href="#roadmap">Roadmap</a> ·
  <a href="#contributing">Contributing</a>
</p>

---

## Overview

**Brilla Study Platform** is a full-stack, AI-driven exam preparation platform serving students across Ghana and beyond. It combines an exam-authentic question bank and past-paper library with a proactive **AI Revision Classroom**, a 24/7 AI tutor, real-time quiz battles, and deep gamification (XP, streaks, houses, quests, leaderboards) — all delivered as an installable PWA backed by a serverless Cloudflare edge stack.

The platform supports five exam systems end-to-end:

| Exam | Level | Coverage |
|------|-------|----------|
| **BECE** | JHS | Core subjects incl. English, Maths, Integrated Science, Social Studies, RME, ICT, French |
| **WASSCE** | SHS | Core, science, business, arts and vocational electives |
| **NSMQ** | SHS | Speed-race, Problem of the Day, True/False and riddle round simulations |
| **Cambridge IGCSE** | O-Level | Physics (0625), Chemistry (0620), Biology (0610), Mathematics (0580) |
| **Cambridge A-Level** | Pre-university | Physics (9702), Chemistry (9701), Biology (9700), Mathematics (9709) |

## Key Features

<table>
  <tr>
    <td align="center" width="33%">
      <img src="docs/assets/icon-ai-classroom.svg" width="72" alt="AI Revision Classroom"><br>
      <strong>AI Revision Classroom</strong><br>
      <sub>A proactive AI teacher that leads structured lessons — Hook &#8594; Explain &#8594; Check &#8594; Practice &#8594; Confirm &#8594; Connect — with checkpoints and mastery tracking via spaced repetition.</sub>
    </td>
    <td align="center" width="33%">
      <img src="docs/assets/icon-ai-tutor.svg" width="72" alt="AI Tutor"><br>
      <strong>24/7 AI Suite</strong><br>
      <sub>Llama 3.3 70B tutor with KaTeX math rendering, an AI essay grader with mark schemes, and an AI career counselor.</sub>
    </td>
    <td align="center" width="33%">
      <img src="docs/assets/icon-exams.svg" width="72" alt="Exam practice"><br>
      <strong>Exam-Authentic Practice</strong><br>
      <sub>Adaptive smart practice, timed mock exams, and official past papers with mark schemes across all five exam systems.</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="docs/assets/icon-gamification.svg" width="72" alt="Gamification"><br>
      <strong>Gamified Learning</strong><br>
      <sub>XP and levels, daily streaks with shields, 50+ achievements, daily/weekly quests, and the four-house House Cup.</sub>
    </td>
    <td align="center">
      <img src="docs/assets/icon-battles.svg" width="72" alt="Battles"><br>
      <strong>Battles &amp; Study Rooms</strong><br>
      <sub>Real-time solo and team quiz battles, multiplayer study rooms, friends, chat, and community forums.</sub>
    </td>
    <td align="center">
      <img src="docs/assets/icon-dashboards.svg" width="72" alt="Dashboards"><br>
      <strong>Parents, Teachers &amp; Admins</strong><br>
      <sub>Parent dashboards with reports and notifications, teacher assessment builder and grading, plus a full admin and moderation portal.</sub>
    </td>
  </tr>
</table>

Also on board: an **e-library** with multimedia content (R2-backed), an **interactive whiteboard** with recorded sessions, a **tutoring marketplace**, an **affiliate program**, and **subscriptions &amp; payments** via Paystack (incl. mobile money).

## Architecture

<p align="center">
  <img src="docs/assets/architecture.svg" alt="Brilla system architecture" width="100%">
</p>

The frontend is a React 18 SPA (73 route pages, 49 Zustand stores) built with Vite and deployed to Cloudflare Pages. The backend is a single Cloudflare Worker running a Hono router with 28 route modules (`workers/api/index.ts`), backed by Cloudflare D1 (SQLite, 109 migrations), two R2 buckets (e-library media, whiteboard recordings), and Workers AI (Llama 3.3 70B) for all AI features. A cron trigger runs every six hours to clean up expired demo data. Email goes through Resend, sign-in supports Google OAuth, and payments run through Paystack.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18.3, TypeScript 5.6, Vite 5, Tailwind CSS 3.4, Framer Motion, Zustand 5, React Router 6 |
| **Specialized UI** | KaTeX (math), Recharts (analytics), Fabric.js (whiteboard), react-pdf, Lucide icons |
| **Backend** | Cloudflare Workers, Hono 4, jose (JWT auth) |
| **Data** | Cloudflare D1 (SQLite at the edge), Cloudflare R2 (object storage) |
| **AI** | Cloudflare Workers AI — `@cf/meta/llama-3.3-70b-instruct-fp8-fast` |
| **Services** | Resend (email), Google OAuth, Paystack (payments &amp; MoMo) |
| **Tooling** | Wrangler 3, ESLint 9, PostCSS, PWA (service worker + manifest) |

## Getting Started

### Prerequisites

- Node.js 18+
- A Cloudflare account with the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### Installation

```bash
git clone https://github.com/ghwmelite-dotcom/brilla-study-platform.git
cd brilla-study-platform
npm install

# Frontend env: point the SPA at the API
cp .env.example .env.local   # VITE_API_URL=http://localhost:8787/api
```

### Run locally

```bash
npm run dev        # Frontend (Vite) on http://localhost:3000
npm run dev:api    # API (wrangler dev) on http://localhost:8787
npm run dev:all    # Both, via concurrently
```

### Database

D1 migrations live in `database/migrations/` and are wired in `wrangler.toml`:

```bash
wrangler d1 create brilla-db
for file in database/migrations/*.sql; do
  wrangler d1 execute brilla-db --local --file="$file"
done
```

### Worker secrets

```bash
wrangler secret put JWT_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

### Build &amp; deploy

```bash
npm run build      # tsc -b && vite build
npm run lint       # ESLint
wrangler deploy    # API to Cloudflare Workers
```

## Project Structure

```
brilla-study-platform/
├── src/
│   ├── components/        # 46 UI domains: ai, battle, exam, gamification,
│   │                      #   whiteboard, parent, subscription, tutor-classroom...
│   ├── pages/             # 73 route pages (RevisionClassroom, Battle, MockExams,
│   │                      #   ParentDashboard, AdminAnalytics, HouseCup, ...)
│   ├── stores/            # 49 Zustand stores (auth, exam, battle, quest, ...)
│   ├── hooks/  lib/  services/  utils/
│   ├── config/            # examConfig, freemiumConfig
│   └── data/              # static exam & subject data
├── workers/api/           # Hono Worker — 28 route modules
│   ├── index.ts           #   router, auth, cron handler (~10k lines)
│   ├── revision-classroom.ts
│   └── ...                # tutor, teambattles, payments, whiteboards, ...
├── database/migrations/   # 109 D1 (SQLite) migrations
├── public/                # PWA manifest, service worker, icons, offline page
├── scripts/               # PWA icon/asset generators
└── docs/                  # platform docs, user manual, README assets
```

## Roadmap

**Shipped**
- AI Revision Classroom with 6-phase pedagogy and spaced-repetition mastery
- Cambridge IGCSE &amp; A-Level subject coverage
- Multiplayer study rooms, team battles, House Cup, quests &amp; achievements
- Teacher assessment builder, parent dashboards, tutoring marketplace

**In progress**
- Edexcel IGCSE / A-Level support
- Voice-based AI tutoring
- Expanded Cambridge subjects (English, Economics, Business)

**Planned**
- Native mobile apps (iOS &amp; Android)
- School administration portal and regional competitions
- West African expansion (NECO, JAMB, WAEC Nigeria)

## Contributing

Contributions are welcome:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes and push the branch
4. Open a Pull Request

Please follow the existing TypeScript conventions, run `npm run lint` before submitting, and update documentation when behavior changes.

## License

This project is proprietary software. All rights reserved.

Copyright (c) 2024–2026 Brilla Study Platform.

---

<p align="center">
  <strong>Sanbra Brilla — shine bright, study smart.</strong><br>
  <sub>Built with React, TypeScript, and Cloudflare Workers · Made in Ghana</sub><br><br>
  <a href="https://brillaprep.org"><img src="https://img.shields.io/badge/Made%20in-Ghana-006B3F?style=flat-square" alt="Made in Ghana"></a>
  <a href="https://github.com/ghwmelite-dotcom/brilla-study-platform"><img src="https://img.shields.io/github/stars/ghwmelite-dotcom/brilla-study-platform?style=flat-square" alt="GitHub stars"></a>
</p>
