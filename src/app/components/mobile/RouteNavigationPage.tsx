import React from 'react';
import { MapPin, Navigation, CheckCircle2, Clock, AlertTriangle, Package } from 'lucide-react';
import { mockDeliveryStops } from '@/app/data/mockData';
import { useLanguage } from '@/app/i18n/LanguageContext';

export function RouteNavigationPage() {
  const { t, isRTL } = useLanguage();
  const [selectedStop, setSelectedStop] = React.useState<string | null>(
    mockDeliveryStops.find(s => s.status === 'current')?.id || null
  );
  const currentStop = mockDeliveryStops.find(s => s.id === selectedStop);

  const getStatusLabel = (status: string) => {
    if (status === 'completed') return t('nav2.completed');
    if (status === 'current') return t('nav2.current');
    return t('nav2.upcoming');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Map Container */}
      <div className="flex-1 relative bg-gradient-to-br from-gray-200 to-gray-300" style={{ minHeight: '220px' }}>
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-8 grid-rows-8 h-full">
            {Array.from({ length: 64 }).map((_, i) => <div key={i} className="border border-gray-400"></div>)}
          </div>
        </div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <path d="M 20 80 Q 30 60, 40 50 Q 50 40, 60 35 Q 70 30, 80 25" stroke="#3b82f6" strokeWidth="3" fill="none" strokeDasharray="5,5" className="animate-pulse" />
        </svg>

        {mockDeliveryStops.map((stop, index) => {
          const x = 20 + index * 15;
          const y = 80 - index * 11;
          const isSelected = selectedStop === stop.id;
          return (
            <button key={stop.id} onClick={() => setSelectedStop(stop.id)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all ${isSelected ? 'scale-125 z-10' : ''}`}
              style={{ left: `${x}%`, top: `${y}%` }}>
              <div className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center ${
                stop.status === 'completed' ? 'bg-green-500' : stop.status === 'current' ? 'bg-blue-600 animate-pulse' : 'bg-gray-400'
              } ${isSelected ? 'ring-4 ring-white' : ''}`}>
                {stop.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-white" /> : <MapPin className="w-5 h-5 text-white" />}
              </div>
              {isSelected && (
                <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs font-medium whitespace-nowrap">
                  Stop {index + 1}
                </div>
              )}
            </button>
          );
        })}

        <div className={`absolute bottom-20 ${isRTL ? 'right-4' : 'left-4'} bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Navigation className="w-4 h-4" />
          Your Location
        </div>

        <div className="absolute top-4 left-4 right-4 bg-white rounded-lg shadow-lg p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-600">Distance</p>
              <p className="text-sm font-semibold text-gray-900">3.2 km</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">{t('nav2.eta')}</p>
              <p className="text-sm font-semibold text-gray-900">12 min</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">{t('driver.nextStop')}</p>
              <p className="text-sm font-semibold text-gray-900">
                {mockDeliveryStops.findIndex(s => s.status === 'current') + 1}/{mockDeliveryStops.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stop Details Panel */}
      {currentStop && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="mb-4">
            <div className={`flex items-start gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-blue-700" />
              </div>
              <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                <h3 className="font-semibold text-gray-900 mb-1">{currentStop.address}</h3>
                <div className={`flex items-center gap-4 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Package className="w-4 h-4" />
                    <span>{currentStop.packageCount} {t('nav2.packages')}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Clock className="w-4 h-4" />
                    <span>{t('nav2.eta')}: {currentStop.estimatedTime}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <button className={`w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CheckCircle2 className="w-5 h-5" />
                {t('nav2.markDelivered')}
              </button>
              <button className={`w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <AlertTriangle className="w-5 h-5" />
                Report Delay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stops List */}
      <div className="bg-white border-t border-gray-200">
        <div className="p-4">
          <h3 className={`text-sm font-semibold text-gray-900 mb-3 ${isRTL ? 'text-right' : ''}`}>
            {t('driver.stops')} ({mockDeliveryStops.length})
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {mockDeliveryStops.map((stop, index) => (
              <button key={stop.id} onClick={() => setSelectedStop(stop.id)}
                className={`w-full ${isRTL ? 'text-right' : 'text-left'} p-3 rounded-lg border transition-colors ${selectedStop === stop.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium ${
                    stop.status === 'completed' ? 'bg-green-500 text-white' : stop.status === 'current' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'
                  }`}>
                    {stop.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                  </div>
                  <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
                    <p className="text-sm font-medium text-gray-900 truncate">{stop.address}</p>
                    <p className="text-xs text-gray-600">{stop.packageCount} {t('nav2.packages')} • {stop.estimatedTime}</p>
                  </div>
                  {stop.status === 'current' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">{t('nav2.current')}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
