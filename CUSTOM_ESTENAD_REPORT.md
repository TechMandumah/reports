# Custom Estenad Report - Feature Documentation

## Overview
The Custom Estenad Report is a new reporting feature that allows users to query and export data from the `auth_header` table in the database. This table contains author authority records with MARC21 format metadata, which are different from the bibliographic records in the main `biblio` table.

## What is Estenad?
**Estenad** (إسناد) means "authority" or "attribution" in Arabic. These reports deal with author authority records that establish standardized forms of names and provide additional biographical information about authors.

## Database Structure
The feature queries the `auth_header` table with the following structure:
- **authid**: Unique identifier for the authority record (bigint)
- **authtypecode**: Type of authority record (e.g., PERSO_NAME, CORPO_NAME)
- **marcxml**: XML formatted MARC21 metadata containing detailed authority information
- **datecreated**: Creation date of the authority record
- **modification_time**: Last modification timestamp
- **origincode**: Source/origin of the authority record

## Supported MARC Fields and Subfields

### Control Fields (No subfields)
- **000**: Leader - Record structure information
- **001**: Control Number - Unique identifier
- **003**: Control Number Identifier - Agency assigning control number
- **005**: Date and Time of Latest Transaction
- **008**: Fixed Length Data Elements - Coded data

### Data Fields (With subfields)
- **040**: Cataloging Source
  - a: Original cataloging agency
  - 6: Linkage
  - 8: Field link and sequence
  - b: Language of cataloging
  - d: Modifying agency
  - e: Description conventions
  - f: Subject heading conventions

- **100**: Heading - Personal Name
  - a: Personal name
  - g: Dates associated with name
  - q: Fuller form of name

- **370**: Associated Place
  - c: Associated country
  - e: Place of birth

- **371**: Address
  - a: Physical address
  - e: Email address
  - m: Telephone number
  - q: Electronic mail address

- **373**: Associated Group
  - a: Associated group name
  - q: Qualifier

- **374**: Occupation
  - 9: Authority record ID
  - a: Occupation term
  - b: Occupation code

- **381**: Other Distinguishing Characteristics
  - a: Characteristic term

## Features

### 1. Custom Field Selection
Users can select any combination of the supported MARC fields for their report. The system:
- Displays field names in both English and Arabic
- Shows subfield information for each field
- Allows "Select All" and "Clear Selection" options
- Validates that at least one field is selected

### 2. Author ID Upload
Users must upload a text file containing author IDs (authid values):
- **Supported format**: Plain text (.txt)
- **ID format**: Numeric values (one per line or comma-separated)
- **Validation**: Checks for valid numeric IDs and reports errors with line numbers

### 3. Data Preview
Before exporting, users can preview:
- First 5 records from their uploaded author IDs
- All selected MARC field values
- Data validation to ensure fields contain values

### 4. Excel Export
Two export options are available:
- **Sample Export**: First 10 records (for testing)
- **Full Export**: All uploaded author IDs

Excel structure:
- **Auth ID**: The authid from auth_header table
- **Auth Details**: Metadata (type, creation date)
- **Dynamic columns**: One column for each selected MARC field/subfield
- **Header styling**: Blue background with white text
- **Cell borders**: Applied to all cells for clarity

## File Structure

### Frontend Components
- **`src/components/CustomEstenadReportForm.tsx`**: 
  - Multi-step form interface
  - File upload with validation
  - Field selection with checkboxes
  - Preview and export functionality
  - Success/error message handling

### Backend Services
- **`src/services/reportService.ts`**:
  - `AUTH_MARC_FIELD_CONFIGS`: Configuration for all supported MARC fields
  - `buildAuthMarcExtractions()`: Builds dynamic EXTRACTVALUE queries
  - `getAuthHeaderRecords()`: Queries auth_header table with filters
  - `generateCustomEstenadReport()`: Main report generation function

### API Endpoints
- **`src/app/api/estenad-reports/route.ts`**:
  - POST endpoint for report generation
  - Validates author IDs and selected fields
  - Supports preview mode (first 5 records)
  - Returns JSON data for Excel export

### Export Utilities
- **`src/utils/excelExport.ts`**:
  - `exportCustomEstenadToExcel()`: Specialized Excel export for estenad data
  - Dynamic column generation based on selected fields
  - MARC field name mapping for readable headers
  - Empty column filtering

### Localization
- **`src/utils/localization.ts`**:
  - English: "Custom Estenad Report"
  - Arabic: "تقرير إسناد مخصص"
  - New sidebar group: "Estenad Reports" / "تقارير الإسناد"

