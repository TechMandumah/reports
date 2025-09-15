import { NextRequest, NextResponse } from 'next/server';
import { testCitationConnection, executeCitationQuery } from '@/lib/citation_db';

export async function GET(request: NextRequest) {
  const testId = `test-${Date.now()}`;
  
  try {
    console.log(`🧪 [${testId}] Starting citation database connection test...`);
    console.log(`🌍 [${testId}] Environment:`, process.env.NODE_ENV);
    console.log(`📋 [${testId}] Database config:`, {
      host: process.env.DB_HOST_CIT || '127.0.0.1',
      port: process.env.DB_PORT_CIT || '3306',
      database: process.env.DB_NAME_CIT || 'koha_citation',
      user: process.env.DB_USER_CIT || 'root'
    });

    // Test basic connection
    console.log(`🔗 [${testId}] Testing basic connection...`);
    const isConnected = await testCitationConnection();
    
    if (!isConnected) {
      console.error(`❌ [${testId}] Basic connection test failed`);
      return NextResponse.json({
        success: false,
        error: 'Citation database connection failed',
        testId: testId,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    console.log(`✅ [${testId}] Basic connection test passed`);

    // Test count query
    console.log(`🔍 [${testId}] Testing count query...`);
    const countQuery = `
      SELECT COUNT(*) as total_records
      FROM biblioitems bi
      INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
      WHERE b.frameworkcode = 'CIT'
    `;
    
    const countResult = await executeCitationQuery(countQuery);
    const totalRecords = countResult[0]?.total_records || 0;
    console.log(`📊 [${testId}] Total CIT records:`, totalRecords);

    // Test MARC XML count
    console.log(`🔍 [${testId}] Testing MARC XML count...`);
    const marcCountQuery = `
      SELECT COUNT(*) as marc_records
      FROM biblioitems bi
      INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
      WHERE b.frameworkcode = 'CIT'
        AND bi.marcxml IS NOT NULL
        AND bi.marcxml != ''
    `;
    
    const marcCountResult = await executeCitationQuery(marcCountQuery);
    const marcRecords = marcCountResult[0]?.marc_records || 0;
    console.log(`📊 [${testId}] Records with MARC XML:`, marcRecords);

    // Test sample record
    console.log(`🔍 [${testId}] Testing sample record query...`);
    const sampleQuery = `
      SELECT 
        b.biblionumber,
        b.author,
        b.title,
        LENGTH(bi.marcxml) as marcxml_length,
        bi.url
      FROM biblioitems bi
      INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
      WHERE b.frameworkcode = 'CIT'
        AND bi.marcxml IS NOT NULL
        AND bi.marcxml != ''
      LIMIT 1
    `;
    
    const sampleResult = await executeCitationQuery(sampleQuery);
    const sampleRecord = sampleResult[0] || null;
    console.log(`📝 [${testId}] Sample record:`, sampleRecord);

    console.log(`✅ [${testId}] All tests completed successfully`);

    return NextResponse.json({
      success: true,
      testId: testId,
      timestamp: new Date().toISOString(),
      results: {
        connectionTest: true,
        totalRecords: totalRecords,
        marcRecords: marcRecords,
        marcPercentage: totalRecords > 0 ? ((marcRecords / totalRecords) * 100).toFixed(2) + '%' : '0%',
        sampleRecord: sampleRecord ? {
          biblionumber: sampleRecord.biblionumber,
          hasAuthor: !!sampleRecord.author,
          hasTitle: !!sampleRecord.title,
          marcxmlLength: sampleRecord.marcxml_length,
          hasUrl: !!sampleRecord.url
        } : null
      }
    });

  } catch (error) {
    console.error(`❌ [${testId}] Citation database test failed:`, error);
    console.error(`❌ [${testId}] Error details:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      testId: testId,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
