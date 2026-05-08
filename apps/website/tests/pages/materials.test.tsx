import { describe, expect, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import MaterialsPage from '@/app/materials/page';
import { LanguageProvider } from '@/lib/i18n';

const API = 'http://localhost:4000/api/v1';

function renderPage(lang: 'ru' | 'en' = 'en') {
  return render(
    <LanguageProvider initialLang={lang}>
      <MaterialsPage />
    </LanguageProvider>,
  );
}

describe('MaterialsPage', () => {
  test('renders the empty-prices placeholder when /materials returns []', async () => {
    server.use(http.get(`${API}/materials`, () => HttpResponse.json({ success: true, data: [] })));
    renderPage('en');
    expect(await screen.findByText(/Prices are loading from the server/i)).toBeInTheDocument();
  });

  test('renders one card per material from /materials in EN', async () => {
    server.use(
      http.get(`${API}/materials`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              id: 'm1',
              name: 'PET Plastic',
              nameKy: 'PET Пластик',
              nameRu: 'Пластик ПЭТ',
              buyingPrice: 5,
              sellingPrice: 10,
              unit: 'kg',
              description: 'Clean PET bottles only',
            },
            {
              id: 'm2',
              // Use a name that doesn't collide with the static "What we accept"
              // list (which already hard-codes "Cardboard", "Glass", etc.).
              name: 'Foamboard',
              nameKy: 'Foamboard-Ky',
              nameRu: 'Foamboard-Ru',
              buyingPrice: 3,
              sellingPrice: 6,
              unit: 'kg',
              description: null,
            },
          ],
        }),
      ),
    );
    renderPage('en');
    expect(await screen.findByText('PET Plastic')).toBeInTheDocument();
    expect(screen.getByText('Foamboard')).toBeInTheDocument();
    // Each price renders as the buyingPrice number; both should appear at least once.
    expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Clean PET bottles only')).toBeInTheDocument();
  });

  test('renders the localized name (nameRu) when language is RU', async () => {
    server.use(
      http.get(`${API}/materials`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              id: 'm1',
              name: 'PET Plastic',
              nameKy: 'PET Пластик',
              nameRu: 'Пластик ПЭТ',
              buyingPrice: 5,
              sellingPrice: 10,
              unit: 'kg',
              description: null,
            },
          ],
        }),
      ),
    );
    renderPage('ru');
    expect(await screen.findByText('Пластик ПЭТ')).toBeInTheDocument();
  });

  test('a network failure leaves the empty placeholder rendered (catch swallows)', async () => {
    server.use(http.get(`${API}/materials`, () => HttpResponse.error()));
    renderPage('en');
    expect(await screen.findByText(/Prices are loading from the server/i)).toBeInTheDocument();
  });

  test('renders accept/reject items from the static list (EN)', async () => {
    server.use(http.get(`${API}/materials`, () => HttpResponse.json({ success: true, data: [] })));
    renderPage('en');
    expect(await screen.findByText('What we accept')).toBeInTheDocument();
    expect(screen.getByText('PET bottles')).toBeInTheDocument();
    expect(screen.getByText('Glass')).toBeInTheDocument();
    // No raw i18n keys should leak through.
    expect(screen.queryByText(/^materials\./)).not.toBeInTheDocument();
  });
});
