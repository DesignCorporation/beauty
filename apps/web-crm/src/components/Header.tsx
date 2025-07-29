import React from 'react';
import { Bell, Search, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div 
      className="relative z-10 flex-shrink-0 flex h-16"
      style={{ 
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)'
      }}
    >
      {/* Mobile menu button - FLAT */}
      <button
        type="button"
        className="px-4 md:hidden"
        style={{ 
          borderRight: '1px solid var(--border-color)',
          color: 'var(--text-secondary)'
        }}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Search bar - FLAT DESIGN */}
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex">
          <div className="w-full flex md:ml-0">
            <label htmlFor="search-field" className="sr-only">
              Search
            </label>
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-3">
                <Search className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
              </div>
              <input
                id="search-field"
                className="input-field pl-10"
                placeholder="Szukaj klientów, usług..."
                type="search"
                style={{
                  backgroundColor: 'var(--bg-hover)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Right side - FLAT DESIGN */}
        <div className="ml-4 flex items-center md:ml-6 space-x-4">
          {/* Notifications - FLAT */}
          <button
            type="button"
            className="p-2 rounded-lg transition-colors"
            style={{ 
              backgroundColor: 'var(--bg-hover)',
              color: 'var(--text-secondary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-active)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <Bell className="h-5 w-5" />
          </button>

          {/* User menu - FLAT DESIGN */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {user?.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {user?.role}
              </p>
            </div>
            
            <div 
              className="h-8 w-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--pastel-peach)' }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg transition-colors"
              title="Wyloguj się"
              style={{ 
                backgroundColor: 'var(--bg-hover)',
                color: 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--pastel-pink)';
                e.currentTarget.style.color = '#991B1B';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
