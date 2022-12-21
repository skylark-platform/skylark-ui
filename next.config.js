/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false, // https://github.com/TanStack/table/issues/4610
};

module.exports = nextConfig;
