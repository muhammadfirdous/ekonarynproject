import { describe, expect, test } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from '@/components/Header';
import { LanguageProvider } from '@/lib/i18n';

function renderHeader(initial: 'ru' | 'en' = 'ru') {
  return render(
    <LanguageProvider initialLang={initial}>
      <Header />
    </LanguageProvider>,
  );
}

describe('<Header />', () => {
  test('renders the brand and the six nav links + CTA in RU', () => {
    renderHeader('ru');
    expect(screen.getByText('Эко Нарын')).toBeInTheDocument();
    // 6 nav links across desktop + mobile renders, but the links exist regardless.
    expect(screen.getAllByRole('link', { name: 'Главная' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'О нас' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Материалы' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Расписание' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Экообразование' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Контакты' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Заявка на сбор' }).length).toBeGreaterThan(0);
  });

  test('renders nav text in EN when initialLang="en"', () => {
    renderHeader('en');
    expect(screen.getByText('Eko Naryn')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Home' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Materials' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Pickup Request' }).length).toBeGreaterThan(0);
  });

  test('clicking EN in the toggle re-renders nav text in English', async () => {
    const user = userEvent.setup();
    renderHeader('ru');
    const ruLabels = screen.getAllByRole('button', { name: 'RU' });
    expect(ruLabels.length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole('button', { name: 'EN' })[0]!);
    expect(screen.getAllByRole('link', { name: 'Home' }).length).toBeGreaterThan(0);
  });

  test('CTA links to /request', () => {
    renderHeader('en');
    const cta = screen.getAllByRole('link', { name: 'Pickup Request' })[0]!;
    expect(cta).toHaveAttribute('href', '/request');
  });
});
