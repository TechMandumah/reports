import { NextRequest, NextResponse } from 'next/server';
import { getCitationConnection } from '@/lib/citation_db';

// DEBUG endpoint to understand citation-journal relationships
export async function POST(request: NextRequest) {
  let connection: any = null;
  
  try {
    const { journalNumbers } = await request.json();
    console.log('🔍 DEBUG: Analyzing citation-journal relationship for:', journalNumbers);
    
    connection = await getCitationConnection();
    
    const numbers = Array.isArray(journalNumbers) ? journalNumbers : [journalNumbers];
    
    // 1. Check if journals exist
    const [journalCheck] = await connection.execute(`
      SELECT biblionumber, title, frameworkcode, author, seriestitle
      FROM biblio 
      WHERE biblionumber IN (${numbers.map(() => '?').join(',')})
    `, numbers.map(num => parseInt(num.toString())));
    
    // 2. Sample some citations to see structure
    const [sampleCitations] = await connection.execute(`
      SELECT 
        bi.biblionumber,
        bi.url,
        bi.publishercode,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="773"]/subfield[@code="w"]') as marc_773_w,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="773"]/subfield[@code="x"]') as marc_773_x,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="773"]/subfield[@code="t"]') as marc_773_t,
        EXTRACTVALUE(bi.marcxml, '//datafield[@tag="245"]/subfield[@code="a"]') as title_245,
        SUBSTRING(bi.marcxml, 1, 1000) as marcxml_sample
      FROM biblioitems bi
      INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
      WHERE b.frameworkcode = 'CIT'
        AND bi.marcxml IS NOT NULL
        AND bi.marcxml != ''
      ORDER BY bi.biblionumber DESC
      LIMIT 20
    `);
    
    // 3. Check different possible relationships
    const results: any = {
      journalsFound: journalCheck,
      sampleCitations: sampleCitations,
      searchResults: {}
    };
    
    // Try each method
    for (const method of ['773_w', '773_x', 'url_pattern', 'publishercode', 'direct_biblio']) {
      try {
        let query = '';
        let params: any[] = [];
        
        switch (method) {
          case '773_w':
            query = `
              SELECT COUNT(*) as count, GROUP_CONCAT(DISTINCT bi.biblionumber) as sample_biblios
              FROM biblioitems bi
              INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
              WHERE b.frameworkcode = 'CIT'
                AND EXTRACTVALUE(bi.marcxml, '//datafield[@tag="773"]/subfield[@code="w"]') IN (${numbers.map(() => '?').join(',')})
            `;
            params = numbers;
            break;
            
          case '773_x':
            query = `
              SELECT COUNT(*) as count, GROUP_CONCAT(DISTINCT bi.biblionumber) as sample_biblios
              FROM biblioitems bi
              INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
              WHERE b.frameworkcode = 'CIT'
                AND EXTRACTVALUE(bi.marcxml, '//datafield[@tag="773"]/subfield[@code="x"]') IN (${numbers.map(() => '?').join(',')})
            `;
            params = numbers;
            break;
            
          case 'url_pattern':
            query = `
              SELECT COUNT(*) as count, GROUP_CONCAT(DISTINCT bi.biblionumber) as sample_biblios
              FROM biblioitems bi
              INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
              WHERE b.frameworkcode = 'CIT'
                AND (${numbers.map(() => 'bi.url LIKE ?').join(' OR ')})
            `;
            params = numbers.map(num => `${num}-%`);
            break;
            
          case 'publishercode':
            query = `
              SELECT COUNT(*) as count, GROUP_CONCAT(DISTINCT bi.biblionumber) as sample_biblios
              FROM biblioitems bi
              INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
              WHERE b.frameworkcode = 'CIT'
                AND bi.publishercode IN (${numbers.map(() => '?').join(',')})
            `;
            params = numbers;
            break;
            
          case 'direct_biblio':
            query = `
              SELECT COUNT(*) as count, GROUP_CONCAT(DISTINCT bi.biblionumber) as sample_biblios
              FROM biblioitems bi
              INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
              WHERE b.frameworkcode = 'CIT'
                AND b.biblionumber IN (${numbers.map(() => '?').join(',')})
            `;
            params = numbers.map(num => parseInt(num));
            break;
        }
        
        const [methodResult] = await connection.execute(query, params);
        results.searchResults[method] = (methodResult as any[])[0];
        
      } catch (error) {
        results.searchResults[method] = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('🚨 DEBUG endpoint error:', error);
    return NextResponse.json(
      { error: 'Debug analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}