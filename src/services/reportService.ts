import { executeQuery } from '@/lib/database';
import { BiblioRecord, BiblioMetadata, BiblioItems, ReportQueryResult, QueryFilters } from '@/types/database';
import { parseMarcXML, extractMarcField, extractMarcSubfields, extractMultipleMarcFields, extractAllMarcFieldInstances, extractMainAuthorWithId, extractAdditionalAuthorsWithIds } from '@/utils/marcParser';


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

// Build WHERE clause for abstract filter using EXTRACTVALUE for efficiency
function buildAbstractFilter(abstractFilter?: string): { clause: string; params: any[] } {
  if (!abstractFilter) {
    return { clause: '', params: [] };
  }
  
  switch (abstractFilter) {
    case 'without_abstract':
      // Records with no abstract - check database field and MARC field 520
      return {
        clause: `AND (b.abstract IS NULL OR b.abstract = "" OR TRIM(b.abstract) = "" 
                 OR EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="a"]') = "" 
                 OR EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="a"]') IS NULL)`,
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
      // Subfields 'a' and 'e' empty but there is still an abstract (Mandumah generated)
      return {
        clause: `AND (EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="a"]') = "" 
                      OR EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="a"]') IS NULL)
                 AND (EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="e"]') = "" 
                      OR EXTRACTVALUE(bm.metadata, '//datafield[@tag="520"]/subfield[@code="e"]') IS NULL)
                 AND b.abstract IS NOT NULL AND b.abstract != "" AND TRIM(b.abstract) != ""`,
        params: []
      };
    
    default:
      return { clause: '', params: [] };
  }
}

// Note: getMarcMetadata and filterRecordsByAbstractType functions removed - now using EXTRACTVALUE directly for better performance

// Get bibliographic records with filters using EXTRACTVALUE for MARC data (like user's SQL queries)
export async function getBiblioRecords(filters: QueryFilters = {}): Promise<BiblioRecord[]> {
  const { magazineNumbers, startYear, endYear, authorName, isPreview, biblioNumbers, abstractFilter } = filters;
  
  // Build query filters
  const biblioFilter = buildBiblioNumbersFilter(biblioNumbers);
  const magazineFilter = buildMagazineNumbersFilter(magazineNumbers);
  const yearFilter = buildYearRangeFilter(startYear, endYear);
  const authorFilter = buildAuthorFilter(authorName);
  const absFilter = buildAbstractFilter(abstractFilter);
  
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
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="245"]/subfield[@code="a"]') AS marc_245_a,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="246"]/subfield[@code="a"]') AS marc_246_a,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="242"]/subfield[@code="a"]') AS marc_242_a,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="041"]/subfield[@code="a"]') AS marc_041_a,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="100"]/subfield[@code="a"]') AS marc_100_a,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="100"]/subfield[@code="9"]') AS marc_100_9,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="260"]/subfield[@code="b"]') AS marc_260_b,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][1]/subfield[@code="a"]') AS marc_700_1_a,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][1]/subfield[@code="9"]') AS marc_700_1_9,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][2]/subfield[@code="a"]') AS marc_700_2_a,
      EXTRACTVALUE(bm.metadata, '//datafield[@tag="700"][2]/subfield[@code="9"]') AS marc_700_2_9,
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
    ORDER BY b.biblionumber DESC
    ${limitClause}
  `;
  
  const params = [
    ...biblioFilter.params,
    ...magazineFilter.params,
    ...yearFilter.params,
    ...authorFilter.params,
    ...absFilter.params
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
      link: `https://cataloging.mandumah.com/cgi-bin/koha/catalogue/detail.pl?biblionumber=${record.biblionumber}`
    };
    
    // Add specific fields based on report type using pre-extracted MARC fields
    switch (reportType) {
      case 'export_research_titles':
      case 'export_translations_titles_authors':
      case 'export_translations_citation_title':
        result.title_245 = (record as any).marc_245_a || record.title || '';
        result.title_246 = (record as any).marc_246_a || '';
        result.title_242 = (record as any).marc_242_a || '';
        result.language_041 = (record as any).marc_041_a || '';
        if (reportType === 'export_translations_titles_authors') {
          result.author = (record as any).marc_100_a || record.author || '';
          result.university_373 = (record as any).marc_260_b || '';
        }
        break;
        
      case 'export_research_authors':
        // Use pre-extracted author data from EXTRACTVALUE
        result.author = (record as any).marc_100_a || record.author || '';
        result.author_id = (record as any).marc_100_9 || '';
        
        // Use pre-extracted additional authors data
        result.additional_author = (record as any).marc_700_1_a || '';
        result.additional_author_id = (record as any).marc_700_1_9 || '';
        result.additional_author_2 = (record as any).marc_700_2_a || '';
        result.additional_author_id_2 = (record as any).marc_700_2_9 || '';
        break;
        
      case 'export_author_data':
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

// Generate custom report with selected MARC fields using EXTRACTVALUE
export async function generateCustomReport(filters: QueryFilters): Promise<ReportQueryResult[]> {
  // For custom reports, we'll get the basic records and add specific MARC extractions as needed
  // This is a simplified version - for full flexibility, we could build dynamic EXTRACTVALUE queries
  const biblioRecords = await getBiblioRecords(filters);
  
  if (biblioRecords.length === 0) {
    return [];
  }
  
  // Transform records into report format - all common MARC fields are already extracted
  const reportData: ReportQueryResult[] = biblioRecords.map(record => {
    // Base result with common fields
    const result: ReportQueryResult = {
      ...record,
      url: record.url || '', // Use the PDF filename from biblioitems
      biblio: String(record.biblionumber).padStart(4, '0'),
      link: `https://cataloging.mandumah.com/cgi-bin/koha/catalogue/detail.pl?biblionumber=${record.biblionumber}`
    };
    
    // All MARC fields are already extracted in getBiblioRecords using EXTRACTVALUE
    // They're available as marc_245_a, marc_100_a, etc.
    
    return result;
  });
  
  return reportData;
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
