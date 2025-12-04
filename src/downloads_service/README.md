# Downloads Stats Service

Complete standalone service for tracking and analyzing download statistics from the Mandumah platform.

## Overview

This service provides comprehensive analytics for article and magazine downloads across different databases (EduSearch, Dissertations, Islamic Info, etc.). It tracks download patterns by magazine, article, category, database, and university.

## Architecture

### Database Connections
- **Stats Database**: Contains download action logs from `owa_action_fact` table
- **Koha Database**: Contains bibliographic metadata for enriching download records

### Data Flow
1. Raw download actions are fetched from `stats.owa_action_fact`
2. Action labels are parsed to extract biblionumber, magazine number, and database
3. Bibliographic details are fetched from Koha database
4. Statistics are aggregated across multiple dimensions

## Directory Structure

```
downloads_service/
├── lib/
│   └── stats_database.ts          # Database connections and query execution
├── types/
│   └── downloads.ts                # TypeScript interfaces and types
├── services/
│   └── downloadsService.ts         # Core business logic and data processing
├── components/
│   ├── DownloadsOverview.tsx       # Overview statistics cards
│   ├── DownloadsFiltersForm.tsx    # Filter form component
│   ├── MagazineDownloadsTable.tsx  # Magazine downloads table
│   ├── TopArticlesTable.tsx        # Top articles table
│   ├── DownloadsByGroup.tsx        # Database and category groups
│   └── DownloadsChart.tsx          # Date-based downloads chart
└── README.md                       # This file
```

## API Endpoints

### GET /api/downloads/stats
Get aggregated download statistics with optional filters.

**Query Parameters:**
- `type`: Statistics type (`all`, `magazine`, `articles`, `category`, `database`, `university`)
- `startDate`: Start date in YYYYMMDD format
- `endDate`: End date in YYYYMMDD format
- `magazineNumber`: Filter by magazine number (e.g., "0089")
- `magazineNumbers`: Comma-separated magazine numbers
- `biblionumber`: Filter by single article
- `biblionumbers`: Comma-separated article IDs
- `database`: Filter by database name
- `username`: Filter by university username
- `category`: Filter by category name
- `limit`: Number of records (default: 1000)
- `offset`: Pagination offset

**Response:**
```json
{
  "data": {
    "totalDownloads": 1234,
    "uniqueVisitors": 567,
    "uniqueSessions": 890,
    "downloadsByDate": [...],
    "downloadsByMagazine": [...],
    "downloadsByDatabase": [...],
    "downloadsByCategory": [...],
    "topArticles": [...]
  },
  "filters": {...},
  "total": 1234
}
```

### GET /api/downloads/records
Get individual download records with full details.

**Query Parameters:** Same as `/stats` endpoint

**Response:**
```json
{
  "data": [
    {
      "id": 123,
      "timestamp": 1704056401,
      "year": 2024,
      "month": 1,
      "day": 1,
      "ip_address": "195.43.22.135",
      "cv1_value": "egyptkb",
      "action_label": "https://search.mandumah.com/record/216146#sv#pdf-img#0089-078-002-007.pdf#edusearch#",
      "parsed": {
        "biblionumber": 216146,
        "url": "0089-078-002-007.pdf",
        "magazineNumber": "0089",
        "database": "edusearch"
      },
      "biblio": {
        "biblionumber": 216146,
        "title": "...",
        "author": "...",
        "magazineTitle": "...",
        ...
      }
    }
  ],
  "filters": {...},
  "total": 100
}
```

### GET /api/downloads/test-connection
Test database connections for the downloads service.

**Response:**
```json
{
  "success": true,
  "stats": true,
  "koha": true,
  "message": "All database connections successful"
}
```

## Environment Variables

Add these to your `.env.local` file:

```env
# Stats Database (download tracking)
STATS_DB_HOST=127.0.0.1
STATS_DB_PORT=3306
STATS_DB_USER=root
STATS_DB_PASS=your_password
STATS_DB_NAME=stats

# Koha Database (bibliographic data)
DB_HOST_BIB=127.0.0.1
DB_PORT_BIB=3306
DB_USER_BIB=root
DB_PASS_BIB=your_password
DB_NAME_BIB=koha
```

