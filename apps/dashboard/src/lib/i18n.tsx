'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import ru from './messages/ru';
import en from './messages/en';
import { setUtilLang } from './utils';

export type Lang = 'ru' | 'en';

const dictionaries = { ru, en } as const;

const STORAGE_KEY = 'ekonaryn_lang';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function resolve(dict: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ru');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored === 'ru' || stored === 'en') {
        setLangState(stored);
        setUtilLang(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    setUtilLang(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
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

/**
 * Resolve a t() value that may be an array (returns the array as-is) or string.
 */
export function useTArray(key: string): string[] {
  const { lang } = useLang();
  const dict = dictionaries[lang];
  const found = resolve(dict, key);
  return Array.isArray(found) ? (found as string[]) : [];
}

export function useLocalized<T extends Record<string, unknown>>(
  item: T | null | undefined,
  fields: { ru: keyof T; en: keyof T },
): string {
  const { lang } = useLang();
  if (!item) return '';
  const v = item[fields[lang]];
  return typeof v === 'string' ? v : '';
}

export function LanguageToggle({
  className = '',
  variant = 'light',
}: {
  className?: string;
  variant?: 'light' | 'dark';
}) {
  const { lang, setLang } = useLang();
  const baseBtn =
    'text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors duration-150';
  const isDark = variant === 'dark';
  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full p-1 ${
        isDark ? 'bg-white/5' : 'bg-neutral-100'
      } ${className}`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLang('ru')}
        className={`${baseBtn} ${
          lang === 'ru'
            ? isDark
              ? 'bg-brand-500/20 text-brand-300'
              : 'bg-brand-700 text-white shadow-sm'
            : isDark
              ? 'text-neutral-400 hover:text-neutral-200'
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
            ? isDark
              ? 'bg-brand-500/20 text-brand-300'
              : 'bg-brand-700 text-white shadow-sm'
            : isDark
              ? 'text-neutral-400 hover:text-neutral-200'
              : 'text-neutral-600 hover:text-neutral-900'
        }`}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
    </div>
  );
}
