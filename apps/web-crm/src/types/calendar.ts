export type CalendarView = 'day' | 'week' | 'month';

export interface AppointmentFilters {
  staffIds: string[];
  statuses: AppointmentStatus[];
}

export interface CalendarAppointment {
  id: string;
  clientId: string;
  clientName: string;
  staffId: string;
  staffName: string;
  staffColor?: string;
  serviceIds: string[];
  serviceNames: string[];
  startAt: string; // ISO datetime
  endAt: string;
  status: AppointmentStatus;
  price: number;
  currency: string;
  notes?: string;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED';

export interface TimeSlot {
  datetime: Date;
  hour: number;
  minute: number;
  available: boolean;
}

export interface CalendarConfig {
  workingHours: {
    start: number; // 7 for 7:00
    end: number;   // 22 for 22:00
    interval: number; // 30 minutes
  };
  statusColors: Record<AppointmentStatus, string>;
}

export interface DragDropData {
  appointmentId: string;
  sourceSlot: string;
  targetSlot: string;
  newStaffId?: string;
}
