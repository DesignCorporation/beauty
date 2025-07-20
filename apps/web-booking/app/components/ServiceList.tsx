export default function ServiceList({ salonSlug }: { salonSlug: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-semibold mb-2">Hair Cut</h3>
        <p className="text-gray-600 mb-4">Professional hair cutting and styling</p>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-purple-600">$35</span>
          <span className="text-sm text-gray-500">45 min</span>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-semibold mb-2">Manicure</h3>
        <p className="text-gray-600 mb-4">Classic nail care and polish</p>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-purple-600">$25</span>
          <span className="text-sm text-gray-500">30 min</span>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-semibold mb-2">Facial</h3>
        <p className="text-gray-600 mb-4">Deep cleansing facial treatment</p>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-purple-600">$55</span>
          <span className="text-sm text-gray-500">60 min</span>
        </div>
      </div>
    </div>
  )
}
