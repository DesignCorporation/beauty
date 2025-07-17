// TP-02: TypeScript types for tenant context

export interface RequestTenantContext {
  salonId: string;         // обязательный для tenant-scoped эндпоинтов
  salonSlug?: string;      // slug из поддомена (если применимо)
  plan?: 'STARTER' | 'PRO' | 'ENTERPRISE';
  locales?: {
    primary: string;
    supported: string[];
  };
  // роль текущего юзера внутри салона
  role?: 'OWNER' | 'ADMIN' | 'STAFF' | 'READONLY';
  // userId, если есть auth
  userId?: string;
  // источник, откуда взяли tenant (jwt | host | header | query)
  source: string;
}

// Salon config for tenant resolution
export interface SalonConfig {
  id: string;
  slug: string;
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';
  primaryLocale: string;
  supportedLocales: string[];
}

// List of models that require tenant filtering
export const TENANTED_MODELS = new Set([
  'SalonSocialLinks',
  'Staff',
  'Client',
  'Service',
  'ServiceTranslation',
  'Appointment',
  'AppointmentService',
  'TimeOff',
  'MessageLog',
  'AgentSkill'
]);

// augment Express Request type
declare module 'express-serve-static-core' {
  interface Request {
    tenant?: RequestTenantContext;
  }
}
