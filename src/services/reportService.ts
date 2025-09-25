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

// Build WHERE clause for abstract filter
function buildAbstractFilter(abstractFilter?: string): { clause: string; params: any[] } {
  if (!abstractFilter) {
    return { clause: '', params: [] };
  }
  
  switch (abstractFilter) {
    case 'without_abstract':
      // Records with no field 520 - check if abstract is null or empty
      return {
        clause: 'AND (b.abstract IS NULL OR b.abstract = "" OR TRIM(b.abstract) = "")',
        params: []
      };
    
    case 'missing_english':
    case 'other_language':
    case 'mandumah_abstract':
      // For these complex MARC subfield checks, we need to filter at application level
      // after parsing MARC XML. For now, return records with abstracts and let 
      // the application-level filtering handle the specifics
      return {
        clause: 'AND b.abstract IS NOT NULL AND b.abstract != "" AND TRIM(b.abstract) != ""',
        params: []
      };
    
    default:
      return { clause: '', params: [] };
  }
}

// Filter records based on abstract MARC subfield criteria
function filterRecordsByAbstractType(records: ReportQueryResult[], marcMetadataMap: Map<number, string>, abstractFilter?: string): ReportQueryResult[] {
  if (!abstractFilter || abstractFilter === 'without_abstract') {
    return records; // SQL-level filtering already handled this
  }
  
  return records.filter(record => {
    const marcXml = marcMetadataMap.get(record.biblionumber) || '';
    
    // If no MARC XML is available, fall back to basic abstract field check
    if (!marcXml || !marcXml.trim().startsWith('<?xml')) {
      switch (abstractFilter) {
        case 'mandumah_abstract':
          // If we can't parse MARC, assume records with abstracts might be Mandumah-generated
          return record.abstract && record.abstract.trim() !== '';
        case 'missing_english':
        case 'other_language':
          // For these cases without MARC data, we can't make accurate determinations
          return record.abstract && record.abstract.trim() !== '';
        default:
          return true;
      }
    }
    
    try {
      const subfields520 = extractMarcSubfields(marcXml, '520');
      
      switch (abstractFilter) {
        case 'missing_english':
          // Subfield 'a' available, but 'b' and 'f' empty
          return subfields520.a && (!subfields520.b || subfields520.b.trim() === '') && (!subfields520.f || subfields520.f.trim() === '');
        
        case 'other_language':
          // Subfield 'd' available, all others empty
          return subfields520.d && 
                 (!subfields520.a || subfields520.a.trim() === '') && 
                 (!subfields520.b || subfields520.b.trim() === '') && 
                 (!subfields520.e || subfields520.e.trim() === '') && 
                 (!subfields520.f || subfields520.f.trim() === '');
        
        case 'mandumah_abstract':
          // Subfields 'a' and 'e' empty in field 520 - this means Mandumah generated the abstract
          return (!subfields520.a || subfields520.a.trim() === '') && 
                 (!subfields520.e || subfields520.e.trim() === '') &&
                 (record.abstract && record.abstract.trim() !== ''); // But there is still an abstract
        
        default:
          return true;
      }
    } catch (error) {
      console.error(`Error extracting MARC subfields for biblio ${record.biblionumber}:`, error);
      // Fall back to basic abstract check on error
      return record.abstract && record.abstract.trim() !== '';
    }
  });
}

// Get bibliographic records with filters
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
      bi.issuenumber
    FROM biblio b
    LEFT JOIN biblioitems bi ON b.biblionumber = bi.biblionumber
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