## Usage Examples

### Get all downloads statistics
```bash
curl "http://localhost:3000/api/downloads/stats?type=all"
```

### Get downloads for a specific magazine
```bash
curl "http://localhost:3000/api/downloads/stats?type=magazine&magazineNumber=0089"
```

### Get downloads by date range
```bash
curl "http://localhost:3000/api/downloads/stats?startDate=20240101&endDate=20240131"
```

### Get downloads by university
```bash
curl "http://localhost:3000/api/downloads/stats?type=university&username=egyptkb"
```

### Get downloads by database
```bash
curl "http://localhost:3000/api/downloads/stats?type=database&database=edusearch"
```

### Get downloads by category
```bash
curl "http://localhost:3000/api/downloads/stats?type=category&category=EduSearch"
```

## Action Label Parsing

The service parses download URLs from the `action_label` field:

**Example URL:**
```
https://search.mandumah.com/record/216146#sv#pdf-img#0089-078-002-007.pdf#edusearch#
```

**Parsed Data:**
- `biblionumber`: 216146
- `url`: 0089-078-002-007.pdf
- `magazineNumber`: 0089 (first 4 digits of filename)
- `database`: edusearch (last segment)

## Statistics Dimensions

The service aggregates downloads across multiple dimensions:

1. **By Date**: Daily download counts with unique visitors
2. **By Magazine**: Download counts grouped by magazine number
3. **By Article**: Top downloaded articles with full metadata
4. **By Database**: Downloads per database (EduSearch, Dissertations, etc.)
5. **By Category**: Downloads per content category
6. **By University**: Downloads per university login

## UI Components

### DownloadsOverview
Displays three key metrics: total downloads, unique visitors, and unique sessions.

### DownloadsFiltersForm
Provides filtering options:
- Date range (start/end)
- Magazine number
- Database selection
- Username (university)
- Category

### MagazineDownloadsTable
Shows download statistics grouped by magazine with:
- Magazine number
- Magazine title
- ISSN
- Download count
- Unique visitors

### TopArticlesTable
Displays most downloaded articles with:
- Biblionumber
- Title
- Author
- Magazine
- Download count
- Unique visitors

### DownloadsByGroup
Shows downloads grouped by:
- Database (EduSearch, Dissertations, etc.)
- Category (top 10)

### DownloadsChart
Visual bar chart of downloads over time.

## Development

### Testing Database Connection
```bash
curl http://localhost:3000/api/downloads/test-connection
```

### Running the Service
1. Ensure MySQL servers are running (stats and koha databases)
2. Configure environment variables
3. Start Next.js development server: `npm run dev`
4. Navigate to: http://localhost:3000/downloads

## Portability

This service is designed to be completely portable. The entire `downloads_service` folder can be:

1. Copied to another Next.js project
2. Moved to a different location in the project structure
3. Deployed as a standalone microservice
4. Integrated into existing applications

All dependencies are self-contained within the folder, with only external dependencies being:
- `mysql2/promise` for database connections
- Next.js framework components
- React and TypeScript

## Performance Considerations

- Database queries are optimized with connection pooling
- EXTRACTVALUE is used for efficient MARC XML parsing
- Results are limited by default (1000 records) to prevent memory issues
- Top articles are limited to 50 by default
- Categories display is limited to top 10

## Future Enhancements

Potential improvements for future versions:

1. **Export Functionality**: Add Excel/CSV export for statistics
2. **Real-time Updates**: Implement WebSocket for live statistics
3. **Advanced Visualizations**: Add charts using Chart.js or Recharts
4. **Caching**: Implement Redis caching for frequently accessed statistics
5. **Pagination**: Add proper pagination for large result sets
6. **Comparative Analysis**: Compare statistics across different time periods
7. **Alerts**: Set up alerts for unusual download patterns
8. **API Rate Limiting**: Protect API endpoints from abuse

## License

This service is part of the Mandumah Reports system.
