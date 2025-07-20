import React from 'react';

export interface HelloBeautyProps {
  message?: string;
}

export const HelloBeauty: React.FC<HelloBeautyProps> = ({ 
  message = "Beauty Platform - Modern SaaS for Beauty Salons" 
}) => {
  return React.createElement('div', {
    style: {
      padding: '2rem',
      textAlign: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      borderRadius: '8px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }
  }, [
    React.createElement('h1', { key: 'title' }, '💄 Beauty Platform'),
    React.createElement('p', { key: 'message' }, message),
    React.createElement('small', { key: 'version' }, 'v1.0.0 - MultiTenant SaaS')
  ]);
};

export default HelloBeauty;