/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  
  // Отключаем оптимизацию изображений для статического экспорта
  images: {
    unoptimized: true
  },
  
  // Отключаем встроенный ESLint во время сборки
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript проверки
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Экспериментальные фичи
  experimental: {
    esmExternals: 'loose'
  },
  
  // Вебпак конфигурация
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;