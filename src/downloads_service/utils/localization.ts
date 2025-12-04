// Localization utilities for Downloads Service
// Supports Arabic and English translations

export type Language = 'ar' | 'en';

export const translations = {
  ar: {
    // Page titles and headers
    pageTitle: 'إحصائيات التحميلات',
    pageDescription: 'تتبع وتحليل تحميلات المقالات والمجلات من قواعد البيانات',
    
    // Overview cards
    totalDownloads: 'إجمالي التحميلات',
    uniqueVisitors: 'الزوار الفريدون',
    uniqueSessions: 'الجلسات الفريدة',
    
    // Filters form
    filtersTitle: 'فلترة التحميلات',
    startDate: 'تاريخ البداية',
    endDate: 'تاريخ النهاية',
    magazineNumber: 'رقم المجلة',
    magazineNumberPlaceholder: 'مثال: 0089',
    database: 'قاعدة البيانات',
    allDatabases: 'الكل',
    username: 'اسم المستخدم (جامعة)',
    usernamePlaceholder: 'مثال: egyptkb',
    category: 'التصنيف',
    categoryPlaceholder: 'مثال: EduSearch',
    applyFilters: 'تطبيق الفلترة',
    resetFilters: 'إعادة تعيين',
    searching: 'جاري البحث...',
    
    // Tables
    downloadsByMagazine: 'التحميلات حسب المجلة',
    topArticles: 'المقالات الأكثر تحميلاً',
    topArticlesLimit: 'المقالات الأكثر تحميلاً (أفضل {limit})',
    downloadsByDatabase: 'التحميلات حسب قاعدة البيانات',
    downloadsByCategory: 'التحميلات حسب التصنيف',
    downloadsByDate: 'التحميلات حسب التاريخ',
    
    // Table headers
    rank: '#',
    magazineNumberCol: 'رقم المجلة',
    magazineName: 'اسم المجلة',
    issn: 'ISSN',
    downloadCount: 'عدد التحميلات',
    uniqueVisitorsCol: 'الزوار الفريدون',
    biblioNumber: 'رقم البيبليو',
    title: 'العنوان',
    author: 'المؤلف',
    magazine: 'المجلة',
    
    // Common
    notAvailable: 'غير متوفر',
    noData: 'لا توجد بيانات',
    visitor: 'زائر',
    uniqueVisitor: 'زائر فريد',
    download: 'تحميل',
    
    // Chart
    showingLastDays: 'عرض آخر {count} يوم',
    
    // Connection status
    allConnectionsSuccess: 'All database connections successful',
    statsConnectedKohaFailed: 'Stats database connected, but Koha database failed',
    kohaConnectedStatsFailed: 'Koha database connected, but Stats database failed',
    bothConnectionsFailed: 'Both database connections failed',
    statsDbConnected: 'Stats DB: ✓ متصل',
    statsDbDisconnected: 'Stats DB: ✗ غير متصل',
    kohaDbConnected: 'Koha DB: ✓ متصل',
    kohaDbDisconnected: 'Koha DB: ✗ غير متصل',
    connectionFailed: 'فشل الاتصال بقواعد البيانات: {message}',
    
    // Error messages
    errorLoadingStats: 'حدث خطأ أثناء تحميل الإحصائيات',
    
    // Empty state
    noDataAvailable: 'لا توجد بيانات متاحة',
    useFiltersToSearch: 'استخدم الفلاتر أعلاه للبحث عن إحصائيات التحميلات',
    selectDateRange: 'اختر نطاق التاريخ',
    selectDateRangeDescription: 'الرجاء اختيار تاريخ البداية والنهاية للبحث عن إحصائيات التحميلات',
    dateRangeRequired: 'يجب تحديد تاريخ البداية والنهاية',
  },
  en: {
    // Page titles and headers
    pageTitle: 'Downloads Statistics',
    pageDescription: 'Track and analyze article and magazine downloads from databases',
    
    // Overview cards
    totalDownloads: 'Total Downloads',
    uniqueVisitors: 'Unique Visitors',
    uniqueSessions: 'Unique Sessions',
    
    // Filters form
    filtersTitle: 'Filter Downloads',
    startDate: 'Start Date',
    endDate: 'End Date',
    magazineNumber: 'Magazine Number',
    magazineNumberPlaceholder: 'Example: 0089',
    database: 'Database',
    allDatabases: 'All',
    username: 'Username (University)',
    usernamePlaceholder: 'Example: egyptkb',
    category: 'Category',
    categoryPlaceholder: 'Example: EduSearch',
    applyFilters: 'Apply Filters',
    resetFilters: 'Reset',
    searching: 'Searching...',
    
    // Tables
    downloadsByMagazine: 'Downloads by Magazine',
    topArticles: 'Most Downloaded Articles',
    topArticlesLimit: 'Most Downloaded Articles (Top {limit})',
    downloadsByDatabase: 'Downloads by Database',
    downloadsByCategory: 'Downloads by Category',
    downloadsByDate: 'Downloads by Date',
    
    // Table headers
    rank: '#',
    magazineNumberCol: 'Magazine Number',
    magazineName: 'Magazine Name',
    issn: 'ISSN',
    downloadCount: 'Download Count',
    uniqueVisitorsCol: 'Unique Visitors',
    biblioNumber: 'Biblio Number',
    title: 'Title',
    author: 'Author',
    magazine: 'Magazine',
    
    // Common
    notAvailable: 'Not Available',
    noData: 'No Data',
    visitor: 'visitor',
    uniqueVisitor: 'unique visitor',
    download: 'download',
    
    // Chart
    showingLastDays: 'Showing last {count} days',
    
    // Connection status
    allConnectionsSuccess: 'All database connections successful',
    statsConnectedKohaFailed: 'Stats database connected, but Koha database failed',
    kohaConnectedStatsFailed: 'Koha database connected, but Stats database failed',
    bothConnectionsFailed: 'Both database connections failed',
    statsDbConnected: 'Stats DB: ✓ Connected',
    statsDbDisconnected: 'Stats DB: ✗ Disconnected',
    kohaDbConnected: 'Koha DB: ✓ Connected',
    kohaDbDisconnected: 'Koha DB: ✗ Disconnected',
    connectionFailed: 'Database connection failed: {message}',
    
    // Error messages
    errorLoadingStats: 'Error loading statistics',
    
    // Empty state
    noDataAvailable: 'No Data Available',
    useFiltersToSearch: 'Use the filters above to search for download statistics',
    selectDateRange: 'Select Date Range',
    selectDateRangeDescription: 'Please select start and end dates to search for download statistics',
    dateRangeRequired: 'Start date and end date are required',
  },
};

// Get translation for a key
export function t(key: keyof typeof translations.ar, lang: Language = 'ar', replacements?: Record<string, string | number>): string {
  let text = translations[lang][key] || translations['ar'][key] || key;
  
  // Replace placeholders like {limit}, {count}, {message}
  if (replacements) {
    Object.entries(replacements).forEach(([placeholder, value]) => {
      text = text.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), String(value));
    });
  }
  
  return text;
}

// Export default language
export const defaultLanguage: Language = 'ar';
