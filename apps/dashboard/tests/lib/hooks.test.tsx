import { describe, expect, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { AuthProvider } from '@/lib/auth';
import { useApi } from '@/lib/hooks';

const API = 'http://localhost:4000/api/v1';

beforeEach(() => {
  window.localStorage.clear();
});

interface Item {
  id: string;
  label: string;
}

function ListProbe({ path }: { path: string }) {
  const { data, loading, error } = useApi<Item[]>(path);
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="error">{error ?? 'none'}</span>
      <span data-testid="count">{data?.length ?? 0}</span>
    </div>
  );
}

function withAuth(token: string | null, ui: React.ReactNode) {
  if (token) window.localStorage.setItem('ekonaryn_token', token);
  // /auth/me must respond so AuthProvider settles before useApi runs.
  server.use(
    http.get(`${API}/auth/me`, () =>
      HttpResponse.json({
        success: true,
        data: {
          id: 'u-1',
          name: 'A',
          phone: '+996700000001',
          role: 'ADMIN',
          points: 0,
        },
      }),
    ),
  );
  return <AuthProvider>{ui}</AuthProvider>;
}

describe('useApi', () => {
  test('does not fire when there is no token', async () => {
    let hits = 0;
    server.use(
      http.get(`${API}/things`, () => {
        hits += 1;
        return HttpResponse.json({ success: true, data: [] });
      }),
    );

    render(
      <AuthProvider>
        <ListProbe path="/things" />
      </AuthProvider>,
    );
    // Give it a tick — the hook should still not call the endpoint.
    await new Promise((r) => setTimeout(r, 50));
    expect(hits).toBe(0);
  });

  test('attaches Bearer token and surfaces array data', async () => {
    let receivedHeader: string | null = null;
    server.use(
      http.get(`${API}/things`, ({ request }) => {
        receivedHeader = request.headers.get('Authorization');
        return HttpResponse.json({
          success: true,
          data: [
            { id: 'a', label: 'A' },
            { id: 'b', label: 'B' },
          ],
        });
      }),
    );

    render(withAuth('AT', <ListProbe path="/things" />));
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('2'));
    expect(receivedHeader).toBe('Bearer AT');
    expect(screen.getByTestId('error').textContent).toBe('none');
  });

  test('surfaces the API error envelope', async () => {
    server.use(
      http.get(`${API}/things`, () =>
        HttpResponse.json({ success: false, error: 'Boom' }, { status: 500 }),
      ),
    );

    render(withAuth('AT', <ListProbe path="/things" />));
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('error').textContent).toBe('Boom');
  });
});
