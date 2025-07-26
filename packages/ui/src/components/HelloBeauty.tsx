import React from 'react';

interface HelloBeautyProps {
  name: string;
}

export const HelloBeauty: React.FC<HelloBeautyProps> = ({ name }) => {
  return (
    <div className="p-4 border rounded-lg bg-gradient-to-r from-pink-100 to-purple-100">
      <h2 className="text-xl font-semibold text-gray-800">Hello, {name}!</h2>
      <p className="text-gray-600">Welcome to Beauty Platform</p>
    </div>
  );
};
