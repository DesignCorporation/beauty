/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  
  // Отключаем встроенный ESLint, используем свой
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript конфигурация
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Оптимизации
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  }
};

module.exports = nextConfig;
