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
    
    // Convert ID column to hyperlinks
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let row = 1; row <= range.e.r; row++) { // Start from 1 to skip header
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 }); // Column A (ID)
      const cell = worksheet[cellAddress];
      if (cell && cell.v) {
        const id = cell.v;
        cell.l = { Target: `https://jtitles.mandumah.com/index.php?module=Accounts&view=Edit&record=${id}` };
        cell.v = String(id); // Ensure it displays as the ID
      }
    }
    //Row with color light green, the next one with very light green from the beginning to the end
    for (let row = 1; row <= range.e.r; row++) {
      const fillColor = (row % 2 === 1) ? 'FFCCFFCC' : 'FFE6FFE6'; // Light green and very light green
      for (let col = 0; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        if (cell) {
              cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: fillColor }
    };
          cell.s = {
            fill: {
              fgColor: { rgb: fillColor }
            }
          };
        }
      }
    }

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
