import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  IApiResponse,
  ILeadStatus,
  IStatusTransition,
  ICreateStatusTransition,
  IBulkCreateTransitions,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class LeadStatusService {
  private readonly basePath = 'lead-statuses';

  constructor(private apiService: ApiService) {}

  getAll(): Observable<IApiResponse<ILeadStatus[]>> {
    return this.apiService.get<ILeadStatus[]>(this.basePath);
  }

  getOne(id: string): Observable<IApiResponse<ILeadStatus>> {
    return this.apiService.get<ILeadStatus>(`${this.basePath}/${id}`);
  }

  getInitial(): Observable<IApiResponse<ILeadStatus>> {
    return this.apiService.get<ILeadStatus>(`${this.basePath}/initial`);
  }

  getAllowedNextStatuses(
    statusId: string
  ): Observable<IApiResponse<ILeadStatus[]>> {
    return this.apiService.get<ILeadStatus[]>(
      `${this.basePath}/${statusId}/allowed-next`
    );
  }

  create(data: Partial<ILeadStatus>): Observable<IApiResponse<ILeadStatus>> {
    return this.apiService.post<ILeadStatus>(this.basePath, data);
  }

  update(
    id: string,
    data: Partial<ILeadStatus>
  ): Observable<IApiResponse<ILeadStatus>> {
    return this.apiService.put<ILeadStatus>(`${this.basePath}/${id}`, data);
  }

  delete(id: string): Observable<IApiResponse<void>> {
    return this.apiService.delete<void>(`${this.basePath}/${id}`);
  }

  reorder(
    statuses: { id: string; order: number }[]
  ): Observable<IApiResponse<void>> {
    return this.apiService.put<void>(`${this.basePath}/reorder/all`, statuses);
  }

  // ============ Status Transition Methods ============

  getAllTransitions(): Observable<IApiResponse<IStatusTransition[]>> {
    return this.apiService.get<IStatusTransition[]>(
      `${this.basePath}/transitions/all`
    );
  }

  getTransitionsFrom(
    statusId: string
  ): Observable<IApiResponse<IStatusTransition[]>> {
    return this.apiService.get<IStatusTransition[]>(
      `${this.basePath}/${statusId}/transitions`
    );
  }

  createTransition(
    data: ICreateStatusTransition
  ): Observable<IApiResponse<IStatusTransition>> {
    return this.apiService.post<IStatusTransition>(
      `${this.basePath}/transitions`,
      data
    );
  }

  bulkCreateTransitions(
    data: IBulkCreateTransitions
  ): Observable<IApiResponse<IStatusTransition[]>> {
    return this.apiService.post<IStatusTransition[]>(
      `${this.basePath}/transitions/bulk`,
      data
    );
  }

  updateTransition(
    id: string,
    data: Partial<IStatusTransition>
  ): Observable<IApiResponse<IStatusTransition>> {
    return this.apiService.put<IStatusTransition>(
      `${this.basePath}/transitions/${id}`,
      data
    );
  }

  deleteTransition(id: string): Observable<IApiResponse<void>> {
    return this.apiService.delete<void>(`${this.basePath}/transitions/${id}`);
  }

  checkTransition(
    fromStatusId: string,
    toStatusId: string
  ): Observable<IApiResponse<{ allowed: boolean; requiresComment: boolean }>> {
    return this.apiService.get<{ allowed: boolean; requiresComment: boolean }>(
      `${this.basePath}/transitions/check`,
      { from: fromStatusId, to: toStatusId }
    );
  }
}
