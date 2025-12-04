import { NextResponse } from 'next/server';
import { testDownloadsServiceConnection } from '@/downloads_service/services/downloadsService';

/**
 * GET /api/downloads/test-connection
 * Test database connections for downloads service
 */
export async function GET() {
  try {
    const result = await testDownloadsServiceConnection();
    
    return NextResponse.json({
      success: result.stats && result.koha,
      stats: result.stats,
      koha: result.koha,
      message: result.message,
    });
    
  } catch (error) {
    console.error('Error testing connections:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
