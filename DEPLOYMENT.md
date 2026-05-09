# Eko Naryn — Deployment Architecture

> **Status:** Draft 2026-05-09. The first production deployment of Eko Naryn.
> Read `PROJECT_OVERVIEW.md` for the application overview; this document
> covers only how the same code reaches a real server.

This document is the canonical reference for the production target. The
companion work order (the "pre-deployment hardening" sequence) cites
section numbers from this document — keep them stable.

---

## 0. Introduction

### 0.1 Scope

What this document covers:

- Target topology (one VPS, Docker Compose, Caddy edge proxy).
- Secrets handling, env-var layout, secret rotation procedure.
- Container build + run model for the four runtime services
  (api, website, dashboard, postgres) plus the edge (caddy).
- Migration, first-admin bootstrap, seeding policy.
- Backup, restore, rollback runbook.
- The CI → image-build → deploy seam.
- The open questions that gate first deploy.

What this document does **not** cover:

- The mobile app's release lane (Play Store / direct APK). Tracked in
  `§0.7` as out-of-scope for first deploy.
- A multi-region or HA topology — explicitly single-VPS for v1
  (see `§0.4`).
- An IaC layer (Terraform, Ansible). The VPS is hand-provisioned;
  config lives in this repo plus a hand-written `.env.production` on
  the box.

### 0.2 Target deployment posture

| Dimension         | Choice                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| Cloud / hardware  | **Hetzner Cloud**, single VPS (CX22 or CX32 to start)                                            |
| OS                | Ubuntu 24.04 LTS                                                                                 |
| Container runtime | Docker + Docker Compose v2                                                                       |
| Edge proxy        | **Caddy 2** (auto-TLS via Let's Encrypt)                                                         |
| Database          | **PostgreSQL 16-alpine**, sibling container, named volume                                        |
| App layer         | api + dashboard + website, each its own container                                                |
| Object storage    | **Local disk** in named volume `api_uploads/`. Migration to S3-compatible deferred (see `§7.6`). |
| Backup            | `pg_dump` + `tar` of `uploads`, pushed off-VPS via rclone. See `§5`.                             |
| Monitoring        | Caddy access logs + container stdout/stderr → host journald. **No APM in v1.**                   |
| Deploy trigger    | Manual `ssh` + `docker compose pull && up -d` from CI-built images. See `§6`.                    |

### 0.3 Domains & DNS

Three subdomains, all pointing at the VPS public IPv4:

| Domain            | Target service      | Purpose                            |
| ----------------- | ------------------- | ---------------------------------- |
| `ekonaryn.kg`     | website (`:3000`)   | Public marketing + `/request` flow |
| `app.ekonaryn.kg` | dashboard (`:3001`) | Admin panel                        |
| `api.ekonaryn.kg` | api (`:4000`)       | REST API + `/uploads/*` static     |

Caddy holds all three sites and terminates TLS for each. The `:3000`,
`:3001`, `:4000` ports are **not** published to the internet — only the
edge ports `:80` and `:443` are.

> **Open question:** is the apex `ekonaryn.kg` already registered? See
> `§7.2`. The mobile app's release default `https://api.ekonaryn.kg/api/v1`
> assumes "yes."

### 0.4 Single-VPS rationale (vs k8s, ECS, Fly.io, …)

This is a small business app for a small business. v1 traffic is
dozens of requests per minute at most. A single ~€5/month VPS gives:

- One `docker compose` command to start everything.
- One backup target.
- Zero managed-service vendor coupling.
- A single ssh login surface to harden.

Trade-offs we accept:

- Single point of failure. Mitigated by **off-VPS backups** (`§5.2`)
  and a documented rebuild runbook (`§8.1`).
- Manual deploy is human-driven. Documented in `§6`.
- No autoscaling. Re-evaluate at 1k req/min sustained.

### 0.5 Data lifecycle

User-generated data classes:

| Class                           | Where                         | Retention                                                                                                                                               |
| ------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User PII (phone, name, address) | `User` table                  | Indefinite while account active. Soft-delete via `deletedAt` on user-initiated removal. **GDPR posture: see `§7.3`.**                                   |
| ID document scans (workers)     | `api_uploads/*.{png,jpg,pdf}` | Kept while worker `accountStatus !== REJECTED`. Hard-delete when admin runs the (currently-unimplemented) reject-and-purge job — placeholder at `§7.3`. |
| Collection photos               | `api_uploads/*.jpg`           | Kept indefinitely.                                                                                                                                      |
| Audit log                       | `ActivityLog`                 | Indefinite, no rotation today. Re-evaluate when row count > 10M.                                                                                        |
| Verification codes              | `User.verificationCode`       | Cleared on successful verification or after `verificationCodeExpiresAt`.                                                                                |

### 0.6 Threat model summary

The realistic threats this deployment defends against:

1. **Credential stuffing on `/auth/login`.** Mitigated by Task 5 (rate
   limiting, 20 attempts / 15 min / IP).
2. **Stolen JWT.** 15-minute access TTL limits the window. Refresh-token
   rotation is **not yet implemented** (`§7.4`).
3. **Direct DB exposure.** Postgres port `:5432` not published. Only
   the api container can reach it via the internal compose network.
4. **CORS exfiltration from a malicious origin.** Mitigated by Task 3
   (allowlist).
5. **Path-traversal on `/uploads/*`.** Caddy serves `/uploads/*`
   directly via `file_server` rooted at the named volume — Caddy's
   default behavior here is safe, but path traversal is also covered
   by `tests/security/path-traversal.test.ts`.

Out of scope for v1 (acknowledged risks):

- Image-content scanning (NSFW / malware in uploads). `§7.5`.
- Web Application Firewall.
- Mass-targeting denial-of-service. Caddy + Cloudflare in front would
  help — not configured today.

### 0.7 Mobile app distribution (deferred)

The Android app's release flow (Play Store listing, signing, F-Droid
build, etc.) is **not part of first deploy**. Once the API URL is
stable, the mobile team flips
`API_BASE_URL_RELEASE=https://api.ekonaryn.kg/api/v1` and ships an APK.
Tracking under `§7.2`.

