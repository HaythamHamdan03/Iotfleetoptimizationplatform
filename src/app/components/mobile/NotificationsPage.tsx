import React from 'react';
import { Bell, Navigation, AlertCircle, MessageSquare, Clock } from 'lucide-react';
import { mockNotifications } from '@/app/data/mockData';
import { useLanguage } from '@/app/i18n/LanguageContext';

export function NotificationsPage() {
  const { t, isRTL } = useLanguage();
  const unreadCount = mockNotifications.filter(n => !n.read).length;

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

      {/* Notifications List */}
      <div className="space-y-3">
        {mockNotifications.map((notification) => (
          <div key={notification.id} className={`bg-white rounded-lg border border-gray-200 p-4 ${!notification.read ? 'ring-2 ring-blue-100' : ''}`}>
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 ${getNotificationColor(notification.type)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
                <div className={`flex items-start justify-between mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <h3 className="text-sm font-semibold text-gray-900">{notification.title}</h3>
                  {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 flex-shrink-0"></div>}
                </div>
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                <div className={`flex items-center gap-1 text-xs text-gray-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Clock className="w-3 h-3" />
                  <span>{notification.time}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Static extra notifications */}
      {[
        { bg: 'bg-purple-100', icon: <Bell className="w-5 h-5 text-purple-700" />, title: 'Weekly Performance Summary', msg: 'Your performance stats for the week are ready. 42 deliveries, 94% on-time.', time: '1 day ago' },
        { bg: 'bg-amber-100', icon: <AlertCircle className="w-5 h-5 text-amber-700" />, title: 'Vehicle Maintenance Reminder', msg: 'EV-02 is due for routine maintenance in 2,400 km.', time: '2 days ago' },
        { bg: 'bg-green-100', icon: <MessageSquare className="w-5 h-5 text-green-700" />, title: 'System Update Available', msg: 'A new version of the driver app is available.', time: '3 days ago' },
      ].map(({ bg, icon, title, msg, time }) => (
        <div key={title} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>{icon}</div>
            <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-600 mb-2">{msg}</p>
              <div className={`flex items-center gap-1 text-xs text-gray-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Clock className="w-3 h-3" /><span>{time}</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
        {t('notif.markAllRead')}
      </button>
    </div>
  );
}
