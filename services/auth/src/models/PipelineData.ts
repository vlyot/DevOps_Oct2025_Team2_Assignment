export interface PipelineData {
  status: 'success' | 'failure';
  workflowName?: string;
  branch: string;
  commit: string;
  actor: string;
  runId: string;
  runUrl: string;
  jobs: {
    name: string;
    status: string;
  }[];
  failedServices?: string;
  securityFindings?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  duration?: string;
  timestamp: string;
  notifyRoles?: string[];
}
