import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  IApiResponse,
  ILead,
  ILeadFilter,
  ILeadHistory,
  ILeadContact,
  IMessage,
  ISendMessage,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class LeadService {
  private readonly basePath = 'leads';

  constructor(private apiService: ApiService) {}

  getLeads(filters?: ILeadFilter): Observable<IApiResponse<ILead[]>> {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.status?.length) params['status'] = filters.status.join(',');
      if (filters.categoryId) params['categoryId'] = filters.categoryId;
      if (filters.unassignedOnly) {
        params['unassignedOnly'] = 'true';
      } else if (filters.assignedToId) {
        params['assignedToId'] = filters.assignedToId;
      }
      if (filters.dateFrom) params['dateFrom'] = filters.dateFrom;
      if (filters.dateTo) params['dateTo'] = filters.dateTo;
      if (filters.page) params['page'] = filters.page.toString();
      if (filters.limit) params['limit'] = filters.limit.toString();
    }
    return this.apiService.get<ILead[]>(this.basePath, params);
  }

  getLead(id: string): Observable<IApiResponse<ILead>> {
    return this.apiService.get<ILead>(`${this.basePath}/${id}`);
  }

  claimLead(id: string): Observable<IApiResponse<ILead>> {
    return this.apiService.post<ILead>(`${this.basePath}/${id}/claim`, {});
  }

  updateLeadStatus(
    id: string,
    status?: string,
    notes?: string,
    statusMasterId?: string
  ): Observable<IApiResponse<ILead>> {
    const body: { status?: string; notes?: string; statusMasterId?: string } =
      {};
    if (statusMasterId) {
      body.statusMasterId = statusMasterId;
    } else if (status) {
      body.status = status;
    }
    if (notes) {
      body.notes = notes;
    }
    return this.apiService.put<ILead>(`${this.basePath}/${id}/status`, body);
  }

  reassignLead(
    id: string,
    assignedToId: string,
    notes?: string
  ): Observable<IApiResponse<ILead>> {
    return this.apiService.put<ILead>(`${this.basePath}/${id}/reassign`, {
      assignedToId,
      notes,
    });
  }

  updateLead(
    id: string,
    data: { categoryId?: string; status?: string; name?: string }
  ): Observable<IApiResponse<ILead>> {
    return this.apiService.put<ILead>(`${this.basePath}/${id}`, data);
  }

  getLeadHistory(id: string): Observable<IApiResponse<ILeadHistory[]>> {
    return this.apiService.get<ILeadHistory[]>(
      `${this.basePath}/${id}/history`
    );
  }

  // Address methods
  updateLeadAddress(
    id: string,
    address: {
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      country?: string;
    }
  ): Observable<IApiResponse<ILead>> {
    return this.apiService.put<ILead>(
      `${this.basePath}/${id}/address`,
      address
    );
  }

  // Contact methods
  getLeadContacts(id: string): Observable<IApiResponse<ILeadContact[]>> {
    return this.apiService.get<ILeadContact[]>(
      `${this.basePath}/${id}/contacts`
    );
  }

  createLeadContact(
    leadId: string,
    contact: {
      name: string;
      designation?: string;
      phone?: string;
      email?: string;
      isPrimary?: boolean;
    }
  ): Observable<IApiResponse<ILeadContact>> {
    return this.apiService.post<ILeadContact>(
      `${this.basePath}/${leadId}/contacts`,
      contact
    );
  }

  updateLeadContact(
    leadId: string,
    contactId: string,
    contact: {
      name?: string;
      designation?: string;
      phone?: string;
      email?: string;
      isPrimary?: boolean;
    }
  ): Observable<IApiResponse<ILeadContact>> {
    return this.apiService.put<ILeadContact>(
      `${this.basePath}/${leadId}/contacts/${contactId}`,
      contact
    );
  }

  deleteLeadContact(
    leadId: string,
    contactId: string
  ): Observable<IApiResponse<void>> {
    return this.apiService.delete<void>(
      `${this.basePath}/${leadId}/contacts/${contactId}`
    );
  }

  // Pincode lookup
  lookupPincode(
    pincode: string
  ): Observable<
    IApiResponse<{ city: string; state: string; country: string } | null>
  > {
    return this.apiService.get<{
      city: string;
      state: string;
      country: string;
    } | null>(`${this.basePath}/lookup/pincode/${pincode}`);
  }

  getMessages(leadId: string): Observable<IApiResponse<IMessage[]>> {
    return this.apiService.get<IMessage[]>(`messages/lead/${leadId}`);
  }

  sendMessage(
    leadId: string,
    data: ISendMessage
  ): Observable<IApiResponse<IMessage>> {
    return this.apiService.post<IMessage>(`messages/lead/${leadId}`, data);
  }

  createLead(data: {
    phoneNumber: string;
    name?: string;
    email?: string;
    businessName?: string;
    categoryId?: string;
  }): Observable<IApiResponse<ILead>> {
    return this.apiService.post<ILead>(this.basePath, data);
  }

  bulkUploadLeads(file: File): Observable<
    IApiResponse<{
      total: number;
      created: number;
      skipped: number;
      errors: Array<{ row: number; message: string }>;
    }>
  > {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiService.postFormData<{
      total: number;
      created: number;
      skipped: number;
      errors: Array<{ row: number; message: string }>;
    }>(`${this.basePath}/bulk-upload`, formData);
  }

  getCategories(): Observable<any[]> {
    return this.apiService.getArray<any>('categories');
  }

  getUsers(): Observable<any[]> {
    return this.apiService.getArray<any>('users');
  }

  // ============ Custom Field Methods ============

  getCustomFields(leadId: string): Observable<
    IApiResponse<
      Array<{
        id: string;
        fieldDefinitionId: string;
        fieldDefinition: any;
        value?: string;
        arrayValue?: string[];
      }>
    >
  > {
    return this.apiService.get<any[]>(
      `${this.basePath}/${leadId}/custom-fields`
    );
  }

  setCustomField(
    leadId: string,
    fieldDefinitionId: string,
    value?: string,
    arrayValue?: string[]
  ): Observable<IApiResponse<any>> {
    return this.apiService.put<any>(
      `${this.basePath}/${leadId}/custom-fields/${fieldDefinitionId}`,
      { value, arrayValue }
    );
  }

  bulkSetCustomFields(
    leadId: string,
    fields: Array<{
      fieldDefinitionId: string;
      value?: string;
      arrayValue?: string[];
    }>
  ): Observable<IApiResponse<any[]>> {
    return this.apiService.put<any[]>(
      `${this.basePath}/${leadId}/custom-fields`,
      { fields }
    );
  }

  deleteCustomField(
    leadId: string,
    fieldDefinitionId: string
  ): Observable<IApiResponse<void>> {
    return this.apiService.delete<void>(
      `${this.basePath}/${leadId}/custom-fields/${fieldDefinitionId}`
    );
  }

  updateBusinessType(
    leadId: string,
    businessTypeId: string | null
  ): Observable<IApiResponse<ILead>> {
    return this.apiService.put<ILead>(
      `${this.basePath}/${leadId}/business-type`,
      {
        businessTypeId,
      }
    );
  }

  getLeadWithCustomFields(leadId: string): Observable<IApiResponse<ILead>> {
    return this.apiService.get<ILead>(
      `${this.basePath}/${leadId}/with-custom-fields`
    );
  }
}
