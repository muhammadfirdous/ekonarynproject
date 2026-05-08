# Eko Naryn — Project Overview

> Generated 2026-05-09. A static reading of the repo at HEAD. Citations are
> `path:line` against the working tree at the time of writing. Where the source
> contradicts a long-standing claim (e.g. the README), the source wins and
> the discrepancy is flagged.

---

## 1. Project Overview

**Eko Naryn** is a full-stack recycling-management platform built for a small
recycling business in Naryn, Kyrgyzstan. The business collects PET / HDPE
plastic, cardboard and paper from residents, dispatches workers to pick the
material up, weighs and photographs collections, and sells the aggregated
material through Bishkek runs.

The platform spans four user-facing surfaces and a single API:

| Surface             | Audience                      | Tech                                                | Port / runtime      |
| ------------------- | ----------------------------- | --------------------------------------------------- | ------------------- |
| **Public website**  | residents, the curious public | Next.js 14 App Router                               | `:3000`             |
| **Admin dashboard** | Eko Naryn admins              | Next.js 14 App Router                               | `:3001`             |
| **Mobile app**      | residents & workers           | **Native Android Java** (not React Native — see §9) | Android `minSdk 26` |
| **REST API**        | all of the above              | Express 4 + Prisma                                  | `:4000`             |
| **Data store**      | API only                      | SQLite for dev, PostgreSQL for production / Docker  | `:5432` (Docker)    |

The whole repo is a Turborepo monorepo with npm workspaces (`package.json:5-8`,
`turbo.json:1-32`).

### High-level user flows the codebase implements

1. **Resident** registers (phone + password) → creates a pickup request →
   waits for a worker.
2. **Worker** registers with ID-document upload → admin approves → worker
   appears in dispatch → admin assigns them an order → worker picks the
   material up, photographs it, logs the actual weight → the request is
   `completed` and a `Collection` is created.
3. **Admin** dispatches workers, manages materials & prices, plans
   Naryn-side routes, logs Bishkek trips and revenue, runs analytics.
4. The **website** lets residents create requests without leaving the public
   site (`/request` auto-registers or auto-logs in,
   `apps/website/src/app/request/page.tsx`).

The pickup-request lifecycle is canonical and enforced by a transition table:
`pending → accepted → assigned → in_progress → completed | cancelled | rejected | failed`
(`packages/api/src/services/orderState.ts:6-20`).

---

## 2. Tech Stack

All versions read from each `package.json` and `apps/mobile/app/build.gradle`.

### 2.1 Monorepo / tooling (root `package.json`)

| Package                           | Version                       | Purpose                                       |
| --------------------------------- | ----------------------------- | --------------------------------------------- |
| `turbo`                           | ^2.3.0                        | Pipeline orchestration                        |
| `typescript`                      | ^5.3.0                        | Used everywhere                               |
| `prettier`                        | ^3.2.0                        | Format-on-commit via lint-staged              |
| `husky`                           | ^9.1.7                        | Git hooks                                     |
| `lint-staged`                     | ^16.4.0                       | Staged-file formatting (`package.json:42-49`) |
| `eslint` + `@typescript-eslint/*` | ^8.57 / ^7.0                  | Lint (per-workspace)                          |
| `@playwright/test`                | ^1.59.1                       | E2E                                           |
| Node engine                       | `>=18` (`package.json:39-41`) |
| npm                               | `11.11.0` (`package.json:38`) |

### 2.2 API — `packages/api/package.json`

| Package                          | Version                      | Purpose                  |
| -------------------------------- | ---------------------------- | ------------------------ |
| `express`                        | ^4.18.0                      | HTTP framework           |
| `@prisma/client`                 | ^5.10.0 (via `@ekonaryn/db`) | DB client                |
| `zod`                            | ^3.22.0                      | Validation               |
| `jsonwebtoken`                   | ^9.0.0                       | JWT signing/verification |
| `bcryptjs`                       | ^2.4.3                       | Password hashing         |
| `helmet`                         | ^7.1.0                       | Security headers         |
| `cors`                           | ^2.8.5                       | CORS                     |
| `morgan`                         | ^1.10.0                      | Request logging          |
| `multer`                         | ^1.4.5-lts.1                 | Multipart uploads        |
| `dotenv`                         | ^16.4.0                      | Env loading              |
| `jest` + `ts-jest` + `supertest` | 29.7 / 29.4 / 7.2            | Test stack               |
| `fast-check`                     | ^3.23.2                      | Property-based tests     |

### 2.3 Shared — `packages/shared/package.json`

| Package                          | Version | Purpose                                |
| -------------------------------- | ------- | -------------------------------------- |
| `zod`                            | ^3.22.0 | Schemas re-exported to API + frontends |
| `vitest` + `@vitest/coverage-v8` | ^2.1.9  | Test runner                            |

### 2.4 DB — `packages/db/package.json`

| Package                     | Version | Purpose                  |
| --------------------------- | ------- | ------------------------ |
| `prisma` / `@prisma/client` | ^5.10.0 | ORM + migrations         |
| `bcryptjs`                  | ^2.4.3  | Used by `prisma/seed.ts` |
| `ts-node`                   | ^10.9.0 | For seed                 |

### 2.5 Dashboard — `apps/dashboard/package.json`

