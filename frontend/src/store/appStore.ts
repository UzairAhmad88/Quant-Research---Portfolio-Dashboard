import { create } from 'zustand';

interface AppState {
  isSidebarCollapsed: boolean;
  searchQuery: string;
  activeProvider: string;
  systemHealthStatus: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'STANDBY';
  
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSystemHealthStatus: (status: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'STANDBY') => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarCollapsed: false,
  searchQuery: '',
  activeProvider: 'Provider Abstract (Unconnected)',
  systemHealthStatus: 'STANDBY',

  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed: boolean) => set({ isSidebarCollapsed: collapsed }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSystemHealthStatus: (status) => set({ systemHealthStatus: status }),
}));
