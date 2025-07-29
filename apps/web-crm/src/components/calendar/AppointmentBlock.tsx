import React, { useState } from 'react';
import { format } from 'date-fns';
import { Clock, User, DollarSign } from 'lucide-react';
import type { CalendarAppointment } from '../../types/calendar';

interface AppointmentBlockProps {
  appointment: CalendarAppointment;
  style?: React.CSSProperties;
  onClick: () => void;
  onDrop: (appointmentId: string, newStartAt: string, newStaffId?: string) => void;
}

const statusStyles = {
  PENDING: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  CONFIRMED: 'bg-blue-50 border-blue-200 text-blue-800',
  COMPLETED: 'bg-green-50 border-green-200 text-green-800',
  CANCELED: 'bg-red-50 border-red-200 text-red-800'
};

const statusLabels = {
  PENDING: 'Oczekująca',
  CONFIRMED: 'Potwierdzona', 
  COMPLETED: 'Zakończona',
  CANCELED: 'Anulowana'
};

export const AppointmentBlock: React.FC<AppointmentBlockProps> = ({
  appointment,
  style,
  onClick,
  onDrop
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('appointmentId', appointment.id);
    e.dataTransfer.setData('sourceStartAt', appointment.startAt);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const formatTime = (datetime: string) => {
    return format(new Date(datetime), 'HH:mm');
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  return (
    <div
      style={style}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={`
        rounded-lg border-l-4 p-2 cursor-pointer transition-all duration-200 shadow-sm
        ${statusStyles[appointment.status]}
        ${isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'}
      `}
    >
      {/* Time */}
      <div className="flex items-center text-xs font-medium mb-1">
        <Clock className="h-3 w-3 mr-1" />
        {formatTime(appointment.startAt)} - {formatTime(appointment.endAt)}
      </div>

      {/* Client */}
      <div className="flex items-center text-sm font-semibold mb-1">
        <User className="h-3 w-3 mr-1" />
        {appointment.clientName}
      </div>

      {/* Service */}
      <div className="text-xs text-gray-600 mb-1 line-clamp-1">
        {appointment.serviceNames.join(', ')}
      </div>

      {/* Price */}
      <div className="flex items-center text-xs font-medium">
        <DollarSign className="h-3 w-3 mr-1" />
        {formatPrice(appointment.price, appointment.currency)}
      </div>

      {/* Status badge */}
      <div className="mt-1">
        <span className="inline-block px-1.5 py-0.5 text-xs font-medium rounded">
          {statusLabels[appointment.status]}
        </span>
      </div>
    </div>
  );
};
