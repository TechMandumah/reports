import mysql from 'mysql2/promise';

// Citation Database configuration

const citationDbConfig = {
  host: process.env.DB_HOST_CIT || '127.0.0.1',
  port: parseInt(process.env.DB_PORT_CIT || '3306'),
  user: process.env.DB_USER_CIT || 'root',
  password: process.env.DB_PASS_CIT || '',
  database: process.env.DB_NAME_CIT ||  'koha_citation',
  // Timeout configurations for large citation queries
  acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'), // 60 seconds to acquire connection
  timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '1200000'), // 20 minutes for queries
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '60000'), // 60 seconds to connect
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '300000'), // 5 minutes idle timeout
  reconnect: true,
  multipleStatements: false,
  timezone: '+00:00'
};

// Create connection pool for better performance
const citationPool = mysql.createPool({
  ...citationDbConfig,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '20'),
  queueLimit: 0
});

// Test citation database connection
export async function testCitationConnection(): Promise<boolean> {
  console.log('🔍 Testing citation database connection...');
  console.log('📋 Citation DB Config:', {
    host: process.env.DB_HOST_CIT || '127.0.0.1',
    port: parseInt(process.env.DB_PORT_CIT || '3306'),
    user: process.env.DB_USER_CIT || 'root',
    database: process.env.DB_NAME_CIT || 'koha_citation',
    // connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '20'),
    // connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '60000'),
    // acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'),
    // idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '300000')
  });
  
  try {
    console.log('🔗 Attempting to get connection from pool...');
    const startTime = Date.now();
    const connection = await citationPool.getConnection();
    const connectTime = Date.now() - startTime;
    console.log(`✅ Got connection in ${connectTime}ms`);
    
    console.log('🏓 Pinging database...');
    const pingStart = Date.now();
    await connection.ping();
    const pingTime = Date.now() - pingStart;
    console.log(`✅ Ping successful in ${pingTime}ms`);
    
    connection.release();
    console.log('✅ Citation database connection successful - Total time:', Date.now() - startTime, 'ms');
    return true;
  } catch (error) {
    console.error('❌ Citation database connection failed:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      errno: (error as any)?.errno,
      sqlState: (error as any)?.sqlState,
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return false;
  }
}

// Execute query with error handling for citation database
export async function executeCitationQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
  console.log('🔍 Citation Query Start:', {
    timestamp: new Date().toISOString(),
    queryLength: query.length,
    paramsCount: params?.length || 0
  });
  console.log('📝 Citation Query:', query.substring(0, 200) + (query.length > 200 ? '...' : ''));
  console.log('📋 Citation Query Params:', params);
  
  const startTime = Date.now();
  
  try {
    console.log('🔗 Getting connection from citation pool...');
    const connectionStart = Date.now();
    const [rows] = await citationPool.execute(query, params);
    const totalTime = Date.now() - startTime;
    const connectionTime = Date.now() - connectionStart;
    
    console.log('✅ Citation query successful:', {
      totalTime: `${totalTime}ms`,
      connectionTime: `${connectionTime}ms`,
      rowsReturned: Array.isArray(rows) ? rows.length : 'Not an array',
      rowsType: typeof rows,
      timestamp: new Date().toISOString()
    });
    
    if (Array.isArray(rows) && rows.length > 0) {
      console.log('📊 Citation Query Sample Data:', {
        firstRowKeys: Object.keys(rows[0] || {}),
        hasMArcXML: !!(rows[0] as any)?.marcxml,
        marcxmlLength: (rows[0] as any)?.marcxml?.length || 0
      });
    }
    
    return rows as T[];
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error('❌ Citation database query error after', errorTime, 'ms:', error);
    console.error('❌ Citation Query Details:', {
      query: query.substring(0, 500),
      params: params,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorCode: (error as any)?.code,
      errorErrno: (error as any)?.errno,
      errorSqlState: (error as any)?.sqlState,
      timestamp: new Date().toISOString()
    });
    
    // Check if it's a connection error
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        console.error('🚫 Citation database connection refused - server may be down');
        throw new Error('Citation database connection failed. Please check if MySQL server is running.');
      }
      if (error.message.includes('Access denied')) {
        console.error('🚫 Citation database access denied - check credentials');
        throw new Error('Citation database access denied. Please check username and password.');
      }
      if (error.message.includes('Unknown database')) {
        console.error('🚫 Citation database not found');
        throw new Error('Citation database "koha" not found. Please check database name.');
      }
      if (error.message.includes('ER_HOST_NOT_PRIVILEGED')) {
        console.error('🚫 Citation database host not privileged');
        throw new Error('Citation database host not privileged. The server is not allowing connections from this IP address.');
      }
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        console.error('⏰ Citation database query timeout');
        throw new Error('Citation database query timeout. The query took too long to execute.');
      }
    }
    
    throw error;
  }
}

// Get connection for transactions
export async function getCitationConnection() {
  console.log('🔗 Requesting citation database connection...');
  console.log('📊 Citation Pool Status:', {
    timestamp: new Date().toISOString(),
    config: {
      host: process.env.DB_HOST_CIT || '127.0.0.1',
      database: process.env.DB_NAME_CIT || 'koha_citation',
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '20')
    }
  });
  
  try {
    const startTime = Date.now();
    const connection = await citationPool.getConnection();
    const connectionTime = Date.now() - startTime;
    
    console.log('✅ Citation connection acquired in', connectionTime, 'ms');
    console.log('🔍 Testing citation connection with ping...');
    
    const pingStart = Date.now();
    await connection.ping();
    const pingTime = Date.now() - pingStart;
    
    console.log('✅ Citation connection ping successful in', pingTime, 'ms');
    
    return connection;
  } catch (error) {
    console.error('❌ Failed to get citation connection:', error);
    console.error('❌ Citation Connection Error Details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      errno: (error as any)?.errno,
      stack: error instanceof Error ? error.stack?.substring(0, 500) : 'No stack trace',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

export default citationPool;
