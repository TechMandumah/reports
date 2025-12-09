'use client';

import React from 'react';
import { MagazineDownloadCount } from '../types/downloads';
import { t } from '../utils/localization';

interface MagazineDownloadsTableProps {
  magazines: MagazineDownloadCount[];
  loading?: boolean;
}

export const MagazineDownloadsTable: React.FC<MagazineDownloadsTableProps> = ({
  magazines,
  loading,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (magazines.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {t('downloadsByMagazine')}
        </h3>
        <p className="text-gray-500 text-center py-8">{t('noData')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-br from-[#C02025] to-red-600 w-10 h-10 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800">
          {t('downloadsByMagazine')}
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="text-xs font-bold text-gray-700 uppercase bg-gradient-to-l from-gray-50 to-gray-100 border-b-2 border-[#C02025]">
            <tr>
              <th className="px-6 py-4">{t('magazineNumberCol')}</th>
              <th className="px-6 py-4">{t('magazineName')}</th>
              <th className="px-6 py-4">{t('issn')}</th>
              <th className="px-6 py-4">{t('downloadCount')}</th>
              <th className="px-6 py-4">{t('uniqueVisitorsCol')}</th>
            </tr>
          </thead>
          <tbody>
            {magazines.map((mag, index) => (
              <tr key={index} className="bg-white border-b border-gray-100 hover:bg-gradient-to-l hover:from-red-50/30 hover:to-transparent transition-all duration-150">
                <td className="px-6 py-4 font-bold text-gray-900">
                  <span className="bg-red-100 text-[#C02025] px-3 py-1 rounded-lg">{mag.magazineNumber}</span>
                </td>
                <td className="px-6 py-4 text-gray-900 font-medium">
                  {mag.magazineTitle || t('notAvailable')}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {mag.issn || '-'}
                </td>
                <td className="px-6 py-4 font-bold text-[#C02025]">
                  {mag.count.toLocaleString('ar-EG')}
                </td>
                <td className="px-6 py-4 font-semibold text-emerald-600">
                  {mag.uniqueVisitors.toLocaleString('ar-EG')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
