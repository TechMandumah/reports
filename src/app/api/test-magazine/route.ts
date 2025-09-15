import { NextRequest, NextResponse } from 'next/server';
import { getBiblioRecords } from '@/services/reportService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const magazineNumber = searchParams.get('magazine');
    
    if (!magazineNumber) {
      return NextResponse.json(
        { error: 'Magazine number parameter is required' },
        { status: 400 }
      );
    }

    // Test the magazine number lookup
    const records = await getBiblioRecords({ 
      magazineNumbers: [magazineNumber] 
    });

    return NextResponse.json({
      success: true,
      magazineNumber,
      recordsFound: records.length,
      records: records.map(record => ({
        biblionumber: record.biblionumber,
        title: record.title,
        author: record.author,
        url: record.url,
        journalnum: record.journalnum,
        volumenumber: record.volumenumber,
        issuenumber: record.issuenumber
      }))
    });

  } catch (error) {
    console.error('Magazine lookup error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to lookup magazine',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
