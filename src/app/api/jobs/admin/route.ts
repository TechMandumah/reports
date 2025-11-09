import { NextRequest, NextResponse } from 'next/server';
import jobQueue from '@/lib/jobQueue';
import { cleanupOldFiles } from '@/lib/jobProcessor';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, olderThanDays = 7 } = body;

    if (action === 'cleanup') {
      // Clean up old jobs and files
      jobQueue.cleanupOldJobs(olderThanDays);
      cleanupOldFiles(olderThanDays);

      return NextResponse.json({
        success: true,
        message: `Cleanup completed for items older than ${olderThanDays} days`
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Error in admin operation:', error);
    return NextResponse.json(
      { 
        error: 'Admin operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get all jobs and statistics (admin function)
    const allJobs = jobQueue.getAllJobs();
    const stats = jobQueue.getStats();

    return NextResponse.json({
      jobs: allJobs.map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        userEmail: job.userEmail,
        progress: job.progress || 0,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error
      })),
      stats
    });

  } catch (error) {
    console.error('❌ Error fetching admin data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch admin data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}