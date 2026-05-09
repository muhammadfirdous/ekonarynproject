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

// First-deploy escape hatch: with no SMS provider integrated, verification
// codes are generated but never delivered. Setting SKIP_PHONE_VERIFICATION=true
// makes registration mark new accounts phone-verified immediately, and
// /auth/verify/resend refuses with VERIFICATION_DISABLED. See DEPLOYMENT.md §0.8.
export function isPhoneVerificationSkipped(): boolean {
  return process.env.SKIP_PHONE_VERIFICATION === 'true';
}
