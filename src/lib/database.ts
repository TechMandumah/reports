import mysql from 'mysql2/promise';

// Database configuration
// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST_BIB,
  port: parseInt(process.env.DB_PORT_BIB || '3306', 10),
  user: process.env.DB_USER_BIB,
  password: process.env.DB_PASS_BIB,
  database: process.env.DB_NAME_BIB,
  connectionLimit: 10,
  queueLimit: 0,
  // Removed deprecated acquireTimeout and timeout options
};

// Create connection pool for better performance
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Execute query with error handling
export async function executeQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
  try {
    console.log('Executing query:', query);
    console.log('With params:', params);
    
    const [rows] = await pool.execute(query, params);
    console.log('Query successful, rows returned:', Array.isArray(rows) ? rows.length : 'Not an array');
    
    return rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    
    // Check if it's a connection error
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        throw new Error('Database connection failed. Please check if MySQL server is running.');
      }
      if (error.message.includes('Access denied')) {
        throw new Error('Database access denied. Please check username and password.');
      }
      if (error.message.includes('Unknown database')) {
        throw new Error('Database "koha" not found. Please check database name.');
      }
    }
    
    throw error;
  }
}

// Get connection for transactions
export async function getConnection() {
  return await pool.getConnection();
}

export default pool;
