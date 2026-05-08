import { describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useRouter } from 'next/navigation';
import { server } from '../msw/server';
import NewCollectionPage from '@/app/collections/new/page';
import { AuthProvider } from '@/lib/auth';
import { LanguageProvider } from '@/lib/i18n';

const API = 'http://localhost:4000/api/v1';
const adminMe = {
  success: true,
  data: { id: 'a', name: 'Admin', phone: '+996700000001', role: 'ADMIN', points: 0 },
};

beforeEach(() => {
  window.localStorage.setItem('ekonaryn_token', 'AT');
  server.use(
    http.get(`${API}/auth/me`, () => HttpResponse.json(adminMe)),
    http.get(`${API}/requests`, () =>
      HttpResponse.json({
        success: true,
        data: [
          {
            id: 'req-1',
            address: '12 Lenin Ave',
            estimatedQty: 4,
            resident: { name: 'Alice' },
            material: { name: 'PET', nameRu: 'PET-Ru' },
          },
        ],
        total: 1,
      }),
    ),
    http.get(`${API}/materials`, () =>
      HttpResponse.json({
        success: true,
        data: [
          { id: 'mat-1', name: 'PET', nameRu: 'PET-Ru' },
          { id: 'mat-2', name: 'Glass', nameRu: 'Стекло' },
        ],
        total: 2,
      }),
    ),
  );
});

function renderPage() {
  return render(
    <LanguageProvider initialLang="en">
      <AuthProvider>
        <NewCollectionPage />
      </AuthProvider>
    </LanguageProvider>,
  );
}

describe('NewCollectionPage', () => {
  test('lists assigned requests and materials in the dropdowns', async () => {
    renderPage();
    expect(
      await screen.findByRole('option', { name: /Alice — PET \(4 kg\)/i }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'PET' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Glass' })).toBeInTheDocument();
  });

  test('submitting POSTs /collections with the parsed weight and routes back', async () => {
    let body: unknown = null;
    server.use(
      http.post(`${API}/collections`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true, data: { id: 'c-1' } }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole('option', { name: /Alice — PET/i });
    await user.selectOptions(screen.getAllByRole('combobox')[0]!, 'req-1');
    // The request → material auto-fill keys off material.nameRu match; assert it filled.
    await waitFor(() =>
      expect((screen.getAllByRole('combobox')[1] as HTMLSelectElement).value).toBe('mat-1'),
    );
    await user.type(screen.getByRole('spinbutton'), '7.5');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(body).toEqual({
      requestId: 'req-1',
      materialId: 'mat-1',
      actualWeightKg: 7.5,
    });
    const router = vi.mocked(useRouter)();
    expect(router.push).toHaveBeenCalledWith('/collections');
  });

  test('a 4xx error from /collections is surfaced inline', async () => {
    server.use(
      http.post(`${API}/collections`, () =>
        HttpResponse.json({ success: false, error: 'Weight must be positive' }, { status: 400 }),
      ),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('option', { name: /Alice — PET/i });
    await user.selectOptions(screen.getAllByRole('combobox')[0]!, 'req-1');
    await user.type(screen.getByRole('spinbutton'), '1');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByText('Weight must be positive')).toBeInTheDocument();
  });
});
