import ExcelJS from 'exceljs';

// Helper function to apply abstract field filters
function filterAbstractRecords(data: ExportData[], abstractFilter?: string): ExportData[] {
  if (!abstractFilter || abstractFilter === '') {
    return data; // Return all data if no filter selected
  }

  return data.filter(row => {
    switch (abstractFilter) {
      case 'without_abstract':
        // Records with no field 520 (no abstract subfields)
        return !Object.keys(row).some(key => key.startsWith('abstract_520_'));
      
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
        // Subfield 'a' and 'e' are empty inside field 520
        const hasSubfieldAEmpty = !row['abstract_520_a'] || row['abstract_520_a'].toString().trim() === '';
        const hasSubfieldEEmpty = !row['abstract_520_e'] || row['abstract_520_e'].toString().trim() === '';
        const hasAny520Field = Object.keys(row).some(key => key.startsWith('abstract_520_'));
        return hasAny520Field && hasSubfieldAEmpty && hasSubfieldEEmpty;
      
      default:
        return true;
    }
  });
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
      { header: "Title 245", key: "title_245" },
      { header: "Title 246", key: "title_246" },
      { header: "Title 242", key: "title_242" },
      { header: "Language 041", key: "language_041" },
    ]
  },
  export_research_authors: {
    name: "Research Authors for Review",
    columns: [
  { header: "URL", key: "url" },
  { header: "Biblio", key: "biblio" },
  { header: "Main Author (100)", key: "author" },
  { header: "Main Author ID", key: "author_id" },
  { header: "Additional Author ID", key: "additional_author_id" },
  { header: "Additional Author ID 2", key: "additional_author_id_2" },
  { header: "Additional Author ID 3", key: "additional_author_id_3" },
  { header: "Additional Author ID 4", key: "additional_author_id_4" },
  { header: "Additional Author ID 5", key: "additional_author_id_5" }
    ]
  },
  export_author_data: {
    name: "Author Data for Review",
    columns: [
  { header: "URL", key: "url" },
  { header: "Biblio", key: "biblio" },
  { header: "Author", key: "author" }
    ]
  },
  export_translations_titles_authors: {
    name: "Translations of Titles, Authors & Universities",
    columns: [
  { header: "URL", key: "url" },
  { header: "Biblio", key: "biblio" },
  { header: "Title 245", key: "title_245" },
  { header: "Title 246", key: "title_246" },
  { header: "Title 242", key: "title_242" },
  { header: "Author", key: "author" },
  { header: "University 373", key: "university_373" }
    ]
  },
  export_abstract_field: {
    name: "Abstract Field",
    columns: [
  { header: "URL", key: "url" },
  { header: "Biblio", key: "biblio" },
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
  { header: "Title 245", key: "title_245" },
  { header: "Title 246", key: "title_246" },
  { header: "Title 242", key: "title_242" }
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
    
    if (data.length === 0) {
      throw Error('No data found for the specified criteria');
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
    if (reportType === 'export_abstract_field' && formData?.abstractFilter) {
      filteredData = filterAbstractRecords(data, formData.abstractFilter);
    }

    // Apply author type filter for research authors report
    if (reportType === 'export_research_authors' && formData?.authorTypeFilter && formData.authorTypeFilter.length > 0) {
      const authorFilter = formData.authorTypeFilter;
      
      // Filter columns based on selected author types
      finalColumns = finalColumns.filter(col => {
        // Always keep URL and Biblio columns
        if (col.key === 'url' || col.key === 'biblio') return true;
        
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

    // Dynamically include additional author columns only if at least one row has a non-empty value
    if (reportType === 'export_research_authors') {
      const additionalAuthorKeys = [
        'additional_author_id',
        'additional_author_id_2',
        'additional_author_id_3',
        'additional_author_id_4',
        'additional_author_id_5'
      ];
      finalColumns = finalColumns.filter(col => {
        if (!additionalAuthorKeys.includes(col.key)) return true;
        // Only include if at least one row has a non-empty value for this column
        return filteredData.some(row => row[col.key] && row[col.key].toString().trim() !== '');
      });
    }

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
  
  // Create workbook and worksheet with ExcelJS
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.creator = 'Manduma Reports';
  workbook.title = 'Custom Report';
  workbook.subject = 'Custom Report Export';
  
  // Define base columns for custom report
  const columns: ExportColumn[] = [
    { header: "URL", key: "url" },
    { header: "Biblio", key: "biblio" }
  ];

  // Add all dynamically generated MARC fields as columns
  if (data.length > 0) {
    // Get all MARC field keys from the first record
    const marcFieldKeys = Object.keys(data[0])
      .filter(key => key.startsWith('marc_'))
      .sort();
    
    // Create columns for each MARC field
    marcFieldKeys.forEach(marcKey => {
      let header = marcKey;
      
      // Create user-friendly headers
      if (marcKey === 'marc_000') {
        header = '000 - Leader';
      } else if (marcKey === 'marc_001') {
        header = '001 - Control Number';
      } else if (marcKey.includes('_')) {
        // Parse dynamic field keys like marc_245_a or marc_700_1_a
        const parts = marcKey.split('_');
        if (parts.length >= 3) {
          const fieldTag = parts[1];
          const subfield = parts[parts.length - 1];
          
          if (parts.length === 4 && /^\d+$/.test(parts[2])) {
            // Multi-value field like marc_700_1_a
            const instance = parts[2];
            header = `${fieldTag}/${subfield} #${instance}`;
          } else {
            // Regular field like marc_245_a
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
        cell.font = {
          color: { argb: 'FF0000FF' }, // Blue color
          underline: true
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
