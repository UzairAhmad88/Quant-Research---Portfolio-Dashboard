import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAppStore } from '../../store/appStore';

export const AppShell: React.FC = () => {
  const { isSidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#E5E7EB] flex">
      {/* Persistent Sidebar */}
      <Sidebar />

      {/* Top Header */}
      <TopBar />

      {/* Main Content Area */}
      <main
        className={`flex-1 pt-14 transition-all duration-200 ease-in-out min-h-screen ${
          isSidebarCollapsed ? 'ml-16' : 'ml-60'
        }`}
      >
        <div className="p-6 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
