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
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 w-10 h-10 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800">
          {t('topArticlesLimit', 'ar', { limit: limit.toString() })}
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="text-xs font-bold text-gray-700 uppercase bg-gradient-to-l from-gray-50 to-gray-100 border-b-2 border-amber-500">
            <tr>
              <th className="px-6 py-4">{t('rank')}</th>
              <th className="px-6 py-4">{t('biblioNumber')}</th>
              <th className="px-6 py-4">{t('title')}</th>
              <th className="px-6 py-4">{t('author')}</th>
              <th className="px-6 py-4">{t('magazine')}</th>
              <th className="px-6 py-4">{t('downloadCount')}</th>
              <th className="px-6 py-4">{t('uniqueVisitorsCol')}</th>
            </tr>
          </thead>
          <tbody>
            {displayArticles.map((article, index) => (
              <tr key={article.biblionumber} className="bg-white border-b border-gray-100 hover:bg-gradient-to-l hover:from-amber-50/30 hover:to-transparent transition-all duration-150">
                <td className="px-6 py-4 font-bold text-gray-900">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold ${
                    index === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white' :
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-600">
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">{article.biblionumber}</span>
                </td>
                <td className="px-6 py-4 max-w-md truncate text-gray-900 font-medium" title={article.title || ''}>
                  {article.title || t('notAvailable')}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {article.author || '-'}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {article.magazineTitle || article.magazineNumber || '-'}
                </td>
                <td className="px-6 py-4 font-bold text-[#C02025]">
                  {article.count.toLocaleString('ar-EG')}
                </td>
                <td className="px-6 py-4 font-semibold text-emerald-600">
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
