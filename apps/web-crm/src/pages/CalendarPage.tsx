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
    <div className="h-full flex flex-col">
      {/* Header with Fresha-style gradient */}
      <div className="card-header mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Kalendarz</h1>
            <p className="text-purple-100 text-sm">
              Zarządzaj wizytami i dostępnością
            </p>
          </div>
          <button 
            onClick={() => setShowNewAppointment(true)}
            className="btn-primary interactive"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nowa wizyta
          </button>
        </div>
      </div>

      {/* Navigation with improved styling */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-purple-50 rounded-xl transition-all duration-200 text-purple-600 hover:text-purple-700 interactive"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold min-w-0" style={{ color: 'var(--purple-primary)' }}>
                {getDateTitle()}
              </h2>
              <button 
                onClick={goToToday}
                className="btn-secondary interactive"
              >
                Dzisiaj
              </button>
            </div>
            
            <button 
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-purple-50 rounded-xl transition-all duration-200 text-purple-600 hover:text-purple-700 interactive"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          {/* View toggle buttons with Fresha styling */}
          <div className="flex space-x-1 bg-gray-50 p-1 rounded-xl">
            <button 
              onClick={() => setView('day')}
              className={`view-toggle-btn ${view === 'day' ? 'active' : ''}`}
            >
              Dzień
            </button>
            <button 
              onClick={() => setView('week')}
              className={`view-toggle-btn ${view === 'week' ? 'active' : ''}`}
            >
              Tydzień
            </button>
            <button 
              onClick={() => setView('month')}
              className={`view-toggle-btn ${view === 'month' ? 'active' : ''}`}
            >
              Miesiąc
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Sidebar Filters with improved design */}
        <div className="w-80 overflow-y-auto">
          <CalendarFilters
            filters={filters}
            onFiltersChange={setFilters}
            salonId={salonId}
            token={token}
          />
        </div>

        {/* Calendar Grid with Fresha styling */}
        <div className="flex-1 overflow-hidden">
          {error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center card max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <CalendarIcon className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Błąd ładowania</h3>
                <p className="text-gray-600">{error}</p>
              </div>
            </div>
          ) : (
            <div className="calendar-grid h-full">
              <CalendarGrid
                view={view}
                currentDate={currentDate}
                appointments={appointments}
                onAppointmentClick={setSelectedAppointment}
                onSlotClick={handleSlotClick}
                onAppointmentDrop={rescheduleAppointment}
                loading={loading}
              />
            </div>
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
