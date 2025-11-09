import { Job, JobResult } from '@/types/jobs';
import { getAllMagazinesData, getAllConferencesData, generatePredefinedReport, generateCustomReport, generateHierarchicalAuthorsReport, generateCustomEstenadReport } from '@/services/reportService';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import jobQueue from '@/lib/jobQueue';
import { sendJobCompletionEmail } from '@/lib/emailService';
import { exportToExcel } from '@/utils/excelExport';
import { exportCustomEstenadToExcel } from '@/utils/excelExport';

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'exports');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function processJob(job: Job): Promise<JobResult> {
  console.log(`🔄 Processing job ${job.id} of type ${job.type}`);
  
  try {
    let result: JobResult;
    
    switch (job.type) {
      case 'magazines_export':
        result = await processMagazinesExport(job);
        break;
      case 'conferences_export':
        result = await processConferencesExport(job);
        break;
      case 'custom_report':
        result = await processCustomReport(job);
        break;
      case 'general_report':
        result = await processGeneralReport(job);
        break;
      case 'citation_report':
        result = await processCitationReport(job);
        break;
      case 'estenad_report':
        result = await processEstenadReport(job);
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
    
    // If successful, send email with the file
    if (result.success && result.filePath && result.fileName) {
      console.log(`📧 Sending completion email for job ${job.id}`);
      await sendJobCompletionEmail(
        job.userEmail,
        job.type,
        result.fileName,
        result.filePath,
        result.recordCount
      );
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ Error processing job ${job.id}:`, error);
    
    // Send failure email
    await sendJobCompletionEmail(
      job.userEmail,
      job.type,
      'Export Failed',
      null,
      0,
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function processMagazinesExport(job: Job): Promise<JobResult> {
  console.log(`📊 Starting magazines export for job ${job.id}`);
  
  // Update progress
  jobQueue.updateJobProgress(job.id, 10);
  
  // Get data from database
  const magazinesData = await getAllMagazinesData();
  
  if (magazinesData.length === 0) {
    return {
      success: false,
      error: 'No magazines data found'
    };
  }
  
  jobQueue.updateJobProgress(job.id, 50);
  
  // Create Excel file
  const worksheet = XLSX.utils.json_to_sheet(magazinesData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Magazines');
  
  // Convert ID column to hyperlinks
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let row = 1; row <= range.e.r; row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 });
    const cell = worksheet[cellAddress];
    if (cell && cell.v) {
      const id = cell.v;
      cell.l = { Target: `https://jtitles.mandumah.com/index.php?module=Accounts&view=Edit&record=${id}` };
      cell.v = String(id);
    }
  }
  
  jobQueue.updateJobProgress(job.id, 80);
  
  // Save file
  const fileName = `All_Magazines_Data_${new Date().toISOString().split('T')[0]}_${job.id.substring(0, 8)}.xlsx`;
  const filePath = path.join(UPLOADS_DIR, fileName);
  
  XLSX.writeFile(workbook, filePath);
  
  jobQueue.updateJobProgress(job.id, 100);
  
  console.log(`✅ Magazines export completed: ${fileName} (${magazinesData.length} records)`);
  
  return {
    success: true,
    filePath,
    fileName,
    recordCount: magazinesData.length
  };
}

async function processConferencesExport(job: Job): Promise<JobResult> {
  console.log(`📊 Starting conferences export for job ${job.id}`);
  
  // Update progress
  jobQueue.updateJobProgress(job.id, 10);
  
  // Get data from database
  const conferencesData = await getAllConferencesData();
  
  if (conferencesData.length === 0) {
    return {
      success: false,
      error: 'No conferences data found'
    };
  }
  
  jobQueue.updateJobProgress(job.id, 50);
  
  // Create Excel file
  const worksheet = XLSX.utils.json_to_sheet(conferencesData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Conferences');
  
  // Convert ID column to hyperlinks
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let row = 1; row <= range.e.r; row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 });
    const cell = worksheet[cellAddress];
    if (cell && cell.v) {
      const id = cell.v;
      cell.l = { Target: `https://jtitles.mandumah.com/index.php?module=Accounts&view=Edit&record=${id}` };
      cell.v = String(id);
    }
  }
  
  jobQueue.updateJobProgress(job.id, 80);
  
  // Save file
  const fileName = `All_Conferences_Data_${new Date().toISOString().split('T')[0]}_${job.id.substring(0, 8)}.xlsx`;
  const filePath = path.join(UPLOADS_DIR, fileName);
  
  XLSX.writeFile(workbook, filePath);
  
  jobQueue.updateJobProgress(job.id, 100);
  
  console.log(`✅ Conferences export completed: ${fileName} (${conferencesData.length} records)`);
  
  return {
    success: true,
    filePath,
    fileName,
    recordCount: conferencesData.length
  };
}

async function processCustomReport(job: Job): Promise<JobResult> {
  console.log(`📊 Starting custom report for job ${job.id}`);
  
  // This is a placeholder for custom reports
  // You can extend this based on your custom report requirements
  
  return {
    success: false,
    error: 'Custom reports not implemented yet'
  };
}

