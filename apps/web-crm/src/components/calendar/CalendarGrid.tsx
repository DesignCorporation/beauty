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
  end: 22,  // 22:00
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
    const topPosition = ((startMinutes - workingStartMinutes) / WORKING_HOURS.interval) * 2; // 2rem per slot
    
    const duration = differenceInMinutes(end, start);
    const height = (duration / WORKING_HOURS.interval) * 2; // 2rem per slot
    
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
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="grid grid-cols-8 border-l border-gray-200">
        {/* Time column */}
        <div className="border-r border-gray-200 bg-gray-50">
          <div className="h-16 border-b border-gray-200"></div> {/* Header space */}
          {timeSlots.map((slot, index) => (
            <div 
              key={index}
              className="h-8 border-b border-gray-100 flex items-center justify-end pr-2 text-xs text-gray-500"
            >
              {slot.minute === 0 && formatTimeSlot(slot.hour, slot.minute)}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day, dayIndex) => (
          <div key={dayIndex} className="border-r border-gray-200 relative">
            {/* Day header */}
            <div className={`h-16 border-b border-gray-200 p-3 text-center ${
              isToday(day) ? 'bg-blue-50' : 'bg-white'
            }`}>
              <div className="text-xs text-gray-500 uppercase">
                {format(day, 'EEE', { locale: pl })}
              </div>
              <div className={`text-lg font-semibold mt-1 ${
                isToday(day) ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {format(day, 'd')}
              </div>
            </div>

            {/* Time slots */}
            <div className="relative">
              {timeSlots.map((slot, slotIndex) => (
                <div
                  key={slotIndex}
                  className="h-8 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleSlotClick(day, slot)}
                />
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
                      left: '4px',
                      right: '4px',
                      zIndex: 10
                    }}
                    onClick={() => onAppointmentClick(appointment.id)}
                    onDrop={onAppointmentDrop}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
