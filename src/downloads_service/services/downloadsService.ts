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
 */
export async function getDownloadActions(filters: DownloadsFilters): Promise<DownloadAction[]> {
  const { clause, params } = buildDownloadsWhereClause(filters);
  
  // When date filters are applied, use a much higher limit to get all matching records
  // Otherwise use the specified limit or default to 1000
  const hasDateFilter = filters.startDate || filters.endDate;
  const limit = hasDateFilter ? (filters.limit || 100000) : (filters.limit || 1000);
  const offset = filters.offset || 0;

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
    LIMIT ${limit} OFFSET ${offset}
  `;

  const results = await executeStatsQuery<DownloadAction>(query, params);
  console.log('Download actions retrieved:', results.length);
  if (results.length > 0) {
    console.log('Sample yyyymmdd values:', results.slice(0, 3).map(r => r.yyyymmdd));
    console.log('ALL action_labels:', results.map(r => r.action_label));
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
 * Get download statistics aggregated by various dimensions
 */
export async function getDownloadStatistics(filters: DownloadsFilters): Promise<DownloadStats> {
  const records = await getDownloadRecords(filters);

  const totalDownloads = records.length;
  const uniqueVisitors = new Set(records.map(r => r.visitor_id)).size;
  const uniqueSessions = new Set(records.map(r => r.session_id)).size;

  // Group by date
  const dateMap = new Map<string, { count: number; visitors: Set<number> }>();
  for (const record of records) {
    const dateKey = record.yyyymmdd.toString();
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, { count: 0, visitors: new Set() });
    }
    const dateData = dateMap.get(dateKey)!;
    dateData.count++;
    dateData.visitors.add(record.visitor_id);
  }

  const downloadsByDate: DateDownloadCount[] = Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      year: parseInt(date.substring(0, 4)),
      month: parseInt(date.substring(4, 6)),
      day: parseInt(date.substring(6, 8)),
      count: data.count,
      uniqueVisitors: data.visitors.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Group by magazine/dissertation
  const magazineMap = new Map<string, { count: number; visitors: Set<number>; biblio?: BiblioDetails }>();
  const dissertationMap = new Map<string, { count: number; visitors: Set<number>; biblio?: BiblioDetails }>();
  
  for (const record of records) {
    const magNum = record.parsed.magazineNumber;
    const numericMagNum = parseInt(magNum);
    
    // Determine if it's a magazine (1-5999) or dissertation (6000-9999)
    const isMagazine = numericMagNum >= 1 && numericMagNum <= 5999;
    const targetMap = isMagazine ? magazineMap : dissertationMap;
    
    if (!targetMap.has(magNum)) {
      targetMap.set(magNum, { count: 0, visitors: new Set(), biblio: record.biblio });
    }
    const magData = targetMap.get(magNum)!;
    magData.count++;
    magData.visitors.add(record.visitor_id);
    // Update biblio if current one is missing magazineTitle but new one has it
    if (record.biblio?.magazineTitle && !magData.biblio?.magazineTitle) {
      magData.biblio = record.biblio;
    }
  }

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
    .map(([magazineNumber, data]) => {
      const vtiger = vtigerData.get(magazineNumber);
      if (vtiger) {
        console.log(`✅ Enriching magazine ${magazineNumber} with vtiger data:`, vtiger);
      } else {
        console.log(`⚠️ No vtiger data for magazine ${magazineNumber}`);
      }
      return {
        magazineNumber,
        magazineTitle: data.biblio?.magazineTitle,
        issn: data.biblio?.issn || vtiger?.issn,
        count: data.count,
        uniqueVisitors: data.visitors.size,
        vtigerName: vtiger?.magazineName,
        categoryC: vtiger?.categoryC,
        type: 'magazine' as const,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 30); // Top 30 magazines
  
  console.log(`📊 Final downloadsByMagazine array (first 3):`, downloadsByMagazine.slice(0, 3).map(m => ({
    number: m.magazineNumber,
    vtigerName: m.vtigerName,
    kohaTitle: m.magazineTitle,
    categoryC: m.categoryC
  })));

  const downloadsByDissertation: MagazineDownloadCount[] = Array.from(dissertationMap.entries())
    .map(([magazineNumber, data]) => {
      const vtiger = vtigerData.get(magazineNumber);
      if (vtiger) {
        console.log(`✅ Enriching dissertation ${magazineNumber} with vtiger data:`, vtiger);
      } else {
        console.log(`⚠️ No vtiger data for dissertation ${magazineNumber}`);
      }
      return {
        magazineNumber,
        magazineTitle: data.biblio?.magazineTitle,
        issn: data.biblio?.issn || vtiger?.issn,
        count: data.count,
        uniqueVisitors: data.visitors.size,
        vtigerName: vtiger?.magazineName,
        categoryC: vtiger?.categoryC,
        type: 'dissertation' as const,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 30); // Top 30 dissertations
  
  console.log(`📊 Final downloadsByDissertation array (first 3):`, downloadsByDissertation.slice(0, 3).map(d => ({
    number: d.magazineNumber,
    vtigerName: d.vtigerName,
    kohaTitle: d.magazineTitle,
    categoryC: d.categoryC
  })));

  // Group by database
  const databaseMap = new Map<string, { count: number; visitors: Set<number> }>();
  for (const record of records) {
    const db = record.parsed.database || 'unknown';
    if (!databaseMap.has(db)) {
      databaseMap.set(db, { count: 0, visitors: new Set() });
    }
    const dbData = databaseMap.get(db)!;
    dbData.count++;
    dbData.visitors.add(record.visitor_id);
  }

  const downloadsByDatabase: DatabaseDownloadCount[] = Array.from(databaseMap.entries())
    .map(([database, data]) => ({
      database,
      count: data.count,
      uniqueVisitors: data.visitors.size,
    }))
    .sort((a, b) => b.count - a.count);

  // Group by category
  const categoryMap = new Map<string, { count: number; visitors: Set<number> }>();
  for (const record of records) {
    const categories = record.biblio?.categories || [];
    for (const category of categories) {
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { count: 0, visitors: new Set() });
      }
      const catData = categoryMap.get(category)!;
      catData.count++;
      catData.visitors.add(record.visitor_id);
    }
  }

  const downloadsByCategory: CategoryDownloadCount[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      count: data.count,
      uniqueVisitors: data.visitors.size,
    }))
    .sort((a, b) => b.count - a.count);

  // Group by article (biblionumber)
  const articleMap = new Map<number, { count: number; visitors: Set<number>; biblio?: BiblioDetails }>();
  for (const record of records) {
    const biblioNum = record.parsed.biblionumber;
    if (!articleMap.has(biblioNum)) {
      articleMap.set(biblioNum, { count: 0, visitors: new Set(), biblio: record.biblio });
    }
    const artData = articleMap.get(biblioNum)!;
    artData.count++;
    artData.visitors.add(record.visitor_id);
    // Update biblio if current one is missing title but new one has it
    if (record.biblio?.title && !artData.biblio?.title) {
      artData.biblio = record.biblio;
    }
  }

  const topArticles: ArticleDownloadCount[] = Array.from(articleMap.entries())
    .map(([biblionumber, data]) => ({
      biblionumber,
      title: data.biblio?.title,
      author: data.biblio?.author,
      magazineNumber: data.biblio?.magazineNumber,
      magazineTitle: data.biblio?.magazineTitle,
      count: data.count,
      uniqueVisitors: data.visitors.size,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30); // Top 30 articles

  return {
    totalDownloads,
    uniqueVisitors,
    uniqueSessions,
    downloadsByDate,
    downloadsByMagazine,
    downloadsByDissertation,
    downloadsByDatabase,
    downloadsByCategory,
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