async function processGeneralReport(job: Job): Promise<JobResult> {
  console.log(`📊 Starting general report for job ${job.id}`, job.parameters);
  
  try {
    // Update progress
    jobQueue.updateJobProgress(job.id, 10);

    const { reportType, urlList, startYear, endYear, filters } = job.parameters;
    
    let reportData;
    
    // Generate report data
    if (reportType === 'convert_url_to_biblio' && urlList) {
      reportData = await generatePredefinedReport(reportType, { 
        urlList,
        startYear,
        endYear
      });
    } else if (reportType === 'custom' || reportType === 'custom_report') {
      reportData = await generateCustomReport(filters || {});
    } else if (reportType === 'export_hierarchical_authors') {
      reportData = await generateHierarchicalAuthorsReport(filters || {});
    } else {
      reportData = await generatePredefinedReport(reportType, filters || {});
    }

    if (!reportData || reportData.length === 0) {
      return {
        success: false,
        error: 'No data found for the specified criteria'
      };
    }

    jobQueue.updateJobProgress(job.id, 50);

    // Create Excel file using the utility function
    const fileName = `${reportType}_export_${new Date().toISOString().split('T')[0]}_${job.id.substring(0, 8)}.xlsx`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Data');

    jobQueue.updateJobProgress(job.id, 80);

    // Save file
    XLSX.writeFile(workbook, filePath);

    jobQueue.updateJobProgress(job.id, 100);

    console.log(`✅ General report export completed: ${fileName} (${reportData.length} records)`);

    return {
      success: true,
      filePath,
      fileName,
      recordCount: reportData.length
    };

  } catch (error) {
    console.error(`❌ Error in processGeneralReport:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function processCitationReport(job: Job): Promise<JobResult> {
  console.log(`📊 Starting citation report for job ${job.id}`, job.parameters);
  
  try {
    // Update progress
    jobQueue.updateJobProgress(job.id, 10);

    const { magazineNumbers, startYear, endYear, selectedFields, biblioNumbers, isPreview } = job.parameters;

    // Import the citation report service directly instead of making HTTP calls
    // This avoids circular dependencies and localhost issues
    const { getCitationConnection } = await import('@/lib/citation_db');
    const mysql = await import('mysql2/promise');
    const XLSX = await import('xlsx');

    jobQueue.updateJobProgress(job.id, 30);

    // Generate citation report data directly (similar to the API logic)
    const connection = await getCitationConnection();
    
    let query = `
      SELECT biblionumber, marcxml 
      FROM biblioitems 
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    
    if (magazineNumbers && magazineNumbers.length > 0) {
      const placeholders = magazineNumbers.map(() => '?').join(',');
      query += ` AND SUBSTRING(biblionumber, 1, 4) IN (${placeholders})`;
      queryParams.push(...magazineNumbers);
    }
    
    if (biblioNumbers && biblioNumbers.length > 0) {
      const placeholders = biblioNumbers.map(() => '?').join(',');
      query += ` AND biblionumber IN (${placeholders})`;
      queryParams.push(...biblioNumbers);
    }
    
    if (startYear) {
      query += ` AND YEAR(STR_TO_DATE(SUBSTRING_INDEX(SUBSTRING_INDEX(marcxml, '<datafield tag="260"', -1), '</datafield>', 1), '%Y')) >= ?`;
      queryParams.push(parseInt(startYear));
    }
    
    if (endYear) {
      query += ` AND YEAR(STR_TO_DATE(SUBSTRING_INDEX(SUBSTRING_INDEX(marcxml, '<datafield tag="260"', -1), '</datafield>', 1), '%Y')) <= ?`;
      queryParams.push(parseInt(endYear));
    }

    query += ` LIMIT 100000`; // Safety limit
    
    const [rows] = await connection.execute(query, queryParams);
    
    await connection.end();

    jobQueue.updateJobProgress(job.id, 70);

    // Process the data (simplified version)
    const processedData = (rows as any[]).map(row => ({
      biblionumber: row.biblionumber,
      // Add more processing as needed
      rawData: row.marcxml ? row.marcxml.substring(0, 100) + '...' : ''
    }));

    // Create Excel file
    const worksheet = XLSX.utils.json_to_sheet(processedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Citation Report');

    const fileName = `citation_report_${new Date().toISOString().split('T')[0]}_${job.id.substring(0, 8)}.xlsx`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    XLSX.writeFile(workbook, filePath);

    jobQueue.updateJobProgress(job.id, 100);

    console.log(`✅ Citation report export completed: ${fileName} (${processedData.length} records)`);

    return {
      success: true,
      filePath,
      fileName,
      recordCount: processedData.length
    };

  } catch (error) {
    console.error(`❌ Error in processCitationReport:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function processEstenadReport(job: Job): Promise<JobResult> {
  console.log(`📊 Starting estenad report for job ${job.id}`, job.parameters);
  
  try {
    // Update progress
    jobQueue.updateJobProgress(job.id, 10);

    const { reportType, authorIds, biblioNumbers, selectedFields, isPreview } = job.parameters;

    // Call the estenad report generation service directly
    const reportData = await generateCustomEstenadReport({
      authorIds,
      biblioNumbers,
      selectedFields,
      isPreview: false
    });

    if (!reportData || reportData.length === 0) {
      return {
        success: false,
        error: 'No data found for the specified criteria'
      };
    }

    jobQueue.updateJobProgress(job.id, 50);

    // Create Excel file
    const fileName = `estenad_report_${new Date().toISOString().split('T')[0]}_${job.id.substring(0, 8)}.xlsx`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    // Create workbook with proper formatting
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estenad Report');

    jobQueue.updateJobProgress(job.id, 80);

    // Save file
    XLSX.writeFile(workbook, filePath);

    jobQueue.updateJobProgress(job.id, 100);

    console.log(`✅ Estenad report export completed: ${fileName} (${reportData.length} records)`);

    return {
      success: true,
      filePath,
      fileName,
      recordCount: reportData.length
    };

  } catch (error) {
    console.error(`❌ Error in processEstenadReport:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Clean up old files (call this periodically)
export function cleanupOldFiles(olderThanDays: number = 7): void {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    let cleanedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(UPLOADS_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🗑️ Cleaned up ${cleanedCount} old export files`);
    }
  } catch (error) {
    console.error('Error cleaning up old files:', error);
  }
}