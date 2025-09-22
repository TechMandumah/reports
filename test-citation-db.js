// Test file to verify citation database connection and performance
// Run with: node test-citation-db.js

const mysql = require('mysql2/promise');
require('dotenv').config();

const citationDbConfig = {
  host: process.env.DB_HOST_CIT || '127.0.0.1',
  port: parseInt(process.env.DB_PORT_CIT || '3306'),
  user: process.env.DB_USER_CIT || 'root',
  password: process.env.DB_PASS_CIT || '',
  database: process.env.DB_NAME_CIT || 'koha_citation',
  // connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '20'),
  // queueLimit: 0,
  // acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'),
  // idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '300000'),
  // reconnect: true,
  // connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '60000'),
  // multipleStatements: false,
  // timezone: '+00:00'
};

async function testCitationDB() {
  console.log('=== Citation Database Test ===');
  console.log('📅 Test started at:', new Date().toISOString());
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
  console.log('📋 Configuration:', {
    host: citationDbConfig.host,
    port: citationDbConfig.port,
    database: citationDbConfig.database,
    user: citationDbConfig.user,
    // connectionLimit: citationDbConfig.connectionLimit,
    // timeouts: {
    //   connect: citationDbConfig.connectTimeout,
    //   acquire: citationDbConfig.acquireTimeout,
    //   idle: citationDbConfig.idleTimeout
    // }
  });
  
  let connection;
  
  try {
    console.log('\n🔗 Step 1: Testing basic connection...');
    const connectionStart = Date.now();
    connection = await mysql.createConnection(citationDbConfig);
    const connectionTime = Date.now() - connectionStart;
    console.log(`✅ Connection established in ${connectionTime}ms`);
    
    console.log('\n🏓 Step 2: Testing ping...');
    const pingStart = Date.now();
    await connection.ping();
    const pingTime = Date.now() - pingStart;
    console.log(`✅ Ping successful in ${pingTime}ms`);
    
    console.log('\n📊 Step 3: Testing basic count query...');
    const countStart = Date.now();
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM biblioitems bi
      INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
      WHERE b.frameworkcode = 'CIT'
    `;
    
    const [countResult] = await connection.execute(countQuery);
    const countTime = Date.now() - countStart;
    console.log(`✅ Count query completed in ${countTime}ms`);
    console.log('📈 Total CIT records:', countResult[0].count);
    
    console.log('\n📊 Step 4: Testing MARC XML count...');
    const marcCountStart = Date.now();
    const marcCountQuery = `
      SELECT COUNT(*) as count 
      FROM biblioitems bi
      INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
      WHERE b.frameworkcode = 'CIT'
        AND bi.marcxml IS NOT NULL
        AND bi.marcxml != ''
    `;
    
    const [marcCountResult] = await connection.execute(marcCountQuery);
    const marcCountTime = Date.now() - marcCountStart;
    console.log(`✅ MARC count query completed in ${marcCountTime}ms`);
    console.log('📈 Records with MARC XML:', marcCountResult[0].count);
    
    const totalRecords = countResult[0].count;
    const marcRecords = marcCountResult[0].count;
    const marcPercentage = totalRecords > 0 ? ((marcRecords / totalRecords) * 100).toFixed(2) : 0;
    console.log('📊 MARC XML coverage:', `${marcPercentage}%`);
    
    console.log('\n📝 Step 5: Testing sample record query...');
    const sampleStart = Date.now();
    const sampleQuery = `
      SELECT 
        b.biblionumber,
        b.author as biblio_author,
        b.title as biblio_title,
        b.copyrightdate,
        LENGTH(bi.marcxml) as marcxml_length,
        bi.url
      FROM biblioitems bi
      INNER JOIN biblio b ON bi.biblionumber = b.biblionumber
      WHERE b.frameworkcode = 'CIT'
        AND bi.marcxml IS NOT NULL
        AND bi.marcxml != ''
      LIMIT 3
    `;
    
    const [sampleResult] = await connection.execute(sampleQuery);
    const sampleTime = Date.now() - sampleStart;
    console.log(`✅ Sample query completed in ${sampleTime}ms`);
    console.log('📝 Sample records found:', sampleResult.length);
    
    if (sampleResult.length > 0) {
      sampleResult.forEach((record, index) => {
        console.log(`📄 Sample ${index + 1}:`, {
          biblionumber: record.biblionumber,
          author: record.biblio_author?.substring(0, 50) + (record.biblio_author?.length > 50 ? '...' : ''),
          title: record.biblio_title?.substring(0, 50) + (record.biblio_title?.length > 50 ? '...' : ''),
          year: record.copyrightdate,
          marcxmlSize: `${record.marcxml_length} bytes`,
          url: record.url
        });
      });
    }
    
    console.log('\n🎯 Step 6: Testing citation report query (limited)...');
    const reportStart = Date.now();
    const reportQuery = `
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
        AND bi.marcxml != ''
      LIMIT 10
    `;
    
    const [reportResult] = await connection.execute(reportQuery);
    const reportTime = Date.now() - reportStart;
    console.log(`✅ Report query completed in ${reportTime}ms`);
    console.log('📊 Report query results:', reportResult.length);
    
    if (reportResult.length > 0) {
      const avgMarcSize = reportResult.reduce((sum, record) => sum + (record.marcxml?.length || 0), 0) / reportResult.length;
      console.log('📊 Average MARC XML size:', `${Math.round(avgMarcSize)} bytes`);
    }
    
    console.log('\n✅ All tests completed successfully!');
    console.log('🎉 Citation database is working properly');
    
    // Summary
    console.log('\n📋 Test Summary:');
    console.log(`  - Connection time: ${connectionTime}ms`);
    console.log(`  - Ping time: ${pingTime}ms`);
    console.log(`  - Count query time: ${countTime}ms`);
    console.log(`  - MARC count query time: ${marcCountTime}ms`);
    console.log(`  - Sample query time: ${sampleTime}ms`);
    console.log(`  - Report query time: ${reportTime}ms`);
    console.log(`  - Total records: ${totalRecords}`);
    console.log(`  - MARC XML records: ${marcRecords} (${marcPercentage}%)`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Suggestion: Check if MySQL server is running');
    } else if (error.message.includes('Access denied')) {
      console.error('💡 Suggestion: Check database credentials');
    } else if (error.message.includes('Unknown database')) {
      console.error('💡 Suggestion: Check if database exists');
    } else if (error.message.includes('timeout')) {
      console.error('💡 Suggestion: Check network connectivity and timeouts');
    }
    
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log('🔗 Connection closed');
      } catch (closeError) {
        console.error('❌ Error closing connection:', closeError);
      }
    }
  }
  
  console.log('📅 Test completed at:', new Date().toISOString());
}

// Run the test
if (require.main === module) {
  testCitationDB().catch(console.error);
}

module.exports = { testCitationDB };
