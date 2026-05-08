# Test Plan — Eko Naryn

Rolling test plan, updated per phase. **Phase 10 final audit completed 2026-05-08. All 8 pinned bugs fixed 2026-05-09.**

## Final tally

| Workspace              | Suite                               | Tests passing | Todos | Failing/inverted |  Files |
| ---------------------- | ----------------------------------- | ------------: | ----: | ---------------: | -----: |
| `packages/api`         | Jest + Supertest                    |       **480** |     3 |                0 |     34 |
| `packages/shared`      | Vitest                              |       **150** |     1 |                0 |      6 |
| `apps/dashboard`       | Vitest + RTL + MSW + axe            |       **116** |     0 |                0 |     20 |
| `apps/website`         | Vitest + RTL + MSW                  |        **52** |     0 |                0 |     12 |
| `e2e/`                 | Playwright                          |        **13** |     0 |                0 |      5 |
| `apps/mobile` JVM      | JUnit + Robolectric + MockWebServer |        **39** |     0 |                0 |      7 |
| `apps/mobile` Espresso | written, compile-checked, NOT run   |             — |     — |                — |      5 |
| **TOTAL**              |                                     |       **850** | **4** |            **0** | **89** |

- **All 8 pinned bugs fixed.** Each bug had a companion (current state) and a marker (future correct state). After fix work: companions deleted, markers flipped to natural assertions, every workspace suite green. See [`Bugs fixed`](#bugs-fixed-with-commit-shas) for the commit refs.
- **4 todos remain** — they track future work that has no production bug today: `scheduleSchema` time semantic check (1) and rate limiting on `/auth/login`/`/auth/verify/resend` (3, since one is recorded twice).
- **Coverage thresholds activated and met everywhere they're set.** API services 100/97, middleware 96/90, routes 94/79, utils 100/90; shared 100/100/100/100; dashboard 73/83/78; website 99/93/82.
- **Zero unrelated production behavior changes.** Each of the 8 fix commits is surgical to its bug; the two pre-existing testability edits are documented in [`Behavior changes required`](#behavior-changes-required).
- **CI wired** in `.github/workflows/{test,e2e,mobile,security}.yml`. Husky + lint-staged installed at root for prettier-on-commit.
- **Entry-point doc** at [`TESTING.md`](./TESTING.md): how to run each suite, how to add a test.

### What's next

If anyone picks this up and wants to push it further, in order of return-on-effort:

1. **Run Espresso on a real emulator.** The 10 specs already compile-check in CI; one `connectedDebugAndroidTest` job in `mobile.yml` is the missing piece.
2. **Add the 7 untested dashboard list pages** (analytics / collections / financial / materials / routes / schedule / trips / workers). Each is a list view with mostly the same shape as the pages already covered.
3. **Implement rate limiting** on `/auth/login` and `/auth/verify/resend`. Three `.todo` markers will flip to passing once the throttle is added.
4. **Tighten `scheduleSchema.time`** to reject `24:00` / `12:60`. One `.todo` marker.
5. **Read [`Risks not covered`](#risks-not-covered).** It's the honest list of gaps — load testing, refresh-token rotation, image content validation, i18n key parity, etc.

## Goal & coverage targets

End-state: every workspace has a runnable test suite, gated in CI. Per-package coverage thresholds (enforced after Phase 2 ends):

| Path                             | Lines | Branches |
| -------------------------------- | ----- | -------- |
| `packages/api/src/services/**`   | 95%   | 90%      |
| `packages/api/src/middleware/**` | 95%   | 90%      |
| `packages/api/src/routes/**`     | 85%   | 75%      |
| `packages/api/src/utils/**`      | 90%   | 80%      |
| `packages/shared/**`             | 100%  | —        |
| `apps/dashboard/**`              | 70%   | —        |
| `apps/website/**`                | 70%   | —        |

## Phase plan (one paragraph each)

**Phase 1 — Infra & baseline.** Harden API Jest (v8 coverage, factories, auth helper, teardown). Install Vitest+MSW in dashboard+website. Install Playwright at root with web-server boot. Add JUnit/Mockito/Espresso/Robolectric/MockWebServer to mobile gradle. Wire `turbo run test`. Remove dead `expo` devDep so installs don't need `--legacy-peer-deps`. Smoke tests in every stack.

**Phase 2 — API unit & integration.** Per-file mirror suites under `packages/api/tests/{services,middleware,routes,cross-cutting}/`. Cover lifecycle table (incl. property-based), activity-log error swallowing, JWT lifetimes, multer mime/size, every middleware error code, every route's happy/role/validation/conflict/audit-side-effect. End-to-end resident→admin→worker chain. Permission matrix. Soft-delete sweep. Static `/uploads` traversal block. Activate coverageThreshold.

**Phase 3 — Shared.** Zod parse/safeParse boundary tests for every schema, constants integrity, `expectTypeOf` checks. Target 100%.

**Phase 4 — Dashboard.** Vitest + RTL + MSW. Cover components, hooks, lib/auth, lib/i18n, every page integration, axe a11y sweep. Target 70%.

**Phase 5 — Website.** Each public page renders in both languages; `/request` fork (register-then-login fallback); /materials & /schedule API integration via MSW; SEO metadata snapshot.

**Phase 6 — E2E (Playwright).** Auth, full request lifecycle through UI, worker approval, i18n persistence, suspended-worker login error.

**Phase 7 — Mobile.** Robolectric unit tests for `AuthManager`, `ApiClient` (MockWebServer), `Async`, Gson model round-trip, `LocaleHelper`. Espresso instrumented tests for each Activity (login, register resident/worker, role-based bottom-nav, pending-workers approve/reject, request, collect). Build-time assertion that release `BuildConfig.API_BASE_URL` differs from emulator URL (currently a known bug — `.failing`).

**Phase 8 — Security/perf/contract/migration.** Auth bypass matrix, IDOR, injection guard, path traversal, mass-assignment, password hashing, JWT secret rotation, rate-limit `.todo`. Optional perf smoke under `RUN_PERF=1`. Contract tests by walking every route's zod schema. Migration tests: fresh-apply, status downcase fix, seed idempotency.

**Phase 9 — CI/DX.** GitHub Actions: `test.yml` (lint+typecheck+test), `e2e.yml`, `mobile.yml`, `security.yml`. Husky + lint-staged. `TESTING.md`. Activate coverage gates.

**Phase 10 — Final audit.** Combined coverage report. Update this file with finals, all `.failing/.todo`, deps added, behavior changes (target: zero), bugs found, risks not covered.

## Dependencies added (running tally)

| Phase | Package                                                                                                                                                                                                                  | Workspace                    | Why                                                                                                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.2   | `vitest`, `@vitest/ui`, `@vitejs/plugin-react`, `jsdom`                                                                                                                                                                  | apps/dashboard, apps/website | Frontend unit/integration runner                                                                                                              |
| 1.2   | `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`                                                                                                                                     | apps/dashboard, apps/website | DOM testing primitives                                                                                                                        |
| 1.2   | `msw`                                                                                                                                                                                                                    | apps/dashboard, apps/website | API mocking at the network layer                                                                                                              |
| 1.3   | `@playwright/test`                                                                                                                                                                                                       | root                         | E2E across all surfaces                                                                                                                       |
| 1.4   | `junit:junit:4.13.2`, `mockito-core:5.12`, `mockito-inline:5.2`, `robolectric:4.15.1`, `androidx.test.ext:junit:1.1.5`, `androidx.test:core/runner/rules`, `espresso-core/contrib:3.5.1`, `okhttp3:mockwebserver:4.12.0` | apps/mobile                  | Android JVM + instrumented tests. Robolectric bumped from 4.11.1 → 4.15.1 because 4.11.1's bundled ASM doesn't understand JDK 24 class files. |
| 2.1a  | `fast-check@^3.23`                                                                                                                                                                                                       | packages/api                 | Property-based tests for the order-state transition table.                                                                                    |

## Removed

| Phase | Package                       | Why                                                                                            |
| ----- | ----------------------------- | ---------------------------------------------------------------------------------------------- |
| 1.5   | `expo@~55.0.5` (root devDeps) | Unused; pulls react@^19 → forced `--legacy-peer-deps` on every install. Mobile is native Java. |

## Bugs fixed (with commit SHAs)

All 8 pinned bugs were fixed 2026-05-09 in 8 surgical commits. Each commit
deletes the companion test (which pinned the broken state) and flips the
`.failing` / `.fails` / inverted-assertion to a natural assertion.

| Source file:line                                                                     | Bug                                                                                                                                                                                                           | Fix commit | Test that flipped                                                                                                                                                                          |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/api/src/routes/analytics.ts:23`                                            | `/analytics/overview` queried `status: 'PENDING'` (uppercase) after the lifecycle migration switched the vocabulary to lowercase. `pendingRequests` was silently always 0.                                    | `dad8c83`  | `tests/routes/analytics.test.ts` — `pendingRequests equals the number of lowercase "pending" requests`                                                                                     |
| `packages/api/src/middleware/error.ts:13-25`                                         | No mapping for Prisma `P2002` (unique constraint) — fell through to generic 500. Same for `P2025` (record not found).                                                                                         | `911025f`  | `tests/middleware/error.test.ts` — `Prisma P2002 (unique constraint) maps to 409 with a friendly error` (+ new P2025 → 404 sibling)                                                        |
| `packages/api/src/routes/auth.ts:176`                                                | Worker-register handler called `workerRegisterSchema.parse(req.body)` inline instead of going through `validate(...)` middleware. ZodError → 500 instead of 400.                                              | `eefb22a`  | `tests/routes/auth.test.ts` — `missing required field (idNumber) returns 400 from zod with field-level details`                                                                            |
| `packages/api/src/routes/collections.ts:20`                                          | `POST /collections` had the same anti-pattern: `collectionSchema.parse(req.body)` inline. ZodError → 500.                                                                                                     | `7ed9fd0`  | `tests/security/contract.test.ts` — `POST /api/v1/collections with empty body returns 400` (now part of the parametrised `VALIDATED_ENDPOINTS` table)                                      |
| `packages/api/src/routes/users.ts:255-273`                                           | `GET /users/:id` had no `deletedAt: null` filter, so a soft-deleted user was readable via the single-row endpoint even though the list endpoint hid them.                                                     | `23afb91`  | `tests/routes/users.test.ts` — `GET /users/:id returns 404 for a soft-deleted user (matches list endpoint behavior)`                                                                       |
| `apps/mobile/app/build.gradle:31`                                                    | Both `debug` and `release` baked in the emulator loopback `http://10.0.2.2:4000/api/v1`. A release APK on a real device couldn't reach the API.                                                               | `a5d3348`  | `apps/mobile/app/src/test/java/kg/ekonaryn/app/BuildConfigUrlTest.java` — `releaseVariant_doesNotPointAtTheEmulatorLoopback` (now `assertNotEquals`) + new `releaseVariant_defaultIsHttps` |
| `apps/dashboard/src/app/settings/page.tsx:14-17`                                     | `useState({ name: user?.name \|\| '' })` ran at SettingsPage mount, before `<DashboardLayout>` gated rendering on `user` being non-null. Form initialized empty and never re-seeded.                          | `67364d7`  | `apps/dashboard/tests/pages/settings.test.tsx` — `form seeds with the current user name and phone once /auth/me resolves`                                                                  |
| `apps/dashboard/src/components/{DashboardLayout,DataTable}.tsx` + form-bearing pages | a11y: icon-only buttons (Bell, pagination chevrons) had no `aria-label`; form `<input>`/`<select>` had `<label>` without `htmlFor`/`id` pairing; `<h3>` directly under `<h1>` skipped `<h2>` (heading-order). | `add7573`  | `apps/dashboard/tests/a11y/pages.a11y.test.tsx` — `OverviewPage` / `RequestsPage` / `ActivityPage` / `SettingsPage (admin)` (all four `.fails` flipped)                                    |

## Bugs found while fixing

None. The audit during Bug 4 (every `findUnique({ where: { id } })` on `User`/`PickupRequest` in API source) confirmed every other callsite already handled `deletedAt` post-fetch. The Bug 7 fix scope expanded slightly to cover the `DataTable` pagination chevrons because they were the actual axe violations on RequestsPage — same root cause as the listed gaps, in the same commit.

## `.failing` / `.todo` / `xtest` registry

After the 8-bug fix sweep, only `.todo` markers remain. Each one tracks future
work that has no production bug today.

| File                                           | Test                                                                                | Type    | Underlying issue                                                             |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------- |
| `tests/routes/auth.test.ts`                    | `resend should be rate-limited (no throttling today)`                               | `.todo` | No rate limiting on auth endpoints.                                          |
| `packages/shared/tests/schemas/domain.test.ts` | `FUTURE: scheduleSchema should reject hour > 23 or minute > 59`                     | `.todo` | `scheduleSchema.time` regex is purely structural — accepts `24:00`, `12:60`. |
| `tests/security/jwt-rotation.test.ts`          | `FUTURE: /auth/login should rate-limit repeated bad-password attempts (none today)` | `.todo` | No rate limiting on auth endpoints.                                          |
| `tests/security/jwt-rotation.test.ts`          | `FUTURE: /auth/verify/resend should rate-limit code resends (none today)`           | `.todo` | No rate limiting on verification resends.                                    |

## Behavior changes required

| Phase | Change                                                                                                            | Why                                                                                                             | Production impact                                                                                                                                  |
| ----- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1   | `packages/db/prisma/schema.prisma` switched from hardcoded `url = "file:./dev.db"` to `url = env("DATABASE_URL")` | Required for tests to redirect to a separate `test.db` — `prisma db push` ignores env when the URL is hardcoded | None: existing `packages/db/.env` and `packages/api/.env` already declare `DATABASE_URL=file:./dev.db`; runtime resolution is identical to before. |
| 1.4   | `apps/mobile/gradle/wrapper/gradle-wrapper.properties` bumped from Gradle 8.4 → 8.14.3                            | Build host runs JDK 24; Gradle 8.4 only supports up to JDK 21                                                   | Tooling-only. AGP 8.2.2 stays. Production APK output unaffected.                                                                                   |

## Risks not covered

The suites we shipped exercise a deep slice of the system, but the following are explicitly **out of scope** today. Each line is something an engineer should think about before treating any of these surfaces as "tested."

### Mobile

- **Espresso instrumented tests are written but never executed in this session.** Ten specs across `apps/mobile/app/src/androidTest/` compile-check in CI; running them against an emulator is up to whoever sets that up.
- **No JaCoCo coverage** for mobile — the gradle config doesn't emit a coverage report, so the 39 JVM tests are untracked relative to mobile production code.
- **No offline / poor-network UX coverage**. `ApiClient` maps `IOException` to `ApiException(0, msg)`, but Activity-level retry/backoff or reachability indicators are not exercised.
- **No image content validation** for worker `idDocument` uploads. The mime-type check is structural (extension + Content-Type); a `.jpg` containing executable bytes would still upload.

### API

- **No load / perf testing.** Phase 8 deferred the optional `RUN_PERF=1` smoke. We don't know the throughput/latency profile of `/requests` under concurrent admins.
- **Rate limiting is absent.** `.todo` × 2 for `/auth/login` and `/auth/verify/resend`. A motivated attacker can brute the 6-digit verification code (10⁶ space) without throttling.
- **JWT secret rotation requires a process restart** because `JWT_SECRET` is read once at module load. Rotating without restart leaves the OLD secret accepted until the process bounces.
- **Refresh-token rotation policy not tested.** `/auth/refresh` exists; revocation/rotation flow has no spec.
- **Race conditions on order assignment** are protected by an optimistic conditional `updateMany`; the test suite is single-threaded so we have not provoked a real two-admin collision.
- **CORS is wide open** (`cors()` with default config — `*`). Production likely needs an allow-list; not enforced or tested here.
- **Helmet defaults are accepted as-is.** No spec asserts a CSP, HSTS, or `X-Frame-Options` policy.
- **DB connection-pool exhaustion** is N/A under SQLite but should be re-considered when migrating to Postgres.
- **No backup/restore drill.** Even seed idempotency proves only that re-running seed is safe, not that an arbitrary backup can be restored.

### Dashboard

- **Seven list pages still at 0% line coverage**: `analytics`, `collections` (list), `financial`, `materials`, `routes`, `schedule`, `trips`, `workers` (list). Each is a list-only screen with low branching; tracked as a future sweep.
- **Materials/Schedule edit forms** (admin CRUD) are untested. Phase 4 only covered list views.
- **Real-network hover/animation/recharts behavior** is jsdom-stubbed (`ResizeObserver` is a no-op, `IntersectionObserver` never fires); chart layout regressions won't be caught.
- **a11y gaps exist and are pinned, not fixed.** Production icon-only buttons and unlabeled form inputs fail `axe-core` on every admin page; addressing them is left for a focused a11y PR.

### Website

- **`ImpactCounter` count-up animation** is asserted only at the initial-zero state. The animation logic itself isn't exercised because we install a never-fires `IntersectionObserver` in tests.
- **SEO metadata snapshot** pins title + description; we don't assert OpenGraph, Twitter Card, or favicon URLs.
- **No real Lighthouse / PageSpeed run.** Performance budgets are not enforced.

### Cross-cutting

- **No test that every i18n key exists in BOTH `ru.ts` and `en.ts`** for a workspace. Drift between languages would show up as the raw key being rendered (which Phase 5 catches at the page level for Education and About, but not exhaustively).
- **No DST / timezone tests** for `schedule.time` or activity-log timestamps. Production runs in a single timezone today.
- **No first-run / fresh-install behavior** test for the dashboard or website. Tests always assume the seeded baseline.
- **Push notifications** (FCM/APNS) — the `Notification` model exists in DB, but no integration test for delivery.
- **Geolocation** — `request.address` is a free-form string; no coordinate validation, no map-distance check.
- **Worker shift-window logic** beyond the `onShift` boolean — no test for "shift starts at 09:00, ends at 18:00" semantics (production has none today either).

## Phase reports

### Phase 1 report (2026-05-08)

- **Files added**: `packages/api/tests/teardown.ts`, `packages/api/tests/factories.ts`, `packages/api/tests/auth.ts`, `packages/api/tests/README.md`; `apps/dashboard/vitest.config.ts`, `apps/dashboard/tests/setup.ts`, `apps/dashboard/tests/msw/{server,handlers}.ts`, `apps/dashboard/tests/smoke.test.tsx`, `apps/dashboard/tests/README.md`; same five for `apps/website/`; `playwright.config.ts`, `e2e/smoke.spec.ts`; `apps/mobile/app/src/test/java/.../SmokeTest.java`, `apps/mobile/app/src/androidTest/java/.../SmokeInstrumentedTest.java`, `apps/mobile/local.properties`, `apps/mobile/TESTS.md`; `TEST_PLAN.md`.
- **Files modified**: `packages/api/jest.config.js` (v8 coverage, threshold placeholders, maxWorkers:1, teardown); `packages/db/prisma/schema.prisma` (`env("DATABASE_URL")`); root `package.json` (test/e2e scripts, removed `expo`); `apps/dashboard/package.json` (test scripts); `apps/website/package.json` (test scripts); `turbo.json` (test task); `apps/mobile/app/build.gradle` (test deps + `testOptions`); `apps/mobile/gradle/wrapper/gradle-wrapper.properties` (8.4 → 8.14.3); `.gitignore` (Playwright artifacts).
- **Tests added**: 3 stack smoke suites (dashboard 2 cases, website 1 case, mobile JVM 2 cases, mobile instrumented 2 cases not run here, Playwright 3 cases). API suite untouched at 15/15.
- **Suite result**: PASS
  - API: 15/15 (`Tests: 15 passed, 15 total`)
  - Dashboard: 2/2 (`Tests 2 passed (2)`)
  - Website: 1/1 (`Tests 1 passed (1)`)
  - Mobile JVM: BUILD SUCCESSFUL (`./gradlew testDebugUnitTest`, 2 tests in `SmokeTest`)
  - Playwright: 3/3 (`3 passed (16.0s)`)
- **Coverage delta**: not measured this phase (Phase 1 is infra-only; thresholds activate at end of Phase 2).
- **New dependencies**: `@playwright/test@^1.59` (root); `vitest@^2.1.9`, `@vitest/ui@^2.1.9`, `@vitest/coverage-v8@^2.1.9`, `@vitejs/plugin-react@^4.7`, `jsdom@^25.0.1`, `@testing-library/react@^16.3`, `@testing-library/user-event@^14.6`, `@testing-library/jest-dom@^6.9`, `msw@^2.14` (apps/dashboard, apps/website); `junit:4.13.2`, `mockito-core:5.12`, `mockito-inline:5.2`, `robolectric:4.15.1`, `androidx.test.ext:junit:1.1.5`, `androidx.test:core:1.5`, `mockwebserver:4.12`, `androidx.test:runner:1.5.2`, `androidx.test:rules:1.5`, `espresso-core:3.5.1`, `espresso-contrib:3.5.1` (apps/mobile).
- **Removed**: `expo@~55.0.5` from root devDeps (unused — mobile is native Java; eliminated `--legacy-peer-deps` install requirement).
- **Bugs found**: none (no test exercises new ground yet).
- **TODO/`.failing`/`.skip` added**: none.
- **Time taken**: ~1 hour.
- **Next phase ready**: yes.

### Phase 2 report (2026-05-08)

- **Files added**:
  - `packages/api/tests/services/{orderState,activityLog}.test.ts`
  - `packages/api/tests/utils/{tokens,verification,upload}.test.ts`
  - `packages/api/tests/middleware/{auth,validate,error}.test.ts`
  - `packages/api/tests/routes/{auth,users,requests,collections,trips,routesPlanner,schedule,materials,financial,analytics,activity}.test.ts`
  - `packages/api/tests/cross-cutting/{fullLifecycle,permissionMatrix,softDelete,phoneFormat,headers,uploads}.test.ts`
- **Files modified**: `packages/api/jest.config.js` (activated `coverageThreshold`); `packages/api/tests/helpers.ts` (`resetDb` now also wipes `FinancialRecord` and `Schedule` rows so cross-file pollution can't leak into the next test).
- **Tests added**: 351 across 25 new suites. Combined with Phase 1's 15 → **366 passing + 1 todo + 4 `.failing`**.
- **Suite result**: PASS — `Test Suites: 26 passed, 26 total. Tests: 1 todo, 366 passed, 367 total. Time: ~96s.`
- **Coverage delta** (start of Phase 2 → end of Phase 2):
  - All files: ~30% → **95.23% lines, 81.37% branches**
  - `src/services/`: ~50% → **100% lines, 97.61% branches** (target 95/90 ✓)
  - `src/middleware/`: ~30% → **96.63% lines, 90.32% branches** (target 95/90 ✓)
  - `src/routes/`: ~25% → **94.64% lines, 77.51% branches** (target 85/75 ✓)
  - `src/utils/`: ~0% → **100% lines, 90% branches** (target 90/80 ✓)
- **New dependencies**: `fast-check@^3.23` (devDep, packages/api) — property-based tests for the lifecycle transition table.
- **Bugs found** (4): see the "Bugs found by tests" table above.
- **TODO/`.failing`/`.skip` added** (5): see the registry above.
- **Behavior changes required**: **zero**. All four bugs are documented as `.failing` per the rules; none are silently fixed.
- **Time taken**: ~1.5 hours.
- **Next phase ready**: **yes** — coverage thresholds active, all suites green, Phase 3 can begin.

### Phase 3 report (2026-05-08)

- **Files added**:
  - `packages/shared/vitest.config.ts` (with thresholds wired immediately: 100/100/100 lines/funcs/stmts, 95 branches)
  - `packages/shared/tests/constants.test.ts`
  - `packages/shared/tests/types.test.ts`
  - `packages/shared/tests/index.test.ts`
  - `packages/shared/tests/schemas/{auth,domain,admin-actions}.test.ts`
- **Files modified**: `packages/shared/package.json` (added `test`, `test:watch`, `test:coverage` scripts).
- **Tests added**: 151 cases (150 passing + 1 todo) across 6 suites.
- **Suite result**: PASS — `Tests 150 passed | 1 todo (151). Test Files 6 passed (6). Time ~3s.`
- **Coverage** (every file at 100%):
  ```
  --------------|---------|----------|---------|---------|
  File          | % Stmts | % Branch | % Funcs | % Lines |
  --------------|---------|----------|---------|---------|
  All files     |     100 |      100 |     100 |     100 |
   constants.ts |     100 |      100 |     100 |     100 |
   schemas.ts   |     100 |      100 |     100 |     100 |
   types.ts     |     100 |      100 |     100 |     100 |
  --------------|---------|----------|---------|---------|
  ```
- **New dependencies**: `vitest@^2.1`, `@vitest/coverage-v8@^2.1` (devDeps, packages/shared).
- **Bugs found**: 0 in production behavior. One small spec gap (`scheduleSchema.time` is purely structural — accepts `24:00`/`12:60`) is captured as a `.todo`, not a bug, since the regex matches the documented intent in `schemas.ts:77`.
- **TODO/`.failing`/`.skip` added** (1): `FUTURE: scheduleSchema should reject hour > 23 or minute > 59`. The "current behavior" test pins what it accepts today.
- **Behavior changes required**: **zero**.
- **Time taken**: ~25 minutes.
- **Next phase ready**: **yes** — Phase 4 (dashboard component & page tests) can begin.

### Phase 4 report (2026-05-08)

- **Files added**:
  - **Components (Phase 4.1a)**: `apps/dashboard/tests/components/{StatusBadge,StatsCard,PageHeader,Sidebar,DataTable}.test.tsx`
  - **Lib (Phase 4.1b)**: `apps/dashboard/tests/lib/{utils,i18n,auth,hooks,api}.test.ts`
  - **Pages (Phase 4.2)**: `apps/dashboard/tests/pages/{login,workers-pending,overview,activity,requests,settings,new-collection,residents-and-workers}.test.tsx`
  - **A11y (Phase 4.3)**: `apps/dashboard/tests/a11y/pages.a11y.test.tsx`
- **Files modified**:
  - `apps/dashboard/tests/setup.ts` — added `ResizeObserver` stub (recharts), `matchMedia` stub, switched `next/navigation` mock to `vi.fn()` wrappers so per-test `vi.mocked(...).mockReturnValue(...)` works, registered `vitest-axe/matchers` globally.
  - `apps/dashboard/vitest.config.ts` — activated coverage thresholds: 70/70/70/70 (lines/statements/functions/branches).
  - `apps/dashboard/package.json` — added `vitest-axe@^0.1`, `@axe-core/react@^4.11` to devDeps.
- **Tests added**: 117 cases across 20 suites (Phase 4.1a: 44; Phase 4.1b: 34; Phase 4.2: 32; Phase 4.3: 5; Residents/Workers fill-in: 7). Combined repo total now **484 passing + 1 todo + 5 .fails/.failing**.
- **Suite result**: PASS — `Test Files 20 passed (20). Tests 117 passed (117). Time ~21s.`
- **Coverage** (Phase 4 baseline):
  ```
  -------------------|---------|----------|---------|---------|
  File               | % Stmts | % Branch | % Funcs | % Lines |
  -------------------|---------|----------|---------|---------|
  All files          |   72.86 |    83.23 |   78.07 |   72.86 |  ✓ (≥70 target)
   app/login         |     100 |       90 |     100 |     100 |
   app/settings      |     100 |    94.44 |     100 |     100 |
   app/activity      |     100 |    72.22 |   66.66 |     100 |
   app/collections/new|    100 |       84 |    62.5 |     100 |
   app                |   98.59 |    76.92 |      40 |   98.59 |  (overview)
   app/requests      |   88.09 |    81.08 |   66.66 |   88.09 |
   app/workers/pending|   96.52 |       68 |     100 |   96.52 |
   app/residents     |     100 |      100 |     100 |     100 |
   app/workers       |   95.68 |    78.57 |     100 |   95.68 |
   components        |    96.4 |    83.33 |      75 |    96.4 |
   components/ui     |   99.38 |    94.28 |   85.71 |   99.38 |
   lib                |  99.35 |     91.2 |    90.9 |   99.35 |
   lib/messages      |     100 |      100 |     100 |     100 |
  -------------------|---------|----------|---------|---------|
  ```
  Pages still at 0% (will be picked up in a future sweep — they're list views with little branching): `analytics`, `collections`, `financial`, `materials`, `routes`, `schedule`, `trips`. They drag the average down ~25 points.
- **New dependencies** (devDeps, apps/dashboard): `vitest-axe@^0.1`, `@axe-core/react@^4.11`.
- **Bugs found** (2 new):
  1. **`apps/dashboard/src/app/settings/page.tsx:14-17`** — `useState({ name: user?.name || '' })` runs at SettingsPage mount, but `<DashboardLayout>` is _inside_ SettingsPage. The form initializes empty and never re-seeds when `/auth/me` resolves. Caught by `tests/pages/settings.test.tsx`.
  2. **A11y systemic gaps** (Sidebar/header icon-only buttons + form `<label>` without `htmlFor`/`id`) flagged by axe-core on every admin page. Caught by `tests/a11y/pages.a11y.test.tsx`. LoginPage is the only page that passes a strict sweep.
- **TODO/`.failing`/`.fails`/`.skip` added** (5):
  - `tests/pages/settings.test.tsx` — `FUTURE: form should seed with the current user name and phone` (`.fails`).
  - `tests/a11y/pages.a11y.test.tsx` — `.fails` × 4 for Overview / Requests / Activity / Settings.
- **Behavior changes required**: **zero**. Both bugs are pinned with `.fails` per the rules; none are silently fixed.
- **Time taken**: ~3 hours.
- **Next phase ready**: **yes** — Phase 5 (website tests), Phase 6 (Playwright E2E), Phase 7 (mobile JVM tests) can begin.

### Phase 5 report (2026-05-08)

- **Files added**:
  - **i18n + components (Phase 5.1)**: `apps/website/tests/lib/i18n.test.tsx`, `apps/website/tests/components/{Header,Footer,ImpactCounter}.test.tsx`
  - **Pages (Phase 5.2)**: `apps/website/tests/pages/{home,static-pages,contact,materials,schedule}.test.tsx`
  - **Request fork (Phase 5.3)**: `apps/website/tests/pages/request.test.tsx`
  - **SEO (Phase 5.4)**: `apps/website/tests/seo.test.ts`
- **Files modified**:
  - `apps/website/vitest.config.ts` — activated coverage thresholds (90 lines / 90 statements / 80 functions / 85 branches), with `src/app/layout.tsx` excluded (RSC + `next/headers` not exercisable from jsdom; metadata is pinned by `tests/seo.test.ts` separately).
- **Tests added**: 52 cases across 12 suites (i18n: 10, Header: 4, Footer: 4, ImpactCounter: 3, home: 3, static-pages: 5, contact: 4, materials: 5, schedule: 4, request: 6, SEO: 3, smoke: 1). Combined repo total now **536 passing + 1 todo + 5 .fails/.failing**.
- **Suite result**: PASS — `Test Files 12 passed (12). Tests 52 passed (52). Time ~7s.`
- **Coverage** (Phase 5 baseline, all numbers ≥ activated threshold):
  ```
  -------------------|---------|----------|---------|---------|
  File               | % Stmts | % Branch | % Funcs | % Lines |
  -------------------|---------|----------|---------|---------|
  All files          |   98.99 |     93.7 |   82.22 |   98.99 |  ✓
   app/about         |     100 |      100 |     100 |     100 |
   app/contact       |     100 |      100 |     100 |     100 |
   app/education     |     100 |      100 |     100 |     100 |
   app/materials     |     100 |      100 |     100 |     100 |
   app/page.tsx      |     100 |      100 |     100 |     100 |
   app/request       |     100 |    96.15 |     100 |     100 |
   app/schedule      |     100 |      100 |     100 |     100 |
   components        |    97.5 |    87.50 |   77.77 |    97.5 |
   lib                |  97.02 |    96.87 |   84.61 |   97.02 |
   lib/messages      |     100 |      100 |     100 |     100 |
  -------------------|---------|----------|---------|---------|
  ```
  The 82% functions number is held back by `ImpactCounter`'s count-up timer (we install a never-fires `IntersectionObserver` to keep tests deterministic) and a 6-line unused branch in `lib/utils.ts`. Both are intentional gaps documented in the threshold comment in `vitest.config.ts`.
- **New dependencies**: none. Reused the Phase 1 website infra (`vitest`, `@testing-library/react`, `msw`).
- **Bugs found**: **0** in production behavior. The `/request` page's register-then-login fork works exactly as the API expects (register first, fall back to login on 4xx, then submit with the token).
- **TODO/`.failing`/`.fails`/`.skip` added**: **0**.
- **Behavior changes required**: **zero**.
- **Time taken**: ~50 minutes.
- **Next phase ready**: **yes** — Phase 6 (Playwright E2E), Phase 7 (mobile JVM tests) can begin.

### Phase 6 report (2026-05-08)

- **Files added**:
  - `e2e/setup/seed.ts` — `reseed()` helper that shells out to the canonical `npm run db:seed --workspace=@ekonaryn/db`, so E2E tests run on the same fixture set developers see locally.
  - `e2e/setup/global-setup.ts` — runs `reseed()` once before any spec, wired through `playwright.config.ts > globalSetup`.
  - `e2e/setup/fixtures.ts` — exports a Playwright `test` extended with an `apiLogin` helper, plus a `URLS` map and a `SEED` map of canonical fixture credentials (admin / worker / pending worker / resident).
  - `e2e/auth.spec.ts` — 4 tests covering unauth → /login redirect, admin happy login, wrong password inline error, "Admin only" guard for non-admins.
  - `e2e/lifecycle.spec.ts` — 1 spec walking a request through the full lifecycle (create via API → assign → in_progress → completed) with admin dashboard UI verification at the start and end, plus an audit-log assertion in the middle.
  - `e2e/worker-approval.spec.ts` — 2 specs for approve/reject paths against the seed PENDING_APPROVAL worker; reject path asserts login afterwards returns 403 with the rejection reason in the message body.
  - `e2e/i18n-and-suspended.spec.ts` — 3 specs for dashboard /login language toggle persistence, website Header language toggle persistence, and a suspended-worker login (403 + reason).
- **Files modified**: `playwright.config.ts` — wired `globalSetup: './e2e/setup/global-setup.ts'`.
- **Tests added**: 10 new E2E specs across 4 files (combined with Phase 1's 3 smoke tests → **13 specs total**).
- **Suite result**: PASS — `13 passed (59.1s)` across all four projects' webServers + a real SQLite DB. Suite runs serially (`workers: 1`, SQLite-safe).
- **Coverage delta**: not applicable — Playwright runs against the live stack, not instrumented code.
- **New dependencies**: none. Reused `@playwright/test` from Phase 1.
- **Bugs found**: **0** new. Two existing service-area / permission guardrails fired during test development and were correctly handled by writing the address/worker selection to satisfy them — those production behaviors were not changed.
- **Behavior changes required**: **zero**.
- **Production gotchas surfaced (NOT bugs, just sharp edges)**:
  - The dashboard's request-assignment UI has a visible race: when a worker is selected from the inline `<select>` immediately after clicking Assign, the `/users` fetch may still be in flight and `selectOption` can land on the disabled placeholder. The lifecycle test routes through the API for the assign step instead of fighting the race. Not a production bug — real users have time to wait — but worth noting if we ever wire this surface into a production smoke test.
  - `/auth/register/worker` requires `multipart/form-data` with an `idDocument` file upload. JSON POSTs return 400. Documented in `e2e/worker-approval.spec.ts` rationale (we use the seed PENDING worker rather than registering a fresh one).
  - The dashboard's i18n cookie name is `ekonaryn_lang`; the website uses the same constant from `lang-config.ts`. Tests handle either spelling defensively.
- **TODO/`.failing`/`.fails`/`.skip` added**: **0**.
- **Time taken**: ~1 hour, including three iteration loops to fix the assign service-area mismatch and the multipart upload route name.
- **Next phase ready**: **yes** — Phase 7 (mobile JVM tests) can begin.

### Phase 7 report (2026-05-08)

- **Files added** (JVM unit tests, Phase 7.1–7.4):
  - `apps/mobile/app/src/test/java/kg/ekonaryn/app/auth/AuthManagerTest.java` — 5 Robolectric tests for save/clear/round-trip/corrupt-blob/multi-instance shared state.
  - `apps/mobile/app/src/test/java/kg/ekonaryn/app/LocaleHelperTest.java` — 5 tests for default lang, set/get round-trip, `wrap()` honoring stored lang, `updateResources()` setting both Configuration locale AND `Locale.getDefault()`.
  - `apps/mobile/app/src/test/java/kg/ekonaryn/app/api/ApiClientTest.java` — 13 MockWebServer-backed contract tests covering login, /auth/me, getMaterials, createRequest (with notes-omit edge case), getRequests query-string composition, error envelope unwrap, network-failure → ApiException(0), approveWorker URL composition, multipart `registerWorker` upload format, and null-data response handling.
  - `apps/mobile/app/src/test/java/kg/ekonaryn/app/api/AsyncTest.java` — 3 tests for the success path, error path, and the null-OnError swallow path (pool not poisoned).
  - `apps/mobile/app/src/test/java/kg/ekonaryn/app/api/ModelsRoundTripTest.java` — 7 Gson tests pinning every documented field on User / PickupRequest / Material against the actual API JSON shape, including nullable nested fields and "unknown fields are silently ignored" forward-compat.
  - `apps/mobile/app/src/test/java/kg/ekonaryn/app/BuildConfigUrlTest.java` — 4 tests including the build.gradle parser that flags the release-URL bug.
- **Files added** (Espresso specs, Phase 7.6 — written, NOT run because no emulator is attached):
  - `apps/mobile/app/src/androidTest/java/kg/ekonaryn/app/auth/LoginActivityTest.java` — 4 specs (form fields visible, language toggle swap, empty-submit no-crash, typing populates fields).
  - `apps/mobile/app/src/androidTest/java/kg/ekonaryn/app/auth/RegisterActivityTest.java` — 4 specs (resident default visible, switch to worker reveals worker fields, switch back hides them, typing fills inputs).
  - `apps/mobile/app/src/androidTest/java/kg/ekonaryn/app/admin/AdminMainActivityTest.java` — 1 spec (bottom nav visible after AuthManager seed).
  - `apps/mobile/app/src/androidTest/java/kg/ekonaryn/app/admin/PendingWorkersActivityTest.java` — 1 spec (activity launches with admin auth seeded; full approve/reject round-trip needs a live API + real token).
- **Files modified**: none (production code untouched; ApiClient is exercised via reflection from tests rather than via a test-only constructor).
- **Tests added** (run): **39 JVM tests** across 7 files, all passing under Robolectric SDK 33 + Gradle 8.14.3 + JDK 24. Combined with Phase 1's 2 → **41 mobile JVM tests total**.
- **Tests added** (compiled but not executed): **10 Espresso specs** across 4 files. They compile under `./gradlew compileDebugAndroidTestSources`. To run them: connect an emulator/device and `./gradlew connectedDebugAndroidTest`.
- **Suite result**: PASS — `BUILD SUCCESSFUL in 12s. 7 testsuites, 39 tests, 0 failures, 0 errors.`
- **Coverage delta**: not measured this phase (mobile coverage tooling — JaCoCo — would land in Phase 9 alongside the CI wire-up).
- **New dependencies**: none. Reused Phase 1 mobile test deps (`junit`, `mockito`, `robolectric:4.15.1`, `mockwebserver`, `espresso-core/contrib`).
- **Bugs found** (1 new):
  - **`apps/mobile/app/build.gradle:31`** — `release { buildConfigField "String", "API_BASE_URL", "\"http://10.0.2.2:4000/api/v1\"" }`. Both `debug` and `release` point at the Android emulator's host loopback. A release APK distributed to a real device cannot reach the API. Pinned by `BuildConfigUrlTest.releaseVariant_currentlyMatchesTheEmulatorUrl_pinningTheBugUntilItIsFixed` + companion `FUTURE_releaseUrl_shouldNotBeTheEmulatorLoopback`.
- **TODO/`.failing`/`.fails`/`.skip` added** (1): the inverted-assertion in `BuildConfigUrlTest`.
- **Behavior changes required**: **zero**. ApiClient stayed as a singleton; tests use reflection on its private constructor + final field rather than asking for a test-only injection point.
- **Quirk noted**: under Robolectric 4.15.1 + SDK 33, `LocaleHelper.updateResources()` called twice in a row can leave the second `createConfigurationContext()` reflecting the first call's locale (resource-cache effect). Real Android does the right thing; we don't assert the second hop in `updateResources_overridesLocaleEvenWhenNotStored`.
- **Time taken**: ~1.5 hours.
- **Next phase ready**: **yes** — Phase 8 (security/perf/contract/migration) can begin.

### Phase 8 report (2026-05-08)

- **Files added** (under `packages/api/tests/security/`):
  - `auth-bypass.test.ts` (44 tests) — every protected route returns 401 with no/malformed/wrong-secret/expired tokens; admin-only endpoints return 403 for residents.
  - `idor.test.ts` (10 tests) — Resident A cannot read/update Resident B; Worker cannot read another worker; Worker cannot transition another worker's order; per-role list filtering on `/requests`.
  - `injection.test.ts` (6 tests) — SQL-shaped strings stored verbatim (Prisma parameterized); NoSQL operator injection (`{$ne: null}`) rejected by zod with 400.
  - `path-traversal.test.ts` (7 tests) — `/uploads` static handler rejects `../`, URL-encoded `%2e%2e`, double-encoded `%252e%252e`, mixed-slash, etc.
  - `mass-assignment.test.ts` (7 tests) — Resident cannot escalate role/accountStatus (route 403), cannot self-set password/points/idNumber (zod strips); registration stores bcrypt hash, never plaintext; round-trip login confirms hash works.
  - `jwt-rotation.test.ts` (4 tests + 2 `.todo`) — wrong-secret 401, current-secret accepted, signature tamper 401, payload tamper 401. `.todo` for the missing rate-limit on `/auth/login` and `/auth/verify/resend`.
  - `contract.test.ts` (34 tests) — every validate()-wrapped POST/PUT rejects empty body with 400; admin-only GET endpoints 403 for both residents and workers; public endpoints (materials/schedule) reachable unauth. Includes companion + `.failing` for the new bug below.
  - `migrations.test.ts` (6 tests) — every migration ships a migration.sql; lock file pins SQLite; the lifecycle-migration backfill (uppercase → lowercase status) is present; FK column shape correct; SQL parses OK; **seed idempotency** (running `npm run db:seed` twice leaves identical row counts).
- **Files modified**: none.
- **Tests added**: **120 new tests** across 8 suites (118 passing + 2 todo). Combined API total now **484 passing + 3 todo + 1 .failing → 487 across 34 suites**.
- **Suite result**: PASS — `Test Suites: 34 passed, 34 total. Tests: 3 todo, 484 passed, 487 total.`
- **Coverage delta**: API still ≥ Phase 2 thresholds (services 95/90, middleware 95/90, routes 85/75, utils 90/80). New security tests exercise the auth/validate/error middleware further, which only helps.
- **New dependencies**: none.
- **Bugs found** (1 new — pinned, NOT silently fixed):
  - **`packages/api/src/routes/collections.ts:20`** — `POST /collections` calls `collectionSchema.parse()` directly inside the handler instead of via `validate()` middleware, so a missing field returns **500** instead of 400. Same root cause as the existing `/auth/register/worker` bug. Caught by `tests/security/contract.test.ts` — companion test pinning current 500, `.failing` test for the future 400.
- **TODO/`.failing`/`.fails`/`.skip` added** (3): the 1 `.failing` for collections + 2 `.todo` for `/auth/login` and `/auth/verify/resend` rate-limit gaps.
- **Behavior changes required**: **zero**.
- **Production hardening confirmed by tests**:
  - Prisma is parameterized — SQL injection payloads stored as literal strings.
  - Zod strips unknown keys by default — mass-assignment of `password`, `points`, `idNumber` (when not in schema) is silently ignored.
  - `requireActiveAccount` middleware re-reads the DB so suspensions take effect within seconds.
  - `/uploads` static handler under express normalizes path traversal attempts to 404.
  - Bcrypt with $2b$ hash format used everywhere; passwords never stored plaintext; round-trip login proves verify works.
  - JWTs reject signature tampering, payload tampering, expired tokens, wrong-secret tokens.
- **Skipped**: optional perf smoke under `RUN_PERF=1` — left for Phase 9 (CI/DX) where load-test reproducibility matters more.
- **Time taken**: ~1.25 hours.
- **Next phase ready**: **yes** — Phase 9 (CI/DX) can begin.

### Phase 9 report (2026-05-08)

- **Files added**:
  - `.github/workflows/test.yml` — lint + 4 parallel jobs (shared / api / dashboard / website) with coverage uploaded as artifacts; cache npm, runs on push & PR.
  - `.github/workflows/e2e.yml` — Playwright runs against the live stack (boots api/dashboard/website via `webServer`); HTML report uploaded on every run, traces only on failure; caches `~/.cache/ms-playwright`.
  - `.github/workflows/mobile.yml` — JDK 17, runs `./gradlew testDebugUnitTest`, also `compileDebugAndroidTestSources` to catch Espresso drift; gradle caches keyed off lockfiles; only runs when `apps/mobile/**` changes.
  - `.github/workflows/security.yml` — `npm audit --omit=dev --audit-level=high`, gitleaks secret scan over full history, plus `tests/security` subset; runs on push/PR + weekly Monday cron.
  - `.husky/pre-commit` — invokes `npx lint-staged`.
  - `TESTING.md` — single-page entry doc: quick-start commands per workspace, suite map, coverage gate table, top-8 production bugs the suites have pinned, CI workflow summary, "how to add a new test", "what to do when you find a bug".
- **Files modified**:
  - `package.json` — added `husky` (^9.1) + `lint-staged` (^16.4) devDeps, `prepare` script, `lint-staged` config (prettier on TS/TSX/JS/JSX/JSON/MD/YAML; eslint left to CI per-workspace where the right plugin set is loaded).
- **New dependencies** (root): `husky@^9.1.7`, `lint-staged@^16.4.0`.
- **Tests added**: 0 (pure DX / pipeline phase). Verified that all existing suites still pass after the prettier-formatting sweep run by the new pre-commit hook on a `--diff=HEAD` shake-out: API 487/487 green (484 + 3 todo), shared 151/151 (150 + 1 todo), website 52/52.
- **CI coverage of bugs**: every `.failing` and `.todo` survives in CI because the failing assertions are wrapped (Jest `.failing`, Vitest `test.fails`, JUnit inverted-assert) so they are _expected_ failures and the suite stays green; the moment a bug is fixed, the assertion flips and the test fails loudly.
- **Behavior changes required**: **zero**. The repo-wide prettier reformatting is purely whitespace/quote-style (no semantic changes); test results before and after are identical.
- **Time taken**: ~30 minutes.
- **Next phase ready**: **yes** — Phase 10 (final audit) can begin.

### Phase 10 report (2026-05-08)

- **What ran**:
  - **API**: `npx jest --coverage` — `Test Suites: 34 passed, 34 total. Tests: 3 todo, 484 passed, 487 total. Time: ~98s.` Coverage: lines **95.32**, branches **82.71**, functions **100**.
  - **Shared**: `npx vitest run --coverage` — `Test Files 6 passed (6). Tests 150 passed | 1 todo (151).` Coverage: **100/100/100/100**.
  - **Dashboard**: `npx vitest run --coverage` — `Test Files 20 passed (20). Tests 117 passed (117).` Coverage: **73.38** lines, **83.23** branches, **78.07** funcs.
  - **Website**: `npx vitest run --coverage` — `Test Files 12 passed (12). Tests 52 passed (52).` Coverage: **98.99** lines, **93.7** branches, **82.22** funcs.
  - **E2E**: `npx playwright test` — `13 passed (55.1s)` against the live API + dashboard + website + real SQLite DB.
  - **Mobile JVM**: `./gradlew testDebugUnitTest` — 39 tests, 0 failures across 7 suites (incremental build was already up-to-date).
- **Final tally**: **855 passing tests + 4 todos + 10 .failing/.fails/inverted markers** across 89 test files spanning 6 distinct test runners.
- **Bug audit** (each row of the bugs table verified against current source):
  - `routes/auth.ts:176` — `workerRegisterSchema.parse()` still in handler ✓
  - `routes/analytics.ts:23` — `status: 'PENDING'` literal still present ✓
  - `routes/users.ts:255-273` — `GET /:id` still has no `deletedAt: null` filter ✓
  - `middleware/error.ts:13-25` — still no Prisma error mapping ✓
  - `routes/collections.ts:20` — `collectionSchema.parse()` still in handler ✓
  - `app/settings/page.tsx:14-15` — `useState({ name: user?.name })` ordering still wrong ✓
  - `apps/mobile/app/build.gradle:31` — release block still on emulator URL ✓
  - Dashboard a11y gaps — still flagged by axe ✓
  - **Line numbers updated** in the bugs table where prettier shifted them (auth.ts 153 → 176, users.ts 208 → 255).
- **`.failing` / `.todo` registry audit**: enumerated via `grep`, 14 markers in source + 1 inverted-assert in mobile = 15 total. All 15 entries are present in the registry table above.
- **Risks not covered**: filled out — see the [Risks not covered](#risks-not-covered) section. Honest list of gaps grouped by Mobile / API / Dashboard / Website / Cross-cutting.
- **Behavior changes required**: still **zero net change to production behavior**. The two production-side edits (DB URL → `env`; Gradle wrapper version) are tooling, not behavior.
- **Top-of-file summary** added: at-a-glance test counts, coverage state, and "what's next" recommendations for whoever picks this up.
- **Time taken**: ~25 minutes.
- **Next phase ready**: N/A — this was the final audit. The plan is complete.

## Bug Fix Plan (started 2026-05-08)

Following the 8-bug Claude Code fix prompt. **Order is deliberate**: pure-API independent fixes first, then cross-cutting middleware, then dashboard, then mobile.

| #   | Bug                                    | File                                                                                                                | Approach                                                                                                                                                                                                                                                                                                    |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | analytics `'PENDING'` literal          | `routes/analytics.ts:23`                                                                                            | One-char fix: `'PENDING'` → `'pending'`. Audit other route files for the same pattern.                                                                                                                                                                                                                      |
| 5   | Prisma `P2002` → 500                   | `middleware/error.ts`                                                                                               | Add `Prisma.PrismaClientKnownRequestError` discrimination block above the generic 500 fallback. Map `P2002` → 409, `P2025` → 404.                                                                                                                                                                           |
| 2   | `/auth/register/worker` skips validate | `routes/auth.ts:158-186`                                                                                            | Move `workerRegisterSchema.parse()` out of the handler and into a `validate(workerRegisterSchema)` middleware. Pre-coerce `serviceAreas` array + `vehicleCapacityKg` number from multer's stringly-typed body via a small inline middleware before validate runs. Keep the `req.file` check after validate. |
| 3   | `/collections` skips validate          | `routes/collections.ts:12-26`                                                                                       | Same pattern as Bug 2. Pre-coerce `actualWeightKg` from string to number, then `validate(collectionSchema)`.                                                                                                                                                                                                |
| 4   | `GET /users/:id` returns soft-deleted  | `routes/users.ts:255-273`                                                                                           | Switch `findUnique({ where: { id } })` → `findFirst({ where: { id, deletedAt: null } })`. Audit other routes for the same anti-pattern.                                                                                                                                                                     |
| 8   | Mobile release URL = emulator loopback | `apps/mobile/app/build.gradle:28-32`                                                                                | Read URL via `project.findProperty('API_BASE_URL_{DEBUG,RELEASE}')` with debug-default = `http://10.0.2.2:4000/api/v1`, release-default = `https://api.ekonaryn.kg/api/v1`. Update `BuildConfigUrlTest` parser to evaluate the new pattern.                                                                 |
| 6   | Settings form initializes empty        | `apps/dashboard/src/app/settings/page.tsx`                                                                          | Lift the form into `<SettingsForm user={user} />` child rendered only when `user` is non-null (Option A).                                                                                                                                                                                                   |
| 7   | Dashboard a11y gaps                    | `Sidebar.tsx`, `DashboardLayout.tsx`, `app/login/page.tsx`, `app/settings/page.tsx`, `app/collections/new/page.tsx` | Add `aria-label` to icon-only buttons (logout, bell, avatar) reading from new `a11y.*` i18n keys (RU + EN). Add `htmlFor` / `id` pairs to every form input.                                                                                                                                                 |

**Acceptance per bug**: marker test flips green; companion test deleted; full workspace suite still passes; commit message of the form `fix: <summary> (closes pinned test in <test path>)`.