### 0.8 SMS provider gap (referenced by Work Order Task 4)

The phone-verification flow generates 6-digit codes and stores them in
`User.verificationCode`. **No SMS provider integration exists** — codes
are exposed in API responses only when `shouldExposeCode()` returns true,
which it does in `NODE_ENV !== 'production'` (per
`packages/api/src/utils/verification.ts`).

This means in production, **no end-user can finish phone verification** —
the code is generated, stored, and never delivered.

For first deploy, two viable paths:

1. **Disable phone verification entirely** until a provider is wired
   up. This is what Task 4 implements: `SKIP_PHONE_VERIFICATION=true`
   marks new accounts verified at registration time.
2. **Wire up an SMS provider before deploy.** This is the better
   long-term fix but is gated on `§7.1` (provider choice).

**v1 decision: ship with `SKIP_PHONE_VERIFICATION=true`** until `§7.1`
resolves. Document this loudly in `.env.production`.

The worker-approval flow is **independent of phone verification** — a
worker registers, an admin reviews their ID doc and approves them in
the dashboard. That continues to work whether `SKIP_PHONE_VERIFICATION`
is true or false.

---

## 1. VPS provisioning

### 1.1 OS, hardening, firewall

Step-by-step, executed once on a fresh Ubuntu 24.04 image:

