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

interface CustomCitationData {
  [key: string]: any;
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
  } catch (error) {
    console.error('Error parsing MARC XML:', error);
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { magazineNumbers, startYear, endYear, selectedFields } = await request.json();

    // Validate selected fields
    if (!selectedFields || selectedFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields selected' },
        { status: 400 }
      );
    }

    // Create database connection
    const connection = await mysql.createConnection(citationDbConfig);

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
        bi.volume,
        bi.publishercode,
        bi.volumedate,
        bi.illus,
        bi.pages,
        bi.notes as biblioitem_notes,
        bi.size,
        bi.place,
        bi.lccn,
        bi.marc,
        bi.url,
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

    const citationData: CustomCitationData[] = results.map(row => {
      const marcData = row.marcxml ? extractFromMarcXml(row.marcxml) : {
        author: '',
        authorId: undefined,
        title: '',
        translatedTitle: undefined,
        alternativeTitle: undefined,
        year: '',
        journal: '',
        volume: undefined,
        issue: undefined,
        pages: undefined,
        additionalAuthors: [],
        additionalAuthorIds: []
      };

      // Create complete data object with all available fields
      const completeData: CustomCitationData = {
        biblionumber: row.biblionumber,
        url: `https://cataloging.mandumah.com/cgi-bin/koha/cataloguing/addbiblio.pl?biblionumber=${row.biblionumber}`,
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
        additionalAuthors: marcData.additionalAuthors?.join('; ') || '',
        additionalAuthorIds: marcData.additionalAuthorIds?.join('; ') || '',
        publishercode: row.publishercode || '',
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

      // Filter to only include selected fields
      const filteredData: CustomCitationData = {};
      selectedFields.forEach((field: string) => {
        if (completeData.hasOwnProperty(field)) {
          filteredData[field] = completeData[field];
        }
      });

      return filteredData;
    });

    await connection.end();

    // Create Excel workbook
    const workbook = xlsx.utils.book_new();
    
    // Create field labels mapping
    const fieldLabels: { [key: string]: string } = {
      biblionumber: 'Biblio Number',
      url: 'Biblio URL',
      frameworkcode: 'Framework Code',
      author: 'Author',
      authorId: 'Author ID',
      title: 'Title',
      translatedTitle: 'Translated Title',
      alternativeTitle: 'Alternative Title',
      year: 'Publication Year',
      journal: 'Journal',
      volume: 'Volume',
      issue: 'Issue',
      pages: 'Pages',
      additionalAuthors: 'Additional Authors',
      additionalAuthorIds: 'Additional Author IDs',
      publishercode: 'Publisher Code',
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

    // Prepare data for Excel with proper headers
    const excelData = citationData.map(item => {
      const row: { [key: string]: any } = {};
      selectedFields.forEach((field: string) => {
        const label = fieldLabels[field] || field;
        row[label] = item[field] || '';
      });
      return row;
    });

    const worksheet = xlsx.utils.json_to_sheet(excelData);
    
    // Auto-size columns based on content
    const columnWidths = selectedFields.map((field: string) => {
      const label = fieldLabels[field] || field;
      const maxLength = Math.max(
        label.length,
        ...excelData.map(row => String(row[label] || '').length)
      );
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
    worksheet['!cols'] = columnWidths;

    // Add hyperlinks for URL and Author ID columns
    if (selectedFields.includes('url') || selectedFields.includes('authorId') || selectedFields.includes('additionalAuthorIds')) {
      const range = xlsx.utils.decode_range(worksheet['!ref'] || 'A1');
      
      for (let row = 1; row <= range.e.r; row++) { // Start from row 1 (skip header)
        // Add hyperlink for Biblio URL
        if (selectedFields.includes('url')) {
          const urlColIndex = selectedFields.findIndex((f: string) => f === 'url');
          const cellRef = xlsx.utils.encode_cell({ r: row, c: urlColIndex });
          const cell = worksheet[cellRef];
          if (cell && cell.v) {
            cell.l = { Target: cell.v, Tooltip: "Click to open in cataloging system" };
          }
        }

        // Add hyperlinks for Author IDs
        if (selectedFields.includes('authorId')) {
          const authorIdColIndex = selectedFields.findIndex((f: string) => f === 'authorId');
          const cellRef = xlsx.utils.encode_cell({ r: row, c: authorIdColIndex });
          const cell = worksheet[cellRef];
          if (cell && cell.v && cell.v.trim()) {
            const authorUrl = `https://cataloging.mandumah.com/cgi-bin/koha/authorities/authorities.pl?authid=${cell.v}`;
            cell.l = { Target: authorUrl, Tooltip: "Click to view author authority record" };
          }
        }
      }
    }

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Custom Citation Report');

    // Generate Excel buffer
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="custom-citation-report-${new Date().toISOString().split('T')[0]}.xlsx"`,
        'X-Record-Count': citationData.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating custom citation report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
