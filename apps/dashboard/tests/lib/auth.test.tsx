import { describe, expect, test } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { AuthProvider, useAuth } from '@/lib/auth';

const API = 'http://localhost:4000/api/v1';

function Probe() {
  const { user, token, login, logout, loading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user?.name ?? 'none'}</span>
      <span data-testid="token">{token ?? 'none'}</span>
      <button type="button" onClick={() => login('+996700000001', 'admin123')}>
        login
      </button>
      <button type="button" onClick={() => logout()}>
        logout
      </button>
    </div>
  );
}

const adminUser = {
  id: 'u-1',
  name: 'Test Admin',
  phone: '+996700000001',
  role: 'ADMIN',
  points: 0,
};

beforeEach(() => {
  // Hand-built MSW overrides per test below.
  // Reset cookie + storage just in case.
  window.localStorage.clear();
  document.cookie = 'ekonaryn_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
});

describe('AuthProvider — login', () => {
  test('login() persists the access token to localStorage and exposes the user', async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({
          success: true,
          data: { user: adminUser, accessToken: 'AT', refreshToken: 'RT' },
        }),
      ),
      http.get(`${API}/auth/me`, () => HttpResponse.json({ success: true, data: adminUser })),
    );

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'login' }));
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Test Admin'));
    expect(screen.getByTestId('token').textContent).toBe('AT');
    expect(window.localStorage.getItem('ekonaryn_token')).toBe('AT');
  });

  test('login as non-admin throws (dashboard is admin-only)', async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({
          success: true,
          data: {
            user: { ...adminUser, role: 'WORKER' },
            accessToken: 'AT',
            refreshToken: 'RT',
          },
        }),
      ),
    );

    function ThrowProbe() {
      const { login } = useAuth();
      return (
        <button
          type="button"
          onClick={async () => {
            try {
              await login('+996700000002', 'pass');
            } catch (e) {
              (window as unknown as { __err: string }).__err = (e as Error).message;
            }
          }}
        >
          go
        </button>
      );
    }
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <ThrowProbe />
      </AuthProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'go' }));
    await waitFor(() =>
      expect((window as unknown as { __err?: string }).__err).toMatch(/Admin only/i),
    );
  });
});

describe('AuthProvider — logout', () => {
  test('clears user, token, and localStorage', async () => {
    window.localStorage.setItem('ekonaryn_token', 'AT');
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({ success: true, data: adminUser })),
    );

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    // Initial /auth/me call hydrates the user.
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Test Admin'));
    await user.click(screen.getByRole('button', { name: 'logout' }));
    expect(screen.getByTestId('user').textContent).toBe('none');
    expect(screen.getByTestId('token').textContent).toBe('none');
    expect(window.localStorage.getItem('ekonaryn_token')).toBeNull();
  });
});

describe('AuthProvider — bootstrap', () => {
  test('on mount, hydrates from localStorage via /auth/me', async () => {
    window.localStorage.setItem('ekonaryn_token', 'AT');
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({ success: true, data: adminUser })),
    );
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Test Admin'));
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  test('a stale/invalid token in localStorage is cleared after a failed /auth/me', async () => {
    window.localStorage.setItem('ekonaryn_token', 'STALE');
    server.use(
      http.get(`${API}/auth/me`, () =>
        HttpResponse.json({ success: false, error: 'Invalid' }, { status: 401 }),
      ),
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(window.localStorage.getItem('ekonaryn_token')).toBeNull();
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  test('with no token, loading flips to false and stays unauthenticated', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('user').textContent).toBe('none');
  });
});
