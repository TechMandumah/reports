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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {t('downloadsByMagazine')}
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">{t('magazineNumberCol')}</th>
              <th className="px-6 py-3">{t('magazineName')}</th>
              <th className="px-6 py-3">{t('issn')}</th>
              <th className="px-6 py-3">{t('downloadCount')}</th>
              <th className="px-6 py-3">{t('uniqueVisitorsCol')}</th>
            </tr>
          </thead>
          <tbody>
            {magazines.map((mag, index) => (
              <tr key={index} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {mag.magazineNumber}
                </td>
                <td className="px-6 py-4">
                  {mag.magazineTitle || t('notAvailable')}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {mag.issn || '-'}
                </td>
                <td className="px-6 py-4 text-blue-600 font-semibold">
                  {mag.count.toLocaleString('ar-EG')}
                </td>
                <td className="px-6 py-4 text-green-600">
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
