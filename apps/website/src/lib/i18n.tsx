'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import ru from './messages/ru';
import en from './messages/en';
import { LANG_COOKIE, type Lang } from './lang-config';

export type { Lang };

const dictionaries = { ru, en } as const;

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function resolve(dict: unknown, path: string): string | undefined {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict) as string | undefined;
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => (key in vars ? String(vars[key]) : `{${key}}`));
}

function writeCookie(value: Lang) {
  if (typeof document === 'undefined') return;
  // 1 year, available to the whole site, sent on the next request so SSR matches.
  document.cookie = `${LANG_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
}

export function LanguageProvider({
  children,
  initialLang = 'ru',
}: {
  children: ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = (l: Lang) => {
    setLangState(l);
    writeCookie(l);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = l;
    }
  };

  const value = useMemo<LanguageContextValue>(() => {
    const dict = dictionaries[lang];
    const t = (key: string, vars?: Record<string, string | number>) => {
      const found = resolve(dict, key);
      if (typeof found === 'string') return interpolate(found, vars);
      return key;
    };
    return { lang, setLang, t };
  }, [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
}

export function useT() {
  return useLang().t;
}

export function useLocalized<T>(
  item: T | null | undefined,
  fields: { ru: keyof T; en: keyof T },
): string {
  const { lang } = useLang();
  if (!item) return '';
  // Cast widens T (which may be a TS interface like Material with no index
  // signature) to a string-indexable shape so we can read by keyof T at
  // runtime without TS demanding an index signature on every callsite.
  const v = (item as Record<keyof T, unknown>)[fields[lang]];
  return typeof v === 'string' ? v : '';
}

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang();
  const baseBtn = 'text-xs font-semibold px-2.5 py-1 rounded-full transition-colors duration-150';
  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full bg-neutral-100 p-1 ${className}`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLang('ru')}
        className={`${baseBtn} ${
          lang === 'ru'
            ? 'bg-brand-700 text-white shadow-sm'
            : 'text-neutral-600 hover:text-neutral-900'
        }`}
        aria-pressed={lang === 'ru'}
      >
        RU
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`${baseBtn} ${
          lang === 'en'
            ? 'bg-brand-700 text-white shadow-sm'
            : 'text-neutral-600 hover:text-neutral-900'
        }`}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
    </div>
  );
}
