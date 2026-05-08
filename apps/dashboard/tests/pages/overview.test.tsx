import { describe, expect, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import OverviewPage from '@/app/page';
import { AuthProvider } from '@/lib/auth';
import { LanguageProvider } from '@/lib/i18n';

const API = 'http://localhost:4000/api/v1';

const adminMe = {
  success: true,
  data: { id: 'a', name: 'Admin', phone: '+996700000001', role: 'ADMIN', points: 0 },
};

beforeEach(() => {
  window.localStorage.setItem('ekonaryn_token', 'AT');
});

function renderPage() {
  return render(
    <LanguageProvider initialLang="en">
      <AuthProvider>
        <OverviewPage />
      </AuthProvider>
    </LanguageProvider>,
  );
}

describe('OverviewPage', () => {
  test('renders stat cards from /analytics/overview', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json(adminMe)),
      http.get(`${API}/analytics/overview`, () =>
        HttpResponse.json({
          success: true,
          data: {
            totalCollections: 42,
            totalWeightKg: 123.4,
            totalRevenue: 5000,
            activeWorkers: 3,
            totalResidents: 10,
            pendingRequests: 2,
          },
        }),
      ),
      http.get(`${API}/requests`, () => HttpResponse.json({ success: true, data: [] })),
    );
    renderPage();

    expect(await screen.findByText('42')).toBeInTheDocument();
    expect(screen.getByText(/123\.4 kg/)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('renders empty state when /requests returns no rows', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json(adminMe)),
      http.get(`${API}/analytics/overview`, () =>
        HttpResponse.json({
          success: true,
          data: {
            totalCollections: 0,
            totalWeightKg: 0,
            totalRevenue: 0,
            activeWorkers: 0,
            totalResidents: 0,
            pendingRequests: 0,
          },
        }),
      ),
      http.get(`${API}/requests`, () => HttpResponse.json({ success: true, data: [] })),
    );
    renderPage();

    expect(await screen.findByText(/No requests/i)).toBeInTheDocument();
  });

  test('renders one row in "Latest Requests" when /requests returns one', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json(adminMe)),
      http.get(`${API}/analytics/overview`, () =>
        HttpResponse.json({
          success: true,
          data: {
            totalCollections: 0,
            totalWeightKg: 0,
            totalRevenue: 0,
            activeWorkers: 0,
            totalResidents: 0,
            pendingRequests: 0,
          },
        }),
      ),
      http.get(`${API}/requests`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              id: 'r-1',
              address: 'Center 5',
              status: 'pending',
              estimatedQty: 6,
              createdAt: '2026-05-08T08:00:00Z',
              resident: { name: 'Alice' },
              material: { name: 'PET', nameRu: 'ПЭТ' },
            },
          ],
        }),
      ),
    );
    renderPage();
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText(/PET/)).toBeInTheDocument();
  });
});
