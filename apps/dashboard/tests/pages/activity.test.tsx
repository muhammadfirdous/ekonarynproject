import { describe, expect, test } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import ActivityPage from '@/app/activity/page';
import { AuthProvider } from '@/lib/auth';
import { LanguageProvider } from '@/lib/i18n';

const API = 'http://localhost:4000/api/v1';
const adminMe = {
  success: true,
  data: { id: 'a', name: 'Admin', phone: '+996700000001', role: 'ADMIN', points: 0 },
};

const mockRows = (action: string) => [
  {
    id: 'log-1',
    actorId: 'a',
    actorRole: 'ADMIN',
    action,
    entityType: 'pickup_request',
    entityId: 'r-1',
    metadata: JSON.stringify({ reason: 'test' }),
    ipAddress: '127.0.0.1',
    userAgent: 'jest',
    createdAt: '2026-05-08T08:00:00Z',
  },
];

beforeEach(() => {
  window.localStorage.setItem('ekonaryn_token', 'AT');
  server.use(http.get(`${API}/auth/me`, () => HttpResponse.json(adminMe)));
});

function renderPage() {
  return render(
    <LanguageProvider initialLang="en">
      <AuthProvider>
        <ActivityPage />
      </AuthProvider>
    </LanguageProvider>,
  );
}

// 'order.assigned'/'auth.login' appear as both chip-button labels AND row cells.
// Always scope the row assertions to the <table> so we don't get multiple-match errors.
async function findRowCell(text: string) {
  const table = await screen.findByRole('table');
  return await within(table).findByRole('cell', { name: text });
}

describe('ActivityPage', () => {
  test('lists rows from /activity', async () => {
    server.use(
      http.get(`${API}/activity`, () =>
        HttpResponse.json({ success: true, data: mockRows('order.assigned'), total: 1 }),
      ),
    );
    renderPage();
    expect(await findRowCell('order.assigned')).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getByText('pickup_request')).toBeInTheDocument();
    expect(within(table).getByText('ADMIN')).toBeInTheDocument();
  });

  test('clicking an action chip filters the request', async () => {
    let receivedAction: string | null = null;
    server.use(
      http.get(`${API}/activity`, ({ request }) => {
        const url = new URL(request.url);
        receivedAction = url.searchParams.get('action');
        return HttpResponse.json({
          success: true,
          data: mockRows(receivedAction ?? 'auth.login'),
          total: 1,
        });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    // First load: no filter → row labelled 'auth.login'.
    await findRowCell('auth.login');
    expect(receivedAction).toBeNull();

    // Click the chip whose accessible name is 'auth.login'.
    await user.click(screen.getByRole('button', { name: 'auth.login' }));

    // Second load: action=auth.login should appear in the request URL.
    await waitFor(() => expect(receivedAction).toBe('auth.login'));
    expect(await findRowCell('auth.login')).toBeInTheDocument();
  });

  test('renders the empty state when API returns []', async () => {
    server.use(
      http.get(`${API}/activity`, () => HttpResponse.json({ success: true, data: [], total: 0 })),
    );
    renderPage();
    expect(await screen.findByText(/No entries|нет записей/i)).toBeInTheDocument();
  });
});
