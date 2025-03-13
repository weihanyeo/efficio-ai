'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, User, Bell, Shield, Palette, Keyboard, Bot, Zap, LogOut, Briefcase } from 'lucide-react';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { NotificationSettings } from '../components/settings/NotificationSettings';
import { SecuritySettings } from '../components/settings/SecuritySettings';
import { AppearanceSettings } from '../components/settings/AppearanceSettings';
import { ShortcutSettings } from '../components/settings/ShortcutSettings';
import { AISettings } from './onboarding/AISettings';
import { IntegrationSettings } from '../components/settings/IntegrationSettings';
import { WorkspaceSettings } from '../components/settings/WorkspaceSettings';
import { useAuth } from '../contexts/AuthContext';

const SettingsNav = () => {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { icon: <User size={16} />, label: 'Profile', path: '/settings/profile' },
    { icon: <Briefcase size={16} />, label: 'Workspace', path: '/settings/workspace' },
    { icon: <Bell size={16} />, label: 'Notifications', path: '/settings/notifications' },
    { icon: <Shield size={16} />, label: 'Security', path: '/settings/security' },
    { icon: <Palette size={16} />, label: 'Appearance', path: '/settings/appearance' },
    { icon: <Keyboard size={16} />, label: 'Shortcuts', path: '/settings/shortcuts' },
    { icon: <Bot size={16} />, label: 'AI Assistant', path: '/settings/ai' },
    { icon: <Zap size={16} />, label: 'Integrations', path: '/settings/integrations' },
  ];

  return (
    <nav className="w-60 border-r border-[#262626]">
      <div className="p-4 border-b border-[#262626]">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Settings
        </h2>
      </div>
      <div className="p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-[#262626] text-white'
                  : 'text-gray-400 hover:bg-[#1E1E1E] hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-400 hover:bg-[#1E1E1E] hover:text-red-300 mt-4"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </nav>
  );
};

export const SettingsPage = () => {
  const pathname = usePathname();
  const [activeComponent, setActiveComponent] = useState<React.ReactNode>(null);

  useEffect(() => {
    // Determine which component to render based on the current pathname
    if (pathname === '/settings/profile' || pathname === '/settings') {
      setActiveComponent(<ProfileSettings />);
    } else if (pathname === '/settings/workspace') {
      setActiveComponent(<WorkspaceSettings />);
    } else if (pathname === '/settings/notifications') {
      setActiveComponent(<NotificationSettings />);
    } else if (pathname === '/settings/security') {
      setActiveComponent(<SecuritySettings />);
    } else if (pathname === '/settings/appearance') {
      setActiveComponent(<AppearanceSettings />);
    } else if (pathname === '/settings/shortcuts') {
      setActiveComponent(<ShortcutSettings />);
    } else if (pathname === '/settings/ai') {
      setActiveComponent(<AISettings />);
    } else if (pathname === '/settings/integrations') {
      setActiveComponent(<IntegrationSettings />);
    } else {
      // Default to profile settings if path doesn't match
      setActiveComponent(<ProfileSettings />);
    }
  }, [pathname]);

  return (
    <div className="flex-1 flex overflow-hidden">
      <SettingsNav />
      <div className="flex-1 overflow-auto">
        {activeComponent}
      </div>
    </div>
  );
};