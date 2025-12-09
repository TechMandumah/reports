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
      <div className="bg-gradient-to-br from-[#C02025] to-red-700 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-red-50">
            {t('totalDownloads')}
          </h3>
          <svg className="w-8 h-8 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <p className="text-4xl font-bold">
          {stats.totalDownloads.toLocaleString('ar-EG')}
        </p>
      </div>

      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-emerald-50">
            {t('uniqueVisitors')}
          </h3>
          <svg className="w-8 h-8 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <p className="text-4xl font-bold">
          {stats.uniqueVisitors.toLocaleString('ar-EG')}
        </p>
      </div>

      <div className="bg-gradient-to-br from-violet-500 to-violet-700 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-violet-50">
            {t('uniqueSessions')}
          </h3>
          <svg className="w-8 h-8 text-violet-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-4xl font-bold">
          {stats.uniqueSessions.toLocaleString('ar-EG')}
        </p>
      </div>
    </div>
  );
};
