import { useState, useEffect } from 'react';

interface TenantContext {
  salonId: string;
  token: string;
  isAuthenticated: boolean;
}

export const useTenant = (): TenantContext => {
  const [context, setContext] = useState<TenantContext>({
    salonId: '',
    token: '',
    isAuthenticated: false
  });

  useEffect(() => {
    try {
      // Get token from localStorage (set during login)
      const token = localStorage.getItem('authToken');
      
      if (token) {
        try {
          // Decode JWT token to get salonId (tenant ID)
          const payload = JSON.parse(atob(token.split('.')[1]));
          const salonId = payload.tid || payload.salonId; // tenant ID from JWT
          
          if (salonId) {
            setContext({
              salonId,
              token,
              isAuthenticated: true
            });
          }
        } catch (error) {
          console.error('Failed to decode token:', error);
          // Clear invalid token
          localStorage.removeItem('authToken');
        }
      } else {
        // For development/testing - use demo salon
        const demoSalonId = 'demo-salon-id';
        const demoToken = 'demo-token';
        
        setContext({
          salonId: demoSalonId,
          token: demoToken,
          isAuthenticated: true
        });
      }
    } catch (error) {
      console.error('Error in useTenant:', error);
      // Fallback to demo values
      setContext({
        salonId: 'demo-salon-id',
        token: 'demo-token',
        isAuthenticated: true
      });
    }
  }, []);

  return context;
};