| Package                                              | Version                                                                                 | Purpose                          |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------- |
| `next`                                               | ^14.1.0                                                                                 | App Router                       |
| `react` / `react-dom`                                | ^18.2.0                                                                                 | UI                               |
| `tailwindcss`                                        | ^3.4.0                                                                                  | Styling                          |
| `@tanstack/react-table`                              | ^8.12.0                                                                                 | Tables (used by `DataTable.tsx`) |
| `recharts`                                           | ^2.12.0                                                                                 | Charts                           |
| `react-hook-form` + `@hookform/resolvers`            | ^7.50 / ^3.3                                                                            | Forms                            |
| `lucide-react`                                       | ^0.330.0                                                                                | Icons                            |
| `class-variance-authority`, `clsx`, `tailwind-merge` | latest minors                                                                           | Class helpers                    |
| `date-fns`                                           | ^3.3.0                                                                                  | Dates                            |
| Test stack                                           | `vitest` 2.1.9, `@testing-library/react` 16.3, `msw` 2.14, `vitest-axe` 0.1, `jsdom` 25 |

### 2.6 Website — `apps/website/package.json`

Same Next.js 14 + Tailwind core; **no** `recharts` / `@tanstack/react-table`
(public site only). Same RTL+MSW+Vitest test stack, **no** `vitest-axe` (a11y
sweep is dashboard-only at present).

### 2.7 Mobile — `apps/mobile/app/build.gradle`

| Component                                                                                  | Value                                 |
| ------------------------------------------------------------------------------------------ | ------------------------------------- |
| `compileSdk`                                                                               | 34 (`build.gradle:16`)                |
| `minSdk`                                                                                   | 26 (`build.gradle:20`)                |
| `targetSdk`                                                                                | 34 (`build.gradle:21`)                |
| Java target                                                                                | 11 (`build.gradle:45-46`)             |
| `applicationId`                                                                            | `kg.ekonaryn.app`                     |
| OkHttp                                                                                     | 4.12.0                                |
| Gson                                                                                       | 2.10.1                                |
| AndroidX appcompat                                                                         | 1.6.1                                 |
| Material Components                                                                        | 1.11.0                                |
| `androidx.security:security-crypto`                                                        | 1.1.0-alpha06 (used by `AuthManager`) |
| Test: JUnit 4.13.2, Mockito 5.12, Robolectric 4.15.1, MockWebServer 4.12.0, Espresso 3.5.1 |

---

## 3. Architecture

### 3.1 Repo layout (top-level, excluding `node_modules` / build outputs)

```
ekonaryn/
├── apps/
│   ├── dashboard/           Next.js 14 admin panel               (:3001)
│   ├── website/             Next.js 14 public site               (:3000)
│   └── mobile/              Native Android Java app
├── packages/
│   ├── api/                 Express + TypeScript REST API        (:4000)
│   ├── db/                  Prisma schema, client, seed
│   └── shared/              Zod schemas + TS enums + constants
├── e2e/                     Playwright specs (boot all 3 apps)
├── .github/workflows/       4 CI pipelines (test, e2e, mobile, security)
├── .husky/                  pre-commit hook → lint-staged
├── docker-compose.yml       postgres + pgadmin + api
└── turbo.json               pipeline graph
```

### 3.2 Service topology (dev)

```
┌──────────────────┐  HTTP   ┌────────────────────┐
│ Website  :3000   │────────▶│                    │
└──────────────────┘         │                    │
┌──────────────────┐         │  Express API       │   Prisma   ┌───────────┐
│ Dashboard :3001  │────────▶│  /api/v1           │──────────▶│  SQLite   │
└──────────────────┘         │  app.use(helmet)   │            │  (dev)    │
┌──────────────────┐         │  CORS *            │            └───────────┘
│ Android app      │────────▶│  JWT 15m / RT 7d   │            ┌───────────┐
│ (10.0.2.2:4000)  │         │                    │   Prisma   │ Postgres  │
└──────────────────┘         └────────────────────┘──────────▶│ (Docker)  │
                                                              └───────────┘
```

`packages/api/src/app.ts:9-30` is the entire Express setup: helmet, permissive
CORS, morgan, JSON + urlencoded body parsers, static `/uploads` from
`../uploads`, all routes mounted at `/api/v1`, then a single error handler.
There is no rate limiter, no CSRF, no IP allow-list, and CORS is unrestricted
(see §9, §10).

### 3.3 API request pipeline

For an authenticated route (e.g. `POST /api/v1/requests`,
`packages/api/src/routes/requests.ts:31-38`):

```
helmet → cors → morgan → json/urlencoded → /api/v1
  → authenticate           ← JWT verify, sets req.user
  → requireActiveAccount   ← re-reads user, blocks suspended/deleted
  → authorize(Role.X)      ← role check
  → validate(zodSchema)    ← parse body, throw 400 on fail
  → handler                ← business logic, prisma, side-effects
  → errorHandler           ← maps AppError + Prisma P2002/P2025
```

Three middleware in `packages/api/src/middleware/auth.ts`:

- `authenticate` (lines 22-36) — verify Bearer JWT.
- `authorize(...roles)` (lines 38-48) — synchronous role gate.
- `requireActiveAccount` (lines 54-73) — async DB re-read so suspensions take
  effect within seconds.

`errorHandler` (`packages/api/src/middleware/error.ts:13-41`) maps
`AppError` (with explicit status) and Prisma `P2002` → 409 / `P2025` → 404.
Anything else logs and returns 500.

### 3.4 Frontend architecture

