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
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
        {/* Logo and salon info */}
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">Beauty CRM</h1>
              </div>
            </div>
          </div>
          
          {salon && (
            <div className="mt-5 px-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900">{salon.displayName}</p>
                <p className="text-xs text-gray-500 uppercase">{salon.plan}</p>
              </div>
            </div>
          )}

          {/* Primary Navigation */}
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

        {/* Secondary Navigation */}
        <div className="flex-shrink-0 border-t border-gray-200">
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

        {/* User info */}
        {user && (
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-accent-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-accent-800">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
