FROM node:20-alpine AS base

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json* ./
COPY turbo.json tsconfig.json ./

# Copy package manifests
COPY packages/api/package.json ./packages/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY packages/api ./packages/api

# Generate Prisma client
RUN cd packages/db && npx prisma generate

# Build db package (produces dist/ with type declarations needed by api)
RUN cd packages/db && npm run build

# Build shared package
RUN cd packages/shared && npm run build

# Build API
RUN cd packages/api && npm run build

EXPOSE 4000

CMD ["node", "packages/api/dist/index.js"]
