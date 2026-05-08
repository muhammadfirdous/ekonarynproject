import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { AuthProvider } from '@/lib/auth';
import { LanguageProvider } from '@/lib/i18n';
import LoginPage from '@/app/login/page';
import OverviewPage from '@/app/page';
import RequestsPage from '@/app/requests/page';
import ActivityPage from '@/app/activity/page';
import SettingsPage from '@/app/settings/page';

const API = 'http://localhost:4000/api/v1';
const adminMe = {
  success: true,
  data: { id: 'a', name: 'Admin', phone: '+996700000001', role: 'ADMIN', points: 0 },
};

beforeEach(() => {
  // Most pages live behind /auth/me — seed the token so DashboardLayout renders children.
  window.localStorage.setItem('ekonaryn_token', 'AT');
  server.use(
    http.get(`${API}/auth/me`, () => HttpResponse.json(adminMe)),
    // Default empty payloads for every list endpoint touched by the audited pages.
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
          topMaterials: [],
          weeklyData: [],
        },
      }),
    ),
    http.get(`${API}/requests`, () => HttpResponse.json({ success: true, data: [], total: 0 })),
    http.get(`${API}/users`, () => HttpResponse.json({ success: true, data: [], total: 0 })),
    http.get(`${API}/activity`, () => HttpResponse.json({ success: true, data: [], total: 0 })),
    http.get(`${API}/materials`, () => HttpResponse.json({ success: true, data: [], total: 0 })),
  );
});

function withProviders(node: React.ReactNode) {
  return (
    <LanguageProvider initialLang="en">
      <AuthProvider>{node}</AuthProvider>
    </LanguageProvider>
  );
}

// vitest-axe runs the @axe-core engine against the rendered DOM. We disable a
// pair of color-contrast/region rules that misfire under jsdom (no layout, no
// computed styles), and focus on rules that actually catch real bugs:
// missing labels, illegal nesting, duplicate ids, etc.
const axeOptions = {
  rules: {
    'color-contrast': { enabled: false }, // jsdom has no layout engine
    region: { enabled: false }, // every test renders a fragment, not a full <html>
  },
};

describe('a11y: dashboard pages have no axe violations', () => {
  test('LoginPage', async () => {
    const { container } = render(withProviders(<LoginPage />));
    const result = await axe(container, axeOptions);
    expect(result).toHaveNoViolations();
  });

  test('OverviewPage (admin)', async () => {
    const { container } = render(withProviders(<OverviewPage />));
    await screen.findAllByRole('button');
    const result = await axe(container, axeOptions);
    expect(result).toHaveNoViolations();
  });

  test('RequestsPage (admin)', async () => {
    const { container } = render(withProviders(<RequestsPage />));
    await screen.findAllByRole('button');
    const result = await axe(container, axeOptions);
    expect(result).toHaveNoViolations();
  });

  test('ActivityPage (admin)', async () => {
    const { container } = render(withProviders(<ActivityPage />));
    await screen.findByRole('button', { name: 'auth.login' });
    const result = await axe(container, axeOptions);
    expect(result).toHaveNoViolations();
  });

  test('SettingsPage (admin)', async () => {
    const { container } = render(withProviders(<SettingsPage />));
    await screen.findByRole('button', { name: /save/i });
    const result = await axe(container, axeOptions);
    expect(result).toHaveNoViolations();
  });
});
