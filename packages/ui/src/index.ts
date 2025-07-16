import React from 'react';

export const HelloBeauty: React.FC<{ name?: string }> = ({ name = 'Beauty' }) => {
  return React.createElement('div', {
    style: {
      padding: '1rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      borderRadius: '8px',
      textAlign: 'center',
    },
  }, `Hello, ${name}!`);
};
