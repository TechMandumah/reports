import { NextRequest, NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import { getCitationConnection } from '@/lib/citation_db';
import { extractAllAuthors, formatMultipleValues } from '@/utils/marcParser';

// Configure API route timeout
export const maxDuration = 3000; // 50 minutes
export const dynamic = 'force-dynamic';

interface CitationAuthorData {
  biblionumber: number;
  mainAuthor: string;
  mainAuthorId: string;
  additionalAuthors: string[];
  additionalAuthorIds: string[];
  allAuthors: string;
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
    const { publisherCodes } = await request.json();
    console.log(`📋 [${requestId}] Request params:`, { publisherCodes });

    // Create database connection
    connection = await getCitationConnection();
    console.log(`✅ [${requestId}] Database connected`);

    let query = `
      SELECT 
        a.biblionumber,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="100"]/subfield[@code="a"]') AS '100_a',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="100"]/subfield[@code="9"]') AS '100_9',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][1]/subfield[@code="a"]') AS '700_1_a',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][1]/subfield[@code="9"]') AS '700_1_9',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][2]/subfield[@code="a"]') AS '700_2_a',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][2]/subfield[@code="9"]') AS '700_2_9',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][3]/subfield[@code="a"]') AS '700_3_a',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][3]/subfield[@code="9"]') AS '700_3_9'
      FROM biblioitems a
      WHERE a.marcxml IS NOT NULL
        AND a.marcxml != ''
    `;

    const queryParams: any[] = [];

    // Add publisher code filter
    if (publisherCodes && publisherCodes.length > 0) {
      console.log(`🔍 [${requestId}] Processing publisher codes filter...`);
      let numbers: string[] = [];
      
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
        query += ` AND a.publishercode IN (${placeholders})`;
        queryParams.push(...numbers);
      }
    }

    query += ' ORDER BY a.biblionumber';

    console.log(`� [${requestId}] Executing query...`);
    const startTime = Date.now();

    const [rows] = await connection.execute(query, queryParams);
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
        hasAuthor: !!results[0].biblio_author,
        hasTitle: !!results[0].biblio_title,
        hasMarcxml: !!results[0].marcxml,
        marcxmlLength: results[0].marcxml?.length || 0,
        hasUrl: !!results[0].url
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
        // Use pre-extracted MARC data from EXTRACTVALUE - much faster than client-side parsing
        const additionalAuthors = [row.marc_700_1_a, row.marc_700_2_a, row.marc_700_3_a].filter(a => a);
        const additionalAuthorIds = [row.marc_700_1_9, row.marc_700_2_9, row.marc_700_3_9].filter(a => a);
        const mainAuthor = row.marc_100_a || row.biblio_author || '';
        const allAuthors = [mainAuthor, ...additionalAuthors].filter(a => a).join('; ');

        authorData.push({
          biblionumber: row.biblionumber,
          mainAuthor: mainAuthor,
          mainAuthorId: row.marc_100_9 || '',
          additionalAuthors: additionalAuthors,
          additionalAuthorIds: additionalAuthorIds,
          allAuthors: allAuthors,
          title: row.marc_245_a || row.biblio_title || '',
          year: row.marc_260_c || row.copyrightdate?.toString() || '',
          journal: row.marc_773_t || '',
          url: row.url || '',
          pdfUrl: constructPdfUrl(row.url || ''),
        });

        // Log progress for large datasets
        if (i > 0 && i % 100 === 0) {
          console.log(`🔄 [${requestId}] Processed ${i}/${results.length} records (${((i/results.length)*100).toFixed(1)}%)`);
        }
        
        // More frequent logging for first few and last few records
        if (i < 5 || i >= results.length - 5) {
          console.log(`📝 [${requestId}] Record ${i + 1}: biblionumber=${row.biblionumber}, mainAuthor="${mainAuthor}", hasExtractedData=${!!(row.marc_100_a || row.marc_245_a)}`);
        }
      } catch (error) {
        console.error(`❌ [${requestId}] Error processing record ${i + 1} (biblionumber: ${row.biblionumber}):`, error);
        console.error(`❌ [${requestId}] Problematic record data:`, {
          biblionumber: row.biblionumber,
          hasMArcxml: !!row.marcxml,
          marcxmlLength: row.marcxml?.length || 0,
          marcxmlPreview: row.marcxml?.substring(0, 100) || 'No MARC XML'
        });
        processingErrors.push(`Row ${row.biblionumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Continue with basic data if MARC parsing fails
        authorData.push({
          biblionumber: row.biblionumber,
          mainAuthor: row.biblio_author || '',
          mainAuthorId: '',
          additionalAuthors: [],
          additionalAuthorIds: [],
          allAuthors: row.biblio_author || '',
          title: row.biblio_title || '',
          year: row.copyrightdate?.toString() || '',
          journal: '',
          url: row.url || '',
          pdfUrl: constructPdfUrl(row.url || ''),
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
      'Main Author (100a)': item.mainAuthor,
      'Main Author ID': item.mainAuthorId,
      'Additional Authors (700a)': formatMultipleValues(item.additionalAuthors),
      'Additional Author IDs': formatMultipleValues(item.additionalAuthorIds),
      // 'All Authors': item.allAuthors,
      // 'Title': item.title,
      // 'Year': item.year,
      // 'Journal': item.journal,
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

      // Add hyperlink for Main Author if mainAuthorId exists
      const mainAuthorCellRef = xlsx.utils.encode_cell({ r: row, c: 1 });
      const mainAuthorCell = worksheet[mainAuthorCellRef];
      if (mainAuthorCell && mainAuthorCell.v && item.mainAuthorId && item.mainAuthorId.trim()) {
        const authorUrl = `https://cataloging.mandumah.com/cgi-bin/koha/authorities/authorities.pl?authid=${item.mainAuthorId}`;
        mainAuthorCell.l = { Target: authorUrl, Tooltip: "Click to view author authority record" };
      }

      // Add hyperlink for Main Author ID if exists
      const mainAuthorIdCellRef = xlsx.utils.encode_cell({ r: row, c: 2 });
      const mainAuthorIdCell = worksheet[mainAuthorIdCellRef];
      if (mainAuthorIdCell && mainAuthorIdCell.v && item.mainAuthorId && item.mainAuthorId.trim()) {
        const authorUrl = `https://cataloging.mandumah.com/cgi-bin/koha/authorities/authorities.pl?authid=${item.mainAuthorId}`;
        mainAuthorIdCell.l = { Target: authorUrl, Tooltip: "Click to view author authority record" };
      }

      // Add hyperlink for PDF URL if exists
      const pdfUrlCellRef = xlsx.utils.encode_cell({ r: row, c: 5 });
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
      { wch: 30 }, // Main Author
      { wch: 15 }, // Main Author ID
      { wch: 40 }, // Additional Authors
      { wch: 40 }, // Additional Author IDs
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
