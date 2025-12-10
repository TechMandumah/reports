'use client';

import React, { useState, useEffect } from 'react';
import { DownloadsFilters, DownloadStats } from '@/downloads_service/types/downloads';
import { DownloadsOverview } from '@/downloads_service/components/DownloadsOverview';
import { DownloadsFiltersForm } from '@/downloads_service/components/DownloadsFiltersForm';
import { DownloadsTabbedView } from '@/downloads_service/components/DownloadsTabbedView';
import { t } from '@/downloads_service/utils/localization';
import { DownloadsChart } from '@/downloads_service/components/DownloadsChart';

export default function DownloadsPage() {
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [filters, setFilters] = useState<DownloadsFilters>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
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
    // Validate that date range is provided
    if (!newFilters.startDate || !newFilters.endDate) {
      setError(t('dateRangeRequired'));
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('type', 'all');

      if (newFilters.startDate) params.append('startDate', newFilters.startDate);
      if (newFilters.endDate) params.append('endDate', newFilters.endDate);
      if (newFilters.magazineNumber) params.append('magazineNumber', newFilters.magazineNumber);
      if (newFilters.database) params.append('database', newFilters.database);
      if (newFilters.username) params.append('username', newFilters.username);
      if (newFilters.category) params.append('category', newFilters.category);

      const response = await fetch(`/api/downloads/stats?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setStats(result.data);
      setFilters(newFilters);
    } catch (err) {
      console.error('Error loading statistics:', err);
      setError(err instanceof Error ? err.message : t('errorLoadingStats'));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: DownloadsFilters) => {
    loadStatistics(newFilters);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 bg-gradient-to-r from-[#C02025] to-red-700 rounded-2xl shadow-xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-3">
            {t('pageTitle')}
          </h1>
          <p className="text-red-50 text-lg">
            {t('pageDescription')}
          </p>
          
          {/* Connection Status */}
          {connectionStatus && (
            <div className={`mt-6 p-4 rounded-xl backdrop-blur-sm ${
              connectionStatus.stats && connectionStatus.koha
                ? 'bg-white/20 border border-white/30'
                : 'bg-white/20 border border-white/30'
            }`}>
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  connectionStatus.stats && connectionStatus.koha
                    ? 'bg-green-400 animate-pulse'
                    : 'bg-yellow-400 animate-pulse'
                }`}></span>
                <span className="font-medium text-white">
                  {connectionStatus.message}
                </span>
              </div>
              <div className="mt-2 text-sm text-red-50 flex gap-4">
                <span>
                  {connectionStatus.stats ? t('statsDbConnected') : t('statsDbDisconnected')}
                </span>
                <span>
                  {connectionStatus.koha ? t('kohaDbConnected') : t('kohaDbDisconnected')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-5 bg-white border-l-4 border-red-500 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-800 font-semibold">{error}</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <DownloadsFiltersForm onFilterChange={handleFilterChange} loading={loading} />

        {/* Overview Cards */}
        {stats && <DownloadsOverview stats={stats} loading={loading} />}

                {/* Date Chart */}
        {stats && stats.downloadsByDate.length > 0 && (
                   <div className="mb-8">
            <DownloadsChart data={stats.downloadsByDate} loading={loading} />
          </div>
        )}

        {/* Tabbed View - Magazines, Dissertations, Articles, Databases, Magazines by Category C */}
        {stats && (
          <div className="mb-8">
            <DownloadsTabbedView
              magazines={stats.downloadsByMagazine}
              dissertations={stats.downloadsByDissertation}
              articles={stats.topArticles}
              databases={stats.downloadsByDatabase}
              magazinesByCategoryC={stats.downloadsByCategoryC}
              loading={loading}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && !stats && !hasSearched && (
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-16 text-center border border-gray-100">
            <div className="bg-gradient-to-br from-[#C02025] to-red-600 w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              {t('selectDateRange')}
            </h3>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              {t('selectDateRangeDescription')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
