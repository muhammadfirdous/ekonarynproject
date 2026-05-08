# Security Policy

## Reporting a vulnerability

If you believe you've found a security issue in Eko Naryn, please **report
it privately** rather than opening a public GitHub issue.

- Email: `security@ekonaryn.kg` _(placeholder — confirm before relying on
  this address)_
- PGP key: `# TODO: maintainer to publish a key fingerprint here`

We aim to acknowledge reports within 72 hours. Please include:

- A description of the issue and the impact you observed.
- Reproduction steps (a `curl` invocation or a code snippet is ideal).
- The commit hash or release tag you tested against.
- Your preferred contact method for follow-up.

We will not pursue legal action against good-faith researchers who:

1. Avoid privacy violations, destruction of data, and disruption of service.
2. Give us reasonable time to respond before any public disclosure.
3. Do not access more of the system than is necessary to demonstrate the
   issue.

## Supported versions

This is a single-deployment project (one production VPS, one mobile
release lane). Only the current `main` branch and the most recent
mobile release receive security fixes.

## Known limitations

The threat model in `DEPLOYMENT.md §0.6` lists the controls in place. The
items below are **acknowledged gaps** — present in the production code,
tracked, but not yet closed. If you find a way to escalate one of them
into actual harm, please report it via the channel above.

### Refresh-token rotation is not implemented

`/auth/refresh` issues a new access + refresh pair without invalidating
the old refresh token. A stolen refresh token therefore remains valid
for the full 7-day window. Mitigations in place: 15-minute access TTL,
suspended-account re-check on every refresh (`routes/auth.ts:387-414`).
Tracked in `DEPLOYMENT.md §7.4`.

### Uploaded files are not scanned for malware or inappropriate content

Worker ID-document uploads and collection photos are accepted on a
mime/extension/size allowlist (`packages/api/src/utils/upload.ts`,
`packages/shared/src/constants.ts`). They are not scanned for malware,
NSFW content, or steganography. A `.jpg` containing executable bytes
would still upload. Tracked in `DEPLOYMENT.md §7.5`. ClamAV sidecar is
the planned mitigation.

### Phone verification has no SMS provider

The verification-code flow generates and stores codes, but no provider
delivers them. First production deploy will set
`SKIP_PHONE_VERIFICATION=true` (see `packages/api/src/utils/verification.ts`)
so new accounts are auto-verified at registration; the worker-approval
gate is independent and continues to work. Tracked in `DEPLOYMENT.md §0.8 / §7.1`.

### Other items tracked in DEPLOYMENT.md

- Single-VPS deploy with no automated failover (`§0.4`).
- No web application firewall in front of Caddy (`§0.6`).
- Local-disk uploads — breaks the moment a second API replica appears (`§7.6`).
- No mass-DoS mitigation beyond Caddy's defaults (`§0.6`).

## What's already in place

For the avoidance of doubt, the following controls **are** present and
covered by the test suite:

- 20-attempt / 15-minute rate limit on `/auth/login`, `/auth/refresh`,
  `/auth/verify/resend` (`packages/api/src/middleware/rateLimit.ts`).
- Origin allowlist via `CORS_ORIGINS` env (`packages/api/src/app.ts`).
- Helmet defaults on every response.
- bcrypt cost-10 password hashing, parameterized Prisma queries (no
  string-built SQL).
- JWT signature + expiry + payload-tamper rejection
  (`tests/security/jwt-rotation.test.ts`).
- `requireActiveAccount` middleware re-reads the DB on every role-gated
  request, so suspensions take effect within seconds.
- Path-traversal protection on `/uploads/*`
  (`tests/security/path-traversal.test.ts`).
- Production startup guard that refuses to boot with default JWT
  secrets (`packages/api/src/utils/startup.ts`).
- Audit log of every state-changing action
  (`packages/api/src/services/activityLog.ts`).
