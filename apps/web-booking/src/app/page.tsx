import { HelloBeauty } from '@dc-beauty/ui';
import { createBeautyConfig, formatCurrency } from '@dc-beauty/utils';
import Link from 'next/link';

export default function HomePage() {
  const config = createBeautyConfig();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <HelloBeauty message="🚀 Beauty Platform is LIVE - Professional Salon Management!" />
      
      <div className="max-w-4xl mx-auto mt-12 space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            ✅ Production Status - WORKING!
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-green-600 font-bold text-xl">✅</div>
              <div className="text-sm text-gray-600">Backend API</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-green-600 font-bold text-xl">✅</div>
              <div className="text-sm text-gray-600">Database</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-green-600 font-bold text-xl">✅</div>
              <div className="text-sm text-gray-600">CI/CD Deploy</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-green-600 font-bold text-xl">🎨</div>
              <div className="text-sm text-gray-600">UI Updates</div>
            </div>
          </div>
        </div>

        {/* Demo Pages Navigation */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🎨 Live Demo Pages
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              href="/calendar" 
              className="block p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-transparent hover:border-blue-300 transition-all duration-300 hover:shadow-lg group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📅</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Salon Calendar</h3>
              <p className="text-gray-600 text-sm">Fresha-style appointment calendar with time slots, staff management, and real-time updates</p>
              <div className="mt-3 text-blue-600 text-sm font-medium">Try it now →</div>
            </Link>
            
            <div className="block p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-3xl mb-3">🏪</div>
              <h3 className="text-lg font-semibold text-gray-500 mb-2">Salon Microsite</h3>
              <p className="text-gray-500 text-sm">Coming soon: Public booking page for individual salons with online appointment system</p>
              <div className="mt-3 text-gray-400 text-sm">In development...</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🎯 MVP Features Complete
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">✅ Core Platform</h3>
              {config.features.slice(0, Math.ceil(config.features.length/2)).map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <span className="text-green-500">•</span>
                  <span className="capitalize text-sm">{feature.replace('-', ' ')}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">🚀 Advanced Features</h3>
              {config.features.slice(Math.ceil(config.features.length/2)).map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <span className="text-green-500">•</span>
                  <span className="capitalize text-sm">{feature.replace('-', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            ⚡ Technology Stack
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                <span className="text-lg mr-2">🛠️</span> Backend
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Node.js 18+ + Express</li>
                <li>• PostgreSQL + Prisma ORM</li>
                <li>• Multi-tenant Architecture</li>
                <li>• JWT Authentication</li>
                <li>• n8n Automation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                <span className="text-lg mr-2">🎨</span> Frontend
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• React 18 + TypeScript</li>
                <li>• Next.js 14 + Tailwind CSS</li>
                <li>• Responsive Design</li>
                <li>• Heroicons + Modern UI</li>
                <li>• GitHub Pages Deploy</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                <span className="text-lg mr-2">🌍</span> Features
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Multi-language (PL/RU/UA/EN)</li>
                <li>• Multi-currency (6 currencies)</li>
                <li>• 40+ Beauty Services</li>
                <li>• Booking & Reminders</li>
                <li>• Telegram Integration</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm bg-gray-50 rounded-lg p-4">
          <p className="mb-2">
            <strong>Live Production Platform</strong> | API Version: {config.version} | Example Price: {formatCurrency(50, 'PLN')}
          </p>
          <p className="text-xs">
            🚀 Deployed on GitHub Pages | 🔧 CI/CD Active | 📊 Multi-tenant SaaS Ready
          </p>
        </div>
      </div>
    </div>
  );
}