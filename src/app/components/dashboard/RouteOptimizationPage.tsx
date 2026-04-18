import React from 'react';
import { Settings, Play, DollarSign, Leaf, Users, CheckCircle2, TrendingDown } from 'lucide-react';
import { mockOptimizationResults } from '@/app/data/mockData';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';

export function RouteOptimizationPage() {
  const { t, isRTL } = useLanguage();
  const [objective, setObjective] = React.useState<'cost' | 'co2' | 'workload'>('cost');
  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => { setIsOptimizing(false); setShowResults(true); }, 2000);
  };

  const totalCost = mockOptimizationResults.reduce((sum, r) => sum + r.cost, 0);
  const totalCO2 = mockOptimizationResults.reduce((sum, r) => sum + r.co2, 0);
  const totalDistance = mockOptimizationResults.reduce((sum, r) => sum + r.distance, 0);

  const objectives = [
    { key: 'cost' as const, icon: DollarSign, label: t('route.costMin'), desc: t('route.costMinDesc'), active: 'border-blue-500 bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-700' },
    { key: 'co2' as const, icon: Leaf, label: t('route.co2Min'), desc: t('route.co2MinDesc'), active: 'border-green-500 bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-700' },
    { key: 'workload' as const, icon: Users, label: t('route.balanced'), desc: t('route.balancedDesc'), active: 'border-purple-500 bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-700' },
  ];

  return (
    <div className={`p-8 ${isRTL ? 'text-right' : ''}`}>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">{t('route.title')}</h1>
        <p className="text-gray-600">{t('route.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className={`flex items-center gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Settings className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">{t('route.configuration')}</h2>
            </div>

            <div className="space-y-3">
              {objectives.map(({ key, icon: Icon, label, desc, active, iconBg, iconColor }) => (
                <button key={key} onClick={() => setObjective(key)}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${isRTL ? 'text-right' : 'text-left'} ${objective === key ? active : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${objective === key ? iconBg : 'bg-gray-100'}`}>
                      <Icon className={`w-5 h-5 ${objective === key ? iconColor : 'text-gray-700'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <Button
              variant="default"
              size="lg"
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="w-full mt-6 transition-colors duration-150"
            >
              {isOptimizing ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>{t('route.optimizing')}</>
              ) : (
                <><Play className="w-5 h-5" />{t('route.runOptimization')}</>
              )}
            </Button>
          </div>

          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('route.fleetSummary')}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              {[
                { label: t('optimization.fleetSize'), value: `6 ${t('route.vehicles')}` },
                { label: t('optimization.activeRoutes'), value: `3 ${t('route.routes')}` },
                { label: t('optimization.algorithm'), value: t('optimization.geneticAlgorithm') },
                { label: `${t('route.solveTime')}:`, value: '2s' },
              ].map(({ label, value }) => (
                <div key={label} className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span>{label}</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {!showResults ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center h-full flex items-center justify-center">
              <div>
                <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('route.waitingTitle')}</h3>
                <p className="text-gray-600">{t('route.waitingDesc')}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: TrendingDown, label: t('route.totalCost'), value: totalCost.toLocaleString(), suffix: ' SAR', color: 'text-blue-600', trend: '↓ 12%' },
                  { icon: Leaf, label: t('route.totalEmissions'), value: totalCO2.toFixed(1), suffix: ' kg', color: 'text-green-600', trend: '↓ 18%' },
                  { icon: CheckCircle2, label: t('route.results'), value: totalDistance.toFixed(1), suffix: ' km', color: 'text-purple-600', trend: '↓ 15%' },
                ].map(({ icon: Icon, label, value, suffix, color, trend }) => (
                  <div key={label} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                      <p className="text-xs text-gray-600">{label}</p>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">{value}{suffix}</p>
                    <p className="text-xs text-green-600 mt-1">{trend}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">{t('route.results')}</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {mockOptimizationResults.map((route) => (
                    <div key={route.routeId} className="p-6 hover:bg-gray-50">
                      <div className={`flex items-start justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={isRTL ? 'text-right' : ''}>
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">{route.routeId}</h3>
                          <p className="text-sm text-gray-600">{route.driverName} • {route.vehicleId}</p>
                        </div>
                        <div className={isRTL ? 'text-left' : 'text-right'}>
                          <p className="text-sm font-medium text-gray-900">{route.stops} {t('route.stops')}</p>
                          <p className="text-xs text-gray-500">{route.distance.toFixed(1)} km</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: t('route.totalCost'), value: `${route.cost} SAR` },
                          { label: 'CO₂', value: `${route.co2.toFixed(1)} kg` },
                          { label: t('analytics.efficiency'), value: 'High', valueClass: 'text-green-700' },
                        ].map(({ label, value, valueClass }) => (
                          <div key={label}>
                            <p className="text-xs text-gray-500 mb-1">{label}</p>
                            <p className={`text-sm font-medium ${valueClass || 'text-gray-900'}`}>{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Button variant="default" size="lg" onClick={handleOptimize} className="flex-1 transition-colors duration-150">
                  {t('home.runOptimization')}
                </Button>
                <Button variant="outline" size="lg" onClick={() => toast(t('home.reportComingSoon'))} className="transition-colors duration-150">
                  {t('analytics.export')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
