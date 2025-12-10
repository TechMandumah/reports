'use client';

import React, { useState } from 'react';
import { MagazineDownloadCount, DatabaseDownloadCount, PublisherDownloadCount, ArticleDownloadCount, CategoryCDownloadCount } from '../types/downloads';
import { t } from '../utils/localization';

interface DownloadsTabbedViewProps {
  magazines: MagazineDownloadCount[];
  dissertations: MagazineDownloadCount[];
  articles: ArticleDownloadCount[];
  publishers: PublisherDownloadCount[];
  magazinesByCategoryC: CategoryCDownloadCount[];
  loading?: boolean;
}

type TabType = 'magazines' | 'dissertations' | 'articles' | 'publishers' | 'magazinesByCategoryC';

export const DownloadsTabbedView: React.FC<DownloadsTabbedViewProps> = ({
  magazines,
  dissertations,
  articles,
  publishers,
  magazinesByCategoryC,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('magazines');

  const tabs = [
    { id: 'magazines' as TabType, label: t('magazinesTab'), count: magazines.length, icon: '📚' },
    { id: 'dissertations' as TabType, label: t('dissertationsTab'), count: dissertations.length, icon: '🎓' },
    { id: 'articles' as TabType, label: t('articlesTab'), count: articles.length, icon: '📄' },
    { id: 'publishers' as TabType, label: t('publishersTab'), count: publishers.length, icon: '🏢' },
    { id: 'magazinesByCategoryC' as TabType, label: t('magazinesByCategoryCTab'), count: magazinesByCategoryC.length, icon: '📊' },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 animate-pulse">
        <div className="flex gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-xl flex-1"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Tab Headers */}
      <div className="flex bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-[#C02025] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[200px] px-6 py-4 font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-br from-[#C02025] to-red-700 text-white shadow-lg'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`px-2 py-1 rounded-lg text-sm font-bold ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {tab.count}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-8">
        {activeTab === 'magazines' && (
          <MagazinesContent magazines={magazines} />
        )}
        {activeTab === 'dissertations' && (
          <DissertationsContent dissertations={dissertations} />
        )}
        {activeTab === 'articles' && (
          <ArticlesContent articles={articles} />
        )}
        {activeTab === 'publishers' && (
          <PublishersContent publishers={publishers} />
        )}
        {activeTab === 'magazinesByCategoryC' && (
          <MagazinesByCategoryCContent magazinesByCategoryC={magazinesByCategoryC} />
        )}
      </div>
    </div>
  );
};

