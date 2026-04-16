import React from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { mockCostCO2Data, mockUtilizationData, mockWorkloadData } from '@/app/data/mockData';
import { TrendingUp, Download } from 'lucide-react';
import { useLanguage } from '@/app/i18n/LanguageContext';

export function AnalyticsPage() {
  const { t, isRTL } = useLanguage();

  return (
    <div className={`p-8 ${isRTL ? 'text-right' : ''}`}>
      <div className="mb-8">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">{t('analytics.title')}</h1>
            <p className="text-gray-600">{t('analytics.subtitle')}</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            {t('analytics.export')}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Cost vs CO2 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('analytics.costVsCO2')}</h2>
              <p className="text-sm text-gray-600 mt-1">{t('analytics.dailyTrends')}</p>
            </div>
            <div className={`flex items-center gap-2 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">{t('analytics.cost')}</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">{t('analytics.co2')}</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockCostCO2Data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={{ stroke: '#e5e7eb' }} />
              <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={{ stroke: '#e5e7eb' }}
                label={{ value: t('analytics.cost'), angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 12 } }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={{ stroke: '#e5e7eb' }}
                label={{ value: t('analytics.co2'), angle: 90, position: 'insideRight', style: { fill: '#6b7280', fontSize: 12 } }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Line yAxisId="left" type="monotone" dataKey="cost" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} name={t('analytics.cost')} />
              <Line yAxisId="right" type="monotone" dataKey="co2" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} name={t('analytics.co2')} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-700 flex-shrink-0" />
            <p className="text-sm text-green-700">{t('analytics.insight')}</p>
          </div>
        </div>

        {/* Hourly Utilization */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{t('analytics.utilizationTitle')}</h2>
            <p className="text-sm text-gray-600 mt-1">{t('analytics.utilizationDesc')}</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mockUtilizationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={{ stroke: '#e5e7eb' }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={{ stroke: '#e5e7eb' }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="utilization" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {[
              { label: t('analytics.peakHours'), value: '12:00 - 16:00' },
              { label: t('analytics.avgUtilization'), value: '61%' },
              { label: t('analytics.offPeak'), value: '00:00 - 08:00' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">{label}</p>
                <p className="text-lg font-semibold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Driver Workload */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{t('analytics.driverPerf')}</h2>
            <p className="text-sm text-gray-600 mt-1">{t('analytics.driverPerfDesc')}</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockWorkloadData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="driver" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={{ stroke: '#e5e7eb' }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={{ stroke: '#e5e7eb' }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="deliveries" fill="#3b82f6" name={t('analytics.deliveries')} />
              <Bar dataKey="hours" fill="#10b981" name="Hours Worked" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-amber-700" />
              </div>
              <div className={isRTL ? 'text-right' : ''}>
                <p className="text-sm font-medium text-amber-900">{t('analytics.alertTitle')}</p>
                <p className="text-sm text-amber-700 mt-1">{t('analytics.alertDesc')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Table */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{t('analytics.vehiclePerf')}</h2>
            <p className="text-sm text-gray-600 mt-1">{t('analytics.vehiclePerfDesc')}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className={`${isRTL ? 'text-right' : 'text-left'} py-3 px-4 text-sm font-medium text-gray-700`}>{t('analytics.driverName')}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">{t('analytics.deliveries')}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">{t('analytics.onTime')}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">{t('analytics.efficiency')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { name: 'Ahmed Al-Rashid', deliveries: '1,247', onTime: '94.2%', change: '+4.9%' },
                  { name: 'Mohammed Al-Saud', deliveries: '1,189', onTime: '92.8%', change: '+1.4%' },
                  { name: 'Khalid Ibrahim', deliveries: '36.3 SAR', onTime: '37.7 SAR', change: '-3.7%' },
                ].map((row) => (
                  <tr key={row.name}>
                    <td className={`py-3 px-4 text-sm text-gray-900 ${isRTL ? 'text-right' : ''}`}>{row.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">{row.deliveries}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{row.onTime}</td>
                    <td className="py-3 px-4 text-sm text-green-700 text-right">{row.change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
