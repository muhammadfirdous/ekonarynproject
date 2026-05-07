// Plain (non-'use client') module so server components can safely import it.
// Exports of a 'use client' module become opaque client references on the
// server, breaking string-equality / cookie-name lookups.

export type Lang = 'ru' | 'en';
export const LANG_COOKIE = 'ekonaryn_lang';
