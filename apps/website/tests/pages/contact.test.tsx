import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactPage from '@/app/contact/page';
import { LanguageProvider } from '@/lib/i18n';

function renderPage(lang: 'ru' | 'en' = 'en') {
  return render(
    <LanguageProvider initialLang={lang}>
      <ContactPage />
    </LanguageProvider>,
  );
}

describe('ContactPage', () => {
  test('renders contact info, addresses, and the form in EN', () => {
    renderPage('en');
    expect(screen.getByText('+996 700 000 001')).toBeInTheDocument();
    expect(screen.getByText('info@ekonaryn.kg')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send|Submit/i })).toBeInTheDocument();
  });

  test('renders RU copy when initialLang="ru"', () => {
    renderPage('ru');
    expect(screen.getByText('+996 700 000 001')).toBeInTheDocument();
    // Russian button label is "Отправить" — but we don't pin exact wording.
    expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
  });

  test('submitting the form swaps in the "sent" confirmation panel', async () => {
    const user = userEvent.setup();
    renderPage('en');
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
    await user.type(inputs[0]!, 'Alice');
    await user.type(inputs[1]!, '+996700000010');
    // textarea is also role=textbox; the third one is the message.
    if (inputs[2]) await user.type(inputs[2], 'Pls call');
    await user.click(screen.getByRole('button', { name: /Send|Submit/i }));

    // The confirmation panel exposes a "Send another" button (en: contact.sendAnother).
    expect(
      await screen.findByRole('button', { name: /Send another|another/i }),
    ).toBeInTheDocument();
  });

  test('the "Send another" button resets the form back to the input panel', async () => {
    const user = userEvent.setup();
    renderPage('en');
    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0]!, 'Alice');
    await user.type(inputs[1]!, '+996700000010');
    if (inputs[2]) await user.type(inputs[2], 'Pls call');
    await user.click(screen.getByRole('button', { name: /Send|Submit/i }));
    await user.click(await screen.findByRole('button', { name: /Send another|another/i }));
    // Form is back: inputs reappear.
    expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(2);
  });
});
