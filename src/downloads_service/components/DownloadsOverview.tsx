'use client';

import React from 'react';
import { DownloadStats } from '../types/downloads';
import { t } from '../utils/localization';

interface DownloadsOverviewProps {
  stats: DownloadStats;
  loading?: boolean;
}

export const DownloadsOverview: React.FC<DownloadsOverviewProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          {t('totalDownloads')}
        </h3>
        <p className="text-3xl font-bold text-blue-600">
          {stats.totalDownloads.toLocaleString('ar-EG')}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          {t('uniqueVisitors')}
        </h3>
        <p className="text-3xl font-bold text-green-600">
          {stats.uniqueVisitors.toLocaleString('ar-EG')}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          {t('uniqueSessions')}
        </h3>
        <p className="text-3xl font-bold text-purple-600">
          {stats.uniqueSessions.toLocaleString('ar-EG')}
        </p>
      </div>
    </div>
  );
};
