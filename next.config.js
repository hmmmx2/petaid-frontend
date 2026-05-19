/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // typedRoutes intentionally disabled — we build href strings dynamically
  // for /chats/[id] etc. Re-enable later by routing through typed helpers.
};

module.exports = nextConfig;
