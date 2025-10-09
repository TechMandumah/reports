import ExcelJS from 'exceljs';

// Helper function to apply abstract field filters
function filterAbstractRecords(data: ExportData[], abstractFilter?: string): ExportData[] {
  try {
    if (!abstractFilter || abstractFilter === '') {
      return data; // Return all data if no filter selected
    }

    console.log(`Applying abstract filter: ${abstractFilter} to ${data.length} records`);

    const filteredData = data.filter(row => {
      try {
        switch (abstractFilter) {
          case 'without_abstract':
            // Records with no field 520 (no abstract subfields)
            const hasAnyAbstractFields = Object.keys(row).some(key => key.startsWith('abstract_520_'));
            console.log(`without_abstract filter for biblio ${row['biblio']}:`, {
              hasAnyAbstractFields,
              abstract_520_a: row['abstract_520_a'],
              abstract_520_b: row['abstract_520_b'],
              abstract_520: row['abstract_520'],
              shouldInclude: !hasAnyAbstractFields
            });
            return !hasAnyAbstractFields;
          
          case 'missing_english':
            // Subfield 'a' is available in field 520 where 'b' and 'f' is empty
            const hasSubfieldA = row['abstract_520_a'] && row['abstract_520_a'].toString().trim() !== '';
            const hasSubfieldB = row['abstract_520_b'] && row['abstract_520_b'].toString().trim() !== '';
            const hasSubfieldF = row['abstract_520_f'] && row['abstract_520_f'].toString().trim() !== '';
            return hasSubfieldA && !hasSubfieldB && !hasSubfieldF;
          
          case 'other_language':
            // Subfield 'd' is available where all other subfields inside field 520 is empty
            const hasSubfieldD = row['abstract_520_d'] && row['abstract_520_d'].toString().trim() !== '';
            const hasOtherSubfields = Object.keys(row)
              .filter(key => key.startsWith('abstract_520_') && key !== 'abstract_520_d')
              .some(key => row[key] && row[key].toString().trim() !== '');
            return hasSubfieldD && !hasOtherSubfields;
      
      case 'mandumah_abstract':
        try {
          // More inclusive: records with abstract content but missing/empty key subfields
          const hasSubfieldAEmpty = !row['abstract_520_a'] || row['abstract_520_a'].toString().trim() === '';
          const hasSubfieldEEmpty = !row['abstract_520_e'] || row['abstract_520_e'].toString().trim() === '';
          
          // Check for any abstract content - database or MARC field
          const hasAbstract = (row['abstract_520'] && row['abstract_520'].toString().trim() !== '') ||
                             (row['abstract'] && row['abstract'].toString().trim() !== '');
          
          // Check for any 520 subfields (indicating MARC abstract structure)
          const hasAny520Subfields = Object.keys(row)
            .filter(key => key.startsWith('abstract_520_'))
            .some(key => row[key] && row[key].toString().trim() !== '');
          
          console.log(`mandumah_abstract filter for biblio ${row['biblio']}:`, {
            hasSubfieldAEmpty,
            hasSubfieldEEmpty,
            hasAbstract,
            hasAny520Subfields,
            abstract_520_a: row['abstract_520_a'],
            abstract_520_e: row['abstract_520_e'],
            abstract_520: row['abstract_520'],
            shouldInclude: (hasAbstract || hasAny520Subfields) && (hasSubfieldAEmpty || hasSubfieldEEmpty)
          });
          
          // Include if we have abstract content AND either subfield a or e is empty (more inclusive)
          return (hasAbstract || hasAny520Subfields) && (hasSubfieldAEmpty || hasSubfieldEEmpty);
        } catch (error) {
          console.warn('Error processing mandumah_abstract filter for row:', error);
          return false; // Exclude problematic rows from mandumah_abstract filter
        }
          
          default:
            return true;
        }
      } catch (error) {
        console.warn('Error processing filter for row:', error);
        return false; // Exclude problematic rows
      }
    });

    console.log(`Filter result: ${filteredData.length} records after applying ${abstractFilter} filter`);
    return filteredData;
  } catch (error) {
    console.error('Error in filterAbstractRecords:', error);
    return data; // Return original data if filtering fails
  }
}

