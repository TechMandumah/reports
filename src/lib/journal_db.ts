import mysql from 'mysql2/promise';

// Journal Database (vtiger) configuration
const journalDbConfig = {
  host: process.env.DB_HOST_JNL || '127.0.0.1',
  port: parseInt(process.env.DB_PORT_JNL || '3306'),
  user: process.env.DB_USER_JNL || 'root',
  password: process.env.DB_PASS_JNL || '',
  database: process.env.DB_NAME_JNL || 'vtiger',
};

// Create connection pool for journal database
const journalPool = mysql.createPool({
  ...journalDbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test journal database connection
export async function testJournalConnection(): Promise<boolean> {
  try {
    const connection = await journalPool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Journal database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Journal database connection failed:', error);
    return false;
  }
}

// Execute query on journal database with error handling
export async function executeJournalQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
  try {
    console.log('Executing journal query:', query);
    console.log('With params:', params);
    
    const [rows] = await journalPool.execute(query, params);
    console.log('Journal query successful, rows returned:', Array.isArray(rows) ? rows.length : 'Not an array');
    
    return rows as T[];
  } catch (error) {
    console.error('Journal database query error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    
    // Check if it's a connection error
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        throw new Error('Journal database connection failed. Please check if MySQL server is running.');
      }
      if (error.message.includes('Access denied')) {
        throw new Error('Journal database access denied. Please check username and password.');
      }
      if (error.message.includes('Unknown database')) {
        throw new Error('Database "vtiger" not found. Please check database name.');
      }
    }
    
    throw error;
  }
}

// Get connection for transactions
export async function getJournalConnection() {
  return await journalPool.getConnection();
}

export default journalPool;
