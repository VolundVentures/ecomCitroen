import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@citroen-store/rihla-agent",
    "@citroen-store/brand-citroen",
    "@citroen-store/configurator-3d",
    "@citroen-store/market-config",
    "@citroen-store/replicate-adapter",
    "@citroen-store/ui",
  ],
  experimental: {
    optimizePackageImports: ["@react-three/drei", "@react-three/fiber"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "assets.citroen.ma" },
      { protocol: "https", hostname: "replicate.delivery" },
    ],
  },
  async headers() {
    return [
      {
        // The iframe-embeddable widget — must be loadable from any origin.
        // Override the implicit X-Frame-Options DENY some hosts add by default.
        source: "/embed/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
          { key: "X-Frame-Options", value: "ALLOWALL" },
        ],
      },
      {
        // The drop-in loader script — hosts include it via <script src=…>,
        // so it must be CORS-readable and cacheable.
        source: "/embed.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=300" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