// Helper function to create safe Excel sheet names (max 31 characters)
function createSafeSheetName(name: string): string {
  // Remove or replace invalid characters for Excel sheet names
  let safeName = name
    .replace(/[\\\/\?\*\[\]]/g, '') // Remove invalid characters
    .replace(/'/g, '') // Remove single quotes
    .trim();
  
  // Truncate to 31 characters if necessary
  if (safeName.length > 31) {
    safeName = safeName.substring(0, 31);
  }
  
  return safeName;
}

// Helper function to style the header row with blue background and white text
function styleHeaderRow(worksheet: ExcelJS.Worksheet, headerCount: number) {
  // Apply style to each header cell in the first row
  for (let col = 1; col <= headerCount; col++) {
    const cell = worksheet.getCell(1, col);
    
    // Apply header styling
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' }
    };
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.alignment = {
      horizontal: 'center'
    };
  }
}

// Define the structure for each report type
export interface ExportColumn {
  header: string;
  key: string;
}

export interface ExportData {
  url: string;
  biblio: string;
  link: string;
  [key: string]: any; // For the related fields
}

export interface ReportConfig {
  name: string;
  columns: ExportColumn[];
  isDifferentDatabase?: boolean;
}

// Define report configurations
export const reportConfigurations: Record<string, ReportConfig> = {
  export_research_titles: {
    name: "Research Titles for Review",
    columns: [
      { header: "URL", key: "url" },
      { header: "Biblio", key: "biblio" },
      { header: "Biblio Details", key: "biblio_details" },
      { header: "Title 245 (1)(a)", key: "title_245_1_a" },
      // { header: "Title 245 (1)(b)", key: "title_245_1_b" },
      { header: "Title 246 (1)(a)", key: "title_246_1_a" },
      // { header: "Title 246 (1)(b)", key: "title_246_1_b" },
      { header: "Title 246 (2)(a)", key: "title_246_2_a" },
      // { header: "Title 246 (2)(b)", key: "title_246_2_b" },
      { header: "Title 246 (3)(a)", key: "title_246_3_a" },
      // { header: "Title 246 (3)(b)", key: "title_246_3_b" },
      { header: "Title 242 (1)(a)", key: "title_242_1_a" },
      // { header: "Title 242 (1)(b)", key: "title_242_1_b" },
      { header: "Language 041", key: "language_041" },
    ]
  },
  export_research_authors: {
    name: "Research Authors for Review",
    columns: [
  { header: "URL", key: "url" },
  { header: "Biblio", key: "biblio" },
  { header: "Biblio Details", key: "biblio_details" },
  // Main Author (100) - all subfields
  { header: "100_a (Main Author)", key: "author" },
  { header: "100_g (Main Author Dates)", key: "author_g" },
  { header: "100_q (Main Author Fuller Form)", key: "author_q" },
  { header: "100_e (Main Author Relator)", key: "author_e" },
  { header: "100_9 (Main Author ID)", key: "author_id" },
  // Additional Author 1 (700_1) - all subfields
  { header: "700_1_a (Add Author 1)", key: "additional_author" },
  { header: "700_1_g (Add Author 1 Dates)", key: "additional_author_g" },
  { header: "700_1_q (Add Author 1 Fuller Form)", key: "additional_author_q" },
  { header: "700_1_e (Add Author 1 Relator)", key: "additional_author_e" },
  { header: "700_1_9 (Add Author 1 ID)", key: "additional_author_id" },
  // Additional Author 2 (700_2) - all subfields
  { header: "700_2_a (Add Author 2)", key: "additional_author_2" },
  { header: "700_2_g (Add Author 2 Dates)", key: "additional_author_2_g" },
  { header: "700_2_q (Add Author 2 Fuller Form)", key: "additional_author_2_q" },
  { header: "700_2_e (Add Author 2 Relator)", key: "additional_author_2_e" },
  { header: "700_2_9 (Add Author 2 ID)", key: "additional_author_id_2" },
  // Additional Author 3 (700_3) - all subfields
  { header: "700_3_a (Add Author 3)", key: "additional_author_3" },
  { header: "700_3_g (Add Author 3 Dates)", key: "additional_author_3_g" },
  { header: "700_3_q (Add Author 3 Fuller Form)", key: "additional_author_3_q" },
  { header: "700_3_e (Add Author 3 Relator)", key: "additional_author_3_e" },
  { header: "700_3_9 (Add Author 3 ID)", key: "additional_author_id_3" },
  // Additional Author 4 (700_4) - all subfields
  { header: "700_4_a (Add Author 4)", key: "additional_author_4" },
  { header: "700_4_g (Add Author 4 Dates)", key: "additional_author_4_g" },
  { header: "700_4_q (Add Author 4 Fuller Form)", key: "additional_author_4_q" },
  { header: "700_4_e (Add Author 4 Relator)", key: "additional_author_4_e" },
  { header: "700_4_9 (Add Author 4 ID)", key: "additional_author_id_4" },
  // Additional Author 5 (700_5) - all subfields
  { header: "700_5_a (Add Author 5)", key: "additional_author_5" },
  { header: "700_5_g (Add Author 5 Dates)", key: "additional_author_5_g" },
  { header: "700_5_q (Add Author 5 Fuller Form)", key: "additional_author_5_q" },
  { header: "700_5_e (Add Author 5 Relator)", key: "additional_author_5_e" },
  { header: "700_5_9 (Add Author 5 ID)", key: "additional_author_id_5" }
    ]
  },
  export_author_data: {
    name: "Author Data for Review",
    columns: [
  { header: "URL", key: "url" },
  { header: "Biblio", key: "biblio" },
  { header: "Biblio Details", key: "biblio_details" },
  // Main Author (100) - all subfields
  { header: "100_a (Main Author)", key: "author" },
  { header: "100_g (Main Author Dates)", key: "author_g" },
  { header: "100_q (Main Author Fuller Form)", key: "author_q" },
  { header: "100_e (Main Author Relator)", key: "author_e" },
  { header: "100_9 (Main Author ID)", key: "author_id" }
    ]
  },
  export_translations_titles_authors: {
    name: "Translations of Titles, Authors & Universities",
    columns: [
  { header: "URL", key: "url" },
  { header: "Biblio", key: "biblio" },
  { header: "Biblio Details", key: "biblio_details" },
  { header: "Title 245 (1)(a)", key: "title_245_1_a" },
  { header: "Title 245 (1)(b)", key: "title_245_1_b" },
  { header: "Title 245 (2)(a)", key: "title_245_2_a" },
  { header: "Title 245 (2)(b)", key: "title_245_2_b" },
  { header: "Title 245 (3)(a)", key: "title_245_3_a" },
  { header: "Title 245 (3)(b)", key: "title_245_3_b" },
  { header: "Title 246 (1)(a)", key: "title_246_1_a" },
  { header: "Title 246 (1)(b)", key: "title_246_1_b" },
  { header: "Title 246 (2)(a)", key: "title_246_2_a" },
  { header: "Title 246 (2)(b)", key: "title_246_2_b" },
  { header: "Title 246 (3)(a)", key: "title_246_3_a" },
  { header: "Title 246 (3)(b)", key: "title_246_3_b" },
  { header: "Title 242 (1)(a)", key: "title_242_1_a" },
  { header: "Title 242 (1)(b)", key: "title_242_1_b" },
  { header: "Title 242 (2)(a)", key: "title_242_2_a" },
  { header: "Title 242 (2)(b)", key: "title_242_2_b" },
  { header: "Title 242 (3)(a)", key: "title_242_3_a" },
  { header: "Title 242 (3)(b)", key: "title_242_3_b" },
  // Main Author (100) - all subfields
  { header: "100_a (Main Author)", key: "author" },
  { header: "100_g (Main Author Dates)", key: "author_g" },
  { header: "100_q (Main Author Fuller Form)", key: "author_q" },
  { header: "100_e (Main Author Relator)", key: "author_e" },
  { header: "100_9 (Main Author ID)", key: "author_id" },
  { header: "University 373", key: "university_373" }
    ]
  },
  export_abstract_field: {
    name: "Abstract Field",
    columns: [
  { header: "URL", key: "url" },
  { header: "Biblio", key: "biblio" },
  { header: "Biblio Details", key: "biblio_details" },
  { header: "Abstract 520", key: "abstract_520" }
    ]
  },
  export_citation_entry: {
    name: "Citation Entry (Different Database)",
    columns: [
  { header: "URL", key: "url" },
  { header: "Biblio", key: "biblio" }
    ],
    isDifferentDatabase: true
  },
  export_translations_citation_title: {
    name: "Translations of Citation Title (Different Database)",
    columns: [
  { header: "URL", key: "url" },
  { header: "Biblio", key: "biblio" },
  { header: "Title 245 (1)(a)", key: "title_245_1_a" },
  { header: "Title 245 (1)(b)", key: "title_245_1_b" },
  { header: "Title 245 (2)(a)", key: "title_245_2_a" },
  { header: "Title 245 (2)(b)", key: "title_245_2_b" },
  { header: "Title 245 (3)(a)", key: "title_245_3_a" },
  { header: "Title 245 (3)(b)", key: "title_245_3_b" },
  { header: "Title 246 (1)(a)", key: "title_246_1_a" },
  { header: "Title 246 (1)(b)", key: "title_246_1_b" },
  { header: "Title 246 (2)(a)", key: "title_246_2_a" },
  { header: "Title 246 (2)(b)", key: "title_246_2_b" },
  { header: "Title 246 (3)(a)", key: "title_246_3_a" },
  { header: "Title 246 (3)(b)", key: "title_246_3_b" },
  { header: "Title 242 (1)(a)", key: "title_242_1_a" },
  { header: "Title 242 (1)(b)", key: "title_242_1_b" },
  { header: "Title 242 (2)(a)", key: "title_242_2_a" },
  { header: "Title 242 (2)(b)", key: "title_242_2_b" },
  { header: "Title 242 (3)(a)", key: "title_242_3_a" },
  { header: "Title 242 (3)(b)", key: "title_242_3_b" }
    ],
    isDifferentDatabase: true
  },
  export_translations_citation_author: {
    name: "Translations of Citation Author (Different Database)",
    columns: [
  { header: "URL", key: "url" },
  { header: "Biblio", key: "biblio" },
  { header: "Author", key: "author" }
    ],
    isDifferentDatabase: true
  },
  convert_url_to_biblio: {
    name: "Convert URL to Biblio",
    columns: [
      { header: "Biblio", key: "biblio" },
      { header: "Biblio Details", key: "biblio_details" },
      { header: "URL", key: "url" }
    ]
  }
};

