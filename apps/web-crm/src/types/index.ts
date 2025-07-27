export interface User {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'STAFF' | 'READONLY';
}

export interface Salon {
  id: string;
  displayName: string;
  slug: string;
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';
  primaryLocale: string;
  supportedLocales: string[];
}

export interface AuthState {
  user: User | null;
  salon: Salon | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
