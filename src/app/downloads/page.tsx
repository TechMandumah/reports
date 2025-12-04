'use client';

import React, { useState, useEffect } from 'react';
import { DownloadsFilters, DownloadStats } from '@/downloads_service/types/downloads';
import { DownloadsOverview } from '@/downloads_service/components/DownloadsOverview';
import { DownloadsFiltersForm } from '@/downloads_service/components/DownloadsFiltersForm';
import { MagazineDownloadsTable } from '@/downloads_service/components/MagazineDownloadsTable';
import { TopArticlesTable } from '@/downloads_service/components/TopArticlesTable';
import { DownloadsByGroup } from '@/downloads_service/components/DownloadsByGroup';
import { DownloadsChart } from '@/downloads_service/components/DownloadsChart';
import { t } from '@/downloads_service/utils/localization';

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
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {t('pageTitle')}
          </h1>
          <p className="text-gray-600">
            {t('pageDescription')}
          </p>
          
          {/* Connection Status */}
          {connectionStatus && (
            <div className={`mt-4 p-4 rounded-lg ${
              connectionStatus.stats && connectionStatus.koha
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${
                  connectionStatus.stats && connectionStatus.koha
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}></span>
                <span className={`font-medium ${
                  connectionStatus.stats && connectionStatus.koha
                    ? 'text-green-800'
                    : 'text-red-800'
                }`}>
                  {connectionStatus.message}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <span className="ml-4">
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 font-medium">{error}</span>
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

        {/* Magazines Table */}
        {stats && stats.downloadsByMagazine.length > 0 && (
          <div className="mb-8">
            <MagazineDownloadsTable magazines={stats.downloadsByMagazine} loading={loading} />
          </div>
        )}

        {/* Top Articles Table */}
        {stats && stats.topArticles.length > 0 && (
          <div className="mb-8">
            <TopArticlesTable articles={stats.topArticles} loading={loading} limit={20} />
          </div>
        )}

        {/* Database and Category Groups */}
        {stats && (stats.downloadsByDatabase.length > 0 || stats.downloadsByCategory.length > 0) && (
          <div className="mb-8">
            <DownloadsByGroup
              databases={stats.downloadsByDatabase}
              categories={stats.downloadsByCategory}
              loading={loading}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && !stats && !hasSearched && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {t('selectDateRange')}
            </h3>
            <p className="text-gray-500">
              {t('selectDateRangeDescription')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