// Field mapping for MARC tags to readable names
  // MARC field mapping by tag number
  const marcFieldMapping: Record<string, { name: string; property: string }> = {
    '000': { name: 'Leader', property: 'marc_000' },
    '001': { name: 'Control Number', property: 'marc_001' },
    '024': { name: 'Standard Identifier', property: 'marc_024' },
    '041': { name: 'Language Code', property: 'marc_041' },
    '044': { name: 'Country/Geographic Code', property: 'marc_044' },
    '100': { name: 'Author/Creator', property: 'marc_100' },
    '110': { name: 'Corporate Author', property: 'marc_110' },
    '242': { name: 'Translated Title', property: 'marc_242' },
    '245': { name: 'Title', property: 'marc_245' },
    '246': { name: 'Alternative Title', property: 'marc_246' },
    '260': { name: 'Publication Info', property: 'marc_260' },
    '300': { name: 'Physical Description', property: 'marc_300' },
    '336': { name: 'Content Type', property: 'marc_336' },
    '500': { name: 'General Note', property: 'marc_500' },
    '520': { name: 'Abstract/Summary', property: 'marc_520' },
    '653': { name: 'Keywords', property: 'marc_653' },
    '692': { name: 'Keywords From Author', property: 'marc_692' },
    '700': { name: 'Additional Author', property: 'marc_700' },
    '773': { name: 'Host Item', property: 'marc_773' },
    '856': { name: 'Electronic Location', property: 'marc_856' },
    '930': { name: 'Equivalence or Cross-Reference', property: 'marc_930' },
    '995': { name: 'Recommendation', property: 'marc_995' },
  };

