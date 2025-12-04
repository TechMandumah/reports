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
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {t('downloadsByDatabase')}
          </h3>
          
          {databases.length === 0 ? (
            <p className="text-gray-500 text-center py-4">{t('noData')}</p>
          ) : (
            <div className="space-y-3">
              {databases.map((db, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{db.database}</p>
                    <p className="text-sm text-gray-600">
                      {db.uniqueVisitors.toLocaleString('ar-EG')} {t('uniqueVisitor')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {t('downloadsByCategory')}
          </h3>
          
          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-4">{t('noData')}</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {categories.slice(0, 10).map((cat, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{cat.category}</p>
                    <p className="text-sm text-gray-600">
                      {cat.uniqueVisitors.toLocaleString('ar-EG')} {t('uniqueVisitor')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">
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
