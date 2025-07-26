import React from 'react';

interface HelloBeautyProps {
  name?: string;
  message?: string;
}

export const HelloBeauty: React.FC<HelloBeautyProps> = ({ name, message }) => {
  const displayText = message || `Hello, ${name || 'Beauty'}!`;
  
  return (
    <div className="p-6 border rounded-xl bg-gradient-to-r from-pink-100 via-purple-50 to-blue-100 shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{displayText}</h1>
      <p className="text-gray-600 text-lg">Professional Beauty Salon Management Platform</p>
      <div className="mt-4 flex space-x-4 text-sm text-gray-500">
        <span>🌍 Multi-language</span>
        <span>💰 Multi-currency</span>
        <span>📅 Smart booking</span>
        <span>📨 Auto-messaging</span>
      </div>
    </div>
  );
};