// Function to create empty Excel file when no data is found
async function createEmptyExcelFile(reportType: string, formData: any): Promise<void> {
  try {
    console.log('Creating empty Excel file for report type:', reportType);
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('No Data Found');
    
    // Get configuration for the report type
    const config = reportConfigurations[reportType as keyof typeof reportConfigurations];
    
    if (config) {
      // Add headers from the configuration
      const headers = config.columns.map(col => col.header);
      worksheet.addRow(headers);
      
      // Style the header row
      styleHeaderRow(worksheet, headers.length);
      
      // Add a row indicating no data was found
      const noDataRow = new Array(headers.length).fill('');
      noDataRow[0] = 'No data found for the specified criteria';
      worksheet.addRow(noDataRow);
      
      // Auto-fit columns
      worksheet.columns.forEach((column, index) => {
        column.width = Math.max(headers[index]?.length || 10, 20);
      });
    } else {
      // Fallback for unknown report types
      worksheet.addRow(['Report Type', 'Status']);
      styleHeaderRow(worksheet, 2);
      worksheet.addRow([reportType, 'No data found for the specified criteria']);
      worksheet.columns.forEach(column => {
        column.width = 25;
      });
    }
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filterInfo = formData?.abstractFilter ? `_${formData.abstractFilter}` : '';
    const filename = `${reportType}${filterInfo}_${timestamp}_empty.xlsx`;
    
    // Write file
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Create and trigger download
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('Empty Excel file created and downloaded:', filename);
  } catch (error) {
    console.error('Error creating empty Excel file:', error);
    throw error;
  }
}

