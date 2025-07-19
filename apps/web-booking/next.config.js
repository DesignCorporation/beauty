/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
  images: {
    domains: ['beauty.designcorp.eu'],
  },
  // ISR revalidation
  experimental: {
    isrMemoryCacheSize: 0,
  },
};

module.exports = nextConfig;
