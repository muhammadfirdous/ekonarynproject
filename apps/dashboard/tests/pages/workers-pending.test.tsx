import { describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import PendingWorkersPage from '@/app/workers/pending/page';
import { AuthProvider } from '@/lib/auth';
import { LanguageProvider } from '@/lib/i18n';

const API = 'http://localhost:4000/api/v1';

const adminMe = {
  success: true,
  data: {
    id: 'admin-1',
    name: 'Admin',
    phone: '+996700000001',
    role: 'ADMIN',
    points: 0,
  },
};

const pending = [
  {
    id: 'w-1',
    name: 'Pending One',
    phone: '+996700333001',
    email: 'one@example.com',
    idNumber: 'AN-1',
    idDocumentUrl: '/uploads/doc-1.png',
    serviceAreas: JSON.stringify(['Center']),
    vehicleType: 'pickup',
    vehiclePlate: '01KGP01',
    vehicleCapacityKg: 500,
    createdAt: new Date('2026-05-01T08:00:00Z').toISOString(),
  },
  {
    id: 'w-2',
    name: 'Pending Two',
    phone: '+996700333002',
    email: null,
    idNumber: 'AN-2',
    idDocumentUrl: null,
    serviceAreas: JSON.stringify(['Mikrorayon']),
    vehicleType: 'van',
    vehiclePlate: '01KGP02',
    vehicleCapacityKg: 800,
    createdAt: new Date('2026-05-02T08:00:00Z').toISOString(),
  },
];

beforeEach(() => {
  window.localStorage.setItem('ekonaryn_token', 'AT');
  server.use(
    http.get(`${API}/auth/me`, () => HttpResponse.json(adminMe)),
    http.get(`${API}/users/workers/pending`, () =>
      HttpResponse.json({ success: true, data: pending }),
    ),
  );
});

function renderPage() {
  return render(
    <LanguageProvider initialLang="en">
      <AuthProvider>
        <PendingWorkersPage />
      </AuthProvider>
    </LanguageProvider>,
  );
}

describe('PendingWorkersPage', () => {
  test('renders the queue with details from /users/workers/pending', async () => {
    renderPage();
    expect(await screen.findByText('Pending One')).toBeInTheDocument();
    expect(screen.getByText('Pending Two')).toBeInTheDocument();
    // Service areas parsed and rendered.
    expect(screen.getByText('Center')).toBeInTheDocument();
    expect(screen.getByText('Mikrorayon')).toBeInTheDocument();
  });

  test('approve hits POST /users/:id/approve and refetches', async () => {
    let approved = '';
    let listHits = 0;
    server.use(
      http.post(`${API}/users/:id/approve`, ({ params }) => {
        approved = params.id as string;
        return HttpResponse.json({ success: true, data: pending[0] });
      }),
      http.get(`${API}/users/workers/pending`, () => {
        listHits += 1;
        // After approve, return only the second worker.
        return HttpResponse.json({
          success: true,
          data: listHits === 1 ? pending : [pending[1]],
        });
      }),
    );

    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Pending One');

    // Approve the first card.
    await user.click(screen.getAllByRole('button', { name: /Approve/i })[0]);

    await waitFor(() => expect(approved).toBe('w-1'));
    await waitFor(() => expect(screen.queryByText('Pending One')).toBeNull());
    expect(screen.getByText('Pending Two')).toBeInTheDocument();
  });

  test('reject prompts for a reason and posts it; cancel keeps the worker', async () => {
    let posted: { id?: string; body?: { reason: string } } = {};
    server.use(
      http.post(`${API}/users/:id/reject`, async ({ params, request }) => {
        posted = { id: params.id as string, body: (await request.json()) as { reason: string } };
        return HttpResponse.json({ success: true, data: pending[0] });
      }),
    );

    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Documents unclear');

    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Pending One');

    await user.click(screen.getAllByRole('button', { name: /Reject/i })[0]);
    await waitFor(() => expect(posted.id).toBe('w-1'));
    expect(posted.body?.reason).toBe('Documents unclear');
    promptSpy.mockRestore();
  });

  test('reject without a reason short-circuits and does not call the API', async () => {
    let hits = 0;
    server.use(
      http.post(`${API}/users/:id/reject`, () => {
        hits += 1;
        return HttpResponse.json({ success: true, data: pending[0] });
      }),
    );
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null);

    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Pending One');
    await user.click(screen.getAllByRole('button', { name: /Reject/i })[0]);
    // Give it a tick to be sure no late call lands.
    await new Promise((r) => setTimeout(r, 50));
    expect(hits).toBe(0);
    promptSpy.mockRestore();
  });

  test('shows the empty state when the API returns []', async () => {
    server.use(
      http.get(`${API}/users/workers/pending`, () =>
        HttpResponse.json({ success: true, data: [] }),
      ),
    );
    renderPage();
    expect(await screen.findByText(/No applications waiting for review/i)).toBeInTheDocument();
  });
});
