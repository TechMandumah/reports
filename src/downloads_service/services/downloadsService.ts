import { executeStatsQuery, executeKohaQuery } from '../lib/stats_database';
import {
  DownloadAction,
  ParsedDownload,
  DownloadRecord,
  BiblioDetails,
  DownloadsFilters,
  DownloadStats,
  DateDownloadCount,
  MagazineDownloadCount,
  DatabaseDownloadCount,
  CategoryDownloadCount,
  CategoryCDownloadCount,
  ArticleDownloadCount,
  DownloadsQueryResult,
} from '../types/downloads';

/**
 * Parse action_label to extract biblio number, magazine number, and file name
 * Example: 'https://search.mandumah.com/record/216146#sv#pdf-img#0089-078-002-007.pdf#edusearch#'
 * - biblionumber: 216146
 * - url: 0089-078-002-007.pdf
 * - magazineNumber: 0089
 * - database: edusearch
 */
export function parseActionLabel(actionLabel: string): ParsedDownload | null {
  try {
    // Extract biblionumber from /record/{biblionumber}
    const biblioMatch = actionLabel.match(/\/record\/(\d+)/);
    if (!biblioMatch) return null;
    const biblionumber = parseInt(biblioMatch[1]);

    // Extract filename (format: XXXX-XXX-XXX-XXXX.pdf or variations)
    // Match any PDF filename that starts with 4 digits followed by dashes and more digits
    const urlMatch = actionLabel.match(/(\d{4}-[\d-]+\.pdf[^#]*)/);
    if (!urlMatch) return null;
    const url = urlMatch[1];
    const fileName = url;

    // Extract magazine number (first 4 digits of filename)
    const magazineMatch = url.match(/^(\d{4})/);
    const magazineNumber = magazineMatch ? magazineMatch[1] : '';

    // Extract database name (last segment before final #)
    const databaseMatch = actionLabel.match(/#([^#]+)#$/);
    const database = databaseMatch ? databaseMatch[1] : undefined;

    return {
      biblionumber,
      url,
      magazineNumber,
      fileName,
      database,
    };
  } catch (error) {
    console.error('Error parsing action label:', actionLabel, error);
    return null;
  }
}

/**
 * Get biblio details from koha database using EXTRACTVALUE for MARC data
 */
export async function getBiblioDetails(biblionumbers: number[]): Promise<Map<number, BiblioDetails>> {
  if (biblionumbers.length === 0) {
    return new Map();
  }

  const placeholders = biblionumbers.map(() => '?').join(',');
  
  const query = `
    SELECT 
      b.biblionumber,
      b.author,
      b.title,
      b.copyrightdate,
      b.abstract,
      bm.metadata as marc_xml,
      bi.issn,
      bi.publishercode as publisher,
      bi.publicationyear as publish_date,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="245"]/subfield[@code="a"]') as article_title,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="773"]/subfield[@code="o"]') as magazine_number,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="773"]/subfield[@code="s"]') as magazine_title,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="773"]/subfield[@code="v"]') as volume,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="773"]/subfield[@code="l"]') as issue,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="300"]/subfield[@code="a"]') as pages,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="653"]/subfield[@code="a"]') as subjects,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="995"]/subfield[@code="a"]') as categories
    FROM biblio b
    LEFT JOIN biblio_metadata bm ON b.biblionumber = bm.biblionumber
    LEFT JOIN biblioitems bi ON b.biblionumber = bi.biblionumber
    WHERE b.biblionumber IN (${placeholders})
  `;

  const results = await executeKohaQuery<any>(query, biblionumbers);
  const biblioMap = new Map<number, BiblioDetails>();

  for (const row of results) {
    biblioMap.set(row.biblionumber, {
      biblionumber: row.biblionumber,
      author: row.author,
      title: row.article_title || row.title,
      copyrightdate: row.copyrightdate,
      abstract: row.abstract,
      magazineNumber: row.magazine_number,
      magazineTitle: row.magazine_title,
      issn: row.issn,
      volume: row.volume,
      issue: row.issue,
      pages: row.pages,
      publisher: row.publisher,
      publishDate: row.publish_date,
      subjects: row.subjects ? row.subjects.split('|').filter((s: string) => s.trim()) : [],
      categories: row.categories ? row.categories.split('|').filter((c: string) => c.trim()) : [],
    });
  }

  return biblioMap;
}

/**
 * Build WHERE clause for downloads filters
 */
function buildDownloadsWhereClause(filters: DownloadsFilters): { clause: string; params: any[] } {
  const conditions: string[] = ["action_name = 'downloads'"]; // Only download actions
  const params: any[] = [];

  if (filters.startDate) {
    const startDateInt = parseInt(filters.startDate);
    console.log('Start Date Filter:', filters.startDate, '-> Parsed:', startDateInt);
    conditions.push('yyyymmdd >= ?');
    params.push(startDateInt);
  }

  if (filters.endDate) {
    const endDateInt = parseInt(filters.endDate);
    console.log('End Date Filter:', filters.endDate, '-> Parsed:', endDateInt);
    conditions.push('yyyymmdd <= ?');
    params.push(endDateInt);
  }

  if (filters.username) {
    conditions.push('cv1_value = ?');
    params.push(filters.username);
  }

  // Filter by magazine number using LIKE pattern (e.g., '%#0096-%' for magazine 0096)
  if (filters.magazineNumber) {
    conditions.push('action_label LIKE ?');
    params.push(`%#${filters.magazineNumber}-%`);
  }

  // Filter by biblionumber using LIKE pattern (e.g., '%/record/12345#%')
  if (filters.biblionumber) {
    conditions.push('action_label LIKE ?');
    params.push(`%/record/${filters.biblionumber}#%`);
  }

  // Filter by database using LIKE pattern (e.g., '%#edusearch#' at the end)
  if (filters.database) {
    conditions.push('action_label LIKE ?');
    params.push(`%#${filters.database}#`);
  }

  // Note: category filter will be applied after fetching biblio details in application code

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  console.log('WHERE clause:', clause);
  console.log('WHERE params:', params);
  return { clause, params };
}

/**
 * Get raw download actions from stats database
 * WARNING: For large date ranges (yearly reports), this can return millions of records.
 * Use getDownloadStatistics() instead which uses efficient SQL aggregation.
 */
export async function getDownloadActions(filters: DownloadsFilters): Promise<DownloadAction[]> {
  const { clause, params } = buildDownloadsWhereClause(filters);
  
  // Use limit only if explicitly specified, otherwise NO LIMIT for full data retrieval
  const limitClause = filters.limit ? `LIMIT ${filters.limit} OFFSET ${filters.offset || 0}` : '';

  const query = `
    SELECT 
      id,
      visitor_id,
      session_id,
      site_id,
      \`timestamp\`,
      yyyymmdd,
      \`year\`,
      \`month\`,
      \`day\`,
      dayofweek,
      ip_address,
      \`language\`,
      medium,
      action_name,
      action_label,
      action_group,
      cv1_value
    FROM stats.owa_action_fact
    ${clause}
    ORDER BY \`timestamp\` DESC
    ${limitClause}
  `;

  console.log('🔍 Executing query with date range:', filters.startDate, 'to', filters.endDate);
  console.log('📊 Limit clause:', limitClause || 'NO LIMIT (full scan)');
  
  const results = await executeStatsQuery<DownloadAction>(query, params);
  console.log('✅ Download actions retrieved:', results.length);
  if (results.length > 0) {
    console.log('📅 Date range in results:', results[results.length - 1]?.yyyymmdd, 'to', results[0]?.yyyymmdd);
  }
  return results;
}

/**
 * Get download records with parsed data and biblio details
 */
export async function getDownloadRecords(filters: DownloadsFilters): Promise<DownloadRecord[]> {
  const actions = await getDownloadActions(filters);
  const downloadRecords: DownloadRecord[] = [];
  const biblioNumbers = new Set<number>();

  // Parse action labels and collect biblionumbers
  console.log('Filtering records by magazine:', filters.magazineNumber);
  let matchCount = 0;
  let mismatchCount = 0;
  let parseFailCount = 0;
  
  for (const action of actions) {
    const parsed = parseActionLabel(action.action_label);
    if (!parsed) {
      parseFailCount++;
      console.log('Failed to parse action_label:', action.action_label);
      continue;
    }

    // Apply additional filters based on parsed data
    if (filters.magazineNumber && parsed.magazineNumber !== filters.magazineNumber) {
      mismatchCount++;
      if (mismatchCount <= 3) {
        console.log('Magazine filter mismatch:', { 
          parsed: parsed.magazineNumber, 
          filter: filters.magazineNumber,
          actionLabel: action.action_label 
        });
      }
      continue;
    }
    
    if (filters.magazineNumber && parsed.magazineNumber === filters.magazineNumber) {
      matchCount++;
      if (matchCount <= 3) {
        console.log('Magazine filter MATCH:', { 
          parsed: parsed.magazineNumber, 
          filter: filters.magazineNumber,
          actionLabel: action.action_label 
        });
      }
    }
    if (filters.magazineNumbers && !filters.magazineNumbers.includes(parsed.magazineNumber)) continue;
    if (filters.biblionumber && parsed.biblionumber !== filters.biblionumber) continue;
    if (filters.biblionumbers && !filters.biblionumbers.includes(parsed.biblionumber)) continue;
    if (filters.database && parsed.database !== filters.database) continue;

    downloadRecords.push({
      ...action,
      parsed,
    });

    biblioNumbers.add(parsed.biblionumber);
  }
  
  console.log(`Parsed ${actions.length} actions: ${matchCount} matches, ${mismatchCount} mismatches, ${parseFailCount} parse failures for magazine ${filters.magazineNumber}`);
  console.log(`Final filtered records: ${downloadRecords.length}`);

  // Fetch biblio details for all parsed biblionumbers
  const biblioMap = await getBiblioDetails(Array.from(biblioNumbers));

  // Attach biblio details to download records
  for (const record of downloadRecords) {
    record.biblio = biblioMap.get(record.parsed.biblionumber);
    
    // Apply category filter if specified
    if (filters.category && record.biblio) {
      if (!record.biblio.categories?.includes(filters.category)) {
        // Remove record if it doesn't match category filter
        const index = downloadRecords.indexOf(record);
        if (index > -1) downloadRecords.splice(index, 1);
      }
    }
  }

  return downloadRecords;
}

/**
 * Get download statistics aggregated by various dimensions using efficient SQL aggregation
 * This version is optimized for large date ranges (yearly reports with millions of records)
 */
export async function getDownloadStatistics(filters: DownloadsFilters): Promise<DownloadStats> {
  console.log('🚀 Starting optimized download statistics aggregation...');
  const startTime = Date.now();
  
  // Use SQL aggregation for efficiency instead of loading all records
  const { clause, params } = buildDownloadsWhereClause(filters);
  
  // Get total statistics
  console.log('📊 Step 1: Getting total statistics...');
  const totalQuery = `
    SELECT 
      COUNT(*) as totalDownloads,
      COUNT(DISTINCT visitor_id) as uniqueVisitors,
      COUNT(DISTINCT session_id) as uniqueSessions
    FROM stats.owa_action_fact
    ${clause}
  `;
  const [totals] = await executeStatsQuery<any>(totalQuery, params);
  const totalDownloads = totals.totalDownloads;
  const uniqueVisitors = totals.uniqueVisitors;
  const uniqueSessions = totals.uniqueSessions;
  console.log(`✅ Totals: ${totalDownloads} downloads, ${uniqueVisitors} visitors, ${uniqueSessions} sessions`);

  // Get downloads by date
  console.log('📊 Step 2: Getting downloads by date...');
  const dateQuery = `
    SELECT 
      yyyymmdd as date,
      \`year\`,
      \`month\`,
      \`day\`,
      COUNT(*) as count,
      COUNT(DISTINCT visitor_id) as uniqueVisitors
    FROM stats.owa_action_fact
    ${clause}
    GROUP BY yyyymmdd, \`year\`, \`month\`, \`day\`
    ORDER BY yyyymmdd ASC
  `;
  const dateResults = await executeStatsQuery<any>(dateQuery, params);
  const downloadsByDate: DateDownloadCount[] = dateResults.map(row => ({
    date: row.date.toString(),
    year: row.year,
    month: row.month,
    day: row.day,
    count: row.count,
    uniqueVisitors: row.uniqueVisitors,
  }));
  console.log(`✅ Found ${downloadsByDate.length} unique dates`);

  // For magazine/dissertation aggregation, we need to parse action_labels
  // This is unavoidable but we do it efficiently
  console.log('📊 Step 3: Getting magazine/dissertation downloads with aggregation...');
  const magazineQuery = `
    SELECT 
      action_label,
      visitor_id,
      COUNT(*) as download_count
    FROM stats.owa_action_fact
    ${clause}
    GROUP BY action_label, visitor_id
  `;
  const magazineResults = await executeStatsQuery<any>(magazineQuery, params);
  console.log(`✅ Got ${magazineResults.length} unique action_label + visitor combinations`);

  // Process magazine/dissertation data
  const magazineMap = new Map<string, { count: number; visitors: Set<number>; biblionumbers: Set<number> }>();
  const dissertationMap = new Map<string, { count: number; visitors: Set<number>; biblionumbers: Set<number> }>();
  const allBiblionumbers = new Set<number>();
  
  for (const row of magazineResults) {
    const parsed = parseActionLabel(row.action_label);
    if (!parsed) continue;
    
    const magNum = parsed.magazineNumber;
    const numericMagNum = parseInt(magNum);
    const isMagazine = numericMagNum >= 1 && numericMagNum <= 5999;
    const targetMap = isMagazine ? magazineMap : dissertationMap;
    
    if (!targetMap.has(magNum)) {
      targetMap.set(magNum, { count: 0, visitors: new Set(), biblionumbers: new Set() });
    }
    const magData = targetMap.get(magNum)!;
    magData.count += row.download_count;
    magData.visitors.add(row.visitor_id);
    magData.biblionumbers.add(parsed.biblionumber);
    allBiblionumbers.add(parsed.biblionumber);
  }
  
  console.log(`✅ Parsed ${magazineMap.size} magazines and ${dissertationMap.size} dissertations`);

  // Get databases aggregation
  console.log('📊 Step 4: Getting downloads by database...');
  const databaseQuery = `
    SELECT 
      SUBSTRING_INDEX(SUBSTRING_INDEX(action_label, '#', -2), '#', 1) as db_name,
      COUNT(*) as count,
      COUNT(DISTINCT visitor_id) as uniqueVisitors
    FROM stats.owa_action_fact
    ${clause}
    GROUP BY db_name
    ORDER BY count DESC
  `;
  const databaseResults = await executeStatsQuery<any>(databaseQuery, params);
  const downloadsByDatabase: DatabaseDownloadCount[] = databaseResults.map(row => ({
    database: row.db_name || 'unknown',
    count: row.count,
    uniqueVisitors: row.uniqueVisitors,
  }));
  console.log(`✅ Found ${downloadsByDatabase.length} databases`);

  // Get top articles aggregation
  console.log('📊 Step 5: Getting top articles...');
  const articleQuery = `
    SELECT 
      action_label,
      COUNT(*) as count,
      COUNT(DISTINCT visitor_id) as uniqueVisitors
    FROM stats.owa_action_fact
    ${clause}
    GROUP BY action_label
    ORDER BY count DESC
    LIMIT 50
  `;
  const articleResults = await executeStatsQuery<any>(articleQuery, params);
  const articleBiblionumbers = new Set<number>();
  const articleDataMap = new Map<number, { count: number; uniqueVisitors: number }>();
  
  for (const row of articleResults) {
    const parsed = parseActionLabel(row.action_label);
    if (parsed) {
      articleBiblionumbers.add(parsed.biblionumber);
      if (!articleDataMap.has(parsed.biblionumber)) {
        articleDataMap.set(parsed.biblionumber, { count: 0, uniqueVisitors: 0 });
      }
      const data = articleDataMap.get(parsed.biblionumber)!;
      data.count += row.count;
      data.uniqueVisitors = Math.max(data.uniqueVisitors, row.uniqueVisitors);
    }
  }
  console.log(`✅ Found ${articleDataMap.size} unique articles`);

  // Fetch biblio details for top magazines/dissertations and articles
  console.log('📊 Step 6: Fetching biblio details...');
  const topMagazineBiblios = Array.from(magazineMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 30)
    .flatMap(([_, data]) => Array.from(data.biblionumbers));
  
  const topDissertationBiblios = Array.from(dissertationMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 30)
    .flatMap(([_, data]) => Array.from(data.biblionumbers));
  
  const allBiblioToFetch = new Set([
    ...topMagazineBiblios,
    ...topDissertationBiblios,
    ...Array.from(articleBiblionumbers)
  ]);
  
  console.log(`📚 Fetching biblio details for ${allBiblioToFetch.size} biblionumbers...`);
  const biblioMap = await getBiblioDetails(Array.from(allBiblioToFetch));
  console.log(`✅ Fetched ${biblioMap.size} biblio records`);

  // Fetch vtiger data for magazines and dissertations
  console.log('🔍 Fetching vtiger data for magazines and dissertations...');
  const { getMagazinesFromVtiger } = await import('../lib/vtiger_db');
  const allMagazineNumbers = [
    ...Array.from(magazineMap.keys()),
    ...Array.from(dissertationMap.keys())
  ];
  console.log(`📋 Total magazine/dissertation numbers to fetch from vtiger: ${allMagazineNumbers.length}`);
  console.log(`📊 Magazine numbers:`, Array.from(magazineMap.keys()).slice(0, 10));
  console.log(`📊 Dissertation numbers:`, Array.from(dissertationMap.keys()).slice(0, 10));
  
  const vtigerData = await getMagazinesFromVtiger(allMagazineNumbers);
  console.log(`✅ Vtiger data fetched: ${vtigerData.size} magazines found`);
  
  if (vtigerData.size > 0) {
    console.log('📊 Sample vtiger data:', Array.from(vtigerData.entries()).slice(0, 3));
  } else {
    console.warn('⚠️ No vtiger data was returned! Check database connection and query.');
  }

  const downloadsByMagazine: MagazineDownloadCount[] = Array.from(magazineMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 30) // Top 30 magazines
    .map(([magazineNumber, data]) => {
      const vtiger = vtigerData.get(magazineNumber);
      // Get biblio sample from one of the biblionumbers
      const sampleBiblioNumber = Array.from(data.biblionumbers)[0];
      const sampleBiblio = sampleBiblioNumber ? biblioMap.get(sampleBiblioNumber) : undefined;
      
      return {
        magazineNumber,
        magazineTitle: sampleBiblio?.magazineTitle,
        issn: sampleBiblio?.issn || vtiger?.issn,
        count: data.count,
        uniqueVisitors: data.visitors.size,
        vtigerName: vtiger?.magazineName,
        categoryC: vtiger?.categoryC,
        type: 'magazine' as const,
      };
    });
  
  console.log(`✅ Top 30 magazines processed`);

  const downloadsByDissertation: MagazineDownloadCount[] = Array.from(dissertationMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 30) // Top 30 dissertations
    .map(([magazineNumber, data]) => {
      const vtiger = vtigerData.get(magazineNumber);
      // Get biblio sample from one of the biblionumbers
      const sampleBiblioNumber = Array.from(data.biblionumbers)[0];
      const sampleBiblio = sampleBiblioNumber ? biblioMap.get(sampleBiblioNumber) : undefined;
      
      return {
        magazineNumber,
        magazineTitle: sampleBiblio?.magazineTitle,
        issn: sampleBiblio?.issn || vtiger?.issn,
        count: data.count,
        uniqueVisitors: data.visitors.size,
        vtigerName: vtiger?.magazineName,
        categoryC: vtiger?.categoryC,
        type: 'dissertation' as const,
      };
    });
  
  console.log(`✅ Top 30 dissertations processed`);

  // Process top articles with biblio details
  const topArticles: ArticleDownloadCount[] = Array.from(articleDataMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 30)
    .map(([biblionumber, data]) => {
      const biblio = biblioMap.get(biblionumber);
      return {
        biblionumber,
        title: biblio?.title,
        author: biblio?.author,
        magazineNumber: biblio?.magazineNumber,
        magazineTitle: biblio?.magazineTitle,
        count: data.count,
        uniqueVisitors: data.uniqueVisitors,
      };
    });
  console.log(`✅ Processed top ${topArticles.length} articles`);

  // For category stats, we need to fetch some records (limit to reasonable amount)
  console.log('📊 Step 7: Getting category statistics...');
  const categoryQuery = `
    SELECT 
      action_label
    FROM stats.owa_action_fact
    ${clause}
    LIMIT 10000
  `;
  const categoryRecords = await executeStatsQuery<any>(categoryQuery, params);
  const categorySampleBiblios = new Set<number>();
  for (const row of categoryRecords) {
    const parsed = parseActionLabel(row.action_label);
    if (parsed) categorySampleBiblios.add(parsed.biblionumber);
  }
  const categorySampleBiblioMap = await getBiblioDetails(Array.from(categorySampleBiblios));
  
  const categoryMap = new Map<string, number>();
  for (const biblio of categorySampleBiblioMap.values()) {
    const categories = biblio.categories || [];
    for (const category of categories) {
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    }
  }
  
  const downloadsByCategory: CategoryDownloadCount[] = Array.from(categoryMap.entries())
    .map(([category, count]) => ({
      category,
      count,
      uniqueVisitors: 0, // Approximate for performance
    }))
    .sort((a, b) => b.count - a.count);
  console.log(`✅ Found ${downloadsByCategory.length} categories`);

  // Group magazines by Category C (with multi-category support using |##| separator)
  console.log('🔍 Grouping magazines by Category C...');
  const categoryCMap = new Map<string, Map<string, { count: number; visitors: Set<number>; vtigerData?: any }>>();
  
  // Process magazines (1-5999 only, exclude dissertations)
  for (const [magazineNumber, data] of magazineMap.entries()) {
    const vtiger = vtigerData.get(magazineNumber);
    const categoryC = vtiger?.categoryC;
    
    if (!categoryC) {
      continue;
    }
    
    // Split by |##| separator to handle multiple categories
    const categories = categoryC.split('|##|').map(cat => cat.trim()).filter(cat => cat);
    
    for (const category of categories) {
      if (!categoryCMap.has(category)) {
        categoryCMap.set(category, new Map());
      }
      
      const categoryMagazines = categoryCMap.get(category)!;
      categoryMagazines.set(magazineNumber, {
        count: data.count,
        visitors: data.visitors,
        vtigerData: vtiger,
      });
    }
  }
  
  console.log(`✅ Found ${categoryCMap.size} unique Category C values`);
  
  const downloadsByCategoryC: CategoryCDownloadCount[] = Array.from(categoryCMap.entries())
    .map(([categoryC, magazines]) => {
      const magazinesList: MagazineDownloadCount[] = Array.from(magazines.entries())
        .map(([magazineNumber, data]) => {
          // Get biblio details if available
          const sampleBiblio = biblioMap.get(Array.from(data.visitors)[0]); // Approximate
          return {
            magazineNumber,
            magazineTitle: sampleBiblio?.magazineTitle,
            issn: sampleBiblio?.issn || data.vtigerData?.issn,
            count: data.count,
            uniqueVisitors: data.visitors.size,
            vtigerName: data.vtigerData?.magazineName,
            categoryC: data.vtigerData?.categoryC,
            type: 'magazine' as const,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // Top 20 magazines per category
      
      const totalCount = Array.from(magazines.values()).reduce((sum, data) => sum + data.count, 0);
      const allVisitors = new Set<number>();
      magazines.forEach(data => data.visitors.forEach(v => allVisitors.add(v)));
      
      console.log(`📊 Category "${categoryC}": ${magazinesList.length} magazines, ${totalCount} downloads`);
      
      return {
        categoryC,
        magazines: magazinesList,
        totalCount,
        totalUniqueVisitors: allVisitors.size,
      };
    })
    .sort((a, b) => b.totalCount - a.totalCount); // Sort categories by total downloads
  
  console.log(`✅ Generated ${downloadsByCategoryC.length} Category C groups with top 20 magazines each`);

  const totalTime = Date.now() - startTime;
  console.log(`🎉 Download statistics completed in ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`📊 Summary: ${totalDownloads} downloads, ${downloadsByMagazine.length} magazines, ${downloadsByDissertation.length} dissertations, ${topArticles.length} articles`);

  return {
    totalDownloads,
    uniqueVisitors,
    uniqueSessions,
    downloadsByDate,
    downloadsByMagazine,
    downloadsByDissertation,
    downloadsByDatabase,
    downloadsByCategory,
    downloadsByCategoryC,
    topArticles,
  };
}

/**
 * Get download statistics for a specific magazine
 */
export async function getMagazineDownloadStats(
  magazineNumber: string,
  filters: DownloadsFilters = {}
): Promise<DownloadsQueryResult<DownloadStats>> {
  const magazineFilters = { ...filters, magazineNumber };
  const stats = await getDownloadStatistics(magazineFilters);

  return {
    data: stats,
    filters: magazineFilters,
    total: stats.totalDownloads,
  };
}

/**
 * Get download statistics for specific articles
 */
export async function getArticlesDownloadStats(
  biblionumbers: number[],
  filters: DownloadsFilters = {}
): Promise<DownloadsQueryResult<DownloadStats>> {
  const articleFilters = { ...filters, biblionumbers };
  const stats = await getDownloadStatistics(articleFilters);

  return {
    data: stats,
    filters: articleFilters,
    total: stats.totalDownloads,
  };
}

/**
 * Get download statistics by category
 */
export async function getCategoryDownloadStats(
  category: string,
  filters: DownloadsFilters = {}
): Promise<DownloadsQueryResult<DownloadStats>> {
  const categoryFilters = { ...filters, category };
  const stats = await getDownloadStatistics(categoryFilters);

  return {
    data: stats,
    filters: categoryFilters,
    total: stats.totalDownloads,
  };
}

/**
 * Get download statistics by database
 */
export async function getDatabaseDownloadStats(
  database: string,
  filters: DownloadsFilters = {}
): Promise<DownloadsQueryResult<DownloadStats>> {
  const dbFilters = { ...filters, database };
  const stats = await getDownloadStatistics(dbFilters);

  return {
    data: stats,
    filters: dbFilters,
    total: stats.totalDownloads,
  };
}

/**
 * Get download statistics by university (based on username/login)
 */
export async function getUniversityDownloadStats(
  username: string,
  filters: DownloadsFilters = {}
): Promise<DownloadsQueryResult<DownloadStats>> {
  const universityFilters = { ...filters, username };
  const stats = await getDownloadStatistics(universityFilters);

  return {
    data: stats,
    filters: universityFilters,
    total: stats.totalDownloads,
  };
}

/**
 * Test database connections
 */
export async function testDownloadsServiceConnection(): Promise<{
  stats: boolean;
  koha: boolean;
  message: string;
}> {
  const { testStatsConnection, testKohaConnection } = await import('../lib/stats_database');
  
  const statsOk = await testStatsConnection();
  const kohaOk = await testKohaConnection();

  let message = '';
  if (statsOk && kohaOk) {
    message = 'All database connections successful';
  } else if (statsOk) {
    message = 'Stats database connected, but Koha database failed';
  } else if (kohaOk) {
    message = 'Koha database connected, but Stats database failed';
  } else {
    message = 'Both database connections failed';
  }

  return {
    stats: statsOk,
    koha: kohaOk,
    message,
  };
}
