import { NextResponse } from 'next/server';
import { getAllConferencesData } from '@/services/reportService';
import * as XLSX from 'xlsx';

export const maxDuration = 720; // 12 minutes

export async function GET() {
  try {
    console.log('📊 Fetching all conferences data...');
    
    // Get all conferences data from vtiger database
    const conferencesData = await getAllConferencesData();
    
    if (conferencesData.length === 0) {
      return NextResponse.json(
        { error: 'No conferences data found' },
        { status: 404 }
      );
    }
    
    console.log(`✅ Found ${conferencesData.length} conferences`);
    
    // Create Excel workbook
    const worksheet = XLSX.utils.json_to_sheet(conferencesData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Conferences');
    
    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="All_Conferences_Data_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
    
  } catch (error) {
    console.error('❌ Error generating conferences report:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate conferences report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
