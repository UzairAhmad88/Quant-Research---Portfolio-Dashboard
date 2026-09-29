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
        return <CheckCircle2 className="w-4 h-4 text-financial-positive" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'error':
        return <ShieldAlert className="w-4 h-4 text-financial-negative" />;
      default:
        return <Info className="w-4 h-4 text-brand-primary" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        onClick={() => setNotificationCenterOpen(false)}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-sm bg-card border-l border-border h-full shadow-2xl z-10 flex flex-col justify-between text-text-primary">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-primary" />
            <h3 className="text-sm font-semibold tracking-tight text-text-primary">Notification Center</h3>
          </div>
          <button
            onClick={() => setNotificationCenterOpen(false)}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-3 pt-2 bg-card border-b border-border">
          <Tabs tabs={categoryTabs} activeTab={activeCategory} onChange={setActiveCategory} />
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted">
              No notifications in category "{activeCategory}".
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 rounded-lg border transition-colors ${
                  notif.isRead
                    ? 'bg-surface/50 border-border opacity-80'
                    : 'bg-surface border-brand-primary/30 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    {getIcon(notif.type)}
                    <span className="text-xs font-semibold text-text-primary">{notif.title}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] py-0 px-1 border-border text-text-muted">
                    {notif.category}
                  </Badge>
                </div>
                <p className="text-xs text-text-muted leading-normal pl-6 mb-2">{notif.message}</p>
                <div className="text-[10px] font-mono-num text-text-muted pl-6">{notif.timestamp}</div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-border bg-surface flex items-center justify-between">
          <span className="text-[11px] font-mono-num text-text-muted">
            {notifications.filter((n) => !n.isRead).length} Unread
          </span>
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-1.5 text-xs text-brand-primary font-medium hover:underline"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        </div>
      </div>
    </div>
  );
};
