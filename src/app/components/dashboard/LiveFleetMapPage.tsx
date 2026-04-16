import React from 'react';
import { Truck, Battery } from 'lucide-react';
import { mockVehicles } from '@/app/data/mockData';
import { useLanguage } from '@/app/i18n/LanguageContext';

export function LiveFleetMapPage() {
  const [selectedVehicle, setSelectedVehicle] = React.useState<string | null>(null);
  const { t, isRTL } = useLanguage();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-route': return 'bg-green-500';
      case 'delayed': return 'bg-red-500';
      case 'idle': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'on-route': return t('fleet.onRoute');
      case 'delayed': return t('fleet.delayed');
      case 'idle': return t('fleet.idle');
      default: return status;
    }
  };

  const selected = mockVehicles.find(v => v.id === selectedVehicle);

  return (
    <div className={`h-full flex ${isRTL ? 'flex-row-reverse' : ''}`}>
      {/* Map Area */}
      <div className="flex-1 relative bg-gray-100">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300">
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-12 grid-rows-12 h-full">
              {Array.from({ length: 144 }).map((_, i) => (
                <div key={i} className="border border-gray-400"></div>
              ))}
            </div>
          </div>

          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2">
            <p className="text-sm font-medium text-gray-900">{t('fleet.location')}</p>
            <p className="text-xs text-gray-500">{t('fleet.liveTracking')}</p>
          </div>

          {mockVehicles.map((vehicle, index) => {
            const x = 15 + (index % 3) * 30;
            const y = 15 + Math.floor(index / 3) * 25;
            const isSelected = selectedVehicle === vehicle.id;
            return (
              <button key={vehicle.id} onClick={() => setSelectedVehicle(vehicle.id)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all ${isSelected ? 'scale-125 z-10' : 'hover:scale-110'}`}
                style={{ left: `${x}%`, top: `${y}%` }}>
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full ${getStatusColor(vehicle.status)} shadow-lg flex items-center justify-center ${isSelected ? 'ring-4 ring-blue-400' : ''}`}>
                    {vehicle.type === 'ev' ? <Battery className="w-6 h-6 text-white" /> : <Truck className="w-6 h-6 text-white" />}
                  </div>
                  <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs font-medium whitespace-nowrap">{vehicle.name}</div>
                </div>
              </button>
            );
          })}

          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4">
            <p className="text-sm font-medium text-gray-900 mb-2">{t('fleet.legend')}</p>
            <div className="space-y-2">
              {[
                { color: 'bg-green-500', label: t('fleet.onRoute') },
                { color: 'bg-red-500', label: t('fleet.delayed') },
                { color: 'bg-gray-400', label: t('fleet.idle') },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${color}`}></div>
                  <span className="text-xs text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Details Sidebar */}
      <div className={`w-80 bg-white overflow-auto ${isRTL ? 'border-r border-gray-200' : 'border-l border-gray-200'}`}>
        <div className="p-6">
          <h2 className={`text-lg font-semibold text-gray-900 mb-4 ${isRTL ? 'text-right' : ''}`}>{t('fleet.vehicleDetails')}</h2>

          {selected ? (
            <div className="space-y-4">
              <div className="pb-4 border-b border-gray-200">
                <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-full ${getStatusColor(selected.status)} flex items-center justify-center`}>
                    {selected.type === 'ev' ? <Battery className="w-5 h-5 text-white" /> : <Truck className="w-5 h-5 text-white" />}
                  </div>
                  <div className={isRTL ? 'text-right' : ''}>
                    <h3 className="text-lg font-semibold text-gray-900">{selected.name}</h3>
                    <p className="text-sm text-gray-500">{selected.id}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selected.status === 'on-route' ? 'bg-green-100 text-green-700'
                    : selected.status === 'delayed' ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'}`}>
                    {getStatusText(selected.status)}
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {selected.type === 'ev' ? 'Electric' : 'ICE'}
                  </div>
                </div>
              </div>

              <div className={isRTL ? 'text-right' : ''}>
                <p className="text-sm font-medium text-gray-900 mb-2">{t('fleet.driver')}</p>
                <p className="text-sm text-gray-600">{selected.driverName}</p>
                <p className="text-xs text-gray-500">ID: {selected.driverId}</p>
              </div>

              <div>
                <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <p className="text-sm font-medium text-gray-900">
                    {selected.type === 'ev' ? t('fleet.battery') : t('fleet.fuel')}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {selected.type === 'ev' ? selected.batteryLevel : selected.fuelLevel}%
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${((selected.type === 'ev' ? selected.batteryLevel : selected.fuelLevel) || 0) > 50 ? 'bg-green-500' : 'bg-yellow-500'}`}
                    style={{ width: `${selected.type === 'ev' ? selected.batteryLevel : selected.fuelLevel}%` }}></div>
                </div>
              </div>

              <div className={isRTL ? 'text-right' : ''}>
                <p className="text-sm font-medium text-gray-900 mb-2">{t('fleet.currentLocation')}</p>
                <p className="text-xs text-gray-600">Lat: {selected.lat.toFixed(4)}</p>
                <p className="text-xs text-gray-600">Lng: {selected.lng.toFixed(4)}</p>
              </div>

              <div className="space-y-2 pt-4">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  {t('fleet.routeProgress')}
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                  {t('fleet.contactDriver')}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">{t('fleet.selectVehicle')}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <h3 className={`text-sm font-medium text-gray-900 mb-3 ${isRTL ? 'text-right' : ''}`}>{t('home.fleetStatus')}</h3>
          <div className="space-y-2">
            {[
              { label: t('home.onRoute'), count: mockVehicles.filter(v => v.status === 'on-route').length, color: 'text-green-700' },
              { label: t('home.idle'), count: mockVehicles.filter(v => v.status === 'idle').length, color: 'text-gray-700' },
              { label: t('home.delayed'), count: mockVehicles.filter(v => v.status === 'delayed').length, color: 'text-red-700' },
            ].map(({ label, count, color }) => (
              <div key={label} className={`flex items-center justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-gray-600">{label}</span>
                <span className={`font-medium ${color}`}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