// Get MARC metadata for specific biblio records
export async function getMarcMetadata(biblionumbers: number[]): Promise<Map<number, string>> {
  if (biblionumbers.length === 0) {
    return new Map();
  }
  
  // Process in batches to avoid query size limits
  const batchSize = 1000;
  const metadataMap = new Map<number, string>();
  
  for (let i = 0; i < biblionumbers.length; i += batchSize) {
    const batch = biblionumbers.slice(i, i + batchSize);
    const placeholders = batch.map(() => '?').join(',');
    
    console.log(`Fetching MARC metadata batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(biblionumbers.length/batchSize)} (${batch.length} records)`);
    
    const query = `
      SELECT biblionumber
      FROM biblio_metadata
      WHERE biblionumber IN (${placeholders})
    `;
    
    try {
      const results = await executeQuery<BiblioMetadata>(query, batch);
      results.forEach(row => {
        metadataMap.set(row.biblionumber, row.metadata);
      });
    } catch (error) {
      console.error(`Error fetching MARC metadata batch:`, error);
      // Continue with next batch instead of failing completely
    }
  }
  
  console.log(`Successfully fetched MARC metadata for ${metadataMap.size}/${biblionumbers.length} records`);
  return metadataMap;
}

// Generate report data for predefined reports
export async function generatePredefinedReport(reportType: string, filters: QueryFilters): Promise<ReportQueryResult[]> {
  // Get base bibliographic records
  const biblioRecords = await getBiblioRecords(filters);
  
  if (biblioRecords.length === 0) {
    return [];
  }

  // Determine if MARC metadata is needed for this report type
  const needsMarcData = [
    'export_research_titles',
    'export_translations_titles_authors', 
    'export_translations_citation_title',
    'export_translations_citation_author',
    'export_abstract_field'
  ].includes(reportType);

  // Get MARC metadata only if needed
  const biblionumbers = biblioRecords.map(record => record.biblionumber);
  let marcMetadata = new Map<number, string>();
  
  if (needsMarcData) {
    try {
      marcMetadata = await getMarcMetadata(biblionumbers);
    } catch (error) {
      console.error('Error fetching MARC metadata:', error);
      // Continue with empty MARC data - will use database fields as fallback
    }
  }

  // Get database configuration for this report type
  const dbConfig = REPORT_DB_CONFIG[reportType as keyof typeof REPORT_DB_CONFIG] || REPORT_DB_CONFIG.default;

  // Transform records into report format
  const reportData: ReportQueryResult[] = biblioRecords.map(record => {
    const marcXml = marcMetadata.get(record.biblionumber) || '';
    let parsedMarc: any = {};
    
    // Only parse MARC if we have valid XML data
    if (marcXml && marcXml.trim().startsWith('<?xml')) {
      try {
        parsedMarc = parseMarcXML(marcXml);
      } catch (error) {
        console.error(`Error parsing MARC for biblio ${record.biblionumber}:`, error);
        parsedMarc = {}; // Use empty object as fallback
      }
    }

    // Base result with common fields
    const result: ReportQueryResult = {
      ...record,
      url: record.url || '', // Use the PDF filename from biblioitems
      biblio: String(record.biblionumber).padStart(4, '0'),
      link: `https://cataloging.mandumah.com/cgi-bin/koha/catalogue/detail.pl?biblionumber=${record.biblionumber}`
    };
    
    // Add specific fields based on report type
    switch (reportType) {
      case 'export_research_titles':
      case 'export_translations_titles_authors':
      case 'export_translations_citation_title':
        result.title_245 = parsedMarc.main_title_245 || record.title || '';
        result.title_246 = parsedMarc.alternative_title_246 || '';
        result.title_242 = parsedMarc.translated_title_242 || '';
        // Get the language code 041
        result.language_041 = parsedMarc.language_041 || '';
        if (reportType === 'export_translations_titles_authors') {
          result.author = parsedMarc.author_100 || record.author || '';
          result.university_373 = parsedMarc.publication_info_260 || '';
        }
        break;
        
      case 'export_research_authors':
        // Extract main author (field 100) with ID
        const mainAuthor = extractMainAuthorWithId(marcXml);
        result.author = mainAuthor.author;
        result.author_id = mainAuthor.authorId;
        
        // Extract all additional authors (field 700) with IDs
        const additionalAuthors = extractAdditionalAuthorsWithIds(marcXml);
        additionalAuthors.forEach((authorData, index) => {
          const suffix = index === 0 ? '' : `_${index + 1}`;
          result[`additional_author${suffix}`] = authorData.author;
          result[`additional_author_id${suffix}`] = authorData.authorId;
        });
        break;
        
      case 'export_author_data':
      case 'export_translations_citation_author':
        result.author = parsedMarc.author_100 || record.author || '';
        break;
        
      case 'export_abstract_field':
        // Extract all subfields of tag 520
        const subfields520 = extractMarcSubfields(marcXml, '520');
        Object.entries(subfields520).forEach(([code, value]) => {
          result[`abstract_520_${code}`] = value;
        });
        // Also keep the original for backward compatibility
        result.abstract_520 = parsedMarc.abstract_520 || record.abstract || '';
        break;
        
      case 'export_citation_entry':
        // No additional fields for citation entry
        break;
        
      case 'convert_url_to_biblio':
        // This report needs biblio and the PDF filename from the url field
        // The biblio will be clickable, the url will show the PDF filename
        result.url = record.url || ''; // This contains the PDF filename like "0005-000-077-222.pdf"
        break;
    }
    
    return result;
  });
  
  // Apply application-level abstract filtering if needed
  const filteredData = filterRecordsByAbstractType(reportData, marcMetadata, filters.abstractFilter);
  
  return filteredData;
}

