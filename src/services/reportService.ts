import { executeQuery } from '@/lib/database';
import { BiblioRecord, BiblioMetadata, BiblioItems, ReportQueryResult, QueryFilters } from '@/types/database';
import { detectLanguage } from '@/utils/languageDetection';

// Query timeout configuration (20 minutes)
const QUERY_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes

// Base URL configurations
const BASE_URLS = {
  cataloging: 'https://cataloging.mandumah.com',
  citation: 'https://citation-db.mandumah.com'
};

// Report type configurations for database differences
const REPORT_DB_CONFIG = {
  export_citation_entry: { usesDifferentDB: true, baseUrl: BASE_URLS.citation },
  export_translations_citation_title: { usesDifferentDB: true, baseUrl: BASE_URLS.citation },
  export_translations_citation_author: { usesDifferentDB: true, baseUrl: BASE_URLS.citation },
  default: { usesDifferentDB: false, baseUrl: BASE_URLS.cataloging }
};

// Build WHERE clause for biblio numbers filter
function buildBiblioNumbersFilter(biblioNumbers?: string[]): { clause: string; params: any[] } {
  if (!biblioNumbers || biblioNumbers.length === 0) {
    return { clause: '', params: [] };
  }
  
  // Convert biblio numbers to integers - keep original values for direct DB matching
  // The database biblionumber field is int(11) so we should match exactly
  const biblioNums = biblioNumbers.map(num => {
    const cleanNum = num.trim();
    return parseInt(cleanNum) || 0;
  }).filter(num => num > 0); // Remove any invalid numbers
  
  if (biblioNums.length === 0) {
    return { clause: '', params: [] };
  }
  
  const placeholders = biblioNums.map(() => '?').join(',');
  
  return {
    clause: `AND b.biblionumber IN (${placeholders})`,
    params: biblioNums
  };
}

// Build WHERE clause for magazine numbers filter
function buildMagazineNumbersFilter(magazineNumbers?: string[]): { clause: string; params: any[] } {
  if (!magazineNumbers || magazineNumbers.length === 0) {
    return { clause: '', params: [] };
  }
  
  // Convert magazine numbers to integers and create placeholders
  const magazineNums = magazineNumbers.map(num => parseInt(num.replace(/^0+/, '') || '0'));
  const placeholders = magazineNums.map(() => '?').join(',');
  
  return {
    clause: `AND bi.journalnum IN (${placeholders})`,
    params: magazineNums
  };
}

// Build WHERE clause for year range filter
function buildYearRangeFilter(startYear?: number, endYear?: number): { clause: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];
  
  if (startYear) {
    conditions.push('b.copyrightdate >= ?');
    params.push(startYear);
  }
  
  if (endYear) {
    conditions.push('b.copyrightdate <= ?');
    params.push(endYear);
  }
  
  return {
    clause: conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '',
    //Example return if start year = 2000 and end year = 2020:
    params
  };
}

// Build WHERE clause for author filter
function buildAuthorFilter(authorName?: string): { clause: string; params: any[] } {
  if (!authorName) {
    return { clause: '', params: [] };
  }
  
  return {
    clause: 'AND b.author LIKE ?',
    params: [`%${authorName}%`]
  };
}

// Build WHERE clause for URL list filter (for convert_url_to_biblio report)
function buildUrlListFilter(urlList?: string[]): { clause: string; params: any[] } {
  if (!urlList || urlList.length === 0) {
    return { clause: '', params: [] };
  }
  
  // URLs are in format: 0005-343-232.pdf
  // We need to match them against the url field in biblioitems table
  const placeholders = urlList.map(() => '?').join(',');
  
  return {
    clause: `AND bi.url IN (${placeholders})`,
    params: urlList
  };
}

// Build WHERE clause for abstract filter using EXTRACTVALUE for efficiency
function buildAbstractFilter(abstractFilter?: string): { clause: string; params: any[] } {
  if (!abstractFilter) {
    return { clause: '', params: [] };
  }
  
  switch (abstractFilter) {
    case 'without_abstract':
      // Records with no abstract - ALL abstract fields must be empty or null (AND logic)
      return {
        clause: `AND (b.abstract IS NULL OR b.abstract = "")
                 AND (EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="a"]') = "" 
                      OR EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="a"]') IS NULL)
                 AND (EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="b"]') = "" 
                      OR EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="b"]') IS NULL)
                 AND (EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="d"]') = "" 
                      OR EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="d"]') IS NULL)
                 AND (EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="e"]') = "" 
                      OR EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="e"]') IS NULL)
                 AND (EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="f"]') = "" 
                      OR EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="f"]') IS NULL)`,
        params: []
      };
    
    case 'missing_english':
      // Subfield 'a' available, but 'b' and 'f' empty using EXTRACTVALUE
      return {
        clause: `AND EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="a"]') != "" 
                 AND EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="a"]') IS NOT NULL
                 AND (EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="b"]') = "" 
                      OR EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="b"]') IS NULL)
                 AND (EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="f"]') = "" 
                      OR EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="f"]') IS NULL)`,
        params: []
      };
    
    case 'other_language':
      // Subfield 'd' available, all others empty using EXTRACTVALUE
      return {
        clause: `AND EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="d"]') != "" 
                 AND EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="d"]') IS NOT NULL
                 AND (EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="a"]') = "" 
                      OR EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="a"]') IS NULL)
                 AND (EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="b"]') = "" 
                      OR EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="b"]') IS NULL)
                 AND (EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="e"]') = "" 
                      OR EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="e"]') IS NULL)
                 AND (EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="f"]') = "" 
                      OR EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="f"]') IS NULL)`,
        params: []
      };
      
    case 'mandumah_abstract':
      // Records where BOTH subfield 'a' AND 'e' are empty or null (Mandumah needs to add abstract)
      return {
        clause: `AND (EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="a"]') = ""
                      OR EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="a"]') IS NULL)
                 AND (EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="e"]') = ""
                      OR EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="e"]') IS NULL)`,
        params: []
      };
    
    default:
      return { clause: '', params: [] };
  }
}

// Note: getMarcMetadata and filterRecordsByAbstractType functions removed - now using EXTRACTVALUE directly for better performance

/**
 * Optimized query for without_abstract report when using magazine numbers
 * This uses AND logic (all abstract fields must be empty) and INNER JOIN for better performance
 * Only used when: abstractFilter = 'without_abstract' AND magazineNumbers provided
 */
async function getWithoutAbstractRecordsByMagazines(
  magazineNumbers: string[],
  yearFilter: { clause: string; params: any[] },
  urlFilter: { clause: string; params: any[] }
): Promise<BiblioRecord[]> {
  console.log('Using optimized query for without_abstract with magazine numbers');
  
  // Build magazine number conditions
  const magazineConditions = magazineNumbers.map(() => 'bi.journalnum = ?').join(' OR ');

  const placeholders = magazineNumbers.map(() => '?').join(',');
  
  // Build the optimized query with AND logic for abstract fields (all must be empty)
  const query = `
    SELECT 
      b.biblionumber,
      bi.url
    FROM biblio b
    INNER JOIN biblioitems bi ON b.biblionumber = bi.biblionumber
    INNER JOIN biblio_metadata bm ON b.biblionumber = bm.biblionumber
    WHERE bi.journalnum IN (${placeholders})
    ${yearFilter.clause}
    ${urlFilter.clause}
    AND EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="a"]') = ''
    AND EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="b"]') = ''
    AND EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="d"]') = ''
    AND EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="e"]') = ''
    AND EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="f"]') = ''
    ORDER BY b.biblionumber DESC
  `;
  
  const params = [
    ...magazineNumbers,
    ...yearFilter.params,
    ...urlFilter.params
  ];
  
  const startTime = Date.now();
  const result = await executeQuery<BiblioRecord>(query, params);
  const queryTime = Date.now() - startTime;
  
  console.log(`Optimized query executed in ${queryTime}ms, returned ${result.length} records`);
  //log the query itself
  console.log(`Executed query: ${query}`);
  return result;
}

