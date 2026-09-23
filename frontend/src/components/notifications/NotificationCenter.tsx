import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Tabs } from '../ui/Tabs';
import { Badge } from '../ui/Badge';
import { Bell, CheckCheck, X, ShieldAlert, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

const categoryTabs = [
  { id: 'All', label: 'All' },
  { id: 'System', label: 'System' },
  { id: 'Data', label: 'Data' },
  { id: 'Backtesting', label: 'Backtesting' },
  { id: 'Portfolio', label: 'Portfolio' },
  { id: 'Alerts', label: 'Alerts' },
];

export const NotificationCenter: React.FC = () => {
  const { isNotificationOpen, setNotificationCenterOpen, notifications, markAllNotificationsRead } = useAppStore();
  const [activeCategory, setActiveCategory] = useState('All');

  if (!isNotificationOpen) return null;

  const filteredNotifications = notifications.filter(
    (n) => activeCategory === 'All' || n.category === activeCategory
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />;
      case 'error':
        return <ShieldAlert className="w-4 h-4 text-[#EF4444]" />;
      default:
        return <Info className="w-4 h-4 text-[#3B82F6]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs"
        onClick={() => setNotificationCenterOpen(false)}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-sm bg-[#111827] border-l border-[#263244] h-full shadow-2xl z-10 flex flex-col justify-between text-[#E5E7EB]">
        {/* Header */}
        <div className="p-4 border-b border-[#263244] flex items-center justify-between bg-[#151F2E]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#3B82F6]" />
            <h3 className="text-sm font-semibold tracking-tight text-[#E5E7EB]">Notification Center</h3>
          </div>
          <button
            onClick={() => setNotificationCenterOpen(false)}
            className="p-1 rounded text-[#94A3B8] hover:text-[#E5E7EB] hover:bg-[#111827]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-3 pt-2 bg-[#111827] border-b border-[#263244]">
          <Tabs tabs={categoryTabs} activeTab={activeCategory} onChange={setActiveCategory} />
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#94A3B8]">
              No notifications in category "{activeCategory}".
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 rounded-md border transition-colors ${
                  notif.isRead
                    ? 'bg-[#151F2E]/60 border-[#263244] opacity-80'
                    : 'bg-[#151F2E] border-[#3B82F6]/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    {getIcon(notif.type)}
                    <span className="text-xs font-semibold text-[#E5E7EB]">{notif.title}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] py-0 px-1 border-[#263244] text-[#64748B]">
                    {notif.category}
                  </Badge>
                </div>
                <p className="text-xs text-[#94A3B8] leading-normal pl-6 mb-2">{notif.message}</p>
                <div className="text-[10px] font-mono-num text-[#64748B] pl-6">{notif.timestamp}</div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-[#263244] bg-[#151F2E] flex items-center justify-between">
          <span className="text-[11px] font-mono-num text-[#64748B]">
            {notifications.filter((n) => !n.isRead).length} Unread
          </span>
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-1.5 text-xs text-[#3B82F6] hover:underline"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        </div>
      </div>
    </div>
  );
};
