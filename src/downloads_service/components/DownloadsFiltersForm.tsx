'use client';

import React, { useState } from 'react';
import { DownloadsFilters } from '../types/downloads';
import { t } from '../utils/localization';

interface DownloadsFiltersFormProps {
  onFilterChange: (filters: DownloadsFilters) => void;
  loading?: boolean;
}

export const DownloadsFiltersForm: React.FC<DownloadsFiltersFormProps> = ({
  onFilterChange,
  loading,
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [magazineNumber, setMagazineNumber] = useState('');
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const filters: DownloadsFilters = {};

    if (startDate) {
      filters.startDate = startDate.replace(/-/g, ''); // Convert YYYY-MM-DD to YYYYMMDD
    }

    if (endDate) {
      filters.endDate = endDate.replace(/-/g, '');
    }

    if (magazineNumber) {
      filters.magazineNumber = magazineNumber.padStart(4, '0');
    }

    if (database) {
      filters.database = database;
    }

    if (username) {
      filters.username = username;
    }

    if (category) {
      filters.category = category;
    }

    onFilterChange(filters);
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setMagazineNumber('');
    setDatabase('');
    setUsername('');
    setCategory('');
    onFilterChange({});
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-br from-[#C02025] to-red-600 w-10 h-10 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">{t('filtersTitle')}</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('startDate')} <span className="text-[#C02025]">*</span>
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#C02025] focus:ring-2 focus:ring-red-100 text-gray-900 transition-all"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('endDate')} <span className="text-[#C02025]">*</span>
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#C02025] focus:ring-2 focus:ring-red-100 text-gray-900 transition-all"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="magazineNumber" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('magazineNumber')}
            </label>
            <input
              type="text"
              id="magazineNumber"
              value={magazineNumber}
              onChange={(e) => setMagazineNumber(e.target.value)}
              placeholder={t('magazineNumberPlaceholder')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#C02025] focus:ring-2 focus:ring-red-100 text-gray-900 transition-all placeholder-gray-400"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="database" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('database')}
            </label>
            <select
              id="database"
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#C02025] focus:ring-2 focus:ring-red-100 text-gray-900 transition-all"
              disabled={loading}
            >
              <option value="">{t('allDatabases')}</option>
              <option value="edusearch">EduSearch</option>
              <option value="dissertations">Dissertations</option>
              <option value="islamicinfo">Islamic Info</option>
              <option value="humanindex">Human Index</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 bg-gradient-to-r from-[#C02025] to-red-700 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 active:scale-100 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('searching')}
              </span>
            ) : t('applyFilters')}
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="px-8 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 hover:scale-105 active:scale-100 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
          >
            {t('resetFilters')}
          </button>
        </div>
      </form>
    </div>
  );
};
