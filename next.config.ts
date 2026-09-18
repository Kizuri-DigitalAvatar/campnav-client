import type { NextConfig } from "next";

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

// Routes the app served at the top level before it moved under /campnav.
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
        destination: "/campnav/:section/:rest*",
        permanent: false,
      },
      {
        // `/home` only ever existed between the landing page landing and this
        // move; redirect it too so no in-flight link breaks.
        source: "/home",
        destination: "/campnav",
        permanent: false,
      },
    ];
  },
};

export default withPWA(nextConfig);
