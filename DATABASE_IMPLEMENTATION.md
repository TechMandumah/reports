# Manduma Magazine Reports App - Database Setup & Implementation Guide

## Overview
This guide covers the complete implementation of a real MySQL database integration for the Manduma Magazine Reports application, replacing the previous mock data system.

## Database Implementation Features

### ✅ Completed Features
1. **MySQL Database Integration**
   - Connection pool configuration using mysql2
   - Real database queries replacing mock data
   - Koha library database schema support

2. **MARC XML Processing**
   - MARC field extraction from XML metadata
   - Support for 23 MARC fields including titles, authors, abstracts
   - Unicode support for Arabic content

3. **Report Generation System**
   - 8 predefined report types with database queries
   - Custom reports with selectable MARC fields
   - Excel export with real data from database

4. **API Endpoints**
   - `/api/reports` - Generate reports with database data
   - `/api/test-connection` - Test database connectivity

## Database Setup Instructions

### Prerequisites
1. **MySQL Server**: Install MySQL on your local machine
2. **Node.js**: Version 18 or higher
3. **Package Dependencies**: Already installed (mysql2, xmldom, xlsx)

### Step 1: Database Setup
1. **Start MySQL Server** on your local machine
2. **Import the existing database**:
   ```bash
   mysql -u root -p < database.sql
   ```
   This will create the `koha` database with sample Arabic content.

3. **Verify Database Connection**:
   ```sql
   mysql -u root -p
   USE koha;
   SELECT COUNT(*) FROM biblio;
   SELECT COUNT(*) FROM biblio_metadata;
   ```

### Step 2: Update Database Credentials
Edit `src/lib/database.ts` and update the database configuration:
```typescript
const dbConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'YOUR_MYSQL_PASSWORD', // Update this
  database: 'koha',
  // ... other settings
};
```

### Step 3: Test the Implementation
1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test database connection**:
   - Visit: http://localhost:3000/api/test-connection
   - Should return: `{"success": true, "sampleCount": 5, "message": "Connected successfully..."}`

3. **Test report generation**:
   - Navigate to any report page
   - Enter magazine numbers (use 1, 2, 3, 4, 5 from sample data)
   - Generate report and verify Excel export contains real data

## Database Schema Details

### Tables Structure
- **`biblio`**: Main bibliographic records (titles, authors, dates)
- **`biblio_metadata`**: MARC XML metadata for detailed field extraction
- **`biblioitems`**: Publication details (URLs, journal numbers, volumes)

### Sample Data
The database contains 5 sample records with:
- Arabic titles and authors
- MARC XML metadata with multiple fields
- Publication information and URLs
- Copyright dates ranging 1955-2014

### MARC Fields Supported
The system extracts 23 MARC fields including:
- **100**: Main Author
- **245**: Main Title  
- **246**: Alternative Title
- **242**: Translated Title
- **520**: Abstract
- **373**: University/Institution
- And 17 additional fields for custom reports

## API Usage Examples

### Generate Predefined Report
```javascript
POST /api/reports
{
  "reportType": "export_research_titles",
  "filters": {
    "magazineNumbers": ["1", "2", "3"],
    "startYear": 2010,
    "endYear": 2025
  }
}
```

### Generate Custom Report
```javascript
POST /api/reports
{
  "reportType": "custom", 
  "filters": {
    "magazineNumbers": ["1", "2"],
    "selectedFields": ["100", "245", "520"]
  }
}
```

## File Structure Changes

### New Files Created
- `src/lib/database.ts` - Database connection and query utilities
- `src/types/database.ts` - TypeScript interfaces for database entities
- `src/utils/marcParser.ts` - MARC XML parsing utilities
- `src/services/reportService.ts` - Database-powered report generation
- `src/app/api/reports/route.ts` - API endpoint for report generation
- `src/app/api/test-connection/route.ts` - Database connection testing

### Modified Files
- `src/utils/excelExport.ts` - Updated to use database API calls
- `src/components/ReportContent.tsx` - Updated to use async export with error handling

## Database Performance Optimizations

### Indexes Created
```sql
CREATE INDEX idx_biblio_author ON biblio (author(100));
CREATE INDEX idx_biblio_title ON biblio (title(100)); 
CREATE INDEX idx_biblio_copyrightdate ON biblio (copyrightdate);
CREATE INDEX idx_biblioitems_journalnum ON biblioitems (journalnum);
```

### Connection Pooling
- Maximum 10 concurrent connections
- 60-second timeout for queries
- Automatic reconnection on connection loss

## URL Generation Strategy

### Different Database Sources
The system supports multiple database sources:
- **Cataloging Database**: `https://cataloging.mandumah.com`
- **Citation Database**: `https://citation-db.mandumah.com`

Reports automatically use the correct base URL based on report type.

## Error Handling

### Database Connection Errors
- Connection testing API endpoint
- Graceful error messages in UI
- Fallback error handling in all database operations

### Data Validation
- Magazine number format validation (4-digit format)
- Year range validation
- MARC field existence checking

## Testing the Implementation

### Manual Testing Steps
1. **Database Connection**: Visit `/api/test-connection`
2. **Predefined Reports**: Test all 8 report types with sample magazine numbers
3. **Custom Reports**: Select different MARC fields and generate exports
4. **Filter Testing**: Test year ranges, author filters, magazine number filters
5. **Excel Export**: Verify exported files contain real database data

### Sample Test Data
Use these magazine numbers for testing: `1`, `2`, `3`, `4`, `5`

These correspond to the sample records in the database with Arabic content.

## Production Deployment Considerations

### Database Security
- Use environment variables for database credentials
- Implement connection encryption for production
- Set up proper user permissions and access controls

### Performance Monitoring
- Monitor query execution times
- Implement query result caching for frequently accessed data
- Set up database connection monitoring

### Scaling
- Consider read replicas for high-traffic scenarios
- Implement query result pagination for large datasets
- Monitor connection pool usage and adjust as needed

## Troubleshooting

### Common Issues
1. **"Connection failed"**: Check MySQL server status and credentials
2. **"No data found"**: Verify magazine numbers exist in database
3. **"MARC field not found"**: Check biblio_metadata table for XML content
4. **Excel export errors**: Ensure XLSX library is properly installed

### Debug Commands
```bash
# Test MySQL connection
mysql -u root -p -e "USE koha; SELECT COUNT(*) FROM biblio;"

# Check Node.js packages
npm list mysql2 xmldom xlsx

# View server logs
npm run dev
```

## Next Steps

This implementation provides a complete foundation for:
1. **Production Deployment** with real library databases
2. **Extended MARC Field Support** with additional field mappings
3. **Advanced Filtering** with more complex query capabilities
4. **Bulk Data Processing** for large library collections
5. **Report Scheduling** with automated export generation

The system is now ready for production use with real Koha library database integration.
