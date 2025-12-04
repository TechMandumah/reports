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
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{t('filtersTitle')}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              {t('startDate')} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              {t('endDate')} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="magazineNumber" className="block text-sm font-medium text-gray-700 mb-1">
              {t('magazineNumber')}
            </label>
            <input
              type="text"
              id="magazineNumber"
              value={magazineNumber}
              onChange={(e) => setMagazineNumber(e.target.value)}
              placeholder={t('magazineNumberPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="database" className="block text-sm font-medium text-gray-700 mb-1">
              {t('database')}
            </label>
            <select
              id="database"
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">{t('allDatabases')}</option>
              <option value="edusearch">EduSearch</option>
              <option value="dissertations">Dissertations</option>
              <option value="islamicinfo">Islamic Info</option>
              <option value="humanindex">Human Index</option>
            </select>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              {t('username')}
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('usernamePlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              {t('category')}
            </label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={t('categoryPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? t('searching') : t('applyFilters')}
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {t('resetFilters')}
          </button>
        </div>
      </form>
    </div>
  );
};