### Type Definitions
- **`src/types/database.ts`**:
  - Added `authorIds?: string[]` to `QueryFilters` interface

## User Workflow

### Step 1: Upload Author IDs
1. Click "Custom Estenad Report" in the "Estenad Reports" sidebar group
2. Upload a `.txt` file with author IDs
3. System validates IDs and shows count of valid entries
4. Any errors are displayed with specific line numbers

### Step 2: Select MARC Fields
1. Choose from 12 available MARC fields
2. Use "Select All" for quick selection
3. Each field shows English/Arabic names and subfield details
4. System tracks selected field count

### Step 3: Preview Data
1. Click "Preview Data" to see first 5 records
2. Review data in table format
3. Verify selected fields contain expected data
4. Return to Step 2 to adjust field selection if needed

### Step 4: Export Report
1. Choose between:
   - **Sample Export**: 10 records for testing
   - **Full Export**: All author IDs
2. System generates and downloads Excel file
3. Success message displays with record count
4. Form resets for new report

## Technical Implementation

### Database Query Optimization
The system uses MySQL's `EXTRACTVALUE()` function for efficient MARC data extraction:
```sql
SELECT 
  ah.authid,
  ah.authtypecode,
  EXTRACTVALUE(ah.marcxml, '//controlfield[@tag="001"]') AS marc_001,
  EXTRACTVALUE(ah.marcxml, '//datafield[@tag="100"]/subfield[@code="a"]') AS marc_100_a,
  ...
FROM auth_header ah
WHERE ah.authid IN (?, ?, ?, ...)
ORDER BY ah.authid
```

### Dynamic Column Generation
Fields are built dynamically based on user selection:
- Control fields (000-008): Direct extraction from leader or controlfield
- Data fields (040+): Extraction from datafield/subfield combinations
- Empty columns automatically filtered from export

### Error Handling
Comprehensive validation at each step:
- File format validation (must be .txt)
- Author ID format validation (must be numeric)
- Field selection validation (at least one required)
- Database query error handling with user-friendly messages

## Integration Points

### Sidebar Navigation
New "Estenad Reports" group added between "Citation Reports" and "Utilities":
```typescript
{
  nameKey: 'sidebar.estenadReports',
  items: [
    { nameKey: 'sidebar.reports.customEstenadReport', id: "custom_estenad_report" }
  ]
}
```

### ReportContent Routing
Special handling for estenad reports:
```typescript
const isEstenadReport = activeReport === 'custom_estenad_report';

if (isEstenadReport) {
  return <CustomEstenadReportForm 
    onGenerate={handleGenerateEstenadReport}
    isGenerating={isGenerating}
    recordCount={recordCount}
    showSuccessMessage={showSuccessMessage}
  />;
}
```

## Example Author ID File Format

```
25
42
55
```

Or comma-separated:
```
25, 42, 55
100, 200, 300
```

## Excel Output Example

| Auth ID | Auth Details | Personal Name (100$a) | Dates (100$g) | Occupation (374$a) | Email (371$e) |
|---------|--------------|----------------------|---------------|-------------------|---------------|
| 25 | AuthType: CORPO_NAME, Created: 2015-07-01 | Maroc. Institut de Sociologie | | | |
| 42 | AuthType: CORPO_NAME, Created: 2015-07-01 | France. Unesco | | | |
| 55 | AuthType: CORPO_NAME, Created: 2015-07-01 | الإمارات. أبوظبي. غرفة التجارة | | | |

## Future Enhancements
Potential improvements for future versions:
1. **Advanced Filters**: Filter by authtypecode, date range, or origin
2. **Bulk Operations**: Process multiple files in batch
3. **Data Validation**: Check for duplicate or invalid author IDs against database
4. **Export Formats**: Add CSV, JSON, or XML export options
5. **Field Presets**: Save common field selections as templates
6. **Cross-Reference**: Link to related bibliographic records

## Version Information
- **Initial Version**: 1.0.0
- **Date**: October 14, 2025
- **Build Status**: ✅ Successfully compiled
- **Dependencies**: 
  - Next.js 15.5.0
  - ExcelJS (for Excel generation)
  - MySQL2 (for database queries)

## Support
For issues or questions about the Estenad Reports feature:
1. Check that the auth_header table exists and is accessible
2. Verify author IDs exist in the database
3. Ensure selected MARC fields contain data for test records
4. Review browser console for detailed error messages
