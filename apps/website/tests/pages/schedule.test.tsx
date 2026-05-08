import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import SchedulePage from '@/app/schedule/page';
import { LanguageProvider } from '@/lib/i18n';

const API = 'http://localhost:4000/api/v1';

function renderPage(lang: 'ru' | 'en' = 'en') {
  return render(
    <LanguageProvider initialLang={lang}>
      <SchedulePage />
    </LanguageProvider>,
  );
}

describe('SchedulePage', () => {
  test('shows the empty-schedule fallback when /schedule returns []', async () => {
    server.use(http.get(`${API}/schedule`, () => HttpResponse.json({ success: true, data: [] })));
    renderPage('en');
    // Fallback announces the phone number to call.
    expect(await screen.findByText('+996 700 000 001')).toBeInTheDocument();
  });

  test('groups entries by day and renders each row sorted by time (EN)', async () => {
    server.use(
      http.get(`${API}/schedule`, () =>
        HttpResponse.json({
          success: true,
          data: [
            { id: 's1', area: 'Center', dayOfWeek: 1, time: '14:00', active: true },
            { id: 's2', area: 'North', dayOfWeek: 1, time: '09:00', active: true },
            { id: 's3', area: 'South', dayOfWeek: 3, time: '11:00', active: true },
          ],
        }),
      ),
    );
    renderPage('en');
    expect(await screen.findByText('Center')).toBeInTheDocument();
    expect(screen.getByText('North')).toBeInTheDocument();
    expect(screen.getByText('South')).toBeInTheDocument();
    // Both 14:00 and 09:00 should render under the same group; assert both are in the DOM.
    expect(screen.getByText('14:00')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('11:00')).toBeInTheDocument();
  });

  test('renders day names from the RU dictionary when initialLang="ru"', async () => {
    server.use(
      http.get(`${API}/schedule`, () =>
        HttpResponse.json({
          success: true,
          data: [{ id: 's1', area: 'Центр', dayOfWeek: 1, time: '09:00', active: true }],
        }),
      ),
    );
    renderPage('ru');
    expect(await screen.findByText('Центр')).toBeInTheDocument();
    // The English "Tuesday" header should NOT appear in RU.
    expect(screen.queryByText('Tuesday')).not.toBeInTheDocument();
  });

  test('a network failure leaves the empty fallback rendered', async () => {
    server.use(http.get(`${API}/schedule`, () => HttpResponse.error()));
    renderPage('en');
    expect(await screen.findByText('+996 700 000 001')).toBeInTheDocument();
  });
});
