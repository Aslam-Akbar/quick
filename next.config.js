/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    forceSwcTransforms: true,
  },
  output: "standalone",
  reactStrictMode: true,
  trailingSlash: false,
};

module.exports = nextConfig;
