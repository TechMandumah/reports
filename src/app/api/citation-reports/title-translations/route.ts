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

interface CitationTitleData {
  biblionumber: number;
  originalTitle: string;
  translatedTitle?: string;
  alternativeTitle?: string;
  author: string;
  year: string;
  journal: string;
  url: string;
  authorId?: string;
  additionalAuthorIds?: string[];
}

// Helper function to extract title data from MARC XML
function extractTitleDataFromMarcXml(marcxml: string): {
  originalTitle: string;
  translatedTitle?: string;
  alternativeTitle?: string;
  author: string;
  year: string;
  journal: string;
  authorId?: string;
  additionalAuthorIds: string[];
} {
  const result = {
    originalTitle: '',
    translatedTitle: undefined as string | undefined,
    alternativeTitle: undefined as string | undefined,
    author: '',
    year: '',
    journal: '',
    authorId: undefined as string | undefined,
    additionalAuthorIds: [] as string[],
  };

  try {
    // Extract original title from field 245
    const titleMatch = marcxml.match(/<datafield tag="245"[^>]*>[\s\S]*?<subfield code="a">([^<]+)<\/subfield>/);
    if (titleMatch) {
      result.originalTitle = titleMatch[1].trim();
    }

    // Extract translated title from field 242
    const translatedTitleMatch = marcxml.match(/<datafield tag="242"[^>]*>[\s\S]*?<subfield code="a">([^<]+)<\/subfield>/);
    if (translatedTitleMatch) {
      result.translatedTitle = translatedTitleMatch[1].trim();
    }

    // Extract alternative title from field 246
    const altTitleMatch = marcxml.match(/<datafield tag="246"[^>]*>[\s\S]*?<subfield code="a">([^<]+)<\/subfield>/);
    if (altTitleMatch) {
      result.alternativeTitle = altTitleMatch[1].trim();
    }

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

    // Extract additional author IDs from field 700
    const additionalAuthorMatches = marcxml.matchAll(/<datafield tag="700"[^>]*>([\s\S]*?)<\/datafield>/g);
    for (const match of additionalAuthorMatches) {
      const fieldContent = match[1];
      const idMatch = fieldContent.match(/<subfield code="9">([^<]+)<\/subfield>/);
      if (idMatch) {
        result.additionalAuthorIds.push(idMatch[1].trim());
      }
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
    console.error('Error parsing MARC XML for titles:', error);
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

    const titleData: CitationTitleData[] = results.map(row => {
      const marcData = row.marcxml ? extractTitleDataFromMarcXml(row.marcxml) : {
        originalTitle: '',
        author: '',
        year: '',
        journal: '',
        translatedTitle: undefined,
        alternativeTitle: undefined,
        authorId: undefined,
        additionalAuthorIds: []
      };

      return {
        biblionumber: row.biblionumber,
        originalTitle: marcData.originalTitle || row.biblio_title || '',
        translatedTitle: marcData.translatedTitle,
        alternativeTitle: marcData.alternativeTitle,
        author: marcData.author || row.biblio_author || '',
        year: marcData.year || row.copyrightdate?.toString() || '',
        journal: marcData.journal || '',
        url: `https://cataloging.mandumah.com/cgi-bin/koha/cataloguing/addbiblio.pl?biblionumber=${row.biblionumber}`,
        authorId: marcData.authorId,
        additionalAuthorIds: marcData.additionalAuthorIds,
      };
    });

    // Filter out entries without translated or alternative titles for the translation report
    const translationData = titleData.filter(item => 
      item.translatedTitle || item.alternativeTitle
    );

    await connection.end();

    // Create Excel workbook
    const workbook = xlsx.utils.book_new();
    
    // Prepare data for Excel with hyperlinks
    const excelData = translationData.map(item => {
      const authorWithLink = item.authorId 
        ? `=HYPERLINK("https://cataloging.mandumah.com/cgi-bin/koha/authorities/authorities.pl?authid=${item.authorId}", "${item.author}")` 
        : item.author;

      return {
        'Biblio Number': `=HYPERLINK("${item.url}", "${item.biblionumber}")`,
        'Original Title (245a)': item.originalTitle,
        'Translated Title (242a)': item.translatedTitle || '',
        'Alternative Title (246a)': item.alternativeTitle || '',
        'Author': authorWithLink,
        'Year': item.year,
        'Journal': item.journal,
      };
    });

    const worksheet = xlsx.utils.json_to_sheet(excelData);
    
    // Auto-size columns
    const columnWidths = [
      { wch: 15 }, // Biblio Number
      { wch: 50 }, // Original Title
      { wch: 50 }, // Translated Title
      { wch: 50 }, // Alternative Title
      { wch: 30 }, // Author
      { wch: 10 }, // Year
      { wch: 40 }, // Journal
    ];
    worksheet['!cols'] = columnWidths;

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Citation Title Translations');

    // Generate Excel buffer
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="citation-title-translations-${new Date().toISOString().split('T')[0]}.xlsx"`,
        'X-Record-Count': translationData.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating citation title translations report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