```bash
# 1. Update + upgrade
apt update && apt upgrade -y

# 2. Create unprivileged sudo user
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
# (paste your public key into /home/deploy/.ssh/authorized_keys)
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# 3. Disable root SSH + password auth
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl reload sshd

# 4. Firewall (UFW)
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# 5. Fail2ban for SSH
apt install -y fail2ban
systemctl enable --now fail2ban

# 6. Unattended security upgrades
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

### 1.2 Docker installation

```bash
# Official Docker repo
apt install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Let `deploy` use docker without sudo
usermod -aG docker deploy
```

### 1.3 User accounts

| Account            | Purpose                                               | Where      |
| ------------------ | ----------------------------------------------------- | ---------- |
| `root`             | Initial provisioning only. SSH disabled after `§1.1`. | OS         |
| `deploy`           | Owner of `/srv/ekonaryn`, runs `docker compose`.      | OS         |
| (compose internal) | `node` user inside containers (set in Dockerfiles).   | Containers |

### 1.4 Application layout on disk

```
/srv/ekonaryn/
├── docker-compose.prod.yml      ← from this repo
├── .env.production              ← hand-written, NOT in git
├── deploy/
│   └── Caddyfile                ← from this repo
└── (named volumes managed by Docker, not on the host filesystem directly)
```

---

## 2. Secrets & configuration

### 2.1 `.env.production` layout

`.env.production` lives at `/srv/ekonaryn/.env.production` on the VPS,
mode `0600`, owned by `deploy`. **Never committed to git.**
`.env.example` documents every variable; `.env.production` is its
filled-in counterpart.

```ini
# Database
DATABASE_URL=postgresql://ekonaryn:<rolled>@postgres:5432/ekonaryn

# Postgres init (only used by the postgres container)
POSTGRES_USER=ekonaryn
POSTGRES_PASSWORD=<rolled>
POSTGRES_DB=ekonaryn

# JWT — generate via: openssl rand -base64 48
JWT_SECRET=<rolled>
JWT_REFRESH_SECRET=<rolled>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API
API_PORT=4000
API_URL=https://api.ekonaryn.kg
NODE_ENV=production

# CORS
CORS_ORIGINS=https://ekonaryn.kg,https://app.ekonaryn.kg

# SMS provider gap — see DEPLOYMENT.md §0.8 / §7.1
SKIP_PHONE_VERIFICATION=true

# Frontends — public, browser-visible
NEXT_PUBLIC_API_URL=https://api.ekonaryn.kg/api/v1

# Optional: backup target (rclone remote name)
BACKUP_REMOTE=
BACKUP_BUCKET=
```

### 2.2 Secret rotation procedure

1. Generate new value: `openssl rand -base64 48`.
2. Update `/srv/ekonaryn/.env.production`.
3. `cd /srv/ekonaryn && docker compose -f docker-compose.prod.yml up -d`
   (containers restart with new env).
4. Document the rotation date in your password manager. **Do not push
   the new value anywhere.**

For `JWT_SECRET` rotation specifically: every active access + refresh
token immediately becomes invalid; users have to log in again. This is
intentional — there is no key-id (`kid`) header rotation today.

---

## 3. Containerization

### 3.1 Container topology

Five containers on a single internal network `caddy_net`:

```
                ┌──────────────────────────────┐
   :80/:443 ──▶ │ caddy        (edge / TLS)    │
                └──┬──────────┬─────────┬──────┘
                   │          │         │
                   ▼          ▼         ▼
                ┌──────┐  ┌──────────┐  ┌──────┐
                │website│ │dashboard │  │ api  │
                │ :3000│  │  :3001   │  │ :4000│
                └──────┘  └──────────┘  └──┬───┘
                                            │
                                            ▼
                                    ┌──────────────┐
                                    │  postgres    │
                                    │   :5432      │
                                    └──────────────┘