// Get bibliographic records with filters using EXTRACTVALUE for MARC data (like user's SQL queries)
export async function getBiblioRecords(filters: QueryFilters = {}): Promise<BiblioRecord[]> {
  const { magazineNumbers, startYear, endYear, authorName, isPreview, biblioNumbers, abstractFilter, urlList } = filters;
  
  // Build query filters
  const biblioFilter = buildBiblioNumbersFilter(biblioNumbers);
  const magazineFilter = buildMagazineNumbersFilter(magazineNumbers);
  const yearFilter = buildYearRangeFilter(startYear, endYear);
  const authorFilter = buildAuthorFilter(authorName);
  const absFilter = buildAbstractFilter(abstractFilter);
  const urlFilter = buildUrlListFilter(urlList);
  
  // Use optimized query for without_abstract with magazine numbers (much faster with INNER JOIN)
  // This uses AND logic (all abstract fields must be empty) - same logic as standard query but optimized
  if (
    abstractFilter === 'without_abstract' && 
    magazineNumbers && 
    magazineNumbers.length > 0 &&
    !biblioNumbers && // Only when not using biblio numbers
    !authorName &&    // Only when not filtering by author
    !urlList          // Only when not filtering by URLs
  ) {
    console.log('Detected without_abstract + magazine numbers - using optimized query');
    return await getWithoutAbstractRecordsByMagazines(magazineNumbers, yearFilter, urlFilter);
  }
  
  // Add LIMIT clause for preview mode
  const limitClause = isPreview ? 'LIMIT 5' : '';
  
  // Log query info for performance debugging
  if (biblioNumbers && biblioNumbers.length > 0) {
    console.log(`Executing biblio query for ${biblioNumbers.length} biblio numbers`);
  }
  
  // Use efficient query with EXTRACTVALUE() like user's working SQL
  const query = `
    SELECT 
      b.biblionumber,
      b.frameworkcode,
      b.author,
      b.title,
      b.medium,
      b.subtitle,
      b.part_number,
      b.part_name,
      b.unititle,
      b.notes,
      b.serial,
      b.seriestitle,
      b.copyrightdate,
      b.timestamp,
      b.datecreated,
      b.abstract,
      bi.url,
      bi.journalnum,
      bi.volumenumber,
      bi.issuenumber,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="245"][1]/subfield[@code="a"]') AS marc_245_1_a,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="245"][1]/subfield[@code="b"]') AS marc_245_1_b,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="246"][1]/subfield[@code="a"]') AS marc_246_1_a,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="246"][1]/subfield[@code="b"]') AS marc_246_1_b,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="246"][2]/subfield[@code="a"]') AS marc_246_2_a,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="246"][2]/subfield[@code="b"]') AS marc_246_2_b,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="246"][3]/subfield[@code="a"]') AS marc_246_3_a,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="246"][3]/subfield[@code="b"]') AS marc_246_3_b,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="242"][1]/subfield[@code="a"]') AS marc_242_1_a,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="242"][1]/subfield[@code="b"]') AS marc_242_1_b,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="041"]/subfield[@code="a"]') AS marc_041_a,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="100"]/subfield[@code="a"]') AS marc_100_a,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="100"]/subfield[@code="g"]') AS marc_100_g,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="100"]/subfield[@code="q"]') AS marc_100_q,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="100"]/subfield[@code="e"]') AS marc_100_e,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="100"]/subfield[@code="9"]') AS marc_100_9,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="260"]/subfield[@code="b"]') AS marc_260_b,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][1]/subfield[@code="a"]') AS marc_700_1_a,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][1]/subfield[@code="g"]') AS marc_700_1_g,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][1]/subfield[@code="q"]') AS marc_700_1_q,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][1]/subfield[@code="e"]') AS marc_700_1_e,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][1]/subfield[@code="9"]') AS marc_700_1_9,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][2]/subfield[@code="a"]') AS marc_700_2_a,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][2]/subfield[@code="g"]') AS marc_700_2_g,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][2]/subfield[@code="q"]') AS marc_700_2_q,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][2]/subfield[@code="e"]') AS marc_700_2_e,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][2]/subfield[@code="9"]') AS marc_700_2_9,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][3]/subfield[@code="a"]') AS marc_700_3_a,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][3]/subfield[@code="g"]') AS marc_700_3_g,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][3]/subfield[@code="q"]') AS marc_700_3_q,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][3]/subfield[@code="e"]') AS marc_700_3_e,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][3]/subfield[@code="9"]') AS marc_700_3_9,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][4]/subfield[@code="a"]') AS marc_700_4_a,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][4]/subfield[@code="g"]') AS marc_700_4_g,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][4]/subfield[@code="q"]') AS marc_700_4_q,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][4]/subfield[@code="e"]') AS marc_700_4_e,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][4]/subfield[@code="9"]') AS marc_700_4_9,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][5]/subfield[@code="a"]') AS marc_700_5_a,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][5]/subfield[@code="g"]') AS marc_700_5_g,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][5]/subfield[@code="q"]') AS marc_700_5_q,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][5]/subfield[@code="e"]') AS marc_700_5_e,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][5]/subfield[@code="9"]') AS marc_700_5_9,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="a"]') AS marc_520_a,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="b"]') AS marc_520_b,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="d"]') AS marc_520_d,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="e"]') AS marc_520_e,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="f"]') AS marc_520_f
    FROM biblio b
    LEFT JOIN biblioitems bi ON b.biblionumber = bi.biblionumber
    LEFT JOIN biblio_metadata bm ON b.biblionumber = bm.biblionumber
    WHERE 1=1
    ${biblioFilter.clause}
    ${magazineFilter.clause}
    ${yearFilter.clause}
    ${authorFilter.clause}
    ${absFilter.clause}
    ${urlFilter.clause}
    ORDER BY b.biblionumber DESC
    ${limitClause}
  `;
  
  const params = [
    ...biblioFilter.params,
    ...magazineFilter.params,
    ...yearFilter.params,
    ...authorFilter.params,
    ...absFilter.params,
    ...urlFilter.params
  ];
  
  const startTime = Date.now();
  const result = await executeQuery<BiblioRecord>(query, params);
  const queryTime = Date.now() - startTime;
  
  console.log(`Query executed in ${queryTime}ms, returned ${result.length} records`);
  return result;
}

// Note: getMarcMetadata and filterRecordsByAbstractType functions removed - now using EXTRACTVALUE directly for better performance

