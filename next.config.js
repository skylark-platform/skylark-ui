/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/beta/closed",
        permanent: true,
      },
      {
        source: "/beta/connect",
        destination: "/beta/closed",
        permanent: true,
      },
      {
        source: "/developer/:path*",
        destination: "/beta/closed",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
