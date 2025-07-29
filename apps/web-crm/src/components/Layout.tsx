import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, salon } = useAuth();

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="main-content-area">
        {/* Header */}
        <Header />
        
        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
