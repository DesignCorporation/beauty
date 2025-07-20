export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">Beauty Platform</h1>
        <p className="text-xl mb-8">Coming Soon</p>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-2xl font-semibold mb-4">🚀 Platform Status</h2>
          <div className="space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span>Backend API</span>
              <span className="text-green-300">✅</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Database</span>
              <span className="text-green-300">✅</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Multi-tenant</span>
              <span className="text-green-300">✅</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Frontend</span>
              <span className="text-yellow-300">🔧</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
