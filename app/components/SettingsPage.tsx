'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
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

const SettingsNav = ({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) => {
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
    { icon: <User size={16} />, label: 'Profile', id: 'profile' },
    { icon: <Briefcase size={16} />, label: 'Workspace', id: 'workspace' },
    { icon: <Bell size={16} />, label: 'Notifications', id: 'notifications' },
    { icon: <Shield size={16} />, label: 'Security', id: 'security' },
    { icon: <Palette size={16} />, label: 'Appearance', id: 'appearance' },
    { icon: <Keyboard size={16} />, label: 'Shortcuts', id: 'shortcuts' },
    { icon: <Bot size={16} />, label: 'AI Assistant', id: 'ai' },
    { icon: <Zap size={16} />, label: 'Integrations', id: 'integrations' },
  ];

  return (
    <nav className="w-60 border-r border-muted">
      <div className="p-4 border-b border-muted">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Settings
        </h2>
      </div>
      <div className="p-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors w-full text-left ${
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-gray-400 hover:bg-secondary hover:text-foreground'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-400 hover:bg-secondary hover:text-red-300 mt-4 w-full text-left"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </nav>
  );
};

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [activeComponent, setActiveComponent] = useState<React.ReactNode>(<ProfileSettings />);

  useEffect(() => {
    // Determine which component to render based on the active tab
    switch (activeTab) {
      case 'profile':
        setActiveComponent(<ProfileSettings />);
        break;
      case 'workspace':
        setActiveComponent(<WorkspaceSettings />);
        break;
      case 'notifications':
        setActiveComponent(<NotificationSettings />);
        break;
      case 'security':
        setActiveComponent(<SecuritySettings />);
        break;
      case 'appearance':
        setActiveComponent(<AppearanceSettings />);
        break;
      case 'shortcuts':
        setActiveComponent(<ShortcutSettings />);
        break;
      case 'ai':
        setActiveComponent(<AISettings />);
        break;
      case 'integrations':
        setActiveComponent(<IntegrationSettings />);
        break;
      default:
        setActiveComponent(<ProfileSettings />);
    }
  }, [activeTab]);

  return (
    <div className="flex-1 flex overflow-hidden">
      <SettingsNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 overflow-auto">
        {activeComponent}
      </div>
    </div>
  );
};