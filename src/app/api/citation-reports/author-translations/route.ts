import { NextRequest, NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import { getCitationConnection } from '@/lib/citation_db';
import { extractAllAuthors, formatMultipleValues } from '@/utils/marcParser';

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
  try {
    const { magazineNumbers, startYear, endYear } = await request.json();

    // Create database connection
    const connection = await getCitationConnection();

    let query = `
      SELECT 
        b.biblionumber,
        b.author as biblio_author,
        b.title as biblio_title,
        b.copyrightdate,
        bi.marcxml,
        bi.url
      FROM biblioitems bi
      INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
      WHERE b.frameworkcode = 'CIT'
        AND bi.marcxml IS NOT NULL
    `;

    const queryParams: any[] = [];

    // Add magazine numbers filter - get all versions and builds under magazine
    if (magazineNumbers) {
      const numbers = magazineNumbers.split(/[,\s\n]+/).filter((num: string) => num.trim());
      if (numbers.length > 0) {
        // Build LIKE conditions for each magazine number to get all versions (e.g., 0005-*)
        const likeConditions = numbers.map(() => 'bi.url LIKE ?').join(' OR ');
        query += ` AND (${likeConditions})`;
        
        // Add parameters with wildcard pattern for each magazine number
        const patterns: string[] = [];
        for (const number of numbers) {
          const pattern = `${number.padStart(4, '0')}-%`;
          patterns.push(pattern);
          queryParams.push(pattern);
        }
        console.log('CitationAuthorTranslations: Magazine filter patterns:', patterns);
      }
    }

    // Add year range filter
    if (startYear && endYear) {
      query += ' AND b.copyrightdate BETWEEN ? AND ?';
      queryParams.push(parseInt(startYear), parseInt(endYear));
    } else if (startYear) {
      query += ' AND b.copyrightdate >= ?';
      queryParams.push(parseInt(startYear));
    } else if (endYear) {
      query += ' AND b.copyrightdate <= ?';
      queryParams.push(parseInt(endYear));
    }

    query += ' ORDER BY b.biblionumber';

    const [rows] = await connection.execute(query, queryParams);
    const results = rows as any[];

    const authorData: CitationAuthorData[] = results.map(row => {
      const marcData = row.marcxml ? extractAuthorDataFromMarcXml(row.marcxml) : {
        mainAuthor: '',
        mainAuthorId: '',
        additionalAuthors: [],
        additionalAuthorIds: [],
        allAuthors: '',
        title: '',
        year: '',
        journal: ''
      };

      return {
        biblionumber: row.biblionumber,
        mainAuthor: marcData.mainAuthor || row.biblio_author || '',
        mainAuthorId: marcData.mainAuthorId,
        additionalAuthors: marcData.additionalAuthors,
        additionalAuthorIds: marcData.additionalAuthorIds,
        allAuthors: marcData.allAuthors || (row.biblio_author ? row.biblio_author : ''),
        title: marcData.title || row.biblio_title || '',
        year: marcData.year || row.copyrightdate?.toString() || '',
        journal: marcData.journal || '',
        url: row.url || '',
      };
    });

    await connection.release();

    // Create Excel workbook
    const workbook = xlsx.utils.book_new();
    
    // Prepare data for Excel (without formula-based hyperlinks)
    const excelData = authorData.map(item => ({
      'Biblio Number': item.biblionumber,
      'Main Author (100a)': item.mainAuthor,
      'Main Author ID': item.mainAuthorId,
      'Additional Authors (700a)': formatMultipleValues(item.additionalAuthors),
      'Additional Author IDs': formatMultipleValues(item.additionalAuthorIds),
      'All Authors': item.allAuthors,
      'Title': item.title,
      'Year': item.year,
      'Journal': item.journal,
      'URL': item.url,
    }));

    const worksheet = xlsx.utils.json_to_sheet(excelData);
    
    // Add hyperlinks using cell.l property (safer than formulas)
    for (let row = 1; row <= authorData.length; row++) {
      const item = authorData[row - 1];
      
      // Add hyperlink for Biblio Number to cataloging system
      const biblioNumberCellRef = xlsx.utils.encode_cell({ r: row, c: 0 });
      const biblioNumberCell = worksheet[biblioNumberCellRef];
      if (biblioNumberCell && biblioNumberCell.v) {
        const catalogingUrl = `https://cataloging.mandumah.com/cgi-bin/koha/cataloguing/addbiblio.pl?biblionumber=${item.biblionumber}`;
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

      // URL field now contains PDF filename - no hyperlink needed
    }
    
    // Auto-size columns
    const columnWidths = [
      { wch: 15 }, // Biblio Number
      { wch: 30 }, // Main Author
      { wch: 15 }, // Main Author ID
      { wch: 40 }, // Additional Authors
      { wch: 40 }, // Additional Author IDs
      { wch: 50 }, // All Authors
      { wch: 50 }, // Title
      { wch: 10 }, // Year
      { wch: 40 }, // Journal
      { wch: 60 }, // URL
    ];
    worksheet['!cols'] = columnWidths;

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Citation Author Translations');

    // Generate Excel buffer
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="citation-author-translations-${new Date().toISOString().split('T')[0]}.xlsx"`,
        'X-Record-Count': authorData.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating citation author translations report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
