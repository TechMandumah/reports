'use client';

import React, { useState, useEffect } from 'react';
import { 
  DownloadsFilters, 
  DownloadStats, 
  DateDownloadCount,
  MagazineDownloadCount,
  DatabaseDownloadCount,
  CategoryDownloadCount,
  CategoryCDownloadCount,
  ArticleDownloadCount
} from '@/downloads_service/types/downloads';
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
  const [loadingProgress, setLoadingProgress] = useState<{ current: number; total: number } | null>(null);
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

  // Helper to generate month ranges from start to end date
  const generateMonthRanges = (startDate: string, endDate: string) => {
    const ranges: { start: string; end: string }[] = [];
    const start = new Date(
      parseInt(startDate.substring(0, 4)),
      parseInt(startDate.substring(4, 6)) - 1,
      parseInt(startDate.substring(6, 8))
    );
    const end = new Date(
      parseInt(endDate.substring(0, 4)),
      parseInt(endDate.substring(4, 6)) - 1,
      parseInt(endDate.substring(6, 8))
    );

    let current = new Date(start);
    
    while (current <= end) {
      const year = current.getFullYear();
      const month = current.getMonth();
      
      // First day of month
      const monthStart = new Date(year, month, 1);
      // Last day of month
      const monthEnd = new Date(year, month + 1, 0);
      
      // Adjust first and last months to match the actual range
      const rangeStart = current.getTime() === start.getTime() ? start : monthStart;
      const rangeEnd = monthEnd > end ? end : monthEnd;
      
      const startStr = `${rangeStart.getFullYear()}${String(rangeStart.getMonth() + 1).padStart(2, '0')}${String(rangeStart.getDate()).padStart(2, '0')}`;
      const endStr = `${rangeEnd.getFullYear()}${String(rangeEnd.getMonth() + 1).padStart(2, '0')}${String(rangeEnd.getDate()).padStart(2, '0')}`;
      
      ranges.push({ start: startStr, end: endStr });
      
      // Move to next month
      current = new Date(year, month + 1, 1);
    }
    
    return ranges;
  };

  // Merge multiple DownloadStats into one
  const mergeStats = (statsArray: DownloadStats[]): DownloadStats => {
    if (statsArray.length === 0) {
      throw new Error('No stats to merge');
    }
    if (statsArray.length === 1) {
      return statsArray[0];
    }

    const merged: DownloadStats = {
      totalDownloads: 0,
      uniqueVisitors: 0,
      uniqueSessions: 0,
      downloadsByDate: [],
      downloadsByMagazine: [],
      downloadsByDissertation: [],
      downloadsByDatabase: [],
      downloadsByCategory: [],
      downloadsByCategoryC: [],
      topArticles: [],
    };

    // Aggregate totals
    const allVisitors = new Set<number>();
    const allSessions = new Set<number>();
    
    for (const stat of statsArray) {
      merged.totalDownloads += stat.totalDownloads;
    }

    // Merge downloadsByDate
    const dateMap = new Map<string, DateDownloadCount>();
    for (const stat of statsArray) {
      for (const dateItem of stat.downloadsByDate) {
        if (dateMap.has(dateItem.date)) {
          const existing = dateMap.get(dateItem.date)!;
          existing.count += dateItem.count;
          existing.uniqueVisitors += dateItem.uniqueVisitors;
        } else {
          dateMap.set(dateItem.date, { ...dateItem });
        }
      }
    }
    merged.downloadsByDate = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Merge magazines
    const magazineMap = new Map<string, MagazineDownloadCount>();
    for (const stat of statsArray) {
      for (const mag of stat.downloadsByMagazine) {
        if (magazineMap.has(mag.magazineNumber)) {
          const existing = magazineMap.get(mag.magazineNumber)!;
          existing.count += mag.count;
          existing.uniqueVisitors += mag.uniqueVisitors;
        } else {
          magazineMap.set(mag.magazineNumber, { ...mag });
        }
      }
    }
    merged.downloadsByMagazine = Array.from(magazineMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    // Merge dissertations
    const dissertationMap = new Map<string, MagazineDownloadCount>();
    for (const stat of statsArray) {
      for (const diss of stat.downloadsByDissertation) {
        if (dissertationMap.has(diss.magazineNumber)) {
          const existing = dissertationMap.get(diss.magazineNumber)!;
          existing.count += diss.count;
          existing.uniqueVisitors += diss.uniqueVisitors;
        } else {
          dissertationMap.set(diss.magazineNumber, { ...diss });
        }
      }
    }
    merged.downloadsByDissertation = Array.from(dissertationMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    // Merge databases
    const databaseMap = new Map<string, DatabaseDownloadCount>();
    for (const stat of statsArray) {
      for (const db of stat.downloadsByDatabase) {
        if (databaseMap.has(db.database)) {
          const existing = databaseMap.get(db.database)!;
          existing.count += db.count;
          existing.uniqueVisitors += db.uniqueVisitors;
        } else {
          databaseMap.set(db.database, { ...db });
        }
      }
    }
    merged.downloadsByDatabase = Array.from(databaseMap.values())
      .sort((a, b) => b.count - a.count);

    // Merge categories
    const categoryMap = new Map<string, CategoryDownloadCount>();
    for (const stat of statsArray) {
      for (const cat of stat.downloadsByCategory) {
        if (categoryMap.has(cat.category)) {
          const existing = categoryMap.get(cat.category)!;
          existing.count += cat.count;
          existing.uniqueVisitors += cat.uniqueVisitors;
        } else {
          categoryMap.set(cat.category, { ...cat });
        }
      }
    }
    merged.downloadsByCategory = Array.from(categoryMap.values())
      .sort((a, b) => b.count - a.count);

    // Merge Category C
    const categoryCMap = new Map<string, CategoryCDownloadCount>();
    for (const stat of statsArray) {
      for (const catC of stat.downloadsByCategoryC) {
        if (categoryCMap.has(catC.categoryC)) {
          const existing = categoryCMap.get(catC.categoryC)!;
          existing.totalCount += catC.totalCount;
          existing.totalUniqueVisitors += catC.totalUniqueVisitors;
          // Merge magazines within category
          const magMap = new Map(existing.magazines.map(m => [m.magazineNumber, m]));
          for (const mag of catC.magazines) {
            if (magMap.has(mag.magazineNumber)) {
              const existingMag = magMap.get(mag.magazineNumber)!;
              existingMag.count += mag.count;
              existingMag.uniqueVisitors += mag.uniqueVisitors;
            } else {
              magMap.set(mag.magazineNumber, { ...mag });
            }
          }
          existing.magazines = Array.from(magMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);
        } else {
          categoryCMap.set(catC.categoryC, { ...catC });
        }
      }
    }
    merged.downloadsByCategoryC = Array.from(categoryCMap.values())
      .sort((a, b) => b.totalCount - a.totalCount);

    // Merge articles
    const articleMap = new Map<number, ArticleDownloadCount>();
    for (const stat of statsArray) {
      for (const article of stat.topArticles) {
        if (articleMap.has(article.biblionumber)) {
          const existing = articleMap.get(article.biblionumber)!;
          existing.count += article.count;
          existing.uniqueVisitors += article.uniqueVisitors;
        } else {
          articleMap.set(article.biblionumber, { ...article });
        }
      }
    }
    merged.topArticles = Array.from(articleMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    // Note: uniqueVisitors and uniqueSessions can't be accurately merged
    // Set to total downloads as approximation
    merged.uniqueVisitors = merged.totalDownloads;
    merged.uniqueSessions = merged.totalDownloads;

    return merged;
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
      // Calculate date range in days
      const start = new Date(
        parseInt(newFilters.startDate.substring(0, 4)),
        parseInt(newFilters.startDate.substring(4, 6)) - 1,
        parseInt(newFilters.startDate.substring(6, 8))
      );
      const end = new Date(
        parseInt(newFilters.endDate.substring(0, 4)),
        parseInt(newFilters.endDate.substring(4, 6)) - 1,
        parseInt(newFilters.endDate.substring(6, 8))
      );
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      // If date range is more than 45 days, use monthly chunking
      if (daysDiff > 45) {
        console.log(`📅 Large date range detected (${daysDiff} days). Using monthly chunking...`);
        const monthRanges = generateMonthRanges(newFilters.startDate, newFilters.endDate);
        console.log(`📊 Split into ${monthRanges.length} monthly chunks`);

        const allStats: DownloadStats[] = [];

        for (let i = 0; i < monthRanges.length; i++) {
          const range = monthRanges[i];
          console.log(`🔍 Fetching chunk ${i + 1}/${monthRanges.length}: ${range.start} to ${range.end}`);
          
          setLoadingProgress({ current: i + 1, total: monthRanges.length });

          const params = new URLSearchParams();
          params.append('type', 'all');
          params.append('startDate', range.start);
          params.append('endDate', range.end);
          
          if (newFilters.magazineNumber) params.append('magazineNumber', newFilters.magazineNumber);
          if (newFilters.database) params.append('database', newFilters.database);
          if (newFilters.username) params.append('username', newFilters.username);
          if (newFilters.category) params.append('category', newFilters.category);

          const response = await fetch(`/api/downloads/stats?${params.toString()}`);
          
          if (!response.ok) {
            throw new Error(`HTTP error on chunk ${i + 1}: ${response.status}`);
          }

          const result = await response.json();
          allStats.push(result.data);
          
          // Update loading message with progress
          console.log(`✅ Completed ${i + 1}/${monthRanges.length} chunks`);
        }

        console.log('🔄 Merging all monthly chunks...');
        setLoadingProgress(null);
        const mergedStats = mergeStats(allStats);
        console.log('✅ Merge completed!');
        
        setStats(mergedStats);
      } else {
        // For small date ranges, use single request
        console.log(`📅 Small date range (${daysDiff} days). Using single request...`);
        
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
      }
      
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

        {/* Loading Progress Indicator */}
        {loadingProgress && (
          <div className="mb-6 p-6 bg-white rounded-xl shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center gap-4 mb-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-800 font-semibold text-lg">
                Loading month {loadingProgress.current} of {loadingProgress.total}...
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {Math.round((loadingProgress.current / loadingProgress.total) * 100)}% complete
            </div>
          </div>
        )}

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
