/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  transpilePackages: ['@dc-beauty/ui', '@dc-beauty/utils'],
  experimental: {
    esmExternals: 'loose'
  }
};

module.exports = nextConfig;