import { Job, JobStatus, JobType, JobResult } from '@/types/jobs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

class JobQueue {
  private jobs: Map<string, Job> = new Map();
  private processingQueue: Job[] = [];
  private maxConcurrentJobs = 2; // Adjust based on server capacity
  private runningJobs = 0;
  private persistencePath = path.join('/tmp', 'jobs-data.json');

  constructor() {
    // Load jobs from persistence on initialization
    this.loadJobsFromDisk();
  }

  // Load jobs from disk
  private loadJobsFromDisk(): void {
    try {
      if (fs.existsSync(this.persistencePath)) {
        const data = fs.readFileSync(this.persistencePath, 'utf-8');
        const savedJobs = JSON.parse(data);
        
        // Restore jobs, converting date strings back to Date objects
        const now = new Date();
        savedJobs.forEach((job: any) => {
          const restoredJob: Job = {
            ...job,
            createdAt: new Date(job.createdAt),
            startedAt: job.startedAt ? new Date(job.startedAt) : undefined,
            completedAt: job.completedAt ? new Date(job.completedAt) : undefined,
          };
          this.jobs.set(restoredJob.id, restoredJob);
          
          if (restoredJob.status === 'pending') {
            // Add pending jobs to processing queue
            this.processingQueue.push(restoredJob);
          } else if (restoredJob.status === 'running') {
            // Check if job has been running for too long (stuck)
            // Allow up to 60 minutes for long-running jobs
            const maxRunningTime = 60 * 60 * 1000; // 60 minutes
            const runningTime = restoredJob.startedAt 
              ? now.getTime() - restoredJob.startedAt.getTime()
              : 0;
            
            if (runningTime > maxRunningTime) {
              // Job is stuck, mark as failed
              restoredJob.status = 'failed';
              restoredJob.error = 'Job timed out after 60 minutes';
              restoredJob.completedAt = now;
              console.log(`⏰ Job ${restoredJob.id} timed out (${Math.round(runningTime / 60000)} minutes)`);
            } else {
              // Job is still within acceptable time, keep it running
              console.log(`ℹ️ Job ${restoredJob.id} is running (${Math.round(runningTime / 60000)} minutes elapsed)`);
            }
          }
        });
        
        console.log(`✅ Loaded ${this.jobs.size} jobs from disk`);
        
        // Process pending jobs
        this.processNext();
      }
    } catch (error) {
      console.error('❌ Error loading jobs from disk:', error);
    }
  }

  // Save jobs to disk
  private saveJobsToDisk(): void {
    try {
      const jobsArray = Array.from(this.jobs.values());
      fs.writeFileSync(this.persistencePath, JSON.stringify(jobsArray, null, 2));
    } catch (error) {
      console.error('❌ Error saving jobs to disk:', error);
    }
  }

  // Add a new job to the queue
  addJob(type: JobType, userEmail: string, parameters: any): string {
    const jobId = uuidv4();
    const job: Job = {
      id: jobId,
      type,
      status: 'pending',
      userEmail,
      parameters,
      createdAt: new Date(),
      progress: 0
    };

    this.jobs.set(jobId, job);
    this.processingQueue.push(job);
    this.saveJobsToDisk(); // Persist changes
    
    console.log(`📋 Job ${jobId} added to queue (${type}) for user: ${userEmail}`);
    
    // Try to process the job immediately if capacity allows
    this.processNext();
    
    return jobId;
  }

  // Get job by ID
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  // Get all jobs for a user
  getUserJobs(userEmail: string): Job[] {
    return Array.from(this.jobs.values())
      .filter(job => job.userEmail === userEmail)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Get all jobs (admin function)
  getAllJobs(): Job[] {
    return Array.from(this.jobs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Update job status
  updateJobStatus(jobId: string, status: JobStatus, updates: Partial<Job> = {}): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
      Object.assign(job, updates);
      
      if (status === 'running') {
        job.startedAt = new Date();
      } else if (status === 'completed' || status === 'failed') {
        job.completedAt = new Date();
        this.runningJobs = Math.max(0, this.runningJobs - 1);
        // Process next job in queue
        this.processNext();
      }
      
      this.saveJobsToDisk(); // Persist changes
      console.log(`📊 Job ${jobId} status updated to: ${status}`);
    }
  }

  // Update job progress
  updateJobProgress(jobId: string, progress: number): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.progress = progress;
      console.log(`📈 Job ${jobId} progress: ${progress}%`);
    }
  }

  // Process next job in queue
  private processNext(): void {
    if (this.runningJobs >= this.maxConcurrentJobs) {
      console.log(`⏳ Maximum concurrent jobs (${this.maxConcurrentJobs}) reached. Waiting...`);
      return;
    }

    const nextJob = this.processingQueue.find(job => job.status === 'pending');
    if (nextJob) {
      this.runningJobs++;
      this.updateJobStatus(nextJob.id, 'running');
      
      // Import and execute the job processor
      this.executeJob(nextJob);
    }
  }

  // Execute the job (this will be called by the job processor)
  private async executeJob(job: Job): Promise<void> {
    try {
      console.log(`🚀 Starting job execution: ${job.id} (${job.type})`);
      
      // Dynamic import to avoid circular dependencies
      const { processJob } = await import('@/lib/jobProcessor');
      const result = await processJob(job);
      
      if (result.success) {
        this.updateJobStatus(job.id, 'completed', {
          filePath: result.filePath,
          fileName: result.fileName,
          progress: 100
        });
      } else {
        this.updateJobStatus(job.id, 'failed', {
          error: result.error,
          progress: 0
        });
      }
      
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);
      this.updateJobStatus(job.id, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        progress: 0
      });
    }
  }

  // Clean up old completed jobs (call this periodically)
  cleanupOldJobs(olderThanDays: number = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let cleanedCount = 0;
    for (const [jobId, job] of this.jobs.entries()) {
      if ((job.status === 'completed' || job.status === 'failed') && 
          job.createdAt < cutoffDate) {
        this.jobs.delete(jobId);
        cleanedCount++;
      }
    }
    
    // Also clean up processing queue
    this.processingQueue = this.processingQueue.filter(job => 
      this.jobs.has(job.id)
    );
    
    if (cleanedCount > 0) {
      this.saveJobsToDisk(); // Persist changes
      console.log(`🧹 Cleaned up ${cleanedCount} old jobs`);
    }
  }

  // Get queue statistics
  getStats() {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      running: jobs.filter(j => j.status === 'running').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      runningJobs: this.runningJobs,
      maxConcurrentJobs: this.maxConcurrentJobs
    };
  }
}

// Singleton instance
const jobQueue = new JobQueue();
export default jobQueue;