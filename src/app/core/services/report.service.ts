import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { IApiResponse } from '../models';

export interface IDashboardMetrics {
  totalLeads: number;
  newLeads: number;
  convertedLeads: number;
  conversionRate: number;
  avgResponseTime: number;
  slaCompliance: number;
  leadsByCategory: {
    categoryId: string;
    categoryName: string;
    count: number;
  }[];
  leadsByStatus: { status: string; count: number }[];
  leadsBySource: {
    source: string;
    count: number;
  }[];
}

export interface IBusinessReport {
  totalLeads: number;
  wonLeads: number;
  lostLeads: number;
  inProgressLeads: number;
  winRate: number;
  lossRate: number;
  avgDealCycle: number; // days from initiation to close
  totalRevenue: number;
  avgDealValue: number;
  leadsByStage: {
    stage: string;
    count: number;
    percentage: number;
  }[];
  executivePerformance: IExecutivePerformance[];
  monthlyTrends: IMonthlyTrend[];
  followUpMetrics: IFollowUpMetrics;
}

export interface IExecutivePerformance {
  userId: string;
  userName: string;
  userRole: string;
  totalLeads: number;
  wonLeads: number;
  lostLeads: number;
  inProgressLeads: number;
  winRate: number;
  avgDealCycle: number;
  totalRevenue: number;
  avgDealValue: number;
  followUpStats: {
    totalFollowUps: number;
    completedFollowUps: number;
    pendingFollowUps: number;
    overdueFollowUps: number;
  };
  slaCompliance: number;
  avgResponseTime: number;
  lastActivity: string;
}

export interface IMonthlyTrend {
  month: string;
  year: number;
  totalLeads: number;
  wonLeads: number;
  lostLeads: number;
  revenue: number;
  winRate: number;
}

export interface IFollowUpMetrics {
  totalFollowUps: number;
  completedFollowUps: number;
  pendingFollowUps: number;
  overdueFollowUps: number;
  avgFollowUpTime: number; // hours
  followUpCompletionRate: number;
}

export interface IPeriodReport {
  period: string; // 'daily' | 'weekly' | 'monthly'
  startDate: string;
  endDate: string;
  executiveReports: IExecutivePeriodReport[];
  summary: {
    totalLeads: number;
    wonLeads: number;
    lostLeads: number;
    winRate: number;
    totalRevenue: number;
  };
}

export interface IExecutivePeriodReport {
  userId: string;
  userName: string;
  userRole: string;
  periods: IPeriodData[];
}

export interface IPeriodData {
  date: string;
  totalLeads: number;
  wonLeads: number;
  lostLeads: number;
  inProgressLeads: number;
  winRate: number;
  revenue: number;
  messagesCount: number;
  avgResponseTime: number;
}

export interface ILeadStatusReport {
  statusBreakdown: {
    status: string;
    count: number;
    percentage: number;
    revenue: number;
  }[];
  conversionFunnel: {
    stage: string;
    count: number;
    conversionRate: number;
  }[];
  executiveStatusBreakdown: {
    userId: string;
    userName: string;
    statusCounts: { [key: string]: number };
  }[];
}

export interface IUserPerformance {
  userId: string;
  userName: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  avgResponseTime: number;
  slaCompliance: number;
}

export interface IReportFilter {
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  userId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly basePath = 'reports';

  constructor(private apiService: ApiService) {}

  getDashboardMetrics(
    filters?: IReportFilter
  ): Observable<IApiResponse<IDashboardMetrics>> {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.dateFrom) params['dateFrom'] = filters.dateFrom;
      if (filters.dateTo) params['dateTo'] = filters.dateTo;
      if (filters.categoryId) params['categoryId'] = filters.categoryId;
    }
    return this.apiService.get<IDashboardMetrics>(
      `${this.basePath}/dashboard`,
      params
    );
  }

  getBusinessReport(
    filters?: IReportFilter
  ): Observable<IApiResponse<IBusinessReport>> {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.dateFrom) params['dateFrom'] = filters.dateFrom;
      if (filters.dateTo) params['dateTo'] = filters.dateTo;
      if (filters.categoryId) params['categoryId'] = filters.categoryId;
      if (filters.userId) params['userId'] = filters.userId;
    }
    return this.apiService.get<IBusinessReport>(
      `${this.basePath}/business-report`,
      params
    );
  }

  getExecutivePerformance(
    filters?: IReportFilter
  ): Observable<IApiResponse<IExecutivePerformance[]>> {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.dateFrom) params['dateFrom'] = filters.dateFrom;
      if (filters.dateTo) params['dateTo'] = filters.dateTo;
      if (filters.categoryId) params['categoryId'] = filters.categoryId;
    }
    return this.apiService.get<IExecutivePerformance[]>(
      `${this.basePath}/executive-performance`,
      params
    );
  }

  getMonthlyTrends(
    filters?: IReportFilter
  ): Observable<IApiResponse<IMonthlyTrend[]>> {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.dateFrom) params['dateFrom'] = filters.dateFrom;
      if (filters.dateTo) params['dateTo'] = filters.dateTo;
      if (filters.categoryId) params['categoryId'] = filters.categoryId;
    }
    return this.apiService.get<IMonthlyTrend[]>(
      `${this.basePath}/monthly-trends`,
      params
    );
  }

  exportCsv(filters?: IReportFilter): Observable<Blob> {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.dateFrom) params['dateFrom'] = filters.dateFrom;
      if (filters.dateTo) params['dateTo'] = filters.dateTo;
      if (filters.categoryId) params['categoryId'] = filters.categoryId;
      if (filters.userId) params['userId'] = filters.userId;
    }
    return this.apiService.getBlob(`${this.basePath}/export/csv`, params);
  }

  exportPdf(filters?: IReportFilter): Observable<Blob> {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.dateFrom) params['dateFrom'] = filters.dateFrom;
      if (filters.dateTo) params['dateTo'] = filters.dateTo;
      if (filters.categoryId) params['categoryId'] = filters.categoryId;
      if (filters.userId) params['userId'] = filters.userId;
    }
    return this.apiService.getBlob(`${this.basePath}/export/pdf`, params);
  }

  getPeriodReport(
    period: 'daily' | 'weekly' | 'monthly',
    filters?: IReportFilter
  ): Observable<IApiResponse<IPeriodReport>> {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.dateFrom) params['dateFrom'] = filters.dateFrom;
      if (filters.dateTo) params['dateTo'] = filters.dateTo;
      if (filters.categoryId) params['categoryId'] = filters.categoryId;
      if (filters.userId) params['userId'] = filters.userId;
    }
    return this.apiService.get<IPeriodReport>(
      `${this.basePath}/period-report/${period}`,
      params
    );
  }

  getLeadStatusReport(
    filters?: IReportFilter
  ): Observable<IApiResponse<ILeadStatusReport>> {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.dateFrom) params['dateFrom'] = filters.dateFrom;
      if (filters.dateTo) params['dateTo'] = filters.dateTo;
      if (filters.categoryId) params['categoryId'] = filters.categoryId;
      if (filters.userId) params['userId'] = filters.userId;
    }
    return this.apiService.get<ILeadStatusReport>(
      `${this.basePath}/lead-status-report`,
      params
    );
  }
}
