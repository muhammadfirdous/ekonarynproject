# Testing

This is the entry point for running and understanding the test suites in this monorepo. The detailed phase-by-phase plan, bug registry, and `.failing`/`.todo` ledger live in [`TEST_PLAN.md`](./TEST_PLAN.md).

## Quick start

```bash
# Run every JS/TS test suite (api, shared, dashboard, website)
npm test

# Per-workspace
npm run test:api          # Jest + Supertest, ~5s, 483 tests
npm run test:shared       # Vitest, ~3s, 151 tests
npm run test:dashboard    # Vitest + RTL + MSW + axe, ~20s, 116 tests
npm run test:website      # Vitest + RTL + MSW, ~7s, 52 tests

# E2E across the live stack (boots api + dashboard + website + real SQLite DB)
npm run e2e               # 13 specs, ~1 min
npm run e2e:ui            # Playwright UI mode, useful for debugging

# Mobile JVM tests (requires JDK 17+)
cd apps/mobile && ./gradlew testDebugUnitTest   # 39 tests, ~15s

# Mobile Espresso tests (requires emulator/device)
cd apps/mobile && ./gradlew connectedDebugAndroidTest
```

## Suite map

| Suite                        | Tool                                | Where                              | Purpose                                                                                                                |
| ---------------------------- | ----------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| API unit + integration       | Jest + Supertest                    | `packages/api/tests/`              | Service logic, middleware, every route's happy/role/validation path, full request lifecycle, security suite (Phase 8). |
| Shared schemas + types       | Vitest                              | `packages/shared/tests/`           | Every zod schema's parse/safeParse boundary, constants integrity. 100% line coverage.                                  |
| Dashboard components + pages | Vitest + RTL + MSW                  | `apps/dashboard/tests/`            | Components, hooks, lib, page integration with mocked API, axe a11y sweep.                                              |
| Website components + pages   | Vitest + RTL + MSW                  | `apps/website/tests/`              | Public pages in EN+RU, /request register-then-login fork, SEO metadata snapshot.                                       |
| End-to-end                   | Playwright                          | `e2e/`                             | Auth, full request lifecycle through UI, worker approval, i18n persistence, suspended-worker login.                    |
| Mobile JVM                   | JUnit + Robolectric + MockWebServer | `apps/mobile/app/src/test/`        | AuthManager, ApiClient (against MockWebServer), Async, Gson model round-trips, LocaleHelper, BuildConfig URL pin.      |
| Mobile instrumented          | Espresso                            | `apps/mobile/app/src/androidTest/` | LoginActivity / RegisterActivity / role-based main / pending-workers approve+reject flows. **Requires emulator.**      |

## Coverage gates

Each suite has an activated coverage threshold; CI fails when they drop:

| Workspace                      | Lines | Statements | Functions | Branches | Notes                                                  |
| ------------------------------ | ----- | ---------- | --------- | -------- | ------------------------------------------------------ |
| `packages/shared`              | 100   | 100        | 100       | 95       | Schemas/types/constants, no app surface.               |
| `packages/api/src/services/`   | 95    | —          | —         | 90       |                                                        |
| `packages/api/src/middleware/` | 95    | —          | —         | 90       |                                                        |
| `packages/api/src/routes/`     | 85    | —          | —         | 75       |                                                        |
| `packages/api/src/utils/`      | 90    | —          | —         | 80       |                                                        |
| `apps/dashboard`               | 70    | 70         | 70        | 70       | List pages still at 0% are tracked for a future sweep. |
| `apps/website`                 | 90    | 90         | 80        | 85       | ImpactCounter timer not exercised in jsdom.            |
| `apps/mobile`                  | —     | —          | —         | —        | JaCoCo not yet wired (future Phase 9.x).               |

## Recently fixed bugs

