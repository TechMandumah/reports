import { NextRequest, NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import { getCitationConnection } from '@/lib/citation_db';
import { extractAllAuthors, formatMultipleValues } from '@/utils/marcParser';

// Configure API route timeout
export const maxDuration = 3000; // 50 minutes
export const dynamic = 'force-dynamic';

// Interface for hierarchical author structure
interface HierarchicalAuthorRow {
  biblionumber: number;
  subfield_a: string;
  subfield_q: string;
}

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
        EXTRACTVALUE(a.marcxml, '//datafield[@tag="700"][5]/subfield[@code="9"]') AS '700_5_9'
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

    // Process results into hierarchical structure like generateHierarchicalAuthorsReport
    console.log(`🔄 [${requestId}] Creating hierarchical author structure for ${results.length} records...`);
    const processingStart = Date.now();
    const hierarchicalData: HierarchicalAuthorRow[] = [];
    const processingErrors: string[] = [];

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      try {
        const biblionumber = row['biblionumber'];
        
        // Extract main author (100 field) if exists
        const main_100_a = row['100_a'] || '';
        const main_100_q = row['100_q'] || '';

        if (main_100_a) {
          hierarchicalData.push({
            biblionumber: biblionumber,
            subfield_a: main_100_a,
            subfield_q: main_100_q
          });
        }

        // Extract additional authors (700 fields) - up to 5 authors
        const additionalAuthorFields = [
          { a: row['700_1_a'], q: row['700_1_q'] },
          { a: row['700_2_a'], q: row['700_2_q'] },
          { a: row['700_3_a'], q: row['700_3_q'] },
          { a: row['700_4_a'], q: row['700_4_q'] },
          { a: row['700_5_a'], q: row['700_5_q'] }
        ];

        additionalAuthorFields.forEach(author => {
          if (author.a) {
            hierarchicalData.push({
              biblionumber: biblionumber,
              subfield_a: author.a || '',
              subfield_q: author.q || ''
            });
          }
        });

        // Log progress for large datasets
        if (i > 0 && i % 100 === 0) {
          console.log(`🔄 [${requestId}] Processed ${i}/${results.length} records (${((i/results.length)*100).toFixed(1)}%)`);
        }
        
        // More frequent logging for first few and last few records
        if (i < 5 || i >= results.length - 5) {
          console.log(`📝 [${requestId}] Record ${i + 1}: biblionumber=${row.biblionumber}, main_100_a="${main_100_a}", hasExtractedData=${!!(main_100_a || row['700_1_a'])}`);
        }
      } catch (error) {
        console.error(`❌ [${requestId}] Error processing record ${i + 1} (biblionumber: ${row.biblionumber}):`, error);
        processingErrors.push(`Row ${row.biblionumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const processingTime = Date.now() - processingStart;
    console.log(`✅ [${requestId}] Hierarchical structure created:`, {
      totalTime: `${processingTime}ms`,
      recordsProcessed: hierarchicalData.length,
      processingErrors: processingErrors.length,
      averageTimePerRecord: hierarchicalData.length > 0 ? `${(processingTime / hierarchicalData.length).toFixed(2)}ms` : 'N/A',
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

    // Create Excel workbook using ExcelJS (like hierarchical authors)
    console.log(`📊 [${requestId}] Creating Excel workbook with ExcelJS...`);
    const excelStart = Date.now();
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Citation Authors');

    // Define columns for hierarchical structure
    const columns = [
      { header: 'Biblio Number', key: 'biblionumber', width: 20 },
      { header: 'Subfield a (Name)', key: 'subfield_a', width: 40 },
      { header: 'Subfield q (Fuller Name)', key: 'subfield_q', width: 40 }
    ];

    worksheet.columns = columns;

    // Add data rows
    hierarchicalData.forEach((row, index) => {
      const excelRow = worksheet.addRow({
        biblionumber: row.biblionumber || '',
        subfield_a: row.subfield_a || '',
        subfield_q: row.subfield_q || ''
      });
    });

    // Make biblio number column clickable
    for (let rowIndex = 2; rowIndex <= hierarchicalData.length + 1; rowIndex++) {
      const dataRow = hierarchicalData[rowIndex - 2];
      const cell = worksheet.getCell(rowIndex, 1); // Column 1 is biblionumber
      const biblionumber = cell.value;
      if (biblionumber && biblionumber.toString() !== '') {
        // cell.value = {
        //   text: biblionumber.toString(),
        //   hyperlink: `https://citationadmin.mandumah.com/cgi-bin/koha/cataloguing/addbiblio.pl?biblionumber=${biblionumber}`,
        //   tooltip: `Open biblio record ${biblionumber}`
        // };
        // biblioNumberCell.l = { Target: catalogingUrl, Tooltip: "Click to open in cataloging system" };
        // //Hyperlink the cataloging URL
        // biblioNumberCell.f = `HYPERLINK("${catalogingUrl}", "${item.biblionumber}")`;
        const catalogingUrl = `https://citationadmin.mandumah.com/cgi-bin/koha/cataloguing/addbiblio.pl?biblionumber=${biblionumber}`;
        cell.l = { Target: catalogingUrl, Tooltip: "Click to open in cataloging system" };
        // Hyperlink the cataloging URL
        cell.f = `HYPERLINK("${catalogingUrl}", "${biblionumber}")`;
        cell.font = { color: { argb: 'FF0563C1' }, underline: true };
      }
    }

    // Style the main header row with blue background and white text
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' }
    };
    headerRow.height = 25;
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Add borders to all cells
    worksheet.eachRow((row: any, rowNumber: any) => {
      row.eachCell((cell: any) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Generate Excel buffer using ExcelJS
    console.log(`💾 [${requestId}] Generating Excel buffer...`);
    const bufferStart = Date.now();
    const excelBuffer = await workbook.xlsx.writeBuffer();
    const bufferTime = Date.now() - bufferStart;
    const excelTime = Date.now() - excelStart;

    console.log(`✅ [${requestId}] Excel generation completed:`, {
      excelCreationTime: `${excelTime}ms`,
      bufferGenerationTime: `${bufferTime}ms`,
      bufferSize: `${excelBuffer.length} bytes`,
      bufferSizeMB: `${(excelBuffer.length / 1024 / 1024).toFixed(2)} MB`,
      recordCount: hierarchicalData.length,
      timestamp: new Date().toISOString()
    });

    const totalProcessingTime = Date.now() - requestStart;
    console.log(`🎉 [${requestId}] Report generation completed successfully:`, {
      totalProcessingTime: `${totalProcessingTime}ms`,
      queryTime: `${queryTime}ms`,
      hierarchicalProcessingTime: `${processingTime}ms`,
      excelGenerationTime: `${excelTime}ms`,
      recordsProcessed: hierarchicalData.length,
      processingErrors: processingErrors.length,
      finalFileSize: `${(excelBuffer.length / 1024 / 1024).toFixed(2)} MB`
    });

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="citation-author-hierarchical-${new Date().toISOString().split('T')[0]}.xlsx"`,
        'X-Record-Count': hierarchicalData.length.toString(),
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