```

Only `caddy` publishes ports to the host. Everything else is reachable
**only** through Caddy.

### 3.2 Network model

A single user-defined bridge network `caddy_net`. All five services
join it. DNS resolves service-name → container IP automatically
(`postgres:5432` works from inside `api`).

### 3.3 Volumes

| Volume          | Mounted in                                         | Purpose                                 |
| --------------- | -------------------------------------------------- | --------------------------------------- |
| `postgres_data` | `postgres:/var/lib/postgresql/data`                | DB files                                |
| `api_uploads`   | `api:/app/uploads` **and** `caddy:/srv/uploads:ro` | User uploads, served directly by Caddy. |
| `caddy_data`    | `caddy:/data`                                      | TLS certs                               |
| `caddy_config`  | `caddy:/config`                                    | Caddy runtime config                    |

The double-mount of `api_uploads` (read-write for `api`, read-only for
`caddy`) is the pattern that lets us serve `/uploads/*` directly via
Caddy without round-tripping through Express.

### 3.4 Dockerfile structure (referenced by Work Order Task 7)

Pattern used for both Next.js apps. Two stages: `base` (install + build)
and `runtime` (slim, only artifacts).

```dockerfile
# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=20-alpine

# ----------------------------------------------------------------
# Stage 1: build
# ----------------------------------------------------------------
FROM node:${NODE_VERSION} AS base
WORKDIR /repo

# Copy workspace skeleton
COPY package.json package-lock.json turbo.json ./
COPY apps/<APP>/package.json apps/<APP>/
COPY packages/shared/package.json packages/shared/

# Install all workspaces (one big install — npm workspaces dedupes)
RUN npm ci

# Copy source
COPY packages/shared packages/shared
COPY apps/<APP> apps/<APP>

# Build shared first, then the app
RUN npm run -w @ekonaryn/shared build
RUN npm run -w @ekonaryn/<APP> build

# ----------------------------------------------------------------
# Stage 2: runtime
# ----------------------------------------------------------------
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S -G app app

# Copy built next artifacts + minimal node_modules
COPY --from=base --chown=app:app /repo/apps/<APP>/.next ./.next
COPY --from=base --chown=app:app /repo/apps/<APP>/public ./public
COPY --from=base --chown=app:app /repo/apps/<APP>/package.json ./package.json
COPY --from=base --chown=app:app /repo/apps/<APP>/next.config.* ./
COPY --from=base --chown=app:app /repo/node_modules ./node_modules

# Copy the built workspace dep (resolved through node_modules/@ekonaryn/shared symlink)
COPY --from=base --chown=app:app /repo/packages/shared/dist \
     ./node_modules/@ekonaryn/shared/dist

USER app
EXPOSE <PORT>
CMD ["npx", "next", "start", "-p", "<PORT>"]
```

Replace `<APP>` with `website` or `dashboard`, `<PORT>` with `3000` or
`3001`.

> **TODO(deploy):** switch to `output: 'standalone'` in `next.config.*`
> for ~5x smaller images. Does not change runtime behavior but does
> change the copy paths above. Tracked as a follow-up to keep this PR
> behavior-stable.

The API has its own Dockerfile already at `packages/api/Dockerfile`
(used by `docker-compose.yml`). It is reused as-is for production via
`docker-compose.prod.yml`. If it needs updating, that's a separate
follow-up — not in this work order's scope.

### 3.5 `docker-compose.prod.yml` (referenced by Work Order Task 8)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks: [caddy_net]
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U $${POSTGRES_USER}']
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    image: ghcr.io/<owner>/ekonaryn-api:${IMAGE_TAG:-latest}
    restart: unless-stopped
    env_file: .env.production
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - api_uploads:/app/uploads
    networks: [caddy_net]
    expose: ['4000']

  website:
    image: ghcr.io/<owner>/ekonaryn-website:${IMAGE_TAG:-latest}
    restart: unless-stopped
    env_file: .env.production
    depends_on: [api]
    networks: [caddy_net]
    expose: ['3000']

  dashboard:
    image: ghcr.io/<owner>/ekonaryn-dashboard:${IMAGE_TAG:-latest}
    restart: unless-stopped
    env_file: .env.production
    depends_on: [api]
    networks: [caddy_net]
    expose: ['3001']

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./deploy/Caddyfile:/etc/caddy/Caddyfile:ro
      - api_uploads:/srv/uploads:ro
      - caddy_data:/data
      - caddy_config:/config
    networks: [caddy_net]
    depends_on: [api, website, dashboard]

networks:
  caddy_net:
    name: caddy_net

volumes:
  postgres_data:
  api_uploads:
  caddy_data:
  caddy_config:
```

> Replace `<owner>` with your GHCR org/user. `IMAGE_TAG` is set per
> deploy via the env, defaulting to `latest`.

### 3.6 Caddyfile (referenced by Work Order Task 8)

```
{
    email admin@ekonaryn.kg
}

# Public marketing site
ekonaryn.kg, www.ekonaryn.kg {
    encode zstd gzip
    reverse_proxy website:3000
}

# Admin dashboard
app.ekonaryn.kg {
    encode zstd gzip
    reverse_proxy dashboard:3001
}

# API + uploads
api.ekonaryn.kg {
    encode zstd gzip

    # User-uploaded files served directly from the shared volume.
    # The path matches /uploads/<filename> exactly — no traversal.
    handle_path /uploads/* {
        root * /srv/uploads
        file_server
    }

    # Everything else proxies to the Express API
    reverse_proxy api:4000
}
```

Caddy auto-issues TLS certs for all four hostnames on first start.

### 3.7 API Dockerfile (existing)

The API already has a Dockerfile at `packages/api/Dockerfile` that
builds against the workspace. It's reused as-is via `image:` references
in compose — but since our compose pulls from GHCR, the Dockerfile is
only built **in CI** by the workflow added in `§6.1`.

---

## 4. Database

### 4.1 Migrations

Applied via `prisma migrate deploy` (not `migrate dev` — that creates
new migrations interactively).

Run pattern, on the VPS, after pulling new images:

```bash
docker compose -f docker-compose.prod.yml run --rm api \
  npx prisma migrate deploy
```

Migrations live in `packages/db/prisma/migrations/`. The repo currently
has one: `20260508_add_worker_lifecycle_and_activity_log/`.

### 4.2 First-admin bootstrap

The seed script (`packages/db/prisma/seed.ts`) creates **publicly-known
test credentials** and **must never run in production**.

The first real admin is created via Work Order Task 6:
`scripts/create-first-admin.ts`. Run on the VPS:

```bash
docker compose -f docker-compose.prod.yml run --rm api \
  npm run admin:create
```

The script refuses to run if any user with `role: 'ADMIN'` already
exists, so it's safe to leave in the image.

### 4.3 Seeding policy

| Environment                          | Seed?                                                       |
| ------------------------------------ | ----------------------------------------------------------- |
| Local dev (sqlite-was, postgres-now) | Yes — `npm run db:seed` is the canonical path.              |
| CI tests                             | Yes — fresh DB per run, seed creates fixtures.              |
| Production                           | **Never.** The container runs `prisma migrate deploy` only. |

There is no env-gate inside `seed.ts` itself. The discipline is
operational: nobody runs `db:seed` against `.env.production`. We
considered adding a guard but rejected it as the wrong place for
the check (the `prisma` script entry should not know about envs).

---

## 5. Backups & recovery

### 5.1 `backup.sh` (referenced by Work Order Task 8)

```bash
#!/usr/bin/env bash
# Eko Naryn backup. Run from /srv/ekonaryn via cron.
# Outputs: /srv/ekonaryn/backups/<UTC-iso>/{db.sql.gz,uploads.tar.gz}
set -euo pipefail

cd "$(dirname "$0")/../.."   # → /srv/ekonaryn

STAMP=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
DEST="backups/${STAMP}"
mkdir -p "${DEST}"

# 1. Database (SQL dump, gzipped)
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-ekonaryn}" "${POSTGRES_DB:-ekonaryn}" \
  | gzip -9 > "${DEST}/db.sql.gz"

# 2. Uploads (tar.gz of the named volume)
docker run --rm \
  -v ekonaryn_api_uploads:/uploads:ro \
  -v "$(pwd)/${DEST}":/out \
  alpine \
  sh -c "cd /uploads && tar czf /out/uploads.tar.gz ."

# 3. Optional: push off-VPS via rclone
if [ -n "${BACKUP_REMOTE:-}" ] && [ -n "${BACKUP_BUCKET:-}" ]; then
  rclone copy "${DEST}" "${BACKUP_REMOTE}:${BACKUP_BUCKET}/${STAMP}/" \
    --transfers 4 --checkers 8
fi

# 4. Local retention: keep last 7 days
find backups -mindepth 1 -maxdepth 1 -type d -mtime +7 \
  -exec rm -rf {} +

echo "Backup complete: ${DEST}"
```

Schedule via `deploy`'s crontab:

```cron
# Daily at 03:17 UTC (off-peak, off-the-hour)
17 3 * * * /srv/ekonaryn/deploy/scripts/backup.sh >> /srv/ekonaryn/backups/cron.log 2>&1
```

### 5.2 Off-VPS storage

The backup script supports an optional rclone push to any
remote-name configured on the box (S3, B2, GDrive, …). Set
`BACKUP_REMOTE` and `BACKUP_BUCKET` in `.env.production`.

**v1 minimum:** at least one off-VPS copy. The single-VPS rationale
(`§0.4`) is only acceptable if backups land somewhere else.

### 5.3 Restore procedure

```bash
# 1. Stop app containers (keep postgres up)
docker compose -f docker-compose.prod.yml stop api website dashboard

# 2. Restore DB
gunzip -c /path/to/db.sql.gz | docker compose -f docker-compose.prod.yml \
  exec -T postgres psql -U ekonaryn -d ekonaryn

# 3. Restore uploads
docker run --rm \
  -v ekonaryn_api_uploads:/uploads \
  -v $(pwd):/in \
  alpine \
  sh -c "cd /uploads && tar xzf /in/uploads.tar.gz"

# 4. Restart
docker compose -f docker-compose.prod.yml up -d
```

---

## 6. CI/CD

### 6.1 GitHub Actions image build

**Not yet implemented.** Sketch:

- New workflow `.github/workflows/release.yml`, triggered on
  `push` to a release branch (e.g. `release/*`) or a tag.
- Three matrix builds: `api`, `website`, `dashboard`.
- Each builds the corresponding Dockerfile, tags `:${{ github.sha }}`
  and `:latest`, pushes to `ghcr.io/<owner>/ekonaryn-<service>`.
- Requires `GITHUB_TOKEN` with `packages: write` permission.

This belongs in a follow-up PR. The "pre-deployment hardening" work
order (Task 7) only adds the Dockerfiles themselves.

### 6.2 SSH-based deploy

After the release workflow lands, deploy is:

```bash
ssh deploy@<vps>
cd /srv/ekonaryn
echo "IMAGE_TAG=<git-sha>" > .env.deploy
docker compose --env-file .env.production --env-file .env.deploy \
  -f docker-compose.prod.yml pull
docker compose --env-file .env.production --env-file .env.deploy \
  -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml run --rm api \
  npx prisma migrate deploy
```

This sequence is also captured in `§8.2`.

---

## 7. Open questions (gating decisions)

> **Stop condition for the work order:** if a task requires picking
> one of the answers below, escalate. Don't pick for the maintainer.

### 7.1 SMS provider

**Options:**

| Provider                 | Pros                                            | Cons                                                       |
| ------------------------ | ----------------------------------------------- | ---------------------------------------------------------- |
| Twilio                   | Solid global delivery, well-documented Node SDK | Pricey for KG; export-control rules sometimes limit access |
| Vonage (Nexmo)           | Good KG delivery rates                          | UX of dashboard is dated                                   |
| Beeline KG / MTT KG / O! | Local rates, native Cyrillic support            | Smaller, less polished APIs; usually contract-only         |

**Decision needed:** which one? **v1 default is `SKIP_PHONE_VERIFICATION=true`**
until this is answered (`§0.8`).

### 7.2 Mobile production base URL

The mobile release default is `https://api.ekonaryn.kg/api/v1`
(`apps/mobile/app/build.gradle:12`). Is `ekonaryn.kg`:

1. Already registered and pointed at this VPS?
2. Registered but not yet pointed?
3. Not yet registered?

**Decision needed:** confirm domain status. Until a domain is live the
mobile release can't actually be cut.

### 7.3 GDPR / data-retention posture

Soft-deleted users keep their `name` visible through historical
collections / requests (per `routes/users.ts:319-329`). For workers
specifically, the ID-document scan is also kept indefinitely.

**Decision needed:**

- Is "soft-delete keeps name in history" the right answer?
- When a worker is rejected, do we **delete the ID document scan**, or
  retain it for fraud-investigation purposes? (Currently it's kept.)
- What's the data-export response time we promise users on request?

Reference: `0.5 Data lifecycle`, `0.6 Threat model summary`.

### 7.4 Refresh-token rotation

`/auth/refresh` issues a new pair without invalidating the old refresh
token. A stolen refresh token is valid for 7 days.

**Decision needed:**

- Implement rotation now (one new commit) or after first deploy?
- If now: where does the denylist live (postgres table vs Redis)?

This is **out of scope** for the pre-deployment hardening work order
but should land before public launch.

### 7.5 File-content scanning / antivirus

Uploaded ID docs and collection photos are not scanned for malware.

**Decision needed:** acceptable for v1?

If yes: ship and re-evaluate at first incident.
If no: **ClamAV sidecar**, scan on upload, quarantine on hit. ~1 day of
work; not in this work order.

### 7.6 Object storage migration

Local disk in a named volume works fine for one VPS. Breaks the moment
a second API replica is added. Migration to S3-compatible object
storage (Hetzner Object Storage, B2, MinIO) is a refactor of
`packages/api/src/utils/upload.ts`.

**Decision needed:** when? My recommendation: **after first 6 months of
real traffic**, when load patterns are visible.

---

## 8. Operational runbook

### 8.1 First-time deploy

1. Provision VPS (`§1.1`, `§1.2`).
2. `ssh deploy@vps`.
3. `git clone <repo> /srv/ekonaryn` (pulls `docker-compose.prod.yml`,
   `deploy/Caddyfile`, `deploy/scripts/backup.sh`).
4. Hand-write `/srv/ekonaryn/.env.production` (`§2.1`). `chmod 0600`.
5. Wait for DNS to propagate (`api.`, `app.`, apex).
6. `cd /srv/ekonaryn && docker compose -f docker-compose.prod.yml pull`
   (pulls images from GHCR).
7. `docker compose -f docker-compose.prod.yml up -d postgres`
   (Postgres only, wait for `pg_isready`).
8. `docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy`.
9. `docker compose -f docker-compose.prod.yml run --rm api npm run admin:create`
   (creates first admin, prompts for phone + password).
10. `docker compose -f docker-compose.prod.yml up -d`.
11. Caddy auto-issues TLS certs for all four hostnames. Watch logs:
    `docker compose -f docker-compose.prod.yml logs -f caddy`.
12. Browse to `https://app.ekonaryn.kg`, log in as the admin.

### 8.2 Routine deploy

```bash
ssh deploy@vps
cd /srv/ekonaryn
echo "IMAGE_TAG=<new-sha>" > .env.deploy
docker compose --env-file .env.production --env-file .env.deploy \
  -f docker-compose.prod.yml pull
docker compose --env-file .env.production --env-file .env.deploy \
  -f docker-compose.prod.yml up -d
docker compose --env-file .env.production --env-file .env.deploy \
  -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
```

Total downtime per service: ~5 seconds for api, ~10 seconds for
Next.js apps (rolling-restart-ish since each is a single replica).

### 8.3 Rollback

```bash
echo "IMAGE_TAG=<previous-sha>" > .env.deploy
docker compose --env-file .env.production --env-file .env.deploy \
  -f docker-compose.prod.yml up -d
```

If a migration shipped with the bad release: **DO NOT auto-rollback the
DB.** Restore from the most recent backup (`§5.3`).

### 8.4 Database emergency

Out-of-disk on Postgres volume:

```bash
# 1. Drop ActivityLog rows older than 90 days
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U ekonaryn -d ekonaryn \
  -c "DELETE FROM \"ActivityLog\" WHERE \"createdAt\" < NOW() - INTERVAL '90 days';"

# 2. VACUUM FULL
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U ekonaryn -d ekonaryn -c "VACUUM FULL;"

# 3. Restart
docker compose -f docker-compose.prod.yml restart postgres
```

This is a **stop-gap**. A real `ActivityLog` rotation policy is on the
roadmap (`§0.5`).

---

_End of DEPLOYMENT.md draft. Update section anchors only with deliberate
intent — they are referenced by the pre-deployment work order._
