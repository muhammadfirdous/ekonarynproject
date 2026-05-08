import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ImpactCounter from '@/components/ImpactCounter';
import { LanguageProvider } from '@/lib/i18n';

// IntersectionObserver isn't shipped by jsdom. The component starts the
// count-up animation on intersection — we stub a NEVER-fires observer so the
// component renders the initial 0 state we can assert against.
class NeverIntersectsObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).IntersectionObserver = NeverIntersectsObserver;
});

describe('<ImpactCounter />', () => {
  test('renders three labelled stats in EN', () => {
    render(
      <LanguageProvider initialLang="en">
        <ImpactCounter />
      </LanguageProvider>,
    );
    expect(screen.getByText('KG OF MATERIALS COLLECTED')).toBeInTheDocument();
    expect(screen.getByText('TREES SAVED')).toBeInTheDocument();
    expect(screen.getByText('LITERS OF WATER SAVED')).toBeInTheDocument();
  });

  test('renders three labelled stats in RU', () => {
    render(
      <LanguageProvider initialLang="ru">
        <ImpactCounter />
      </LanguageProvider>,
    );
    // The RU strings live in messages/ru.ts under impact.*. We don't pin the
    // exact text here since the dictionary may evolve — just assert there are
    // three label paragraphs (three sections) styled with the brand-300 class.
    const labels = screen.getAllByText(/.+/, { selector: 'p.text-brand-300' });
    expect(labels).toHaveLength(3);
  });

  test('counters render the initial 0 (never starts without intersection)', () => {
    render(
      <LanguageProvider initialLang="en">
        <ImpactCounter />
      </LanguageProvider>,
    );
    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(3);
  });
});
