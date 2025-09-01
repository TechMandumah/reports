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

interface CitationAuthorData {
  biblionumber: number;
  originalAuthor: string;
  additionalAuthors: string[];
  title: string;
  year: string;
  journal: string;
  url: string;
  authorId?: string;
  additionalAuthorIds?: string[];
}

// Helper function to extract author data from MARC XML
function extractAuthorDataFromMarcXml(marcxml: string): {
  originalAuthor: string;
  additionalAuthors: string[];
  title: string;
  year: string;
  journal: string;
  authorId?: string;
  additionalAuthorIds: string[];
} {
  const result = {
    originalAuthor: '',
    additionalAuthors: [] as string[],
    title: '',
    year: '',
    journal: '',
    authorId: undefined as string | undefined,
    additionalAuthorIds: [] as string[],
  };

  try {
    // Extract main author from field 100
    const authorMatch = marcxml.match(/<datafield tag="100"[^>]*>[\s\S]*?<subfield code="a">([^<]+)<\/subfield>/);
    if (authorMatch) {
      result.originalAuthor = authorMatch[1].trim();
    }

    // Extract main author ID from field 100 subfield 9
    const authorIdMatch = marcxml.match(/<datafield tag="100"[^>]*>[\s\S]*?<subfield code="9">([^<]+)<\/subfield>/);
    if (authorIdMatch) {
      result.authorId = authorIdMatch[1].trim();
    }

    // Extract additional authors from field 700
    const additionalAuthorMatches = marcxml.matchAll(/<datafield tag="700"[^>]*>([\s\S]*?)<\/datafield>/g);
    for (const match of additionalAuthorMatches) {
      const fieldContent = match[1];
      const nameMatch = fieldContent.match(/<subfield code="a">([^<]+)<\/subfield>/);
      const idMatch = fieldContent.match(/<subfield code="9">([^<]+)<\/subfield>/);
      
      if (nameMatch) {
        result.additionalAuthors.push(nameMatch[1].trim());
        if (idMatch) {
          result.additionalAuthorIds.push(idMatch[1].trim());
        } else {
          result.additionalAuthorIds.push('');
        }
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
  } catch (error) {
    console.error('Error parsing MARC XML for authors:', error);
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
        AND bi.marcxml IS NOT NULL
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

    const authorData: CitationAuthorData[] = results.map(row => {
      const marcData = row.marcxml ? extractAuthorDataFromMarcXml(row.marcxml) : {
        originalAuthor: '',
        additionalAuthors: [],
        title: '',
        year: '',
        journal: '',
        authorId: undefined,
        additionalAuthorIds: []
      };

      return {
        biblionumber: row.biblionumber,
        originalAuthor: marcData.originalAuthor || row.biblio_author || '',
        additionalAuthors: marcData.additionalAuthors,
        title: marcData.title || row.biblio_title || '',
        year: marcData.year || row.copyrightdate?.toString() || '',
        journal: marcData.journal || '',
        url: `https://cataloging.mandumah.com/cgi-bin/koha/cataloguing/addbiblio.pl?biblionumber=${row.biblionumber}`,
        authorId: marcData.authorId,
        additionalAuthorIds: marcData.additionalAuthorIds,
      };
    });

    await connection.end();

    // Create Excel workbook
    const workbook = xlsx.utils.book_new();
    
    // Prepare data for Excel with hyperlinks
    const excelData = authorData.map(item => {
      const mainAuthorWithLink = item.authorId 
        ? `=HYPERLINK("https://cataloging.mandumah.com/cgi-bin/koha/authorities/authorities.pl?authid=${item.authorId}", "${item.originalAuthor}")` 
        : item.originalAuthor;

      // Format additional authors with their links
      const additionalAuthorsFormatted = item.additionalAuthors.map((author, index) => {
        const authorId = item.additionalAuthorIds?.[index];
        return authorId 
          ? `=HYPERLINK("https://cataloging.mandumah.com/cgi-bin/koha/authorities/authorities.pl?authid=${authorId}", "${author}")` 
          : author;
      }).join('; ');

      return {
        'Biblio Number': `=HYPERLINK("${item.url}", "${item.biblionumber}")`,
        'Main Author (100a)': mainAuthorWithLink,
        'Additional Authors (700a)': additionalAuthorsFormatted,
        'Title': item.title,
        'Year': item.year,
        'Journal': item.journal,
      };
    });

    const worksheet = xlsx.utils.json_to_sheet(excelData);
    
    // Auto-size columns
    const columnWidths = [
      { wch: 15 }, // Biblio Number
      { wch: 30 }, // Main Author
      { wch: 40 }, // Additional Authors
      { wch: 50 }, // Title
      { wch: 10 }, // Year
      { wch: 40 }, // Journal
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
