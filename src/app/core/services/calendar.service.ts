import { Injectable, OnDestroy, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import {
  IApiResponse,
  IDemoEvent,
  IDemoFilter,
  ICreateDemoEvent,
  IUpdateDemoEvent,
  ICompleteDemoEvent,
  IRescheduleDemoEvent,
  ICancelDemoEvent,
  IDemoConflict,
} from '../models';

// WebSocket event types for demo calendar
export interface IDemoCreatedEvent {
  demo: IDemoEvent;
}

export interface IDemoUpdatedEvent {
  demo: IDemoEvent;
}

export interface IDemoDeletedEvent {
  id: string;
}

export interface IDemoStatusChangedEvent {
  demo: IDemoEvent;
  previousStatus: string;
}

export interface IDemoReminderEvent {
  demo: IDemoEvent;
  minutesUntilStart: number;
}

@Injectable({
  providedIn: 'root',
})
export class CalendarService implements OnDestroy {
  private readonly basePath = 'demos';

  // WebSocket connection for demo calendar namespace
  private socket: Socket | null = null;
  private connectionStatus = signal<
    'connected' | 'disconnected' | 'connecting'
  >('disconnected');

  // WebSocket event subjects
  private demoCreatedSubject = new Subject<IDemoEvent>();
  private demoUpdatedSubject = new Subject<IDemoEvent>();
  private demoDeletedSubject = new Subject<{ id: string }>();
  private demoStatusChangedSubject = new Subject<{
    demo: IDemoEvent;
    previousStatus: string;
  }>();
  private demoReminderSubject = new Subject<{
    demo: IDemoEvent;
    minutesUntilStart: number;
  }>();

  // Public observables for components to subscribe to
  readonly status = this.connectionStatus.asReadonly();
  readonly demoCreated$ = this.demoCreatedSubject.asObservable();
  readonly demoUpdated$ = this.demoUpdatedSubject.asObservable();
  readonly demoDeleted$ = this.demoDeletedSubject.asObservable();
  readonly demoStatusChanged$ = this.demoStatusChangedSubject.asObservable();
  readonly demoReminder$ = this.demoReminderSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  /**
   * Get demos with filters
   * GET /demos
   * Note: Backend TransformInterceptor extracts data.data, so response.data is IDemoEvent[]
   */
  getDemos(filters?: IDemoFilter): Observable<IApiResponse<IDemoEvent[]>> {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.startDate) params['startDate'] = filters.startDate;
      if (filters.endDate) params['endDate'] = filters.endDate;
      if (filters.status?.length) {
        filters.status.forEach((s) => {
          params['status'] = params['status'] ? `${params['status']},${s}` : s;
        });
      }
      if (filters.demoType?.length) {
        filters.demoType.forEach((t) => {
          params['demoType'] = params['demoType']
            ? `${params['demoType']},${t}`
            : t;
        });
      }
      if (filters.categoryId) params['categoryId'] = filters.categoryId;
      if (filters.userId) params['userId'] = filters.userId;
      if (filters.page) params['page'] = filters.page.toString();
      if (filters.limit) params['limit'] = filters.limit.toString();
    }
    return this.apiService.get<IDemoEvent[]>(this.basePath, params);
  }

  /**
   * Get a single demo by ID
   * GET /demos/:id
   */
  getDemo(id: string): Observable<IApiResponse<IDemoEvent>> {
    return this.apiService.get<IDemoEvent>(`${this.basePath}/${id}`);
  }

  /**
   * Create a new demo event
   * POST /demos
   */
  createDemo(data: ICreateDemoEvent): Observable<IApiResponse<IDemoEvent>> {
    return this.apiService.post<IDemoEvent>(this.basePath, data);
  }

  /**
   * Update a demo event
   * PUT /demos/:id
   */
  updateDemo(
    id: string,
    data: IUpdateDemoEvent
  ): Observable<IApiResponse<IDemoEvent>> {
    return this.apiService.put<IDemoEvent>(`${this.basePath}/${id}`, data);
  }

  /**
   * Delete a demo event
   * DELETE /demos/:id
   */
  deleteDemo(id: string): Observable<IApiResponse<{ success: boolean }>> {
    return this.apiService.delete<{ success: boolean }>(
      `${this.basePath}/${id}`
    );
  }

  /**
   * Start a demo
   * PUT /demos/:id/start
   */
  startDemo(id: string): Observable<IApiResponse<IDemoEvent>> {
    return this.apiService.put<IDemoEvent>(`${this.basePath}/${id}/start`, {});
  }

  /**
   * Complete a demo
   * PUT /demos/:id/complete
   */
  completeDemo(
    id: string,
    data: ICompleteDemoEvent
  ): Observable<IApiResponse<IDemoEvent>> {
    return this.apiService.put<IDemoEvent>(
      `${this.basePath}/${id}/complete`,
      data
    );
  }

  /**
   * Cancel a demo
   * PUT /demos/:id/cancel
   */
  cancelDemo(
    id: string,
    data: ICancelDemoEvent
  ): Observable<IApiResponse<IDemoEvent>> {
    return this.apiService.put<IDemoEvent>(
      `${this.basePath}/${id}/cancel`,
      data
    );
  }

  /**
   * Reschedule a demo
   * POST /demos/:id/reschedule
   */
  rescheduleDemo(
    id: string,
    data: IRescheduleDemoEvent
  ): Observable<IApiResponse<IDemoEvent>> {
    return this.apiService.post<IDemoEvent>(
      `${this.basePath}/${id}/reschedule`,
      data
    );
  }

  /**
   * Check for scheduling conflicts
   * GET /demos/check/conflicts
   */
  checkConflicts(
    startTime: string,
    endTime: string,
    userId?: string,
    excludeId?: string
  ): Observable<IApiResponse<{ conflicts: IDemoConflict[] }>> {
    const params: Record<string, string> = {
      startTime,
      endTime,
    };
    if (userId) params['userId'] = userId;
    if (excludeId) params['excludeId'] = excludeId;
    return this.apiService.get<{ conflicts: IDemoConflict[] }>(
      `${this.basePath}/check/conflicts`,
      params
    );
  }

  // ============================================
  // WebSocket Methods for Real-Time Updates
  // ============================================

  /**
   * Connect to the demo calendar WebSocket namespace
   * Requirements: 7.8
   */
  connectWebSocket(): void {
    if (this.socket?.connected) {
      return;
    }

    this.connectionStatus.set('connecting');
    const token = this.authService.getToken();

    // Connect to the /demo-calendar namespace
    this.socket = io(`${environment.wsUrl}/demo-calendar`, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      this.connectionStatus.set('connected');
      console.log('Demo calendar WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      this.connectionStatus.set('disconnected');
      console.log('Demo calendar WebSocket disconnected');
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Demo calendar WebSocket connection error:', error);
      this.connectionStatus.set('disconnected');
    });

    // Listen for demo events
    this.socket.on('demo-created', (demo: IDemoEvent) => {
      console.log('Received demo-created event:', demo);
      this.demoCreatedSubject.next(demo);
    });

    this.socket.on('demo-updated', (demo: IDemoEvent) => {
      console.log('Received demo-updated event:', demo);
      this.demoUpdatedSubject.next(demo);
    });

    this.socket.on('demo-deleted', (data: { id: string }) => {
      console.log('Received demo-deleted event:', data);
      this.demoDeletedSubject.next(data);
    });

    this.socket.on(
      'demo-status-changed',
      (data: { demo: IDemoEvent; previousStatus: string }) => {
        console.log('Received demo-status-changed event:', data);
        this.demoStatusChangedSubject.next(data);
      }
    );

    this.socket.on(
      'demo-reminder',
      (data: { demo: IDemoEvent; minutesUntilStart: number }) => {
        console.log('Received demo-reminder event:', data);
        this.demoReminderSubject.next(data);
      }
    );
  }

  /**
   * Disconnect from the demo calendar WebSocket
   */
  disconnectWebSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus.set('disconnected');
    }
  }

  /**
   * Subscribe to calendar updates for a specific user
   * Requirements: 7.8
   */
  subscribeToCalendar(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe-calendar', { userId });
      console.log(`Subscribed to calendar updates for user: ${userId}`);
    } else {
      console.warn('Cannot subscribe to calendar: WebSocket not connected');
    }
  }

  /**
   * Unsubscribe from calendar updates for a specific user
   */
  unsubscribeFromCalendar(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe-calendar', { userId });
      console.log(`Unsubscribed from calendar updates for user: ${userId}`);
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isWebSocketConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    this.disconnectWebSocket();
    this.demoCreatedSubject.complete();
    this.demoUpdatedSubject.complete();
    this.demoDeletedSubject.complete();
    this.demoStatusChangedSubject.complete();
    this.demoReminderSubject.complete();
  }
}
