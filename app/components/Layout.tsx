'use client';
import React from 'react';
import { Sidebar } from "./Sidebar";
import { CopilotPanel } from "./CopilotPanel";

export const Layout: React.FC<{ 
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <div className={`flex h-screen overflow-hidden ${className}`}>
      <Sidebar className="w-64 bg-[#1A1A1A] border-r border-gray-800" />
      {children}
      <CopilotPanel className="w-80 bg-[#1A1A1A] border-l border-gray-800" /> 
    </div>
    
  );
};