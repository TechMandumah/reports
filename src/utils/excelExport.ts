import * as XLSX from 'xlsx';

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
function styleHeaderRow(ws: XLSX.WorkSheet, headerCount: number) {
  // Apply style to each header cell in the first row
  for (let col = 0; col < headerCount; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col }); // First row (r=0)
    
    // Ensure the cell exists and has content
    if (ws[cellAddress]) {
      // Apply simple but effective header styling
      ws[cellAddress].s = {
        fill: {
          patternType: "solid",
          fgColor: { rgb: "0066CC" }
        },
        font: {
          bold: true,
          color: { rgb: "FFFFFF" }
        },
        alignment: {
          horizontal: "center"
        }
      };
    }
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
      { header: "Title 242", key: "title_242" }
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
          selectedFields: formData.selectedFields
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
      return exportCustomReportToExcel(data, formData);
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
        return data.some(row => row[col.key] && row[col.key].toString().trim() !== '');
      });
    }

    // Create workbook and worksheet with cell styles support
    const wb = XLSX.utils.book_new();
    wb.Props = {
      Title: config.name,
      Subject: "Report Export",
      CreatedDate: new Date()
    };
    
    // Prepare data for Excel
    const excelData = data.map(row => {
      const excelRow: any = {};
      finalColumns.forEach(col => {
        excelRow[col.header] = row[col.key] || '';
      });
      return excelRow;
    });

    // Create worksheet with headers first
    const ws = XLSX.utils.aoa_to_sheet([]);
    
    // Add headers manually with styling
    const headers = finalColumns.map(col => col.header);
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A1' });
    
    // Add data rows
    const dataRows = excelData.map(row => 
      finalColumns.map(col => row[col.header] || '')
    );
    XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: 'A2' });
    
    // Make biblio column clickable for ALL reports
    const biblioColumnIndex = finalColumns.findIndex(col => col.key === 'biblio');
    if (biblioColumnIndex !== -1) {
      // Add hyperlinks to biblio cells
      for (let rowIndex = 1; rowIndex < excelData.length + 1; rowIndex++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: biblioColumnIndex });
        const biblioNumber = ws[cellAddress]?.v;
        
        if (biblioNumber && ws[cellAddress]) {
          // Extract the actual number from padded string (e.g., "0001" -> 1)
          const biblioNumericValue = biblioNumber.toString().replace(/^0+/, '') || biblioNumber;
          
          // Create hyperlink to cataloging system
          const catalogingUrl = `https://cataloging.mandumah.com/cgi-bin/koha/cataloguing/addbiblio.pl?biblionumber=${biblioNumericValue}`;
          
          // Set cell as hyperlink
          ws[cellAddress].l = { Target: catalogingUrl };
          ws[cellAddress].s = {
            font: {
              color: { rgb: "0000FF" },
              underline: true
            }
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
        for (let rowIndex = 1; rowIndex < excelData.length + 1; rowIndex++) {
          const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
          const authorId = ws[cellAddress]?.v;
          
          if (authorId && ws[cellAddress]) {
            // Create hyperlink to Koha authorities page
            const authoritiesUrl = `https://cataloging.mandumah.com/cgi-bin/koha/authorities/authorities.pl?authid=${authorId}`;
            
            // Set cell as hyperlink
            ws[cellAddress].l = { Target: authoritiesUrl };
            ws[cellAddress].s = {
              font: {
                color: { rgb: "0000FF" },
                underline: true
              }
            };
          }
        }
      });
    }
    
    // Style the header row with blue background and white text
    styleHeaderRow(ws, finalColumns.length);
    
    // Set column widths
    const colWidths = finalColumns.map(col => {
      switch (col.key) {
        case 'url':
        case 'link':
          return { wch: 50 };
        default:
          // Check if it's an abstract field
          if (col.key.startsWith('abstract_520')) {
            return { wch: 80 };
          }
          // Check if it's a title field
          if (col.key.includes('title_')) {
            return { wch: 40 };
          }
          return { wch: 20 };
      }
    });
    ws['!cols'] = colWidths;

    // Add worksheet to workbook with safe sheet name
    const safeSheetName = createSafeSheetName(config.name);
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `${config.name.replace(/\s+/g, '_')}_${timestamp}.xlsx`;

    // Write file with cell styles enabled and specific book type
    XLSX.writeFile(wb, filename, { 
      cellStyles: true, 
      bookType: 'xlsx',
      type: 'binary'
    });
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
}

