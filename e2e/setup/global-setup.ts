import { reseed } from './seed';

// Runs ONCE before all specs (Playwright `globalSetup`). We seed up-front so
// the first spec lands on a known dataset; subsequent specs that need a clean
// slate call `reseed()` from `beforeAll` themselves.
async function globalSetup(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('[e2e] seeding dev.db ...');
  reseed();
}

export default globalSetup;
