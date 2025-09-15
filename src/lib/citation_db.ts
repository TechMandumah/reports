import mysql from 'mysql2/promise';

// Citation Database configuration

const citationDbConfig = {
  host: process.env.DB_HOST_CIT || '127.0.0.1',
  port: parseInt(process.env.DB_PORT_CIT || '3306'),
  user: process.env.DB_USER_CIT || 'root',
  password: process.env.DB_PASS_CIT || '',
  database: process.env.DB_NAME_CIT ||  'koha_citation',
  // host: 'citation.mandumah.com',
  // port: 3306,
  // user: 'salam',
  // password: 'a67tzKi',
  // database: 'koha',
  connectionLimit: 10,
  queueLimit: 0,
};

// Create connection pool for better performance
const citationPool = mysql.createPool({
  ...citationDbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test citation database connection
export async function testCitationConnection(): Promise<boolean> {
  try {
    const connection = await citationPool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Citation database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Citation database connection failed:', error);
    return false;
  }
}

// Execute query with error handling for citation database
export async function executeCitationQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
  try {
    console.log('Executing citation query:', query);
    console.log('With params:', params);
    
    const [rows] = await citationPool.execute(query, params);
    console.log('Citation query successful, rows returned:', Array.isArray(rows) ? rows.length : 'Not an array');
    
    return rows as T[];
  } catch (error) {
    console.error('Citation database query error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    
    // Check if it's a connection error
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        throw new Error('Citation database connection failed. Please check if MySQL server is running.');
      }
      if (error.message.includes('Access denied')) {
        throw new Error('Citation database access denied. Please check username and password.');
      }
      if (error.message.includes('Unknown database')) {
        throw new Error('Citation database "koha" not found. Please check database name.');
      }
      if (error.message.includes('ER_HOST_NOT_PRIVILEGED')) {
        throw new Error('Citation database host not privileged. The server is not allowing connections from this IP address.');
      }
    }
    
    throw error;
  }
}

// Get connection for transactions
export async function getCitationConnection() {
  return await citationPool.getConnection();
}

export default citationPool;
