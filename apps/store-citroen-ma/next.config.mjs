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
};

export default withNextIntl(nextConfig);
