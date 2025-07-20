import { HelloBeauty } from '@dc-beauty/ui';
import { createBeautyConfig, formatCurrency } from '@dc-beauty/utils';

export default function HomePage() {
  const config = createBeautyConfig();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <HelloBeauty message="Welcome to Beauty Platform - Book Your Perfect Look!" />
      
      <div className="max-w-4xl mx-auto mt-12 space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🚀 Platform Status
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
              <div className="text-sm text-gray-600">CI/CD</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-blue-600 font-bold text-xl">🔧</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            📋 Features Completed
          </h2>
          <div className="space-y-3">
            {config.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <span className="text-green-500">✅</span>
                <span className="capitalize">{feature.replace('-', ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            💡 Technical Stack
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Backend</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Node.js 22 + Express</li>
                <li>• PostgreSQL + Prisma ORM</li>
                <li>• Multi-tenant Architecture</li>
                <li>• JWT Authentication</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Frontend</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• React 18 + TypeScript</li>
                <li>• Next.js 14 + Tailwind CSS</li>
                <li>• Multi-language Support</li>
                <li>• Responsive Design</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm">
          <p>API Version: {config.version} | 
             Example Price: {formatCurrency(50, 'PLN')} | 
             Status: Active Development
          </p>
        </div>
      </div>
    </div>
  );
}