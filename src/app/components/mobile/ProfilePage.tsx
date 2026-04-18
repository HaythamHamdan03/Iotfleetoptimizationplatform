import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { User, Award, TrendingUp, Package, Clock, Star, Scale, Settings, LogOut, ChevronRight, Globe } from 'lucide-react';
import { mockDriverPerformance } from '@/app/data/mockData';
import { useLanguage, type Language } from '@/app/i18n/LanguageContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/app/components/ui/sheet';
import { Button } from '@/app/components/ui/button';

const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
  { code: 'ur', label: 'Urdu', native: 'اردو' },
];

interface ProfilePageProps {
  driverName?: string;
}

const DEFAULT_DRIVER_NAME = 'Mohammed Al-Saud';

export function ProfilePage({ driverName = DEFAULT_DRIVER_NAME }: ProfilePageProps = {}) {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = React.useState(false);
  const [showAllAchievements, setShowAllAchievements] = React.useState(false);
  const [editName, setEditName] = React.useState(driverName);
  const [editStatus, setEditStatus] = React.useState<'active' | 'offline'>('active');
  const [persistedName, setPersistedName] = React.useState(driverName);

  const handleSettings = () => {
    // Mobile layout has no /settings route — surface a toast.
    toast(t('profile.settingsComingSoon'));
  };

  const handleSaveProfile = () => {
    setPersistedName(editName);
    setEditOpen(false);
    toast.success(t('profile.savedToast'));
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('fleetiot-auth');
    } catch {
      // ignore
    }
    toast.success(t('profile.loggedOutToast'));
    navigate('/');
  };

  return (
    <div className="p-4 space-y-4">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className={`flex items-center gap-4 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div className={isRTL ? 'text-right' : ''}>
            <h2 className="text-xl font-semibold">{persistedName}</h2>
            <p className="text-sm text-blue-100">Driver ID: D002</p>
            <p className="text-xs text-blue-100 mt-1">{t('profile.since')}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="px-3 py-1 bg-blue-500 rounded-full text-xs font-medium">{t('profile.statusActive')}</div>
          <div className="px-3 py-1 bg-green-500 rounded-full text-xs font-medium">{t('profile.badge.topPerformer')}</div>
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
                <span className="text-sm text-gray-700">{t('profile.badge.workloadBalance')}</span>
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
          <h3 className="text-sm font-semibold text-gray-900">{t('profile.achievements')}</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { bg: 'bg-amber-50', border: 'border-amber-200', iconBg: 'bg-amber-100', icon: <Star className="w-5 h-5 text-amber-600" />, label: t('profile.achievement.deliveries') },
            { bg: 'bg-green-50', border: 'border-green-200', iconBg: 'bg-green-100', icon: <TrendingUp className="w-5 h-5 text-green-600" />, label: t('profile.badge.topPerformer') },
            { bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-100', icon: <Award className="w-5 h-5 text-blue-600" />, label: t('profile.achievement.zeroDelays') },
            ...(showAllAchievements ? [
              { bg: 'bg-purple-50', border: 'border-purple-200', iconBg: 'bg-purple-100', icon: <Award className="w-5 h-5 text-purple-600" />, label: t('profile.achievement.efficiencyKing') },
              { bg: 'bg-teal-50', border: 'border-teal-200', iconBg: 'bg-teal-100', icon: <Star className="w-5 h-5 text-teal-600" />, label: t('profile.achievement.fiveYears') },
              { bg: 'bg-rose-50', border: 'border-rose-200', iconBg: 'bg-rose-100', icon: <TrendingUp className="w-5 h-5 text-rose-600" />, label: t('profile.achievement.fuelSaver') },
            ] : []),
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
          { icon: <Settings className="w-5 h-5 text-gray-600" />, label: t('profile.settings'), onClick: handleSettings, ariaLabel: t('profile.settings') },
          { icon: <User className="w-5 h-5 text-gray-600" />, label: t('profile.editProfile'), onClick: () => setEditOpen(true), ariaLabel: t('profile.editProfile') },
          {
            icon: <Award className="w-5 h-5 text-gray-600" />,
            label: showAllAchievements ? t('profile.collapseAchievements') : t('profile.viewAllAchievements'),
            onClick: () => setShowAllAchievements(v => !v),
            ariaLabel: t('profile.viewAllAchievements'),
          },
        ].map(({ icon, label, onClick, ariaLabel }, i, arr) => (
          <button
            key={label}
            onClick={onClick}
            aria-label={ariaLabel}
            className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-inset ${i < arr.length - 1 ? 'border-b border-gray-200' : ''} ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {icon}
              <span className="text-sm font-medium text-gray-900">{label}</span>
            </div>
            <ChevronRight className={`w-5 h-5 text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className={`w-full px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-colors duration-150 font-medium flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:outline-none ${isRTL ? 'flex-row-reverse' : ''}`}
      >
        <LogOut className="w-5 h-5" />
        {t('profile.logout')}
      </button>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="bottom" className="space-y-4">
          <SheetHeader>
            <SheetTitle>{t('profile.editProfile')}</SheetTitle>
            <SheetDescription>{t('profile.editProfileDesc')}</SheetDescription>
          </SheetHeader>
          <div className="space-y-3 px-4">
            <div>
              <label htmlFor="profile-name" className="text-sm font-medium text-foreground">{t('profile.nameLabel')}</label>
              <input
                id="profile-name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md bg-background text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              />
            </div>
            <div>
              <label htmlFor="profile-status" className="text-sm font-medium text-foreground">{t('profile.statusLabel')}</label>
              <select
                id="profile-status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as 'active' | 'offline')}
                className="mt-1 w-full px-3 py-2 border rounded-md bg-background text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <option value="active">{t('profile.statusActive')}</option>
                <option value="offline">{t('profile.statusOffline')}</option>
              </select>
            </div>
          </div>
          <SheetFooter>
            <Button variant="default" onClick={handleSaveProfile}>{t('common.save')}</Button>
            <SheetClose asChild>
              <Button variant="outline">{t('common.cancel')}</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <div className="text-center text-xs text-gray-500 pb-4">
        <p>FleetIoT Driver App v2.1.0</p>
        <p className="mt-1">© 2026 Senior Design Project</p>
      </div>
    </div>
  );
}
