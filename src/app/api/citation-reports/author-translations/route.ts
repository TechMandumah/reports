import { NextRequest, NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import { getCitationConnection } from '@/lib/citation_db';
import { extractAllAuthors, formatMultipleValues } from '@/utils/marcParser';

// Configure API route timeout
export const maxDuration = 3000; // 50 minutes
export const dynamic = 'force-dynamic';

interface CitationAuthorData {
  biblionumber: number;
  // Main author fields (100)
  main_100_a: string;
  main_100_g: string;
  main_100_q: string;
  main_100_e: string;
  main_100_9: string;
  // Additional authors fields (700)
  add_700_1_a: string;
  add_700_1_g: string;
  add_700_1_q: string;
  add_700_1_e: string;
  add_700_1_9: string;
  add_700_2_a: string;
  add_700_2_g: string;
  add_700_2_q: string;
  add_700_2_e: string;
  add_700_2_9: string;
  add_700_3_a: string;
  add_700_3_g: string;
  add_700_3_q: string;
  add_700_3_e: string;
  add_700_3_9: string;
  add_700_4_a: string;
  add_700_4_g: string;
  add_700_4_q: string;
  add_700_4_e: string;
  add_700_4_9: string;
  add_700_5_a: string;
  add_700_5_g: string;
  add_700_5_q: string;
  add_700_5_e: string;
  add_700_5_9: string;
  title: string;
  year: string;
  journal: string;
  url: string;
  pdfUrl: string; // Full PDF URL with base path
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

// Helper function to extract author data from MARC XML using enhanced parser
function extractAuthorDataFromMarcXml(marcxml: string): {
  mainAuthor: string;
  mainAuthorId: string;
  additionalAuthors: string[];
  additionalAuthorIds: string[];
  allAuthors: string;
  title: string;
  year: string;
  journal: string;
} {
  const result = {
    mainAuthor: '',
    mainAuthorId: '',
    additionalAuthors: [] as string[],
    additionalAuthorIds: [] as string[],
    allAuthors: '',
    title: '',
    year: '',
    journal: '',
  };

  try {
    // Extract all authors using enhanced parser
    const authorData = extractAllAuthors(marcxml);
    result.mainAuthor = authorData.mainAuthor;
    result.mainAuthorId = authorData.mainAuthorId;
    result.additionalAuthors = authorData.additionalAuthors;
    result.additionalAuthorIds = authorData.additionalAuthorIds;
    result.allAuthors = formatMultipleValues(authorData.allAuthors);

    // Extract title from field 245
    const titleMatch = marcxml.match(/<datafield tag="245"[^>]*>[\s\S]*?<subfield code="a">([^<]+)<\/subfield>/);
    if (titleMatch) {
      result.title = titleMatch[1].trim();
    }

    // Extract year from field 260 or 264
    const yearMatch = marcxml.match(/<datafield tag="260"[^>]*>[\s\S]*?<subfield code="c">([^<]+)<\/subfield>/) ||
                     marcxml.match(/<datafield tag="264"[^>]*>[\s\S]*?<subfield code="c">([^<]+)<\/subfield>/);
    if (yearMatch) {
      result.year = yearMatch[1].trim();
    }

    // Extract journal from field 773
    const journalMatch = marcxml.match(/<datafield tag="773"[^>]*>[\s\S]*?<subfield code="s">([^<]+)<\/subfield>/);
    if (journalMatch) {
      result.journal = journalMatch[1].trim();
    }
  } catch (error) {
    console.error('Error parsing MARC XML for authors:', error);
  }

  return result;
}

export async function POST(request: NextRequest) {
  let connection;
  
  // Generate unique request ID for tracking
  const requestId = `author-trans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const requestStart = Date.now();
  
  try {
    console.log(`🚀 [${requestId}] CitationAuthorTranslations: Starting request processing`);
    const body = await request.json();
    console.log(`📋 [${requestId}] Full request body:`, body);
    
    // Accept both 'publisherCodes' and 'biblioNumbers' field names
    const publisherCodes = body.publisherCodes || body.biblioNumbers;
    console.log(`📋 [${requestId}] Extracted codes:`, publisherCodes);

    // Create database connection
    connection = await getCitationConnection();
    console.log(`✅ [${requestId}] Database connected`);

    // Validate and process publisher codes (biblio numbers)
    console.log(`🔍 [${requestId}] Processing publisher codes filter...`);
    console.log(`📋 [${requestId}] Received publisherCodes:`, publisherCodes);
    console.log(`📋 [${requestId}] Type:`, typeof publisherCodes, 'IsArray:', Array.isArray(publisherCodes));
    
    let numbers: string[] = [];
    
    if (!publisherCodes) {
      console.log(`⚠️ [${requestId}] publisherCodes is null or undefined`);
      return NextResponse.json({ error: 'Publisher codes (biblioNumbers) are required' }, { status: 400 });
    }
    
    if (Array.isArray(publisherCodes)) {
      numbers = publisherCodes.filter((num: any) => num && num.toString().trim()).map(num => num.toString());
    } else if (typeof publisherCodes === 'string') {
      numbers = publisherCodes.split(/[,\s\n]+/).filter((num: string) => num.trim());
    } else {
      numbers = [publisherCodes.toString()].filter((num: string) => num.trim());
    }
    
    console.log(`📊 [${requestId}] Processed numbers:`, numbers);
    
    if (numbers.length === 0) {
      console.log(`⚠️ [${requestId}] No valid publisher codes after processing`);
      return NextResponse.json({ error: 'Publisher codes are required' }, { status: 400 });
    }
    
    console.log(`✅ [${requestId}] Using ${numbers.length} publisher codes:`, numbers);
    const stringifiedNumbers = numbers.map(num => `'${num}'`).join(', ');
    
    // Build exact query like the working MySQL command
    const query = `
      SELECT 
        a.biblionumber,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="100"]/subfield[@code="a"]') AS '100_a',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="100"]/subfield[@code="g"]') AS '100_g',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="100"]/subfield[@code="q"]') AS '100_q',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="100"]/subfield[@code="e"]') AS '100_e',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="100"]/subfield[@code="9"]') AS '100_9',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][1]/subfield[@code="a"]') AS '700_1_a',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][1]/subfield[@code="g"]') AS '700_1_g',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][1]/subfield[@code="q"]') AS '700_1_q',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][1]/subfield[@code="e"]') AS '700_1_e',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][1]/subfield[@code="9"]') AS '700_1_9',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][2]/subfield[@code="a"]') AS '700_2_a',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][2]/subfield[@code="g"]') AS '700_2_g',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][2]/subfield[@code="q"]') AS '700_2_q',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][2]/subfield[@code="e"]') AS '700_2_e',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][2]/subfield[@code="9"]') AS '700_2_9',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][3]/subfield[@code="a"]') AS '700_3_a',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][3]/subfield[@code="g"]') AS '700_3_g',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][3]/subfield[@code="q"]') AS '700_3_q',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][3]/subfield[@code="e"]') AS '700_3_e',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][3]/subfield[@code="9"]') AS '700_3_9',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][4]/subfield[@code="a"]') AS '700_4_a',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][4]/subfield[@code="g"]') AS '700_4_g',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][4]/subfield[@code="q"]') AS '700_4_q',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][4]/subfield[@code="e"]') AS '700_4_e',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][4]/subfield[@code="9"]') AS '700_4_9',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][5]/subfield[@code="a"]') AS '700_5_a',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][5]/subfield[@code="g"]') AS '700_5_g',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][5]/subfield[@code="q"]') AS '700_5_q',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][5]/subfield[@code="e"]') AS '700_5_e',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][5]/subfield[@code="9"]') AS '700_5_9',
      FROM biblioitems a
      WHERE a.publishercode IN (${stringifiedNumbers})
      ORDER BY a.biblionumber
    `;

    console.log(`🚀 [${requestId}] Executing query...`);
    console.log(`📋 [${requestId}] Full query:`, query);
    const startTime = Date.now();

    // Use query() instead of execute() since we're not using parameterized queries
    const [rows] = await connection.query(query);
    const results = rows as any[];


    const queryTime = Date.now() - startTime;
    console.log(`✅ [${requestId}] Query completed:`, {
      executionTime: `${queryTime}ms`,
      rowsReturned: results.length,
      timestamp: new Date().toISOString(),
      averageTimePerRow: results.length > 0 ? `${(queryTime / results.length).toFixed(2)}ms` : 'N/A'
    });

    if (results.length === 0) {
      console.log(`⚠️ [${requestId}] No records found with current filters`);
    } else {
      console.log(`📊 [${requestId}] Sample record structure:`, {
        biblionumber: results[0].biblionumber,
        '100_a': results[0]['100_a'],
        '100_9': results[0]['100_9'], 
        '700_1_a': results[0]['700_1_a'],
        '700_1_9': results[0]['700_1_9']
      });
    }

    // Process results with better error handling
    console.log(`🔄 [${requestId}] Starting MARC XML processing for ${results.length} records...`);
    const processingStart = Date.now();
    const authorData: CitationAuthorData[] = [];
    const processingErrors: string[] = [];

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      try {
        // Use EXTRACTVALUE results directly - column names match the AS aliases in query
        authorData.push({
          biblionumber: row.biblionumber,
          // Main author fields (100)
          main_100_a: row['100_a'] || '',
          main_100_g: row['100_g'] || '',
          main_100_q: row['100_q'] || '',
          main_100_e: row['100_e'] || '',
          main_100_9: row['100_9'] || '',
          // Additional authors fields (700)
          add_700_1_a: row['700_1_a'] || '',
          add_700_1_g: row['700_1_g'] || '',
          add_700_1_q: row['700_1_q'] || '',
          add_700_1_e: row['700_1_e'] || '',
          add_700_1_9: row['700_1_9'] || '',
          add_700_2_a: row['700_2_a'] || '',
          add_700_2_g: row['700_2_g'] || '',
          add_700_2_q: row['700_2_q'] || '',
          add_700_2_e: row['700_2_e'] || '',
          add_700_2_9: row['700_2_9'] || '',
          add_700_3_a: row['700_3_a'] || '',
          add_700_3_g: row['700_3_g'] || '',
          add_700_3_q: row['700_3_q'] || '',
          add_700_3_e: row['700_3_e'] || '',
          add_700_3_9: row['700_3_9'] || '',
          add_700_4_a: row['700_4_a'] || '',
          add_700_4_g: row['700_4_g'] || '',
          add_700_4_q: row['700_4_q'] || '',
          add_700_4_e: row['700_4_e'] || '',
          add_700_4_9: row['700_4_9'] || '',
          add_700_5_a: row['700_5_a'] || '',
          add_700_5_g: row['700_5_g'] || '',
          add_700_5_q: row['700_5_q'] || '',
          add_700_5_e: row['700_5_e'] || '',
          add_700_5_9: row['700_5_9'] || '',
          title: '', // Not queried in this simple version
          year: '', // Not queried in this simple version
          journal: '', // Not queried in this simple version
          url: '',
          pdfUrl: '',
        });

        // Log progress for large datasets
        if (i > 0 && i % 100 === 0) {
          console.log(`🔄 [${requestId}] Processed ${i}/${results.length} records (${((i/results.length)*100).toFixed(1)}%)`);
        }
        
        // More frequent logging for first few and last few records
        if (i < 5 || i >= results.length - 5) {
          console.log(`📝 [${requestId}] Record ${i + 1}: biblionumber=${row.biblionumber}, main_100_a="${row['100_a'] || ''}", hasExtractedData=${!!(row['100_a'] || row['700_1_a'])}`);
        }
      } catch (error) {
        console.error(`❌ [${requestId}] Error processing record ${i + 1} (biblionumber: ${row.biblionumber}):`, error);
        console.error(`❌ [${requestId}] Problematic record data:`, {
          biblionumber: row.biblionumber,
          extracted_100_a: row['100_a'],
          extracted_100_9: row['100_9'],
          extracted_700_1_a: row['700_1_a']
        });
        processingErrors.push(`Row ${row.biblionumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Continue with basic data if processing fails
        authorData.push({
          biblionumber: row.biblionumber,
          // Main author fields (100)
          main_100_a: '',
          main_100_g: '',
          main_100_q: '',
          main_100_e: '',
          main_100_9: '',
          // Additional authors fields (700)
          add_700_1_a: '',
          add_700_1_g: '',
          add_700_1_q: '',
          add_700_1_e: '',
          add_700_1_9: '',
          add_700_2_a: '',
          add_700_2_g: '',
          add_700_2_q: '',
          add_700_2_e: '',
          add_700_2_9: '',
          add_700_3_a: '',
          add_700_3_g: '',
          add_700_3_q: '',
          add_700_3_e: '',
          add_700_3_9: '',
          add_700_4_a: '',
          add_700_4_g: '',
          add_700_4_q: '',
          add_700_4_e: '',
          add_700_4_9: '',
          add_700_5_a: '',
          add_700_5_g: '',
          add_700_5_q: '',
          add_700_5_e: '',
          add_700_5_9: '',
          title: '',
          year: '',
          journal: '',
          url: '',
          pdfUrl: '',
        });
      }
    }

    const processingTime = Date.now() - processingStart;
    console.log(`✅ [${requestId}] MARC XML processing completed:`, {
      totalTime: `${processingTime}ms`,
      recordsProcessed: authorData.length,
      processingErrors: processingErrors.length,
      averageTimePerRecord: authorData.length > 0 ? `${(processingTime / authorData.length).toFixed(2)}ms` : 'N/A',
      timestamp: new Date().toISOString()
    });

    if (processingErrors.length > 0) {
      console.warn(`⚠️ [${requestId}] Processing errors encountered:`, {
        errorCount: processingErrors.length,
        errorRate: `${((processingErrors.length / results.length) * 100).toFixed(2)}%`,
        firstFewErrors: processingErrors.slice(0, 5)
      });
    }

    console.log(`🔗 [${requestId}] Releasing database connection...`);
    await connection.release();
    connection = null;
    console.log(`✅ [${requestId}] Database connection released`);

    // Create Excel workbook
    console.log(`📊 [${requestId}] Creating Excel workbook...`);
    const excelStart = Date.now();
    const workbook = xlsx.utils.book_new();
    
    // Prepare data for Excel (without formula-based hyperlinks)
    console.log(`📝 [${requestId}] Preparing Excel data for ${authorData.length} records...`);
    const excelData = authorData.map(item => ({
      'Biblio Number': item.biblionumber,
      // Main author fields (100)
      '100_a (Main Author)': item.main_100_a,
      '100_g (Main Author Dates)': item.main_100_g,
      '100_q (Main Author Fuller Form)': item.main_100_q,
      '100_e (Main Author Relator)': item.main_100_e,
      '100_9 (Main Author ID)': item.main_100_9,
      // Additional author 1 fields (700)
      '700_1_a (Add Author 1)': item.add_700_1_a,
      '700_1_g (Add Author 1 Dates)': item.add_700_1_g,
      '700_1_q (Add Author 1 Fuller Form)': item.add_700_1_q,
      '700_1_e (Add Author 1 Relator)': item.add_700_1_e,
      '700_1_9 (Add Author 1 ID)': item.add_700_1_9,
      // Additional author 2 fields (700)
      '700_2_a (Add Author 2)': item.add_700_2_a,
      '700_2_g (Add Author 2 Dates)': item.add_700_2_g,
      '700_2_q (Add Author 2 Fuller Form)': item.add_700_2_q,
      '700_2_e (Add Author 2 Relator)': item.add_700_2_e,
      '700_2_9 (Add Author 2 ID)': item.add_700_2_9,
      // Additional author 3 fields (700)
      '700_3_a (Add Author 3)': item.add_700_3_a,
      '700_3_g (Add Author 3 Dates)': item.add_700_3_g,
      '700_3_q (Add Author 3 Fuller Form)': item.add_700_3_q,
      '700_3_e (Add Author 3 Relator)': item.add_700_3_e,
      '700_3_9 (Add Author 3 ID)': item.add_700_3_9,
      // Additional author 4 fields (700)
      '700_4_a (Add Author 4)': item.add_700_4_a,
      '700_4_g (Add Author 4 Dates)': item.add_700_4_g,
      '700_4_q (Add Author 4 Fuller Form)': item.add_700_4_q,
      '700_4_e (Add Author 4 Relator)': item.add_700_4_e,
      '700_4_9 (Add Author 4 ID)': item.add_700_4_9,
      // Additional author 5 fields (700)
      '700_5_a (Add Author 5)': item.add_700_5_a,
      '700_5_g (Add Author 5 Dates)': item.add_700_5_g,
      '700_5_q (Add Author 5 Fuller Form)': item.add_700_5_q,
      '700_5_e (Add Author 5 Relator)': item.add_700_5_e,
      '700_5_9 (Add Author 5 ID)': item.add_700_5_9,
      'PDF URL': item.pdfUrl,
    }));

    console.log(`📋 [${requestId}] Creating worksheet with ${excelData.length} rows...`);
    const worksheet = xlsx.utils.json_to_sheet(excelData);
    
    // Add hyperlinks using cell.l property (safer than formulas)
    console.log(`🔗 [${requestId}] Adding hyperlinks for ${authorData.length} records...`);
    for (let row = 1; row <= authorData.length; row++) {
      const item = authorData[row - 1];
      
      // Add hyperlink for Biblio Number to cataloging system
      const biblioNumberCellRef = xlsx.utils.encode_cell({ r: row, c: 0 });
      const biblioNumberCell = worksheet[biblioNumberCellRef];
      if (biblioNumberCell && biblioNumberCell.v) {
        const catalogingUrl = `https://citationadmin.mandumah.com/cgi-bin/koha/cataloguing/addbiblio.pl?biblionumber=${item.biblionumber}`;
        biblioNumberCell.l = { Target: catalogingUrl, Tooltip: "Click to open in cataloging system" };
      }

      // Add hyperlink for Main Author if main_100_9 exists
      const mainAuthorCellRef = xlsx.utils.encode_cell({ r: row, c: 1 }); // 100_a column
      const mainAuthorCell = worksheet[mainAuthorCellRef];
      if (mainAuthorCell && mainAuthorCell.v && item.main_100_9 && item.main_100_9.trim()) {
        const authorUrl = `https://cataloging.mandumah.com/cgi-bin/koha/authorities/authorities.pl?authid=${item.main_100_9}`;
        mainAuthorCell.l = { Target: authorUrl, Tooltip: "Click to view author authority record" };
      }

      // Add hyperlink for Main Author ID if exists
      const mainAuthorIdCellRef = xlsx.utils.encode_cell({ r: row, c: 5 }); // 100_9 column
      const mainAuthorIdCell = worksheet[mainAuthorIdCellRef];
      if (mainAuthorIdCell && mainAuthorIdCell.v && item.main_100_9 && item.main_100_9.trim()) {
        const authorUrl = `https://cataloging.mandumah.com/cgi-bin/koha/authorities/authorities.pl?authid=${item.main_100_9}`;
        mainAuthorIdCell.l = { Target: authorUrl, Tooltip: "Click to view author authority record" };
      }

      // Add hyperlinks for additional author IDs (700_1_9, 700_2_9, etc.)
      const additionalAuthorIdColumns = [10, 15, 20, 25, 30]; // Columns for 700_1_9, 700_2_9, 700_3_9, 700_4_9, 700_5_9
      const additionalAuthorIds = [item.add_700_1_9, item.add_700_2_9, item.add_700_3_9, item.add_700_4_9, item.add_700_5_9];
      
      additionalAuthorIdColumns.forEach((colIndex, index) => {
        const authorId = additionalAuthorIds[index];
        if (authorId && authorId.trim()) {
          const cellRef = xlsx.utils.encode_cell({ r: row, c: colIndex });
          const cell = worksheet[cellRef];
          if (cell && cell.v) {
            const authorUrl = `https://cataloging.mandumah.com/cgi-bin/koha/authorities/authorities.pl?authid=${authorId}`;
            cell.l = { Target: authorUrl, Tooltip: "Click to view author authority record" };
          }
        }
      });

      // Add hyperlink for PDF URL if exists (last column)
      const pdfUrlCellRef = xlsx.utils.encode_cell({ r: row, c: 31 }); // PDF URL column
      const pdfUrlCell = worksheet[pdfUrlCellRef];
      if (pdfUrlCell && pdfUrlCell.v && item.pdfUrl && item.pdfUrl.trim()) {
        pdfUrlCell.l = { Target: item.pdfUrl, Tooltip: "Click to open PDF document" };
      }

      // Log progress for hyperlinks
      if (row % 1000 === 0 || row <= 5 || row > authorData.length - 5) {
        console.log(`🔗 [${requestId}] Added hyperlinks for row ${row}/${authorData.length}`);
      }
    }
    
    // Auto-size columns
    console.log(`📏 [${requestId}] Setting column widths...`);
    const columnWidths = [
      { wch: 15 }, // Biblio Number
      // Main author fields (100)
      { wch: 30 }, // 100_a (Main Author)
      { wch: 20 }, // 100_g (Main Author Dates)
      { wch: 25 }, // 100_q (Main Author Fuller Form)
      { wch: 20 }, // 100_e (Main Author Relator)
      { wch: 15 }, // 100_9 (Main Author ID)
      // Additional author 1 fields (700)
      { wch: 30 }, // 700_1_a (Add Author 1)
      { wch: 20 }, // 700_1_g (Add Author 1 Dates)
      { wch: 25 }, // 700_1_q (Add Author 1 Fuller Form)
      { wch: 20 }, // 700_1_e (Add Author 1 Relator)
      { wch: 15 }, // 700_1_9 (Add Author 1 ID)
      // Additional author 2 fields (700)
      { wch: 30 }, // 700_2_a (Add Author 2)
      { wch: 20 }, // 700_2_g (Add Author 2 Dates)
      { wch: 25 }, // 700_2_q (Add Author 2 Fuller Form)
      { wch: 20 }, // 700_2_e (Add Author 2 Relator)
      { wch: 15 }, // 700_2_9 (Add Author 2 ID)
      // Additional author 3 fields (700)
      { wch: 30 }, // 700_3_a (Add Author 3)
      { wch: 20 }, // 700_3_g (Add Author 3 Dates)
      { wch: 25 }, // 700_3_q (Add Author 3 Fuller Form)
      { wch: 20 }, // 700_3_e (Add Author 3 Relator)
      { wch: 15 }, // 700_3_9 (Add Author 3 ID)
      // Additional author 4 fields (700)
      { wch: 30 }, // 700_4_a (Add Author 4)
      { wch: 20 }, // 700_4_g (Add Author 4 Dates)
      { wch: 25 }, // 700_4_q (Add Author 4 Fuller Form)
      { wch: 20 }, // 700_4_e (Add Author 4 Relator)
      { wch: 15 }, // 700_4_9 (Add Author 4 ID)
      // Additional author 5 fields (700)
      { wch: 30 }, // 700_5_a (Add Author 5)
      { wch: 20 }, // 700_5_g (Add Author 5 Dates)
      { wch: 25 }, // 700_5_q (Add Author 5 Fuller Form)
      { wch: 20 }, // 700_5_e (Add Author 5 Relator)
      { wch: 15 }, // 700_5_9 (Add Author 5 ID)
      { wch: 60 }, // PDF URL
    ];
    worksheet['!cols'] = columnWidths;

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Citation Author Translations');

    // Generate Excel buffer
    console.log(`💾 [${requestId}] Generating Excel buffer...`);
    const bufferStart = Date.now();
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const bufferTime = Date.now() - bufferStart;
    const excelTime = Date.now() - excelStart;

    console.log(`✅ [${requestId}] Excel generation completed:`, {
      excelCreationTime: `${excelTime}ms`,
      bufferGenerationTime: `${bufferTime}ms`,
      bufferSize: `${excelBuffer.length} bytes`,
      bufferSizeMB: `${(excelBuffer.length / 1024 / 1024).toFixed(2)} MB`,
      recordCount: authorData.length,
      timestamp: new Date().toISOString()
    });

    const totalProcessingTime = Date.now() - processingStart;
    console.log(`🎉 [${requestId}] Report generation completed successfully:`, {
      totalProcessingTime: `${totalProcessingTime}ms`,
      queryTime: `${queryTime}ms`,
      marcProcessingTime: `${processingTime}ms`,
      excelGenerationTime: `${excelTime}ms`,
      recordsProcessed: authorData.length,
      processingErrors: processingErrors.length,
      finalFileSize: `${(excelBuffer.length / 1024 / 1024).toFixed(2)} MB`
    });

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="citation-author-translations-${new Date().toISOString().split('T')[0]}.xlsx"`,
        'X-Record-Count': authorData.length.toString(),
        'X-Processing-Errors': processingErrors.length.toString(),
        'X-Processing-Time': totalProcessingTime.toString(),
        'X-Request-ID': requestId,
      },
    });

  } catch (error) {
    console.error(`❌ [${requestId}] Error generating citation author translations report:`, error);
    console.error(`❌ [${requestId}] Error details:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString(),
      requestId: requestId
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
        error: 'Failed to generate citation author translations report',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: requestId
      },
      { status: 500 }
    );
  }
}
