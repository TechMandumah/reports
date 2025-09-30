import { NextRequest, NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import { getCitationConnection } from '@/lib/citation_db';

// Configure API route timeout
export const maxDuration = 3000; // 50 minutes
export const dynamic = 'force-dynamic';

interface CustomCitationData {
  [key: string]: any;
}

// Base URL for citation PDFs
// const CITATION_PDF_BASE_URL = 'https://citation-db.mandumah.com/pdfs/';

// Helper function to construct full PDF URL
function constructPdfUrl(filename: string): string {
  if (!filename || filename.trim() === '') {
    return '';
  }
  
  // If it's already a full URL, return as is
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  
  // Construct full URL with base path
  return `${filename}`;
}

// Helper function to extract data from MARC XML with author IDs
function extractFromMarcXml(marcxml: string): {
  author: string;
  authorId?: string;
  title: string;
  translatedTitle?: string;
  alternativeTitle?: string;
  year: string;
  journal: string;
  volume?: string;
  issue?: string;
  pages?: string;
  additionalAuthors?: string[];
  additionalAuthorIds?: string[];
  contentType?: string;
  citation?: string;
  languageCode?: string;
} {
  const result = {
    author: '',
    authorId: undefined as string | undefined,
    title: '',
    translatedTitle: undefined as string | undefined,
    alternativeTitle: undefined as string | undefined,
    year: '',
    journal: '',
    volume: undefined as string | undefined,
    issue: undefined as string | undefined,
    pages: undefined as string | undefined,
    additionalAuthors: [] as string[],
    additionalAuthorIds: [] as string[],
    contentType: undefined as string | undefined,
    citation: undefined as string | undefined,
    languageCode: undefined as string | undefined,
  };

  try {
    // Extract author from field 100 with authority ID
    const authorMatch = marcxml.match(/<datafield tag="100"[^>]*>([\s\S]*?)<\/datafield>/);
    if (authorMatch) {
      const authorField = authorMatch[1];
      
      // Extract author name
      const authorNameMatch = authorField.match(/<subfield code="a">([^<]+)<\/subfield>/);
      if (authorNameMatch) {
        result.author = authorNameMatch[1].trim();
      }
      
      // Extract author ID (authority record ID)
      const authorIdMatch = authorField.match(/<subfield code="9">([^<]+)<\/subfield>/);
      if (authorIdMatch) {
        result.authorId = authorIdMatch[1].trim();
      }
    }

    // Extract title from field 245
    const titleMatch = marcxml.match(/<datafield tag="245"[^>]*>[\s\S]*?<subfield code="a">([^<]+)<\/subfield>/);
    if (titleMatch) {
      result.title = titleMatch[1].trim();
    }

    // Extract translated title from field 242
    const translatedTitleMatch = marcxml.match(/<datafield tag="242"[^>]*>[\s\S]*?<subfield code="a">([^<]+)<\/subfield>/);
    if (translatedTitleMatch) {
      result.translatedTitle = translatedTitleMatch[1].trim();
    }

    // Extract alternative title from field 246
    const alternativeTitleMatch = marcxml.match(/<datafield tag="246"[^>]*>[\s\S]*?<subfield code="a">([^<]+)<\/subfield>/);
    if (alternativeTitleMatch) {
      result.alternativeTitle = alternativeTitleMatch[1].trim();
    }

    // Extract year from field 260
    const yearMatch = marcxml.match(/<datafield tag="260"[^>]*>[\s\S]*?<subfield code="c">([^<]+)<\/subfield>/);
    if (yearMatch) {
      result.year = yearMatch[1].trim();
    }

    // Extract journal from field 773
    const journalMatch = marcxml.match(/<datafield tag="773"[^>]*>[\s\S]*?<subfield code="s">([^<]+)<\/subfield>/);
    if (journalMatch) {
      result.journal = journalMatch[1].trim();
    }

    // Extract volume from field 773
    const volumeMatch = marcxml.match(/<datafield tag="773"[^>]*>[\s\S]*?<subfield code="v">([^<]+)<\/subfield>/);
    if (volumeMatch) {
      result.volume = volumeMatch[1].trim();
    }

    // Extract issue from field 773
    const issueMatch = marcxml.match(/<datafield tag="773"[^>]*>[\s\S]*?<subfield code="w">([^<]+)<\/subfield>/);
    if (issueMatch) {
      result.issue = issueMatch[1].trim();
    }

    // Extract pages from field 300
    const pagesMatch = marcxml.match(/<datafield tag="300"[^>]*>[\s\S]*?<subfield code="a">([^<]+)<\/subfield>/);
    if (pagesMatch) {
      result.pages = pagesMatch[1].trim();
    }

    // Extract additional authors from field 700 with their IDs
    const additionalAuthorMatches = marcxml.matchAll(/<datafield tag="700"[^>]*>([\s\S]*?)<\/datafield>/g);
    for (const match of additionalAuthorMatches) {
      const authorField = match[1];
      
      // Extract author name
      const authorNameMatch = authorField.match(/<subfield code="a">([^<]+)<\/subfield>/);
      if (authorNameMatch) {
        result.additionalAuthors.push(authorNameMatch[1].trim());
        
        // Extract corresponding author ID
        const authorIdMatch = authorField.match(/<subfield code="9">([^<]+)<\/subfield>/);
        if (authorIdMatch) {
          result.additionalAuthorIds.push(authorIdMatch[1].trim());
        } else {
          result.additionalAuthorIds.push(''); // Empty if no ID found
        }
      }
    }

    // Extract language code from field 041
    const languageCodeMatch = marcxml.match(/<datafield tag="041"[^>]*>[\s\S]*?<subfield code="a">([^<]+)<\/subfield>/);
    if (languageCodeMatch) {
      result.languageCode = languageCodeMatch[1].trim();
    }

    // Extract content type from field 336
    const contentTypeMatch = marcxml.match(/<datafield tag="336"[^>]*>[\s\S]*?<subfield code="a">([^<]+)<\/subfield>/);
    if (contentTypeMatch) {
      result.contentType = contentTypeMatch[1].trim();
    }

    // Extract citation from field 995
    const citationMatch = marcxml.match(/<datafield tag="995"[^>]*>[\s\S]*?<subfield code="a">([^<]+)<\/subfield>/);
    if (citationMatch) {
      result.citation = citationMatch[1].trim();
    }
  } catch (error) {
    console.error('Error parsing MARC XML:', error);
  }

  return result;
}

export async function POST(request: NextRequest) {
  let connection;
  const requestId = `custom-cit-${Date.now()}`;
  
  try {
    console.log(`🚀 [${requestId}] CustomCitationReport: Starting request processing`);
    console.log(`📝 [${requestId}] Request timestamp:`, new Date().toISOString());
    console.log(`🌍 [${requestId}] Environment:`, process.env.NODE_ENV);
    
    const { magazineNumbers, startYear, endYear, selectedFields, isPreview, biblioNumbers } = await request.json();
    console.log(`📋 [${requestId}] CustomCitationReport: Request params:`, { 
      magazineNumbers, 
      startYear, 
      endYear, 
      selectedFields, 
      isPreview,
      biblioNumbers,
      magazineNumbersType: typeof magazineNumbers,
      magazineNumbersIsArray: Array.isArray(magazineNumbers),
      biblioNumbersType: typeof biblioNumbers,
      biblioNumbersIsArray: Array.isArray(biblioNumbers)
    });

    // Validate selected fields
    if (!selectedFields || selectedFields.length === 0) {
      console.error(`❌ [${requestId}] No fields selected`);
      return NextResponse.json(
        { error: 'No fields selected', requestId },
        { status: 400 }
      );
    }

    // Create database connection with timeout
    console.log(`🔗 [${requestId}] Getting citation database connection...`);
    const connectionStart = Date.now();
    connection = await getCitationConnection();
    const connectionTime = Date.now() - connectionStart;
    console.log(`✅ [${requestId}] Citation database connection established in ${connectionTime}ms`);

    let query = `
      SELECT 
        b.biblionumber,
        b.frameworkcode,
        b.author as biblio_author,
        b.title as biblio_title,
        b.unititle,
        b.notes,
        b.serial,
        b.seriestitle,
        b.copyrightdate,
        b.timestamp,
        b.datecreated,
        b.abstract,
        bi.biblioitemnumber,
        bi.volumedate,
        bi.illus,
        bi.size,
        bi.place,
        bi.lccn,
        bi.marc,
        bi.url,
        bi.publishercode,
        -- Extract MARC fields using EXTRACTVALUE for better performance
        EXTRACTVALUE(bi.marcxml, '//controlfield[@tag="001"]') AS marc_001,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="041"]/subfield[@code="a"]') AS marc_041_a,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="073"]/subfield[@code="a"]') AS marc_073_a,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="100"]/subfield[@code="a"]') AS marc_100_a,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="100"]/subfield[@code="9"]') AS marc_100_9,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="242"]/subfield[@code="a"]') AS marc_242_a,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="245"]/subfield[@code="a"]') AS marc_245_a,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="246"]/subfield[@code="a"]') AS marc_246_a,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="260"]/subfield[@code="c"]') AS marc_260_c,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="300"]/subfield[@code="a"]') AS marc_300_a,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="336"]/subfield[@code="a"]') AS marc_336_a,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="700"][1]/subfield[@code="a"]') AS marc_700_1_a,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="700"][1]/subfield[@code="9"]') AS marc_700_1_9,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="700"][2]/subfield[@code="a"]') AS marc_700_2_a,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="700"][2]/subfield[@code="9"]') AS marc_700_2_9,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="773"]/subfield[@code="t"]') AS marc_773_t,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="773"]/subfield[@code="g"]') AS marc_773_g,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="995"]/subfield[@code="a"]') AS marc_995_a,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="999"]/subfield[@code="c"]') AS marc_999_c
      FROM biblioitems bi
      INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
      WHERE b.frameworkcode = 'CIT'
        AND bi.marcxml IS NOT NULL
        AND bi.marcxml != ''
    `;

    console.log(`📝 [${requestId}] CustomCitationReport: Generated base SQL query`);

    const queryParams: any[] = [];

    // Add magazine numbers filter - get all versions and builds under magazine
    if (magazineNumbers) {
      console.log(`🔍 [${requestId}] Processing magazine numbers filter...`);
      let numbers: string[] = [];
      
      // Handle different types of magazineNumbers input
      if (Array.isArray(magazineNumbers)) {
        numbers = magazineNumbers.filter((num: any) => num && num.toString().trim()).map(num => num.toString());
        console.log(`📊 [${requestId}] Magazine numbers (array format):`, numbers);
      } else if (typeof magazineNumbers === 'string') {
        numbers = magazineNumbers.split(/[,\s\n]+/).filter((num: string) => num.trim());
        console.log(`📊 [${requestId}] Magazine numbers (string format):`, numbers);
      } else {
        numbers = [magazineNumbers.toString()].filter((num: string) => num.trim());
        console.log(`📊 [${requestId}] Magazine numbers (other format):`, numbers);
      }
      
      if (numbers.length > 0) {
        console.log(`📊 [${requestId}] Processing ${numbers.length} magazine numbers:`, numbers);
        
        // Build LIKE conditions for each magazine number to get all versions (e.g., 0005-*)
        const likeConditions = numbers.map(() => 'bi.url LIKE ?').join(' OR ');
        query += ` AND (${likeConditions})`;
        
        // Add parameters with wildcard pattern for each magazine number
        const patterns: string[] = [];
        for (const number of numbers) {
          const pattern = `${number.toString().padStart(4, '0')}-%`;
          patterns.push(pattern);
          queryParams.push(pattern);
        }
        console.log(`🔍 [${requestId}] Magazine filter patterns:`, patterns);
      } else {
        console.log(`⚠️ [${requestId}] No valid magazine numbers found after filtering`);
      }
    } else {
      console.log(`ℹ️ [${requestId}] No magazine numbers filter provided - will return all records`);
    }

    // Add year range filter
    if (startYear && endYear) {
      console.log(`📅 [${requestId}] Adding year range filter: ${startYear} - ${endYear}`);
      query += ' AND b.copyrightdate BETWEEN ? AND ?';
      queryParams.push(parseInt(startYear), parseInt(endYear));
    } else if (startYear) {
      console.log(`📅 [${requestId}] Adding start year filter: >= ${startYear}`);
      query += ' AND b.copyrightdate >= ?';
      queryParams.push(parseInt(startYear));
    } else if (endYear) {
      console.log(`📅 [${requestId}] Adding end year filter: <= ${endYear}`);
      query += ' AND b.copyrightdate <= ?';
      queryParams.push(parseInt(endYear));
    } else {
      console.log(`ℹ️ [${requestId}] No year filter provided`);
    }

    // Add biblio numbers filter - CORRECTED: Find citations within specified journals
    if (biblioNumbers) {
      console.log(`🔍 [${requestId}] Processing journal biblio numbers filter...`);
      let numbers: string[] = [];
      
      // Handle different types of biblioNumbers input (similar to magazineNumbers)
      if (Array.isArray(biblioNumbers)) {
        numbers = biblioNumbers.filter((num: any) => num && num.toString().trim()).map(num => num.toString());
        console.log(`📚 [${requestId}] CustomCitationReport: Journal biblio numbers (array format):`, numbers);
      } else if (typeof biblioNumbers === 'string') {
        numbers = biblioNumbers.split(/[,\s\n]+/).filter((num: string) => num.trim());
        console.log(`📚 [${requestId}] CustomCitationReport: Journal biblio numbers (string format):`, numbers);
      } else {
        numbers = [biblioNumbers.toString()].filter((num: string) => num.trim());
        console.log(`📚 [${requestId}] CustomCitationReport: Journal biblio numbers (other format):`, numbers);
      }
      
      if (numbers.length > 0) {
        console.log(`📚 [${requestId}] CustomCitationReport: Finding citations within ${numbers.length} journals`);
        
        // CORRECTED: Look for citations that belong to these journals
        // Method 1: Through MARC field 773 subfield w (journal reference)
        const journalConditions = numbers.map(() => 'EXTRACTVALUE(bi.marcxml, \'//datafield[@tag="773"]/subfield[@code="w"]\') = ?').join(' OR ');
        query += ` AND (${journalConditions})`;
        
        // Convert journal numbers to strings for MARC field matching
        queryParams.push(...numbers);
        console.log(`📚 [${requestId}] CustomCitationReport: Looking for citations referencing journals:`, numbers);
      }
    }

    query += ' ORDER BY b.biblionumber';

    console.log(`🔍 [${requestId}] Final query:`, query.substring(0, 300) + '...');
    console.log(`📋 [${requestId}] Query parameters:`, queryParams);
    console.log(`⏱️ [${requestId}] Executing query at:`, new Date().toISOString());
    const queryStart = Date.now();

    const [rows] = await connection.execute(query, queryParams);
    const results = rows as any[];
    
    const queryTime = Date.now() - queryStart;
    console.log(`✅ [${requestId}] Query completed successfully:`, {
      executionTime: `${queryTime}ms`,
      rowsReturned: results.length,
      timestamp: new Date().toISOString(),
      averageTimePerRow: results.length > 0 ? `${(queryTime / results.length).toFixed(2)}ms` : 'N/A'
    });
    
    if (results.length > 0) {
      console.log(`📊 [${requestId}] Sample record structure:`, {
        biblionumber: results[0].biblionumber,
        hasAuthor: !!results[0].biblio_author,
        hasTitle: !!results[0].biblio_title,
        hasMarcxml: !!results[0].marcxml,
        marcxmlLength: results[0].marcxml?.length || 0,
        hasUrl: !!results[0].url,
        copyrightdate: results[0].copyrightdate
      });
      console.log(`📝 [${requestId}] First few biblionumbers:`, results.slice(0, 5).map(r => r.biblionumber));
    } else {
      console.warn(`⚠️ [${requestId}] No records found! This might be the issue.`);
      console.warn(`🔍 [${requestId}] Final query was:`, query);
      console.warn(`📋 [${requestId}] With parameters:`, queryParams);
    }

    const citationData: CustomCitationData[] = results.map(row => {
      console.log('CustomCitationReport: Processing row:', {
        biblionumber: row.biblionumber,
        url: row.url,
        biblio_author: row.biblio_author,
        biblio_title: row.biblio_title,
        copyrightdate: row.copyrightdate,
        hasMarcData: !!(row.marc_245_a || row.marc_100_a)
      });

      // Use pre-extracted MARC data from EXTRACTVALUE - much faster than client-side parsing
      const marcData = {
        author: row.marc_100_a || '',
        authorId: row.marc_100_9 || '',
        title: row.marc_245_a || '',
        translatedTitle: row.marc_242_a || '',
        alternativeTitle: row.marc_246_a || '',
        year: row.marc_260_c || '',
        journal: row.marc_773_t || '',
        volume: '',
        issue: '',
        pages: row.marc_300_a || '',
        additionalAuthors: [row.marc_700_1_a, row.marc_700_2_a].filter(a => a).join('; '),
        additionalAuthorIds: [row.marc_700_1_9, row.marc_700_2_9].filter(a => a).join('; '),
        contentType: row.marc_336_a || '',
        citation: row.marc_995_a || '',
        languageCode: row.marc_041_a || ''
      };

      // Parse volume/issue from 773$g if available
      if (row.marc_773_g) {
        const volumeIssueMatch = row.marc_773_g.match(/Vol\.\s*(\d+).*?No\.\s*(\d+)/i) ||
                                row.marc_773_g.match(/المجلد\s*(\d+).*?العدد\s*(\d+)/i) ||
                                row.marc_773_g.match(/(\d+)\s*\((\d+)\)/);
        if (volumeIssueMatch) {
          marcData.volume = volumeIssueMatch[1];
          marcData.issue = volumeIssueMatch[2];
        }
      }

      console.log('CustomCitationReport: Using pre-extracted MARC data:', marcData);

      // Create complete data object with all available fields
      const completeData: CustomCitationData = {
        biblionumber: row.biblionumber,
        url: row.url || '',
        pdfUrl: constructPdfUrl(row.url || ''),
        frameworkcode: row.frameworkcode || '',
        author: marcData.author || row.biblio_author || '',
        authorId: marcData.authorId || '',
        title: marcData.title || row.biblio_title || '',
        translatedTitle: marcData.translatedTitle || '',
        alternativeTitle: marcData.alternativeTitle || '',
        year: marcData.year || row.copyrightdate?.toString() || '',
        journal: marcData.journal || '',
        volume: marcData.volume || row.volume || '',
        issue: marcData.issue || '',
        pages: marcData.pages || row.pages || '',
        additionalAuthors: marcData.additionalAuthors || '',
        additionalAuthorIds: marcData.additionalAuthorIds || '',
        languageCode: marcData.languageCode || '',
        contentType: marcData.contentType || '',
        citation: marcData.citation || '',
        publishercode: row.publishercode || row.marc_073_a || '',
        notes: row.notes || row.biblioitem_notes || '',
        abstract: row.abstract || '',
        serial: row.serial || '',
        seriestitle: row.seriestitle || '',
        datecreated: row.datecreated || '',
        timestamp: row.timestamp || '',
        unititle: row.unititle || '',
        biblioitemnumber: row.biblioitemnumber || '',
        volumedate: row.volumedate || '',
        illus: row.illus || '',
        size: row.size || '',
        place: row.place || '',
        lccn: row.lccn || '',
        marc: row.marc || ''
      };

      console.log('CustomCitationReport: Complete data object:', completeData);
      console.log('CustomCitationReport: Selected fields:', selectedFields);

      // Filter to only include selected fields
      const filteredData: CustomCitationData = {};
      selectedFields.forEach((field: string) => {
        console.log(`CustomCitationReport: Processing field ${field}`);
        // Map MARC tag numbers to actual data properties
        switch (field) {
          case '000':
            // Leader - not available in current data structure
            console.log('CustomCitationReport: Field 000 (Leader) - not implemented');
            break;
          case '001':
            filteredData['controlNumber'] = row.marc_001 || completeData.biblionumber || '';
            console.log(`CustomCitationReport: Field 001 mapped to controlNumber: ${filteredData['controlNumber']}`);
            break;
          case '041':
            filteredData['languageCode'] = completeData.languageCode || '';
            console.log(`CustomCitationReport: Field 041 mapped to languageCode: ${filteredData['languageCode']}`);
            break;
          case '073':
            filteredData['publisherCode'] = completeData.publishercode || '';
            console.log(`CustomCitationReport: Field 073 mapped to publisherCode: ${filteredData['publisherCode']}`);
            break;
          case '100':
            filteredData['author'] = completeData.author || '';
            filteredData['authorId'] = completeData.authorId || '';
            console.log(`CustomCitationReport: Field 100 mapped to author: ${filteredData['author']}, authorId: ${filteredData['authorId']}`);
            break;
          case '242':
            filteredData['translatedTitle'] = completeData.translatedTitle || '';
            console.log(`CustomCitationReport: Field 242 mapped to translatedTitle: ${filteredData['translatedTitle']}`);
            break;
          case '245':
            filteredData['title'] = completeData.title || '';
            console.log(`CustomCitationReport: Field 245 mapped to title: ${filteredData['title']}`);
            break;
          case '246':
            filteredData['alternativeTitle'] = completeData.alternativeTitle || '';
            console.log(`CustomCitationReport: Field 246 mapped to alternativeTitle: ${filteredData['alternativeTitle']}`);
            break;
          case '260':
            filteredData['year'] = completeData.year || '';
            console.log(`CustomCitationReport: Field 260 mapped to year: ${filteredData['year']}`);
            break;
          case '300':
            filteredData['pages'] = completeData.pages || '';
            console.log(`CustomCitationReport: Field 300 mapped to pages: ${filteredData['pages']}`);
            break;
          case '336':
            filteredData['contentType'] = completeData.contentType || '';
            console.log(`CustomCitationReport: Field 336 mapped to contentType: ${filteredData['contentType']}`);
            break;
          case '700':
            filteredData['additionalAuthors'] = completeData.additionalAuthors || '';
            filteredData['additionalAuthorIds'] = completeData.additionalAuthorIds || '';
            console.log(`CustomCitationReport: Field 700 mapped to additionalAuthors: ${filteredData['additionalAuthors']}, additionalAuthorIds: ${filteredData['additionalAuthorIds']}`);
            break;
          case '773':
            filteredData['journal'] = completeData.journal || '';
            filteredData['volume'] = completeData.volume || '';
            filteredData['issue'] = completeData.issue || '';
            console.log(`CustomCitationReport: Field 773 mapped to journal: ${filteredData['journal']}, volume: ${filteredData['volume']}, issue: ${filteredData['issue']}`);
            break;
          case '995':
            filteredData['citation'] = completeData.citation || '';
            console.log(`CustomCitationReport: Field 995 mapped to citation: ${filteredData['citation']}`);
            break;
          case '999':
            filteredData['biblionumber'] = completeData.biblionumber || '';
            console.log(`CustomCitationReport: Field 999 mapped to biblionumber: ${filteredData['biblionumber']}`);
            break;
          default:
            // For any other fields, try to match directly
            if (completeData.hasOwnProperty(field)) {
              filteredData[field] = completeData[field];
              console.log(`CustomCitationReport: Field ${field} mapped directly: ${filteredData[field]}`);
            } else {
              console.log(`CustomCitationReport: Field ${field} not found in completeData`);
            }
            break;
        }
      });

      // Always include URL and biblionumber for reference
      filteredData['url'] = completeData.url || '';
      if (!filteredData['biblionumber']) {
        filteredData['biblionumber'] = completeData.biblionumber || '';
      }

      console.log('CustomCitationReport: Final filtered data:', filteredData);
      return filteredData;
    });

    console.log(`CustomCitationReport: Processed ${citationData.length} records`);
    if (citationData.length > 0) {
      console.log('CustomCitationReport: Sample processed record:', citationData[0]);
    }

    await connection.release();

    // Create field labels mapping
    const fieldLabels: { [key: string]: string } = {
      biblionumber: 'Biblio Number',
      url: 'PDF Filename V2',
      pdfUrl: 'PDF URL',
      controlNumber: 'Control Number (001)',
      languageCode: 'Language Code (041)',
      publisherCode: 'Publisher Code (073)',
      author: 'Main Author (100)',
      authorId: 'Main Author ID (100)',
      translatedTitle: 'Translated Title (242)',
      title: 'Title (245)',
      alternativeTitle: 'Alternative Title (246)',
      year: 'Publication Year (260)',
      pages: 'Pages (300)',
      contentType: 'Content Type (336)',
      additionalAuthors: 'Additional Authors (700)',
      additionalAuthorIds: 'Additional Author IDs (700)',
      journal: 'Journal (773)',
      volume: 'Volume (773)',
      issue: 'Issue (773)',
      citation: 'Citation (995)',
      // Legacy field mappings for backward compatibility
      frameworkcode: 'Framework Code',
      notes: 'Notes',
      abstract: 'Abstract',
      serial: 'Serial',
      seriestitle: 'Series Title',
      datecreated: 'Date Created',
      timestamp: 'Last Updated',
      unititle: 'Uniform Title',
      biblioitemnumber: 'Biblioitem Number',
      volumedate: 'Volume Date',
      illus: 'Illustrations',
      size: 'Size',
      place: 'Place',
      lccn: 'LCCN',
      marc: 'MARC'
    };

    // Prepare data with proper labels (same format as Excel)
    const formattedData = citationData.map(item => {
      const row: { [key: string]: any } = {};
      
      // Always include URL and biblionumber for reference
      row[fieldLabels['url']] = item['url'] || '';
      row[fieldLabels['biblionumber']] = item['biblionumber'] || '';
      
      // Map the selected MARC fields to their corresponding data properties and labels
      selectedFields.forEach((field: string) => {
        switch (field) {
          case '001':
            if (item['controlNumber']) {
              row[fieldLabels['controlNumber']] = item['controlNumber'];
            }
            break;
          case '041':
            if (item['languageCode']) {
              row[fieldLabels['languageCode']] = item['languageCode'];
            }
            break;
          case '073':
            if (item['publisherCode']) {
              row[fieldLabels['publisherCode']] = item['publisherCode'];
            }
            break;
          case '100':
            if (item['author']) {
              row[fieldLabels['author']] = item['author'];
            }
            if (item['authorId']) {
              row[fieldLabels['authorId']] = item['authorId'];
            }
            break;
          case '242':
            if (item['translatedTitle']) {
              row[fieldLabels['translatedTitle']] = item['translatedTitle'];
            }
            break;
          case '245':
            if (item['title']) {
              row[fieldLabels['title']] = item['title'];
            }
            break;
          case '246':
            if (item['alternativeTitle']) {
              row[fieldLabels['alternativeTitle']] = item['alternativeTitle'];
            }
            break;
          case '260':
            if (item['year']) {
              row[fieldLabels['year']] = item['year'];
            }
            break;
          case '300':
            if (item['pages']) {
              row[fieldLabels['pages']] = item['pages'];
            }
            break;
          case '700':
            if (item['additionalAuthors']) {
              row[fieldLabels['additionalAuthors']] = item['additionalAuthors'];
            }
            if (item['additionalAuthorIds']) {
              row[fieldLabels['additionalAuthorIds']] = item['additionalAuthorIds'];
            }
            break;
          case '773':
            if (item['journal']) {
              row[fieldLabels['journal']] = item['journal'];
            }
            if (item['volume']) {
              row[fieldLabels['volume']] = item['volume'];
            }
            if (item['issue']) {
              row[fieldLabels['issue']] = item['issue'];
            }
            break;
          case '336':
            if (item['contentType']) {
              row[fieldLabels['contentType']] = item['contentType'];
            }
            break;
          case '995':
            if (item['citation']) {
              row[fieldLabels['citation']] = item['citation'];
            }
            break;
          case '999':
            if (item['biblionumber']) {
              row[fieldLabels['biblionumber']] = item['biblionumber'];
            }
            break;
          default:
            // For any other fields, try to match directly with label
            const label = fieldLabels[field] || field;
            if (item[field]) {
              row[label] = item[field];
            }
            break;
        }
      });
      
      return row;
    });

    // If this is a preview request, return JSON data with same format as Excel
    if (isPreview) {
      console.log(`📊 [${requestId}] Returning preview data: ${Math.min(5, citationData.length)} records`);
      
      await connection.release();
      connection = null;
      
      return NextResponse.json({
        success: true,
        data: formattedData.slice(0, 5), // Limit preview to 5 records
        count: citationData.length,
        totalRecords: citationData.length,
        requestId: requestId,
        timestamp: new Date().toISOString()
      });
    }

    // Create Excel workbook
    const workbook = xlsx.utils.book_new();
    
    // Use the same formatted data for Excel as we use for preview
    const excelData = formattedData;

    console.log('CustomCitationReport: Excel data sample:', excelData[0]);

    const worksheet = xlsx.utils.json_to_sheet(excelData);
    
    // Auto-size columns based on content - use actual column names from formatted data
    const columnNames = Object.keys(excelData[0] || {});
    const columnWidths = columnNames.map((columnName: string) => {
      const maxLength = Math.max(
        columnName.length,
        ...excelData.map(row => String(row[columnName] || '').length)
      );
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
    worksheet['!cols'] = columnWidths;

    // Add hyperlinks for biblionumber and Author ID columns
    const hasBiblioNumber = columnNames.includes('Biblio Number');
    const hasAuthorIds = columnNames.some(key => key.includes('Author ID'));
    
    if (hasBiblioNumber || hasAuthorIds) {
      const range = xlsx.utils.decode_range(worksheet['!ref'] || 'A1');
      
      for (let row = 1; row <= range.e.r; row++) { // Start from row 1 (skip header)
        const rowData = excelData[row - 1];
        
        // Add hyperlink for Biblio Number to cataloging system
        const biblioColIndex = columnNames.indexOf('Biblio Number');
        if (biblioColIndex >= 0) {
          const cellRef = xlsx.utils.encode_cell({ r: row, c: biblioColIndex });
          const cell = worksheet[cellRef];
          if (cell && cell.v) {
            const catalogingUrl = `https://citationadmin.mandumah.com/cgi-bin/koha/cataloguing/addbiblio.pl?biblionumber=${cell.v}`;
            cell.l = { Target: catalogingUrl, Tooltip: "Click to open in cataloging system" };
          }
        }

        // Add hyperlinks for Main Author ID
        const mainAuthorIdColIndex = columnNames.indexOf('Main Author ID (100)');
        if (mainAuthorIdColIndex >= 0) {
          const cellRef = xlsx.utils.encode_cell({ r: row, c: mainAuthorIdColIndex });
          const cell = worksheet[cellRef];
          if (cell && cell.v && cell.v.toString().trim()) {
            const authorUrl = `https://cataloging.mandumah.com/cgi-bin/koha/authorities/authorities.pl?authid=${cell.v}`;
            cell.l = { Target: authorUrl, Tooltip: "Click to view main author authority record" };
          }
        }

        // Add hyperlinks for Additional Author IDs (handle multiple IDs separated by '; ')
        const additionalAuthorIdColIndex = columnNames.indexOf('Additional Author IDs (700)');
        if (additionalAuthorIdColIndex >= 0) {
          const cellRef = xlsx.utils.encode_cell({ r: row, c: additionalAuthorIdColIndex });
          const cell = worksheet[cellRef];
          if (cell && cell.v && cell.v.toString().trim()) {
            const authorIds = cell.v.toString().split('; ').filter((id: string) => id.trim());
            if (authorIds.length > 0) {
              // For Excel, we'll link to the first author ID and add a tooltip with all IDs
              const firstAuthorUrl = `https://cataloging.mandumah.com/cgi-bin/koha/authorities/authorities.pl?authid=${authorIds[0]}`;
              const tooltip = authorIds.length > 1 
                ? `Click to view authority records. Additional IDs: ${authorIds.slice(1).join(', ')}`
                : "Click to view additional author authority record";
              cell.l = { Target: firstAuthorUrl, Tooltip: tooltip };
            }
          }
        }

        // Add hyperlinks for PDF URL if exists
        const pdfUrlColIndex = columnNames.indexOf('PDF URL');
        if (pdfUrlColIndex >= 0) {
          const cellRef = xlsx.utils.encode_cell({ r: row, c: pdfUrlColIndex });
          const cell = worksheet[cellRef];
          if (cell && cell.v && cell.v.toString().trim()) {
            cell.l = { Target: cell.v.toString(), Tooltip: "Click to open PDF document" };
          }
        }
      }
    }

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Custom Citation Report');

    // Generate Excel buffer
    console.log(`📊 [${requestId}] Generating Excel buffer for ${citationData.length} records...`);
    const bufferStart = Date.now();
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const bufferTime = Date.now() - bufferStart;
    
    console.log(`✅ [${requestId}] Excel buffer generated:`, {
      bufferGenerationTime: `${bufferTime}ms`,
      bufferSize: `${excelBuffer.length} bytes`,
      bufferSizeMB: `${(excelBuffer.length / 1024 / 1024).toFixed(2)} MB`,
      recordCount: citationData.length,
      timestamp: new Date().toISOString()
    });

    // Release connection before returning file
    console.log(`🔗 [${requestId}] Releasing database connection...`);
    await connection.release();
    connection = null;
    console.log(`✅ [${requestId}] Database connection released successfully`);

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="custom-citation-report-${new Date().toISOString().split('T')[0]}.xlsx"`,
        'X-Record-Count': citationData.length.toString(),
        'X-Request-ID': requestId,
      },
    });

  } catch (error) {
    console.error(`❌ [${requestId}] Error generating custom citation report:`, error);
    console.error(`❌ [${requestId}] Error details:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString(),
      requestId: requestId,
      errorType: typeof error,
      connectionActive: !!connection
    });
    
    // Ensure connection is released
    if (connection) {
      try {
        console.log(`🔗 [${requestId}] Releasing connection due to error...`);
        await connection.release();
        console.log(`✅ [${requestId}] Connection released after error`);
      } catch (releaseError) {
        console.error(`❌ [${requestId}] Error releasing connection:`, releaseError);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate custom citation report',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: requestId
      },
      { status: 500 }
    );
  }
}
