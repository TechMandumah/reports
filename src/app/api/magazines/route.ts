import { NextResponse } from 'next/server';
import { getAllMagazinesData } from '@/services/reportService';
import * as XLSX from 'xlsx';

export const maxDuration = 720; // 12 minutes

export async function GET() {
  try {
    console.log('📊 Fetching all magazines data...');
    
    // Get all magazines data from vtiger database
    const magazinesData = await getAllMagazinesData();
    
    if (magazinesData.length === 0) {
      return NextResponse.json(
        { error: 'No magazines data found' },
        { status: 404 }
      );
    }
    
    console.log(`✅ Found ${magazinesData.length} magazines`);
    
    // Create Excel workbook
    const worksheet = XLSX.utils.json_to_sheet(magazinesData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Magazines');
    
    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="All_Magazines_Data_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
    
  } catch (error) {
    console.error('❌ Error generating magazines report:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate magazines report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
