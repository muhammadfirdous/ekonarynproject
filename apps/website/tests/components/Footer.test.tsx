import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';
import { LanguageProvider } from '@/lib/i18n';

function renderFooter(initial: 'ru' | 'en' = 'ru') {
  return render(
    <LanguageProvider initialLang={initial}>
      <Footer />
    </LanguageProvider>,
  );
}

describe('<Footer />', () => {
  test('renders contact details and the rights notice in RU', () => {
    renderFooter('ru');
    expect(screen.getByText('Эко Нарын')).toBeInTheDocument();
    expect(screen.getByText('+996 700 000 001')).toBeInTheDocument();
    expect(screen.getByText('info@ekonaryn.kg')).toBeInTheDocument();
    expect(screen.getByText(/Все права защищены/)).toBeInTheDocument();
  });

  test('renders the same shell with English copy', () => {
    renderFooter('en');
    expect(screen.getByText('Eko Naryn')).toBeInTheDocument();
    expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
    expect(screen.getByText('Pages')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Contacts')).toBeInTheDocument();
  });

  test('page links point to the right hrefs', () => {
    renderFooter('en');
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'Materials' })).toHaveAttribute('href', '/materials');
    expect(screen.getByRole('link', { name: 'Schedule' })).toHaveAttribute('href', '/schedule');
    expect(screen.getByRole('link', { name: 'Eco Education' })).toHaveAttribute(
      'href',
      '/education',
    );
    expect(screen.getByRole('link', { name: 'Submit a Request' })).toHaveAttribute(
      'href',
      '/request',
    );
  });

  test('renders the current year in the rights line', () => {
    renderFooter('en');
    const year = String(new Date().getFullYear());
    // The footer reads `&copy; {year} {brand}. {rights}`
    expect(screen.getByText(new RegExp(`${year}.*Eko Naryn.*All rights`))).toBeInTheDocument();
  });
});
