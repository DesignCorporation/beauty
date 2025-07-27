import React from 'react';
import { Calendar, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarPage() {
  return (
    <div>
      {/* Page header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kalendarz</h1>
          <p className="mt-1 text-sm text-gray-500">
            Zarządzaj wizytami i dostępnością
          </p>
        </div>
        <button className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Nowa wizyta
        </button>
      </div>

      {/* Calendar controls */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              Lipiec 2025
            </h2>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="flex space-x-2">
            <button className="btn-secondary">Dzień</button>
            <button className="btn-primary">Tydzień</button>
            <button className="btn-secondary">Miesiąc</button>
          </div>
        </div>
      </div>

      {/* Calendar placeholder */}
      <div className="card">
        <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Kalendarz w budowie</h3>
            <p className="mt-1 text-sm text-gray-500">
              Wkrótce tutaj będzie pełny kalendarz z wizytami
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}