// Magazines Tab Content
const MagazinesContent: React.FC<{ magazines: MagazineDownloadCount[] }> = ({ magazines }) => {
  if (magazines.length === 0) {
    return <p className="text-gray-500 text-center py-8">{t('noData')}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-right">
        <thead className="text-xs font-bold text-gray-700 uppercase bg-gradient-to-l from-gray-50 to-gray-100">
          <tr>
            <th className="px-6 py-4">{t('rank')}</th>
            <th className="px-6 py-4">{t('magazineNumberCol')}</th>
            <th className="px-6 py-4">{t('magazineName')}</th>
            <th className="px-6 py-4">{t('categoryC')}</th>
            <th className="px-6 py-4">{t('publisher')}</th>
            <th className="px-6 py-4">{t('downloadCount')}</th>
            <th className="px-6 py-4">{t('uniqueVisitorsCol')}</th>
          </tr>
        </thead>
        <tbody>
          {magazines.map((mag, index) => (
            <tr key={index} className="bg-white border-b border-gray-100 hover:bg-gradient-to-l hover:from-red-50/30 hover:to-transparent transition-all duration-150">
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
              <td className="px-6 py-4 font-bold text-gray-900">
                <span className="bg-red-100 text-[#C02025] px-3 py-1 rounded-lg">{mag.magazineNumber}</span>
              </td>
              <td className="px-6 py-4 text-gray-900 font-medium">
                {mag.vtigerName || mag.magazineTitle || t('notAvailable')}
              </td>
              <td className="px-6 py-4 text-gray-600">
                {mag.categoryC || '-'}
              </td>
              <td className="px-6 py-4 text-gray-600">
                {mag.publisher || '-'}
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
  );
};

// Dissertations Tab Content
const DissertationsContent: React.FC<{ dissertations: MagazineDownloadCount[] }> = ({ dissertations }) => {
  if (dissertations.length === 0) {
    return <p className="text-gray-500 text-center py-8">{t('noData')}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-right">
        <thead className="text-xs font-bold text-gray-700 uppercase bg-gradient-to-l from-gray-50 to-gray-100">
          <tr>
            <th className="px-6 py-4">{t('rank')}</th>
            <th className="px-6 py-4">{t('dissertationNumber')}</th>
            <th className="px-6 py-4">{t('dissertationName')}</th>
            <th className="px-6 py-4">{t('categoryC')}</th>
            <th className="px-6 py-4">{t('downloadCount')}</th>
            <th className="px-6 py-4">{t('uniqueVisitorsCol')}</th>
          </tr>
        </thead>
        <tbody>
          {dissertations.map((diss, index) => (
            <tr key={index} className="bg-white border-b border-gray-100 hover:bg-gradient-to-l hover:from-purple-50/30 hover:to-transparent transition-all duration-150">
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
              <td className="px-6 py-4 font-bold text-gray-900">
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg">{diss.magazineNumber}</span>
              </td>
              <td className="px-6 py-4 text-gray-900 font-medium">
                {diss.vtigerName || diss.magazineTitle || t('notAvailable')}
              </td>
              <td className="px-6 py-4 text-gray-600">
                {diss.categoryC || '-'}
              </td>
              <td className="px-6 py-4 font-bold text-purple-600">
                {diss.count.toLocaleString('ar-EG')}
              </td>
              <td className="px-6 py-4 font-semibold text-emerald-600">
                {diss.uniqueVisitors.toLocaleString('ar-EG')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Articles Tab Content
const ArticlesContent: React.FC<{ articles: ArticleDownloadCount[] }> = ({ articles }) => {
  if (articles.length === 0) {
    return <p className="text-gray-500 text-center py-8">{t('noData')}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-right">
        <thead className="text-xs font-bold text-gray-700 uppercase bg-gradient-to-l from-gray-50 to-gray-100">
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
          {articles.map((article, index) => (
            <tr key={article.biblionumber} className="bg-white border-b border-gray-100 hover:bg-gradient-to-l hover:from-blue-50/30 hover:to-transparent transition-all duration-150">
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
              <td className="px-6 py-4 font-bold text-blue-600">
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
  );
};

// Databases Tab Content
const DatabasesContent: React.FC<{ databases: DatabaseDownloadCount[] }> = ({ databases }) => {
  if (databases.length === 0) {
    return <p className="text-gray-500 text-center py-8">{t('noData')}</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {databases.map((db, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-6 bg-gradient-to-l from-blue-50/50 to-transparent rounded-xl hover:from-blue-100/70 hover:shadow-md transition-all duration-200 border-2 border-blue-100/50"
        >
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-xl mb-2">{db.database}</p>
            <p className="text-sm text-gray-600">
              {db.uniqueVisitors.toLocaleString('ar-EG')} {t('uniqueVisitor')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-blue-600">
              {db.count.toLocaleString('ar-EG')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Publishers Tab Content
const PublishersContent: React.FC<{ publishers: PublisherDownloadCount[] }> = ({ publishers }) => {
  if (publishers.length === 0) {
    return <p className="text-gray-500 text-center py-8">{t('noData')}</p>;
  }

  return (
    <div className="space-y-8">
      {publishers.map((publisher, publisherIndex) => (
        <div key={publisherIndex} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden shadow-lg">
          {/* Publisher Header */}
          <div className="bg-gradient-to-r from-[#C02025] to-red-700 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-1">{publisher.publisher}</h3>
                <p className="text-red-100 text-sm">
                  {publisher.magazineCount} {t('magazine')} • {publisher.totalDownloads.toLocaleString('ar-EG')} {t('downloadCount')} • {publisher.uniqueVisitors.toLocaleString('ar-EG')} {t('uniqueVisitor')}
                </p>
              </div>
              <div className="text-5xl">🏢</div>
            </div>
          </div>

          {/* Magazines Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs font-bold text-gray-700 uppercase bg-gradient-to-l from-gray-100 to-gray-50">
                <tr>
                  <th className="px-6 py-4">{t('rank')}</th>
                  <th className="px-6 py-4">{t('magazineNumber')}</th>
                  <th className="px-6 py-4">{t('magazineName')}</th>
                  <th className="px-6 py-4">{t('categoryC')}</th>
                  <th className="px-6 py-4">{t('downloadCount')}</th>
                  <th className="px-6 py-4">{t('uniqueVisitorsCol')}</th>
                </tr>
              </thead>
              <tbody>
                {publisher.magazines.map((mag, index) => (
                  <tr key={index} className="bg-white border-b border-gray-100 hover:bg-gradient-to-l hover:from-red-50/30 hover:to-transparent transition-all duration-150">
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
                    <td className="px-6 py-4 font-bold text-gray-900">
                      <span className="bg-red-100 text-[#C02025] px-3 py-1 rounded-lg">{mag.magazineNumber}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {mag.vtigerName || mag.magazineTitle || t('notAvailable')}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {mag.categoryC || '-'}
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
      ))}
    </div>
  );
};

// Magazines by Category C Tab Content
const MagazinesByCategoryCContent: React.FC<{ magazinesByCategoryC: CategoryCDownloadCount[] }> = ({ magazinesByCategoryC }) => {
  if (magazinesByCategoryC.length === 0) {
    return <p className="text-gray-500 text-center py-8">{t('noData')}</p>;
  }

  return (
    <div className="space-y-8">
      {magazinesByCategoryC.map((category, categoryIndex) => (
        <div key={categoryIndex} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden shadow-lg">
          {/* Category Header */}
          <div className="bg-gradient-to-r from-[#C02025] to-red-700 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-1">{category.categoryC}</h3>
                <p className="text-red-100 text-sm">
                  {category.magazines.length} {t('magazine')} • {category.totalCount.toLocaleString('ar-EG')} {t('downloadCount')} • {category.totalUniqueVisitors.toLocaleString('ar-EG')} {t('uniqueVisitor')}
                </p>
              </div>
              <div className="text-5xl">📊</div>
            </div>
          </div>

          {/* Magazines Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs font-bold text-gray-700 uppercase bg-gradient-to-l from-gray-100 to-gray-50">
                <tr>
                  <th className="px-6 py-4">{t('rank')}</th>
                  <th className="px-6 py-4">{t('magazineNumber')}</th>
                  <th className="px-6 py-4">{t('magazineName')}</th>
                  <th className="px-6 py-4">{t('publisher')}</th>
                  <th className="px-6 py-4">{t('downloadCount')}</th>
                  <th className="px-6 py-4">{t('uniqueVisitorsCol')}</th>
                </tr>
              </thead>
              <tbody>
                {category.magazines.map((mag, index) => (
                  <tr key={index} className="bg-white border-b border-gray-100 hover:bg-gradient-to-l hover:from-red-50/30 hover:to-transparent transition-all duration-150">
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
                    <td className="px-6 py-4 font-bold text-gray-900">
                      <span className="bg-red-100 text-[#C02025] px-3 py-1 rounded-lg">{mag.magazineNumber}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {mag.vtigerName || mag.magazineTitle || t('notAvailable')}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {mag.publisher || '-'}
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
      ))}
    </div>
  );
};