// Generate report data for predefined reports using pre-extracted MARC data
export async function generatePredefinedReport(reportType: string, filters: QueryFilters): Promise<ReportQueryResult[]> {
  // Get base bibliographic records with MARC data already extracted using EXTRACTVALUE
  const biblioRecords = await getBiblioRecords(filters);
  
  if (biblioRecords.length === 0) {
    return [];
  }

  // Get database configuration for this report type
  const dbConfig = REPORT_DB_CONFIG[reportType as keyof typeof REPORT_DB_CONFIG] || REPORT_DB_CONFIG.default;

  // Transform records into report format using pre-extracted MARC data
  const reportData: ReportQueryResult[] = biblioRecords.map(record => {
    // Base result with common fields
    const result: ReportQueryResult = {
      ...record,
      url: record.url || '', // Use the PDF filename from biblioitems
      biblio: String(record.biblionumber).padStart(4, '0'),
      link: `https://cataloging.mandumah.com/cgi-bin/koha/catalogue/detail.pl?biblionumber=${record.biblionumber}`,
      biblio_details: `https://cataloging.mandumah.com/cgi-bin/koha/cataloguing/addbiblio.pl?biblionumber=${record.biblionumber}`
    };
    
    // Add specific fields based on report type using pre-extracted MARC fields
    switch (reportType) {
      case 'export_research_titles':
      case 'export_translations_titles_authors':
      case 'export_translations_citation_title':
        // Use multi-instance, multi-subfield title extractions
        result.title_245_1_a = (record as any).marc_245_1_a || '';
        result.title_245_1_a_lang = detectLanguage(result.title_245_1_a);
        result.title_245_1_b = (record as any).marc_245_1_b || '';
        result.title_245_1_b_lang = detectLanguage(result.title_245_1_b);
        result.title_246_1_a = (record as any).marc_246_1_a || '';
        result.title_246_1_a_lang = detectLanguage(result.title_246_1_a);
        result.title_246_1_b = (record as any).marc_246_1_b || '';
        result.title_246_1_b_lang = detectLanguage(result.title_246_1_b);
        result.title_246_2_a = (record as any).marc_246_2_a || '';
        result.title_246_2_a_lang = detectLanguage(result.title_246_2_a);
        result.title_246_2_b = (record as any).marc_246_2_b || '';
        result.title_246_2_b_lang = detectLanguage(result.title_246_2_b);
        result.title_246_3_a = (record as any).marc_246_3_a || '';
        result.title_246_3_a_lang = detectLanguage(result.title_246_3_a);
        result.title_246_3_b = (record as any).marc_246_3_b || '';
        result.title_246_3_b_lang = detectLanguage(result.title_246_3_b);
        result.title_242_1_a = (record as any).marc_242_1_a || '';
        result.title_242_1_a_lang = detectLanguage(result.title_242_1_a);
        result.title_242_1_b = (record as any).marc_242_1_b || '';
        result.title_242_1_b_lang = detectLanguage(result.title_242_1_b);
        result.language_041 = (record as any).marc_041_a || '';
        if (reportType === 'export_translations_titles_authors') {
          result.author = (record as any).marc_100_a || record.author || '';
          result.author_g = (record as any).marc_100_g || '';
          result.author_q = (record as any).marc_100_q || '';
          result.author_e = (record as any).marc_100_e || '';
          result.author_id = (record as any).marc_100_9 || '';
          result.university_373 = (record as any).marc_260_b || '';
        }
        break;
        
      case 'export_research_authors':
        // Use pre-extracted author data from EXTRACTVALUE - all subfields (a, g, q, e, 9)
        result.author = (record as any).marc_100_a || record.author || '';
        result.author_g = (record as any).marc_100_g || '';
        result.author_q = (record as any).marc_100_q || '';
        result.author_e = (record as any).marc_100_e || '';
        result.author_id = (record as any).marc_100_9 || '';
        result.author_id_biblio = ((record as any).marc_100_9 && record.biblionumber) ? record.biblionumber : '';
        
        // Use pre-extracted additional authors data (up to 5 authors with all subfields)
        result.additional_author = (record as any).marc_700_1_a || '';
        result.additional_author_g = (record as any).marc_700_1_g || '';
        result.additional_author_q = (record as any).marc_700_1_q || '';
        result.additional_author_e = (record as any).marc_700_1_e || '';
        result.additional_author_id = (record as any).marc_700_1_9 || '';
        result.additional_author_id_biblio = ((record as any).marc_700_1_9 && record.biblionumber) ? record.biblionumber : '';
        result.additional_author_2 = (record as any).marc_700_2_a || '';
        result.additional_author_2_g = (record as any).marc_700_2_g || '';
        result.additional_author_2_q = (record as any).marc_700_2_q || '';
        result.additional_author_2_e = (record as any).marc_700_2_e || '';
        result.additional_author_id_2 = (record as any).marc_700_2_9 || '';
        result.additional_author_id_2_biblio = ((record as any).marc_700_2_9 && record.biblionumber) ? record.biblionumber : '';
        result.additional_author_3 = (record as any).marc_700_3_a || '';
        result.additional_author_3_g = (record as any).marc_700_3_g || '';
        result.additional_author_3_q = (record as any).marc_700_3_q || '';
        result.additional_author_3_e = (record as any).marc_700_3_e || '';
        result.additional_author_id_3 = (record as any).marc_700_3_9 || '';
        result.additional_author_id_3_biblio = ((record as any).marc_700_3_9 && record.biblionumber) ? record.biblionumber : '';
        result.additional_author_4 = (record as any).marc_700_4_a || '';
        result.additional_author_4_g = (record as any).marc_700_4_g || '';
        result.additional_author_4_q = (record as any).marc_700_4_q || '';
        result.additional_author_4_e = (record as any).marc_700_4_e || '';
        result.additional_author_id_4 = (record as any).marc_700_4_9 || '';
        result.additional_author_id_4_biblio = ((record as any).marc_700_4_9 && record.biblionumber) ? record.biblionumber : '';
        result.additional_author_5 = (record as any).marc_700_5_a || '';
        result.additional_author_5_g = (record as any).marc_700_5_g || '';
        result.additional_author_5_q = (record as any).marc_700_5_q || '';
        result.additional_author_5_e = (record as any).marc_700_5_e || '';
        result.additional_author_id_5 = (record as any).marc_700_5_9 || '';
        result.additional_author_id_5_biblio = ((record as any).marc_700_5_9 && record.biblionumber) ? record.biblionumber : '';
        break;
        
      case 'export_author_data':
        // Use pre-extracted author data with all subfields (a, g, q, e, 9)
        result.author = (record as any).marc_100_a || record.author || '';
        result.author_g = (record as any).marc_100_g || '';
        result.author_q = (record as any).marc_100_q || '';
        result.author_e = (record as any).marc_100_e || '';
        result.author_id = (record as any).marc_100_9 || '';
        result.author_id_biblio = ((record as any).marc_100_9 && record.biblionumber) ? record.biblionumber : '';
        break;
      case 'export_translations_citation_author':
        result.author = (record as any).marc_100_a || record.author || '';
        break;
        
      case 'export_abstract_field':
        // Use pre-extracted abstract subfields
        
        result.abstract_520_a = (record as any).marc_520_a || '';
        result.abstract_520_b = (record as any).marc_520_b || '';
        result.abstract_520_d = (record as any).marc_520_d || '';
        result.abstract_520_e = (record as any).marc_520_e || '';
        result.abstract_520_f = (record as any).marc_520_f || '';
        result.abstract_520 = record.abstract || '';
        break;
        
      case 'export_citation_entry':
        // No additional fields for citation entry
        break;
        
      case 'convert_url_to_biblio':
        // This report needs biblio and the PDF filename from the url field
        result.url = record.url || '';
        break;
    }
    
    return result;
  });
  
  return reportData;
}

