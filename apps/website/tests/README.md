# Website Tests

Vitest + jsdom + React Testing Library + MSW. Same shape as the dashboard
tests — see `apps/dashboard/tests/README.md` for the full convention list.

## Run

```bash
npm test --workspace=@ekonaryn/website
npm run test:watch --workspace=@ekonaryn/website
npm run test:coverage --workspace=@ekonaryn/website
```

## Coverage

The website only consumes the public endpoints (`/materials`, `/schedule`,
`/auth/register`, `/auth/login`, `/requests`). MSW handlers in
`tests/msw/handlers.ts` cover those by default; override per test as needed.
Initial Phase 5 target is 70% lines.
