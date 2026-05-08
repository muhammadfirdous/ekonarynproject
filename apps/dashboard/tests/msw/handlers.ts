import { http, HttpResponse } from 'msw';

const API = 'http://localhost:4000/api/v1';

// Default handlers — keep these minimal and predictable. Tests that need
// specific data should override with server.use(http.METHOD(...)).
export const handlers = [
  http.get(`${API}/auth/me`, () =>
    HttpResponse.json({
      success: true,
      data: {
        id: 'user-1',
        name: 'Test Admin',
        phone: '+996700000001',
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
        points: 0,
      },
    }),
  ),
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
];
