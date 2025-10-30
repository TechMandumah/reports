'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConferencesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard - the conference report is now integrated there
    // Store the desired report in sessionStorage so dashboard can load it
    sessionStorage.setItem('activeReport', 'all_conferences');
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Redirecting...</h2>
        <p className="text-gray-600">Taking you to the dashboard</p>
      </div>
    </div>
  );
}
