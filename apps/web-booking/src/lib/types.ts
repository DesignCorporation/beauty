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
  };
  primaryLocale: string;
  supportedLocales: string[];
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';
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
  role: 'MASTER' | 'ADMIN' | 'RECEPTION';
  spokenLocales: string[];
  color?: string;
  active: boolean;
  speaksClientLang?: boolean;
}

export interface AvailabilitySlot {
  date: string;
  time: string;
  staffId?: string;
  available: boolean;
}

export interface BookingRequest {
  client: {
    name: string;
    phone: string;
    email: string;
    preferredLocale: string;
  };
  services: string[];
  staffId?: string;
  date: string;
  time: string;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface BookingResponse {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED';
  client: {
    name: string;
    phone: string;
    email: string;
  };
  services: Service[];
  staff?: Staff;
  startAt: string;
  endAt: string;
  totalPrice: number;
  currency: string;
}
