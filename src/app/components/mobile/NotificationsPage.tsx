import React from 'react';
import { toast } from 'sonner';
import { Bell, Navigation, AlertCircle, MessageSquare, Clock, BellOff } from 'lucide-react';
import { mockNotifications } from '@/app/data/mockData';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { Button } from '@/app/components/ui/button';
import { EmptyState } from '@/app/components/ui/EmptyState';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export function NotificationsPage() {
  const { t, isRTL } = useLanguage();

  // Static extras (formerly hardcoded JSX) — promoted into state so they can be marked read.
  const buildItems = React.useCallback((): NotificationItem[] => [
    ...mockNotifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      time: n.time,
      read: n.read,
    })),
    {
      id: 'static-weekly',
      type: 'message',
      title: t('notifications.weeklyPerformance'),
      message: t('notifications.weeklyPerformanceBody'),
      time: '1d',
      read: false,
    },
    {
      id: 'static-maintenance',
      type: 'delay',
      title: t('notifications.maintenanceReminder'),
      message: t('notifications.maintenanceReminderBody'),
      time: '2d',
      read: false,
    },
    {
      id: 'static-system',
      type: 'route-update',
      title: t('notifications.systemUpdate'),
      message: t('notifications.systemUpdateBody'),
      time: '3d',
      read: false,
    },
  ], [t]);

  const [items, setItems] = React.useState<NotificationItem[]>(() => buildItems());
  const unreadCount = items.filter(n => !n.read).length;

  React.useEffect(() => {
    // Refresh static-item titles when language changes (preserve read state).
    setItems(prev => {
      const fresh = buildItems();
      return fresh.map(f => {
        const prevItem = prev.find(p => p.id === f.id);
        return prevItem ? { ...f, read: prevItem.read } : f;
      });
    });
  }, [buildItems]);

  const handleMarkAllRead = () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    toast.success(t('notifications.allMarkedRead'));
  };

  const markOne = (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'route-update': return <Navigation className="w-5 h-5 text-blue-700" />;
      case 'delay': return <AlertCircle className="w-5 h-5 text-red-700" />;
      case 'message': return <MessageSquare className="w-5 h-5 text-green-700" />;
      default: return <Bell className="w-5 h-5 text-gray-700" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'route-update': return 'bg-blue-100';
      case 'delay': return 'bg-red-100';
      case 'message': return 'bg-green-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : ''}>
            <h2 className="text-xl font-semibold text-gray-900">{t('notif.title')}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount} {unreadCount !== 1 ? t('notif.unreadPlural') : t('notif.unread')}
            </p>
          </div>
          <div className="relative">
            <Bell className="w-8 h-8 text-blue-600" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-medium">{unreadCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={t('notifications.empty.title')}
          description={t('notifications.empty.desc')}
        />
      ) : (
        <div className="space-y-3">
          {items.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => markOne(notification.id)}
              aria-label={notification.title}
              className={`w-full text-left bg-white rounded-lg border border-gray-200 p-4 transition-colors duration-150 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                !notification.read ? `ring-2 ring-blue-100 ${isRTL ? 'border-r-4' : 'border-l-4'} border-l-blue-500` : ''
              }`}
            >
              <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 ${getNotificationColor(notification.type)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
                  <div className={`flex items-start justify-between mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <h3 className="text-sm font-semibold text-gray-900">{notification.title}</h3>
                    {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 flex-shrink-0" aria-hidden="true"></div>}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                  <div className={`flex items-center gap-1 text-xs text-gray-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Clock className="w-3 h-3" />
                    <span>{notification.time}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        size="lg"
        onClick={handleMarkAllRead}
        disabled={unreadCount === 0}
        className="w-full transition-colors duration-150"
      >
        {t('notifications.markAllRead')}
      </Button>
    </div>
  );
}
