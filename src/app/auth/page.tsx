'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/utils/localization';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const router = useRouter();
  const { language, isRTL } = useLanguage();

  // Get translations for current language
  const t = getTranslation(language);

  // Check if user is blocked on component mount
  useEffect(() => {
    const blockedData = localStorage.getItem('authBlocked');
    if (blockedData) {
      const { until } = JSON.parse(blockedData);
      const blockedUntilDate = new Date(until);
      
      if (blockedUntilDate > new Date()) {
        setBlockedUntil(blockedUntilDate);
        setIsBlocked(true);
      } else {
        localStorage.removeItem('authBlocked');
        localStorage.removeItem('loginAttempts');
      }
    }
  }, []);

  // Update remaining time for blocked users
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isBlocked && blockedUntil) {
      interval = setInterval(() => {
        const now = new Date();
        const remaining = Math.max(0, Math.floor((blockedUntil.getTime() - now.getTime()) / 1000));
        setRemainingTime(remaining);
        
        if (remaining === 0) {
          setIsBlocked(false);
          setBlockedUntil(null);
          localStorage.removeItem('authBlocked');
          localStorage.removeItem('loginAttempts');
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBlocked, blockedUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      setError(t.auth.accountBlocked.replace('{minutes}', Math.ceil(remainingTime / 60).toString()));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store authentication data
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('loginTime', Date.now().toString());
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('authBlocked');
        router.push('/dashboard');
      } else {
        // Increment attempt count
        const currentAttempts = parseInt(localStorage.getItem('loginAttempts') || '0') + 1;
        localStorage.setItem('loginAttempts', currentAttempts.toString());
        setAttemptCount(currentAttempts);
        
        if (currentAttempts >= 19) {
          const blockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
          localStorage.setItem('authBlocked', JSON.stringify({ until: blockUntil.toISOString() }));
          setBlockedUntil(blockUntil);
          setIsBlocked(true);
          setError(t.auth.accountBlocked.replace('{minutes}', '15'));
        } else {
          const remaining = 20 - currentAttempts;
          setError(t.auth.attemptsRemaining + remaining.toString());
        }
      }
    } catch (error) {
      setError(t.auth.invalidCredentials);
    }

    setIsLoading(false);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-red-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t.auth.title}
          </h1>
          <p className="text-gray-600">
            {t.auth.subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
              {t.auth.email}
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white text-black`}
                placeholder={t.auth.email}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2">
              {t.auth.password}
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white text-black`}
                placeholder={t.auth.password}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
              <svg className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{ backgroundColor: '#C02025' }}
            className="w-full text-white py-3 px-4 rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className={`animate-spin rounded-full h-5 w-5 border-b-2 border-white ${isRTL ? 'ml-2' : 'mr-2'}`}></div>
                {t.auth.signingIn}
              </div>
            ) : (
              t.auth.signIn
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="font-semibold text-gray-700 mb-2">{t.auth.accessInfo}</p>
          <div className="text-gray-600">
            <p>{t.auth.contactAdmin}</p>
            <p className="text-xs mt-2 text-gray-500">{t.auth.authorizedOnly}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
