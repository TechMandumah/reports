'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/utils/localization';

interface Job {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export default function JobStatusTracker() {
  const { language, isRTL } = useLanguage();
  const t = getTranslation(language);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        throw new Error('User email not found');
      }

      const response = await fetch(`/api/jobs?userEmail=${encodeURIComponent(userEmail)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const jobsData = await response.json();
      setJobs(jobsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    
    // Poll for updates every 5 seconds for running jobs
    const interval = setInterval(() => {
      const hasRunningJobs = jobs.some(job => job.status === 'running' || job.status === 'pending');
      if (hasRunningJobs) {
        fetchJobs();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [jobs]);

  const getJobTypeLabel = (type: string) => {
    switch (type) {
      case 'magazines_export':
        return language === 'ar' ? 'تصدير الدوريات' : 'Magazines Export';
      case 'conferences_export':
        return language === 'ar' ? 'تصدير المؤتمرات' : 'Conferences Export';
      case 'custom_report':
        return language === 'ar' ? 'تقرير مخصص' : 'Custom Report';
      default:
        return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return language === 'ar' ? 'في الانتظار' : 'Pending';
      case 'running':
        return language === 'ar' ? 'جارٍ التشغيل' : 'Running';
      case 'completed':
        return language === 'ar' ? 'مكتمل' : 'Completed';
      case 'failed':
        return language === 'ar' ? 'فشل' : 'Failed';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'running':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2">{language === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">
          {language === 'ar' ? 'خطأ في تحميل المهام:' : 'Error loading jobs:'} {error}
        </p>
        <button
          onClick={fetchJobs}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {language === 'ar' ? 'لا توجد مهام' : 'No Jobs Found'}
        </h3>
        <p className="text-gray-600">
          {language === 'ar' 
            ? 'لم تقم بإرسال أي مهام للخلفية بعد.'
            : 'You haven\'t submitted any background jobs yet.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          {language === 'ar' ? 'مهام الخلفية' : 'Background Jobs'}
        </h3>
        <button
          onClick={fetchJobs}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {language === 'ar' ? '🔄 تحديث' : '🔄 Refresh'}
        </button>
      </div>

      <div className="space-y-3">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">
                  {getJobTypeLabel(job.type)}
                </h4>
                <p className="text-sm text-gray-600">
                  {language === 'ar' ? 'تم الإرسال:' : 'Submitted:'} {formatDate(job.createdAt)}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                {getStatusLabel(job.status)}
              </span>
            </div>

            {/* Progress Bar */}
            {(job.status === 'running' || job.status === 'completed') && (
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>{language === 'ar' ? 'التقدم' : 'Progress'}</span>
                  <span>{job.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      job.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${job.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="text-xs text-gray-500 space-y-1">
              {job.startedAt && (
                <div>
                  {language === 'ar' ? 'بدأ في:' : 'Started:'} {formatDate(job.startedAt)}
                </div>
              )}
              {job.completedAt && (
                <div>
                  {language === 'ar' ? 'انتهى في:' : 'Completed:'} {formatDate(job.completedAt)}
                </div>
              )}
            </div>

            {/* Error Message */}
            {job.error && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <strong>{language === 'ar' ? 'خطأ:' : 'Error:'}</strong> {job.error}
              </div>
            )}

            {/* Success Message */}
            {job.status === 'completed' && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                <strong>{language === 'ar' ? '✅ تم بنجاح!' : '✅ Completed!'}</strong>{' '}
                {language === 'ar' 
                  ? 'تم إرسال الملف إلى بريدك الإلكتروني.'
                  : 'The file has been sent to your email.'
                }
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Auto-refresh indicator */}
      {jobs.some(job => job.status === 'running' || job.status === 'pending') && (
        <div className="text-center text-sm text-gray-500 mt-4">
          <div className="flex items-center justify-center">
            <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            {language === 'ar' 
              ? 'يتم التحديث التلقائي كل 5 ثواني...'
              : 'Auto-refreshing every 5 seconds...'
            }
          </div>
        </div>
      )}
    </div>
  );
}