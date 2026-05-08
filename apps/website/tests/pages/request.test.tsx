import { describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import RequestPage from '@/app/request/page';
import { LanguageProvider } from '@/lib/i18n';

const API = 'http://localhost:4000/api/v1';

function renderPage(lang: 'ru' | 'en' = 'en') {
  return render(
    <LanguageProvider initialLang={lang}>
      <RequestPage />
    </LanguageProvider>,
  );
}

const material = {
  id: 'mat-1',
  name: 'PET',
  nameRu: 'ПЭТ',
  buyingPrice: 5,
  unit: 'kg',
};

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  // Wait for the materials dropdown to populate.
  await screen.findByRole('option', { name: /PET \(5/ });

  const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
  // [name, phone(starts +996), address, notes(textarea)]
  await user.type(inputs[0]!, 'Alice');
  // The phone input pre-fills with '+996'. Append the rest.
  await user.type(inputs[1]!, '700123456');
  // password is type=password — not in textbox role.
  const password = document.querySelector('input[type="password"]') as HTMLInputElement;
  await user.type(password, 'hunter22');
  await user.selectOptions(screen.getByRole('combobox'), 'mat-1');
  // address input (third textbox)
  await user.type(inputs[2]!, '12 Lenin St');
  // weight (number input)
  const weight = screen.getByRole('spinbutton') as HTMLInputElement;
  await user.type(weight, '5');
}

describe('RequestPage — submit fork', () => {
  test('happy register flow: POST /auth/register OK → uses returned token to POST /requests', async () => {
    let registerBody: any = null;
    let requestAuthHeader: string | null = null;
    let requestBody: any = null;

    server.use(
      http.get(`${API}/materials`, () => HttpResponse.json({ success: true, data: [material] })),
      http.post(`${API}/auth/register`, async ({ request }) => {
        registerBody = await request.json();
        return HttpResponse.json(
          { success: true, data: { user: { id: 'u1' }, accessToken: 'TOK-NEW' } },
          { status: 201 },
        );
      }),
      http.post(`${API}/requests`, async ({ request }) => {
        requestAuthHeader = request.headers.get('Authorization');
        requestBody = await request.json();
        return HttpResponse.json({ success: true, data: { id: 'r-1' } }, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderPage('en');
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Submit Request' }));

    expect(await screen.findByText('Request received!')).toBeInTheDocument();
    expect(registerBody).toMatchObject({
      name: 'Alice',
      phone: '+996700123456',
      password: 'hunter22',
      address: '12 Lenin St',
    });
    expect(requestAuthHeader).toBe('Bearer TOK-NEW');
    expect(requestBody).toEqual({
      materialId: 'mat-1',
      address: '12 Lenin St',
      estimatedQty: 5,
      notes: undefined, // optional empty
    });
  });

  test('register-then-login fork: register fails → falls back to /auth/login → POST /requests', async () => {
    let loginCalled = false;
    let requestAuthHeader: string | null = null;

    server.use(
      http.get(`${API}/materials`, () => HttpResponse.json({ success: true, data: [material] })),
      http.post(`${API}/auth/register`, () =>
        // 409 = phone already exists; the page falls back to /auth/login.
        HttpResponse.json({ success: false, error: 'Phone exists' }, { status: 409 }),
      ),
      http.post(`${API}/auth/login`, async () => {
        loginCalled = true;
        return HttpResponse.json({
          success: true,
          data: { user: { id: 'u1' }, accessToken: 'TOK-EXISTING' },
        });
      }),
      http.post(`${API}/requests`, ({ request }) => {
        requestAuthHeader = request.headers.get('Authorization');
        return HttpResponse.json({ success: true, data: { id: 'r-2' } }, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderPage('en');
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Submit Request' }));

    await waitFor(() => expect(loginCalled).toBe(true));
    expect(await screen.findByText('Request received!')).toBeInTheDocument();
    expect(requestAuthHeader).toBe('Bearer TOK-EXISTING');
  });

  test('register fails AND login fails → renders the request.errorLogin message inline', async () => {
    server.use(
      http.get(`${API}/materials`, () => HttpResponse.json({ success: true, data: [material] })),
      http.post(`${API}/auth/register`, () =>
        HttpResponse.json({ success: false, error: 'Phone exists' }, { status: 409 }),
      ),
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({ success: false, error: 'Bad password' }, { status: 401 }),
      ),
    );
    const user = userEvent.setup();
    renderPage('en');
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Submit Request' }));

    expect(
      await screen.findByText('Could not sign in. Check your phone and password.'),
    ).toBeInTheDocument();
  });

  test('POST /requests fails → surfaces the API error message', async () => {
    server.use(
      http.get(`${API}/materials`, () => HttpResponse.json({ success: true, data: [material] })),
      http.post(`${API}/auth/register`, () =>
        HttpResponse.json(
          { success: true, data: { user: { id: 'u1' }, accessToken: 'TOK' } },
          { status: 201 },
        ),
      ),
      http.post(`${API}/requests`, () =>
        HttpResponse.json({ success: false, error: 'Address out of range' }, { status: 400 }),
      ),
    );
    const user = userEvent.setup();
    renderPage('en');
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Submit Request' }));

    expect(await screen.findByText('Address out of range')).toBeInTheDocument();
  });

  test('"Submit another request" resets the form back to idle', async () => {
    server.use(
      http.get(`${API}/materials`, () => HttpResponse.json({ success: true, data: [material] })),
      http.post(`${API}/auth/register`, () =>
        HttpResponse.json(
          { success: true, data: { user: { id: 'u1' }, accessToken: 'TOK' } },
          { status: 201 },
        ),
      ),
      http.post(`${API}/requests`, () =>
        HttpResponse.json({ success: true, data: { id: 'r-1' } }, { status: 201 }),
      ),
    );
    const user = userEvent.setup();
    renderPage('en');
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Submit Request' }));
    await screen.findByText('Request received!');
    await user.click(screen.getByRole('button', { name: 'Submit another request' }));
    expect(await screen.findByRole('button', { name: 'Submit Request' })).toBeInTheDocument();
  });

  test('renders RU labels when initialLang="ru"', async () => {
    server.use(http.get(`${API}/materials`, () => HttpResponse.json({ success: true, data: [] })));
    renderPage('ru');
    // The submit button should NOT have the EN label.
    expect(screen.queryByRole('button', { name: 'Submit Request' })).not.toBeInTheDocument();
  });
});
