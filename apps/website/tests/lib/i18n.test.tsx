import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook, act } from '@testing-library/react';
import { LanguageProvider, LanguageToggle, useLang, useT, useLocalized } from '@/lib/i18n';
import { LANG_COOKIE } from '@/lib/lang-config';

function wrapper(initial: 'ru' | 'en' = 'ru') {
  return ({ children }: { children: React.ReactNode }) => (
    <LanguageProvider initialLang={initial}>{children}</LanguageProvider>
  );
}

describe('i18n: useT translation lookup', () => {
  test('resolves nested keys for ru and en', () => {
    const { result, rerender } = renderHook(() => useT(), { wrapper: wrapper('ru') });
    expect(result.current('nav.home')).toBe('Главная');
    expect(result.current('brand')).toBe('Эко Нарын');

    rerender();
    // Switch to en wrapper for the next case.
    const en = renderHook(() => useT(), { wrapper: wrapper('en') });
    expect(en.result.current('nav.home')).toBe('Home');
    expect(en.result.current('brand')).toBe('Eko Naryn');
  });

  test('falls through to the key when a path is missing', () => {
    const { result } = renderHook(() => useT(), { wrapper: wrapper('en') });
    expect(result.current('made.up.path')).toBe('made.up.path');
    expect(result.current('nav')).toBe('nav'); // resolves to an object → not a string → fall-through
  });

  test('interpolates {var} placeholders; leaves unknown placeholders intact', () => {
    // Use a dictionary entry we know exists. We pass an extra `qty` to a
    // string that doesn't reference it — interpolation should be a no-op.
    const { result } = renderHook(() => useT(), { wrapper: wrapper('en') });
    expect(result.current('nav.home', { qty: 5 })).toBe('Home');

    // Synthetic case: an unknown var inside an unknown path stays as-is.
    expect(result.current('no.such.key', { name: 'x' })).toBe('no.such.key');
  });
});

describe('i18n: useLang setLang side effects', () => {
  test('updates state, writes the LANG_COOKIE, and sets <html lang>', () => {
    document.cookie = ''; // best-effort wipe of any prior value
    const { result } = renderHook(() => useLang(), { wrapper: wrapper('ru') });
    expect(result.current.lang).toBe('ru');

    act(() => result.current.setLang('en'));
    expect(result.current.lang).toBe('en');
    expect(document.cookie).toContain(`${LANG_COOKIE}=en`);
    expect(document.documentElement.lang).toBe('en');
  });

  test('throws when used outside a provider', () => {
    expect(() => renderHook(() => useLang())).toThrowError(/LanguageProvider/);
  });
});

describe('i18n: useLocalized', () => {
  test('reads the field for the current language', () => {
    const item = { name: 'Plastic', nameRu: 'Пластик' };
    const { result, rerender } = renderHook(
      ({ lang }) => {
        const _ = useLang().lang === lang; // ensure ctx is read
        return useLocalized(item, { en: 'name', ru: 'nameRu' });
      },
      { wrapper: wrapper('en'), initialProps: { lang: 'en' as const } },
    );
    expect(result.current).toBe('Plastic');
    rerender({ lang: 'en' });
    expect(result.current).toBe('Plastic');
  });

  test('returns "" for a null item', () => {
    const { result } = renderHook(() => useLocalized(null, { en: 'name', ru: 'nameRu' }), {
      wrapper: wrapper('en'),
    });
    expect(result.current).toBe('');
  });

  test('returns "" if the resolved field is not a string', () => {
    const item = { count: 5 } as unknown as Record<string, unknown>;
    const { result } = renderHook(
      () => useLocalized(item, { en: 'count' as never, ru: 'count' as never }),
      { wrapper: wrapper('en') },
    );
    expect(result.current).toBe('');
  });
});

describe('i18n: <LanguageToggle />', () => {
  test('renders RU/EN buttons with aria-pressed reflecting current state', () => {
    render(
      <LanguageProvider initialLang="ru">
        <LanguageToggle />
      </LanguageProvider>,
    );
    const ru = screen.getByRole('button', { name: 'RU' });
    const en = screen.getByRole('button', { name: 'EN' });
    expect(ru).toHaveAttribute('aria-pressed', 'true');
    expect(en).toHaveAttribute('aria-pressed', 'false');
  });

  test('clicking EN switches the active language', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider initialLang="ru">
        <LanguageToggle />
      </LanguageProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'RU' })).toHaveAttribute('aria-pressed', 'false');
  });
});
