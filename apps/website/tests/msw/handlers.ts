import { http, HttpResponse } from 'msw';

const API = 'http://localhost:4000/api/v1';

// Public-website default handlers. The website only talks to /materials,
// /schedule, /auth/register, /auth/login, /requests.
export const handlers = [
  http.get(`${API}/materials`, () => HttpResponse.json({ success: true, data: [] })),
  http.get(`${API}/schedule`, () => HttpResponse.json({ success: true, data: [] })),
];
