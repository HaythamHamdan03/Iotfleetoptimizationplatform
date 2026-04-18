import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Navigation, Truck, Bell, User, Globe } from 'lucide-react';
import { useLanguage, type Language } from '@/app/i18n/LanguageContext';

function MobileLanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const langs: { code: Language; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'ar', label: 'عر' },
    { code: 'ur', label: 'اردو' },
  ];
  return (
    <div className="flex items-center gap-1 bg-blue-700 rounded-lg p-1">
      {langs.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            language === code
              ? 'bg-white text-blue-700'
              : 'text-blue-100 hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function MobileLayout() {
  const location = useLocation();
  const { t, isRTL } = useLanguage();

  const navItems = [
    { path: '/', icon: Home, label: t('mobile.home') },
    { path: '/navigation', icon: Navigation, label: t('mobile.route') },
    { path: '/vehicle', icon: Truck, label: t('mobile.vehicle') },
    { path: '/notifications', icon: Bell, label: t('mobile.alerts') },
    { path: '/profile', icon: User, label: t('mobile.profile') },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white border-x border-gray-200">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 flex-shrink-0">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : ''}>
            <h1 className="text-lg font-semibold">{t('mobile.appTitle')}</h1>
            <p className="text-xs text-blue-100">Saudi Arabia</p>
          </div>
          <div className="flex items-center gap-2">
            <MobileLanguageSwitcher />
            <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-shrink-0 bg-white border-t border-gray-200 safe-area-bottom" aria-label={t('mobile.appTitle')}>
        <div className="grid grid-cols-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center py-3 px-2 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-inset ${
                  active ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-6 h-6 mb-1 transition-transform duration-150 ${active ? 'stroke-2 scale-110' : ''}`} aria-hidden="true" />
                <span className="hidden xs:block text-[10px] sm:text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
