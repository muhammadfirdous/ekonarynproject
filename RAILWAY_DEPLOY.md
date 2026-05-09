# Eko Naryn — Railway deploy

> Companion to `DEPLOYMENT.md`. Where DEPLOYMENT.md targets a self-managed
> Hetzner VPS (Docker Compose + Caddy + manual backups), this document
> targets [Railway](https://railway.com) — a managed PaaS that provides
> per-service containers, managed Postgres with automatic backups, TLS, and
> GitHub-integrated auto-deploys. Both deploy paths run the same code from
> `main` unmodified.

---

## 0. Scope

What this document covers:

- One Railway project hosting **four services**: `postgres` (managed
  add-on), `api`, `website`, `dashboard`.
- GitHub auto-deploy: every push to `main` rebuilds and redeploys the
  affected services.
- Railway-provided subdomains for first deploy (`*.up.railway.app`).
- The first-admin bootstrap and migration commands.
- A swap-to-custom-domain follow-up (deferred — see §9).

What this document does **not** cover:

- The mobile app's release lane (still tracked in `DEPLOYMENT.md §0.7`).
- Multi-region or HA. Railway's single-replica model is fine for v1.
- A separate staging environment. The setup here is single-environment.

---

## 1. Prerequisites

- Railway account (free Trial plan is sufficient for first deploy; the
  Hobby plan starts at $5/mo and is what you'll need long-term).
- Railway CLI: `npm install -g @railway/cli` (this repo's `node` already
  works as the runtime).
- Repository on GitHub at `main` green except `npm-audit` (Next bump
  deferred — see PR #1 description).
- The three Dockerfiles already in this repo:
  - `packages/api/Dockerfile`
  - `apps/website/Dockerfile`
  - `apps/dashboard/Dockerfile`

  Each honors `$PORT` at runtime so Railway's port injection works
  unchanged.

---

## 2. Authenticate the CLI

Run once per machine:

```bash
railway login
```

A browser tab opens for OAuth. After approval, `railway whoami` should
print your email.

---

## 3. Create the project

In the Railway dashboard:

1. **+ New Project** → **Deploy from GitHub repo** → pick
   `muhammadfirdous/ekonarynproject`.
2. When prompted to detect services, **decline auto-detection and skip
   the first service** — Railway tries to scan the monorepo top-level
   and gets confused. We'll add services manually in §5–§7.
3. Name the project `ekonaryn`.

Then link the local CLI to it (run from the repo root):

```bash
railway link
# pick the workspace, then `ekonaryn`
```

After this, `railway status` shows the project name.

---

## 4. Provision Postgres

In the Railway dashboard:

1. **+ New** → **Database** → **PostgreSQL**.
2. Name it `postgres`. No further setup needed.
3. Railway auto-injects `DATABASE_URL`, `PGUSER`, `PGPASSWORD`, etc. into
   any service that opts in via a service reference (we wire this in
   §5).

> **Backups:** Railway snapshots managed Postgres daily; restore via
> the dashboard. This replaces `DEPLOYMENT.md §5`.

---

## 5. API service

In the Railway dashboard:

1. **+ New** → **GitHub repo** → pick `muhammadfirdous/ekonarynproject`
   again. Railway creates a service.
2. Name it `api`.
3. **Settings → Source**:
   - Branch: `main`
   - Root Directory: leave **empty** (the Dockerfile expects the repo
     root as the build context).
   - **Dockerfile Path**: `packages/api/Dockerfile`
4. **Settings → Networking → Generate Domain**. Railway assigns
   something like `api-production-xxxx.up.railway.app`. Copy it — we
   need it in §6 and §7.
5. **Variables** (add all of these):

   | Variable                  | Value                                                                                                  |
   | ------------------------- | ------------------------------------------------------------------------------------------------------ |
   | `DATABASE_URL`            | `${{ postgres.DATABASE_URL }}` (service reference)                                                     |
   | `JWT_SECRET`              | `openssl rand -base64 48` output (paste new value)                                                     |
   | `JWT_REFRESH_SECRET`      | another fresh `openssl rand -base64 48` value                                                          |
   | `JWT_EXPIRES_IN`          | `15m`                                                                                                  |
   | `JWT_REFRESH_EXPIRES_IN`  | `7d`                                                                                                   |
   | `NODE_ENV`                | `production`                                                                                           |
   | `CORS_ORIGINS`            | `https://<website-domain>,https://<dashboard-domain>` (filled in after §6 + §7 generate their domains) |
   | `SKIP_PHONE_VERIFICATION` | `true` (until SMS provider is wired — see `DEPLOYMENT.md §0.8`)                                        |

   Notes:
   - **Do NOT set `PORT`**. Railway injects it. The api respects
     `$PORT` (then `API_PORT`, then 4000) — `packages/api/src/index.ts`.
   - **Do NOT set `DISABLE_RATE_LIMIT`**. That env exists only for the
     test suite; production must keep the limiter on.

6. **Settings → Deploy → Custom Start Command**: leave empty (the
   Dockerfile's `CMD` is correct).

The first deploy will fail until the website + dashboard exist for
their CORS origins — that's fine, we'll redeploy after §6/§7.

---

## 6. Website service

Repeat §5 with these differences:

- Service name: `website`
- **Dockerfile Path**: `apps/website/Dockerfile`
- **Variables**:

  | Variable              | Value                                                  |
  | --------------------- | ------------------------------------------------------ |
  | `NODE_ENV`            | `production`                                           |
  | `NEXT_PUBLIC_API_URL` | `https://<api-domain>/api/v1` (the api domain from §5) |

- **Generate Domain**.

The Dockerfile's `CMD` honors `$PORT`, so the Next.js server binds to
whatever Railway sets.

---

## 7. Dashboard service

Same as §6 with:

- Service name: `dashboard`
- **Dockerfile Path**: `apps/dashboard/Dockerfile`
- **Variables**:

  | Variable              | Value                         |
  | --------------------- | ----------------------------- |
  | `NODE_ENV`            | `production`                  |
  | `NEXT_PUBLIC_API_URL` | `https://<api-domain>/api/v1` |

- **Generate Domain**.

---

## 8. Wire CORS_ORIGINS in the API

Now that `<website-domain>` and `<dashboard-domain>` exist, return to
the api service's **Variables** and set:

```
CORS_ORIGINS=https://<website-domain>,https://<dashboard-domain>
```

Save → Railway auto-redeploys the api with the new env. Wait for the
deploy to settle (~1 minute) before §10.

---

## 9. (Later) Custom domains

When `ekonaryn.kg` is registered and pointed at Railway:

1. In each service → **Settings → Domains → Custom Domain**:
   - api: `api.ekonaryn.kg` → CNAME to the railway target shown
   - website: `ekonaryn.kg` and `www.ekonaryn.kg` → CNAME / A to railway
   - dashboard: `app.ekonaryn.kg` → CNAME to railway target
2. Update the api's `CORS_ORIGINS` to the new origins:
   ```
   CORS_ORIGINS=https://ekonaryn.kg,https://app.ekonaryn.kg
   ```
3. Update website/dashboard `NEXT_PUBLIC_API_URL` to
   `https://api.ekonaryn.kg/api/v1`.
4. Update `apps/mobile/app/build.gradle`'s `API_BASE_URL_RELEASE` to
   match.

---

## 10. Migrations

The Dockerfile runs the api start command directly; migrations need a
one-shot run before first traffic. From the repo root with the CLI
linked to the project:

```bash
railway run --service api -- npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma
```

`railway run` executes the command inside the api service's container
with all of its env vars (including `DATABASE_URL`) populated. The
command exits when migrations complete; the long-running api keeps
serving.

For subsequent deploys with new migrations, this command is the
release step. (Adding it as an automated `releaseCommand` is a follow-up;
documented in §13.)

---

## 11. Bootstrap the first admin

```bash
railway run --service api -- npm run admin:create
```

The script (introduced in PR #1, `scripts/create-first-admin.ts`)
prompts for name, phone (`+996…` format), and password. It refuses if
any ADMIN already exists, so it's safe to leave the script in the image
and re-run if you forget.

Once it returns a user id, log in at `https://<dashboard-domain>` with
the phone + password.

---

## 12. Smoke test

```bash
curl -s https://<api-domain>/health
# {"status":"ok","service":"ekonaryn-api"}

curl -sI https://<website-domain> | head -3
# HTTP/2 200 …

curl -sI https://<dashboard-domain>/login | head -3
# HTTP/2 200 …
```

Then in a browser:

1. Visit `https://<dashboard-domain>`, sign in as the admin.
2. Visit `https://<website-domain>`, click around `/materials` and
   `/schedule` (these hit the api).
3. (Optional) Submit a pickup request via the public site to confirm
   the register-then-login fork still works against Railway's Postgres.

---

## 13. Subsequent deploys

Railway watches `main`. Any push (including a merge from a PR like
`feat/header-dropdowns`) triggers redeploys for whichever service's
files changed. The `Tests`, `Security`, and `E2E` workflows still run
in GitHub Actions before the merge — Railway only deploys after `main`
is updated.

To keep migrations automatic, configure each service's **Settings →
Deploy → Pre-deploy Command** for the `api` service to:

```
cd packages/db && npx prisma migrate deploy
```

(Pre-deploy runs _before_ the new container takes traffic, so a failed
migration aborts the deploy. Same effect as the explicit `railway run`
above, but no manual step.)

---

## 14. Rollback

In the Railway dashboard for the affected service:

1. **Deployments** tab → click the previous successful deployment →
   **Redeploy**.
2. Railway routes traffic to that older image immediately.
3. If the broken release shipped a migration: do NOT auto-rollback the
   DB. Restore Postgres from a Railway snapshot via the dashboard
   instead.

---

## 15. Cost

First-deploy estimate on Railway's Hobby plan:

| Component                | Approx. monthly cost    |
| ------------------------ | ----------------------- |
| Hobby plan baseline      | $5                      |
| Postgres add-on (1 GB)   | included in Hobby usage |
| 4 services × low traffic | ~$5–$10                 |
| **Total v1**             | **~$5–$15/mo**          |

Compared to a Hetzner CX22 + manual ops at ~€5/mo, Railway costs more
but skips the VPS hardening, Caddy config, backup script, and patch
schedule documented in `DEPLOYMENT.md §1` and `§5`.

---

_Open questions deferred to `DEPLOYMENT.md §7`: SMS provider, GDPR
posture, refresh-token rotation, image-content scanning, object-storage
migration. None block this Railway deploy._
