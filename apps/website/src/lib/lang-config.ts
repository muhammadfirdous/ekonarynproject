// Plain (non-'use client') module so server components can safely import it.
// Anything exported from a 'use client' module becomes an opaque client reference
// when imported on the server, which breaks string equality / cookie name lookups.

export type Lang = 'ru' | 'en';
export const LANG_COOKIE = 'ekonaryn_lang';