// Function to fetch report data from API
export async function fetchReportData(reportType: string, formData: any): Promise<ExportData[]> {
  try {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportType,
        filters: {
          magazineNumbers: formData.magazineNumbers,
          startYear: formData.startYear ? parseInt(formData.startYear) : undefined,
          endYear: formData.endYear ? parseInt(formData.endYear) : undefined,
          authorName: formData.authorName,
          selectedFields: formData.selectedFields,
          abstractFilter: formData.abstractFilter,
          biblioNumbers: formData.biblioNumbers
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch report data');
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching report data:', error);
    throw error;
  }
}

// Main export function that fetches data and exports to Excel
export async function exportToExcel(reportType: string, formData: any): Promise<void> {
  try {
    // Fetch data from database via API
    const data = await fetchReportData(reportType, formData);
    
    console.log(`Fetched ${data.length} records for report type: ${reportType}`);
    
    // Handle empty data by creating empty Excel file instead of throwing error
    if (data.length === 0) {
      console.log('No data found, creating empty Excel file');
      return await createEmptyExcelFile(reportType, formData);
    }

    // Handle custom reports differently
    if (reportType === 'custom' || reportType === 'custom_report') {
      return await exportCustomReportToExcel(data, formData);
    }

    const config = reportConfigurations[reportType as keyof typeof reportConfigurations];
    if (!config) {
      throw Error('Invalid report type');
    }

    // For abstract field report, dynamically add 520 subfield columns
    let finalColumns = [...config.columns];
    if (reportType === 'export_abstract_field') {
      // Remove the original abstract_520 column
      finalColumns = finalColumns.filter(col => col.key !== 'abstract_520');
      // Find all unique 520 subfields in the data
      const subfieldCodes = new Set<string>();
      data.forEach(row => {
        Object.keys(row).forEach(key => {
          if (key.startsWith('abstract_520_')) {
            const code = key.replace('abstract_520_', '');
            subfieldCodes.add(code);
          }
        });
      });
      // Add columns for each subfield
      Array.from(subfieldCodes).sort().forEach(code => {
        finalColumns.push({
          header: `Abstract 520${code}`,
          key: `abstract_520_${code}`
        });
      });
    }

    // Apply abstract field filter if specified
    let filteredData = data;
    if (reportType === 'export_abstract_field' && formData?.abstractFilter && formData.abstractFilter !== '') {
      console.log(`Applying abstract filter: ${formData.abstractFilter}`);
      console.log('Sample data before filtering:', data.slice(0, 2));
      const beforeCount = data.length;
      filteredData = filterAbstractRecords(data, formData.abstractFilter);
      const afterCount = filteredData.length;
      console.log(`Abstract filter applied: ${beforeCount} -> ${afterCount} records`);
      console.log('Sample data after filtering:', filteredData.slice(0, 2));
    }

    // Apply author type filter for research authors report
    if (reportType === 'export_research_authors' && formData?.authorTypeFilter && formData.authorTypeFilter.length > 0) {
      const authorFilter = formData.authorTypeFilter;
      
      // Filter columns based on selected author types
      finalColumns = finalColumns.filter(col => {
        // Always keep URL and Biblio columns
        if (col.key === 'url' || col.key === 'biblio' || col.key === 'biblio_details') return true;
        
        // Keep title columns even if some instances are empty (for consistent structure)
        if (col.key.startsWith('title_245_') || col.key.startsWith('title_246_') || col.key.startsWith('title_242_')) return true;
        
        // If only 100 (main author) is selected
        if (authorFilter.includes('100') && !authorFilter.includes('700')) {
          return col.key === 'author' || col.key === 'author_id';
        }
        
        // If only 700 (additional authors) is selected
        if (authorFilter.includes('700') && !authorFilter.includes('100')) {
          return col.key.startsWith('additional_author_id');
        }
        
        // If both are selected or neither is selected, include all author columns
        return true;
      });
    }

    // Remove completely empty columns from all reports (but preserve important columns for specific report types)
    finalColumns = finalColumns.filter(col => {
      // Always keep essential columns like URL and Biblio
      if (col.key === 'url' || col.key === 'biblio' || col.key === 'biblio_details') return true;
      
      // Keep title columns even if some instances are empty (for consistent structure)
      if (col.key.startsWith('title_245_') || col.key.startsWith('title_246_') || col.key.startsWith('title_242_')) return true;
      
      // For abstract field reports, ALWAYS keep abstract columns even if empty (that's the point of the report)
      if (reportType === 'export_abstract_field' && col.key.startsWith('abstract_520_')) {
        return true;
      }
      
      // Check if column has any non-empty values
      const hasNonEmptyValue = filteredData.some(row => {
        const value = row[col.key];
        return value !== null && value !== undefined && value !== '' && 
               (typeof value !== 'string' || value.trim() !== '');
      });
      
      if (!hasNonEmptyValue) {
        console.log(`Removing empty column: ${col.header} (${col.key})`);
      }
      
      return hasNonEmptyValue;
    });

    console.log(`Final column count after removing empty columns: ${finalColumns.length}`);

    // Create workbook and worksheet with ExcelJS
    const workbook = new ExcelJS.Workbook();
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.creator = 'Manduma Reports';
    workbook.title = config.name;
    workbook.subject = 'Report Export';
    
    // Prepare data for Excel
    const excelData = filteredData.map(row => {
      const excelRow: any = {};
      finalColumns.forEach(col => {
        excelRow[col.header] = row[col.key] || '';
      });
      return excelRow;
    });
    
    // Create worksheet
    const worksheet = workbook.addWorksheet(createSafeSheetName(config.name));
    
    // Add headers
    const headers = finalColumns.map(col => col.header);
    worksheet.addRow(headers);
    
    // Add data rows
    excelData.forEach(row => {
      const dataRow = finalColumns.map(col => row[col.header] || '');
      worksheet.addRow(dataRow);
    });
    
    // Make biblio column clickable for ALL reports
    const biblioColumnIndex = finalColumns.findIndex(col => col.key === 'biblio');
    if (biblioColumnIndex !== -1) {
      // Add hyperlinks to biblio cells (starting from row 2, column is 1-indexed)
      for (let rowIndex = 2; rowIndex <= excelData.length + 1; rowIndex++) {
        const cell = worksheet.getCell(rowIndex, biblioColumnIndex + 1);
        const biblioNumber = cell.value;
        
        if (biblioNumber) {
          // Extract the actual number from padded string (e.g., "0001" -> 1)
          const biblioNumericValue = biblioNumber.toString().replace(/^0+/, '') || biblioNumber;
          
          // Create hyperlink to cataloging system
          const catalogingUrl = `https://cataloging.mandumah.com/cgi-bin/koha/catalogue/detail.pl?biblionumber=${biblioNumericValue}`;
          
          // Set cell as hyperlink using ExcelJS with proper styling
          cell.value = {
            text: `${biblioNumber}`,
            hyperlink: catalogingUrl
          };
        }
      }
    }

    // Make biblio_details column clickable for ALL normal reports
    const biblioDetailsColumnIndex = finalColumns.findIndex(col => col.key === 'biblio_details');
    if (biblioDetailsColumnIndex !== -1) {
      // Add hyperlinks to biblio_details cells (starting from row 2, column is 1-indexed)
      for (let rowIndex = 2; rowIndex <= excelData.length + 1; rowIndex++) {
        const cell = worksheet.getCell(rowIndex, biblioDetailsColumnIndex + 1);
        const biblioDetailsUrl = cell.value;
        
        if (biblioDetailsUrl) {
          // Set cell as hyperlink using ExcelJS with proper styling
          cell.value = {
            text: 'Edit Details',
            hyperlink: biblioDetailsUrl.toString()
          };
        }
      }
    }

    // Make author ID columns clickable for research authors report
    if (reportType === 'export_research_authors') {
      // Find all author ID columns
      const authorIdColumns = finalColumns
        .map((col, index) => ({ col, index }))
        .filter(({ col }) => col.key.includes('author_id'));

      // Add hyperlinks to author ID cells
      authorIdColumns.forEach(({ col, index: columnIndex }) => {
        for (let rowIndex = 2; rowIndex <= excelData.length + 1; rowIndex++) {
          const cell = worksheet.getCell(rowIndex, columnIndex + 1);
          const authorId = cell.value;
          
          if (authorId) {
            // Create hyperlink to Koha authorities page
            const authoritiesUrl = `https://cataloging.mandumah.com/cgi-bin/koha/authorities/authorities.pl?authid=${authorId}`;
            
            // Set cell as hyperlink using ExcelJS with proper styling
            cell.value = {
              text: authorId.toString(),
              hyperlink: authoritiesUrl
            };
            
            // Apply default Excel hyperlink styling (blue color, underline)
            cell.font = {
              color: { argb: 'FF0000FF' }, // Blue color
              underline: true
            };
          }
        }
      });
    }
    
    // Style the header row with blue background and white text
    styleHeaderRow(worksheet, finalColumns.length);
    
    // Set column widths
    finalColumns.forEach((col, index) => {
      let width = 20; // default width
      switch (col.key) {
        case 'url':
        case 'link':
          width = 50;
          break;
        default:
          // Check if it's an abstract field
          if (col.key.startsWith('abstract_520')) {
            width = 80;
          }
          // Check if it's a title field
          else if (col.key.includes('title_')) {
            width = 40;
          }
          break;
      }
      worksheet.getColumn(index + 1).width = width;
    });

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `${config.name.replace(/\s+/g, '_')}_${timestamp}.xlsx`;

    // Write file using ExcelJS for browser download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
}

async function exportCustomReportToExcel(data: ExportData[], formData?: any): Promise<void> {
  const selectedFields = formData?.selectedFields || [];
  
  // Helper function to check if a column is completely empty
  function isColumnEmpty(columnKey: string, data: ExportData[]): boolean {
    return data.every(row => {
      const value = row[columnKey];
      return value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '');
    });
  }
  
  // Filter out empty columns from data
  function removeEmptyColumns(data: ExportData[]): { filteredData: ExportData[], availableKeys: string[] } {
    if (data.length === 0) {
      return { filteredData: data, availableKeys: [] };
    }
    
    // Get all potential column keys
    const allKeys = new Set<string>();
    data.forEach(row => {
      Object.keys(row).forEach(key => allKeys.add(key));
    });
    
    // Identify non-empty columns
    const nonEmptyKeys = Array.from(allKeys).filter(key => !isColumnEmpty(key, data));
    
    console.log(`Removed ${allKeys.size - nonEmptyKeys.length} empty columns out of ${allKeys.size} total columns`);
    
    return { 
      filteredData: data, // Keep original data, just track which columns to include
      availableKeys: nonEmptyKeys 
    };
  }
  
  // Remove empty columns before processing
  const { filteredData, availableKeys } = removeEmptyColumns(data);
  
  // Create workbook and worksheet with ExcelJS
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.creator = 'Manduma Reports';
  workbook.title = 'Custom Report';
  workbook.subject = 'Custom Report Export';
  
  // Define base columns for custom report - only include if they have data
  const columns: ExportColumn[] = [];
  
  // Add URL column if it has data
  if (availableKeys.includes('url')) {
    columns.push({ header: "URL", key: "url" });
  }
  
  // Add Biblio column if it has data  
  if (availableKeys.includes('biblio')) {
    columns.push({ header: "Biblio", key: "biblio" });
  }

  // Add Biblio Details column if it has data
  if (availableKeys.includes('biblio_details')) {
    columns.push({ header: "Biblio Details", key: "biblio_details" });
  }

  // Add all dynamically generated MARC fields as columns - only non-empty ones
  if (data.length > 0) {
    // Get all MARC field keys from available (non-empty) keys
    const marcFieldKeys = availableKeys
      .filter(key => key.startsWith('marc_'))
      .sort();
    
    // Create columns for each non-empty MARC field
    marcFieldKeys.forEach(marcKey => {
      let header = marcKey;
      
      // Create user-friendly headers
      if (marcKey === 'marc_000') {
        header = '000 - Leader';
      } else if (marcKey === 'marc_001') {
        header = '001 - Control Number';
      } else if (marcKey.includes('_')) {
        // Parse dynamic field keys like marc_245_a or marc_700_1_a or marc_245_1_a
        const parts = marcKey.split('_');
        if (parts.length >= 3) {
          const fieldTag = parts[1];
          const lastPart = parts[parts.length - 1];
          
          if (parts.length === 4 && /^\d+$/.test(parts[2])) {
            // Multi-value field like marc_700_1_a or marc_245_1_a
            const instance = parts[2];
            const subfield = lastPart;
            header = `${fieldTag} (${instance})(${subfield})`;
          } else if (parts.length === 3) {
            // Regular field like marc_245_a (legacy format)
            const subfield = lastPart;
            header = `${fieldTag}/${subfield}`;
          }
        }
      }
      
      columns.push({
        header: header,
        key: marcKey
      });
    });
  } else {
    // No data available, create basic column structure based on selected fields
    // (This case is rare since we check for empty data earlier)
    selectedFields.forEach((fieldTag: string) => {
      columns.push({
        header: `${fieldTag} - Field`,
        key: `marc_${fieldTag}`
      });
    });
  }

  // Prepare data for Excel
  const excelData = data.map(row => {
    const excelRow: any = {};
    columns.forEach(col => {
      const value = row[col.key] || '';
      
      // Special handling for authority IDs (subfield 9) - make them clickable
      if (col.key.endsWith('_9') && value) {
        excelRow[col.header] = value; // Store the value, hyperlink will be added later
      } else {
        excelRow[col.header] = value;
      }
    });
    return excelRow;
  });

  // Create worksheet
  const reportName = `Custom_Report_${selectedFields.length}_Fields`;
  const worksheet = workbook.addWorksheet(createSafeSheetName(reportName));
  
  // Add headers
  const headers = columns.map(col => col.header);
  worksheet.addRow(headers);
  
  // Add data rows
  excelData.forEach(row => {
    const dataRow = columns.map(col => row[col.header] || '');
    worksheet.addRow(dataRow);
  });

  // Make biblio column clickable
  const biblioColumnIndex = columns.findIndex(col => col.key === 'biblio');
  if (biblioColumnIndex !== -1) {
    // Add hyperlinks to biblio cells (starting from row 2, column is 1-indexed)
    for (let rowIndex = 2; rowIndex <= excelData.length + 1; rowIndex++) {
      const cell = worksheet.getCell(rowIndex, biblioColumnIndex + 1);
      const biblioNumber = cell.value;
      if (biblioNumber) {
        // Extract the actual number from padded string (e.g., "0001" -> 1)
        const biblioNumericValue = biblioNumber.toString().replace(/^0+/, '') || biblioNumber;
        
        // Create hyperlink to cataloging system
        const catalogingUrl = `https://cataloging.mandumah.com/cgi-bin/koha/catalogue/detail.pl?biblionumber=${biblioNumericValue}`;
        
        // Set cell as hyperlink using ExcelJS with proper styling
        cell.value = {
          text: biblioNumber.toString(),
          hyperlink: catalogingUrl
        };
        
        // Apply default Excel hyperlink styling (blue color, underline)
        // cell.font = {
        //   color: { argb: 'FF0000FF' }, // Blue color
        //   underline: true
        // };
      }
    }
  }

  // Make biblio_details column clickable
  const biblioDetailsColumnIndex = columns.findIndex(col => col.key === 'biblio_details');
  if (biblioDetailsColumnIndex !== -1) {
    // Add hyperlinks to biblio_details cells (starting from row 2, column is 1-indexed)
    for (let rowIndex = 2; rowIndex <= excelData.length + 1; rowIndex++) {
      const cell = worksheet.getCell(rowIndex, biblioDetailsColumnIndex + 1);
      const biblioDetailsUrl = cell.value;
      if (biblioDetailsUrl) {
        // Set cell as hyperlink using ExcelJS with proper styling
        cell.value = {
          text: 'Edit Details',
          hyperlink: biblioDetailsUrl.toString()
        };
      }
    }
  }
  
  // Make authority ID columns (subfield 9) clickable
  columns.forEach((col, colIndex) => {
    if (col.key.endsWith('_9')) {
      // Add hyperlinks to authority ID cells (starting from row 2, column is 1-indexed)
      for (let rowIndex = 2; rowIndex <= excelData.length + 1; rowIndex++) {
        const cell = worksheet.getCell(rowIndex, colIndex + 1);
        const authorityId = cell.value;
        if (authorityId) {
          cell.value = {
            text: authorityId.toString(),
            hyperlink: `https://cataloging.mandumah.com/cgi-bin/koha/authorities/authorities.pl?authid=${authorityId}`,
            tooltip: `Open authority record ${authorityId}`
          };
        }
      }
    }
  }); 
  
  // Style the header row with blue background and white text
  styleHeaderRow(worksheet, columns.length);
  
  // Set column widths
  columns.forEach((col, index) => {
    let width = 25; // default width
    if (col.key === 'url' || col.key === 'link') {
      width = 50;
    } else if (col.key.startsWith('marc_520')) { // All 520 subfields
      width = 80;
    } else if (col.key === 'marc_245' || col.key === 'marc_246' || col.key === 'marc_242') {
      width = 40;
    }
    worksheet.getColumn(index + 1).width = width;
  });

  // Generate filename
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `${reportName}_${timestamp}.xlsx`;

  // Write file using ExcelJS for browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
