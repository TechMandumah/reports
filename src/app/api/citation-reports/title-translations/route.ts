import { NextRequest, NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import { getCitationConnection } from '@/lib/citation_db';
import { extractAllTitles, formatMultipleValues } from '@/utils/marcParser';

// Configure API route timeout
export const maxDuration = 3000; // 50 minutes
export const dynamic = 'force-dynamic';

interface CitationTitleData {
  biblionumber: number;
  url: string;
  pdfUrl: string; // Full PDF URL with base path
  titles_245: string[];
  titles_242: string[];
  titles_246: string[];
  allTitles: string;
  author: string;
  authorId?: string;
  year: string;
  journal: string;
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

// Helper function to extract title data from MARC XML using enhanced parser
function extractTitleDataFromMarcXml(marcxml: string): {
  titles_245: string[];
  titles_242: string[];
  titles_246: string[];
  allTitles: string;
  author: string;
  year: string;
  journal: string;
  authorId?: string;
} {
  const result = {
    titles_245: [] as string[],
    titles_242: [] as string[],
    titles_246: [] as string[],
    allTitles: '',
    author: '',
    year: '',
    journal: '',
    authorId: undefined as string | undefined,
  };

  try {
    // Extract all titles using enhanced parser
    const titleData = extractAllTitles(marcxml);
    result.titles_245 = titleData.titles_245;
    result.titles_242 = titleData.titles_242;
    result.titles_246 = titleData.titles_246;
    result.allTitles = formatMultipleValues(titleData.allTitles);

    // Extract author from field 100
    const authorMatch = marcxml.match(/<datafield tag="100"[^>]*>[\s\S]*?<subfield code="a">([^<]+)<\/subfield>/);
    if (authorMatch) {
      result.author = authorMatch[1].trim();
    }

    // Extract main author ID from field 100 subfield 9
    const authorIdMatch = marcxml.match(/<datafield tag="100"[^>]*>[\s\S]*?<subfield code="9">([^<]+)<\/subfield>/);
    if (authorIdMatch) {
      result.authorId = authorIdMatch[1].trim();
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
    console.error('Error parsing MARC XML for titles:', error);
  }

  return result;
}

export async function POST(request: NextRequest) {
  let connection;
  
  // Generate unique request ID for tracking
  const requestId = `title-trans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const requestStart = Date.now();
  
  try {
    console.log(`🚀 [${requestId}] CitationTitleTranslations: Starting request processing`);
    const { publisherCodes } = await request.json();
    console.log(`📋 [${requestId}] Request params:`, { publisherCodes });

    // Create database connection
    connection = await getCitationConnection();
    console.log(`✅ [${requestId}] Database connected`);

    let query = `
      SELECT 
        a.biblionumber,
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="245"]/subfield[@code="a"]') AS '245',
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="242"]/subfield[@code="a"]') AS '242'
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

    console.log(`🚀 [${requestId}] Executing query...`);
    console.log(`📋 [${requestId}] CitationTitleTranslations: Query params:`, queryParams);
    const startTime = Date.now();

    const [rows] = await connection.execute(query, queryParams);
    const results = rows as any[];

    const queryTime = Date.now() - startTime;
    console.log(`✅ [${requestId}] CitationTitleTranslations: Query completed in ${queryTime}ms, ${results.length} rows returned`);
    
    // Log sample results for debugging
    if (results.length > 0) {
      console.log(`📄 [${requestId}] CitationTitleTranslations: Sample result URLs:`, 
        results.slice(0, 3).map(row => ({ biblionumber: row.biblionumber, url: row.url })));
    } else {
      console.log(`❌ [${requestId}] CitationTitleTranslations: No results returned - potential filtering issue`);
    }

    // Process results with better error handling
    const titleData: CitationTitleData[] = [];
    const processingErrors: string[] = [];

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      try {
        // Use pre-extracted MARC data from EXTRACTVALUE - much faster than client-side parsing
        const titles_245 = row.marc_245_a ? [row.marc_245_a] : [];
        const titles_242 = row.marc_242_a ? [row.marc_242_a] : [];
        const titles_246 = row.marc_246_a ? [row.marc_246_a] : [];
        const allTitles = [...titles_245, ...titles_242, ...titles_246].filter(t => t).join(' | ') || row.biblio_title || '';

        titleData.push({
          biblionumber: row.biblionumber,
          titles_245: titles_245,
          titles_242: titles_242,
          titles_246: titles_246,
          allTitles: allTitles,
          author: row.marc_100_a || row.biblio_author || '',
          year: row.marc_260_c || row.copyrightdate?.toString() || '',
          journal: row.marc_773_t || '',
          url: row.url || '',
          pdfUrl: constructPdfUrl(row.url || ''),
          authorId: row.marc_100_9,
        });

        // Log progress for large datasets
        if (i > 0 && i % 1000 === 0) {
          console.log(`CitationTitleTranslations: Processed ${i}/${results.length} records`);
        }
      } catch (error) {
        console.error(`CitationTitleTranslations: Error processing row ${row.biblionumber}:`, error);
        processingErrors.push(`Row ${row.biblionumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Continue with basic data if MARC parsing fails
        titleData.push({
          biblionumber: row.biblionumber,
          titles_245: [],
          titles_242: [],
          titles_246: [],
          allTitles: row.biblio_title || '',
          author: row.biblio_author || '',
          year: row.copyrightdate?.toString() || '',
          journal: '',
          url: row.url || '',
          pdfUrl: constructPdfUrl(row.url || ''),
          authorId: undefined,
        });
      }
    }

    console.log(`CitationTitleTranslations: Processing completed. ${titleData.length} records processed with ${processingErrors.length} errors`);

    if (processingErrors.length > 0) {
      console.warn('CitationTitleTranslations: Processing errors:', processingErrors.slice(0, 10)); // Log first 10 errors
    }

    await connection.release();
    connection = null;

    console.log(`CitationTitleTranslations: Processed ${titleData.length} records`);

    // For debugging, let's check the first few records
    if (titleData.length > 0) {
      console.log('CitationTitleTranslations: Sample record:', JSON.stringify(titleData[0], null, 2));
    }

    // Filter out entries without any title data
    const translationData = titleData.filter((item: CitationTitleData) => {
      const hasTitles = item.titles_245.length > 0 || item.titles_242.length > 0 || 
                       item.titles_246.length > 0 || item.allTitles.trim().length > 0;
      return hasTitles;
    });

    console.log(`CitationTitleTranslations: Found ${translationData.length} records with translations after filtering`);

    // If no records with translations found, include all records but mark the issue
    let finalData = translationData;
    let reportType = 'translations';
    
    if (translationData.length === 0 && titleData.length > 0) {
      console.log('CitationTitleTranslations: No translation records found, including all records for debugging');
      finalData = titleData;
      reportType = 'all-records-debug';
    } else if (translationData.length === 0) {
      console.log('CitationTitleTranslations: No records found at all');
      finalData = [];
    }

    // Create Excel workbook
    console.log('CitationTitleTranslations: Creating Excel workbook...');
    const workbook = xlsx.utils.book_new();
    
    // Prepare data for Excel (without formula-based hyperlinks)
    const excelData = finalData.map((item: CitationTitleData) => ({
      'Biblio Number': item.biblionumber,
      'Title 245': formatMultipleValues(item.titles_245),
      'Title 242': formatMultipleValues(item.titles_242),
      'Title 246': formatMultipleValues(item.titles_246),
      // 'Author': item.author,
      // 'Year': item.year,
      // 'Journal': item.journal,
      'PDF URL': item.pdfUrl,
    }));

    const worksheet = xlsx.utils.json_to_sheet(excelData);
    
    // Add hyperlinks using cell.l property (safer than formulas)
    for (let row = 1; row <= finalData.length; row++) {
      const item = finalData[row - 1];
      
      // Add hyperlink for Biblio Number to cataloging system
      const biblioNumberCellRef = xlsx.utils.encode_cell({ r: row, c: 0 });
      const biblioNumberCell = worksheet[biblioNumberCellRef];
      if (biblioNumberCell && biblioNumberCell.v) {
        const catalogingUrl = `https://citationadmin.mandumah.com/cgi-bin/koha/cataloguing/addbiblio.pl?biblionumber=${item.biblionumber}`;
        biblioNumberCell.l = { Target: catalogingUrl, Tooltip: "Click to open in cataloging system" };
      }

      // Add hyperlink for PDF URL if exists
      const pdfUrlCellRef = xlsx.utils.encode_cell({ r: row, c: 4 });
      const pdfUrlCell = worksheet[pdfUrlCellRef];
      if (pdfUrlCell && pdfUrlCell.v && item.pdfUrl && item.pdfUrl.trim()) {
        pdfUrlCell.l = { Target: item.pdfUrl, Tooltip: "Click to open PDF document" };
      }
    }
    
    // Auto-size columns
    const columnWidths = [
      { wch: 15 }, // Biblio Number
      { wch: 40 }, // Title 245
      { wch: 40 }, // Title 242
      { wch: 40 }, // Title 246
      { wch: 60 }, // PDF URL
    ];
    worksheet['!cols'] = columnWidths;

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Citation Title Translations');

    // Generate Excel buffer
    console.log('CitationTitleTranslations: Generating Excel buffer...');
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    console.log(`CitationTitleTranslations: Report generation completed successfully. ${finalData.length} records, ${excelBuffer.length} bytes`);

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="citation-title-translations-${new Date().toISOString().split('T')[0]}.xlsx"`,
        'X-Record-Count': finalData.length.toString(),
        'X-Processing-Errors': processingErrors.length.toString(),
        'X-Report-Type': reportType,
      },
    });

  } catch (error) {
    console.error('CitationTitleTranslations: Error generating report:', error);
    console.error('CitationTitleTranslations: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Ensure connection is released
    if (connection) {
      try {
        await connection.release();
      } catch (releaseError) {
        console.error('CitationTitleTranslations: Error releasing connection:', releaseError);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate citation title translations report',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
