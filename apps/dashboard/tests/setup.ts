import '@testing-library/jest-dom/vitest';
import 'vitest-axe/extend-expect';
import * as axeMatchers from 'vitest-axe/matchers';
import { afterAll, afterEach, beforeAll, expect, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './msw/server';

// Register the vitest-axe matchers globally so individual a11y test files
// don't need to call expect.extend themselves.
expect.extend(axeMatchers);

// MSW lifecycle. Tests can register per-test handlers with server.use(...).
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

// jsdom doesn't ship a real localStorage in some environments; provide a stub
// keyed off an in-memory Map so each test starts clean.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: new MemoryStorage(),
  });
  Object.defineProperty(window, 'sessionStorage', {
    configurable: true,
    value: new MemoryStorage(),
  });
}

// jsdom does not ship ResizeObserver. recharts (and most modern UI libraries)
// reach for it on mount, so we provide a no-op stub.
if (typeof globalThis.ResizeObserver === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// matchMedia is similarly absent in jsdom; many components query it for theme
// or breakpoint state. Default to "no match" so nothing throws.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// next/navigation isn't running inside a Next runtime here. Each hook is a
// real vi.fn() so tests can call vi.mocked(usePathname).mockReturnValue('/x')
// from the test body to override the default per-test.
vi.mock('next/navigation', () => {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  };
  return {
    useRouter: vi.fn(() => router),
    usePathname: vi.fn(() => '/'),
    useSearchParams: vi.fn(() => new URLSearchParams()),
  };
});
