/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@dc-beauty/ui', '@dc-beauty/utils'],
  eslint: {
    ignoreDuringBuilds: true, // Use root ESLint config
  },
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
};

export default nextConfig;