// MARC field configurations for dynamic EXTRACTVALUE queries
const MARC_FIELD_CONFIGS: { [key: string]: { subfields: string[], multiValue?: boolean, duplicateSubfields?: boolean } } = {
  '000': { subfields: [''] }, // Leader - special field, no subfields
  '001': { subfields: [''] }, // Control Number
  '024': { subfields: ['a', 'c', '2'], duplicateSubfields: true }, // Other Standard Identifier
  '041': { subfields: ['a', 'b'] , duplicateSubfields: true }, // Language Code
  '044': { subfields: ['a', 'b'], duplicateSubfields: true }, // Country code
  '100': { subfields: ['a', 'g', 'q', 'e', '9']  }, // Main Author
  '110': { subfields: ['a', '9'] , duplicateSubfields: true }, // Corporate Name
  '242': { subfields: ['a', 'b', 'c'], multiValue: true  }, // Translation of Title
  '245': { subfields: ['a', 'b', 'c', 'n', 'p'], multiValue: true  }, // Title Statement
  '246': { subfields: ['a', 'b'], multiValue: true }, // Varying Form of Title
  '260': { subfields: ['a', 'b', 'c', 'g', 'm'], duplicateSubfields: true  }, // Publication
  '300': { subfields: ['a', 'b', 'c'], duplicateSubfields: true  }, // Physical Description
  '336': { subfields: ['a', 'b'] , duplicateSubfields: true }, // Content Type
  '500': { subfields: ['a'] , duplicateSubfields: true }, // General Note
  '520': { subfields: ['a', 'b', 'd', 'e', 'f'], duplicateSubfields: true }, // Summary/Abstract
  '653': { subfields: ['a'], multiValue: true, duplicateSubfields: true }, // Index Term - can have duplicate subfields
  '692': { subfields: ['a', 'b'], multiValue: true, duplicateSubfields: true }, // Keywords - can have duplicate subfields
  '700': { subfields: ['a', 'g', 'q', 'e', '9'], multiValue: true }, // Additional Authors
  '773': { subfields: ['t', 'g', 'd', 'x','4','6','c','e','f','l','m','o','s','v','p'], duplicateSubfields: true  }, // Host Item
  '856': { subfields: ['u', 'y', 'z','n'], duplicateSubfields: true  }, // Electronic Location
  '930': { subfields: ['d','p','q'] , duplicateSubfields: true }, // Equivalence
  '995': { subfields: ['a'], duplicateSubfields: true  }, // Recommendation
};

/**
 * Helper function to extract all duplicate subfields from MARC XML and join them with '|'
 * This handles cases where a single datafield has multiple subfields with the same code
 * Example: <datafield tag="692"><subfield code="a">keyword1</subfield><subfield code="a">keyword2</subfield></datafield>
 * Result: "keyword1|keyword2"
 */
function extractDuplicateSubfields(marcXML: string | null, fieldTag: string, subfieldCode: string): string {
  if (!marcXML) return '';
  
  try {
    // Match all datafield instances with the specified tag
    const datafieldRegex = new RegExp(`<datafield[^>]*tag="${fieldTag}"[^>]*>(.*?)</datafield>`, 'gs');
    const datafieldMatches = marcXML.matchAll(datafieldRegex);
    
    const allValues: string[] = [];
    
    // For each datafield instance
    for (const datafieldMatch of datafieldMatches) {
      const datafieldContent = datafieldMatch[1];
      
      // Extract all subfields with the specified code within this datafield
      const subfieldRegex = new RegExp(`<subfield[^>]*code="${subfieldCode}"[^>]*>(.*?)</subfield>`, 'g');
      const subfieldMatches = datafieldContent.matchAll(subfieldRegex);
      
      // Collect all values from this datafield instance
      const instanceValues: string[] = [];
      for (const subfieldMatch of subfieldMatches) {
        const value = subfieldMatch[1]?.trim();
        if (value) {
          instanceValues.push(value);
        }
      }
      
      // Join duplicate subfields within the same datafield with '|'
      if (instanceValues.length > 0) {
        allValues.push(instanceValues.join(' | '));
      }
    }
    
    // Join multiple datafield instances with ' | ' as well
    return allValues.join(' | ');
  } catch (error) {
    console.error(`Error extracting duplicate subfields for ${fieldTag}$${subfieldCode}:`, error);
    return '';
  }
}

// Build dynamic EXTRACTVALUE queries based on selected MARC fields
function buildCustomMarcExtractions(selectedFields: string[], isBiblioSearch = false): { selectFields: string[], fieldMap: { [key: string]: string } } {
  const selectFields: string[] = [];
  const fieldMap: { [key: string]: string } = {};
  
  // For biblio number searches, limit MARC extractions to prevent performance issues
  const maxFieldsForBiblioSearch = 80; // Increase to 80 extractions to allow most fields while maintaining performance
  let extractionCount = 0;
  
  selectedFields.forEach(fieldTag => {
    const config = MARC_FIELD_CONFIGS[fieldTag];
    if (!config) return;
    
    // Skip if we've reached the limit for biblio searches
    if (isBiblioSearch && extractionCount >= maxFieldsForBiblioSearch) {
      console.log(`Limiting MARC field extractions at ${maxFieldsForBiblioSearch} for biblio search performance`);
      return;
    }
    
    if (fieldTag === '000') {
      // Leader field - special handling
      selectFields.push('EXTRACTVALUE(bm.metadata, \'//leader\') AS marc_000');
      fieldMap[`marc_000`] = `${fieldTag}_Leader`;
      extractionCount++;
    } else if (fieldTag === '001') {
      // Control number
      selectFields.push('EXTRACTVALUE(bm.metadata, \'//controlfield[@tag="001"]\') AS marc_001');
      fieldMap[`marc_001`] = `${fieldTag}_Control_Number`;
      extractionCount++;
    } else {
      // Regular datafields with subfields
      config.subfields.forEach(subfield => {
        // Skip if we've reached the limit for biblio searches
        if (isBiblioSearch && extractionCount >= maxFieldsForBiblioSearch) {
          return;
        }
        
        // Fields with duplicateSubfields should be extracted once - the extractDuplicateSubfields function
        // will handle getting all values from all datafield instances and all duplicate subfields
        if (config.duplicateSubfields === true) {
          // Extract just once - duplicates will be handled by extractDuplicateSubfields() function
          const fieldKey = `marc_${fieldTag}_${subfield}`;
          selectFields.push(`EXTRACTVALUE(bm.metadata, '//datafield[@tag="${fieldTag}"]/subfield[@code="${subfield}"]') AS ${fieldKey}`);
          fieldMap[fieldKey] = `${fieldTag}_${subfield}`;
          extractionCount++;
        } else if (config.multiValue && fieldTag === '700') {
          // Handle multiple 700 fields (additional authors) - limit for biblio search
          const maxInstances = isBiblioSearch ? 10 : 15; // Support more authors even for biblio search
          for (let i = 1; i <= maxInstances; i++) {
            if (isBiblioSearch && extractionCount >= maxFieldsForBiblioSearch) break;
            const fieldKey = `marc_${fieldTag}_${i}_${subfield}`;
            selectFields.push(`EXTRACTVALUE(bm.metadata, '//datafield[@tag="${fieldTag}"][${i}]/subfield[@code="${subfield}"]') AS ${fieldKey}`);
            fieldMap[fieldKey] = `${fieldTag}_${subfield}_Author_${i}`;
            extractionCount++;
          }
        } else if (config.multiValue && (fieldTag === '242' || fieldTag === '245' || fieldTag === '246')) {
          // Handle multiple title fields - limit for biblio search
          const maxInstances = isBiblioSearch ? 3 : 5; // Support multiple title instances
          for (let i = 1; i <= maxInstances; i++) {
            if (isBiblioSearch && extractionCount >= maxFieldsForBiblioSearch) break;
            const fieldKey = `marc_${fieldTag}_${i}_${subfield}`;
            selectFields.push(`EXTRACTVALUE(bm.metadata, '//datafield[@tag="${fieldTag}"][${i}]/subfield[@code="${subfield}"]') AS ${fieldKey}`);
            fieldMap[fieldKey] = `${fieldTag}_${subfield}_${i}`;
            extractionCount++;
          }
        } else {
          // Regular single fields
          const fieldKey = `marc_${fieldTag}_${subfield}`;
          selectFields.push(`EXTRACTVALUE(bm.metadata, '//datafield[@tag="${fieldTag}"]/subfield[@code="${subfield}"]') AS ${fieldKey}`);
          fieldMap[fieldKey] = `${fieldTag}_${subfield}`;
          extractionCount++;
        }
      });
    }
  });
  
  console.log(`Generated ${extractionCount} MARC extractions for ${isBiblioSearch ? 'biblio' : 'general'} search`);
  return { selectFields, fieldMap };
}

