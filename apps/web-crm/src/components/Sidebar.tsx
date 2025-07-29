import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Scissors, 
  Users, 
  Users2,
  Settings,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Kalendarz', href: '/calendar', icon: Calendar },
  { name: 'Usługi', href: '/services', icon: Scissors },
  { name: 'Klienci', href: '/clients', icon: Users },
  { name: 'Zespół', href: '/team', icon: Users2 },
];

const secondaryNavigation = [
  { name: 'Ustawienia', href: '/settings', icon: Settings },
  { name: 'Pomoc', href: '/help', icon: HelpCircle },
];

export default function Sidebar() {
  const { salon, user } = useAuth();
  const location = useLocation();

  return (
    <div className="sidebar-container">
      <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: 'var(--bg-surface)' }}>
        {/* Logo and salon info - FLAT DESIGN */}
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div 
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--pastel-lavender)' }}
                >
                  <Sparkles className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Beauty CRM
                </h1>
              </div>
            </div>
          </div>
          
          {salon && (
            <div className="mt-5 px-4">
              <div 
                className="rounded-lg p-3 border"
                style={{ 
                  backgroundColor: 'var(--bg-hover)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {salon.displayName}
                </p>
                <p className="text-xs uppercase" style={{ color: 'var(--text-secondary)' }}>
                  {salon.plan}
                </p>
              </div>
            </div>
          )}

          {/* Primary Navigation - FLAT STYLE */}
          <nav className="mt-6 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'sidebar-link',
                    isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Secondary Navigation - FLAT */}
        <div className="flex-shrink-0" style={{ borderTop: '1px solid var(--border-color)' }}>
          <nav className="px-2 py-4 space-y-1">
            {secondaryNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'sidebar-link',
                    isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User info - FLAT DESIGN */}
        {user && (
          <div className="flex-shrink-0 p-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div 
                  className="h-8 w-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--pastel-peach)' }}
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {user.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
