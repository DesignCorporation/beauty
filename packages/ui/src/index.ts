import React from 'react';

export interface HelloBeautyProps {
  name: string;
}

export function HelloBeauty({ name }: HelloBeautyProps): JSX.Element {
  return (
    <div style={{ 
      padding: '1rem', 
      border: '1px solid #e0e0e0', 
      borderRadius: '8px',
      backgroundColor: '#f8f9fa',
      color: '#333'
    }}>
      <p>👋 Hello {name} from @dc-beauty/ui!</p>
    </div>
  );
}

export {};
