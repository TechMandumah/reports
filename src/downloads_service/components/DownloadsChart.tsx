'use client';

import React from 'react';
import { DateDownloadCount } from '../types/downloads';
import { t } from '../utils/localization';

interface DownloadsChartProps {
  data: DateDownloadCount[];
  loading?: boolean;
}

export const DownloadsChart: React.FC<DownloadsChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {t('downloadsByDate')}
        </h3>
        <p className="text-gray-500 text-center py-8">{t('noData')}</p>
      </div>
    );
  }

  // Find max value for scaling
  const maxCount = Math.max(...data.map(d => d.count));
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {t('downloadsByDate')}
      </h3>
      
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="w-24 text-sm text-gray-600 text-right">
              {formatDate(item.date)}
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div
                className="bg-blue-500 h-8 rounded transition-all hover:bg-blue-600"
                style={{
                  width: `${(item.count / maxCount) * 100}%`,
                  minWidth: '2px',
                }}
                title={`${item.count} ${t('download')}`}
              ></div>
              <span className="text-sm font-semibold text-gray-700">
                {item.count.toLocaleString('ar-EG')}
              </span>
              <span className="text-xs text-gray-500">
                ({item.uniqueVisitors.toLocaleString('ar-EG')} {t('visitor')})
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {data.length > 30 && (
        <p className="text-sm text-gray-500 mt-4 text-center">
          {t('showingLastDays', 'ar', { count: data.length.toString() })}
        </p>
      )}
    </div>
  );
};