// Optimized function specifically for biblio number searches
async function getBiblioRecordsByNumbers(biblioNumbers: string[], selectedFields: string[], isPreview?: boolean): Promise<any[]> {
  if (!biblioNumbers || biblioNumbers.length === 0) {
    return [];
  }
  
  console.log(`Processing optimized biblio number search for: ${biblioNumbers.join(', ')}`);
  
  // Convert and validate biblio numbers
  const validBiblioNums = biblioNumbers
    .map(num => parseInt(num.trim()))
    .filter(num => !isNaN(num) && num > 0);
    
  if (validBiblioNums.length === 0) {
    console.log('No valid biblio numbers provided');
    return [];
  }
  
  // Build limited MARC extractions for performance (max 80 fields)
  const { selectFields, fieldMap } = buildCustomMarcExtractions(selectedFields, true);
  const limitedSelectFields = selectFields.slice(0, 500); // Reasonable limit to balance performance and data completeness
  const marcClause = limitedSelectFields.length > 0 ? `,\n    ${limitedSelectFields.join(',\n    ')}` : '';
  
  // Check if we need to include MARC XML metadata for duplicate subfield processing
  const needsMetadata = selectedFields.some(fieldTag => {
    const config = MARC_FIELD_CONFIGS[fieldTag];
    return config?.duplicateSubfields === true;
  });
  const metadataSelect = needsMetadata ? ',\n    bm.metadata' : '';
  
  const limitClause = isPreview ? 'LIMIT 10' : '';
  
  // Direct query using IN clause with proper ordering
  const query = `
    SELECT /*+ USE_INDEX(b, PRIMARY) */
      b.biblionumber,
      b.frameworkcode,
      b.author,
      b.title,
      b.medium,
      b.subtitle,
      b.part_number,
      b.part_name,
      b.unititle,
      b.notes,
      b.serial,
      b.seriestitle,
      b.copyrightdate,
      b.timestamp,
      b.datecreated,
      b.abstract,
      bi.url,
      bi.journalnum,
      bi.volumenumber,
      bi.issuenumber${marcClause}${metadataSelect}
    FROM biblio b
    LEFT JOIN biblioitems bi ON b.biblionumber = bi.biblionumber
    LEFT JOIN biblio_metadata bm ON b.biblionumber = bm.biblionumber
    WHERE b.biblionumber IN (${validBiblioNums.map(() => '?').join(',')})
    ORDER BY FIELD(b.biblionumber, ${validBiblioNums.join(',')})
    ${limitClause}
  `;
  
  const startTime = Date.now();
  
  try {
    const result = await executeQuery<any>(query, validBiblioNums);
    const queryTime = Date.now() - startTime;
    
    console.log(`Optimized biblio query executed in ${queryTime}ms, returned ${result.length}/${validBiblioNums.length} records with ${limitedSelectFields.length} MARC extractions`);
    
    if (result.length === 0) {
      console.log(`No records found for biblio numbers: ${validBiblioNums.join(', ')}`);
    } else {
      const foundNumbers = result.map(r => r.biblionumber);
      const missingNumbers = validBiblioNums.filter(num => !foundNumbers.includes(num));
      if (missingNumbers.length > 0) {
        console.log(`Missing biblio numbers from database: ${missingNumbers.join(', ')}`);
      }
    }
    
    return result.map(record => ({ ...record, _marcFieldMap: fieldMap }));
  } catch (error) {
    console.error('Error executing biblio number query:', error);
    throw new Error(`Database query failed for biblio numbers: ${validBiblioNums.join(', ')} - ${error}`);
  }
}

// Get bibliographic records with custom MARC field selection using EXTRACTVALUE
async function getBiblioRecordsForCustomReport(filters: QueryFilters, selectedFields: string[]): Promise<any[]> {
  const { magazineNumbers, startYear, endYear, authorName, isPreview, biblioNumbers, abstractFilter } = filters;
  
  // For biblio number searches, use optimized direct approach
  if (biblioNumbers && biblioNumbers.length > 0) {
    return await getBiblioRecordsByNumbers(biblioNumbers, selectedFields, isPreview);
  }
  
  // Build query filters for regular searches
  const magazineFilter = buildMagazineNumbersFilter(magazineNumbers);
  const yearFilter = buildYearRangeFilter(startYear, endYear);
  const authorFilter = buildAuthorFilter(authorName);
  const absFilter = buildAbstractFilter(abstractFilter);
  
  // Build dynamic MARC extractions for regular searches
  const { selectFields, fieldMap } = buildCustomMarcExtractions(selectedFields, false);
  
  // Check if we need to include MARC XML metadata for duplicate subfield processing
  const needsMetadata = selectedFields.some(fieldTag => {
    const config = MARC_FIELD_CONFIGS[fieldTag];
    return config?.duplicateSubfields === true;
  });
  
  // Add LIMIT clause for preview mode
  const limitClause = isPreview ? 'LIMIT 5' : '';
  
  console.log(`Executing regular custom query with ${selectedFields.length} selected MARC fields (${selectFields.length} extractions)${needsMetadata ? ' - including metadata for duplicate subfields' : ''}`);
  
  // Build query with selected MARC field extractions
  const marcSelectClause = selectFields.length > 0 ? `,\n      ${selectFields.join(',\n      ')}` : '';
  const metadataSelect = needsMetadata ? ',\n      bm.metadata' : '';

  const query = `
    SELECT 
      b.biblionumber,
      b.frameworkcode,
      b.author,
      b.title,
      b.medium,
      b.subtitle,
      b.part_number,
      b.part_name,
      b.unititle,
      b.notes,
      b.serial,
      b.seriestitle,
      b.copyrightdate,
      b.timestamp,
      b.datecreated,
      b.abstract,
      bi.url,
      bi.journalnum,
      bi.volumenumber,
      bi.issuenumber${marcSelectClause}${metadataSelect}
    FROM biblio b
    LEFT JOIN biblioitems bi ON b.biblionumber = bi.biblionumber
    LEFT JOIN biblio_metadata bm ON b.biblionumber = bm.biblionumber
    WHERE 1=1
    ${magazineFilter.clause}
    ${yearFilter.clause}
    ${authorFilter.clause}
    ${absFilter.clause}
    ORDER BY b.biblionumber DESC
    ${limitClause}
  `;
  
  const params = [
    ...magazineFilter.params,
    ...yearFilter.params,
    ...authorFilter.params,
    ...absFilter.params
  ];
  
  const startTime = Date.now();
  const result = await executeQuery<any>(query, params);
  const queryTime = Date.now() - startTime;
  
  console.log(`Custom query executed in ${queryTime}ms, returned ${result.length} records with ${selectFields.length} MARC extractions`);
  return result.map(record => ({ ...record, _marcFieldMap: fieldMap }));
}

