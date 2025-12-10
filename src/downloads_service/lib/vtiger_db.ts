import { executeJournalQuery, testJournalConnection } from '@/lib/journal_db';

/**
 * Execute a query on the vtiger database (using existing journal_db connection)
 */
export async function executeVtigerQuery<T>(query: string, params: any[] = []): Promise<T[]> {
  try {
    console.log('🔍 Executing vtiger query:', query);
    console.log('📊 With params:', params);
    const rows = await executeJournalQuery<T>(query, params);
    console.log('✅ Vtiger query returned', rows.length, 'rows');
    return rows;
  } catch (error) {
    console.error('❌ Error executing vtiger query:', error);
    throw error;
  }
}

/**
 * Test vtiger database connection
 */
export async function testVtigerConnection(): Promise<boolean> {
  try {
    const result = await testJournalConnection();
    console.log('🔗 Vtiger connection test:', result ? '✅ Success' : '❌ Failed');
    return result;
  } catch (error) {
    console.error('❌ Vtiger database connection failed:', error);
    return false;
  }
}

/**
 * Get magazine details from vtiger by magazine number
 */
export async function getMagazineFromVtiger(magazineNumber: string): Promise<{
  magazineName?: string;
  categoryC?: string;
  publisher?: string;
} | null> {
  try {
    const numericMagazineNumber = parseInt(magazineNumber);
    console.log(`🔍 Fetching single magazine from vtiger: ${magazineNumber} (numeric: ${numericMagazineNumber})`);
    
    const query = `
      SELECT 
        a.accountname AS magazineName,
        cf.cf_939 AS categoryC,
        cf.cf_703 AS publisher
      FROM vtiger_account a
      LEFT JOIN vtiger_accountscf cf ON a.accountid = cf.accountid
      WHERE CAST(a.employees AS UNSIGNED) = ?
      LIMIT 1
    `;
    
    const results = await executeVtigerQuery<any>(query, [numericMagazineNumber]);
    console.log(`📊 Single magazine query returned ${results.length} results for magazine ${magazineNumber}`);
    
    if (results.length > 0) {
      console.log(`✅ Found magazine: ${results[0].magazineName}, Category C: ${results[0].categoryC}`);
      return {
        magazineName: results[0].magazineName,
        categoryC: results[0].categoryC,
        publisher: results[0].publisher,
      };
    }
    
    console.log(`⚠️ No vtiger data found for magazine ${magazineNumber}`);
    return null;
  } catch (error) {
    console.error('❌ Error fetching magazine from vtiger:', magazineNumber, error);
    return null;
  }
}

/**
 * Get multiple magazines from vtiger by magazine numbers
 */
export async function getMagazinesFromVtiger(magazineNumbers: string[]): Promise<Map<string, {
  magazineName?: string;
  categoryC?: string;
  publisher?: string;
}>> {
  const magazineMap = new Map<string, { magazineName?: string; categoryC?: string; publisher?: string }>();
  
  console.log(`🔍 Fetching ${magazineNumbers.length} magazines from vtiger...`);
  console.log(`📋 Magazine numbers requested:`, magazineNumbers.slice(0, 10), magazineNumbers.length > 10 ? `... and ${magazineNumbers.length - 10} more` : '');
  
  if (magazineNumbers.length === 0) {
    console.log('⚠️ No magazine numbers provided to vtiger query');
    return magazineMap;
  }
  
  try {
    // Convert to numeric and filter valid numbers
    const numericNumbers = magazineNumbers
      .map(num => parseInt(num))
      .filter(num => !isNaN(num));
    
    console.log(`🔢 Converted to numeric: ${numericNumbers.length} valid numbers`);
    console.log(`📊 Numeric values:`, numericNumbers.slice(0, 10), numericNumbers.length > 10 ? `... and ${numericNumbers.length - 10} more` : '');
    
    if (numericNumbers.length === 0) {
      console.log('⚠️ No valid numeric magazine numbers after conversion');
      return magazineMap;
    }
    
    // Batch queries to avoid "too many placeholders" error
    // MySQL limit is typically 65535, we'll use batches of 1000 to be safe
    const batchSize = 1000;
    const batches = [];
    for (let i = 0; i < numericNumbers.length; i += batchSize) {
      batches.push(numericNumbers.slice(i, i + batchSize));
    }
    
    console.log(`🔍 Processing ${batches.length} batches of magazines...`);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const placeholders = batch.map(() => '?').join(',');
      
      const query = `
        SELECT 
          a.employees AS magazineNumber,
          a.accountname AS magazineName,
          cf.cf_939 AS categoryC,
          cf.cf_703 AS publisher
        FROM vtiger_account a
        LEFT JOIN vtiger_accountscf cf ON a.accountid = cf.accountid
        WHERE CAST(a.employees AS UNSIGNED) IN (${placeholders})
      `;
      
      console.log(`🔍 Batch ${batchIndex + 1}/${batches.length}: Querying ${batch.length} magazines...`);
      const results = await executeVtigerQuery<any>(query, batch);
      console.log(`✅ Batch ${batchIndex + 1} returned ${results.length} results`);
      
      for (const row of results) {
        const magNum = row.magazineNumber?.toString().padStart(4, '0');
        if (magNum) {
          magazineMap.set(magNum, {
            magazineName: row.magazineName,
            categoryC: row.categoryC,
            publisher: row.publisher,
          });
        }
      }
    }
    
    console.log(`🎯 Final vtiger map size: ${magazineMap.size} magazines with data from ${batches.length} batches`);
  } catch (error) {
    console.error('❌ Error fetching magazines from vtiger:', error);
  }
  
  return magazineMap;
}
