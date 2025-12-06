'use client';

import React, { useState, useEffect } from 'react';
import { DownloadsFilters, DownloadStats } from '@/downloads_service/types/downloads';
import { t } from '@/downloads_service/utils/localization';

export default function DownloadsPage() {
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [filters, setFilters] = useState<DownloadsFilters>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'magazines' | 'articles' | 'analytics' | 'universities'>('overview');
  const [connectionStatus, setConnectionStatus] = useState<{
    stats: boolean;
    koha: boolean;
    message: string;
  } | null>(null);

  // Test database connection on mount
  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const response = await fetch('/api/downloads/test-connection');
      const data = await response.json();
      setConnectionStatus(data);
      
      if (!data.success) {
        setError(t('connectionFailed', 'ar', { message: data.message }));
      }
    } catch (err) {
      console.error('Error testing connection:', err);
      setError(t('connectionFailed', 'ar', { message: 'Connection test failed' }));
    }
  };

  const loadStatistics = async (newFilters: DownloadsFilters) => {
    if (!newFilters.startDate || !newFilters.endDate) {
      setError(t('dateRangeRequired'));
      return;
    }

    setLoading(true);
    setError(null);
    setFilters(newFilters);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        type: 'all',
        startDate: newFilters.startDate,
        endDate: newFilters.endDate,
      });

      if (newFilters.magazineNumber) params.append('magazineNumber', newFilters.magazineNumber);
      if (newFilters.database) params.append('database', newFilters.database);
      if (newFilters.username) params.append('username', newFilters.username);
      if (newFilters.category) params.append('category', newFilters.category);

      const response = await fetch(`/api/downloads/stats?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load statistics');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      // setError(t('loadError', 'ar', { message: errorMessage }));
      console.error('Error loading statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: DownloadsFilters) => {
    loadStatistics(newFilters);
  };

  const formatNumber = (num: number) => num.toLocaleString('ar-SA');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50" dir="rtl">
      {/* Top Header Bar - Sticky */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#C02025] to-[#A01820] rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  إحصائيات التحميلات
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  نظام تحليل التحميلات الشامل
                </p>
              </div>
            </div>
            {connectionStatus && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-sm ${
                connectionStatus.stats && connectionStatus.koha 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${
                  connectionStatus.stats && connectionStatus.koha ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}></span>
                <span className={`text-sm font-bold ${
                  connectionStatus.stats && connectionStatus.koha ? 'text-green-700' : 'text-red-700'
                }`}>
                  {connectionStatus.stats && connectionStatus.koha ? 'متصل' : 'غير متصل'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-white border-r-4 border-red-500 rounded-xl shadow-lg p-5 animate-in slide-in-from-top">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-red-900 font-bold">حدث خطأ</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="w-10 h-10 bg-gradient-to-br from-[#C02025] to-[#A01820] rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-gray-900">خيارات البحث</h2>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const newFilters: DownloadsFilters = {
              startDate: formData.get('startDate')?.toString().replace(/-/g, ''),
              endDate: formData.get('endDate')?.toString().replace(/-/g, ''),
              magazineNumber: formData.get('magazineNumber')?.toString() || undefined,
              database: formData.get('database')?.toString() || undefined,
              username: formData.get('username')?.toString() || undefined,
              category: formData.get('category')?.toString() || undefined,
            };
            handleFilterChange(newFilters);
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  تاريخ البداية <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C02025] focus:border-[#C02025] transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  تاريخ النهاية <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C02025] focus:border-[#C02025] transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  رقم المجلة
                </label>
                <input
                  type="text"
                  name="magazineNumber"
                  placeholder="مثال: 1876"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C02025] focus:border-[#C02025] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  قاعدة البيانات
                </label>
                <select
                  name="database"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C02025] focus:border-[#C02025] transition-all font-medium"
                >
                  <option value="">جميع القواعد</option>
                  <option value="edusearch">EduSearch</option>
                  <option value="dissertations">Dissertations</option>
                  <option value="islamicinfo">Islamic Info</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  name="username"
                  placeholder="أدخل اسم المستخدم"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C02025] focus:border-[#C02025] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  الفئة
                </label>
                <input
                  type="text"
                  name="category"
                  placeholder="أدخل الفئة"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C02025] focus:border-[#C02025] transition-all"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 md:flex-none px-8 py-3.5 bg-gradient-to-r from-[#C02025] to-[#A01820] text-white font-bold rounded-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري التحميل...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    بحث
                  </span>
                )}
              </button>
              <button
                type="reset"
                className="px-8 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
              >
                إعادة تعيين
              </button>
            </div>
          </form>
        </div>

        {/* Stats Content */}
        {stats && (
          <>
            {/* Tabs Navigation */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 p-2">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { id: 'overview', label: 'نظرة عامة', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                  { id: 'magazines', label: 'المجلات', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
                  { id: 'articles', label: 'المقالات', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                  { id: 'analytics', label: 'التحليلات', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
                  { id: 'universities', label: 'الجامعات', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-4 rounded-xl font-bold transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-[#C02025] to-[#A01820] text-white shadow-xl transform scale-105'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                      </svg>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl shadow-xl border-2 border-[#C02025] p-6 transform hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-bold mb-2">إجمالي التحميلات</p>
                        <p className="text-4xl font-black text-gray-900">{formatNumber(stats.totalDownloads)}</p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-[#C02025] to-[#A01820] rounded-2xl flex items-center justify-center shadow-2xl">
                        <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-500 p-6 transform hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-bold mb-2">الزوار الفريدون</p>
                        <p className="text-4xl font-black text-gray-900">{formatNumber(stats.uniqueVisitors)}</p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
                        <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-xl border-2 border-green-500 p-6 transform hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-bold mb-2">الجلسات الفريدة</p>
                        <p className="text-4xl font-black text-gray-900">{formatNumber(stats.uniqueSessions)}</p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl">
                        <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Downloads Chart */}
                {stats.downloadsByDate.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#C02025] to-[#A01820] rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                      </div>
                      التحميلات حسب التاريخ
                    </h3>
                    <div className="h-80 flex items-end justify-between gap-1">
                      {stats.downloadsByDate.slice(-30).map((item, index) => {
                        const maxCount = Math.max(...stats.downloadsByDate.map(d => d.count));
                        const height = (item.count / maxCount) * 100;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center group">
                            <div className="relative w-full">
                              <div
                                className="w-full bg-gradient-to-t from-[#C02025] to-[#ff6b70] rounded-t-xl transition-all group-hover:from-[#A01820] group-hover:to-[#C02025] cursor-pointer shadow-lg"
                                style={{ height: `${Math.max(height * 2.5, 10)}px` }}
                                title={`${item.date}: ${formatNumber(item.count)} تحميل`}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Magazines Tab */}
            {activeTab === 'magazines' && stats.downloadsByMagazine.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#C02025] to-[#A01820] rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    التحميلات حسب المجلة
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-right text-xs font-black text-gray-700 uppercase tracking-wider">#</th>
                        <th className="px-6 py-4 text-right text-xs font-black text-gray-700 uppercase tracking-wider">رقم المجلة</th>
                        <th className="px-6 py-4 text-right text-xs font-black text-gray-700 uppercase tracking-wider">اسم المجلة</th>
                        <th className="px-6 py-4 text-right text-xs font-black text-gray-700 uppercase tracking-wider">التحميلات</th>
                        <th className="px-6 py-4 text-right text-xs font-black text-gray-700 uppercase tracking-wider">الزوار</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {stats.downloadsByMagazine.slice(0, 50).map((mag, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-black ${
                              index < 3 ? 'bg-gradient-to-br from-[#C02025] to-[#A01820] text-white shadow-lg' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-4 py-2 inline-flex text-sm leading-5 font-black rounded-full bg-[#C02025] bg-opacity-10 text-[#C02025]">
                              {mag.magazineNumber}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-bold">{mag.magazineTitle || 'غير متوفر'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900">{formatNumber(mag.count)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-600">{formatNumber(mag.uniqueVisitors)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Articles Tab */}
            {activeTab === 'articles' && stats.topArticles.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#C02025] to-[#A01820] rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    أكثر المقالات تحميلاً
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-right text-xs font-black text-gray-700 uppercase tracking-wider">#</th>
                        <th className="px-6 py-4 text-right text-xs font-black text-gray-700 uppercase tracking-wider">رقم الببليو</th>
                        <th className="px-6 py-4 text-right text-xs font-black text-gray-700 uppercase tracking-wider">عنوان المقال</th>
                        <th className="px-6 py-4 text-right text-xs font-black text-gray-700 uppercase tracking-wider">المؤلف</th>
                        <th className="px-6 py-4 text-right text-xs font-black text-gray-700 uppercase tracking-wider">التحميلات</th>
                        <th className="px-6 py-4 text-right text-xs font-black text-gray-700 uppercase tracking-wider">الزوار</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {stats.topArticles.slice(0, 50).map((article, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black ${
                              index < 3 ? 'bg-gradient-to-br from-[#C02025] to-[#A01820] text-white shadow-lg' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-600">{article.biblionumber}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-bold max-w-md truncate">{article.title || 'غير متوفر'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 font-medium max-w-xs truncate">{article.author || 'غير متوفر'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900">{formatNumber(article.count)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-600">{formatNumber(article.uniqueVisitors)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {stats.downloadsByDatabase.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#C02025] to-[#A01820] rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                      </div>
                      التحميلات حسب قاعدة البيانات
                    </h3>
                    <div className="space-y-6">
                      {stats.downloadsByDatabase.map((db, index) => {
                        const maxCount = Math.max(...stats.downloadsByDatabase.map(d => d.count));
                        const percentage = (db.count / maxCount) * 100;
                        return (
                          <div key={index}>
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-black text-gray-700">{db.database}</span>
                              <span className="text-lg font-black text-gray-900">{formatNumber(db.count)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                              <div
                                className="h-full bg-gradient-to-r from-[#C02025] to-[#A01820] rounded-full transition-all duration-700 shadow-lg"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {stats.downloadsByCategory.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      التحميلات حسب الفئة
                    </h3>
                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                      {stats.downloadsByCategory.slice(0, 20).map((cat, index) => {
                        const maxCount = Math.max(...stats.downloadsByCategory.map(c => c.count));
                        const percentage = (cat.count / maxCount) * 100;
                        return (
                          <div key={index}>
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-black text-gray-700">{cat.category}</span>
                              <span className="text-lg font-black text-gray-900">{formatNumber(cat.count)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 shadow-lg"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Universities Tab */}
            {activeTab === 'universities' && (
              <div className="space-y-8">
                {/* Universities Overview Card */}
                <div className="bg-gradient-to-br from-[#C02025] to-[#A01820] rounded-2xl shadow-2xl p-8 text-white">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                      <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-3xl font-black">الجامعات الأكثر تحميلاً</h2>
                      <p className="text-white/80 text-lg mt-1">تحليل التحميلات حسب الجامعات والمؤسسات الأكاديمية</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                      <p className="text-white/70 text-sm mb-2">عدد الجامعات</p>
                      <p className="text-4xl font-black">{formatNumber(stats.topUniversities.length)}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                      <p className="text-white/70 text-sm mb-2">إجمالي الزوار</p>
                      <p className="text-4xl font-black">
                        {formatNumber(stats.topUniversities.reduce((sum, u) => sum + u.uniqueVisitors, 0))}
                      </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                      <p className="text-white/70 text-sm mb-2">إجمالي التحميلات</p>
                      <p className="text-4xl font-black">
                        {formatNumber(stats.topUniversities.reduce((sum, u) => sum + u.count, 0))}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Universities Table */}
                {stats.topUniversities && stats.topUniversities.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
                      <h3 className="text-2xl font-black text-gray-900">قائمة الجامعات المفصلة</h3>
                      <p className="text-gray-600 mt-2">ترتيب الجامعات حسب عدد التحميلات</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                          <tr>
                            <th className="px-8 py-5 text-right text-sm font-black text-gray-700 border-b-2 border-gray-200">
                              #
                            </th>
                            <th className="px-8 py-5 text-right text-sm font-black text-gray-700 border-b-2 border-gray-200">
                              اسم الجامعة
                            </th>
                            <th className="px-8 py-5 text-right text-sm font-black text-gray-700 border-b-2 border-gray-200">
                              اسم المستخدم
                            </th>
                            <th className="px-8 py-5 text-right text-sm font-black text-gray-700 border-b-2 border-gray-200">
                              عدد التحميلات
                            </th>
                            <th className="px-8 py-5 text-right text-sm font-black text-gray-700 border-b-2 border-gray-200">
                              الزوار الفريدون
                            </th>
                            <th className="px-8 py-5 text-right text-sm font-black text-gray-700 border-b-2 border-gray-200">
                              الجلسات الفريدة
                            </th>
                            <th className="px-8 py-5 text-right text-sm font-black text-gray-700 border-b-2 border-gray-200">
                              النسبة
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.topUniversities.map((university, index) => {
                            const totalDownloads = stats.topUniversities.reduce((sum, u) => sum + u.count, 0);
                            const percentage = ((university.count / totalDownloads) * 100).toFixed(1);
                            const isTop3 = index < 3;
                            
                            return (
                              <tr 
                                key={index}
                                className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-[#C02025]/5 hover:to-transparent transition-all ${
                                  isTop3 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''
                                }`}
                              >
                                <td className="px-8 py-6">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                                    isTop3 
                                      ? 'bg-gradient-to-br from-[#C02025] to-[#A01820] text-white shadow-lg' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {index + 1}
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-3">
                                    {isTop3 && (
                                      <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    )}
                                    <span className={`font-bold ${isTop3 ? 'text-gray-900 text-lg' : 'text-gray-700'}`}>
                                      {university.universityName || 'غير محدد'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <span className="text-gray-600 font-medium">
                                    {university.username}
                                  </span>
                                </td>
                                <td className="px-8 py-6">
                                  <span className="text-gray-900 font-black text-lg">
                                    {formatNumber(university.count)}
                                  </span>
                                </td>
                                <td className="px-8 py-6">
                                  <span className="text-gray-700 font-bold">
                                    {formatNumber(university.uniqueVisitors)}
                                  </span>
                                </td>
                                <td className="px-8 py-6">
                                  <span className="text-gray-700 font-bold">
                                    {formatNumber(university.uniqueSessions)}
                                  </span>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-[#C02025] to-[#A01820] rounded-full transition-all duration-700"
                                        style={{ width: `${percentage}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700 min-w-[50px]">
                                      {percentage}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Summary Footer */}
                    <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-t-2 border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">إجمالي الجامعات</p>
                          <p className="text-2xl font-black text-gray-900">
                            {formatNumber(stats.topUniversities.length)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">إجمالي التحميلات</p>
                          <p className="text-2xl font-black text-[#C02025]">
                            {formatNumber(stats.topUniversities.reduce((sum, u) => sum + u.count, 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">إجمالي الزوار</p>
                          <p className="text-2xl font-black text-blue-600">
                            {formatNumber(stats.topUniversities.reduce((sum, u) => sum + u.uniqueVisitors, 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">إجمالي الجلسات</p>
                          <p className="text-2xl font-black text-green-600">
                            {formatNumber(stats.topUniversities.reduce((sum, u) => sum + u.uniqueSessions, 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* No Data State */}
                {(!stats.topUniversities || stats.topUniversities.length === 0) && (
                  <div className="bg-white rounded-2xl shadow-xl border-2 border-dashed border-gray-300 p-20 text-center">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mb-6">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-black text-gray-700 mb-3">
                      لا توجد بيانات للجامعات
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      لم يتم العثور على بيانات للجامعات في الفترة المحددة
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && !stats && !hasSearched && (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-dashed border-gray-300 p-20 text-center">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-3xl font-black text-gray-700 mb-4">
              اختر نطاق التاريخ للبدء
            </h3>
            <p className="text-gray-500 max-w-md mx-auto text-lg">
              حدد تاريخ البداية والنهاية لعرض إحصائيات التحميلات التفصيلية
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-20 text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-[#C02025] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 font-bold text-lg">جاري تحميل البيانات...</p>
            <p className="text-gray-500 text-sm mt-2">يرجى الانتظار</p>
          </div>
        )}
      </div>
    </div>
  );
}
