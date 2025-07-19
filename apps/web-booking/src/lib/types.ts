// ========================================
// TypeScript Interfaces for Beauty Platform
// ========================================

export interface Salon {
  id: string;
  slug: string;
  displayName: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  };
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    telegram?: string;
    whatsapp?: string;
  };
  primaryLocale: string;
  supportedLocales: string[];
  publicDefaultLocale?: string;
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';
  baseCurrency: string;
}

export interface Service {
  id: string;
  code: string;
  name: string;
  description?: string;
  durationMin: number;
  priceAmount: number;
  priceCurrency: string;
  category: string;
  active: boolean;
}

export interface Staff {
  id: string;
  name: string;
  role: 'MASTER' | 'ADMIN' | 'RECEPTION' | 'OTHER';
  spokenLocales: string[];
  color?: string;
  active: boolean;
  speaksClientLang?: boolean; // Computed field for UI
}

export interface AvailabilitySlot {
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  staffId?: string;
  available: boolean;
  duration?: number; // minutes
}

export interface BookingRequest {
  client: {
    name: string;
    phone: string;
    email: string;
    preferredLocale: string;
  };
  services: string[]; // Service codes
  staffId?: string;
  date: string;
  time: string;
  notes?: string;
}

export interface BookingResponse {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED';
  appointment: {
    id: string;
    startAt: string;
    endAt: string;
    totalPrice: number;
    currency: string;
  };
  confirmationCode?: string;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

export interface MessageHistory {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'agent';
  timestamp: string;
  locale?: string;
}

// ========================================
// Component Props Interfaces
// ========================================

export interface HeroProps {
  salon: Salon;
  locale: string;
  onBookingClick?: () => void;
}

export interface LanguageSwitcherProps {
  currentLocale: string;
  availableLocales: string[];
  onLanguageChange: (locale: string) => void;
  className?: string;
}

export interface ServiceListProps {
  services: Service[];
  locale: string;
  onServiceSelect?: (service: Service) => void;
  selectedServices?: string[];
  showPrices?: boolean;
  groupByCategory?: boolean;
}

export interface StaffListProps {
  staff: Staff[];
  locale: string;
  clientLanguage?: string;
  onStaffSelect?: (staff: Staff) => void;
  selectedStaffId?: string;
  showLanguageWarning?: boolean;
}

export interface CalendarSlotsProps {
  availableSlots: AvailabilitySlot[];
  locale: string;
  onSlotSelect?: (slot: AvailabilitySlot) => void;
  selectedSlot?: AvailabilitySlot;
  minDate?: string;
  maxDate?: string;
}

export interface BookingFormProps {
  selectedServices: Service[];
  selectedStaff?: Staff;
  selectedSlot?: AvailabilitySlot;
  locale: string;
  salon: Salon;
  onSubmit: (booking: BookingRequest) => Promise<BookingResponse>;
  onBack?: () => void;
  isSubmitting?: boolean;
}

export interface ChatWidgetProps {
  locale: string;
  salonSlug: string;
  isOpen?: boolean;
  onToggle?: () => void;
  position?: 'bottom-right' | 'bottom-left';
}

// ========================================
// API Response Types
// ========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ServiceCategoryGroup {
  category: string;
  categoryName: Record<string, string>; // Localized names
  services: Service[];
  totalServices: number;
}

export interface AvailabilityResponse {
  date: string;
  slots: AvailabilitySlot[];
  staffAvailability: Record<string, AvailabilitySlot[]>;
}

// ========================================
// Utility Types
// ========================================

export type SupportedLocale = 'pl' | 'en' | 'uk' | 'ru';

export type ServiceCategory = 
  | 'hair' 
  | 'nails' 
  | 'brows_lashes' 
  | 'skin_face' 
  | 'waxing' 
  | 'barber' 
  | 'spa' 
  | 'package';

export type Currency = 'PLN' | 'EUR' | 'UAH' | 'USD' | 'GBP' | 'CZK';

export type BookingStep = 'services' | 'staff' | 'datetime' | 'details' | 'confirmation';

// ========================================
// Form Types
// ========================================

export interface ClientFormData {
  name: string;
  phone: string;
  email: string;
  preferredLocale: SupportedLocale;
  notes?: string;
}

export interface BookingFormErrors {
  name?: string;
  phone?: string;
  email?: string;
  services?: string;
  slot?: string;
  general?: string;
}

// ========================================
// Constants
// ========================================

export const SUPPORTED_LANGUAGES: Record<SupportedLocale, Language> = {
  pl: { 
    code: 'pl', 
    name: 'Polski', 
    flag: '🇵🇱', 
    nativeName: 'Polski' 
  },
  en: { 
    code: 'en', 
    name: 'English', 
    flag: '🇬🇧', 
    nativeName: 'English' 
  },
  uk: { 
    code: 'uk', 
    name: 'Українська', 
    flag: '🇺🇦', 
    nativeName: 'Українська' 
  },
  ru: { 
    code: 'ru', 
    name: 'Русский', 
    flag: '🇷🇺', 
    nativeName: 'Русский' 
  },
};

export const SERVICE_CATEGORIES: Record<ServiceCategory, Record<SupportedLocale, string>> = {
  hair: {
    pl: 'Fryzjerstwo',
    en: 'Hair Services',
    uk: 'Перукарські послуги',
    ru: 'Парикмахерские услуги'
  },
  nails: {
    pl: 'Manicure & Pedicure',
    en: 'Nails',
    uk: 'Манікюр та педикюр',
    ru: 'Маникюр и педикюр'
  },
  brows_lashes: {
    pl: 'Brwi i rzęsy',
    en: 'Brows & Lashes',
    uk: 'Брови та вії',
    ru: 'Брови и ресницы'
  },
  skin_face: {
    pl: 'Kosmetyka twarzy',
    en: 'Facial & Skincare',
    uk: 'Догляд за обличчям',
    ru: 'Уход за лицом'
  },
  waxing: {
    pl: 'Depilacja',
    en: 'Waxing & Hair Removal',
    uk: 'Депіляція',
    ru: 'Депиляция'
  },
  barber: {
    pl: 'Usługi barberskie',
    en: 'Barber Services',
    uk: 'Барбер послуги',
    ru: 'Барбер услуги'
  },
  spa: {
    pl: 'SPA & Masaże',
    en: 'SPA & Massage',
    uk: 'СПА та масажі',
    ru: 'СПА и массаж'
  },
  package: {
    pl: 'Pakiety usług',
    en: 'Service Packages',
    uk: 'Пакети послуг',
    ru: 'Пакеты услуг'
  }
};
