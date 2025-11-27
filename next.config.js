/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    // Ignore build-time type errors (helps with Vercel builds)
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  },
  // Disable static generation for routes directory to allow runtime database access
  experimental: {
    isrMemoryCacheSize: 0,
  },
};

module.exports = nextConfig;
