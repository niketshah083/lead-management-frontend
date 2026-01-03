import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { IApiResponse } from '../models';
import {
  IConnector,
  IConnectorType,
  IConnectorLog,
  IFieldOption,
  ICreateConnector,
  IUpdateConnector,
  IConnectorFilter,
  ITestWebhookResult,
  ConnectorType,
} from '../models/connector.model';

@Injectable({
  providedIn: 'root',
})
export class ConnectorService {
  private readonly basePath = 'connectors';

  connectors = signal<IConnector[]>([]);
  connectorTypes = signal<IConnectorType[]>([]);
  fieldOptions = signal<IFieldOption[]>([]);
  loading = signal(false);

  constructor(private apiService: ApiService) {}

  loadConnectors(
    filters?: IConnectorFilter
  ): Observable<IApiResponse<IConnector[]>> {
    this.loading.set(true);
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.type) params['type'] = filters.type;
      if (filters.isActive !== undefined)
        params['isActive'] = String(filters.isActive);
      if (filters.page) params['page'] = String(filters.page);
      if (filters.limit) params['limit'] = String(filters.limit);
    }
    return this.apiService.get<IConnector[]>(this.basePath, params).pipe(
      tap({
        next: (response) => {
          this.connectors.set(response.data || []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      })
    );
  }

  loadConnectorTypes(): Observable<IApiResponse<{ types: IConnectorType[] }>> {
    return this.apiService
      .get<{ types: IConnectorType[] }>(`${this.basePath}/types`)
      .pipe(
        tap((response) => {
          const types = response.data?.types || response.data || [];
          this.connectorTypes.set(Array.isArray(types) ? types : []);
        })
      );
  }

  loadFieldOptions(): Observable<IApiResponse<{ leadFields: IFieldOption[] }>> {
    return this.apiService
      .get<{ leadFields: IFieldOption[] }>(`${this.basePath}/field-options`)
      .pipe(
        tap((response) => {
          const fields = response.data?.leadFields || response.data || [];
          this.fieldOptions.set(Array.isArray(fields) ? fields : []);
        })
      );
  }

  getConnector(id: string): Observable<IApiResponse<IConnector>> {
    return this.apiService.get<IConnector>(`${this.basePath}/${id}`);
  }

  createConnector(dto: ICreateConnector): Observable<IApiResponse<IConnector>> {
    return this.apiService.post<IConnector>(this.basePath, dto).pipe(
      tap((response) => {
        this.connectors.update((list) => [response.data, ...list]);
      })
    );
  }

  updateConnector(
    id: string,
    dto: IUpdateConnector
  ): Observable<IApiResponse<IConnector>> {
    return this.apiService.put<IConnector>(`${this.basePath}/${id}`, dto).pipe(
      tap((response) => {
        this.connectors.update((list) =>
          list.map((c) => (c.id === id ? response.data : c))
        );
      })
    );
  }

  updateFieldMapping(
    id: string,
    fieldMapping: Record<string, string>
  ): Observable<IApiResponse<IConnector>> {
    return this.apiService
      .put<IConnector>(`${this.basePath}/${id}/field-mapping`, { fieldMapping })
      .pipe(
        tap((response) => {
          this.connectors.update((list) =>
            list.map((c) => (c.id === id ? response.data : c))
          );
        })
      );
  }

  deleteConnector(id: string): Observable<IApiResponse<void>> {
    return this.apiService.delete<void>(`${this.basePath}/${id}`).pipe(
      tap(() => {
        this.connectors.update((list) => list.filter((c) => c.id !== id));
      })
    );
  }

  testConnection(
    id: string
  ): Observable<IApiResponse<{ success: boolean; message: string }>> {
    return this.apiService.post<{ success: boolean; message: string }>(
      `${this.basePath}/${id}/test-connection`,
      {}
    );
  }

  testWebhook(
    id: string,
    payload: Record<string, any>
  ): Observable<IApiResponse<ITestWebhookResult>> {
    return this.apiService.post<ITestWebhookResult>(
      `${this.basePath}/${id}/test-webhook`,
      { payload }
    );
  }

  regenerateSecret(
    id: string
  ): Observable<IApiResponse<{ webhookSecret: string }>> {
    return this.apiService.post<{ webhookSecret: string }>(
      `${this.basePath}/${id}/regenerate-secret`,
      {}
    );
  }

  syncTradeIndia(id: string): Observable<
    IApiResponse<{
      success: boolean;
      message: string;
      leadsCreated: number;
      leadsDuplicate: number;
    }>
  > {
    return this.apiService.post<{
      success: boolean;
      message: string;
      leadsCreated: number;
      leadsDuplicate: number;
    }>(`${this.basePath}/${id}/sync-tradeindia`, {});
  }

  syncGmail(id: string): Observable<
    IApiResponse<{
      success: boolean;
      message: string;
      leadsCreated: number;
      leadsDuplicate: number;
    }>
  > {
    return this.apiService.post<{
      success: boolean;
      message: string;
      leadsCreated: number;
      leadsDuplicate: number;
    }>(`${this.basePath}/${id}/sync-gmail`, {});
  }

  syncOutlook(id: string): Observable<
    IApiResponse<{
      success: boolean;
      message: string;
      leadsCreated: number;
      leadsDuplicate: number;
    }>
  > {
    return this.apiService.post<{
      success: boolean;
      message: string;
      leadsCreated: number;
      leadsDuplicate: number;
    }>(`${this.basePath}/${id}/sync-outlook`, {});
  }

  syncZohoMail(id: string): Observable<
    IApiResponse<{
      success: boolean;
      message: string;
      leadsCreated: number;
      leadsDuplicate: number;
    }>
  > {
    return this.apiService.post<{
      success: boolean;
      message: string;
      leadsCreated: number;
      leadsDuplicate: number;
    }>(`${this.basePath}/${id}/sync-zoho`, {});
  }

  syncImapEmail(id: string): Observable<
    IApiResponse<{
      success: boolean;
      message: string;
      leadsCreated: number;
      leadsDuplicate: number;
    }>
  > {
    return this.apiService.post<{
      success: boolean;
      message: string;
      leadsCreated: number;
      leadsDuplicate: number;
    }>(`${this.basePath}/${id}/sync-imap`, {});
  }

  getConnectorLogs(
    connectorId: string,
    filters?: { level?: string; page?: number; limit?: number }
  ): Observable<IApiResponse<IConnectorLog[]>> {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.level) params['level'] = filters.level;
      if (filters.page) params['page'] = String(filters.page);
      if (filters.limit) params['limit'] = String(filters.limit);
    }
    return this.apiService.get<IConnectorLog[]>(
      `${this.basePath}/${connectorId}/logs`,
      params
    );
  }

  getOAuthUrl(
    type: ConnectorType,
    connectorId: string
  ): Observable<IApiResponse<{ url: string }>> {
    return this.apiService.get<{ url: string }>(
      `${this.basePath}/oauth/authorize/${type}`,
      { connectorId }
    );
  }

  getWebhookFullUrl(connector: IConnector): string {
    const baseUrl = window.location.origin.replace(':4200', ':3000'); // Adjust for API port
    return `${baseUrl}${connector.webhookUrl}`;
  }

  getConnectorIcon(type: ConnectorType): string {
    const icons: Record<ConnectorType, string> = {
      [ConnectorType.WEBHOOK]: 'pi-link',
      [ConnectorType.META]: 'pi-facebook',
      [ConnectorType.GOOGLE]: 'pi-google',
      [ConnectorType.YOUTUBE]: 'pi-youtube',
      [ConnectorType.LINKEDIN]: 'pi-linkedin',
      [ConnectorType.WHATSAPP]: 'pi-whatsapp',
      [ConnectorType.INDIAMART]: 'pi-shopping-cart',
      [ConnectorType.TRADEINDIA]: 'pi-globe',
      [ConnectorType.EMAIL]: 'pi-envelope',
      [ConnectorType.GMAIL]: 'pi-google',
      [ConnectorType.OUTLOOK]: 'pi-microsoft',
      [ConnectorType.ZOHO_MAIL]: 'pi-envelope',
      [ConnectorType.IMAP_EMAIL]: 'pi-inbox',
    };
    return icons[type] || 'pi-plug';
  }

  getStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' {
    switch (status) {
      case 'connected':
        return 'success';
      case 'error':
        return 'danger';
      case 'pending':
        return 'warn';
      default:
        return 'info';
    }
  }
}