// Generate custom report with selected MARC fields using dynamic EXTRACTVALUE
export async function generateCustomReport(filters: QueryFilters): Promise<ReportQueryResult[]> {
  const { selectedFields } = filters;
  
  if (!selectedFields || selectedFields.length === 0) {
    console.log('No MARC fields selected for custom report, using default fields');
    // Use default common fields if none selected
    const defaultFields = ['245', '100', '260', '520'];
    const updatedFilters = { ...filters, selectedFields: defaultFields };
    return generateCustomReport(updatedFilters);
  }
  
  // Get bibliographic records with custom MARC field extractions
  const biblioRecords = await getBiblioRecordsForCustomReport(filters, selectedFields);
  
  if (biblioRecords.length === 0) {
    return [];
  }
  
  // Transform records into report format with all selected MARC fields
  const reportData: ReportQueryResult[] = biblioRecords.map(record => {
    const marcFieldMap = record._marcFieldMap || {};
    delete record._marcFieldMap; // Remove helper field
    
    // Base result with common fields
    const result: ReportQueryResult = {
      ...record,
      url: record.url || '',
      biblio: String(record.biblionumber).padStart(4, '0'),
      link: `https://cataloging.mandumah.com/cgi-bin/koha/catalogue/detail.pl?biblionumber=${record.biblionumber}`,
      biblio_details: `https://cataloging.mandumah.com/cgi-bin/koha/cataloguing/addbiblio.pl?biblionumber=${record.biblionumber}`
    };
    
    // Process fields with duplicate subfields if metadata is available
    const metadata = record.metadata || null;
    
    // Add all extracted MARC fields with proper field names for export/display
    Object.keys(marcFieldMap).forEach(marcKey => {
      const fieldName = marcFieldMap[marcKey];
      let fieldValue = record[marcKey] || '';
      
      // Check if this field has duplicate subfields and metadata is available
      // Extract field tag and subfield code from marcKey (e.g., "marc_692_a" -> tag: 692, subfield: a)
      const marcKeyMatch = marcKey.match(/^marc_(\d+)_([a-z0-9]+)$/i);
      if (marcKeyMatch && metadata) {
        const fieldTag = marcKeyMatch[1];
        const subfieldCode = marcKeyMatch[2];
        const config = MARC_FIELD_CONFIGS[fieldTag];
        
        // If this field is configured to have duplicate subfields, extract all values with '|'
        if (config?.duplicateSubfields === true) {
          const extractedValue = extractDuplicateSubfields(metadata, fieldTag, subfieldCode);
          if (extractedValue) {
            fieldValue = extractedValue;
          }
        }
      }
      
      // Add both the raw marc field and a display-friendly version
      (result as any)[marcKey] = fieldValue;
      (result as any)[fieldName] = fieldValue;
    });
    
    // Remove metadata from result to avoid including it in export
    delete (result as any).metadata;
    
    return result;
  });
  
  console.log(`Generated custom report with ${reportData.length} records and ${selectedFields.length} MARC fields`);
  return reportData;
}

// Interface for hierarchical author structure
export interface HierarchicalAuthorRow {
  subfield_9: string;
  subfield_a: string;
  subfield_g: string;
  subfield_q: string;
  // isHeaderRow?: boolean;
  // headerText?: string;
}

// Generate hierarchical author report with merged 100 and 700 fields
export async function generateHierarchicalAuthorsReport(filters: QueryFilters): Promise<HierarchicalAuthorRow[]> {
  // Get base bibliographic records with MARC data already extracted using EXTRACTVALUE
  const biblioRecords = await getBiblioRecords(filters);
  
  if (biblioRecords.length === 0) {
    return [];
  }

  const hierarchicalData: HierarchicalAuthorRow[] = [];

  // Process each record
  biblioRecords.forEach(record => {
    // Collect all authors (100 and 700 fields)
    const mainAuthors: HierarchicalAuthorRow[] = [];
    const additionalAuthors: HierarchicalAuthorRow[] = [];

    // Add main author (100 field) if exists
    const main_100_a = (record as any).marc_100_a || '';
    const main_100_g = (record as any).marc_100_g || '';
    const main_100_q = (record as any).marc_100_q || '';
    const main_100_9 = (record as any).marc_100_9 || '';

    if (main_100_a || main_100_9) {
      mainAuthors.push({
        subfield_9: main_100_9,
        subfield_a: main_100_a,
        subfield_g: main_100_g,
        subfield_q: main_100_q
      });
    }

    // Add additional authors (700 fields) - up to 5 authors
    const additionalAuthorFields = [
      { a: (record as any).marc_700_1_a, g: (record as any).marc_700_1_g, q: (record as any).marc_700_1_q, id: (record as any).marc_700_1_9 },
      { a: (record as any).marc_700_2_a, g: (record as any).marc_700_2_g, q: (record as any).marc_700_2_q, id: (record as any).marc_700_2_9 },
      { a: (record as any).marc_700_3_a, g: (record as any).marc_700_3_g, q: (record as any).marc_700_3_q, id: (record as any).marc_700_3_9 },
      { a: (record as any).marc_700_4_a, g: (record as any).marc_700_4_g, q: (record as any).marc_700_4_q, id: (record as any).marc_700_4_9 },
      { a: (record as any).marc_700_5_a, g: (record as any).marc_700_5_g, q: (record as any).marc_700_5_q, id: (record as any).marc_700_5_9 }
    ];

    additionalAuthorFields.forEach(author => {
      if (author.a || author.id) {
        additionalAuthors.push({
          subfield_9: author.id || '',
          subfield_a: author.a || '',
          subfield_g: author.g || '',
          subfield_q: author.q || ''
        });
      }
    });

    // Add to hierarchical structure
    // Only add sections if there are authors
    if (mainAuthors.length > 0) {
      // Add header row for 100 Authors
      // hierarchicalData.push({
      //   subfield_9: '100 Authors',
      //   subfield_a: '',
      //   subfield_g: '',
      //   subfield_q: '',
      //   // isHeaderRow: true,
      //   // headerText: '100 Authors'
      // });

      // Add all main authors
      hierarchicalData.push(...mainAuthors);
    }

    if (additionalAuthors.length > 0) {
      // Add header row for 700 Additional Authors
      // hierarchicalData.push({
      //   subfield_9: '700 Additional Authors',
      //   subfield_a: '',
      //   subfield_g: '',
      //   subfield_q: '',
      //   // isHeaderRow: true,
      //   // headerText: '700 Additional Authors'
      // });

      // Add all additional authors
      hierarchicalData.push(...additionalAuthors);
    }
  });

  return hierarchicalData;
}

