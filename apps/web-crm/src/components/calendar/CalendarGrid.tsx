import React, { useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, addMinutes, differenceInMinutes } from 'date-fns';
import { pl } from 'date-fns/locale';
import { AppointmentBlock } from './AppointmentBlock';
import { CurrentTimeLine } from './CurrentTimeLine';
import type { CalendarAppointment, CalendarView } from '../../types/calendar';

interface CalendarGridProps {
  view: CalendarView;
  currentDate: Date;
  appointments: CalendarAppointment[];
  onAppointmentClick: (appointmentId: string) => void;
  onSlotClick: (datetime: Date) => void;
  onAppointmentDrop: (appointmentId: string, newStartAt: string, newStaffId?: string) => void;
  loading: boolean;
}

const WORKING_HOURS = {
  start: 7, // 7:00
  end: 20,  // 20:00 (changed from 22:00 for better UX)
  interval: 30 // minutes
};

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  view,
  currentDate,
  appointments,
  onAppointmentClick,
  onSlotClick,
  onAppointmentDrop,
  loading
}) => {
  const days = useMemo(() => {
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
    return [currentDate];
  }, [currentDate, view]);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = WORKING_HOURS.start; hour < WORKING_HOURS.end; hour++) {
      for (let minute = 0; minute < 60; minute += WORKING_HOURS.interval) {
        slots.push({ hour, minute });
      }
    }
    return slots;
  }, []);

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.startAt), day)
    );
  };

  const getAppointmentPosition = (appointment: CalendarAppointment) => {
    const start = new Date(appointment.startAt);
    const end = new Date(appointment.endAt);
    
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const workingStartMinutes = WORKING_HOURS.start * 60;
    const topPosition = ((startMinutes - workingStartMinutes) / WORKING_HOURS.interval) * 3.5; // Increased from 2rem to 3.5rem for better visibility
    
    const duration = differenceInMinutes(end, start);
    const height = Math.max((duration / WORKING_HOURS.interval) * 3.5, 3.5); // Minimum height 3.5rem
    
    return { top: topPosition, height };
  };

  const handleSlotClick = (day: Date, slot: { hour: number; minute: number }) => {
    const datetime = new Date(day);
    datetime.setHours(slot.hour, slot.minute, 0, 0);
    onSlotClick(datetime);
  };

  const formatTimeSlot = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Ładowanie kalendarza...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="h-full overflow-auto">
        {/* FRESHA-STYLE GRID */}
        <div className="calendar-grid-container">
          {/* Header Row */}
          <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
            <div className="grid" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
              {/* Time column header */}
              <div className="h-16 border-r border-gray-200 bg-gray-50"></div>
              
              {/* Day headers */}
              {days.map((day, dayIndex) => (
                <div 
                  key={dayIndex} 
                  className={`h-16 p-3 text-center border-r border-gray-200 ${
                    isToday(day) ? 'bg-blue-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="text-xs text-gray-500 uppercase font-medium">
                    {format(day, 'EEE', { locale: pl })}
                  </div>
                  <div className={`text-lg font-bold mt-1 ${
                    isToday(day) ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time Grid */}
          <div className="relative">
            <div className="grid" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
              {/* Time slots column */}
              <div className="border-r border-gray-200 bg-gray-50">
                {timeSlots.map((slot, index) => (
                  <div 
                    key={index}
                    className="h-14 border-b border-gray-100 flex items-start justify-end pr-3 pt-1"
                  >
                    {slot.minute === 0 && (
                      <span className="text-xs text-gray-500 font-medium">
                        {formatTimeSlot(slot.hour, slot.minute)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map((day, dayIndex) => (
                <div key={dayIndex} className="border-r border-gray-200 relative">
                  {timeSlots.map((slot, slotIndex) => (
                    <div
                      key={slotIndex}
                      className="h-14 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors relative group"
                      onClick={() => handleSlotClick(day, slot)}
                    >
                      {/* Hover indicator */}
                      <div className="absolute inset-0 bg-blue-100 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none" />
                      
                      {/* Time indicator on hover */}
                      {slot.minute === 0 && (
                        <div className="absolute top-1 left-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatTimeSlot(slot.hour, slot.minute)}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Current time line */}
                  {isToday(day) && <CurrentTimeLine />}

                  {/* Appointments */}
                  {getAppointmentsForDay(day).map((appointment) => {
                    const position = getAppointmentPosition(appointment);
                    return (
                      <AppointmentBlock
                        key={appointment.id}
                        appointment={appointment}
                        style={{
                          position: 'absolute',
                          top: `${position.top}rem`,
                          height: `${position.height}rem`,
                          left: '6px',
                          right: '6px',
                          zIndex: 10
                        }}
                        onClick={() => onAppointmentClick(appointment.id)}
                        onDrop={onAppointmentDrop}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {appointments.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-50">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Brak wizyt</h3>
              <p className="text-xs text-gray-500 mb-3">Kliknij w dowolny slot, aby dodać wizytę</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