function exportCustomReportToExcel(data: ExportData[], formData?: any): void {
  const selectedFields = formData?.selectedFields || [];
  
  // Create workbook and worksheet with cell styles support
  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: "Custom Report",
    Subject: "Custom Report Export",
    CreatedDate: new Date()
  };
  
  // Define columns for custom report
  const columns: ExportColumn[] = [
    { header: "URL", key: "url" },
    { header: "Biblio", key: "biblio" }
  ];

  // Add selected MARC fields as columns
  selectedFields.forEach((fieldTag: string) => {
    if (fieldTag === '520') {
      // Special handling for tag 520 - find all subfields in the data
      const subfieldCodes = new Set<string>();
      data.forEach(row => {
        Object.keys(row).forEach(key => {
          if (key.startsWith('marc_520_')) {
            const code = key.replace('marc_520_', '');
            subfieldCodes.add(code);
          }
        });
      });
      
      // Add columns for each subfield
      Array.from(subfieldCodes).sort().forEach(code => {
        columns.push({
          header: `520${code} - Abstract Subfield ${code.toUpperCase()}`,
          key: `marc_520_${code}`
        });
      });
    } else if (fieldTag === '100') {
      // Special handling for field 100 - main author with ID
      columns.push({
        header: `100 - Main Author`,
        key: `marc_100`
      });
      columns.push({
        header: `100 - Main Author ID`,
        key: `marc_100_id`
      });
    } else if (fieldTag === '700') {
      // Special handling for field 700 - additional authors with IDs
      // Only include ID columns, not author name columns
      const authorIdInstances = new Set<string>();
      data.forEach(row => {
        Object.keys(row).forEach(key => {
          if ((key === 'marc_700_id' || key.match(/^marc_700_id_\d+$/)) && row[key] && row[key].toString().trim() !== '') {
            authorIdInstances.add(key);
          }
        });
      });
      
      const sortedAuthorIdInstances = Array.from(authorIdInstances).sort((a, b) => {
        const aMatch = a.match(/_(\d+)$/);
        const bMatch = b.match(/_(\d+)$/);
        const aNum = aMatch ? parseInt(aMatch[1]) : 1;
        const bNum = bMatch ? parseInt(bMatch[1]) : 1;
        return aNum - bNum;
      });
      
      // Add columns for each author ID instance
      sortedAuthorIdInstances.forEach((instanceKey, index) => {
        const instanceNumber = instanceKey.includes('_id_') ? instanceKey.split('_').pop() : '';
        const header = index === 0 
          ? `700 - Additional Author ID`
          : `700 - Additional Author ID (${instanceNumber})`;
        
        columns.push({
          header,
          key: instanceKey
        });
      });
    } else {
      // Handle multiple instances of the same field
      const fieldInfo = marcFieldMapping[fieldTag];
      if (fieldInfo) {
        // Find all instances of this field in the data
        const fieldInstances = new Set<string>();
        data.forEach(row => {
          Object.keys(row).forEach(key => {
            if (key === `marc_${fieldTag}`) {
              fieldInstances.add(key);
            } else if (key.startsWith(`marc_${fieldTag}_`)) {
              fieldInstances.add(key);
            }
          });
        });
        
        // Sort the instances to ensure consistent column order
        const sortedInstances = Array.from(fieldInstances).sort((a, b) => {
          // Extract instance number for sorting
          const aMatch = a.match(/_(\d+)$/);
          const bMatch = b.match(/_(\d+)$/);
          const aNum = aMatch ? parseInt(aMatch[1]) : 1;
          const bNum = bMatch ? parseInt(bMatch[1]) : 1;
          return aNum - bNum;
        });
        
        // Add columns for each instance
        sortedInstances.forEach((instanceKey, index) => {
          const instanceNumber = instanceKey.includes('_') ? instanceKey.split('_').pop() : '1';
          const header = index === 0 
            ? `${fieldTag} - ${fieldInfo.name}`
            : `${fieldTag} - ${fieldInfo.name} (${instanceNumber})`;
          
          columns.push({
            header,
            key: instanceKey
          });
        });
      }
    }
  });

  // Prepare data for Excel
  const excelData = data.map(row => {
    const excelRow: any = {};
    columns.forEach(col => {
      excelRow[col.header] = row[col.key] || '';
    });
    return excelRow;
  });

  // Create worksheet with headers first
  const ws = XLSX.utils.aoa_to_sheet([]);
  
  // Add headers manually with styling
  const headers = columns.map(col => col.header);
  XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A1' });
  
  // Add data rows
  const dataRows = excelData.map(row => 
    columns.map(col => row[col.header] || '')
  );
  XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: 'A2' });
  
  // Make biblio column clickable for custom reports too
  const biblioColumnIndex = columns.findIndex(col => col.key === 'biblio');
  if (biblioColumnIndex !== -1) {
    // Add hyperlinks to biblio cells
    for (let rowIndex = 1; rowIndex < excelData.length + 1; rowIndex++) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: biblioColumnIndex });
      const biblioNumber = ws[cellAddress]?.v;
      
      if (biblioNumber && ws[cellAddress]) {
        // Extract the actual number from padded string (e.g., "0001" -> 1)
        const biblioNumericValue = biblioNumber.toString().replace(/^0+/, '') || biblioNumber;
        
        // Create hyperlink to cataloging system
        const catalogingUrl = `https://cataloging.mandumah.com/cgi-bin/koha/cataloguing/addbiblio.pl?biblionumber=${biblioNumericValue}`;
        
        // Set cell as hyperlink
        ws[cellAddress].l = { Target: catalogingUrl };
        ws[cellAddress].s = {
          font: {
            color: { rgb: "0000FF" },
            underline: true
          }
        };
      }
    }
  }

  // Make author ID columns clickable for custom reports (field 100 and 700)
  const authorIdColumns = columns
    .map((col, index) => ({ col, index }))
    .filter(({ col }) => 
      col.key === 'marc_100_id' || 
      col.key === 'marc_700_id' || 
      col.key.match(/^marc_700_id_\d+$/)
    );

  // Add hyperlinks to author ID cells
  authorIdColumns.forEach(({ col, index: columnIndex }) => {
    for (let rowIndex = 1; rowIndex < excelData.length + 1; rowIndex++) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
      const authorId = ws[cellAddress]?.v;
      
      if (authorId && ws[cellAddress]) {
        // Create hyperlink to Koha authorities page
        const authoritiesUrl = `https://cataloging.mandumah.com/cgi-bin/koha/authorities/authorities.pl?authid=${authorId}`;
        
        // Set cell as hyperlink
        ws[cellAddress].l = { Target: authoritiesUrl };
        ws[cellAddress].s = {
          font: {
            color: { rgb: "0000FF" },
            underline: true
          }
        };
      }
    }
  });
  
  // Style the header row with blue background and white text
  styleHeaderRow(ws, columns.length);
  
  // Set column widths
  const colWidths = columns.map(col => {
    if (col.key === 'url' || col.key === 'link') {
      return { wch: 50 };
    } else if (col.key.startsWith('marc_520')) { // All 520 subfields
      return { wch: 80 };
    } else if (col.key === 'marc_245' || col.key === 'marc_246' || col.key === 'marc_242') {
      return { wch: 40 };
    } else {
      return { wch: 25 };
    }
  });
  ws['!cols'] = colWidths;

  // Add worksheet to workbook with safe sheet name
  const reportName = `Custom_Report_${selectedFields.length}_Fields`;
  const safeSheetName = createSafeSheetName(reportName);
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

  // Generate filename
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `${reportName}_${timestamp}.xlsx`;

  // Write file with cell styles enabled and specific book type
  XLSX.writeFile(wb, filename, { 
    cellStyles: true, 
    bookType: 'xlsx',
    type: 'binary'
  });
}
