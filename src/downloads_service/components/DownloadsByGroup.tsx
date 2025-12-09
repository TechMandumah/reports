'use client';

import React from 'react';
import { DatabaseDownloadCount, CategoryDownloadCount } from '../types/downloads';
import { t } from '../utils/localization';

interface DownloadsByGroupProps {
  databases?: DatabaseDownloadCount[];
  categories?: CategoryDownloadCount[];
  loading?: boolean;
}

export const DownloadsByGroup: React.FC<DownloadsByGroupProps> = ({
  databases,
  categories,
  loading,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Databases */}
      {databases && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 w-10 h-10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">
              {t('downloadsByDatabase')}
            </h3>
          </div>
          
          {databases.length === 0 ? (
            <p className="text-gray-500 text-center py-4">{t('noData')}</p>
          ) : (
            <div className="space-y-3">
              {databases.map((db, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gradient-to-l from-blue-50/50 to-transparent rounded-xl hover:from-blue-100/70 hover:shadow-md transition-all duration-200 border border-blue-100/50"
                >
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg">{db.database}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {db.uniqueVisitors.toLocaleString('ar-EG')} {t('uniqueVisitor')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">
                      {db.count.toLocaleString('ar-EG')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Categories */}
      {categories && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 w-10 h-10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">
              {t('downloadsByCategory')}
            </h3>
          </div>
          
          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-4">{t('noData')}</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {categories.slice(0, 10).map((cat, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gradient-to-l from-purple-50/50 to-transparent rounded-xl hover:from-purple-100/70 hover:shadow-md transition-all duration-200 border border-purple-100/50"
                >
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg">{cat.category}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {cat.uniqueVisitors.toLocaleString('ar-EG')} {t('uniqueVisitor')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-purple-600">
                      {cat.count.toLocaleString('ar-EG')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
