// In-app verification codes (no SMS provider). In dev mode the code is also
// returned in the API response so QA can complete the flow without integrations.

const CODE_TTL_MINUTES = 15;

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function codeExpiry(): Date {
  return new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
}

export function isCodeValid(
  stored: string | null,
  storedExpiresAt: Date | null,
  supplied: string,
): boolean {
  if (!stored || !storedExpiresAt) return false;
  if (storedExpiresAt.getTime() < Date.now()) return false;
  return stored === supplied;
}

export function shouldExposeCode(): boolean {
  // Dev convenience — never expose in production.
  return process.env.NODE_ENV !== 'production';
}
