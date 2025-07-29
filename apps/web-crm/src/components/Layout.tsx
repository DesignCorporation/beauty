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
        
        {/* Page content with FULL WIDTH - no max-width constraints */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6" style={{ background: 'var(--bg-main)' }}>
          <div className="w-full animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
