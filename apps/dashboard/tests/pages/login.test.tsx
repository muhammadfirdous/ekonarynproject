import { describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import * as nextNav from 'next/navigation';
import { server } from '../msw/server';
import LoginPage from '@/app/login/page';
import { AuthProvider } from '@/lib/auth';
import { LanguageProvider } from '@/lib/i18n';

const API = 'http://localhost:4000/api/v1';

function renderLogin() {
  return render(
    <LanguageProvider initialLang="en">
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </LanguageProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  vi.mocked(nextNav.useRouter).mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  } as never);
});

describe('LoginPage', () => {
  test('happy login as admin → router.push("/")', async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({
          success: true,
          data: {
            user: {
              id: 'u-1',
              name: 'Test Admin',
              phone: '+996700000001',
              role: 'ADMIN',
              points: 0,
            },
            accessToken: 'AT',
            refreshToken: 'RT',
          },
        }),
      ),
    );
    const push = vi.fn();
    vi.mocked(nextNav.useRouter).mockReturnValue({
      push,
      replace: vi.fn(),
      back: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as never);

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText('+996700000001'), '+996700000001');
    await user.type(screen.getByPlaceholderText('••••••'), 'admin123');
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
  });

  test('non-admin login is rejected with the "Admin only" inline error', async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({
          success: true,
          data: {
            user: {
              id: 'u-1',
              name: 'Worker',
              phone: '+996700000002',
              role: 'WORKER',
              points: 0,
            },
            accessToken: 'AT',
            refreshToken: 'RT',
          },
        }),
      ),
    );
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText('+996700000001'), '+996700000002');
    await user.type(screen.getByPlaceholderText('••••••'), 'pass');
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    expect(await screen.findByText(/Admin only/i)).toBeInTheDocument();
  });

  test('wrong password surfaces the API error message inline', async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({ success: false, error: 'Invalid phone or password' }, { status: 401 }),
      ),
    );
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByPlaceholderText('+996700000001'), '+996700000001');
    await user.type(screen.getByPlaceholderText('••••••'), 'wrong');
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    expect(await screen.findByText(/Invalid phone or password/i)).toBeInTheDocument();
  });

  test('suspended worker is shown the API "account is suspended" message', async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json(
          {
            success: false,
            error: 'Your account is suspended: Customer complaint',
          },
          { status: 403 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByPlaceholderText('+996700000001'), '+996700000002');
    await user.type(screen.getByPlaceholderText('••••••'), 'whatever');
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    expect(
      await screen.findByText(/Your account is suspended.*Customer complaint/i),
    ).toBeInTheDocument();
  });
});
