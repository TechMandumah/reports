import mysql from 'mysql2/promise';

// Vtiger database configuration
const vtigerDbConfig = {
  host: process.env.DB_HOST_JOURNAL || '127.0.0.1',
  port: parseInt(process.env.DB_PORT_JOURNAL || '3306'),
  user: process.env.DB_USER_JOURNAL || 'root',
  password: process.env.DB_PASS_JOURNAL || '',
  database: process.env.DB_NAME_JOURNAL || 'vtiger',
};

// Create connection pool for vtiger database
const vtigerPool = mysql.createPool({
  ...vtigerDbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * Execute a query on the vtiger database
 */
export async function executeVtigerQuery<T>(query: string, params: any[] = []): Promise<T[]> {
  try {
    const [rows] = await vtigerPool.execute(query, params);
    return rows as T[];
  } catch (error) {
    console.error('Error executing vtiger query:', error);
    throw error;
  }
}

/**
 * Test vtiger database connection
 */
export async function testVtigerConnection(): Promise<boolean> {
  try {
    await vtigerPool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Vtiger database connection failed:', error);
    return false;
  }
}

/**
 * Get magazine details from vtiger by magazine number
 */
export async function getMagazineFromVtiger(magazineNumber: string): Promise<{
  magazineName?: string;
  categoryC?: string;
  issn?: string;
} | null> {
  try {
    const numericMagazineNumber = parseInt(magazineNumber);
    
    const query = `
      SELECT 
        a.accountname AS magazineName,
        cf.cf_939 AS categoryC,
        cf.cf_709 AS issn
      FROM vtiger_account a
      LEFT JOIN vtiger_accountscf cf ON a.accountid = cf.accountid
      WHERE CAST(a.employees AS UNSIGNED) = ?
      LIMIT 1
    `;
    
    const results = await executeVtigerQuery<any>(query, [numericMagazineNumber]);
    
    if (results.length > 0) {
      return {
        magazineName: results[0].magazineName,
        categoryC: results[0].categoryC,
        issn: results[0].issn,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching magazine from vtiger:', magazineNumber, error);
    return null;
  }
}

/**
 * Get multiple magazines from vtiger by magazine numbers
 */
export async function getMagazinesFromVtiger(magazineNumbers: string[]): Promise<Map<string, {
  magazineName?: string;
  categoryC?: string;
  issn?: string;
}>> {
  const magazineMap = new Map<string, { magazineName?: string; categoryC?: string; issn?: string }>();
  
  if (magazineNumbers.length === 0) {
    return magazineMap;
  }
  
  try {
    // Convert to numeric and filter valid numbers
    const numericNumbers = magazineNumbers
      .map(num => parseInt(num))
      .filter(num => !isNaN(num));
    
    if (numericNumbers.length === 0) {
      return magazineMap;
    }
    
    const placeholders = numericNumbers.map(() => '?').join(',');
    
    const query = `
      SELECT 
        a.employees AS magazineNumber,
        a.accountname AS magazineName,
        cf.cf_939 AS categoryC,
        cf.cf_709 AS issn
      FROM vtiger_account a
      LEFT JOIN vtiger_accountscf cf ON a.accountid = cf.accountid
      WHERE CAST(a.employees AS UNSIGNED) IN (${placeholders})
    `;
    
    const results = await executeVtigerQuery<any>(query, numericNumbers);
    
    for (const row of results) {
      const magNum = row.magazineNumber?.toString().padStart(4, '0');
      if (magNum) {
        magazineMap.set(magNum, {
          magazineName: row.magazineName,
          categoryC: row.categoryC,
          issn: row.issn,
        });
      }
    }
  } catch (error) {
    console.error('Error fetching magazines from vtiger:', error);
  }
  
  return magazineMap;
}
