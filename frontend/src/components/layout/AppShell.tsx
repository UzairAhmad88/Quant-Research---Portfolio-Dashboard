import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CommandPalette } from '../navigation/CommandPalette';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { useAppStore } from '../../store/appStore';

export const AppShell: React.FC = () => {
  const { isSidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#17211B] flex selection:bg-[#DCFCE7] selection:text-[#14532D]">
      {/* Persistent Sidebar (Desktop & Mobile Drawer) */}
      <Sidebar />

      {/* Top Header Bar */}
      <TopBar />

      {/* Command Palette (Ctrl + K Modal) */}
      <CommandPalette />

      {/* Notification Center (Slide-over Drawer) */}
      <NotificationCenter />

      {/* Main Content Area */}
      <main
        className={`flex-1 pt-14 transition-all duration-200 ease-in-out min-h-screen ${
          isSidebarCollapsed ? 'ml-0 md:ml-16' : 'ml-0 md:ml-60'
        }`}
      >
        <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
