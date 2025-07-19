/**
 * TP-07: Booking API v1 - TypeScript Interfaces
 * Complete type definitions for public booking system
 */

// === Request Types ===

export interface BookingClientRequest {
  name: string;
  phone: string;
  email?: string;
  preferredLocale?: string;
}

export interface BookingAppointmentRequest {
  date: string;         // YYYY-MM-DD
  startTime: string;    // HH:mm
  serviceIds: string[]; // Array of service codes or IDs
  staffId?: string;     // Optional, auto-select if not provided
  notes?: string;
}

export interface BookingRequest {
  client: BookingClientRequest;
  appointment: BookingAppointmentRequest;
}

export interface AvailabilityRequest {
  date: string;           // YYYY-MM-DD
  serviceIds: string[];   // Required for duration calculation
  staffId?: string;       // Optional (any available staff)
  duration?: number;      // Override total duration
}

export interface CancelRequest {
  reason?: string;
  cancelledBy: 'CLIENT' | 'SALON';
}

export interface RescheduleRequest {
  newDate: string;        // YYYY-MM-DD
  newStartTime: string;   // HH:mm
  newStaffId?: string;
}

// === Response Types ===

export interface ServiceResponse {
  id: string;
  code: string;
  name: string;           // Localized name
  description?: string;   // Localized description
  durationMin: number;
  priceAmount: number;
  priceCurrency: string;
  category: string;
}

export interface StaffResponse {
  id: string;
  name: string;
  spokenLocales: string[];
  speaksClientLanguage: boolean;
  availableServices: string[];  // Future feature: services this staff can perform
  color?: string;               // Calendar color
  role: string;
}

export interface TimeSlot {
  startTime: string;      // HH:mm format
  endTime: string;        // HH:mm format
  staffId: string;
  staffName: string;
  available: boolean;
  reason?: string;        // If unavailable: "busy" | "time_off" | "outside_hours"
}

export interface WorkingHours {
  start: string;          // HH:mm
  end: string;            // HH:mm
  dayOfWeek: number;      // 0=Sunday, 1=Monday, etc.
}

export interface AvailabilityResponse {
  date: string;
  slots: TimeSlot[];
  workingHours: WorkingHours;
  bufferMinutes: number;
  serviceIds: string[];
  totalDuration: number;
}

export interface AppointmentDetails {
  date: string;
  startTime: string;
  endTime: string;
  services: ServiceResponse[];
  staff: StaffResponse;
  totalDuration: number;
  totalPrice: number;
  currency: string;
}

export interface BookingResponse {
  appointmentId: string;
  clientId: string;
  status: 'PENDING' | 'CONFIRMED';
  confirmationCode: string;
  appointmentDetails: AppointmentDetails;
  languageWarning?: string;
  nextSteps: {
    confirmationSent: boolean;
    channels: ('EMAIL' | 'TELEGRAM')[];
  };
}

export interface CancelResponse {
  success: boolean;
  newStatus: 'CANCELED';
  refundEligible: boolean;
  cancellationCode: string;
}

// === Warning & Error Types ===

export interface LanguageWarning {
  staffId: string;
  message: string;
}

export interface BookingWarning {
  type: 'LANGUAGE_MISMATCH' | 'TIME_CONFLICT' | 'STAFF_UNAVAILABLE';
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

// === Internal Service Types ===

export interface AvailabilityCalculationParams {
  salonId: string;
  date: Date;
  serviceIds: string[];
  staffId?: string;
  totalDuration: number;
  bufferMinutes?: number;
}

export interface BookingValidationResult {
  valid: boolean;
  errors: string[];
  warnings: BookingWarning[];
}

export interface SlotConflict {
  appointmentId: string;
  startAt: Date;
  endAt: Date;
  staffId: string;
  type: 'APPOINTMENT' | 'TIME_OFF' | 'BREAK';
}

// === Database Entity Extensions ===

export interface AppointmentWithDetails {
  id: string;
  salonId: string;
  clientId: string;
  staffId: string | null;
  startAt: Date;
  endAt: Date;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELED';
  notes: string | null;
  client: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    preferredLocale: string | null;
  };
  staff: {
    id: string;
    name: string;
    spokenLocales: string[];
    color: string | null;
  } | null;
  services: {
    id: string;
    serviceId: string;
    priceOverride: number | null;
    durationOverride: number | null;
    service: {
      id: string;
      code: string;
      baseName: string;
      baseDescription: string | null;
      durationMin: number;
      priceAmount: number;
      priceCurrency: string;
      category: string | null;
    };
  }[];
}

// === Utility Types ===

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELED';
export type MessageChannel = 'EMAIL' | 'TELEGRAM' | 'WEB_CHAT' | 'WHATSAPP';
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sunday = 0

// === Configuration Types ===

export interface BookingConfig {
  bufferMinutes: number;
  maxAdvanceBookingDays: number;
  minAdvanceBookingHours: number;
  defaultWorkingHours: WorkingHours[];
  enableDoubleBookingProtection: boolean;
  enableLanguageWarnings: boolean;
  autoSelectStaff: boolean;
}

// === API Response Wrappers ===

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    salonSlug?: string;
    locale?: string;
    timestamp?: string;
    total?: number;
    [key: string]: any;
  };
  warnings?: BookingWarning[];
  errors?: string[];
}

export interface ApiError {
  error: string;
  message: string;
  code?: string;
  details?: any;
  requestId?: string;
}
