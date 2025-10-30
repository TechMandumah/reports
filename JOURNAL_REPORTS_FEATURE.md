# Journal & Conference Reports Feature

## Overview
Added two new main reports to export all data for magazines and conferences from the vtiger database.

## Implementation Date
October 30, 2025

## Feature Description
Two new reports that fetch and export complete data from the `vtiger` database:
1. **All Magazines Data** - Exports all magazine records (numbers 0000-5999)
2. **All Conferences Data** - Exports all conference records (numbers 6000-9999)

## Database Information

### Database: `vtiger`
- **Table 1**: `vtiger_account` - Main account information
- **Table 2**: `vtiger_accountscf` - Custom fields with additional information

### Data Segmentation
Records are differentiated by the `employees` column in `vtiger_account`:
- **Magazines**: `employees` value from `0000` to `5999`
- **Conferences**: `employees` value from `6000` to `9999`

### Query Structure
```sql
-- Magazines Query
SELECT 
  a.*,
  cf.cf_703, cf.cf_707, cf.cf_709, cf.cf_711, cf.cf_715, cf.cf_717,
  cf.cf_719, cf.cf_721, cf.cf_723, cf.cf_725, cf.cf_727, cf.cf_729,
  cf.cf_873, cf.cf_875, cf.cf_877, cf.cf_883, cf.cf_885, cf.cf_887,
  cf.cf_901, cf.cf_903, cf.cf_905, cf.cf_907, cf.cf_919, cf.cf_921,
  cf.cf_923, cf.cf_925, cf.cf_931, cf.cf_933
FROM vtiger_account a
LEFT JOIN vtiger_accountscf cf ON a.accountid = cf.accountid
WHERE CAST(a.employees AS UNSIGNED) >= 0 
  AND CAST(a.employees AS UNSIGNED) <= 5999
ORDER BY CAST(a.employees AS UNSIGNED);

-- Conferences Query
WHERE CAST(a.employees AS UNSIGNED) >= 6000 
  AND CAST(a.employees AS UNSIGNED) <= 9999
```

## Implementation Details

### 1. Environment Variables
Added to `.env.development` and `.env.production`:
```bash
#JOURNAL (VTIGER)
DB_HOST_JNL='127.0.0.1'
DB_PORT_JNL=3306
DB_USER_JNL='root'
DB_PASS_JNL=''
DB_NAME_JNL='vtiger'
```

### 2. Database Connection
**File**: `src/lib/journal_db.ts`
- Created dedicated connection pool for vtiger database
- Functions:
  - `testJournalConnection()` - Test database connectivity
  - `executeJournalQuery<T>(query, params)` - Execute queries with error handling
  - `getJournalConnection()` - Get connection for transactions

### 3. TypeScript Types
**File**: `src/types/database.ts`
Added interfaces:
```typescript
interface VtigerAccount {
  accountid: number;
  account_no: string;
  accountname: string;
  employees: string; // Magazine/Conference number
  // ... other fields
}

interface VtigerAccountsCF {
  accountid: number;
  cf_703: string; // Publisher/Organization
  cf_707: string; // Rights status
  cf_709: string; // ISSN
  cf_877: string; // Country
  cf_883: string; // English title
  cf_901: string; // Subject area
  cf_931: string; // Website URL
  // ... other custom fields
}

interface JournalData extends VtigerAccount, VtigerAccountsCF {}
```

### 4. Service Functions
**File**: `src/services/reportService.ts`
Added functions:
- `getAllMagazinesData()` - Fetch all magazines (0000-5999)
- `getAllConferencesData()` - Fetch all conferences (6000-9999)

### 5. API Routes
Created two new API endpoints:

#### **File**: `src/app/api/magazines/route.ts`
- **Method**: GET
- **Response**: Excel file download
- **Timeout**: 720 seconds (12 minutes)
- **Filename**: `All_Magazines_Data_YYYY-MM-DD.xlsx`

#### **File**: `src/app/api/conferences/route.ts`
- **Method**: GET
- **Response**: Excel file download
- **Timeout**: 720 seconds (12 minutes)
- **Filename**: `All_Conferences_Data_YYYY-MM-DD.xlsx`

### 6. UI Pages
Created two dedicated pages with simple generate button:

#### **File**: `src/app/magazines/page.tsx`
- Clean, centered UI with magazine icon
- Single "Generate Report" button
- Loading state with spinner
- Error handling and display
- Automatic Excel download
- Bilingual (English/Arabic)

#### **File**: `src/app/conferences/page.tsx`
- Clean, centered UI with conference icon
- Single "Generate Report" button
- Loading state with spinner
- Error handling and display
- Automatic Excel download
- Bilingual (English/Arabic)

### 7. Sidebar Navigation
**File**: `src/components/Sidebar.tsx`
- Added new section: "Journal & Conference Reports"
- Added navigation for both reports
- Routes to separate pages instead of inline content
- Updated `handleReportClick()` to navigate to `/magazines` or `/conferences`

