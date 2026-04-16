import React from 'react';
import { User, Award, TrendingUp, Package, Clock, Star, Scale, Settings, LogOut, ChevronRight, Globe } from 'lucide-react';
import { mockDriverPerformance } from '@/app/data/mockData';
import { useLanguage, type Language } from '@/app/i18n/LanguageContext';

const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
  { code: 'ur', label: 'Urdu', native: 'اردو' },
];

export function ProfilePage() {
  const { t, language, setLanguage, isRTL } = useLanguage();

  return (
    <div className="p-4 space-y-4">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className={`flex items-center gap-4 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div className={isRTL ? 'text-right' : ''}>
            <h2 className="text-xl font-semibold">Mohammed Al-Saud</h2>
            <p className="text-sm text-blue-100">Driver ID: D002</p>
            <p className="text-xs text-blue-100 mt-1">{t('profile.since')}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="px-3 py-1 bg-blue-500 rounded-full text-xs font-medium">{t('vehicle.active')}</div>
          <div className="px-3 py-1 bg-green-500 rounded-full text-xs font-medium">Top Performer</div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className={`flex items-center gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Award className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">{t('profile.performanceSummary')}</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Package className="w-4 h-4 text-gray-600" />
              <p className="text-xs text-gray-600">{t('profile.totalDeliveries')}</p>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{mockDriverPerformance.totalDeliveries}</p>
          </div>
          <div>
            <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Clock className="w-4 h-4 text-gray-600" />
              <p className="text-xs text-gray-600">{t('profile.onTimeRate')}</p>
            </div>
            <p className="text-2xl font-semibold text-green-700">{mockDriverPerformance.onTimeRate}%</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-sm text-gray-700">{t('profile.efficiency')}</span>
              <span className="text-sm font-semibold text-gray-900">{mockDriverPerformance.efficiency}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${mockDriverPerformance.efficiency}%` }}></div>
            </div>
          </div>
          <div>
            <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Scale className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Workload Balance</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{mockDriverPerformance.workloadBalance}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${mockDriverPerformance.workloadBalance}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Language Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className={`flex items-center gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Globe className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">{t('profile.language')}</h3>
        </div>
        <div className="space-y-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                language === lang.code ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              } ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className={`text-sm font-medium ${language === lang.code ? 'text-blue-700' : 'text-gray-900'}`}>
                  {lang.native}
                </span>
                <span className="text-xs text-gray-500">{lang.label}</span>
              </div>
              {language === lang.code && (
                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className={`flex items-center gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Star className="w-5 h-5 text-amber-600" />
          <h3 className="text-sm font-semibold text-gray-900">Achievements</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { bg: 'bg-amber-50', border: 'border-amber-200', iconBg: 'bg-amber-100', icon: <Star className="w-5 h-5 text-amber-600" />, label: '100 Deliveries' },
            { bg: 'bg-green-50', border: 'border-green-200', iconBg: 'bg-green-100', icon: <TrendingUp className="w-5 h-5 text-green-600" />, label: 'Top Performer' },
            { bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-100', icon: <Award className="w-5 h-5 text-blue-600" />, label: 'Zero Delays' },
          ].map(({ bg, border, iconBg, icon, label }) => (
            <div key={label} className={`text-center p-3 ${bg} rounded-lg border ${border}`}>
              <div className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-2`}>{icon}</div>
              <p className="text-xs font-medium text-gray-900">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Settings & Actions */}
      <div className="bg-white rounded-lg border border-gray-200">
        {[
          { icon: <Settings className="w-5 h-5 text-gray-600" />, label: t('profile.settings') },
          { icon: <User className="w-5 h-5 text-gray-600" />, label: 'Edit Profile' },
          { icon: <Award className="w-5 h-5 text-gray-600" />, label: 'View All Achievements' },
        ].map(({ icon, label }, i, arr) => (
          <button key={label} className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${i < arr.length - 1 ? 'border-b border-gray-200' : ''} ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {icon}
              <span className="text-sm font-medium text-gray-900">{label}</span>
            </div>
            <ChevronRight className={`w-5 h-5 text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        ))}
      </div>

      {/* Logout */}
      <button className={`w-full px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <LogOut className="w-5 h-5" />
        {t('profile.logout')}
      </button>

      <div className="text-center text-xs text-gray-500 pb-4">
        <p>FleetIoT Driver App v2.1.0</p>
        <p className="mt-1">© 2026 Senior Design Project</p>
      </div>
    </div>
  );
}
