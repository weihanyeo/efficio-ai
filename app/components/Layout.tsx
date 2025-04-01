'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from "./Sidebar";
import { CopilotPanel } from "./CopilotPanel";

export const Layout: React.FC<{ 
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isOnboardingPage = pathname === '/onboarding';
  const isAuthPage = pathname === '/login';

  return (
    <div className={`flex h-screen overflow-hidden ${className}`}>
      {!isLandingPage && !isOnboardingPage && !isAuthPage && <Sidebar className="w-64 bg-card border-r border-border" />}
      {children}
      {!isLandingPage && !isOnboardingPage && !isAuthPage && <CopilotPanel className="w-80 bg-card border-l border-border" />}
    </div>
    
  );
};