import { describe, expect, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import ResidentsPage from '@/app/residents/page';
import WorkersPage from '@/app/workers/page';
import { AuthProvider } from '@/lib/auth';
import { LanguageProvider } from '@/lib/i18n';

const API = 'http://localhost:4000/api/v1';
const adminMe = {
  success: true,
  data: { id: 'a', name: 'Admin', phone: '+996700000001', role: 'ADMIN', points: 0 },
};

beforeEach(() => {
  window.localStorage.setItem('ekonaryn_token', 'AT');
  server.use(http.get(`${API}/auth/me`, () => HttpResponse.json(adminMe)));
});

function withProviders(node: React.ReactNode) {
  return (
    <LanguageProvider initialLang="en">
      <AuthProvider>{node}</AuthProvider>
    </LanguageProvider>
  );
}

describe('ResidentsPage', () => {
  test('renders rows from /users?role=RESIDENT', async () => {
    server.use(
      http.get(`${API}/users`, ({ request }) => {
        const role = new URL(request.url).searchParams.get('role');
        return HttpResponse.json({
          success: true,
          data:
            role === 'RESIDENT'
              ? [
                  {
                    id: 'u1',
                    name: 'Alice',
                    phone: '+996700000010',
                    address: '12 Lenin',
                    points: 42,
                    createdAt: '2026-05-01T00:00:00Z',
                  },
                ]
              : [],
          total: role === 'RESIDENT' ? 1 : 0,
        });
      }),
    );
    render(withProviders(<ResidentsPage />));
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('+996700000010')).toBeInTheDocument();
    expect(screen.getByText('12 Lenin')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  test('renders the address dash when address is null', async () => {
    server.use(
      http.get(`${API}/users`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              id: 'u1',
              name: 'Bob',
              phone: '+996700000011',
              address: null,
              points: 0,
              createdAt: '2026-05-01T00:00:00Z',
            },
          ],
          total: 1,
        }),
      ),
    );
    render(withProviders(<ResidentsPage />));
    await screen.findByText('Bob');
    // The dash cell rendering for null address.
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});

describe('WorkersPage', () => {
  const worker = (over: Partial<Record<string, unknown>> = {}) => ({
    id: 'w1',
    name: 'Worker One',
    phone: '+996700000020',
    address: '5 Naryn St',
    accountStatus: 'ACTIVE',
    onShift: true,
    points: 0,
    createdAt: '2026-05-01T00:00:00Z',
    ...over,
  });

  test('renders the table and the pending-approvals link', async () => {
    server.use(
      http.get(`${API}/users`, () =>
        HttpResponse.json({ success: true, data: [worker()], total: 1 }),
      ),
    );
    render(withProviders(<WorkersPage />));
    expect(await screen.findByText('Worker One')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Pending approvals|→/ })).toBeInTheDocument();
  });

  test('Suspend prompts for a reason and POSTs to /users/:id/suspend', async () => {
    let body: unknown = null;
    let calledId: string | null = null;
    server.use(
      http.get(`${API}/users`, () =>
        HttpResponse.json({ success: true, data: [worker()], total: 1 }),
      ),
      http.post(`${API}/users/:id/suspend`, async ({ params, request }) => {
        calledId = params.id as string;
        body = await request.json();
        return HttpResponse.json({ success: true, data: { id: params.id } });
      }),
    );
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Multiple no-shows');
    const user = userEvent.setup();
    render(withProviders(<WorkersPage />));
    await screen.findByText('Worker One');
    await user.click(screen.getByRole('button', { name: /suspend/i }));
    await waitFor(() => expect(calledId).toBe('w1'));
    expect(body).toEqual({ reason: 'Multiple no-shows' });
    promptSpy.mockRestore();
  });

  test('Suspend with cancelled prompt does NOT call the API', async () => {
    let called = false;
    server.use(
      http.get(`${API}/users`, () =>
        HttpResponse.json({ success: true, data: [worker()], total: 1 }),
      ),
      http.post(`${API}/users/:id/suspend`, () => {
        called = true;
        return HttpResponse.json({ success: true, data: {} });
      }),
    );
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null);
    const user = userEvent.setup();
    render(withProviders(<WorkersPage />));
    await screen.findByText('Worker One');
    await user.click(screen.getByRole('button', { name: /suspend/i }));
    // Give the no-op a tick to confirm nothing posts.
    await new Promise((r) => setTimeout(r, 50));
    expect(called).toBe(false);
    promptSpy.mockRestore();
  });

  test('SUSPENDED workers expose Reactivate; that POSTs /users/:id/reactivate with empty body', async () => {
    let body: unknown = 'unset';
    server.use(
      http.get(`${API}/users`, () =>
        HttpResponse.json({
          success: true,
          data: [worker({ id: 'w2', accountStatus: 'SUSPENDED' })],
          total: 1,
        }),
      ),
      http.post(`${API}/users/:id/reactivate`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true, data: {} });
      }),
    );
    const user = userEvent.setup();
    render(withProviders(<WorkersPage />));
    await screen.findByText('Worker One');
    await user.click(screen.getByRole('button', { name: /reactivate/i }));
    await waitFor(() => expect(body).toEqual({}));
  });

  test('PENDING_APPROVAL workers show only a dash in the actions column (no buttons)', async () => {
    server.use(
      http.get(`${API}/users`, () =>
        HttpResponse.json({
          success: true,
          data: [worker({ id: 'w3', accountStatus: 'PENDING_APPROVAL' })],
          total: 1,
        }),
      ),
    );
    render(withProviders(<WorkersPage />));
    await screen.findByText('Worker One');
    // No action buttons should render for pending workers.
    expect(screen.queryByRole('button', { name: /suspend/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reactivate/i })).not.toBeInTheDocument();
  });
});
