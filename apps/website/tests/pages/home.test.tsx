import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';
import { LanguageProvider } from '@/lib/i18n';

class NeverIntersectsObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
beforeAll(() => {
  (globalThis as Record<string, unknown>).IntersectionObserver = NeverIntersectsObserver;
});

function renderHome(lang: 'ru' | 'en') {
  return render(
    <LanguageProvider initialLang={lang}>
      <HomePage />
    </LanguageProvider>,
  );
}

describe('HomePage', () => {
  test('renders hero, four "how it works" steps, and final CTA in EN', () => {
    renderHome('en');
    expect(screen.getByText('A Cleaner Naryn —')).toBeInTheDocument();
    expect(screen.getByText('our shared goal')).toBeInTheDocument();
    expect(screen.getByText('How it works')).toBeInTheDocument();
    expect(screen.getByText('Sort')).toBeInTheDocument();
    expect(screen.getByText('We Pick Up')).toBeInTheDocument();
    expect(screen.getByText('Get Paid')).toBeInTheDocument();
    expect(screen.getByText('Save Nature')).toBeInTheDocument();
    expect(screen.getByText('Ready to start?')).toBeInTheDocument();
  });

  test('renders the same shell with Russian copy', () => {
    renderHome('ru');
    expect(screen.getByText('Чистый Нарын —')).toBeInTheDocument();
    expect(screen.getByText('Как это работает')).toBeInTheDocument();
    expect(screen.getByText('Соберите')).toBeInTheDocument();
    expect(screen.getByText('Мы заберем')).toBeInTheDocument();
  });

  test('primary CTA buttons all link to /request', () => {
    renderHome('en');
    const ctaLinks = screen.getAllByRole('link', {
      name: /Submit a Pickup Request|Submit a Request/,
    });
    expect(ctaLinks.length).toBeGreaterThan(0);
    ctaLinks.forEach((link) => expect(link).toHaveAttribute('href', '/request'));
  });
});
