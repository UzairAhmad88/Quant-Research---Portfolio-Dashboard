import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  category: 'System' | 'Data' | 'Backtesting' | 'Portfolio' | 'Alerts';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AppState {
  isSidebarCollapsed: boolean;
  isMobileDrawerOpen: boolean;
  isCommandPaletteOpen: boolean;
  isNotificationOpen: boolean;
  searchQuery: string;
  activeProvider: string;
  systemHealthStatus: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'STANDBY';
  notifications: NotificationItem[];
  
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileDrawer: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleNotificationCenter: () => void;
  setNotificationCenterOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSystemHealthStatus: (status: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'STANDBY') => void;
  markAllNotificationsRead: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarCollapsed: false,
  isMobileDrawerOpen: false,
  isCommandPaletteOpen: false,
  isNotificationOpen: false,
  searchQuery: '',
  activeProvider: 'Provider Abstract (Decoupled)',
  systemHealthStatus: 'STANDBY',
  notifications: [
    {
      id: 'notif-1',
      category: 'System',
      title: 'Step 02 Shell Activated',
      message: 'Institutional design system and application shell initialized.',
      timestamp: 'Just now',
      isRead: false,
      type: 'info',
    },
    {
      id: 'notif-2',
      category: 'Data',
      title: 'Provider Interface Ready',
      message: 'Abstract provider interface contract established for Step 03 market data ingestion.',
      timestamp: '5m ago',
      isRead: false,
      type: 'success',
    },
    {
      id: 'notif-3',
      category: 'System',
      title: 'Auth Layer Disabled',
      message: 'Local quantitative research workflow mode active. Authentication bypassed.',
      timestamp: '1h ago',
      isRead: true,
      type: 'info',
    },
  ],

  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed: boolean) => set({ isSidebarCollapsed: collapsed }),
  toggleMobileDrawer: () => set((state) => ({ isMobileDrawerOpen: !state.isMobileDrawerOpen })),
  setMobileDrawerOpen: (open: boolean) => set({ isMobileDrawerOpen: open }),
  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
  setCommandPaletteOpen: (open: boolean) => set({ isCommandPaletteOpen: open }),
  toggleNotificationCenter: () => set((state) => ({ isNotificationOpen: !state.isNotificationOpen })),
  setNotificationCenterOpen: (open: boolean) => set({ isNotificationOpen: open }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSystemHealthStatus: (status) => set({ systemHealthStatus: status }),
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    })),
}));
