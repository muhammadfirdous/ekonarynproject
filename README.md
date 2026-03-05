# Эко Нарын — Recycling Platform

A full-stack recycling management platform for **Eko Naryn**, a small recycling business in Naryn, Kyrgyzstan. Collects PET/HDPE plastic, cardboard, and paper from residents.

## Architecture

```
ekonaryn/
├── apps/
│   ├── website/        → Public-facing Next.js site       (port 3000)
│   ├── dashboard/      → Admin panel (Next.js)            (port 3001)
│   └── mobile/         → React Native app (Expo)
├── packages/
│   ├── api/            → Express.js REST API              (port 4000)
│   ├── db/             → Prisma schema + PostgreSQL
│   └── shared/         → Shared types, Zod schemas, constants
├── docker-compose.yml  → PostgreSQL + pgAdmin + API
└── turbo.json          → Turborepo config
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo, npm workspaces |
| Backend | Express.js, TypeScript, Prisma, PostgreSQL, JWT, Multer, Zod |
| Website | Next.js 14 (App Router), Tailwind CSS |
| Dashboard | Next.js 14, Tailwind CSS, Recharts, TanStack Table |
| Mobile | Expo (React Native), Expo Router, Expo Camera, Expo SecureStore |
| Shared | TypeScript types, Zod validation schemas |

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- (For mobile) Expo CLI, iOS Simulator or Android Emulator

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url> ekonaryn
cd ekonaryn
npm install
```

### 2. Start Database

```bash
docker-compose up -d postgres pgadmin
```

- PostgreSQL: `localhost:5432`
- pgAdmin: `localhost:5050` (admin@ekonaryn.kg / admin123)

### 3. Set Up Environment

```bash
# API
cp packages/api/.env.example packages/api/.env

# Database
cp packages/db/.env.example packages/db/.env

# Website
cp apps/website/.env.example apps/website/.env

# Dashboard
cp apps/dashboard/.env.example apps/dashboard/.env

# Mobile
cp apps/mobile/.env.example apps/mobile/.env
```

### 4. Initialize Database

```bash
cd packages/db
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Build Shared Packages

```bash
cd packages/shared && npm run build
cd ../db && npm run build
```

### 6. Start Development Servers

```bash
# From root - starts all dev servers
npm run dev

# Or individually:
cd packages/api && npm run dev     # API on :4000
cd apps/website && npm run dev     # Website on :3000
cd apps/dashboard && npm run dev   # Dashboard on :3001
cd apps/mobile && npm run dev      # Expo dev server
```

## Test Credentials

| Role | Phone | Password |
|------|-------|----------|
| Admin | +996700000001 | admin123 |
| Worker | +996700000002 | worker123 |
| Resident | +996700100001 | resident123 |

## API Documentation

Full API docs: [packages/api/README.md](packages/api/README.md)

Base URL: `http://localhost:4000/api/v1`

### Key Endpoints

| Group | Endpoints |
|-------|----------|
| Auth | register, login, refresh, me |
| Users | CRUD (admin only list) |
| Materials | public list, admin CRUD |
| Pickup Requests | resident create, admin/worker status management |
| Collections | worker log with photo, auto-complete requests |
| Trips | Bishkek trip tracking with revenue |
| Routes | admin route planning by worker/date |
| Financial | income/expense tracking, profit summary |
| Analytics | overview, monthly, materials, workers |
| Schedule | public collection schedule, admin CRUD |

## Database Schema

9 models: User, Material, PickupRequest, Collection, Trip, Route, FinancialRecord, Schedule, Notification

4 enums: Role (ADMIN/WORKER/RESIDENT), RequestStatus, FinancialType

See full schema: [packages/db/prisma/schema.prisma](packages/db/prisma/schema.prisma)

## Seed Data

The seed script creates realistic data for development:

- 1 admin + 3 workers + 10 residents (Kyrgyz names, Naryn addresses)
- 4 materials with real prices (PET: 5→10 сом/кг)
- 20 pickup requests in various statuses
- 15 completed collections
- 3 trips to Bishkek
- 19 financial records across 3 months
- 8 collection schedules for 5 Naryn areas

## Dashboard Pages

| Path | Description |
|------|-------------|
| `/` | Overview with stats cards + recent activity |
| `/collections` | Collections table with search/sort |
| `/collections/new` | Log a new collection |
| `/requests` | Pickup requests with status filters + actions |
| `/routes` | Route planner with dynamic stops |
| `/trips` | Bishkek trips with profit calculation |
| `/financial` | Income/expense tracker + summary |
| `/analytics` | Charts (monthly volume, materials pie, worker stats) |
| `/workers` | Worker management table |
| `/residents` | Resident database with points |
| `/materials` | Material prices with margin display |
| `/schedule` | Collection schedule editor by area |
| `/settings` | Admin profile + system info |

## Website Pages

| Path | Description |
|------|-------------|
| `/` | Hero, how it works, animated impact counter, CTA |
| `/about` | Company story, values, team |
| `/materials` | Prices from API, accepted/rejected items, prep tips |
| `/schedule` | Collection schedule from API by day |
| `/request` | Pickup request form (auto register/login) |
| `/education` | Why recycle, why not burn, decomposition timeline |
| `/contact` | Contact info, map link, contact form |

## Mobile App Screens

### Resident Flow (5 tabs)
- **Home** — Welcome, points, quick request, schedule preview, recent requests
- **Request** — Material selector, address, weight, notes
- **History** — All requests with status badges
- **Schedule** — Collection schedule by day
- **Profile** — Points card, info, education tip, logout

### Worker Flow (4 tabs)
- **Today** — Daily route with map links, assigned requests with call
- **Collect** — Log collection with camera photo upload
- **History** — Collection history with weight totals
- **Profile** — Contact info, dispatcher phone, logout

## Design System

| Token | Value |
|-------|-------|
| Primary | `#1B5E20` (deep forest green) |
| Primary2 | `#2E7D32` |
| Accent | `#4CAF50` (bright green) |
| Light | `#E8F5E9` |
| Background | `#F9F9F4` (cream) |
| Text | `#1C2A1C` |
| Gray | `#546E7A` |
| Font | Inter (web), System (mobile) |
| Border Radius | 8px default, 12px cards |

## Docker

```bash
# Start everything
docker-compose up -d

# Just database
docker-compose up -d postgres

# Rebuild API container
docker-compose up -d --build api
```

## Project Structure

```
packages/shared/src/
├── types.ts        # TypeScript interfaces for all models
├── schemas.ts      # Zod validation schemas for all inputs
├── constants.ts    # Colors, areas, day names, config
└── index.ts

packages/api/src/
├── app.ts          # Express app setup
├── index.ts        # Server entry point
├── middleware/
│   ├── auth.ts     # JWT authentication + role authorization
│   ├── validate.ts # Zod validation middleware
│   └── error.ts    # Error handler
├── routes/
│   ├── auth.ts, users.ts, materials.ts, requests.ts
│   ├── collections.ts, trips.ts, routesPlanner.ts
│   ├── financial.ts, analytics.ts, schedule.ts
│   └── index.ts    # Route aggregator
└── utils/
    ├── tokens.ts   # JWT generation/verification
    └── upload.ts   # Multer config

packages/db/
├── prisma/
│   ├── schema.prisma  # Full database schema
│   └── seed.ts        # Realistic seed data
└── src/index.ts       # PrismaClient singleton
```

## License

Private — Eko Naryn