The 8 bugs originally pinned by the test suite were fixed 2026-05-09 in 8
surgical commits. Full details in [`TEST_PLAN.md > Bugs fixed`](./TEST_PLAN.md#bugs-fixed-with-commit-shas).

| Commit    | Bug                                                                              |
| --------- | -------------------------------------------------------------------------------- |
| `dad8c83` | `analytics.ts` `'PENDING'` → `'pending'` (pendingRequests was always 0)          |
| `911025f` | `error.ts` Prisma `P2002`/`P2025` → 409/404 (was 500)                            |
| `eefb22a` | `/auth/register/worker` wired through `validate()` (was 500 on bad input)        |
| `7ed9fd0` | `POST /collections` wired through `validate()` (was 500 on bad input)            |
| `23afb91` | `GET /users/:id` filters `deletedAt: null` (was leaking soft-deleted)            |
| `a5d3348` | mobile release `API_BASE_URL` reads from gradle property (was emulator loopback) |
| `67364d7` | `SettingsPage` form lifted into a child rendered after the user gate (was empty) |
| `add7573` | dashboard a11y: aria-labels for icon buttons + htmlFor for form inputs           |

All marker tests (`.failing` / `.fails` / inverted-assertion) flipped to natural
assertions in the same commit as their fix; companion tests deleted.

## Pre-commit hook

Husky + lint-staged are wired at the repo root. After `npm install`, the `prepare` script auto-installs the hook (`.husky/pre-commit` → `npx lint-staged`). Staged TS/TSX/JS/JSX/JSON/MD/YAML files are auto-formatted with prettier on commit. Eslint runs only in CI (per-workspace, where each app has the right plugin set).

## CI workflows

`.github/workflows/`:

- **`test.yml`** — runs on push & PR. Five parallel jobs (lint → shared → api → dashboard → website) with coverage uploaded as artifacts.
- **`e2e.yml`** — runs on push & PR. Boots all three dev servers via Playwright's `webServer`, runs 13 specs, uploads HTML report on every run + traces on failure.
- **`mobile.yml`** — runs only when `apps/mobile/**` changes. Sets up JDK 17, runs `testDebugUnitTest`, also compile-checks the Espresso sourceset.
- **`security.yml`** — runs on push, PR, and a weekly Monday schedule. `npm audit` (production deps only, high+critical), gitleaks secret scan over full history, plus the API security/contract/migration test subset.

## Adding new tests

1. **API**: drop a file under `packages/api/tests/{services,middleware,routes,cross-cutting,security}/`. Use `loginAs('admin'|'worker'|'resident')` from `tests/auth.ts` for authed sessions and the factories in `tests/factories.ts` for fixtures. `resetDb()` runs per test via `beforeEach`.
2. **Dashboard / website**: drop under `tests/{components,lib,pages,a11y}/`. Use the `LanguageProvider` + `AuthProvider` wrappers, set `localStorage.setItem('ekonaryn_token', 'AT')` to bypass the auth gate, and override per-test API responses with `server.use(http.get(...))`.
3. **E2E**: drop a `.spec.ts` under `e2e/`. Import `test, expect, URLS, SEED, apiLogin` from `e2e/setup/fixtures.ts`. Add `test.beforeAll(reseed)` if your spec mutates state.
4. **Mobile JVM**: drop under `apps/mobile/app/src/test/java/kg/ekonaryn/app/...` with `@RunWith(RobolectricTestRunner.class)` and `@Config(sdk = 33)`. Use reflection to override `private final` fields if you need to swap `BuildConfig.API_BASE_URL` for MockWebServer.
5. **Mobile Espresso**: drop under `apps/mobile/app/src/androidTest/...` with `@RunWith(AndroidJUnit4.class)`. Real-API specs require seeding via `npm run db:seed` and an emulator pointing at `10.0.2.2:4000`.

## When you find a bug

Don't silently fix it inside the test PR. Follow the pattern from existing bugs:

1. Add a `companion test` that asserts the **current** broken behavior so it's pinned.
2. Add a `.failing` (Jest) / `test.fails` (Vitest 2+) / `xtest` / inverted-assertion (JUnit 4) that asserts the **future** expected behavior.
3. Add a row to `TEST_PLAN.md > Bugs found by tests` with file:line + test names.
4. Open a separate PR for the fix.