Both Next.js apps are App Router with a small handful of `'use client'`
shells. The dashboard layout (`apps/dashboard/src/components/DashboardLayout.tsx:10-61`)
gates rendering on `useAuth()`; the route guard redirects unauthenticated
users to `/login` from a `useEffect`. State management is `useState` only
— no Redux / Zustand / TanStack Query. Data is fetched ad-hoc via a thin
`api` wrapper at `apps/dashboard/src/lib/api.ts`.

Both apps use the same `LanguageProvider` + `AuthProvider` pattern
(`apps/dashboard/src/lib/i18n.tsx`, `apps/dashboard/src/lib/auth.tsx`,
mirrored in website). Locale defaults to EN and is persisted to a cookie so
SSR and CSR agree (commit `e1784ab`).

### 3.5 Mobile architecture

Native Android Java, **not** React Native (the README still says Expo —
flagged in §9). 27 Java files under `apps/mobile/app/src/main/java/kg/ekonaryn/app/`.

| Layer            | Files                                                                                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API client       | `api/ApiClient.java`, `api/Async.java`, `api/ApiException.java`, `api/models/*.java` (User, Material, PickupRequest, Collection, Schedule, Overview, WorkerStats) |
| Auth             | `auth/AuthManager.java` (uses EncryptedSharedPreferences via `androidx.security:security-crypto`), `auth/LoginActivity.java`, `auth/RegisterActivity.java`        |
| Navigation entry | `MainActivity.java` (role splitter)                                                                                                                               |
| Resident flow    | 5 fragments under `resident/` (Home, Request, History, Schedule, Profile)                                                                                         |
| Worker flow      | 4 fragments under `worker/` (Today, Collect, MyCollections, WorkerProfile)                                                                                        |
| Admin flow       | 4 fragments under `admin/` (AdminOverview, AdminRequests, AdminWorkers, AdminProfile) + `PendingWorkersActivity`                                                  |

`BuildConfig.API_BASE_URL` is gradle-property-driven (`build.gradle:11-12`,
`build.gradle:35` debug / `build.gradle:40` release). Defaults are
`http://10.0.2.2:4000/api/v1` (debug, emulator → host loopback) and
`https://api.ekonaryn.kg/api/v1` (release).

---

## 4. Data Model

Source of truth: `packages/db/prisma/schema.prisma` (178 lines, SQLite
provider on line 6). The schema declares **9 models**:
`User`, `Material`, `PickupRequest`, `Collection`, `Trip`, `Route`,
`FinancialRecord`, `Schedule`, `Notification`, `ActivityLog` (so really
**10**, the README undercounts by 1).

### 4.1 Models