### 8. Translations
**File**: `src/utils/localization.ts`
Added translations for:
- `sidebar.journalReports` - "Journal & Conference Reports" / "تقارير الدوريات والمؤتمرات"
- `sidebar.reports.allMagazines` - "All Magazines Data" / "بيانات جميع الدوريات"
- `sidebar.reports.allConferences` - "All Conferences Data" / "بيانات جميع المؤتمرات"

## User Flow

1. **Navigate to Report**
   - User clicks on "All Magazines Data" or "All Conferences Data" in sidebar
   - System navigates to dedicated page (`/magazines` or `/conferences`)

2. **Generate Report**
   - User clicks "Generate Report" button
   - Button shows loading state with spinner
   - API fetches all data from vtiger database

3. **Download Excel**
   - Excel file is automatically generated
   - File downloads automatically with dated filename
   - Success confirmation shown to user

4. **Error Handling**
   - Connection errors displayed clearly
   - User-friendly error messages
   - Option to retry generation

## Files Created/Modified

### Created Files:
1. `src/lib/journal_db.ts` - Journal database connection
2. `src/app/api/magazines/route.ts` - Magazines API endpoint
3. `src/app/api/conferences/route.ts` - Conferences API endpoint
4. `src/app/magazines/page.tsx` - Magazines page UI
5. `src/app/conferences/page.tsx` - Conferences page UI

### Modified Files:
1. `.env.development` - Added journal DB variables
2. `.env.production` - Added journal DB variables
3. `src/types/database.ts` - Added vtiger interfaces
4. `src/services/reportService.ts` - Added service functions
5. `src/components/Sidebar.tsx` - Added navigation logic
6. `src/utils/localization.ts` - Added translations

## Database Fields Reference

### vtiger_account table:
- `accountid` - Primary key
- `account_no` - Account number (e.g., ACC3727)
- `accountname` - Name (Arabic)
- `employees` - Magazine/Conference number (0000-9999)
- `email1`, `email2` - Contact emails
- `website` - Website URL
- `phone`, `otherphone`, `fax` - Contact numbers

### vtiger_accountscf table (Custom Fields):
- `cf_703` - Publisher/Organization name
- `cf_707` - Rights status (تحت التفاوض / مصرحة الحقوق / etc.)
- `cf_709` - ISSN
- `cf_711` - ISBN
- `cf_715` - Status (متوقفة / مستمرة)
- `cf_719` - Frequency (فصلية / نصف سنوية)
- `cf_727` - Database/Category
- `cf_729` - Full database name
- `cf_877` - Country
- `cf_883` - English title
- `cf_885` - Transliteration
- `cf_901` - Subject area (Arabic)
- `cf_903` - English subject
- `cf_931` - Website URL

## Testing

### Manual Testing Checklist:
- [ ] Verify vtiger database connection
- [ ] Test magazines report generation (0000-5999)
- [ ] Test conferences report generation (6000-9999)
- [ ] Verify Excel file download
- [ ] Check bilingual UI (English/Arabic)
- [ ] Test error handling (invalid credentials, timeout)
- [ ] Verify data completeness in exported Excel
- [ ] Test on both development and production environments

### Expected Results:
- Magazines report should contain records with employees 0000-5999
- Conferences report should contain records with employees 6000-9999
- All fields from both tables should be included
- Excel files should be well-formatted and downloadable
- UI should be responsive and bilingual

## Performance Considerations

- **Query Optimization**: Uses CAST() for numeric comparison on employees column
- **Timeout**: Set to 720 seconds to handle large datasets
- **Connection Pool**: Dedicated pool for vtiger database (10 connections)
- **Memory**: Large datasets exported directly to stream

## Security

- Database credentials stored in environment variables
- No SQL injection risk (parameterized queries)
- Authentication required (dashboard access)
- No direct database exposure

## Future Enhancements

1. **Filtering Options**
   - Filter by country (cf_877)
   - Filter by status (cf_715)
   - Filter by subject area (cf_901, cf_903)
   - Date range filtering

2. **Export Formats**
   - CSV export option
   - PDF export option
   - JSON API endpoint

3. **Data Visualization**
   - Summary statistics
   - Charts and graphs
   - Country distribution

4. **Search and Preview**
   - Search before export
   - Preview first 10 records
   - Column selection

## Troubleshooting

### Issue: Database connection failed
**Solution**: Verify environment variables in `.env.development` or `.env.production`

### Issue: Empty result set
**Solution**: Check if vtiger database has data in employees range (0000-5999 or 6000-9999)

### Issue: Timeout error
**Solution**: Increase maxDuration in route.ts or optimize database query

### Issue: Missing columns in Excel
**Solution**: Verify cf_ fields exist in vtiger_accountscf table

## Support

For issues or questions, contact the development team or refer to:
- Database schema: vtiger documentation
- Application logs: `server.log`
- Console logs: Browser developer tools

---

**Version**: 1.1.8  
**Last Updated**: October 30, 2025  
**Author**: Development Team
