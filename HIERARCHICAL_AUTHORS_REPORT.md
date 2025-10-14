# Hierarchical Authors Report - New Feature

## Overview
A new report type has been created to export author data in a hierarchical structure that merges MARC fields 100 (main author) and 700 (additional authors) with individual subfields separated into columns.

## New Structure

### Excel Columns
The report uses 4 columns for author information:
1. **Subfield 9** - Authority ID (clickable link to authority record)
2. **Subfield a** - Author name
3. **Subfield g** - Date
4. **Subfield q** - Fuller form of name

### Hierarchical Layout
The data is organized with section headers to separate main authors from additional authors:

```
| Subfield 9 | Subfield a                    | Subfield g | Subfield q              |
|------------|-------------------------------|------------|-------------------------|
| 100 Authors                                                                     |
| 8942       | Al-Abiky, Waleed Ibrahim Ali | [date]     | Ibrahim, Khadijah... |
| [more 100 authors if multiple records...]                                      |
| 700 Additional Authors                                                          |
| [id]       | [name]                        | [date]     | [fuller form]        |
| [id]       | [name]                        | [date]     | [fuller form]        |
```

## Implementation Details

### 1. New Service Function
**File:** `src/services/reportService.ts`

**Function:** `generateHierarchicalAuthorsReport(filters: QueryFilters)`

**Interface:** `HierarchicalAuthorRow`
```typescript
export interface HierarchicalAuthorRow {
  subfield_9: string;      // Authority ID
  subfield_a: string;      // Author name
  subfield_g: string;      // Date
  subfield_q: string;      // Fuller form
  isHeaderRow?: boolean;   // Flag for section headers
  headerText?: string;     // Text for headers (e.g., "100 Authors")
}
```

**Features:**
- Extracts all MARC author subfields (a, g, q, 9) for fields 100 and 700
- Supports up to 5 additional authors (700[1-5])
- Creates hierarchical structure with section headers
- Processes all records from the database query

### 2. Excel Export Function
**File:** `src/utils/excelExport.ts`

**Function:** `exportHierarchicalAuthorsToExcel(data, reportName)`

**Features:**
- 4-column layout with descriptive headers
- Special styling for section header rows:
  - Bold blue text
  - Light blue background
  - Increased row height
- Clickable authority ID links (subfield 9)
- Borders on all cells
- Auto-sized columns

### 3. API Route Enhancement
**File:** `src/app/api/reports/route.ts`

**Enhancement:** Added support for `'export_hierarchical_authors'` report type
- Routes to `generateHierarchicalAuthorsReport()` function
- Returns hierarchical data structure
- Compatible with existing filter system

### 4. Export Handler Update
**File:** `src/utils/excelExport.ts`

**Function:** `exportToExcel()`

**Enhancement:** Added conditional handling for hierarchical authors report
```typescript
if (reportType === 'export_hierarchical_authors') {
  return await exportHierarchicalAuthorsToExcel(data, 'hierarchical_authors_report');
}
```

## Usage

### To use this report:

1. **Via API:**
```javascript
const response = await fetch('/api/reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reportType: 'export_hierarchical_authors',
    filters: {
      magazineNumbers: ['1234', '5678'],  // Optional
      biblioNumbers: ['123', '456'],      // Optional
      startYear: 2020,                     // Optional
      endYear: 2024                        // Optional
    }
  })
});
```

2. **Via Frontend Component:**
The report can be triggered using the existing `ReportContent` component by passing the report type:
```typescript
<ReportContent activeReport="export_hierarchical_authors" />
```

## Excel Output Example

The generated Excel file will have:
- **Filename:** `hierarchical_authors_report_YYYY-MM-DDTHH-MM-SS.xlsx`
- **Sheet Name:** "Authors"
- **Column Widths:**
  - Subfield 9: 20 units
  - Subfield a: 40 units
  - Subfield g: 30 units
  - Subfield q: 40 units

## Key Benefits

1. **Clear Separation:** Main authors (100) and additional authors (700) are clearly separated with header rows
2. **Individual Subfields:** Each subfield (a, g, q, 9) has its own column for easy analysis
3. **Authority Links:** Authority IDs are clickable links to the cataloging system
4. **Consistent Structure:** All records follow the same hierarchical pattern
5. **Visual Hierarchy:** Section headers use distinct styling for easy identification

## Data Source

The report uses the same database query infrastructure as other reports:
- Queries the `biblio`, `biblioitems`, and `biblio_metadata` tables
- Uses EXTRACTVALUE to parse MARC XML fields
- Supports all existing filter options (magazine numbers, biblio numbers, year range, author name)

## Technical Notes

- The report maintains backward compatibility with existing report types
- All existing filters work with the hierarchical report
- The hierarchical structure is created at the service layer, not in the database
- Empty subfields are preserved as empty strings in the Excel output
- Section headers are identified by the `isHeaderRow` flag
