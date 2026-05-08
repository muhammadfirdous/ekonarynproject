import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// MSW server for Vitest. Per-test overrides go through `server.use(...)` from
// inside the test body — this base set is just enough to keep components happy
// when they fetch on mount.
export const server = setupServer(...handlers);
