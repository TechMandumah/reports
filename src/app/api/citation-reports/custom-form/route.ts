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

// Citation-specific MARC fields
const citationMarcFields = [
  { tag: "000", tag_name: "Leader", tag_name_arabic: "قائد" },
  { tag: "001", tag_name: "Control Number", tag_name_arabic: "رقم التحكم" },
  { tag: "041", tag_name: "Language Code", tag_name_arabic: "رمز اللغة" },
  { tag: "073", tag_name: "Publisher Code", tag_name_arabic: "رمز الناشر" },
  { tag: "100", tag_name: "Main Author", tag_name_arabic: "المؤلف الرئيسي" },
  { tag: "242", tag_name: "Translation of Title", tag_name_arabic: "ترجمة العنوان" },
  { tag: "245", tag_name: "Title Statement", tag_name_arabic: "العنوان الرئيسي" },
  { tag: "246", tag_name: "Varying Form of Title", tag_name_arabic: "شكل متغير من العنوان" },
  { tag: "260", tag_name: "Publication Date", tag_name_arabic: "تاريخ النشر" },
  { tag: "300", tag_name: "Physical Description", tag_name_arabic: "الوصف المادي" },
  { tag: "336", tag_name: "Content Type", tag_name_arabic: "نوع المحتوى" },
  { tag: "700", tag_name: "Additional Authors", tag_name_arabic: "مؤلفون إضافيون" },
  { tag: "773", tag_name: "Host Item Entry (Journal)", tag_name_arabic: "إدخال عنصر مضيف (المجلة)" },
  { tag: "995", tag_name: "Local Field (Citation)", tag_name_arabic: "حقل محلي (الاستشهاد)" },
  { tag: "999", tag_name: "Local Control Number", tag_name_arabic: "رقم التحكم المحلي" }
];

