import type { NextConfig } from "next";

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

// Routes the app served at the top level before it moved under /app.
// Kept as redirects so existing bookmarks, deep links in old notification
// emails and already-installed PWAs keep working.
const LEGACY_APP_ROUTES = [
  "assignments",
  "available-tasks",
  "delivery",
  "facilities",
  "history",
  "house-keeping",
  "hse",
  "laundry",
  "login",
  "maintenance",
  "meals",
  "profile",
  "requests",
  "rnr",
  "room-service",
  "search",
  "services",
  "settings",
  "shop",
  "updates",
  "welcome",
].join("|");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: `/:section(${LEGACY_APP_ROUTES})/:rest*`,
        destination: "/app/:section/:rest*",
        permanent: false,
      },
      {
        // `/home` only ever existed between the landing page landing and this
        // move; redirect it too so no in-flight link breaks.
        source: "/home",
        destination: "/app",
        permanent: false,
      },
      {
        // The app lived under `/campnav` before moving to `/app`. Notification
        // emails already delivered carry `/campnav/...` deep links, and PWAs
        // installed in that window have `/campnav` as their start_url, so this
        // has to keep resolving rather than 404.
        source: "/campnav/:rest*",
        destination: "/app/:rest*",
        permanent: false,
      },
    ];
  },
};

export default withPWA(nextConfig);
