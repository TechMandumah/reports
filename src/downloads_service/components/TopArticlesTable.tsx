'use client';

import React from 'react';
import { ArticleDownloadCount } from '../types/downloads';
import { t } from '../utils/localization';

interface TopArticlesTableProps {
  articles: ArticleDownloadCount[];
  loading?: boolean;
  limit?: number;
}

export const TopArticlesTable: React.FC<TopArticlesTableProps> = ({
  articles,
  loading,
  limit = 20,
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

  const displayArticles = articles.slice(0, limit);

  if (displayArticles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {t('topArticles')}
        </h3>
        <p className="text-gray-500 text-center py-8">{t('noData')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {t('topArticlesLimit', 'ar', { limit: limit.toString() })}
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">{t('rank')}</th>
              <th className="px-6 py-3">{t('biblioNumber')}</th>
              <th className="px-6 py-3">{t('title')}</th>
              <th className="px-6 py-3">{t('author')}</th>
              <th className="px-6 py-3">{t('magazine')}</th>
              <th className="px-6 py-3">{t('downloadCount')}</th>
              <th className="px-6 py-3">{t('uniqueVisitorsCol')}</th>
            </tr>
          </thead>
          <tbody>
            {displayArticles.map((article, index) => (
              <tr key={article.biblionumber} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-500">
                  {index + 1}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {article.biblionumber}
                </td>
                <td className="px-6 py-4 max-w-md truncate" title={article.title || ''}>
                  {article.title || t('notAvailable')}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {article.author || '-'}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {article.magazineTitle || article.magazineNumber || '-'}
                </td>
                <td className="px-6 py-4 text-blue-600 font-semibold">
                  {article.count.toLocaleString('ar-EG')}
                </td>
                <td className="px-6 py-4 text-green-600">
                  {article.uniqueVisitors.toLocaleString('ar-EG')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
