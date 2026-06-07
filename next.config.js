/** @type {import('next').NextConfig} */

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
const WS_API = API.replace(/^http/, "ws"); // ws://… / wss://… of the backend
const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy tuned to what the app actually loads: self, the
// FastAPI backend (fetch), and the two web-font CDNs. Inline styles are used
// throughout (style={{…}}), so 'unsafe-inline' is required for style-src; dev
// also needs 'unsafe-eval' + ws: for React Fast Refresh.
//
// R2 domains are needed for presigned PUT uploads (*.r2.cloudflarestorage.com)
// and for rendering images from the public R2 CDN (*.r2.dev).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://*.r2.dev",
  "font-src 'self' https://cdn.fontshare.com https://fonts.gstatic.com data:",
  `connect-src 'self' ${API} ${WS_API} https://cdn.fontshare.com https://fonts.gstatic.com https://*.r2.cloudflarestorage.com https://*.r2.dev${isDev ? " ws: wss:" : ""}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // typedRoutes intentionally disabled — we build href strings dynamically
  // for /chats/[id] etc. Re-enable later by routing through typed helpers.
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
