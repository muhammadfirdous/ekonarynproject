# Эко Нарын — Recycling Platform

A full-stack recycling management platform for **Eko Naryn**, a small recycling business in Naryn, Kyrgyzstan. Collects PET/HDPE plastic, cardboard, and paper from residents.

## Architecture

```
ekonaryn/
├── apps/
│   ├── website/        → Public-facing Next.js site       (port 3000)
│   ├── dashboard/      → Admin panel (Next.js)            (port 3001)
│   └── mobile/         → Native Android app (Java + Gradle)
├── packages/
│   ├── api/            → Express.js REST API              (port 4000)
│   ├── db/             → Prisma schema + PostgreSQL
│   └── shared/         → Shared types, Zod schemas, constants
├── docker-compose.yml  → PostgreSQL + pgAdmin + API (dev)
├── docker-compose.prod.yml → Production stack behind Caddy
└── turbo.json          → Turborepo config
```

## Tech Stack

| Layer     | Technology                                                                 |
| --------- | -------------------------------------------------------------------------- |
| Monorepo  | Turborepo, npm workspaces                                                  |
| Backend   | Express.js, TypeScript, Prisma, PostgreSQL, JWT, Multer, Zod               |
| Website   | Next.js 14 (App Router), Tailwind CSS                                      |
| Dashboard | Next.js 14, Tailwind CSS, Recharts, TanStack Table                         |
| Mobile    | Native Android (Java, AGP 8.2.2, OkHttp, Gson, EncryptedSharedPreferences) |
| Shared    | TypeScript types, Zod validation schemas                                   |

## Prerequisites

- Node.js 18+ (CI uses 20)
- Docker & Docker Compose v2 (`docker compose`, not legacy `docker-compose`)
- (For mobile) JDK 17 and Android SDK 34 / Android Emulator

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url> ekonaryn
cd ekonaryn
npm install
```

### 2. Start Database

```bash
docker compose up -d postgres pgadmin
# Once-only: create the separate test database for `npm test`.
docker compose exec -T postgres psql -U ekonaryn -c "CREATE DATABASE ekonaryn_test;"
```

- PostgreSQL: `localhost:5432`
- pgAdmin: `localhost:5050` (admin@ekonaryn.kg / admin123)

> **Note:** as of the `deploy/prep` work, the Prisma provider is `postgresql`
> (not SQLite). Bring up the postgres container before running tests or
> dev servers.

### 3. Set Up Environment

```bash
# Root template — copy and edit values to suit your environment
cp .env.example .env

# Workspace .env files (auto-loaded by Prisma CLI / API server)
cp packages/api/.env.example packages/api/.env || true
cp packages/db/.env.example  packages/db/.env  || true
```

The mobile app reads its base URL from gradle properties (`API_BASE_URL_DEBUG`
/ `API_BASE_URL_RELEASE`), not a `.env` file. See `apps/mobile/app/build.gradle`.

### 4. Initialize Database

```bash
# Apply the existing migrations to the empty `ekonaryn` database.
npm run db:generate
npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma

# Seed for local dev (NEVER run against production — see DEPLOYMENT.md §4.2).
npm run db:seed
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

# Mobile (separate toolchain):
cd apps/mobile && ./gradlew assembleDebug          # build a debug APK
cd apps/mobile && ./gradlew testDebugUnitTest      # JVM unit tests
```

## Test Credentials

| Role     | Phone         | Password    |
| -------- | ------------- | ----------- |
| Admin    | +996700000001 | admin123    |
| Worker   | +996700000002 | worker123   |
| Resident | +996700100001 | resident123 |

## API Documentation

Full API docs: [packages/api/README.md](packages/api/README.md)

Base URL: `http://localhost:4000/api/v1`

### Key Endpoints

| Group           | Endpoints                                       |
| --------------- | ----------------------------------------------- |
| Auth            | register, login, refresh, me                    |
| Users           | CRUD (admin only list)                          |
| Materials       | public list, admin CRUD                         |
| Pickup Requests | resident create, admin/worker status management |
| Collections     | worker log with photo, auto-complete requests   |
| Trips           | Bishkek trip tracking with revenue              |
| Routes          | admin route planning by worker/date             |
| Financial       | income/expense tracking, profit summary         |
| Analytics       | overview, monthly, materials, workers           |
| Schedule        | public collection schedule, admin CRUD          |

## Database Schema

10 models: User, Material, PickupRequest, Collection, Trip, Route,
FinancialRecord, Schedule, Notification, **ActivityLog**.

6 enums (modelled as strings on the database side, validated in
`packages/shared/src/types.ts`):

