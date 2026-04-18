import React from 'react';
import { MapPin, Clock, Package, TrendingUp, CheckCircle2 } from 'lucide-react';
import { mockDeliveryStops } from '@/app/data/mockData';
import { useLanguage } from '@/app/i18n/LanguageContext';

export function DriverHomePage() {
  const { t, isRTL } = useLanguage();
  const completedStops = mockDeliveryStops.filter((s) => s.status === 'completed').length;
  const totalStops = mockDeliveryStops.length;
  const pendingStops = mockDeliveryStops.filter((s) => s.status !== 'completed').length;
  const totalPackages = mockDeliveryStops.reduce((sum, s) => sum + (s.packageCount ?? 0), 0);

  return (
    <div className={`p-4 space-y-4 ${isRTL ? 'text-right' : ''}`}>
      {/* Welcome Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">{t('driver.welcome')}</h2>
        <p className="text-sm text-gray-600">{t('driver.today')}</p>
      </div>

      {/* Active Route Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className={`flex items-start justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : ''}>
            <p className="text-sm text-blue-100 mb-1">{t('driver.activeRoute')}</p>
            <h3 className="text-2xl font-semibold">Route #R002</h3>
          </div>
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={isRTL ? 'text-right' : ''}>
            <p className="text-xs text-blue-100 mb-1">{t('driver.stops')}</p>
            <p className="text-lg font-semibold">{completedStops}/{totalStops}</p>
          </div>
          <div className={isRTL ? 'text-right' : ''}>
            <p className="text-xs text-blue-100 mb-1">{t('driver.estCompletion')}</p>
            <p className="text-lg font-semibold">11:30 AM</p>
          </div>
        </div>

        <div className="mt-4">
          <div className={`flex items-center justify-between text-xs mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="text-blue-100">{t('driver.progress')}</span>
            <span className="font-medium">{Math.round((completedStops / totalStops) * 100)}%</span>
          </div>
          <div className="w-full bg-blue-500 rounded-full h-2">
            <div className="bg-white h-2 rounded-full transition-all"
              style={{ width: `${(completedStops / totalStops) * 100}%` }}></div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-green-700" />
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <p className="text-xs text-gray-600">{t('driver.packages')}</p>
              <p className="text-lg font-semibold text-gray-900">{totalPackages > 0 ? totalPackages : pendingStops}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-700" />
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <p className="text-xs text-gray-600">{t('driver.estTime')}</p>
              <p className="text-lg font-semibold text-gray-900">1h 30m</p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Stop */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">{t('driver.nextStop')}</h3>
        </div>
        <div className="p-4">
          {mockDeliveryStops.filter((s) => s.status === 'current').map((stop) => (
            <div key={stop.id}>
              <div className={`flex items-start gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-blue-700" />
                </div>
                <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                  <p className="font-medium text-gray-900">{stop.name ?? stop.address}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {stop.packageCount !== undefined && `${stop.packageCount} ${t('nav2.packages')} • `}
                    ETA: {stop.scheduledTime}
                  </p>
                </div>
              </div>
              <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                {t('driver.startNavigation')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Completed Stops */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h3 className="text-sm font-semibold text-gray-900">{t('driver.completedToday')}</h3>
            <span className="text-sm text-gray-600">{completedStops} {t('driver.stops')}</span>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {mockDeliveryStops.filter((s) => s.status === 'completed').map((stop) => (
            <div key={stop.id}
              className={`flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-green-700" />
              </div>
              <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                <p className="text-sm font-medium text-gray-900">{stop.name ?? stop.address}</p>
                <p className="text-xs text-gray-600">
                  {stop.packageCount !== undefined && `${stop.packageCount} ${t('nav2.packages')} • `}
                  {stop.actualTime ?? stop.scheduledTime}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Indicator */}
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-green-700" />
        </div>
        <div className={isRTL ? 'text-right' : ''}>
          <p className="text-sm font-medium text-green-900">{t('driver.greatPerformance')}</p>
          <p className="text-xs text-green-700">{t('driver.aheadSchedule')}</p>
        </div>
      </div>
    </div>
  );
}
