import React, { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { format, addDays, subDays, addWeeks, subWeeks, startOfWeek } from 'date-fns';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { CalendarFilters } from '../components/calendar/CalendarFilters';
import { AppointmentModal } from '../components/calendar/AppointmentModal';
import { useAppointments } from '../hooks/useAppointments';
import { useTenant } from '../hooks/useTenant';
import type { CalendarView, AppointmentFilters } from '../types/calendar';

// ДЕМО записи для календаря (временные для тестирования)
const demoAppointments = [
  {
    id: 'demo-1',
    clientName: 'Anna Kowalska',
    serviceNames: ['Strzyżenie damskie'],
    staffName: 'Magdalena',
    startAt: '2025-07-30T10:00:00Z',
    endAt: '2025-07-30T11:00:00Z',
    status: 'CONFIRMED' as const,
    price: 35,
    currency: 'PLN',
    notes: ''
  },
  {
    id: 'demo-2',
    clientName: 'Maria Nowak', 
    serviceNames: ['Manicure hybrydowy'],
    staffName: 'Anna',
    startAt: '2025-07-30T14:00:00Z',
    endAt: '2025-07-30T15:00:00Z',
    status: 'PENDING' as const,
    price: 30,
    currency: 'PLN',
    notes: ''
  },
  {
    id: 'demo-3',
    clientName: 'Katarzyna Wiśniewska',
    serviceNames: ['Koloryzacja pełna'],
    staffName: 'Magdalena',
    startAt: '2025-07-31T09:00:00Z', 
    endAt: '2025-07-31T11:00:00Z',
    status: 'CONFIRMED' as const,
    price: 70,
    currency: 'PLN',
    notes: ''
  }
];

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
  const { appointments, loading, error, rescheduleAppointment, updateStatus, refetch } = useAppointments({
    date: currentDate,
    view,
    filters,
    salonId,
    token
  });

  // Объединяем реальные записи с демо записями
  const allAppointments = [...(appointments || []), ...demoAppointments];

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
        return format(currentDate, 'EEEE, d MMMM yyyy');
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        return format(weekStart, 'MMMM yyyy');
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  };

  const handleSlotClick = (datetime: Date) => {
    setNewAppointmentSlot(datetime);
    setShowNewAppointment(true);
  };

  const handleUpdateAppointment = async (appointmentId: string, status: any) => {
    if (appointmentId === 'new') {
      // This is a new appointment, refresh the calendar
      await refetch();
    } else {
      // This is an existing appointment status update
      await updateStatus(appointmentId, status);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - FLAT DESIGN */}
      <div style={{ 
        backgroundColor: 'var(--pastel-lavender)', 
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid var(--border-color)'
      }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Kalendarz
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Zarządzaj wizytami i dostępnością
            </p>
          </div>
          <button 
            onClick={() => setShowNewAppointment(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nowa wizyta
          </button>
        </div>
      </div>

      {/* Error Banner - ALWAYS VISIBLE IF ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 mb-1">
              Nie udało się załadować wizyt
            </h3>
            <p className="text-sm text-red-600 mb-3">
              {error}. Kalendarz działa w trybie offline.
            </p>
            <button
              onClick={refetch}
              className="text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition-colors"
            >
              Spróbuj ponownie
            </button>
          </div>
        </div>
      )}

      {/* Navigation - FLAT DESIGN */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigateDate('prev')}
              className="p-2 rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-gray-900">
                {getDateTitle()}
              </h2>
              <button 
                onClick={goToToday}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              >
                Dzisiaj
              </button>
            </div>
            
            <button 
              onClick={() => navigateDate('next')}
              className="p-2 rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          {/* View toggle buttons - FLAT STYLE */}
          <div className="flex space-x-1 p-1 rounded-lg bg-gray-100">
            <button 
              onClick={() => setView('day')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                view === 'day' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Dzień
            </button>
            <button 
              onClick={() => setView('week')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                view === 'week' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tydzień
            </button>
            <button 
              onClick={() => setView('month')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                view === 'month' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Miesiąc
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - FULL WIDTH */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Sidebar Filters */}
        <div className="w-80 overflow-y-auto">
          <CalendarFilters
            filters={filters}
            onFiltersChange={setFilters}
            salonId={salonId}
            token={token}
          />
        </div>

        {/* Calendar Grid - ALWAYS RENDER WITH DEMO DATA */}
        <div className="flex-1 overflow-hidden">
          <div className="calendar-grid h-full">
            <CalendarGrid
              view={view}
              currentDate={currentDate}
              appointments={allAppointments}
              onAppointmentClick={setSelectedAppointment}
              onSlotClick={handleSlotClick}
              onAppointmentDrop={rescheduleAppointment}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* Existing Appointment Modal */}
      {selectedAppointment && (
        <AppointmentModal
          appointmentId={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onUpdate={handleUpdateAppointment}
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
          onUpdate={handleUpdateAppointment}
        />
      )}
    </div>
  );
}