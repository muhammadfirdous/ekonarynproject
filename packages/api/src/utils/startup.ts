// Production startup guard. Called once from src/index.ts before app.listen().
// Refuses to boot the API in NODE_ENV=production when secrets are missing or
// match the forbidden defaults shipped in .env.example. In any other env we
// warn but continue, so dev / test workflows with `dev-secret` keep working.

const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'] as const;

// Set of literals that ship in .env.example or in legacy fallbacks (see
// middleware/auth.ts:20). A real deploy must replace these with values
// generated via `openssl rand -base64 48`.
const FORBIDDEN_SECRETS = new Set(['', 'dev-secret', 'change-me', 'changeme', 'secret']);

const SECRET_KEYS = ['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const;

export function assertProductionEnv(env: NodeJS.ProcessEnv = process.env): void {
  const missing = REQUIRED_ENV.filter((k) => !env[k]);
  const insecure = SECRET_KEYS.filter((k) => FORBIDDEN_SECRETS.has((env[k] ?? '').trim()));

  if (missing.length === 0 && insecure.length === 0) return;

  const lines: string[] = [];
  if (missing.length) lines.push(`Missing required env vars: ${missing.join(', ')}`);
  if (insecure.length) {
    lines.push(`Refusing to start with default/insecure secrets: ${insecure.join(', ')}`);
  }

  if (env.NODE_ENV === 'production') {
    console.error('[FATAL]', ...lines);
    console.error('Generate fresh secrets via: openssl rand -base64 48');
    process.exit(1);
  } else {
    console.warn('[WARN]', ...lines, '(allowed outside NODE_ENV=production)');
  }
}
