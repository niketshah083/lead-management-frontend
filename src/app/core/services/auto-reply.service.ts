import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { IApiResponse } from '../models';

export interface IAutoReplyTemplate {
  id: string;
  triggerKeyword: string;
  messageContent: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateAutoReplyTemplate {
  triggerKeyword: string;
  messageContent: string;
  categoryId: string;
  priority?: number;
  isActive?: boolean;
}

export interface IUpdateAutoReplyTemplate {
  triggerKeyword?: string;
  messageContent?: string;
  categoryId?: string;
  priority?: number;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AutoReplyService {
  private readonly basePath = 'auto-reply-templates';

  constructor(private apiService: ApiService) {}

  create(
    data: ICreateAutoReplyTemplate
  ): Observable<IApiResponse<IAutoReplyTemplate>> {
    return this.apiService.post<IAutoReplyTemplate>(this.basePath, data);
  }

  getAll(categoryId?: string): Observable<IApiResponse<IAutoReplyTemplate[]>> {
    const params: Record<string, string> = {};
    if (categoryId) {
      params['categoryId'] = categoryId;
    }
    return this.apiService.get<IAutoReplyTemplate[]>(this.basePath, params);
  }

  getOne(id: string): Observable<IApiResponse<IAutoReplyTemplate>> {
    return this.apiService.get<IAutoReplyTemplate>(`${this.basePath}/${id}`);
  }

  update(
    id: string,
    data: IUpdateAutoReplyTemplate
  ): Observable<IApiResponse<IAutoReplyTemplate>> {
    return this.apiService.put<IAutoReplyTemplate>(
      `${this.basePath}/${id}`,
      data
    );
  }

  delete(id: string): Observable<IApiResponse<void>> {
    return this.apiService.delete<void>(`${this.basePath}/${id}`);
  }
}
