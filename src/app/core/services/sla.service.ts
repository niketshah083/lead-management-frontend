import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { IApiResponse } from '../models';

export interface ISlaPolicy {
  id: string;
  name: string;
  firstResponseMinutes: number;
  followUpMinutes: number;
  resolutionMinutes: number;
  warningThresholdPercent: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateSlaPolicy {
  name: string;
  firstResponseMinutes: number;
  followUpMinutes: number;
  resolutionMinutes: number;
  warningThresholdPercent?: number;
  isDefault?: boolean;
}

export interface IUpdateSlaPolicy {
  name?: string;
  firstResponseMinutes?: number;
  followUpMinutes?: number;
  resolutionMinutes?: number;
  warningThresholdPercent?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface ISlaStatus {
  leadId: string;
  policyId: string;
  responseDeadline: string;
  resolutionDeadline: string;
  isResponseBreached: boolean;
  isResolutionBreached: boolean;
  responseTimeRemaining: number;
  resolutionTimeRemaining: number;
}

@Injectable({
  providedIn: 'root',
})
export class SlaService {
  private readonly basePath = 'sla';

  constructor(private apiService: ApiService) {}

  createPolicy(data: ICreateSlaPolicy): Observable<IApiResponse<ISlaPolicy>> {
    return this.apiService.post<ISlaPolicy>(`${this.basePath}/policies`, data);
  }

  getPolicies(): Observable<IApiResponse<ISlaPolicy[]>> {
    return this.apiService.get<ISlaPolicy[]>(`${this.basePath}/policies`);
  }

  getPolicy(id: string): Observable<IApiResponse<ISlaPolicy>> {
    return this.apiService.get<ISlaPolicy>(`${this.basePath}/policies/${id}`);
  }

  updatePolicy(
    id: string,
    data: IUpdateSlaPolicy
  ): Observable<IApiResponse<ISlaPolicy>> {
    return this.apiService.put<ISlaPolicy>(
      `${this.basePath}/policies/${id}`,
      data
    );
  }

  getSlaStatus(leadId: string): Observable<IApiResponse<ISlaStatus>> {
    return this.apiService.get<ISlaStatus>(
      `${this.basePath}/leads/${leadId}/status`
    );
  }

  getLeadsApproachingBreach(): Observable<IApiResponse<any[]>> {
    return this.apiService.get<any[]>(`${this.basePath}/warnings`);
  }

  getBreachedLeads(): Observable<IApiResponse<any[]>> {
    return this.apiService.get<any[]>(`${this.basePath}/breaches`);
  }
}
