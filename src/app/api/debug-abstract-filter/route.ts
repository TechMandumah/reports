import { NextRequest, NextResponse } from 'next/server';
import { getBiblioRecords } from '@/services/reportService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { abstractFilter } = body;

    console.log('Testing abstract filter:', abstractFilter);

    // Test the filter with a small sample
    const records = await getBiblioRecords({
      abstractFilter
    });

    console.log(`Filter '${abstractFilter}' returned ${records.length} records`);
    
    // Return sample data for debugging
    const sampleData = records.slice(0, 5).map(record => ({
      biblionumber: record.biblionumber,
      abstract: record.abstract?.substring(0, 100) + '...',
      title: record.title?.substring(0, 50) + '...',
      author: record.author
    }));

    return NextResponse.json({
      success: true,
      filter: abstractFilter,
      count: records.length,
      sampleData
    });

  } catch (error) {
    console.error('Debug filter error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}