// Generate custom report with selected MARC fields
export async function generateCustomReport(filters: QueryFilters): Promise<ReportQueryResult[]> {
  const { selectedFields = [] } = filters;
  
  // Get base bibliographic records
  const biblioRecords = await getBiblioRecords(filters);
  
  if (biblioRecords.length === 0) {
    return [];
  }
  
  // Get MARC metadata for all records
  const biblionumbers = biblioRecords.map(record => record.biblionumber);
  const marcMetadata = await getMarcMetadata(biblionumbers);
  
  // Transform records into report format
  const reportData: ReportQueryResult[] = biblioRecords.map(record => {
    const marcXml = marcMetadata.get(record.biblionumber) || '';
    
    // Base result with common fields
    const result: ReportQueryResult = {
      ...record,
      url: record.url || '', // Use the PDF filename from biblioitems
      biblio: String(record.biblionumber).padStart(4, '0'),
      link: `https://cataloging.mandumah.com/cgi-bin/koha/catalogue/detail.pl?biblionumber=${record.biblionumber}`
    };
    
    // Add selected MARC fields
    selectedFields.forEach(fieldTag => {
      if (fieldTag === '520') {
        // Special handling for tag 520 - extract all subfields
        const subfields = extractMarcSubfields(marcXml, '520');
        Object.entries(subfields).forEach(([code, value]) => {
          result[`marc_520_${code}`] = value;
        });
      } else if (fieldTag === '700') {
        // Special handling for field 700 - extract authors with IDs
        const additionalAuthors = extractAdditionalAuthorsWithIds(marcXml);
        additionalAuthors.forEach((authorData, index) => {
          if (index === 0) {
            result[`marc_700`] = authorData.author;
            result[`marc_700_id`] = authorData.authorId;
          } else {
            result[`marc_700_${index + 1}`] = authorData.author;
            result[`marc_700_id_${index + 1}`] = authorData.authorId;
          }
        });
      } else if (fieldTag === '100') {
        // Special handling for field 100 - extract main author with ID
        const mainAuthor = extractMainAuthorWithId(marcXml);
        result[`marc_100`] = mainAuthor.author;
        result[`marc_100_id`] = mainAuthor.authorId;
      } else {
        // Handle multiple instances of the same field
        const fieldInstances = extractMultipleMarcFields(marcXml, fieldTag);
        if (fieldInstances.length > 0) {
          // First instance uses the standard property name
          result[`marc_${fieldTag}`] = fieldInstances[0];
          
          // Additional instances get numbered property names
          for (let i = 1; i < fieldInstances.length; i++) {
            result[`marc_${fieldTag}_${i + 1}`] = fieldInstances[i];
          }
        }
      }
    });
    
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