// Test database connection and return sample data
export async function testDatabaseConnection(): Promise<{ success: boolean; sampleCount: number; error?: string }> {
  try {
    const query = 'SELECT COUNT(*) as count FROM biblio';
    const result = await executeQuery<{ count: number }>(query);
    
    return {
      success: true,
      sampleCount: result[0]?.count || 0
    };
  } catch (error) {
    return {
      success: false,
      sampleCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============= AUTH_HEADER TABLE FUNCTIONS (ESTENAD REPORTS) =============

// MARC field configurations for auth_header table with subfields
const AUTH_MARC_FIELD_CONFIGS: { [key: string]: { subfields: string[], multiValue?: boolean, duplicateSubfields?: boolean } } = {
  '000': { subfields: [''] }, // Leader - control field
  '001': { subfields: [''] }, // Control number - control field
  '003': { subfields: [''] }, // Control number identifier - control field
  '005': { subfields: [''] }, // Date and time - control field
  '008': { subfields: [''] }, // Fixed length data - control field
  '040': { subfields: ['a', '6', '8', 'b', 'd', 'e', 'f'], duplicateSubfields: true }, // Cataloging source - can have duplicates
  '100': { subfields: ['a', 'g', 'q'] }, // Heading personal name
  '370': { subfields: ['c', 'e'], duplicateSubfields: true }, // Associated place - can have duplicates
  '371': { subfields: ['a', 'e', 'm', 'q'], duplicateSubfields: true }, // Address - can have duplicates
  '373': { subfields: ['a', 'q'], duplicateSubfields: true }, // Associated group - can have duplicates
  '374': { subfields: ['9', 'a', 'b'], duplicateSubfields: true }, // Occupation - can have duplicates
  '381': { subfields: ['a'], duplicateSubfields: true }, // Other characteristics - can have duplicates
};

// Build dynamic EXTRACTVALUE queries for auth_header table
function buildAuthMarcExtractions(selectedFields: string[]): { selectFields: string[], fieldMap: { [key: string]: string }, needsMetadata: boolean } {
  const selectFields: string[] = [];
  const fieldMap: { [key: string]: string } = {};
  let needsMetadata = false;
  
  // Control fields (no subfields)
  const controlFields = ['000', '001', '003', '005', '008'];
  
  selectedFields.forEach(fieldTag => {
    const config = AUTH_MARC_FIELD_CONFIGS[fieldTag];
    if (!config) return;
    
    // Check if we need metadata for duplicate subfields
    if (config.duplicateSubfields === true) {
      needsMetadata = true;
    }
    
    // Handle control fields differently (they have no datafield wrapper)
    if (controlFields.includes(fieldTag)) {
      const columnName = `marc_${fieldTag}`;
      if (fieldTag === '000') {
        selectFields.push(`ah.marc as ${columnName}`); // Leader is stored directly
      } else {
        selectFields.push(`EXTRACTVALUE(ah.marcxml, '//controlfield[@tag="${fieldTag}"]') AS ${columnName}`);
      }
      fieldMap[columnName] = columnName;
    } else {
      // Regular datafields with subfields
      config.subfields.forEach(subfield => {
        const columnName = `marc_${fieldTag}_${subfield}`;
        selectFields.push(
          `EXTRACTVALUE(ah.marcxml, '//datafield[@tag="${fieldTag}"]/subfield[@code="${subfield}"]') AS ${columnName}`
        );
        fieldMap[columnName] = columnName;
      });
    }
  });
  
  return { selectFields, fieldMap, needsMetadata };
}

// Get auth_header records by author IDs with selected MARC fields
export async function getAuthHeaderRecords(authorIds: string[], selectedFields: string[], isPreview: boolean = false): Promise<any[]> {
  if (!authorIds || authorIds.length === 0) {
    throw new Error('Author IDs are required');
  }
  
  // Convert author IDs to integers
  const authIds = authorIds.map(id => {
    const cleanId = id.trim();
    return parseInt(cleanId) || 0;
  }).filter(id => id > 0);
  
  if (authIds.length === 0) {
    throw new Error('No valid author IDs provided');
  }
  
  // Build dynamic MARC field extractions
  const { selectFields, fieldMap, needsMetadata } = buildAuthMarcExtractions(selectedFields);
  
  // Add LIMIT clause for preview mode
  const limitClause = isPreview ? 'LIMIT 5' : '';
  
  // Create placeholders for IN clause
  const placeholders = authIds.map(() => '?').join(',');
  
  // Include marcxml if we need to process duplicate subfields
  const marcxmlSelect = needsMetadata ? ',\n      ah.marcxml' : '';
  
  // Build the query with EXTRACTVALUE for efficient MARC data extraction
  const query = `
    SELECT 
      ah.authid,
      ah.authtypecode,
      ah.datecreated,
      ah.modification_time,
      ah.origincode,
      ${selectFields.join(',\n      ')}${marcxmlSelect}
    FROM auth_header ah
    WHERE ah.authid IN (${placeholders})
    ORDER BY ah.authid
    ${limitClause}
  `;
  
  console.log('🔍 Executing auth_header query for', authIds.length, 'author IDs');
  console.log('📊 Selected fields:', selectedFields.join(', '));
  if (needsMetadata) {
    console.log('📋 Including marcxml for duplicate subfield processing');
  }
  
  try {
    const results = await executeQuery<any>(query, authIds);
    console.log('✅ Retrieved', results.length, 'auth_header records');
    
    // Transform results to match field map and process duplicate subfields
    const transformedResults = results.map(record => {
      const marcxml = record.marcxml || null;
      
      const transformed: any = {
        authid: record.authid,
        authtypecode: record.authtypecode,
        datecreated: record.datecreated,
        modification_time: record.modification_time,
        origincode: record.origincode
      };
      
      // Add MARC fields with duplicate subfield processing
      Object.keys(fieldMap).forEach(key => {
        let fieldValue = record[key] || '';
        
        // Check if this field has duplicate subfields and marcxml is available
        // Extract field tag and subfield code from key (e.g., "marc_374_a" -> tag: 374, subfield: a)
        const marcKeyMatch = key.match(/^marc_(\d+)_([a-z0-9]+)$/i);
        if (marcKeyMatch && marcxml) {
          const fieldTag = marcKeyMatch[1];
          const subfieldCode = marcKeyMatch[2];
          const config = AUTH_MARC_FIELD_CONFIGS[fieldTag];
          
          // If this field is configured to have duplicate subfields, extract all values with '|'
          if (config?.duplicateSubfields === true) {
            const extractedValue = extractDuplicateSubfields(marcxml, fieldTag, subfieldCode);
            if (extractedValue) {
              fieldValue = extractedValue;
            }
          }
        }
        
        transformed[key] = fieldValue;
      });
      
      return transformed;
    });
    
    return transformedResults;
  } catch (error) {
    console.error('❌ Error executing auth_header query:', error);
    throw error;
  }
}

// Extract author IDs from biblio records (similar to hierarchical authors)
export async function extractAuthorIdsFromBiblio(filters: QueryFilters): Promise<string[]> {
  // Get bibliographic records with MARC data
  const biblioRecords = await getBiblioRecords(filters);
  
  if (biblioRecords.length === 0) {
    return [];
  }

  const authorIds = new Set<string>();

  // Process each record to extract author IDs
  biblioRecords.forEach(record => {
    // Extract main author ID (100 field)
    const main_100_9 = (record as any).marc_100_9 || '';
    if (main_100_9 && main_100_9.toString().trim() !== '') {
      authorIds.add(main_100_9.toString().trim());
    }

    // Extract additional author IDs (700 fields) - up to 5 authors
    const additionalAuthorIds = [
      (record as any).marc_700_1_9,
      (record as any).marc_700_2_9,
      (record as any).marc_700_3_9,
      (record as any).marc_700_4_9,
      (record as any).marc_700_5_9
    ];

    additionalAuthorIds.forEach(id => {
      if (id && id.toString().trim() !== '') {
        authorIds.add(id.toString().trim());
      }
    });
  });

  const uniqueAuthorIds = Array.from(authorIds);
  console.log(`📊 Extracted ${uniqueAuthorIds.length} unique author IDs from ${biblioRecords.length} biblio records`);
  
  return uniqueAuthorIds;
}

// Extract author IDs with their source biblio numbers mapping
export async function extractAuthorIdsWithBiblioMapping(filters: QueryFilters): Promise<Map<string, number[]>> {
  // Get bibliographic records with MARC data
  const biblioRecords = await getBiblioRecords(filters);
  
  if (biblioRecords.length === 0) {
    return new Map();
  }

  // Map of author ID to array of biblio numbers where it appears
  const authorIdToBiblios = new Map<string, number[]>();

  // Process each record to extract author IDs and track their biblio numbers
  biblioRecords.forEach(record => {
    const biblioNumber = record.biblionumber;
    
    // Extract main author ID (100 field)
    const main_100_9 = (record as any).marc_100_9 || '';
    if (main_100_9 && main_100_9.toString().trim() !== '') {
      const authorId = main_100_9.toString().trim();
      if (!authorIdToBiblios.has(authorId)) {
        authorIdToBiblios.set(authorId, []);
      }
      authorIdToBiblios.get(authorId)!.push(biblioNumber);
    }

    // Extract additional author IDs (700 fields) - up to 5 authors
    const additionalAuthorIds = [
      (record as any).marc_700_1_9,
      (record as any).marc_700_2_9,
      (record as any).marc_700_3_9,
      (record as any).marc_700_4_9,
      (record as any).marc_700_5_9
    ];

    additionalAuthorIds.forEach(id => {
      if (id && id.toString().trim() !== '') {
        const authorId = id.toString().trim();
        if (!authorIdToBiblios.has(authorId)) {
          authorIdToBiblios.set(authorId, []);
        }
        authorIdToBiblios.get(authorId)!.push(biblioNumber);
      }
    });
  });

  console.log(`📊 Extracted ${authorIdToBiblios.size} unique author IDs with biblio mappings from ${biblioRecords.length} biblio records`);
  
  return authorIdToBiblios;
}

// Generate custom estenad report with selected MARC fields
export async function generateCustomEstenadReport(filters: QueryFilters): Promise<ReportQueryResult[]> {
  let { authorIds, selectedFields = [], isPreview = false, biblioNumbers } = filters;
  let authorIdToBibliosMap: Map<string, number[]> = new Map();
  
  // If biblio numbers provided, extract author IDs from those biblio records first
  if (biblioNumbers && biblioNumbers.length > 0) {
    console.log(`🔍 Extracting author IDs from ${biblioNumbers.length} biblio records`);
    
    // Create filters for getBiblioRecords to extract author IDs
    // This follows the same pattern as generateHierarchicalAuthorsReport
    const biblioFilters: QueryFilters = {
      biblioNumbers,
      selectedFields: [] // We'll use default fields from getBiblioRecords
    };
    
    // Get mapping of author IDs to their source biblio numbers
    authorIdToBibliosMap = await extractAuthorIdsWithBiblioMapping(biblioFilters);
    authorIds = Array.from(authorIdToBibliosMap.keys());
    
    if (!authorIds || authorIds.length === 0) {
      console.log('⚠️ No author IDs found in the specified biblio records');
      return [];
    }
    
    console.log(`✅ Extracted ${authorIds.length} unique author IDs from biblio records`);
  }
  
  if (!authorIds || authorIds.length === 0) {
    throw new Error('Author IDs are required for estenad report');
  }
  
  if (selectedFields.length === 0) {
    throw new Error('Please select at least one MARC field');
  }
  
  console.log('📝 Generating Custom Estenad Report...');
  console.log('👥 Author IDs:', authorIds.length);
  console.log('📋 Selected MARC fields:', selectedFields.join(', '));
  
  try {
    // Get auth_header records with selected fields
    const records = await getAuthHeaderRecords(authorIds, selectedFields, isPreview);
    
    // Transform to ReportQueryResult format
    const results: ReportQueryResult[] = records.map(record => {
      const authId = record.authid?.toString() || '';
      const sourceBiblios = authorIdToBibliosMap.get(authId) || [];
      
      const result: any = {
        biblionumber: record.authid || 0,
        biblio: authId,
        source_biblios: sourceBiblios.join(', '), // Add source biblio numbers
        biblio_details: `AuthType: ${record.authtypecode || 'N/A'}, Created: ${record.datecreated || 'N/A'}`,
        url: '', // auth_header doesn't have URLs
        link: '', // auth_header doesn't have links
      };
      
      // Add all MARC field values
      Object.keys(record).forEach(key => {
        if (key.startsWith('marc_')) {
          result[key] = record[key] || '';
        }
      });
      
      return result as ReportQueryResult;
    });
    
    console.log('✅ Generated', results.length, 'estenad report records');
    return results;
  } catch (error) {
    console.error('❌ Error generating estenad report:', error);
    throw error;
  }
}

/**
 * Get all magazines data (employees 0000-5999)
 * Joins vtiger_account with vtiger_accountscf to get complete information
 */
export async function getAllMagazinesData(): Promise<any[]> {
  const { executeJournalQuery } = await import('@/lib/journal_db');
  
  console.log('Fetching all magazines data (0000-5999)...');
  
  const query = `
    SELECT 
      a.employees AS 'Journal Number',
      a.accountname AS 'Journal Name',
      cf.cf_703  AS 'Organization', 
      cf.cf_707 AS 'Type',
      cf.cf_709 AS 'ISSN',
      cf.cf_711 AS 'ISBN',
      cf.cf_715 AS 'Status',
      cf.cf_717 AS 'Previous Title',
      cf.cf_719 AS 'No. of Times',
      cf.cf_721 AS 'Total Journals',
      cf.cf_723 AS 'Peer Refereed',
      cf.cf_725 AS 'Downloadable',
      cf.cf_727 AS 'Databases',
      cf.cf_729 AS 'Sub-specialization',
      cf.cf_873 AS 'Link Number',
      cf.cf_875 AS 'Category1',
      cf.cf_877 AS 'Category2',
      cf.cf_883 AS 'Category1 (English)',
      cf.cf_885 AS 'Category2 (English)',
      cf.cf_887 AS 'Category3 (English)',
      cf.cf_901 AS 'Category1 (Arabic)',
      cf.cf_903 AS 'Category2 (Arabic)',
      cf.cf_905 AS 'Category3 (Arabic)',
      cf.cf_907 AS 'Category1 (Other)',
      cf.cf_919 AS 'Category2 (Other)',
      cf.cf_921 AS 'Category3 (Other)',
      cf.cf_923 AS 'Category1 (Other Language)',
      cf.cf_925 AS 'Category2 (Other Language)',
      cf.cf_931 AS 'Category3 (Other Language)',
      cf.cf_933 AS 'Category1 (Other Language)'
    FROM vtiger_account a
    LEFT JOIN vtiger_accountscf cf ON a.accountid = cf.accountid
    WHERE CAST(a.employees AS UNSIGNED) >= 0 
      AND CAST(a.employees AS UNSIGNED) <= 5999
    ORDER BY CAST(a.employees AS UNSIGNED)
  `;
  
  const startTime = Date.now();
  const results = await executeJournalQuery(query);
  const queryTime = Date.now() - startTime;
  
  console.log(`✅ Fetched ${results.length} magazines in ${queryTime}ms`);
  return results;
}

/**
 * Get all conferences data (employees 6000-9999)
 * Joins vtiger_account with vtiger_accountscf to get complete information
 */
export async function getAllConferencesData(): Promise<any[]> {
  const { executeJournalQuery } = await import('@/lib/journal_db');
  
  console.log('Fetching all conferences data (6000-9999)...');
  
  const query = `
    SELECT 
      a.employees AS 'Journal Number',
      a.accountname AS 'Journal Name',
      cf.cf_703  AS 'Organization', 
      cf.cf_707 AS 'Type',
      cf.cf_709 AS 'ISSN',
      cf.cf_711 AS 'ISBN',
      cf.cf_715 AS 'Status',
      cf.cf_717 AS 'Previous Title',
      cf.cf_719 AS 'No. of Times',
      cf.cf_721 AS 'Total Journals',
      cf.cf_723 AS 'Peer Refereed',
      cf.cf_725 AS 'Downloadable',
      cf.cf_727 AS 'Databases',
      cf.cf_729 AS 'Sub-specialization',
      cf.cf_873 AS 'Link Number',
      cf.cf_875 AS 'Category1',
      cf.cf_877 AS 'Category2',
      cf.cf_883 AS 'Category1 (English)',
      cf.cf_885 AS 'Category2 (English)',
      cf.cf_887 AS 'Category3 (English)',
      cf.cf_901 AS 'Category1 (Arabic)',
      cf.cf_903 AS 'Category2 (Arabic)',
      cf.cf_905 AS 'Category3 (Arabic)',
      cf.cf_907 AS 'Category1 (Other)',
      cf.cf_919 AS 'Category2 (Other)',
      cf.cf_921 AS 'Category3 (Other)',
      cf.cf_923 AS 'Category1 (Other Language)',
      cf.cf_925 AS 'Category2 (Other Language)',
      cf.cf_931 AS 'Category3 (Other Language)',
      cf.cf_933 AS 'Category1 (Other Language)'
    FROM vtiger_account a
    LEFT JOIN vtiger_accountscf cf ON a.accountid = cf.accountid
    WHERE CAST(a.employees AS UNSIGNED) >= 6000 
      AND CAST(a.employees AS UNSIGNED) <= 9999
    ORDER BY CAST(a.employees AS UNSIGNED)
  `;
  
  const startTime = Date.now();
  const results = await executeJournalQuery(query);
  const queryTime = Date.now() - startTime;
  
  console.log(`✅ Fetched ${results.length} conferences in ${queryTime}ms`);
  return results;
}
