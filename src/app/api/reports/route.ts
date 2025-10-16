import { NextRequest, NextResponse } from 'next/server';
import { generatePredefinedReport, generateCustomReport, generateHierarchicalAuthorsReport } from '@/services/reportService';
import { QueryFilters } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { reportType, filters, urlList }: { reportType: string; filters?: QueryFilters; urlList?: string[] } = body;

    // Validate required fields
    if (!reportType) {
      return NextResponse.json(
        { error: 'Report type is required' },
        { status: 400 }
      );
    }

    console.log('Processing report request:', { reportType, filters, urlList });

    let reportData;
    
    if (reportType === 'convert_url_to_biblio' && urlList) {
      console.log('Generating convert URL to biblio report with URL list...');
      // For convert_url_to_biblio with URL list, pass it as filters
      reportData = await generatePredefinedReport(reportType, { urlList });
    } else if (reportType === 'custom' || reportType === 'custom_report') {
      console.log('Generating custom report...');
      reportData = await generateCustomReport(filters || {});
    } else if (reportType === 'export_hierarchical_authors') {
      console.log('Generating hierarchical authors report...');
      reportData = await generateHierarchicalAuthorsReport(filters || {});
    } else {
      console.log('Generating predefined report...');
      reportData = await generatePredefinedReport(reportType, filters || {});
    }

    console.log('Report generated successfully, returning data:', {
      count: reportData?.length || 0,
      hasData: !!reportData
    });

    return NextResponse.json({
      success: true,
      data: reportData || [],
      count: reportData?.length || 0
    });

  } catch (error) {
    console.error('Report generation error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Ensure we always return a valid JSON response
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
