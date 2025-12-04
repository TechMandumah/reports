import { NextRequest, NextResponse } from 'next/server';
import { getDownloadRecords } from '@/downloads_service/services/downloadsService';
import { DownloadsFilters } from '@/downloads_service/types/downloads';

/**
 * GET /api/downloads/records
 * Get individual download records with biblio details
 * 
 * Query Parameters: Same as stats endpoint
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
    
    const records = await getDownloadRecords(filters);
    
    return NextResponse.json({
      data: records,
      filters,
      total: records.length,
    });
    
  } catch (error) {
    console.error('Error getting download records:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
