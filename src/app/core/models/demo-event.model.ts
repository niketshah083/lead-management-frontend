// Demo Status enum matching backend
export enum DemoStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  MISSED = 'missed',
  RESCHEDULED = 'rescheduled',
}

// Demo Type enum matching backend
export enum DemoType {
  PRODUCT_DEMO = 'product_demo',
  FOLLOW_UP = 'follow_up',
  TECHNICAL_DEEPDIVE = 'technical_deepdive',
  PRICING_DISCUSSION = 'pricing_discussion',
}

// Demo Outcome enum matching backend
export enum DemoOutcome {
  SUCCESSFUL = 'successful',
  NEEDS_FOLLOWUP = 'needs_followup',
  NOT_INTERESTED = 'not_interested',
  NO_SHOW = 'no_show',
}

// Demo Event interface matching backend entity
export interface IDemoEvent {
  id: string;
  leadId: string;
  lead?: {
    id: string;
    name?: string;
    phoneNumber: string;
    category?: {
      id: string;
      name: string;
    };
  };
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  scheduledAt: string | Date;
  durationMinutes: number;
  demoType: DemoType;
  status: DemoStatus;
  notes?: string | null;
  meetingLink?: string | null;
  outcome?: DemoOutcome | null;
  outcomeNotes?: string | null;
  actualStartTime?: string | Date | null;
  actualEndTime?: string | Date | null;
  cancellationReason?: string | null;
  rescheduledFromId?: string | null;
  rescheduledFrom?: IDemoEvent | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Create Demo Event DTO matching backend
export interface ICreateDemoEvent {
  leadId: string;
  scheduledAt: string;
  durationMinutes: number;
  demoType: DemoType;
  notes?: string;
  meetingLink?: string;
}

// Update Demo Event DTO matching backend
export interface IUpdateDemoEvent {
  scheduledAt?: string;
  durationMinutes?: number;
  demoType?: DemoType;
  notes?: string;
  meetingLink?: string;
}

// Demo Filter DTO matching backend
export interface IDemoFilter {
  startDate?: string;
  endDate?: string;
  status?: DemoStatus[];
  demoType?: DemoType[];
  categoryId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

// Complete Demo DTO
export interface ICompleteDemoEvent {
  outcome: DemoOutcome;
  outcomeNotes?: string;
}

// Reschedule Demo DTO
export interface IRescheduleDemoEvent {
  scheduledAt: string;
  durationMinutes?: number;
}

// Cancel Demo DTO
export interface ICancelDemoEvent {
  cancellationReason: string;
}

// Conflict check response
export interface IDemoConflict {
  id: string;
  leadName?: string;
  scheduledAt: string | Date;
  durationMinutes: number;
}

// Demo list response with pagination
export interface IDemoListResponse {
  data: IDemoEvent[];
  total: number;
  page: number;
  limit: number;
}

// Helper functions for demo status display
export const DemoStatusLabels: Record<DemoStatus, string> = {
  [DemoStatus.SCHEDULED]: 'Scheduled',
  [DemoStatus.CONFIRMED]: 'Confirmed',
  [DemoStatus.IN_PROGRESS]: 'In Progress',
  [DemoStatus.COMPLETED]: 'Completed',
  [DemoStatus.CANCELLED]: 'Cancelled',
  [DemoStatus.MISSED]: 'Missed',
  [DemoStatus.RESCHEDULED]: 'Rescheduled',
};

export const DemoStatusColors: Record<DemoStatus, string> = {
  [DemoStatus.SCHEDULED]: '#3b82f6', // Blue - Scheduled
  [DemoStatus.CONFIRMED]: '#22c55e', // Green - Confirmed
  [DemoStatus.IN_PROGRESS]: '#f59e0b', // Yellow/Amber - In Progress
  [DemoStatus.COMPLETED]: '#6b7280', // Gray - Completed
  [DemoStatus.CANCELLED]: '#6b7280', // Gray - Cancelled (same as completed per requirements)
  [DemoStatus.MISSED]: '#ef4444', // Red - Missed/Overdue
  [DemoStatus.RESCHEDULED]: '#8b5cf6', // Purple - Rescheduled
};

// Time-based visual indicator colors (override status colors based on time)
export const DemoTimeBasedColors = {
  STARTING_SOON: '#f59e0b', // Yellow - demos within 60 minutes
  IMMINENT: '#f97316', // Orange - demos within 15 minutes (pulsing)
  OVERDUE: '#ef4444', // Red - demos past scheduled time
};

export const DemoTypeLabels: Record<DemoType, string> = {
  [DemoType.PRODUCT_DEMO]: 'Product Demo',
  [DemoType.FOLLOW_UP]: 'Follow Up',
  [DemoType.TECHNICAL_DEEPDIVE]: 'Technical Deep Dive',
  [DemoType.PRICING_DISCUSSION]: 'Pricing Discussion',
};

export const DemoOutcomeLabels: Record<DemoOutcome, string> = {
  [DemoOutcome.SUCCESSFUL]: 'Successful',
  [DemoOutcome.NEEDS_FOLLOWUP]: 'Needs Follow-up',
  [DemoOutcome.NOT_INTERESTED]: 'Not Interested',
  [DemoOutcome.NO_SHOW]: 'No Show',
};
