import React from 'react';
import { Battery, Gauge, Thermometer, Radio, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/app/i18n/LanguageContext';

export function VehicleStatusPage() {
  const { t, isRTL } = useLanguage();

  return (
    <div className="p-4 space-y-4">
      {/* Vehicle Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Battery className="w-6 h-6 text-green-700" />
          </div>
          <div className={isRTL ? 'text-right' : ''}>
            <h2 className="text-xl font-semibold text-gray-900">{t('vehicle.title')}</h2>
            <p className="text-sm text-gray-600">{t('vehicle.type')}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 mt-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">{t('vehicle.active')}</div>
          <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">{t('vehicle.onRoute')}</div>
        </div>
      </div>

      {/* Battery Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Battery className="w-5 h-5 text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-900">{t('vehicle.batteryLevel')}</h3>
          </div>
          <span className="text-2xl font-semibold text-gray-900">68%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: '68%' }}></div>
        </div>
        <div className={`flex items-center justify-between text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span>{t('vehicle.estimatedRange')}: 142 km</span>
          <span>{t('vehicle.chargingNotRequired')}</span>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: Gauge, color: 'text-blue-600', label: t('vehicle.speed'), value: '45', unit: 'km/h', sub: '' },
          { icon: TrendingUp, color: 'text-green-600', label: t('vehicle.performance'), value: '94%', unit: '', sub: 'Excellent' },
          { icon: Thermometer, color: 'text-orange-600', label: t('vehicle.temp'), value: '24°C', unit: '', sub: 'Normal' },
          { icon: Radio, color: 'text-purple-600', label: 'IoT', value: 'Strong', unit: '', sub: t('settings.connected') },
        ].map(({ icon: Icon, color, label, value, unit, sub }) => (
          <div key={label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Icon className={`w-5 h-5 ${color}`} />
              <h3 className="text-xs font-medium text-gray-600">{label}</h3>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {unit && <p className="text-xs text-gray-600">{unit}</p>}
            {sub && <p className="text-xs text-green-600">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Connectivity */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className={`text-sm font-semibold text-gray-900 mb-3 ${isRTL ? 'text-right' : ''}`}>{t('vehicle.iotStatus')}</h3>
        <div className="space-y-3">
          {[
            { label: t('vehicle.gps'), value: 'Active' },
            { label: t('vehicle.telematics'), value: t('settings.connected') },
            { label: t('vehicle.cellular'), value: '4G LTE' },
          ].map(({ label, value }) => (
            <div key={label} className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-700">{label}</span>
              </div>
              <span className="text-sm font-medium text-green-700">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Load Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className={`text-sm font-semibold text-gray-900 mb-3 ${isRTL ? 'text-right' : ''}`}>Cargo Load</h3>
        <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className="text-sm text-gray-600">Current Load</span>
          <span className="text-sm font-semibold text-gray-900">600 / 800 kg</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
        </div>
        <p className="text-xs text-gray-600">75% capacity utilized</p>
      </div>

      {/* Health */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-700" />
          </div>
          <div className={isRTL ? 'text-right' : ''}>
            <p className="text-sm font-medium text-green-900">{t('vehicle.allSystems')}</p>
            <p className="text-xs text-green-700 mt-1">{t('vehicle.allSystemsDesc')}</p>
          </div>
        </div>
      </div>

      {/* Emergency */}
      <button className={`w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <AlertCircle className="w-5 h-5" />
        Report Vehicle Issue
      </button>
    </div>
  );
}
