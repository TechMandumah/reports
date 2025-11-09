export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export type JobType = 'magazines_export' | 'conferences_export' | 'custom_report' | 'general_report' | 'citation_report' | 'estenad_report';

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  userEmail: string;
  parameters: any;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  filePath?: string;
  fileName?: string;
  progress?: number;
}

export interface JobResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  error?: string;
  recordCount?: number;
}