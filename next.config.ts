import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withPWA from "next-pwa";

const BUILD_OUTPUT = process.env.NEXT_STANDALONE_OUTPUT
  ? "standalone"
  : undefined;

export default () => {
  const nextConfig: NextConfig = {
    output: BUILD_OUTPUT,
    cleanDistDir: true,
    devIndicators: {
      position: "bottom-right",
    },
    experimental: {
      taint: true,
    },
  };
  const withNextIntl = createNextIntlPlugin();
  const withPwa = withPWA({
    dest: "public",
    disable: process.env.NODE_ENV !== "production",
    cacheOnFrontEndNav: true,
    register: true,
    skipWaiting: true,
  });
  return withNextIntl(withPwa(nextConfig));
};
