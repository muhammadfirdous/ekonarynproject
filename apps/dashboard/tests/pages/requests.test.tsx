import { describe, expect, test } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import RequestsPage from '@/app/requests/page';
import { AuthProvider } from '@/lib/auth';
import { LanguageProvider } from '@/lib/i18n';

const API = 'http://localhost:4000/api/v1';
const adminMe = {
  success: true,
  data: { id: 'a', name: 'Admin', phone: '+996700000001', role: 'ADMIN', points: 0 },
};

const requestRow = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'r-1',
  address: '12 Lenin Ave',
  estimatedQty: 5,
  status: 'pending',
  notes: null,
  createdAt: '2026-05-08T08:00:00Z',
  resident: { name: 'Alice', phone: '+996700000010' },
  material: { name: 'PET', nameRu: 'PET-Ru' },
  assignedWorker: null,
  ...over,
});

const workerRow = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'w-1',
  name: 'Worker One',
  phone: '+996700000020',
  accountStatus: 'ACTIVE',
  onShift: true,
  ...over,
});

beforeEach(() => {
  window.localStorage.setItem('ekonaryn_token', 'AT');
  server.use(
    http.get(`${API}/auth/me`, () => HttpResponse.json(adminMe)),
    http.get(`${API}/users`, () =>
      HttpResponse.json({ success: true, data: [workerRow()], total: 1 }),
    ),
  );
});

function renderPage() {
  return render(
    <LanguageProvider initialLang="en">
      <AuthProvider>
        <RequestsPage />
      </AuthProvider>
    </LanguageProvider>,
  );
}

describe('RequestsPage', () => {
  test('renders rows from /requests with the resident name and material', async () => {
    server.use(
      http.get(`${API}/requests`, () =>
        HttpResponse.json({
          success: true,
          data: [
            requestRow(),
            requestRow({ id: 'r-2', resident: { name: 'Bob', phone: '+996700000011' } }),
          ],
          total: 2,
        }),
      ),
    );
    renderPage();
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    // Material in EN renders the `name` field, not `nameRu`.
    expect(screen.getAllByText('PET').length).toBeGreaterThan(0);
  });

  test('clicking a status filter chip re-fires /requests with ?status=', async () => {
    let lastStatus: string | null = null;
    server.use(
      http.get(`${API}/requests`, ({ request }) => {
        lastStatus = new URL(request.url).searchParams.get('status');
        return HttpResponse.json({ success: true, data: [requestRow()], total: 1 });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Alice');
    expect(lastStatus).toBeNull();

    // Click the "Assigned" filter chip.
    await user.click(screen.getByRole('button', { name: 'Assigned' }));
    await waitFor(() => expect(lastStatus).toBe('assigned'));
  });

  test('Assign button reveals worker dropdown; choosing a worker POSTs /requests/:id/assign', async () => {
    let assignedWith: { id: string; body: unknown } | null = null;
    server.use(
      http.get(`${API}/requests`, () =>
        HttpResponse.json({ success: true, data: [requestRow()], total: 1 }),
      ),
      http.post(`${API}/requests/:id/assign`, async ({ params, request }) => {
        assignedWith = { id: params.id as string, body: await request.json() };
        return HttpResponse.json({ success: true, data: { id: params.id } });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Alice');

    await user.click(screen.getByRole('button', { name: 'Assign' }));

    // The dropdown should appear; pick the worker.
    const select = await screen.findByRole('combobox');
    await user.selectOptions(select, 'w-1');

    await waitFor(() => expect(assignedWith).not.toBeNull());
    expect(assignedWith).toEqual({ id: 'r-1', body: { workerId: 'w-1' } });
  });

  test('an in_progress request shows Complete + Cancel + Mark failed actions', async () => {
    server.use(
      http.get(`${API}/requests`, () =>
        HttpResponse.json({
          success: true,
          data: [requestRow({ status: 'in_progress' })],
          total: 1,
        }),
      ),
    );
    renderPage();
    await screen.findByText('Alice');
    const table = screen.getByRole('table');
    expect(within(table).getByRole('button', { name: 'Complete' })).toBeInTheDocument();
    expect(within(table).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(within(table).getByRole('button', { name: 'Mark failed' })).toBeInTheDocument();
    // Assign should NOT be available once in progress.
    expect(within(table).queryByRole('button', { name: 'Assign' })).not.toBeInTheDocument();
  });
});
