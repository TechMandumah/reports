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
    
    const body = await request.json();
    console.log(`📋 [${requestId}] Full request body:`, body);
    
    // Accept both 'publisherCodes' and 'biblioNumbers' field names
    const publisherCodes = body.publisherCodes || body.biblioNumbers;
    const { startYear, endYear, selectedFields, isPreview } = body;
    
    console.log(`📋 [${requestId}] CustomCitationReport: Request params:`, { 
      publisherCodes, 
      startYear, 
      endYear, 
      selectedFields, 
      isPreview
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
        a.biblionumber,
        a.url,
        a.publishercode,
        -- Extract MARC fields using EXTRACTVALUE for better performance
        EXTRACTVALUE(a.marcxml, '//controlfield[@tag="001"]') AS marc_001,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="041"]/subfield[@code="a"]') AS marc_041_a,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="073"]/subfield[@code="a"]') AS marc_073_a,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="100"]/subfield[@code="a"]') AS marc_100_a,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="100"]/subfield[@code="9"]') AS marc_100_9,
        -- Extract 110 subfields (a,q)
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="110"]/subfield[@code="a"]') AS marc_110_a,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="110"]/subfield[@code="q"]') AS marc_110_q,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="242"]/subfield[@code="a"]') AS marc_242_a,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="245"]/subfield[@code="a"]') AS marc_245_a,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="246"]/subfield[@code="a"]') AS marc_246_a,
        -- Extract 250 subfield (a)
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="250"]/subfield[@code="a"]') AS marc_250_a,
        -- Extract all 260 subfields (a,b,c,m,g)
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="260"]/subfield[@code="a"]') AS marc_260_a,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="260"]/subfield[@code="b"]') AS marc_260_b,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="260"]/subfield[@code="c"]') AS marc_260_c,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="260"]/subfield[@code="m"]') AS marc_260_m,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="260"]/subfield[@code="g"]') AS marc_260_g,
        -- Extract all 300 subfields (a,b)
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="300"]/subfield[@code="a"]') AS marc_300_a,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="300"]/subfield[@code="b"]') AS marc_300_b,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="336"]/subfield[@code="a"]') AS marc_336_a,
        -- Extract 502 subfields (c,b,f)
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="502"]/subfield[@code="c"]') AS marc_502_c,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="502"]/subfield[@code="b"]') AS marc_502_b,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="502"]/subfield[@code="f"]') AS marc_502_f,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][1]/subfield[@code="a"]') AS marc_700_1_a,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][1]/subfield[@code="9"]') AS marc_700_1_9,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][2]/subfield[@code="a"]') AS marc_700_2_a,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][2]/subfield[@code="9"]') AS marc_700_2_9,
        -- Extract all 773 subfields (b,d,e,f,i,s,u,v,w)
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="773"]/subfield[@code="b"]') AS marc_773_b,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="773"]/subfield[@code="d"]') AS marc_773_d,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="773"]/subfield[@code="e"]') AS marc_773_e,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="773"]/subfield[@code="f"]') AS marc_773_f,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="773"]/subfield[@code="i"]') AS marc_773_i,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="773"]/subfield[@code="s"]') AS marc_773_s,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="773"]/subfield[@code="t"]') AS marc_773_t,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="773"]/subfield[@code="u"]') AS marc_773_u,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="773"]/subfield[@code="v"]') AS marc_773_v,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="773"]/subfield[@code="w"]') AS marc_773_w,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="773"]/subfield[@code="g"]') AS marc_773_g,
        -- Extract 856 subfield (a)
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="856"]/subfield[@code="a"]') AS marc_856_a,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="995"]/subfield[@code="a"]') AS marc_995_a,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="999"]/subfield[@code="c"]') AS marc_999_c
      FROM biblioitems a
      WHERE a.marcxml IS NOT NULL
        AND a.marcxml != ''
    `;

    console.log(`📝 [${requestId}] CustomCitationReport: Generated base SQL query`);

    const queryParams: any[] = [];

    // Add publisher code filter
    if (publisherCodes && publisherCodes.length > 0) {
      console.log(`🔍 [${requestId}] Processing publisher codes filter...`);
      let numbers: string[] = [];
      
      // Handle different types of publisherCodes input
      if (Array.isArray(publisherCodes)) {
        numbers = publisherCodes.filter((num: any) => num && num.toString().trim()).map(num => num.toString());
      } else if (typeof publisherCodes === 'string') {
        numbers = publisherCodes.split(/[,\s\n]+/).filter((num: string) => num.trim());
      } else {
        numbers = [publisherCodes.toString()].filter((num: string) => num.trim());
      }
      
      if (numbers.length > 0) {
        console.log(`📊 [${requestId}] Using publisher codes:`, numbers);
        const placeholders = numbers.map(() => '?').join(', ');
        //I want to convert the list of numbers above [1232,323434,] to list of strings '1232','323434'
        const stringifiedNumbers = numbers.map(num => `'${num}'`).join(', ');
        query += ` AND a.publishercode IN (${stringifiedNumbers})`;
        queryParams.push(...numbers);
      }
    }

    // Add year range filter (optional)
    if (startYear && endYear) {
      console.log(`📅 [${requestId}] Adding year range filter: ${startYear} - ${endYear}`);
      query += ' AND EXTRACTVALUE(a.marcxml, \'//datafield[@tag="260"]/subfield[@code="c"]\') BETWEEN ? AND ?';
      queryParams.push(startYear, endYear);
    } else if (startYear) {
      console.log(`📅 [${requestId}] Adding start year filter: >= ${startYear}`);
      query += ' AND EXTRACTVALUE(a.marcxml, \'//datafield[@tag="260"]/subfield[@code="c"]\') >= ?';
      queryParams.push(startYear);
    } else if (endYear) {
      console.log(`📅 [${requestId}] Adding end year filter: <= ${endYear}`);
      query += ' AND EXTRACTVALUE(a.marcxml, \'//datafield[@tag="260"]/subfield[@code="c"]\') <= ?';
      queryParams.push(endYear);
    }

    query += ' ORDER BY a.biblionumber';

    console.log(`🔍 [${requestId}] Final query parameters:`, queryParams);
    const queryStart = Date.now();

    const [rows] = await connection.execute(query, queryParams);
    const results = rows as any[];
    
    const queryTime = Date.now() - queryStart;
    console.log(`✅ [${requestId}] Query completed:`, {
      executionTime: `${queryTime}ms`,
      rowsReturned: results.length
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
        // 110 subfields (a,q)
        corporate_author: row.marc_110_a || '',      // 110$a - Corporate name
        corporate_author_fuller: row.marc_110_q || '', // 110$q - Fuller form of name
        title: row.marc_245_a || '',
        translatedTitle: row.marc_242_a || '',
        alternativeTitle: row.marc_246_a || '',
        // 250 subfield (a)
        edition_statement: row.marc_250_a || '',     // 250$a - Edition statement
        // 260 subfields (a,b,c,m,g)
        publication_place: row.marc_260_a || '',    // 260$a - Place of publication
        publisher: row.marc_260_b || '',            // 260$b - Publisher name
        year: row.marc_260_c || '',                 // 260$c - Publication date
        manufacture_place: row.marc_260_m || '',    // 260$m - Place of manufacture
        manufacture_date: row.marc_260_g || '',     // 260$g - Date of manufacture
        // 300 subfields (a,b)
        pages: row.marc_300_a || '',                // 300$a - Extent (pages)
        physical_details: row.marc_300_b || '',     // 300$b - Other physical details
        // 502 subfields (c,b,f)
        dissertation_degree: row.marc_502_c || '',  // 502$c - Degree type
        dissertation_granting: row.marc_502_b || '', // 502$b - Degree granting institution
        dissertation_year: row.marc_502_f || '',    // 502$f - Year degree granted
        // 773 subfields (b,d,e,f,i,s,u,v,w)
        edition: row.marc_773_b || '',              // 773$b - Edition
        place_date: row.marc_773_d || '',           // 773$d - Place, publisher, and date
        enumeration: row.marc_773_e || '',          // 773$e - Enumeration and first page
        country_code: row.marc_773_f || '',         // 773$f - Country code
        relationship: row.marc_773_i || '',         // 773$i - Relationship information
        uniform_title: row.marc_773_s || '',        // 773$s - Uniform title
        journal: row.marc_773_t || '',              // 773$t - Title
        standard_number: row.marc_773_u || '',      // 773$u - Standard Technical Report Number
        volume_number: row.marc_773_v || '',        // 773$v - Volume number
        record_control: row.marc_773_w || '',       // 773$w - Record control number
        // 856 subfield (a)
        host_name: row.marc_856_a || '',            // 856$a - Host name
        volume: '',
        issue: '',
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
        // 110 subfields
        corporate_author: marcData.corporate_author || '',
        corporate_author_fuller: marcData.corporate_author_fuller || '',
        title: marcData.title || row.biblio_title || '',
        translatedTitle: marcData.translatedTitle || '',
        alternativeTitle: marcData.alternativeTitle || '',
        // 250 subfield
        edition_statement: marcData.edition_statement || '',
        year: marcData.year || row.copyrightdate?.toString() || '',
        // 260 subfields
        publication_place: marcData.publication_place || '',
        publisher: marcData.publisher || '',
        manufacture_place: marcData.manufacture_place || '',
        manufacture_date: marcData.manufacture_date || '',
        // 300 subfields
        pages: marcData.pages || row.pages || '',
        physical_details: marcData.physical_details || '',
        // 502 subfields
        dissertation_degree: marcData.dissertation_degree || '',
        dissertation_granting: marcData.dissertation_granting || '',
        dissertation_year: marcData.dissertation_year || '',
        // 773 subfields
        journal: marcData.journal || '',
        edition: marcData.edition || '',
        place_date: marcData.place_date || '',
        enumeration: marcData.enumeration || '',
        country_code: marcData.country_code || '',
        relationship: marcData.relationship || '',
        uniform_title: marcData.uniform_title || '',
        standard_number: marcData.standard_number || '',
        volume_number: marcData.volume_number || '',
        record_control: marcData.record_control || '',
        // 856 subfield
        host_name: marcData.host_name || '',
        volume: marcData.volume || row.volume || '',
        issue: marcData.issue || '',
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
          case '110':
            filteredData['corporate_author'] = completeData.corporate_author || '';
            filteredData['corporate_author_fuller'] = completeData.corporate_author_fuller || '';
            console.log(`CustomCitationReport: Field 110 mapped to corporate_author: ${filteredData['corporate_author']}, corporate_author_fuller: ${filteredData['corporate_author_fuller']}`);
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
          case '250':
            filteredData['edition_statement'] = completeData.edition_statement || '';
            console.log(`CustomCitationReport: Field 250 mapped to edition_statement: ${filteredData['edition_statement']}`);
            break;
          case '260':
            filteredData['publication_place'] = completeData.publication_place || '';
            filteredData['publisher'] = completeData.publisher || '';
            filteredData['year'] = completeData.year || '';
            filteredData['manufacture_place'] = completeData.manufacture_place || '';
            filteredData['manufacture_date'] = completeData.manufacture_date || '';
            console.log(`CustomCitationReport: Field 260 mapped to publication_place: ${filteredData['publication_place']}, publisher: ${filteredData['publisher']}, year: ${filteredData['year']}, manufacture_place: ${filteredData['manufacture_place']}, manufacture_date: ${filteredData['manufacture_date']}`);
            break;
          case '300':
            filteredData['pages'] = completeData.pages || '';
            filteredData['physical_details'] = completeData.physical_details || '';
            console.log(`CustomCitationReport: Field 300 mapped to pages: ${filteredData['pages']}, physical_details: ${filteredData['physical_details']}`);
            break;
          case '336':
            filteredData['contentType'] = completeData.contentType || '';
            console.log(`CustomCitationReport: Field 336 mapped to contentType: ${filteredData['contentType']}`);
            break;
          case '502':
            filteredData['dissertation_degree'] = completeData.dissertation_degree || '';
            filteredData['dissertation_granting'] = completeData.dissertation_granting || '';
            filteredData['dissertation_year'] = completeData.dissertation_year || '';
            console.log(`CustomCitationReport: Field 502 mapped to dissertation_degree: ${filteredData['dissertation_degree']}, dissertation_granting: ${filteredData['dissertation_granting']}, dissertation_year: ${filteredData['dissertation_year']}`);
            break;
          case '700':
            filteredData['additionalAuthors'] = completeData.additionalAuthors || '';
            filteredData['additionalAuthorIds'] = completeData.additionalAuthorIds || '';
            console.log(`CustomCitationReport: Field 700 mapped to additionalAuthors: ${filteredData['additionalAuthors']}, additionalAuthorIds: ${filteredData['additionalAuthorIds']}`);
            break;
          case '773':
            filteredData['edition'] = completeData.edition || '';
            filteredData['place_date'] = completeData.place_date || '';
            filteredData['enumeration'] = completeData.enumeration || '';
            filteredData['country_code'] = completeData.country_code || '';
            filteredData['relationship'] = completeData.relationship || '';
            filteredData['uniform_title'] = completeData.uniform_title || '';
            filteredData['journal'] = completeData.journal || '';
            filteredData['standard_number'] = completeData.standard_number || '';
            filteredData['volume_number'] = completeData.volume_number || '';
            filteredData['record_control'] = completeData.record_control || '';
            filteredData['volume'] = completeData.volume || '';
            filteredData['issue'] = completeData.issue || '';
            console.log(`CustomCitationReport: Field 773 mapped to all subfields including journal: ${filteredData['journal']}, volume_number: ${filteredData['volume_number']}, edition: ${filteredData['edition']}`);
            break;
          case '856':
            filteredData['host_name'] = completeData.host_name || '';
            console.log(`CustomCitationReport: Field 856 mapped to host_name: ${filteredData['host_name']}`);
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
      // 110 subfields
      corporate_author: 'Corporate Author (110a)',
      corporate_author_fuller: 'Corporate Author Fuller (110q)',
      translatedTitle: 'Translated Title (242)',
      title: 'Title (245)',
      alternativeTitle: 'Alternative Title (246)',
      // 250 subfield
      edition_statement: 'Edition Statement (250a)',
      // 260 subfields
      publication_place: 'Publication Place (260a)',
      publisher: 'Publisher (260b)',
      year: 'Publication Year (260c)',
      manufacture_place: 'Manufacture Place (260m)',
      manufacture_date: 'Manufacture Date (260g)',
      // 300 subfields
      pages: 'Pages (300a)',
      physical_details: 'Physical Details (300b)',
      contentType: 'Content Type (336)',
      // 502 subfields
      dissertation_degree: 'Dissertation Degree (502c)',
      dissertation_granting: 'Dissertation Institution (502b)',
      dissertation_year: 'Dissertation Year (502f)',
      additionalAuthors: 'Additional Authors (700)',
      additionalAuthorIds: 'Additional Author IDs (700)',
      // 773 subfields
      edition: 'Edition (773b)',
      place_date: 'Place/Date (773d)',
      enumeration: 'Enumeration (773e)',
      country_code: 'Country Code (773f)',
      relationship: 'Relationship (773i)',
      uniform_title: 'Uniform Title (773s)',
      journal: 'Journal (773t)',
      standard_number: 'Standard Number (773u)',
      volume_number: 'Volume Number (773v)',
      record_control: 'Record Control (773w)',
      volume: 'Volume (773)',
      issue: 'Issue (773)',
      // 856 subfield
      host_name: 'Host Name (856a)',
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
          case '110':
            if (item['corporate_author']) {
              row[fieldLabels['corporate_author']] = item['corporate_author'];
            }
            if (item['corporate_author_fuller']) {
              row[fieldLabels['corporate_author_fuller']] = item['corporate_author_fuller'];
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
          case '250':
            if (item['edition_statement']) {
              row[fieldLabels['edition_statement']] = item['edition_statement'];
            }
            break;
          case '260':
            if (item['publication_place']) {
              row[fieldLabels['publication_place']] = item['publication_place'];
            }
            if (item['publisher']) {
              row[fieldLabels['publisher']] = item['publisher'];
            }
            if (item['year']) {
              row[fieldLabels['year']] = item['year'];
            }
            if (item['manufacture_place']) {
              row[fieldLabels['manufacture_place']] = item['manufacture_place'];
            }
            if (item['manufacture_date']) {
              row[fieldLabels['manufacture_date']] = item['manufacture_date'];
            }
            break;
          case '300':
            if (item['pages']) {
              row[fieldLabels['pages']] = item['pages'];
            }
            if (item['physical_details']) {
              row[fieldLabels['physical_details']] = item['physical_details'];
            }
            break;
          case '502':
            if (item['dissertation_degree']) {
              row[fieldLabels['dissertation_degree']] = item['dissertation_degree'];
            }
            if (item['dissertation_granting']) {
              row[fieldLabels['dissertation_granting']] = item['dissertation_granting'];
            }
            if (item['dissertation_year']) {
              row[fieldLabels['dissertation_year']] = item['dissertation_year'];
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
            if (item['edition']) {
              row[fieldLabels['edition']] = item['edition'];
            }
            if (item['place_date']) {
              row[fieldLabels['place_date']] = item['place_date'];
            }
            if (item['enumeration']) {
              row[fieldLabels['enumeration']] = item['enumeration'];
            }
            if (item['country_code']) {
              row[fieldLabels['country_code']] = item['country_code'];
            }
            if (item['relationship']) {
              row[fieldLabels['relationship']] = item['relationship'];
            }
            if (item['uniform_title']) {
              row[fieldLabels['uniform_title']] = item['uniform_title'];
            }
            if (item['journal']) {
              row[fieldLabels['journal']] = item['journal'];
            }
            if (item['standard_number']) {
              row[fieldLabels['standard_number']] = item['standard_number'];
            }
            if (item['volume_number']) {
              row[fieldLabels['volume_number']] = item['volume_number'];
            }
            if (item['record_control']) {
              row[fieldLabels['record_control']] = item['record_control'];
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
          case '856':
            if (item['host_name']) {
              row[fieldLabels['host_name']] = item['host_name'];
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
