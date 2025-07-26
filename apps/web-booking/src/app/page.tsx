import { HelloBeauty } from '@dc-beauty/ui';
import { createBeautyConfig, formatCurrency } from '@dc-beauty/utils';

export default function HomePage() {
  const config = createBeautyConfig();
  
  return (
    <>
      {/* Hero Section */}
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        {/* Navigation */}
        <nav className="w-full bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Beauty Platform</h1>
              </div>
              <div className="flex items-center space-x-6">
                <a href="/calendar" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">Calendar</a>
                <a href="#features" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">Features</a>
                <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30 mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Live Production Platform</span>
            </div>
            
            <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Professional<br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Beauty Management
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Современная SaaS платформа для автоматизации салонов красоты. 
              Многоязычная поддержка, мульти-валютность, интеграция с Telegram и автоматизация n8n.
            </p>
            
            <div className="flex items-center justify-center space-x-4 mb-16">
              <a 
                href="/calendar" 
                className="bg-indigo-600 text-white px-8 py-4 rounded-xl hover:bg-indigo-700 transition-all duration-300 font-medium text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                🗓️ View Calendar Demo
              </a>
              <button className="bg-white text-gray-700 px-8 py-4 rounded-xl hover:bg-gray-50 transition-all duration-300 font-medium text-lg border border-gray-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                📖 Documentation
              </button>
            </div>
            
            <HelloBeauty message="🚀 Beauty Platform is LIVE - Professional Salon Management!" />
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/30">
              <div className="text-3xl font-bold text-indigo-600 mb-2">40+</div>
              <div className="text-gray-600 font-medium">Beauty Services</div>
            </div>
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/30">
              <div className="text-3xl font-bold text-purple-600 mb-2">6</div>
              <div className="text-gray-600 font-medium">Currencies</div>
            </div>
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/30">
              <div className="text-3xl font-bold text-pink-600 mb-2">4</div>
              <div className="text-gray-600 font-medium">Languages</div>
            </div>
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/30">
              <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-gray-600 font-medium">Automation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">🎯 Production Ready Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Полнофункциональная платформа с мультитенантной архитектурой и современным UI/UX
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-8 border border-indigo-200">
              <div className="text-3xl mb-4">🗓️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fresha-style Calendar</h3>
              <p className="text-gray-600">Профессиональный календарь с временными слотами, управлением мастерами и реальным временем</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 border border-purple-200">
              <div className="text-3xl mb-4">🏢</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Multi-tenant SaaS</h3>
              <p className="text-gray-600">Жесткая изоляция данных между салонами с автоматической фильтрацией по salonId</p>
            </div>
            
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-8 border border-pink-200">
              <div className="text-3xl mb-4">🌍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Multi-language</h3>
              <p className="text-gray-600">Поддержка Polish, Russian, Ukrainian, English с автопереводами</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 border border-green-200">
              <div className="text-3xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Multi-currency</h3>
              <p className="text-gray-600">EUR, PLN, UAH, USD, GBP, CZK с автоконверсией и локализацией цен</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">n8n Automation</h3>
              <p className="text-gray-600">Автоматические напоминания, birthday поздравления, winback кампании</p>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-8 border border-yellow-200">
              <div className="text-3xl mb-4">📱</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Telegram Integration</h3>
              <p className="text-gray-600">Messaging Hub с поддержкой Telegram, Email, Web-chat для коммуникации</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">⚡ Modern Tech Stack</h2>
            <p className="text-xl text-gray-600">
              Production-ready архитектура с лучшими практиками разработки
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">🛠️</span> Backend
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Node.js 18+ + Express.js</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">PostgreSQL + Prisma ORM</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Multi-tenant Architecture</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">JWT Authentication</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">🎨</span> Frontend
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">React 18 + TypeScript</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">Next.js 14 + Tailwind CSS</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">Responsive Design</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">GitHub Pages Deploy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <h3 className="text-2xl font-bold">Beauty Platform</h3>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Professional SaaS platform for beauty salon automation with multi-tenant architecture, 
              multi-language support, and modern UI/UX design.
            </p>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-400 text-sm">
              <strong>API Version:</strong> {config.version} | 
              <strong>Example Price:</strong> {formatCurrency(50, 'PLN')} | 
              <strong>Status:</strong> 🟢 Production Ready
            </p>
            <p className="text-gray-500 text-xs mt-2">
              © 2025 Beauty Platform by DesignCorp. Multi-tenant SaaS | CI/CD Active | TypeScript + React
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}