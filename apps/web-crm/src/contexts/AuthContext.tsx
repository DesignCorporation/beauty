import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, User, Salon, LoginCredentials } from '../types';
import apiClient from '../lib/api';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; salon: Salon; token: string } }
  | { type: 'AUTH_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  salon: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        salon: action.payload.salon,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        salon: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        salon: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await apiClient.post('/auth/login', credentials);
      const { user, salon, token } = response;
      
      localStorage.setItem('beauty_token', token);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, salon, token } });
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('beauty_token');
    localStorage.removeItem('beauty_demo_user');
    dispatch({ type: 'LOGOUT' });
  };

  const refreshUser = async () => {
    try {
      // Check for demo data first
      const demoData = localStorage.getItem('beauty_demo_user');
      if (demoData) {
        const parsedDemo = JSON.parse(demoData);
        dispatch({ type: 'AUTH_SUCCESS', payload: parsedDemo });
        return;
      }

      // Try real API
      const response = await apiClient.get('/auth/me');
      const { user, salon } = response;
      const token = localStorage.getItem('beauty_token');
      
      if (token) {
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, salon, token } });
      }
    } catch (error) {
      // If API fails but we have demo data, don't clear it
      const demoData = localStorage.getItem('beauty_demo_user');
      if (!demoData) {
        dispatch({ type: 'AUTH_FAILURE' });
        localStorage.removeItem('beauty_token');
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('beauty_token');
    const demoData = localStorage.getItem('beauty_demo_user');
    
    if (token || demoData) {
      refreshUser();
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
