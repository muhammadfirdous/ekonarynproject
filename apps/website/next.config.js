/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ekonaryn/shared'],
  // TODO(deploy): switch to output: 'standalone' for ~5x smaller production
  // images. Tracked as a follow-up because it changes the runtime entry
  // point (.next/standalone/server.js) and the Dockerfile's COPY paths.
};

module.exports = nextConfig;