// Helper function to extract field value from MARC XML
function extractFieldFromMarcXml(marcxml: string, tag: string): string {
  if (!marcxml) return '';
  
  try {
    // Handle different field types
    if (tag === '000') {
      // Leader field
      const leaderMatch = marcxml.match(/<leader>([^<]+)<\/leader>/);
      return leaderMatch ? leaderMatch[1] : '';
    } else if (tag === '001') {
      // Control field
      const controlMatch = marcxml.match(/<controlfield tag="001">([^<]+)<\/controlfield>/);
      return controlMatch ? controlMatch[1] : '';
    } else {
      // Data fields - extract all subfields
      const fieldRegex = new RegExp(`<datafield tag="${tag}"[^>]*>([\\s\\S]*?)<\\/datafield>`, 'g');
      const fieldMatches = [...marcxml.matchAll(fieldRegex)];
      
      if (fieldMatches.length === 0) return '';
      
      const values = fieldMatches.map(match => {
        const fieldContent = match[1];
        const subfieldMatches = fieldContent.matchAll(/<subfield code="[^"]*">([^<]+)<\/subfield>/g);
        return Array.from(subfieldMatches).map(sf => sf[1]).join(' ');
      });
      
      return values.join('; ');
    }
  } catch (error) {
    console.error(`Error extracting field ${tag}:`, error);
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Custom citation form API called');
    const { magazineNumbers, startYear, endYear, selectedFields, isPreview } = await request.json();
    console.log('Request data:', { magazineNumbers, startYear, endYear, selectedFields, isPreview });

    // Validate selectedFields
    if (!selectedFields || selectedFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields selected' },
        { status: 400 }
      );
    }

    // Create database connection
    console.log('Connecting to citation database...');
    const connection = await mysql.createConnection(citationDbConfig);

    let query = `
      SELECT 
        b.biblionumber,
        b.frameworkcode,
        b.author,
        b.title,
        b.copyrightdate,
        bi.publishercode,
        bi.url,
        bi.marcxml
      FROM biblio b
      LEFT JOIN biblioitems bi ON b.biblionumber = bi.biblionumber
      WHERE b.frameworkcode = 'CIT'
        AND bi.marcxml IS NOT NULL
    `;

    const queryParams: any[] = [];

    // Add magazine numbers filter (using publishercode)
    if (magazineNumbers && magazineNumbers.length > 0) {
      const placeholders = magazineNumbers.map(() => '?').join(',');
      query += ` AND bi.publishercode IN (${placeholders})`;
      queryParams.push(...magazineNumbers);
    }

    // Add year range filter
    if (startYear && endYear) {
      const startYearInt = parseInt(startYear.toString());
      const endYearInt = parseInt(endYear.toString());
      if (!isNaN(startYearInt) && !isNaN(endYearInt)) {
        query += ' AND b.copyrightdate BETWEEN ? AND ?';
        queryParams.push(startYearInt, endYearInt);
      }
    } else if (startYear) {
      const startYearInt = parseInt(startYear.toString());
      if (!isNaN(startYearInt)) {
        query += ' AND b.copyrightdate >= ?';
        queryParams.push(startYearInt);
      }
    } else if (endYear) {
      const endYearInt = parseInt(endYear.toString());
      if (!isNaN(endYearInt)) {
        query += ' AND b.copyrightdate <= ?';
        queryParams.push(endYearInt);
      }
    }

    query += ' ORDER BY b.biblionumber';

    // Limit for preview
    if (isPreview) {
      query += ' LIMIT 10';
    }

    console.log('Executing query:', query);
    console.log('Query params:', queryParams);

    const [rows] = await connection.execute(query, queryParams);
    const results = rows as any[];
    
    console.log(`Found ${results.length} results from database`);

    // Process data based on selected fields
    const processedData = results.map(row => {
      const data: any = {};
      
      selectedFields.forEach((fieldTag: string) => {
        if (fieldTag === 'url') {
          data[fieldTag] = row.url || '';
        } else if (fieldTag === 'biblio') {
          data[fieldTag] = String(row.biblionumber).padStart(4, '0');
        } else if (fieldTag === '001') {
          data[fieldTag] = row.biblionumber?.toString() || '';
        } else if (fieldTag === '073') {
          data[fieldTag] = row.publishercode || '';
        } else if (fieldTag === '100') {
          data[fieldTag] = extractFieldFromMarcXml(row.marcxml, '100') || row.author || '';
        } else if (fieldTag === '245') {
          data[fieldTag] = extractFieldFromMarcXml(row.marcxml, '245') || row.title || '';
        } else if (fieldTag === '260') {
          data[fieldTag] = extractFieldFromMarcXml(row.marcxml, '260') || row.copyrightdate?.toString() || '';
        } else {
          data[fieldTag] = extractFieldFromMarcXml(row.marcxml, fieldTag);
        }
      });
      
      // Add standard fields for Excel export
      data.url = row.url || ''; // PDF filename
      data.biblio = String(row.biblionumber).padStart(4, '0'); // Formatted biblio number
      data.link = `https://cataloging.mandumah.com/cgi-bin/koha/cataloguing/addbiblio.pl?biblionumber=${row.biblionumber}`; // Clickable link
      
      return data;
    });

    await connection.end();

    if (isPreview) {
      return NextResponse.json({
        success: true,
        data: processedData,
        count: processedData.length
      });
    } else {
      // Generate Excel file
      const workbook = xlsx.utils.book_new();
      
      // Prepare data for Excel
      const excelData = processedData.map(item => {
        const row: any = {};
        
        // Always include biblio and URL first
        row['Biblio'] = item['biblio'] || '';
        row['PDF URL'] = item['url'] || '';
        
        // Then add selected fields
        selectedFields.forEach((fieldTag: string) => {
          const field = citationMarcFields.find(f => f.tag === fieldTag);
          const columnName = field ? `${field.tag} - ${field.tag_name}` : fieldTag;
          row[columnName] = item[fieldTag] || '';
        });
        return row;
      });

      const worksheet = xlsx.utils.json_to_sheet(excelData);
      
      // Auto-size columns (2 extra for biblio and URL + selected fields)
      const columnWidths = Array(selectedFields.length + 2).fill({ wch: 30 });
      worksheet['!cols'] = columnWidths;

      // Add hyperlinks to biblio cells (always in first column)
      for (let i = 0; i < processedData.length; i++) {
        const cellAddress = xlsx.utils.encode_cell({ r: i + 1, c: 0 }); // First column (biblio)
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].l = { Target: processedData[i].link, Tooltip: "Click to open in cataloging system" };
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
          'X-Record-Count': processedData.length.toString(),
        },
      });
    }

  } catch (error) {
    console.error('Error processing custom citation report:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { error: `Failed to process custom citation report: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
