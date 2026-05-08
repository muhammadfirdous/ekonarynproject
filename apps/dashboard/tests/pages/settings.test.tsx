import { describe, expect, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import SettingsPage from '@/app/settings/page';
import { AuthProvider } from '@/lib/auth';
import { LanguageProvider } from '@/lib/i18n';

const API = 'http://localhost:4000/api/v1';
const adminMe = {
  success: true,
  data: { id: 'a', name: 'Admin User', phone: '+996700000001', role: 'ADMIN', points: 0 },
};

beforeEach(() => {
  window.localStorage.setItem('ekonaryn_token', 'AT');
  server.use(http.get(`${API}/auth/me`, () => HttpResponse.json(adminMe)));
});

function renderPage() {
  return render(
    <LanguageProvider initialLang="en">
      <AuthProvider>
        <SettingsPage />
      </AuthProvider>
    </LanguageProvider>,
  );
}

describe('SettingsPage', () => {
  test('form seeds with the current user name and phone once /auth/me resolves', async () => {
    renderPage();
    expect(await screen.findByDisplayValue('Admin User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+996700000001')).toBeInTheDocument();
  });

  test('submitting PUTs /users/:id with the edited values and shows the saved confirmation', async () => {
    let body: unknown = null;
    let url: string | null = null;
    server.use(
      http.put(`${API}/users/:id`, async ({ params, request }) => {
        url = `/users/${params.id as string}`;
        body = await request.json();
        return HttpResponse.json({ success: true, data: { id: params.id } });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    const name = await screen.findByDisplayValue('Admin User');
    const phone = screen.getByDisplayValue('+996700000001');
    await user.clear(name);
    await user.type(name, 'New Name');
    await user.clear(phone);
    await user.type(phone, '+996700000099');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(url).toBe('/users/a');
    expect(body).toEqual({ name: 'New Name', phone: '+996700000099' });
    expect(await screen.findByText('Settings saved')).toBeInTheDocument();
  });

  test('a 4xx error from /users/:id is surfaced inline', async () => {
    server.use(
      http.put(`${API}/users/:id`, () =>
        HttpResponse.json({ success: false, error: 'Phone already in use' }, { status: 400 }),
      ),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByDisplayValue('Admin User');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByText('Phone already in use')).toBeInTheDocument();
  });

  test('renders the system info panel with version, api URL, and role', async () => {
    renderPage();
    expect(await screen.findByText('1.0.0')).toBeInTheDocument();
    expect(screen.getByText('http://localhost:4000/api/v1')).toBeInTheDocument();
    // 'Administrator' also appears in the sidebar profile chip — assert >= 1.
    expect(screen.getAllByText('Administrator').length).toBeGreaterThan(0);
  });
});
