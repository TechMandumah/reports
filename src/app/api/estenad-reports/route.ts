import { NextRequest, NextResponse } from 'next/server';
import { generateCustomEstenadReport } from '@/services/reportService';
import { QueryFilters } from '@/types/database';

// Increase the timeout to 5 minutes for long-running reports
export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportType, authorIds, biblioNumbers, selectedFields, isPreview } = body;

    console.log('📝 Estenad Report API Request:', {
      reportType,
      authorIdsCount: authorIds?.length || 0,
      biblioNumbersCount: biblioNumbers?.length || 0,
      selectedFieldsCount: selectedFields?.length || 0,
      isPreview
    });

    // Validate input
    if (!reportType) {
      return NextResponse.json(
        { error: 'Report type is required' },
        { status: 400 }
      );
    }

    // Check that either authorIds or biblioNumbers is provided
    if ((!authorIds || !Array.isArray(authorIds) || authorIds.length === 0) && 
        (!biblioNumbers || !Array.isArray(biblioNumbers) || biblioNumbers.length === 0)) {
      return NextResponse.json(
        { error: 'Either Author IDs or Biblio Numbers are required' },
        { status: 400 }
      );
    }

    if (!selectedFields || !Array.isArray(selectedFields) || selectedFields.length === 0) {
      return NextResponse.json(
        { error: 'Selected MARC fields are required' },
        { status: 400 }
      );
    }

    // Build filters
    const filters: QueryFilters = {
      authorIds,
      biblioNumbers,
      selectedFields,
      isPreview: isPreview || false
    };

    // Generate report based on type
    let data;
    if (reportType === 'custom_estenad_report') {
      data = await generateCustomEstenadReport(filters);
    } else {
      return NextResponse.json(
        { error: 'Invalid report type for estenad reports' },
        { status: 400 }
      );
    }

    console.log('✅ Successfully generated estenad report with', data.length, 'records');

    return NextResponse.json({
      success: true,
      data,
      recordCount: data.length
    });

  } catch (error) {
    console.error('❌ Error in estenad reports API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate estenad report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
