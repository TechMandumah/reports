import { NextRequest, NextResponse } from 'next/server';
import {
  getDownloadRecords,
  getDownloadStatistics,
  getMagazineDownloadStats,
  getArticlesDownloadStats,
  getCategoryDownloadStats,
  getDatabaseDownloadStats,
  getUniversityDownloadStats,
  testDownloadsServiceConnection,
} from '@/downloads_service/services/downloadsService';
import { DownloadsFilters } from '@/downloads_service/types/downloads';

/**
 * GET /api/downloads/stats
 * Get download statistics with optional filters
 * 
 * Query Parameters:
 * - startDate: YYYYMMDD format
 * - endDate: YYYYMMDD format
 * - magazineNumber: Single magazine number
 * - magazineNumbers: Comma-separated magazine numbers
 * - biblionumber: Single biblionumber
 * - biblionumbers: Comma-separated biblionumbers
 * - database: Database name (edusearch, dissertations, islamicinfo)
 * - username: Login username
 * - category: Category name
 * - type: Statistics type (all, magazine, articles, category, database, university)
 * - limit: Number of records to return
 * - offset: Offset for pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Build filters from query parameters
    const filters: DownloadsFilters = {};
    
    if (searchParams.has('startDate')) {
      filters.startDate = searchParams.get('startDate')!;
    }
    
    if (searchParams.has('endDate')) {
      filters.endDate = searchParams.get('endDate')!;
    }
    
    if (searchParams.has('magazineNumber')) {
      filters.magazineNumber = searchParams.get('magazineNumber')!;
    }
    
    if (searchParams.has('magazineNumbers')) {
      filters.magazineNumbers = searchParams.get('magazineNumbers')!.split(',');
    }
    
    if (searchParams.has('biblionumber')) {
      filters.biblionumber = parseInt(searchParams.get('biblionumber')!);
    }
    
    if (searchParams.has('biblionumbers')) {
      filters.biblionumbers = searchParams.get('biblionumbers')!
        .split(',')
        .map(n => parseInt(n));
    }
    
    if (searchParams.has('database')) {
      filters.database = searchParams.get('database')!;
    }
    
    if (searchParams.has('username')) {
      filters.username = searchParams.get('username')!;
    }
    
    if (searchParams.has('category')) {
      filters.category = searchParams.get('category')!;
    }
    
    if (searchParams.has('limit')) {
      filters.limit = parseInt(searchParams.get('limit')!);
    }
    
    if (searchParams.has('offset')) {
      filters.offset = parseInt(searchParams.get('offset')!);
    }
    
    const type = searchParams.get('type') || 'all';
    
    let result;
    
    switch (type) {
      case 'magazine':
        if (!filters.magazineNumber) {
          return NextResponse.json(
            { error: 'magazineNumber is required for magazine statistics' },
            { status: 400 }
          );
        }
        result = await getMagazineDownloadStats(filters.magazineNumber, filters);
        break;
        
      case 'articles':
        if (!filters.biblionumbers || filters.biblionumbers.length === 0) {
          return NextResponse.json(
            { error: 'biblionumbers is required for articles statistics' },
            { status: 400 }
          );
        }
        result = await getArticlesDownloadStats(filters.biblionumbers, filters);
        break;
        
      case 'category':
        if (!filters.category) {
          return NextResponse.json(
            { error: 'category is required for category statistics' },
            { status: 400 }
          );
        }
        result = await getCategoryDownloadStats(filters.category, filters);
        break;
        
      case 'database':
        if (!filters.database) {
          return NextResponse.json(
            { error: 'database is required for database statistics' },
            { status: 400 }
          );
        }
        result = await getDatabaseDownloadStats(filters.database, filters);
        break;
        
      case 'university':
        if (!filters.username) {
          return NextResponse.json(
            { error: 'username is required for university statistics' },
            { status: 400 }
          );
        }
        result = await getUniversityDownloadStats(filters.username, filters);
        break;
        
      case 'all':
      default:
        const stats = await getDownloadStatistics(filters);
        result = {
          data: stats,
          filters,
          total: stats.totalDownloads,
        };
        break;
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error getting download statistics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
