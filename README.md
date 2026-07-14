# FixFlow

**Bug Triage & Engineering Productivity System**

FixFlow is a full-stack platform that automates the busywork of bug triage: it scores incoming bug reports for severity, flags likely duplicates, assigns bugs to the right engineer based on expertise and workload, and maintains a live, priority-ranked work queue — so engineering teams spend less time sorting bugs and more time fixing them.

**Live demo:** https://fix-flow-alpha.vercel.app/

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
  - [Severity scoring](#severity-scoring)
  - [Duplicate detection](#duplicate-detection)
  - [Assignment engine](#assignment-engine)
  - [Priority queue](#priority-queue)
- [Data model](#data-model)
- [API reference](#api-reference)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend setup](#backend-setup)
  - [Frontend setup](#frontend-setup)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Design system](#design-system)

---

## Overview

Software teams handling a high volume of bug reports run into the same problems: inconsistent manual prioritization, duplicate reports adding noise, and uneven workload distribution across engineers. FixFlow addresses this with a deterministic backend engine (no ML dependency required) that:

- Automatically calculates a bug's severity the moment it's submitted
- Detects duplicate/similar bug reports using text similarity
- Assigns bugs to engineers based on expertise and current workload
- Continuously generates a prioritized execution queue for the whole team

## Features

- **Bug intake** — submit bugs with title, description, steps to reproduce, module, and environment
- **Automatic severity scoring (0–100)** — combines keyword analysis, module impact, environment, and description depth into a `Low` / `Medium` / `High` / `Critical` label
- **Duplicate detection** — compares new bugs against all open bugs using the Sørensen–Dice similarity coefficient and surfaces likely matches
- **Smart assignment** — matches bugs to engineers by module expertise and lowest current workload, with capacity-aware fallback logic
- **Priority queue** — ranks all open/assigned bugs by a weighted score of severity, age, and assignment status
- **Engineer workload management** — tracks active bug count vs. capacity per engineer, with availability toggling
- **Dark, command-center UI** — a Next.js dashboard for browsing bugs, running triage, managing assignments, and viewing the priority queue

## Tech stack

**Backend** (`server/`)
- Node.js + TypeScript (ESM)
- Express 5
- PostgreSQL + Prisma ORM
- Zod for request validation
- JWT / bcrypt (auth primitives)

**Frontend** (`client/`)
- Next.js 16 (App Router) + React 19
- Tailwind CSS 4
- TanStack Query for data fetching
- Axios API client
- shadcn/ui-style component primitives

## Project structure

```
fix-flow/
├── client/                     # Next.js frontend
│   ├── app/
│   │   ├── page.tsx            # Dashboard
│   │   ├── bugs/                # Bug list + bug detail (bugs/[id])
│   │   ├── triage/              # Triage queue
│   │   └── assignments/         # Assignment / engineer workload view
│   ├── components/
│   │   ├── layout/               # Navbar, sidebar (app shell)
│   │   └── ui/                   # Button, card, badge, input primitives
│   ├── lib/
│   │   ├── api.ts               # Axios client + typed API calls
│   │   └── types.ts             # Shared frontend types (mirrors server models)
│   └── DESIGN.md                # UI/UX design system reference
│
└── server/                     # Express backend
    ├── prisma/
    │   └── schema.prisma        # BugReport, User, Assignment models
    ├── src/
    │   ├── controllers/         # Route handlers (bugs, assignments, priority, users)
    │   ├── services/            # severityService, duplicateService, assignmentService, priorityService
    │   ├── routes/               # Express routers per resource
    │   ├── models/               # Zod validators + shared types
    │   ├── config/               # env + Prisma client setup
    │   └── utils/                 # similarity scoring, validation middleware, error handling
    └── PRD.md                   # Product requirements document
```

## How it works

### Severity scoring

`server/src/services/severityService.ts` computes a deterministic score (0–100) for every submitted bug:

1. **Keyword analysis** — the title + description are scanned for critical (`crash`, `deadlock`, `security breach`, …), high (`failure`, `regression`, `blocker`, …), and medium-weight (`slow`, `inconsistent`, `flicker`, …) keywords, contributing up to 15/10/5 points each (capped at 50).
2. **Module impact** — each module (`auth`, `payment`, `security`, `database`, `api`, `core`, `ui`, `docs`) has a baseline impact weight.
3. **Description depth bonus** — longer, more detailed reports get a small bonus (up to +10), on the assumption that detail correlates with real complexity.
4. **Environment multiplier** — production issues are weighted up (×1.3), staging is neutral (×1.0), development/test are weighted down (×0.8 / ×0.6).

The final score is clamped to 0–100 and mapped to a label: `Critical` (≥75), `High` (≥50), `Medium` (≥25), `Low` (below).

### Duplicate detection

`server/src/services/duplicateService.ts` compares a new bug's title + description against every open (non-closed) bug using the **Sørensen–Dice coefficient** (`server/src/utils/similarity.ts`). Matches at or above a 0.5 similarity threshold are returned, sorted descending, capped at 5 results.

### Assignment engine

`server/src/services/assignmentService.ts` assigns a bug to an engineer by:

1. Filtering engineers who are `available`, have the bug's module in their `expertise`, and are under their `maxCapacity`.
2. Picking the eligible engineer with the lowest current `workload`.
3. Falling back to *any* available engineer under capacity (regardless of expertise) if no specialist is free.
4. Atomically creating the `Assignment`, incrementing the engineer's workload, and marking the bug `assigned` (via a Prisma transaction).

Unassigning a bug reverses this: deletes the assignment, decrements workload, and resets the bug to `open`.

### Priority queue

`server/src/services/priorityService.ts` ranks all `open`/`assigned` bugs with a weighted composite score:

```
priorityScore = severityScore * 0.6 + normalizedAge * 0.3 + unassignedBonus * 0.1
```

- `normalizedAge` scales the bug's age in hours to 0–100 (capped at 720 hours / 30 days)
- `unassignedBonus` gives unassigned bugs a full 100-point boost on that term, nudging them ahead of assigned bugs of similar severity/age

The queue is re-sorted descending by `priorityScore` on every request, with ranks assigned 1..N.

## Data model

Defined in `server/prisma/schema.prisma`:

- **`BugReport`** — title, description, steps to reproduce, module, environment, severity score/label, status (`open` → `assigned` → `in_progress` → `resolved` → `closed`), timestamps
- **`User`** — name, email, hashed password, role, expertise (string array), workload, max capacity, availability
- **`Assignment`** — links a `BugReport` (1:1) to a `User`, with a human-readable reason string

## API reference

Base path: `/api`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/bugs` | Submit a new bug (runs severity scoring + duplicate detection) |
| `GET` | `/bugs` | List bugs (optionally filter by `?status=`) |
| `GET` | `/bugs/:id` | Get a single bug |
| `PATCH` | `/bugs/:id/status` | Update a bug's status |
| `POST` | `/assign` | Assign a bug to the best-fit engineer |
| `DELETE` | `/assign/:bugId` | Unassign a bug |
| `GET` | `/priority` | Get the current priority queue |
| `POST` | `/users` | Create an engineer/user |
| `GET` | `/users` | List users |
| `GET` | `/users/:id` | Get a single user |
| `PATCH` | `/users/:id/availability` | Toggle an engineer's availability |

Example — submitting a bug:

```json
POST /api/bugs
{
  "title": "Login crash",
  "description": "App crashes on login",
  "module": "auth",
  "environment": "production"
}
```

```json
{
  "success": true,
  "data": {
    "bugId": "clx1a2b3c",
    "severity": { "score": 85, "label": "Critical" },
    "duplicates": [
      { "bugId": "clx0z9y8x", "title": "App crashes when logging in", "similarity": 0.82 }
    ]
  }
}
```

## Getting started

### Prerequisites

- Node.js v18+
- A PostgreSQL database

### Backend setup

```bash
cd server
npm install

# create a .env file (see Environment variables below)

npm run prisma:generate
npm run prisma:migrate
npm run dev          # starts the API on http://localhost:4000
```

### Frontend setup

```bash
cd client
npm install

# create a .env.local with NEXT_PUBLIC_API_URL pointing at the backend

npm run dev           # starts the Next.js app on http://localhost:3000
```

## Environment variables

**`server/.env`**

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the Express server listens on | `4000` |
| `NODE_ENV` | `development` / `production` / `test` | `development` |
| `DATABASE_URL` | PostgreSQL connection string (used by Prisma) | — |
| `JWT_SECRET` | Secret used to sign JWTs | `dev-secret-change-in-production` |

**`client/.env.local`**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the FixFlow API (e.g. `http://localhost:4000/api`) |

## Available scripts

**Server** (`server/package.json`)

| Script | Description |
|---|---|
| `npm run dev` | Run the API with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:migrate` | Run Prisma migrations |
| `npm run prisma:studio` | Open Prisma Studio |

**Client** (`client/package.json`)

| Script | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Build for production |
| `npm start` | Start the production build |
| `npm run lint` | Run ESLint |

## Design system

The frontend follows a dark-only, "engineering command center" aesthetic — deep dark surfaces, neon blue/red/yellow accents used sparingly for status and emphasis, monospace type for technical metadata (bug IDs, timestamps, module tags), and restrained motion. Full design tokens, component specs, and page-level layout guidance live in [`client/DESIGN.md`](./client/DESIGN.md).
