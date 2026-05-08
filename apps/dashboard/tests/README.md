# Dashboard Tests

Vitest + jsdom + React Testing Library + MSW.

## Run

```bash
# from repo root
npm test --workspace=@ekonaryn/dashboard
# watch mode
npm run test:watch --workspace=@ekonaryn/dashboard
# coverage
npm run test:coverage --workspace=@ekonaryn/dashboard
# single file
npm test --workspace=@ekonaryn/dashboard -- tests/components/StatusBadge.test.tsx
```

## Layout

```
tests/
├── setup.ts                   jest-dom matchers, MSW lifecycle, localStorage stub,
│                              next/navigation mocks
├── msw/
│   ├── server.ts              setupServer(...handlers)
│   └── handlers.ts            default API handlers (override per-test with server.use)
├── components/                unit tests for components/ui/* and DashboardLayout/Sidebar
├── lib/                       i18n, auth context, hooks
├── pages/                     page-level integration tests against MSW
└── *.test.tsx
```

## Conventions

- Always render through React Testing Library; never reach into the DOM directly
  unless RTL has no equivalent.
- Use `userEvent` over `fireEvent` for inputs.
- Pass-through fetch mocks live in `tests/msw/handlers.ts`. Override per test:
  ```ts
  server.use(
    http.get('http://localhost:4000/api/v1/users', () =>
      HttpResponse.json({ success: true, data: [] }),
    ),
  );
  ```
- The `@/` import alias is wired via `vitest.config.ts` to mirror `tsconfig.json`.
- `next/navigation` is mocked in `setup.ts`; tests can override locally.

## Coverage

Reports land at `coverage/`. Initial Phase 4 target is 70% lines.
