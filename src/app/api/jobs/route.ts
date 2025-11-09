import { NextRequest, NextResponse } from 'next/server';
import jobQueue from '@/lib/jobQueue';
import { JobType } from '@/types/jobs';

export const maxDuration = 60; // This API should be quick

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, userEmail, parameters } = body;

    // Validate required fields
    if (!type || !userEmail) {
      return NextResponse.json(
        { error: 'Job type and user email are required' },
        { status: 400 }
      );
    }

    // Validate job type
    const validJobTypes: JobType[] = ['magazines_export', 'conferences_export', 'custom_report', 'general_report', 'citation_report', 'estenad_report'];
    if (!validJobTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid job type' },
        { status: 400 }
      );
    }

    // Add job to queue
    const jobId = jobQueue.addJob(type, userEmail, parameters || {});

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Job submitted successfully. You will receive an email when it completes.'
    });

  } catch (error) {
    console.error('❌ Error submitting job:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const userEmail = searchParams.get('userEmail');

    if (jobId) {
      // Get specific job
      const job = jobQueue.getJob(jobId);
      if (!job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      // Remove sensitive information
      const safeJob = {
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress || 0,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error
      };

      return NextResponse.json(safeJob);

    } else if (userEmail) {
      // Get all jobs for user
      const jobs = jobQueue.getUserJobs(userEmail);
      
      // Remove sensitive information
      const safeJobs = jobs.map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress || 0,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error
      }));

      return NextResponse.json(safeJobs);

    } else {
      // Get queue statistics
      const stats = jobQueue.getStats();
      return NextResponse.json(stats);
    }

  } catch (error) {
    console.error('❌ Error fetching jobs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}