import React from 'react';
import { toast } from 'sonner';
import { Battery, Gauge, Thermometer, Radio, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { useIoT } from '@/app/context/IoTContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';

const PLACEHOLDER = '—';

export function VehicleStatusPage() {
  const { t, isRTL } = useLanguage();
  const { iotData, isConnected } = useIoT();
  const [issueDialogOpen, setIssueDialogOpen] = React.useState(false);
  const [issueDescription, setIssueDescription] = React.useState('');

  // Map IoT payload fields to display values; show muted placeholder when offline.
  const speedDisplay = iotData ? `${iotData.speed.toFixed(1)}` : PLACEHOLDER;
  const tempDisplay = iotData ? `${iotData.temp.toFixed(1)}°C` : PLACEHOLDER;
  const tempStatus = iotData?.temp_status ?? PLACEHOLDER;
  const satellites = iotData?.satellites;
  const iotSignal = iotData
    ? satellites && satellites >= 10 ? t('vehicle.signalStrong') : t('vehicle.signalWeak')
    : PLACEHOLDER;

  // Battery / range / cargo are not in mock IoT payload — derived placeholders for now.
  const batteryDisplay = iotData ? '68' : PLACEHOLDER;
  const rangeDisplay = iotData ? '142' : PLACEHOLDER;
  const cargoCurrent = iotData ? 600 : null;
  const cargoMax = 800;
  const cargoPct = cargoCurrent !== null ? Math.round((cargoCurrent / cargoMax) * 100) : null;

  const handleSubmitIssue = () => {
    if (!issueDescription.trim()) {
      toast.error(t('vehicle.issue.required'));
      return;
    }
    setIssueDialogOpen(false);
    setIssueDescription('');
    toast.success(t('vehicle.issue.submitted'));
  };

  const liveBadge = isConnected ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      {t('iot.liveIndicator')}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      {t('iot.lastKnownShort')}
    </span>
  );

  return (
    <div className="p-4 space-y-4">
      {/* TODO: pull-to-refresh via IoT context once available */}
      {/* Vehicle Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Battery className="w-6 h-6 text-green-700" />
          </div>
          <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <h2 className="text-xl font-semibold text-gray-900">{t('vehicle.title')}</h2>
              {liveBadge}
            </div>
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
          <span className={`text-2xl font-semibold ${isConnected ? 'text-gray-900' : 'text-muted-foreground'}`}>
            {batteryDisplay}{isConnected && '%'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div
            className={`h-3 rounded-full transition-all ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`}
            style={{ width: isConnected ? '68%' : '0%' }}
          />
        </div>
        <div className={`flex items-center justify-between text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span>
            {t('vehicle.estimatedRange')}: {isConnected ? `${rangeDisplay} km` : <span className="text-muted-foreground">{PLACEHOLDER}</span>}
          </span>
          <span>{t('vehicle.chargingNotRequired')}</span>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: Gauge, color: 'text-blue-600', label: t('vehicle.speed'), value: speedDisplay, unit: isConnected ? 'km/h' : '', sub: '' },
          { icon: TrendingUp, color: 'text-green-600', label: t('vehicle.performance'), value: isConnected ? '94%' : PLACEHOLDER, unit: '', sub: isConnected ? t('vehicle.excellent') : '' },
          { icon: Thermometer, color: 'text-orange-600', label: t('vehicle.temp'), value: tempDisplay, unit: '', sub: tempStatus },
          { icon: Radio, color: 'text-purple-600', label: 'IoT', value: iotSignal, unit: '', sub: isConnected ? t('settings.connected') : t('iot.offline') },
        ].map(({ icon: Icon, color, label, value, unit, sub }) => (
          <div key={label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Icon className={`w-5 h-5 ${color}`} />
              <h3 className="text-xs font-medium text-gray-600">{label}</h3>
            </div>
            <p className={`text-2xl font-semibold ${value === PLACEHOLDER ? 'text-muted-foreground' : 'text-gray-900'}`}>
              {value}
            </p>
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
            { label: t('vehicle.gps'), value: iotData?.gps_status ?? PLACEHOLDER, ok: !!iotData?.gps_fix },
            { label: t('vehicle.telematics'), value: isConnected ? t('settings.connected') : t('iot.offline'), ok: isConnected },
            { label: t('vehicle.cellular'), value: isConnected ? '4G LTE' : PLACEHOLDER, ok: isConnected },
          ].map(({ label, value, ok }) => (
            <div key={label} className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CheckCircle2 className={`w-5 h-5 ${ok ? 'text-green-600' : 'text-muted-foreground'}`} />
                <span className="text-sm text-gray-700">{label}</span>
              </div>
              <span className={`text-sm font-medium ${ok ? 'text-green-700' : 'text-muted-foreground'}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Load Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className={`text-sm font-semibold text-gray-900 mb-3 ${isRTL ? 'text-right' : ''}`}>{t('vehicle.cargoLoad')}</h3>
        <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className="text-sm text-gray-600">{t('vehicle.currentLoad')}</span>
          <span className={`text-sm font-semibold ${cargoCurrent !== null ? 'text-gray-900' : 'text-muted-foreground'}`}>
            {cargoCurrent !== null ? `${cargoCurrent} / ${cargoMax} kg` : PLACEHOLDER}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${cargoPct ?? 0}%` }}></div>
        </div>
        <p className="text-xs text-gray-600">
          {cargoPct !== null ? `${cargoPct}% ${t('vehicle.capacityUsed')}` : t('iot.lastKnown')}
        </p>
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
      <button
        onClick={() => setIssueDialogOpen(true)}
        className={`w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-150 font-medium flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:outline-none ${isRTL ? 'flex-row-reverse' : ''}`}
      >
        <AlertCircle className="w-5 h-5" />
        {t('vehicle.reportIssue')}
      </button>

      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('vehicle.reportIssue')}</DialogTitle>
            <DialogDescription>{t('vehicle.issue.desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="issue-textarea" className="text-sm font-medium text-foreground">
              {t('vehicle.issue.label')}
            </label>
            <textarea
              id="issue-textarea"
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder={t('vehicle.issue.placeholder')}
              rows={4}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('common.cancel')}</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleSubmitIssue}>
              {t('common.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
