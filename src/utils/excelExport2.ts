import * as XLSX from 'xlsx';

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
  }
};

// Field mapping for MARC tags to readable names
const marcFieldMapping: Record<string, { name: string }> = {
  "000": { name: "Leader" },
  "001": { name: "Control Number" },
  "024": { name: "Standard Identifier" },
  "041": { name: "Language Code" },
  "044": { name: "Country/Geographic Code" },
  "100": { name: "Author/Creator" },
  "110": { name: "Corporate Author" },
  "242": { name: "Translated Title" },
  "245": { name: "Title" },
  "246": { name: "Alternative Title" },
  "260": { name: "Publication Info" },
  "300": { name: "Physical Description" },
  "336": { name: "Content Type" },
  "500": { name: "General Note" },
  "520": { name: "Abstract/Summary" },
  "653": { name: "Keywords" },
  "692": { name: "Keywords From Author" },
  "700": { name: "Additional Author" },
  "773": { name: "Host Item" },
  "856": { name: "Electronic Location" },
  "930": { name: "Equivalence or Cross-Reference" },
  "995": { name: "Recommendation" }
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
      throw new Error('No data found for the specified criteria');
    }

    // Handle custom reports differently
    if (reportType === 'custom') {
      return exportCustomReportToExcel(data, formData);
    }

    const config = reportConfigurations[reportType as keyof typeof reportConfigurations];
    if (!config) {
      throw new Error('Invalid report type');
    }

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Prepare data for Excel
    const excelData = data.map(row => {
      const excelRow: any = {};
      config.columns.forEach(col => {
        excelRow[col.header] = row[col.key] || '';
      });
      return excelRow;
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    const colWidths = config.columns.map(col => {
      switch (col.key) {
        case 'url':
        case 'link':
          return { wch: 50 };
        case 'abstract_520':
          return { wch: 80 };
        case 'title_245':
        case 'title_246':
        case 'title_242':
          return { wch: 40 };
        default:
          return { wch: 20 };
      }
    });
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, config.name);

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `${config.name.replace(/\s+/g, '_')}_${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
}

function exportCustomReportToExcel(data: ExportData[], formData?: any): void {
  const selectedFields = formData?.selectedFields || [];
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  
  // Define columns for custom report
  const columns: ExportColumn[] = [
    { header: "URL", key: "url" },
    { header: "Biblio", key: "biblio" },
    { header: "Link", key: "link" }
  ];

  // Add selected MARC fields as columns
  selectedFields.forEach((fieldTag: string) => {
    const fieldInfo = marcFieldMapping[fieldTag];
    if (fieldInfo) {
      columns.push({
        header: `${fieldTag} - ${fieldInfo.name}`,
        key: `marc_${fieldTag}`
      });
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

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);
  
  // Set column widths
  const colWidths = columns.map(col => {
    if (col.key === 'url' || col.key === 'link') {
      return { wch: 50 };
    } else if (col.key.includes('marc_520')) { // Abstract field
      return { wch: 80 };
    } else if (col.key.includes('marc_245') || col.key.includes('marc_246') || col.key.includes('marc_242')) {
      return { wch: 40 };
    } else {
      return { wch: 25 };
    }
  });
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  const reportName = `Custom_Report_${selectedFields.length}_Fields`;
  XLSX.utils.book_append_sheet(wb, ws, reportName);

  // Generate filename
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `${reportName}_${timestamp}.xlsx`;

  // Write file
  XLSX.writeFile(wb, filename);
}