| Model                          | Purpose                                                                                                                                                           | Key fields                                                                                                                                                                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User` (`schema.prisma:10-54`) | Single table for admin/worker/resident, soft-deleted via `deletedAt`. Holds all worker-only fields nullably (idDocument, vehicle\*, serviceAreas as JSON string). | `role` (string, default `RESIDENT`), `accountStatus` (`ACTIVE` / `PENDING_APPROVAL` / `REJECTED` / `SUSPENDED`), `phone @unique`, `email? @unique`, `points`, `verificationCode`/`verificationCodeExpiresAt`, `onShift`, `maxConcurrentOrders`. |
| `Material` (`56-68`)           | Catalogue of recyclables priced in сом/kg (or per-unit). Trilingual (`name` / `nameKy` / `nameRu`).                                                               | `buyingPrice`, `sellingPrice`, `unit` (default `kg`).                                                                                                                                                                                           |
| `PickupRequest` (`70-91`)      | One pickup request from a resident. Status transitions enforced in code (see `orderState.ts`).                                                                    | `status` (default `pending`), `assignedWorkerId?`, `assignedAt?`, `cancellationReason?`, `deletedAt?`. Indexed on `status`, `assignedWorkerId`, `createdAt`.                                                                                    |
| `Collection` (`93-107`)        | One material pickup, 1-to-1 with `PickupRequest` via `requestId @unique`. May belong to a `Trip`.                                                                 | `actualWeightKg`, `photoUrl?`, `tripId?`.                                                                                                                                                                                                       |
| `Trip` (`109-120`)             | A van run to Bishkek to sell aggregated material.                                                                                                                 | `totalWeightKg`, `transportCost`, `revenue`, `destination` (default `Bishkek`).                                                                                                                                                                 |
| `Route` (`122-130`)            | Admin-planned daily route with stops as a JSON string.                                                                                                            | `date`, `stops` (string), `status` (default `active`).                                                                                                                                                                                          |
| `FinancialRecord` (`132-140`)  | Income / expense ledger entries.                                                                                                                                  | `type`, `amount`, `category?`.                                                                                                                                                                                                                  |
| `Schedule` (`142-148`)         | Weekly collection schedule by area.                                                                                                                               | `area`, `dayOfWeek` (0-6), `time`, `active`.                                                                                                                                                                                                    |
| `Notification` (`150-159`)     | In-app notification per user.                                                                                                                                     | `userId`, `read`. Indexed on `userId`.                                                                                                                                                                                                          |
| `ActivityLog` (`161-177`)      | Append-only audit log.                                                                                                                                            | `actorId?`, `action`, `entityType`/`entityId`, `metadata?` (JSON string), `ipAddress`, `userAgent`. Indexed on `createdAt`, `(entityType, entityId)`, `actorId`, `action`.                                                                      |

### 4.2 Enums (modelled as strings, validated in `packages/shared/src/types.ts`)

| Enum                     | Values                                                                                                                                                                      | File             |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `Role`                   | `ADMIN` / `WORKER` / `RESIDENT`                                                                                                                                             | `types.ts:1-5`   |
| `AccountStatus`          | `ACTIVE` / `PENDING_APPROVAL` / `REJECTED` / `SUSPENDED`                                                                                                                    | `types.ts:7-12`  |
| `OrderStatus`            | `pending` / `accepted` / `assigned` / `in_progress` / `completed` / `cancelled` / `rejected` / `failed`                                                                     | `types.ts:14-23` |
| `ActivityAction`         | 13 values: worker.{registered,approved,rejected,suspended,reactivated}, request.{created,cancelled}, order.{assigned,reassigned,status_changed}, auth.{login,login_blocked} | `types.ts:40-53` |
| `FinancialType`          | `INCOME` / `EXPENSE`                                                                                                                                                        | `types.ts:64-67` |
| `RequestStatus` (legacy) | uppercase variant kept for back-compat                                                                                                                                      | `types.ts:57-62` |

### 4.3 Notable schema choices

- **All enums are stored as `String`** because the dev DB is SQLite (which
  has no native enum). This is why bug `dad8c83` happened — the analytics
  query searched for `'PENDING'` after the lifecycle migration switched
  the vocabulary to lowercase, and the typesystem couldn't catch it.
- **`serviceAreas` is `String?` containing JSON.** Coerced in/out at
  `routes/auth.ts:162-185` (in) and `routes/requests.ts:249-266` (out, used
  for the assignment service-area guardrail).
- **Soft delete is opt-in.** `User` and `PickupRequest` carry `deletedAt`;
  no other model does. List endpoints add `deletedAt: null`; single-row
  reads must too (bug `23afb91` was the missing-filter on `GET /users/:id`).
- **No referential cascades declared.** Deletes are soft, so this is fine
  in practice.

---

## 5. Features & Functionality

### 5.1 API endpoints

Mounted under `/api/v1` (`packages/api/src/app.ts:26`,
`packages/api/src/routes/index.ts`). Eleven route groups:

| Group             | Path           | File                      | Notable endpoints                                                                                                                                                                                      |
| ----------------- | -------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Auth              | `/auth`        | `routes/auth.ts`          | `POST /register` (legacy resident), `POST /register/resident`, `POST /register/worker` (multipart, ID doc), `POST /verify`, `POST /verify/resend`, `POST /login`, `POST /refresh`, `GET /me`           |
| Users             | `/users`       | `routes/users.ts`         | `GET /workers/pending`, `POST /:id/approve`, `POST /:id/reject`, `POST /:id/suspend`, `POST /:id/reactivate`, `GET /` (admin list), `GET /:id` (filters `deletedAt`), `PUT /:id`, `DELETE /:id` (soft) |
| Materials         | `/materials`   | `routes/materials.ts`     | Public list, admin CRUD                                                                                                                                                                                |
| Requests          | `/requests`    | `routes/requests.ts`      | `POST /` (resident), `GET /`, `GET /:id`, `PUT /:id/status` (lifecycle), `POST /:id/assign` (admin, optimistic concurrency), `DELETE /:id`                                                             |
| Collections       | `/collections` | `routes/collections.ts`   | `POST /` (worker, multipart photo), reads, etc.                                                                                                                                                        |
| Trips             | `/trips`       | `routes/trips.ts`         | Admin CRUD                                                                                                                                                                                             |
| Routes (planning) | `/routes`      | `routes/routesPlanner.ts` | Admin CRUD                                                                                                                                                                                             |
| Financial         | `/financial`   | `routes/financial.ts`     | Admin CRUD + summary                                                                                                                                                                                   |
| Analytics         | `/analytics`   | `routes/analytics.ts`     | `/overview`, `/monthly`, `/materials`, `/workers`                                                                                                                                                      |
| Schedule          | `/schedule`    | `routes/schedule.ts`      | Public list, admin CRUD                                                                                                                                                                                |
| Activity          | `/activity`    | `routes/activity.ts`      | Admin-only audit-log viewer                                                                                                                                                                            |

Two non-versioned endpoints: `GET /` and `GET /health` for smoke checks
(`app.ts:18-24`).

### 5.2 Authentication & authorization

- **JWT, two tokens.** Access token TTL `15m`, refresh `7d`
  (`.env.example:7-8`). Signed with `JWT_SECRET` (default `dev-secret`,
  `middleware/auth.ts:20`).
- **Login** (`routes/auth.ts:312-381`): looks up user by phone, bcrypt-
  compares password, blocks any `accountStatus !== ACTIVE` with role-
  appropriate message, logs `auth.login` or `auth.login_blocked`.
- **Refresh** (`routes/auth.ts:387-414`): re-reads the user so a suspended
  account can't refresh itself back in.
- **Worker approval gate**: workers register with `accountStatus:
PENDING_APPROVAL` (`routes/auth.ts:214`). Login is blocked until an
  admin calls `POST /users/:id/approve`. The approval handler can
  re-activate from `PENDING_APPROVAL` _or_ `SUSPENDED`
  (`routes/users.ts:124-138`).
- **Three roles, four states**: `Role × AccountStatus` matrix is enforced
  by `requireActiveAccount` (live DB check) on every role-gated route.
- **Role authorization is path-level**, not policy-level: each route
  declares the roles it accepts via `authorize(Role.ADMIN, …)`. Residents
  / workers only see their own data via in-handler `where` clauses
  (`routes/requests.ts:76-81`).

### 5.3 Order lifecycle (the heart of the system)

Defined as a transition table at `services/orderState.ts:6-20`:

```
pending  → accepted | cancelled | rejected
accepted → assigned | cancelled | rejected
assigned → in_progress | cancelled | rejected | failed
in_progress → completed | cancelled | failed
completed | cancelled | rejected | failed → (terminal)
```

`assertTransition` (`orderState.ts:37-50`) throws `AppError(409)` on illegal
transitions. Used by:

- `PUT /requests/:id/status` (`routes/requests.ts:139-195`) — generic
  transition.
- `POST /requests/:id/assign` (`routes/requests.ts:201-325`) — admin
  assigns; uses `updateMany` with `where: { id, status: fromStatus }` for
  optimistic concurrency, throws 409 if a concurrent admin assignment won
  the race.
- `POST /collections` (`routes/collections.ts:22-30`) — worker logs
  collection; auto-walks `assigned → in_progress → completed`.

### 5.4 Worker assignment guardrails

`POST /requests/:id/assign` enforces five guardrails inside one transaction
(`routes/requests.ts:211-292`):

1. Request must be `pending` or `accepted`.
2. Worker must exist and not be soft-deleted.
3. Worker must have `accountStatus === ACTIVE` and `onShift === true`.
4. Worker must be under `maxConcurrentOrders` (default 5).
5. If worker has declared `serviceAreas`, the request address must
   case-insensitively contain at least one area.

### 5.5 File uploads

`multer` (`packages/api/src/utils/upload.ts`) writes to `../uploads/` (i.e.
`packages/api/uploads/`). Files are served back at `/uploads/*`
(`app.ts:16`). Two upload sites:

- Worker registration `idDocument` (`routes/auth.ts:189`).
- Collection `photo` (`routes/collections.ts:27`).

Max file size and mime allowlist live in `utils/upload.ts` and
`packages/shared/src/constants.ts:42` (`MAX_FILE_SIZE = 10MB`).

### 5.6 Activity log

`packages/api/src/services/activityLog.ts` writes to `ActivityLog` and
swallows its own errors (intentional — audit failures must not break the
business action). Every state-changing endpoint calls `logActivity`. The
admin dashboard exposes the log at `/activity`.

### 5.7 Internationalisation

Three languages declared in mobile (`apps/mobile/app/src/main/res/values-ru/`,
`-ky/`, plus default EN), two on web (EN + RU, see
`apps/dashboard/src/lib/messages/{en,ru}.ts` and
`apps/website/src/lib/messages/{en,ru}.ts`). The dashboard and website both
hydrate the SSR'd HTML with the cookie-driven language to avoid hydration
mismatch (commit `e1784ab`).

### 5.8 Background jobs / scheduling

**None.** No cron, no queue (Bull, BullMQ, etc.), no scheduler. All work is
synchronous-on-request. The closest thing to "scheduled" data is the
`Schedule` model (collection schedule by area), which is purely descriptive.

---

## 6. Configuration & Environment

### 6.1 Required env vars

From `.env.example`:

| Variable                              | Used in                              | Default in code                           | Purpose                                                                                                                         |
| ------------------------------------- | ------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                        | `packages/db/prisma/schema.prisma:7` | —                                         | Prisma connection string. **Despite the schema declaring `provider = "sqlite"`, `.env.example` ships a Postgres URL** — see §9. |
| `JWT_SECRET`                          | `middleware/auth.ts:20`              | `'dev-secret'`                            | Access-token signing key                                                                                                        |
| `JWT_REFRESH_SECRET`                  | `utils/tokens.ts`                    | (must read)                               | Refresh-token key                                                                                                               |
| `JWT_EXPIRES_IN`                      | `utils/tokens.ts`                    | `15m`                                     | Access TTL                                                                                                                      |
| `JWT_REFRESH_EXPIRES_IN`              | `utils/tokens.ts`                    | `7d`                                      | Refresh TTL                                                                                                                     |
| `API_PORT`                            | `packages/api/src/index.ts:4`        | `4000`                                    | API listen port                                                                                                                 |
| `API_URL`                             | docker-compose                       | `http://localhost:4000`                   | Public API URL                                                                                                                  |
| `NEXT_PUBLIC_API_URL`                 | dashboard, website, settings page UI | `http://localhost:4000/api/v1`            | Browser-visible API URL                                                                                                         |
| `POSTGRES_USER` / `_PASSWORD` / `_DB` | `docker-compose.yml`                 | `ekonaryn` / `ekonaryn_pass` / `ekonaryn` | Docker-only                                                                                                                     |
| `PGADMIN_DEFAULT_EMAIL` / `_PASSWORD` | `docker-compose.yml`                 | `admin@ekonaryn.kg` / `admin123`          | Docker-only                                                                                                                     |

### 6.2 Mobile env

`apps/mobile/app/build.gradle:11-12` reads two **gradle properties**, not
env vars:

| Property               | Default                          | Override                                                  |
| ---------------------- | -------------------------------- | --------------------------------------------------------- |
| `API_BASE_URL_DEBUG`   | `http://10.0.2.2:4000/api/v1`    | `~/.gradle/gradle.properties` or `-PAPI_BASE_URL_DEBUG=…` |
| `API_BASE_URL_RELEASE` | `https://api.ekonaryn.kg/api/v1` | same                                                      |

### 6.3 Docker

`docker-compose.yml` declares 3 services:

| Service    | Image                                | Port   | Volume                                |
| ---------- | ------------------------------------ | ------ | ------------------------------------- |
| `postgres` | `postgres:16-alpine`                 | `5432` | `postgres_data`                       |
| `pgadmin`  | `dpage/pgadmin4`                     | `5050` | (none)                                |
| `api`      | built from `packages/api/Dockerfile` | `4000` | `api_uploads` (mounts `/app/uploads`) |

There is no Docker service for dashboard or website — the Compose file is
API-only.

### 6.4 SQLite vs Postgres

`packages/db/prisma/schema.prisma:6` says `provider = "sqlite"`, yet
`.env.example` and `docker-compose.yml` both speak Postgres. This is the
single biggest setup-time gotcha. See §9 for the explanation: dev uses
SQLite (`DATABASE_URL=file:./dev.db`), Docker swaps to Postgres for
deployment but **Prisma cannot have its provider switched at runtime** —
running against the Postgres URL with the current schema requires editing
`schema.prisma` to `provider = "postgresql"` and re-generating. The repo
ships in dev mode.

---

## 7. Setup & Development

### 7.1 First-time setup

```bash
# 1. Install
npm install                       # also installs husky pre-commit hook

# 2. Generate Prisma client + push schema to SQLite
npm run db:generate
npm run db:push

# 3. Seed
npm run db:seed                   # uses packages/db/prisma/seed.ts

# 4. Build shared/db (workspace deps)
npm run build --workspace=@ekonaryn/shared
npm run build --workspace=@ekonaryn/db

# 5. Start everything
npm run dev                       # turbo dev — boots api+dashboard+website

#    Or individually:
npm run dev --workspace=@ekonaryn/api          # :4000
npm run dev --workspace=@ekonaryn/dashboard    # :3001
npm run dev --workspace=@ekonaryn/website      # :3000
```

**Test credentials** (created by seed):

| Role     | Phone           | Password      |
| -------- | --------------- | ------------- |
| Admin    | `+996700000001` | `admin123`    |
| Worker   | `+996700000002` | `worker123`   |
| Resident | `+996700100001` | `resident123` |

### 7.2 Tests

See `TESTING.md` for the full guide. Quick reference:

```bash
npm test                     # all JS/TS suites
npm run test:api             # Jest+Supertest, 480 tests
npm run test:shared          # Vitest, 150 tests
npm run test:dashboard       # Vitest+RTL+MSW+axe, 116 tests
npm run test:website         # Vitest+RTL+MSW, 52 tests
npm run e2e                  # Playwright, 13 specs
cd apps/mobile && ./gradlew testDebugUnitTest    # 39 JVM tests
```

Total: **850 passing**, 4 `.todo` markers (rate-limiting + schedule
time-validation), 0 `.failing`/`.fails`/inverted-assertion markers
(`TEST_PLAN.md:7-16`).

### 7.3 Mobile build

```bash
cd apps/mobile
./gradlew assembleDebug                                              # default debug APK
./gradlew assembleRelease -PAPI_BASE_URL_RELEASE=https://prod/api/v1 # override release URL
./gradlew testDebugUnitTest                                          # JVM tests
./gradlew connectedDebugAndroidTest                                  # Espresso (needs emulator)
```

### 7.4 Pre-commit hook

Husky's `prepare` script (`package.json:25`) installs the hook on first
`npm install`. `.husky/pre-commit` runs `npx lint-staged`, which prettier-
formats staged files (`package.json:42-49`). Eslint runs only in CI to
keep local commits fast.

### 7.5 CI workflows (`.github/workflows/`)

| File           | Trigger                            | Jobs                                                                                                              |
| -------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `test.yml`     | push, PR                           | 5 parallel: lint, shared, api, dashboard, website. Uploads coverage artifacts.                                    |
| `e2e.yml`      | push, PR                           | Playwright with `webServer` boot of all 3 apps. HTML report on every run, traces on failure.                      |
| `mobile.yml`   | only when `apps/mobile/**` changes | JDK 17 → `testDebugUnitTest` + Espresso compile-check (no emulator).                                              |
| `security.yml` | push, PR, weekly Monday cron       | `npm audit` (high+critical, prod only), gitleaks over full history, API security/contract/migration test subsets. |

---

## 8. Code Quality & Conventions

### 8.1 Patterns that recur and are worth knowing

- **Route handlers are thin.** Logic that crosses route boundaries lives in
  `services/` (`orderState.ts`, `activityLog.ts`). Each handler validates
  input via `validate(zodSchema)`, performs a Prisma transaction, calls
  `logActivity`, and returns. No service layer for simple CRUD — it's
  inlined.
- **Errors flow through `AppError`.** Throw `new AppError(msg, code)` and
  the central error handler maps it to a JSON response
  (`middleware/error.ts:13-19`). Prisma errors are mapped on the same path
  (`P2002` → 409, `P2025` → 404, lines 21-34). Anything else → generic 500
  with the real error logged.
- **Multipart bodies are coerced before `validate()`.** Multer hands
  every field over as a string, but Zod schemas expect numbers / arrays.
  Coercion middlewares like `coerceCollectionBody`
  (`routes/collections.ts:15-20`) and `coerceWorkerRegisterBody`
  (`routes/auth.ts:162-185`) live next to the route they serve.
- **Optimistic concurrency for assignments.** `updateMany` with the
  current status in the where-clause (`routes/requests.ts:272-285`) — if
  another admin won the race, count is 0 and we 409.
- **Activity-log calls always pass `req`** so IP / user-agent / actor are
  picked up from the request context.
- **Test scaffolding is centralised.** `packages/api/tests/auth.ts` exposes
  `loginAs('admin'|'worker'|'resident')`; `tests/factories.ts` builds
  fixtures; `resetDb()` runs in `beforeEach`. Web apps follow the same
  pattern with MSW handlers (`apps/dashboard/tests/msw/server.ts`).
- **Pinned-bug pattern** for any production bug found during testing:
  companion test (asserts current broken state) + `.failing` /
  `.fails` / `xtest` (asserts future correct state). Documented in
  `TESTING.md:95-102` and lived through 8 iterations.

### 8.2 Conventions that are _not_ enforced

- No path-aliasing scheme other than `@/*` → `src/*` (Next.js apps).
- No JSDoc, no API documentation generator (no Swagger / OpenAPI).
- No commit-message convention enforced (Conventional Commits is used
  in practice — see `git log` — but no `commitlint`).
- No public API client SDK (the dashboard/website/mobile each have their
  own thin wrappers).

### 8.3 Coverage gates (`TESTING.md:42-53`, enforced in CI)

| Workspace                      | Lines | Branches | Notes                                         |
| ------------------------------ | ----- | -------- | --------------------------------------------- |
| `packages/shared`              | 100   | 95       | Schemas + types only.                         |
| `packages/api/src/services/`   | 95    | 90       |                                               |
| `packages/api/src/middleware/` | 95    | 90       |                                               |
| `packages/api/src/routes/`     | 85    | 75       |                                               |
| `packages/api/src/utils/`      | 90    | 80       |                                               |
| `apps/dashboard`               | 70    | 70       | List pages still at 0%, tracked.              |
| `apps/website`                 | 90    | 85       | `ImpactCounter` timer not exercised in jsdom. |
| `apps/mobile`                  | —     | —        | JaCoCo not yet wired.                         |

---

## 9. Known Issues & Tech Debt

### 9.1 Documentation that contradicts the code (correct **before** any external dev reads it)

1. **README claims mobile is React Native / Expo.** It's native Android
   Java. See `README.md:14, 29`. Verified by `apps/mobile/app/build.gradle`
   (Android Gradle plugin) and 27 `.java` files under
   `apps/mobile/app/src/main/java/`. Phase 1 actively _removed_ the dead
   `expo` devDep at the root because it was forcing `--legacy-peer-deps`
   on every install (`TEST_PLAN.md:84-86`).
2. **README claims database is PostgreSQL.** Dev uses SQLite
   (`packages/db/prisma/schema.prisma:6`). Docker uses Postgres but the
   schema's `provider` is hard-coded — switching DBs requires editing
   `schema.prisma` and re-running `prisma generate`.
3. **README claims 9 models, 4 enums.** There are 10 models (incl.
   `ActivityLog`, added later) and 6 enums (`Role`, `AccountStatus`,
   `OrderStatus`, `ActivityAction`, `FinancialType`, `RequestStatus`).

### 9.2 Security gaps (none currently exploitable; all flagged by tests)

| Gap                                                    | File:line                        | Status                                        |
| ------------------------------------------------------ | -------------------------------- | --------------------------------------------- |
| No rate limiting on `/auth/login`                      | `routes/auth.ts:312`             | 2 `.todo` markers (`TEST_PLAN.md:117-119`)    |
| No rate limiting on `/auth/verify/resend`              | `routes/auth.ts:282`             | 1 `.todo`                                     |
| `JWT_SECRET` defaults to `'dev-secret'` if env unset   | `middleware/auth.ts:20`          | Mitigated only by deploy hygiene              |
| Default JWT secrets in `.env.example` are placeholders | `.env.example:5-6`               | Same                                          |
| CORS is unrestricted (`cors()` with no options)        | `app.ts:12`                      | Acceptable for a B2C app, surfaced for review |
| `scheduleSchema.time` accepts `24:00`, `12:60`         | `packages/shared/src/schemas.ts` | 1 `.todo`                                     |
| `pgadmin` default password `admin123` in compose       | `docker-compose.yml`             | Production only — change before deploy        |

### 9.3 Productisation gaps

- **No background jobs.** No queue, no cron. Every email/SMS/notification
  is synchronous on request. The `Notification` table is in-app only.
- **Verification codes are exposed in dev mode.** `shouldExposeCode()`
  controls whether the API returns the SMS code in the response body
  (`routes/auth.ts:95, 145, 241, 300-301`). In prod this returns false
  — but there is **no SMS provider integration**. Phone verification is
  effectively a stub.
- **No image content validation.** Multer enforces size + mime, but the
  uploaded ID-document and collection photos are not scanned for malware
  / NSFW content.
- **No refresh-token rotation.** `/auth/refresh` issues a new pair but
  doesn't blacklist the old refresh token (`routes/auth.ts:387-414`).
  Stolen refresh tokens are valid for 7 days.

### 9.4 Test gaps (per `TEST_PLAN.md`)

- 7 dashboard list pages (analytics, collections, financial, materials,
  routes, schedule, trips, workers) are at 0% coverage. The pattern is
  identical to pages that _are_ covered, so the work is mechanical.
- Espresso suite is compiled but never run (no emulator in CI).
- JaCoCo coverage for the mobile app is not wired up.
- No load testing. No image-content tests. No i18n key parity tests
  (would catch missing `ru` translations of new `en` keys).

### 9.5 Architectural smells

- **`User` is one wide table** for three roles with a long tail of
  worker-only nullable fields (`schema.prisma:34-41`). Manageable today,
  but a `WorkerProfile` 1-to-1 join table would scale better if the
  worker schema keeps growing.
- **`serviceAreas` and `Route.stops` are JSON-in-string fields.** Common
  in SQLite but it means anyone querying by service area must do string
  search, not relational lookup.
- **No service / repository abstraction in API.** Routes call Prisma
  directly. Easy to read, but hard to swap the DB or unit-test routes
  without spinning up the schema.
- **No request-scoped DI.** The `req.user` shape is augmented via a global
  `declare global` (`middleware/auth.ts:12-18`), which is fine for Express
  but couples handler types to the middleware's namespace mutation.
- **Frontend state is `useState`-only.** As the dashboard grows, refetch
  storms and stale-cache bugs will start happening. TanStack Query would
  be the lowest-friction fix.

---

## 10. Recommendations

Ordered by return-on-effort, drawing on the test gaps registered in
`TEST_PLAN.md:25-34` and the smells flagged above.

### 10.1 High-leverage, low-risk

1. **Update `README.md`** to match reality (mobile is Java / Android,
   dev DB is SQLite, 10 models). 30 minutes; eliminates the single
   biggest onboarding bug.
2. **Add rate limiting to `/auth/login`, `/auth/refresh`, `/auth/verify/resend`.**
   `express-rate-limit` is one dependency and ~10 lines. Three `.todo`
   markers will flip to passing tests immediately.
3. **Tighten `scheduleSchema.time`** to reject `24:00` / `12:60`. Single
   regex change in `packages/shared/src/schemas.ts`.
4. **Replace the placeholder JWT secrets in `.env.example`** with a
   `# CHANGE BEFORE DEPLOY` warning, and have the API refuse to start in
   prod if they're still defaults (3 lines in `index.ts`).
5. **Wire the existing 7 dashboard list pages into the test suite.** All
   the patterns are already in place; this is mechanical fill-in
   (`TEST_PLAN.md:30`).

### 10.2 Mid-term

6. **Run Espresso in CI on a real emulator.** One `connectedDebugAndroidTest`
   job in `mobile.yml` (likely as a `macos-latest` runner). Catches
   actual UI regressions.
7. **Wire JaCoCo for mobile coverage.** Closes the last gap in the
   coverage table (`TESTING.md:53`).
8. **Add an SMS provider integration** behind a small interface so the
   phone-verification flow stops being a dev-mode stub. Twilio, Vonage,
   or a regional KG provider.
9. **Add refresh-token rotation + a denylist** (small Redis or DB table).
   7-day stolen refresh tokens are a real risk for an app touching
   personal data.
10. **Add TanStack Query to the dashboard.** Single hook per resource,
    auto-cache invalidation on mutations. Removes a surprising amount of
    bespoke `useState` + `useEffect` plumbing.

### 10.3 Long-term

11. **Decide PostgreSQL or SQLite is the _single_ dev DB.** Either
    commit to SQLite (delete Postgres compose service and `.env.example`
    pg URL) or commit to Postgres (set `provider = "postgresql"` and
    document the setup). The current half-and-half state is a perpetual
    onboarding paper-cut.
12. **Pull worker-only fields into a `WorkerProfile` 1-1 model.**
    `User.idDocumentUrl`, `serviceAreas`, `vehicle*`, `maxConcurrentOrders`,
    `onShift` are 6 columns that don't apply to admins or residents.
13. **Service-area-as-relation.** Replace the JSON-string `serviceAreas`
    with an `Area` model + many-to-many. Enables real filter queries (the
    current assignment guardrail does case-insensitive substring matching
    against the address — fragile).
14. **Add an OpenAPI / Swagger doc**, generated from the existing Zod
    schemas (`zod-to-openapi`). The mobile and website teams are already
    re-implementing types against `packages/shared`; a doc + generated
    SDK closes the loop.
15. **Move file uploads to object storage** (S3-compatible) before
    deploying. Local disk + Docker volume is fine for one-instance dev,
    but breaks the moment a second API replica appears.

---

## Open questions (flagged for the author)

These are things the source can't tell me unambiguously. Answer each
before treating this doc as canonical.

1. **Is the production target Postgres or SQLite?** Schema says SQLite,
   compose says Postgres. Which one is the deployment plan?
2. **Is there an existing SMS provider relationship?** The phone-
   verification code is generated and stored, but I find no `twilio` /
   `nexmo` / `mtt` / `beeline` integration. Is this intentionally a
   stub, or is there an out-of-tree integration I'm not seeing?
3. **What is the canonical mobile build URL for production?** The
   release default is `https://api.ekonaryn.kg/api/v1` — does this
   domain exist, or is it a placeholder?
4. **`maxConcurrentOrders` default is 5** (`schema.prisma:40`) — is this
   a business rule or a guess? The assignment guardrail enforces it
   strictly (`routes/requests.ts:241-244`).
5. **Soft-deleted users keep their names visible** through historical
   collections / requests (`routes/users.ts:319-329`). Is that the
   intended GDPR / privacy posture, or should there be a true purge job?
6. **The README's mobile-app description (Expo, 5+4 tabs) doesn't match
   the Java codebase, which has _three_ role flows (resident/worker/
   admin) with an `AdminMainActivity`.** Was the admin mobile flow added
   after the README was written? Should the website / dashboard reflect
   that admins now have a mobile app?
7. **`ActivityAction` enum has 13 values, but there's no
   `auth.password_reset` / `auth.refresh` / `request.completed` action.**
   Are those intentionally not logged, or is the audit trail incomplete?

---

_End of report. Generated from a static read of HEAD on 2026-05-09._
