import React, { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays, subDays, addWeeks, subWeeks, startOfWeek } from 'date-fns';
import { pl } from 'date-fns/locale';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { CalendarFilters } from '../components/calendar/CalendarFilters';
import { AppointmentModal } from '../components/calendar/AppointmentModal';
import { useAppointments } from '../hooks/useAppointments';
import { useTenant } from '../hooks/useTenant';
import type { CalendarView, AppointmentFilters } from '../types/calendar';

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState<AppointmentFilters>({
    staffIds: [],
    statuses: ['PENDING', 'CONFIRMED', 'COMPLETED']
  });
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [newAppointmentSlot, setNewAppointmentSlot] = useState<Date | null>(null);
  
  const { salonId, token } = useTenant();
  const { appointments, loading, error, rescheduleAppointment, updateStatus } = useAppointments({
    date: currentDate,
    view,
    filters,
    salonId,
    token
  });

  const navigateDate = (direction: 'prev' | 'next') => {
    switch (view) {
      case 'day':
        setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
        break;
      default:
        break;
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDateTitle = () => {
    switch (view) {
      case 'day':
        return format(currentDate, 'EEEE, d MMMM yyyy', { locale: pl });
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        return format(weekStart, 'MMMM yyyy', { locale: pl });
      default:
        return format(currentDate, 'MMMM yyyy', { locale: pl });
    }
  };

  const handleSlotClick = (datetime: Date) => {
    setNewAppointmentSlot(datetime);
    setShowNewAppointment(true);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kalendarz</h1>
            <p className="mt-1 text-sm text-gray-500">
              Zarządzaj wizytami i dostępnością
            </p>
          </div>
          <button 
            onClick={() => setShowNewAppointment(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nowa wizyta
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-semibold text-gray-900 min-w-0">
                {getDateTitle()}
              </h2>
              <button 
                onClick={goToToday}
                className="btn-secondary text-sm"
              >
                Dzisiaj
              </button>
            </div>
            
            <button 
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => setView('day')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'day' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              Dzień
            </button>
            <button 
              onClick={() => setView('week')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'week' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              Tydzień
            </button>
            <button 
              onClick={() => setView('month')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'month' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              Miesiąc
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Filters */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <CalendarFilters
            filters={filters}
            onFiltersChange={setFilters}
            salonId={salonId}
            token={token}
          />
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-hidden">
          {error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <CalendarIcon className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Błąd ładowania</h3>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
              </div>
            </div>
          ) : (
            <CalendarGrid
              view={view}
              currentDate={currentDate}
              appointments={appointments}
              onAppointmentClick={setSelectedAppointment}
              onSlotClick={handleSlotClick}
              onAppointmentDrop={rescheduleAppointment}
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* Appointment Modal */}
      {selectedAppointment && (
        <AppointmentModal
          appointmentId={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onUpdate={updateStatus}
        />
      )}

      {/* New Appointment Modal */}
      {showNewAppointment && (
        <AppointmentModal
          appointmentId={null}
          initialDate={newAppointmentSlot}
          onClose={() => {
            setShowNewAppointment(false);
            setNewAppointmentSlot(null);
          }}
          onUpdate={updateStatus}
        />
      )}
    </div>
  );
}
