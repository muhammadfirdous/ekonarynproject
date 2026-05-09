# syntax=docker/dockerfile:1.7
# Production image for @ekonaryn/website. Pattern from DEPLOYMENT.md §3.4.
# Build context is the REPO ROOT (so node_modules workspace symlinks resolve).
#   docker build -f apps/website/Dockerfile -t ekonaryn-website:dev .
ARG NODE_VERSION=20-alpine

# ============================================================================
# Stage 1: build — install workspaces, build @ekonaryn/shared, build website
# ============================================================================
FROM node:${NODE_VERSION} AS base
WORKDIR /repo

# Workspace skeleton first so npm ci can populate node_modules without
# pulling in source files (better Docker layer caching for subsequent
# rebuilds where only source changed).
COPY package.json package-lock.json turbo.json tsconfig.json ./
COPY apps/website/package.json apps/website/
COPY apps/dashboard/package.json apps/dashboard/
COPY packages/api/package.json packages/api/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/

# Install once for every workspace; npm dedupes.
RUN npm ci

# Source for shared + this app only — no need to pull in api/dashboard/db.
COPY packages/shared packages/shared
COPY apps/website apps/website

# Build shared first; the website transpilePackages it but still imports the
# compiled types from dist/.
RUN npm run -w @ekonaryn/shared build
RUN npm run -w @ekonaryn/website build

# ============================================================================
# Stage 2: runtime — slim image, only artifacts + node_modules
# ============================================================================
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S -G app app

COPY --from=base --chown=app:app /repo/apps/website/.next ./.next
COPY --from=base --chown=app:app /repo/apps/website/package.json ./package.json
COPY --from=base --chown=app:app /repo/apps/website/next.config.* ./
COPY --from=base --chown=app:app /repo/node_modules ./node_modules

# COPY follows symlinks. node_modules/@ekonaryn/shared is a workspace symlink
# in dev that points back at packages/shared; the COPY above resolves it to
# the symlink target's contents. The explicit dist copy below makes the path
# robust against the symlink not surviving the cross-stage transfer.
COPY --from=base --chown=app:app /repo/packages/shared/dist \
     ./node_modules/@ekonaryn/shared/dist

USER app
EXPOSE 3000
# Honor $PORT when set by the platform (Railway, Fly, etc.); fall back to 3000
# for local docker-compose runs.
CMD ["sh", "-c", "npx next start -p ${PORT:-3000}"]
