import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import * as xlsx from 'xlsx';

// Citation database connection configuration
const citationDbConfig = {
  host: process.env.CITATION_DB_HOST || 'localhost',
  user: process.env.CITATION_DB_USER || 'root',
  password: process.env.CITATION_DB_PASSWORD || '',
  database: process.env.CITATION_DB_NAME || 'koha_citation',
  charset: 'utf8mb4',
};

interface CitationData {
  biblionumber: number;
  url: string;
  author: string;
  authorId?: string;
  title: string;
  year: string;
  journal: string;
  volume?: string;
  issue?: string;
  pages?: string;
  additionalAuthors?: string[];
  additionalAuthorIds?: string[];
}

// Helper function to extract data from MARC XML
function extractFromMarcXml(marcxml: string): {
  author: string;
  authorId?: string;
  title: string;
  year: string;
  journal: string;
  volume?: string;
  issue?: string;
  additionalAuthors?: string[];
  additionalAuthorIds?: string[];
} {
  const result = {
    author: '',
    authorId: undefined as string | undefined,
    title: '',
    year: '',
    journal: '',
    volume: undefined as string | undefined,
    issue: undefined as string | undefined,
    additionalAuthors: [] as string[],
    additionalAuthorIds: [] as string[],
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
  } catch (error) {
    console.error('Error parsing MARC XML:', error);
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { magazineNumbers, startYear, endYear } = await request.json();

    // Create database connection
    const connection = await mysql.createConnection(citationDbConfig);

    let query = `
      SELECT 
        b.biblionumber,
        b.author as biblio_author,
        b.title as biblio_title,
        b.copyrightdate,
        bi.marcxml
      FROM biblio b
      LEFT JOIN biblioitems bi ON b.biblionumber = bi.biblionumber
      WHERE b.frameworkcode = 'CIT'
    `;

    const queryParams: any[] = [];

    // Add magazine numbers filter (using biblionumber or publishercode)
    if (magazineNumbers) {
      const numbers = magazineNumbers.split(/[,\s\n]+/).filter((num: string) => num.trim());
      if (numbers.length > 0) {
        const placeholders = numbers.map(() => '?').join(',');
        query += ` AND (b.biblionumber IN (${placeholders}) OR bi.publishercode IN (${placeholders}))`;
        queryParams.push(...numbers, ...numbers);
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

    const citationData: CitationData[] = results.map(row => {
      const marcData = row.marcxml ? extractFromMarcXml(row.marcxml) : {
        author: '',
        authorId: undefined,
        title: '',
        year: '',
        journal: '',
        additionalAuthors: [],
        additionalAuthorIds: []
      };

      return {
        biblionumber: row.biblionumber,
        url: `https://cataloging.mandumah.com/cgi-bin/koha/cataloguing/addbiblio.pl?biblionumber=${row.biblionumber}`,
        author: marcData.author || row.biblio_author || '',
        authorId: marcData.authorId,
        title: marcData.title || row.biblio_title || '',
        year: marcData.year || row.copyrightdate?.toString() || '',
        journal: marcData.journal || '',
        volume: marcData.volume,
        issue: marcData.issue,
        additionalAuthors: marcData.additionalAuthors,
        additionalAuthorIds: marcData.additionalAuthorIds,
      };
    });

    await connection.end();

    // Create Excel workbook
    const workbook = xlsx.utils.book_new();
    
    // Prepare data for Excel
    const excelData = citationData.map(item => ({
      'Biblio Number': item.biblionumber,
      'Biblio URL': item.url,
      'Author': item.author,
      'Author ID': item.authorId || '',
      'Title': item.title,
      'Year': item.year,
      'Journal': item.journal,
      'Volume': item.volume || '',
      'Issue': item.issue || '',
      'Additional Authors': item.additionalAuthors?.join('; ') || '',
      'Additional Author IDs': item.additionalAuthorIds?.join('; ') || '',
    }));

    const worksheet = xlsx.utils.json_to_sheet(excelData);
    
    // Auto-size columns
    const columnWidths = [
      { wch: 15 }, // Biblio Number
      { wch: 70 }, // Biblio URL
      { wch: 30 }, // Author
      { wch: 15 }, // Author ID
      { wch: 50 }, // Title
      { wch: 10 }, // Year
      { wch: 40 }, // Journal
      { wch: 10 }, // Volume
      { wch: 10 }, // Issue
      { wch: 40 }, // Additional Authors
      { wch: 20 }, // Additional Author IDs
    ];
    worksheet['!cols'] = columnWidths;

    // Add hyperlinks for URLs and Author IDs
    const range = xlsx.utils.decode_range(worksheet['!ref'] || 'A1');
    
    for (let row = 1; row <= range.e.r; row++) { // Start from row 1 (skip header)
      // Add hyperlink for Biblio URL (column B, index 1)
      const urlCellRef = xlsx.utils.encode_cell({ r: row, c: 1 });
      const urlCell = worksheet[urlCellRef];
      if (urlCell && urlCell.v) {
        urlCell.l = { Target: urlCell.v, Tooltip: "Click to open in cataloging system" };
      }

      // Add hyperlink for Author ID (column D, index 3)
      const authorIdCellRef = xlsx.utils.encode_cell({ r: row, c: 3 });
      const authorIdCell = worksheet[authorIdCellRef];
      if (authorIdCell && authorIdCell.v && authorIdCell.v.trim()) {
        const authorUrl = `https://cataloging.mandumah.com/cgi-bin/koha/authorities/authorities.pl?authid=${authorIdCell.v}`;
        authorIdCell.l = { Target: authorUrl, Tooltip: "Click to view author authority record" };
      }

      // Add hyperlinks for Additional Author IDs (column K, index 10)
      const additionalAuthorIdsCellRef = xlsx.utils.encode_cell({ r: row, c: 10 });
      const additionalAuthorIdsCell = worksheet[additionalAuthorIdsCellRef];
      if (additionalAuthorIdsCell && additionalAuthorIdsCell.v && additionalAuthorIdsCell.v.trim()) {
        // For multiple IDs, just make the cell clickable to the first ID
        const firstId = additionalAuthorIdsCell.v.split(';')[0].trim();
        if (firstId) {
          const authorUrl = `https://cataloging.mandumah.com/cgi-bin/koha/authorities/authorities.pl?authid=${firstId}`;
          additionalAuthorIdsCell.l = { Target: authorUrl, Tooltip: "Click to view first additional author authority record" };
        }
      }
    }

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Citation Entries');

    // Generate Excel buffer
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="citation-entries-${new Date().toISOString().split('T')[0]}.xlsx"`,
        'X-Record-Count': citationData.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating citation entry report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
