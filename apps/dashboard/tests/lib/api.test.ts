import { describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { api } from '@/lib/api';

const API = 'http://localhost:4000/api/v1';

describe('lib/api', () => {
  test('get sends Bearer token and returns the parsed envelope', async () => {
    let received: string | null = null;
    server.use(
      http.get(`${API}/x`, ({ request }) => {
        received = request.headers.get('Authorization');
        return HttpResponse.json({ success: true, data: 'hello' });
      }),
    );
    const res = await api.get<{ success: boolean; data: string }>('/x', 'AT');
    expect(received).toBe('Bearer AT');
    expect(res.data).toBe('hello');
  });

  test('post sends JSON body + Bearer; non-2xx throws Error("error")', async () => {
    server.use(
      http.post(`${API}/x`, async ({ request }) => {
        expect(request.headers.get('Authorization')).toBe('Bearer AT');
        const body = await request.json();
        expect(body).toEqual({ a: 1 });
        return HttpResponse.json({ success: false, error: 'No' }, { status: 400 });
      }),
    );
    await expect(api.post('/x', { a: 1 }, 'AT')).rejects.toThrow('No');
  });

  test('put / delete go through the same wrapper', async () => {
    server.use(
      http.put(`${API}/y`, () => HttpResponse.json({ success: true, data: 'put' })),
      http.delete(`${API}/y`, () => HttpResponse.json({ success: true, data: 'del' })),
    );
    expect(((await api.put('/y', {})) as { data: string }).data).toBe('put');
    expect(((await api.delete('/y')) as { data: string }).data).toBe('del');
  });

  test('non-2xx without an error string defaults to "Request failed"', async () => {
    server.use(http.get(`${API}/z`, () => HttpResponse.json({ success: false }, { status: 500 })));
    await expect(api.get('/z')).rejects.toThrow('Request failed');
  });
});
