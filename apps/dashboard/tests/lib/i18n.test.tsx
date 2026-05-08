import { describe, expect, test } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  LanguageProvider,
  LanguageToggle,
  useT,
  useLang,
  useTArray,
  useLocalized,
} from '@/lib/i18n';
import { LANG_COOKIE } from '@/lib/lang-config';

function clearCookie() {
  document.cookie = `${LANG_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

beforeEach(() => clearCookie());

function Probe() {
  const t = useT();
  const { lang } = useLang();
  const days = useTArray('schedule.daysShort');
  const localized = useLocalized({ ru: 'ПЭТ', en: 'PET' }, { ru: 'ru', en: 'en' });
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="brand">{t('brand')}</span>
      <span data-testid="days-len">{days.length}</span>
      <span data-testid="localized">{localized}</span>
      <LanguageToggle />
    </div>
  );
}

describe('LanguageProvider + useT', () => {
  test('default initial lang is ru', () => {
    render(
      <LanguageProvider initialLang="ru">
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('lang').textContent).toBe('ru');
  });

  test('initialLang=en is honored', () => {
    render(
      <LanguageProvider initialLang="en">
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('lang').textContent).toBe('en');
  });

  test('switching language with the toggle updates the rendered text and writes the cookie', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider initialLang="ru">
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('lang').textContent).toBe('ru');

    await user.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByTestId('lang').textContent).toBe('en');
    // Cookie was written by the provider.
    expect(document.cookie).toContain(`${LANG_COOKIE}=en`);
  });

  test('useT falls back to the key when missing', () => {
    function Inner() {
      const t = useT();
      return <span data-testid="missing">{t('totally.missing.key')}</span>;
    }
    render(
      <LanguageProvider initialLang="en">
        <Inner />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('missing').textContent).toBe('totally.missing.key');
  });

  test('useT interpolates {var} placeholders', () => {
    function Inner() {
      const t = useT();
      // Uses an existing key with placeholders: materials.buyingPrice = 'Buying price (som/{unit})'
      return <span data-testid="interp">{t('materials.buyingPrice', { unit: 'kg' })}</span>;
    }
    render(
      <LanguageProvider initialLang="en">
        <Inner />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('interp').textContent).toMatch(/Buying price \(som\/kg\)/);
  });

  test('useTArray returns a 7-entry day-short array for both languages', () => {
    const { unmount } = render(
      <LanguageProvider initialLang="en">
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('days-len').textContent).toBe('7');
    unmount();

    render(
      <LanguageProvider initialLang="ru">
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('days-len').textContent).toBe('7');
  });

  test('useLocalized picks the right field per language', () => {
    const { unmount } = render(
      <LanguageProvider initialLang="ru">
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('localized').textContent).toBe('ПЭТ');
    unmount();

    render(
      <LanguageProvider initialLang="en">
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('localized').textContent).toBe('PET');
  });
});

describe('useLang outside a provider', () => {
  test('throws a clear error', () => {
    function Outside() {
      useLang();
      return null;
    }
    // React renders eat thrown errors by default; capture via a try/catch around render.
    let err: Error | null = null;
    const original = console.error;
    console.error = () => undefined;
    try {
      render(<Outside />);
    } catch (e) {
      err = e as Error;
    } finally {
      console.error = original;
    }
    expect(err?.message).toMatch(/inside LanguageProvider/);
  });
});