| Enum             | Values                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `Role`           | `ADMIN` / `WORKER` / `RESIDENT`                                                                         |
| `AccountStatus`  | `ACTIVE` / `PENDING_APPROVAL` / `REJECTED` / `SUSPENDED`                                                |
| `OrderStatus`    | `pending` / `accepted` / `assigned` / `in_progress` / `completed` / `cancelled` / `rejected` / `failed` |
| `ActivityAction` | 13 values (see `types.ts:40-53`)                                                                        |
| `FinancialType`  | `INCOME` / `EXPENSE`                                                                                    |
| `RequestStatus`  | (legacy uppercase variant kept for back-compat)                                                         |

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

| Path               | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `/`                | Overview with stats cards + recent activity          |
| `/collections`     | Collections table with search/sort                   |
| `/collections/new` | Log a new collection                                 |
| `/requests`        | Pickup requests with status filters + actions        |
| `/routes`          | Route planner with dynamic stops                     |
| `/trips`           | Bishkek trips with profit calculation                |
| `/financial`       | Income/expense tracker + summary                     |
| `/analytics`       | Charts (monthly volume, materials pie, worker stats) |
| `/workers`         | Worker management table                              |
| `/residents`       | Resident database with points                        |
| `/materials`       | Material prices with margin display                  |
| `/schedule`        | Collection schedule editor by area                   |
| `/settings`        | Admin profile + system info                          |

## Website Pages

| Path         | Description                                         |
| ------------ | --------------------------------------------------- |
| `/`          | Hero, how it works, animated impact counter, CTA    |
| `/about`     | Company story, values, team                         |
| `/materials` | Prices from API, accepted/rejected items, prep tips |
| `/schedule`  | Collection schedule from API by day                 |
| `/request`   | Pickup request form (auto register/login)           |
| `/education` | Why recycle, why not burn, decomposition timeline   |
| `/contact`   | Contact info, map link, contact form                |

## Mobile App (native Android, Java)

`apps/mobile/` is a native Android Java project (not React Native, not
Expo). 27 Java files under
`apps/mobile/app/src/main/java/kg/ekonaryn/app/` covering three role
flows.

| Layer            | Files                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| API client       | `api/ApiClient.java`, `api/Async.java`, `api/ApiException.java`, `api/models/*.java`                                                                   |
| Auth             | `auth/AuthManager.java` (uses `androidx.security:security-crypto` EncryptedSharedPreferences), `auth/LoginActivity.java`, `auth/RegisterActivity.java` |
| Navigation entry | `MainActivity.java` (role splitter)                                                                                                                    |
| Resident flow    | 5 fragments under `resident/` (Home, Request, History, Schedule, Profile)                                                                              |
| Worker flow      | 4 fragments under `worker/` (Today, Collect, MyCollections, WorkerProfile)                                                                             |
| Admin flow       | 4 fragments under `admin/` + `PendingWorkersActivity`                                                                                                  |

API base URL is set at build time via gradle properties:

| Property               | Default                          |
| ---------------------- | -------------------------------- |
| `API_BASE_URL_DEBUG`   | `http://10.0.2.2:4000/api/v1`    |
| `API_BASE_URL_RELEASE` | `https://api.ekonaryn.kg/api/v1` |

Override per-build with `-PAPI_BASE_URL_RELEASE=https://prod/api/v1`
(or via `~/.gradle/gradle.properties`).

## Design System

| Token         | Value                         |
| ------------- | ----------------------------- |
| Primary       | `#1B5E20` (deep forest green) |
| Primary2      | `#2E7D32`                     |
| Accent        | `#4CAF50` (bright green)      |
| Light         | `#E8F5E9`                     |
| Background    | `#F9F9F4` (cream)             |
| Text          | `#1C2A1C`                     |
| Gray          | `#546E7A`                     |
| Font          | Inter (web), System (mobile)  |
| Border Radius | 8px default, 12px cards       |

## Docker

```bash
# Dev: just the database (apps run on the host via `npm run dev`)
docker compose up -d postgres

# Dev: postgres + pgAdmin
docker compose up -d postgres pgadmin

# Dev: bring up the API container too (rebuild on source change)
docker compose up -d --build api
```

For the production compose stack (api + website + dashboard + caddy),
see **Production deployment** below.

## Production deployment

The first production deploy targets a single Hetzner VPS with all
services running under `docker compose -f docker-compose.prod.yml`,
fronted by Caddy with auto-TLS. The full architecture, secrets layout,
backup strategy, and step-by-step runbook live in
[DEPLOYMENT.md](DEPLOYMENT.md).

Quick reference:

- Production compose: [`docker-compose.prod.yml`](docker-compose.prod.yml)
- Edge proxy config: [`deploy/Caddyfile`](deploy/Caddyfile)
- Backup script: [`deploy/scripts/backup.sh`](deploy/scripts/backup.sh)
- First-admin bootstrap: `npm run admin:create` (see DEPLOYMENT.md §4.2)
- Security policy + reporting: [SECURITY.md](SECURITY.md)

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
