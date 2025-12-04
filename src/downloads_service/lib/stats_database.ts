import mysql from 'mysql2/promise';

// Stats database configuration (separate from the main Koha database)
const statsDbConfig = {
  host: process.env.STATS_DB_HOST || '127.0.0.1',
  port: parseInt(process.env.STATS_DB_PORT || '3306'),
  user: process.env.STATS_DB_USER || 'root',
  password: process.env.STATS_DB_PASS || '',
  database: process.env.STATS_DB_NAME || 'stats',
};

// Koha database configuration (for biblio details)
const kohaDbConfig = {
  host: process.env.DB_HOST_BIB || '127.0.0.1',
  port: parseInt(process.env.DB_PORT_BIB || '3306'),
  user: process.env.DB_USER_BIB || 'root',
  password: process.env.DB_PASS_BIB || '',
  database: process.env.DB_NAME_BIB || 'koha',
};

// Create connection pool for stats database
const statsPool = mysql.createPool({
  ...statsDbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Create connection pool for koha database
const kohaPool = mysql.createPool({
  ...kohaDbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test stats database connection
export async function testStatsConnection(): Promise<boolean> {
  try {
    const connection = await statsPool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Stats database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Stats database connection failed:', error);
    return false;
  }
}

// Test koha database connection
export async function testKohaConnection(): Promise<boolean> {
  try {
    const connection = await kohaPool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Koha database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Koha database connection failed:', error);
    return false;
  }
}

// Execute query on stats database with error handling
export async function executeStatsQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
  try {
    console.log('Executing stats query:', query);
    console.log('With params:', params);
    
    const [rows] = await statsPool.execute(query, params);
    console.log('Query successful, rows returned:', Array.isArray(rows) ? rows.length : 'Not an array');
    
    return rows as T[];
  } catch (error) {
    console.error('Stats database query error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        throw new Error('Stats database connection failed. Please check if MySQL server is running.');
      }
      if (error.message.includes('Access denied')) {
        throw new Error('Stats database access denied. Please check username and password.');
      }
      if (error.message.includes('Unknown database')) {
        throw new Error('Database "stats" not found. Please check database name.');
      }
    }
    
    throw error;
  }
}

// Execute query on koha database with error handling
export async function executeKohaQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
  try {
    console.log('Executing koha query:', query);
    console.log('With params:', params);
    
    const [rows] = await kohaPool.execute(query, params);
    console.log('Query successful, rows returned:', Array.isArray(rows) ? rows.length : 'Not an array');
    
    return rows as T[];
  } catch (error) {
    console.error('Koha database query error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        throw new Error('Koha database connection failed. Please check if MySQL server is running.');
      }
      if (error.message.includes('Access denied')) {
        throw new Error('Koha database access denied. Please check username and password.');
      }
      if (error.message.includes('Unknown database')) {
        throw new Error('Database "koha" not found. Please check database name.');
      }
    }
    
    throw error;
  }
}

// Get connection for transactions
export async function getStatsConnection() {
  return await statsPool.getConnection();
}

export async function getKohaConnection() {
  return await kohaPool.getConnection();
}

export { statsPool, kohaPool };
