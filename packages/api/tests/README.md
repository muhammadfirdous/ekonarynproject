# API Tests

Jest + ts-jest + Supertest. SQLite test DB lives at `packages/db/prisma/test.db`
and is wiped on every run by `globalSetup` and again by `teardown`.

## Run

```bash
# from repo root
npm test --workspace=@ekonaryn/api
# with coverage
npm test --workspace=@ekonaryn/api -- --coverage
# single file
npm test --workspace=@ekonaryn/api -- tests/workerLifecycle.test.ts
# match pattern
npm test --workspace=@ekonaryn/api -- -t "assigning"
```

## Layout

```
tests/
├── globalSetup.ts        wipes test.db, runs `prisma db push`
├── teardown.ts           removes test.db at the very end of the run
├── setupEnv.ts           sets DATABASE_URL + test JWT secrets per worker
├── factories.ts          builders for every entity (users by role, materials, …)
├── auth.ts               loginAs(role) → { user, accessToken, agent }
├── helpers.ts            legacy helpers — prefer factories.ts in new code
├── *.test.ts             one file per source area (route/middleware/service)
└── fixtures/             binary blobs (e.g. dummy ID images for multipart)
```

## Conventions

- One Jest worker (`maxWorkers: 1`) — SQLite locks the file under parallel writes.
- Each test seeds and cleans its own data; never rely on test order.
- Use `factories.*` for setup, `loginAs()` for authed Supertest agents.
- For time-sensitive code use `jest.useFakeTimers()`; never rely on real wall clock.
- New tests mirror the source path: `src/routes/foo.ts` → `tests/routes/foo.test.ts`.

## DB lifecycle

`packages/db/prisma/schema.prisma` reads `url = env("DATABASE_URL")`. The test
setup overrides `DATABASE_URL` to point at `test.db`, so the dev DB is never
touched. If a test stalls and you suspect a leaked DB handle, delete the file
manually: `rm packages/db/prisma/test.db*`.
