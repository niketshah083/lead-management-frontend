import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  IApiResponse,
  IBusinessType,
  IFieldDefinition,
  ICreateBusinessType,
  IUpdateBusinessType,
  ICreateFieldDefinition,
  IUpdateFieldDefinition,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class BusinessTypeService {
  private readonly basePath = 'business-types';

  constructor(private apiService: ApiService) {}

  // ============ Business Type Methods ============

  getAll(activeOnly = false): Observable<IApiResponse<IBusinessType[]>> {
    const params: Record<string, string> = {};
    if (activeOnly) {
      params['activeOnly'] = 'true';
    }
    return this.apiService.get<IBusinessType[]>(this.basePath, params);
  }

  getOne(id: string): Observable<IApiResponse<IBusinessType>> {
    return this.apiService.get<IBusinessType>(`${this.basePath}/${id}`);
  }

  create(data: ICreateBusinessType): Observable<IApiResponse<IBusinessType>> {
    return this.apiService.post<IBusinessType>(this.basePath, data);
  }

  update(
    id: string,
    data: IUpdateBusinessType
  ): Observable<IApiResponse<IBusinessType>> {
    return this.apiService.put<IBusinessType>(`${this.basePath}/${id}`, data);
  }

  delete(id: string): Observable<IApiResponse<void>> {
    return this.apiService.delete<void>(`${this.basePath}/${id}`);
  }

  reorder(
    items: { id: string; order: number }[]
  ): Observable<IApiResponse<void>> {
    return this.apiService.put<void>(`${this.basePath}/reorder`, items);
  }

  // ============ Field Definition Methods ============

  getFields(
    businessTypeId: string,
    activeOnly = false
  ): Observable<IApiResponse<IFieldDefinition[]>> {
    const params: Record<string, string> = {};
    if (activeOnly) {
      params['activeOnly'] = 'true';
    }
    return this.apiService.get<IFieldDefinition[]>(
      `${this.basePath}/${businessTypeId}/fields`,
      params
    );
  }

  createField(
    businessTypeId: string,
    data: Omit<ICreateFieldDefinition, 'businessTypeId'>
  ): Observable<IApiResponse<IFieldDefinition>> {
    return this.apiService.post<IFieldDefinition>(
      `${this.basePath}/${businessTypeId}/fields`,
      data
    );
  }

  updateField(
    fieldId: string,
    data: IUpdateFieldDefinition
  ): Observable<IApiResponse<IFieldDefinition>> {
    return this.apiService.put<IFieldDefinition>(
      `${this.basePath}/fields/${fieldId}`,
      data
    );
  }

  deleteField(fieldId: string): Observable<IApiResponse<void>> {
    return this.apiService.delete<void>(`${this.basePath}/fields/${fieldId}`);
  }

  reorderFields(
    businessTypeId: string,
    items: { id: string; order: number }[]
  ): Observable<IApiResponse<void>> {
    return this.apiService.put<void>(
      `${this.basePath}/${businessTypeId}/fields/reorder`,
      items
    );
  }
}
