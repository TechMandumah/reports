import { NextRequest, NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/services/reportService';

export async function GET() {
  try {
    const connectionTest = await testDatabaseConnection();
    
    return NextResponse.json({
      success: connectionTest.success,
      message: connectionTest.success 
        ? `Connected successfully. Found ${connectionTest.sampleCount} records in database.`
        : `Connection failed: ${connectionTest.error}`,
      sampleCount: connectionTest.sampleCount,
      error: connectionTest.error
    });

  } catch (error) {
    console.error('Database connection test error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to test database connection',
        error: error instanceof Error ? error.message : 'Unknown error',
        sampleCount: 0
      },
      { status: 500 }
    );
  }
}
