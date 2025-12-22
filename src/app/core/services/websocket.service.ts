import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { IMessage } from '../models';

export interface INotification {
  type: string;
  leadId: string;
  leadName: string;
  phoneNumber: string;
  message: string;
  timestamp: Date;
  messageId: string;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: Socket | null = null;
  private messageSubject = new Subject<IMessage>();
  private notificationSubject = new Subject<INotification>();
  private connectionStatus = signal<
    'connected' | 'disconnected' | 'connecting'
  >('disconnected');

  readonly status = this.connectionStatus.asReadonly();
  readonly messages$ = this.messageSubject.asObservable();
  readonly notifications$ = this.notificationSubject.asObservable();

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.socket?.connected) return;

    this.connectionStatus.set('connecting');
    const token = this.authService.getToken();
    const user = this.authService.currentUser();

    // Connect to the /chat namespace
    this.socket = io(`${environment.wsUrl}/chat`, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      this.connectionStatus.set('connected');
      console.log('WebSocket connected');

      // Authenticate with user ID
      if (user?.id) {
        this.socket?.emit('authenticate', user.id);
      }
    });

    this.socket.on('disconnect', () => {
      this.connectionStatus.set('disconnected');
      console.log('WebSocket disconnected');
    });

    // Listen for new messages (backend sends 'new_message')
    this.socket.on('new_message', (message: IMessage) => {
      console.log('Received new message:', message);
      this.messageSubject.next(message);
    });

    // Listen for notifications (backend sends 'notification' to user rooms)
    // Notifications are separate from messages - they go to the notification panel
    // NOT to the chat messages (which would cause duplicates)
    this.socket.on('notification', (notification: any) => {
      console.log('Received notification:', notification);
      // Emit to notification subject for notification panel handling
      this.notificationSubject.next({
        type: notification.type,
        leadId: notification.leadId,
        leadName: notification.leadName,
        phoneNumber: notification.phoneNumber,
        message: notification.message,
        timestamp: notification.timestamp,
        messageId: notification.messageId,
      });
    });

    this.socket.on('authenticated', (data: any) => {
      console.log('WebSocket authenticated:', data);
    });

    this.socket.on('joined', (data: any) => {
      console.log('Joined room:', data);
    });

    this.socket.on('left', (data: any) => {
      console.log('Left room:', data);
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus.set('disconnected');
    }
  }

  joinLeadRoom(leadId: string): void {
    console.log('Joining lead room:', leadId);
    this.socket?.emit('join_lead', leadId);
  }

  leaveLeadRoom(leadId: string): void {
    console.log('Leaving lead room:', leadId);
    this.socket?.emit('leave_lead', leadId);
  }

  sendMessage(leadId: string, content: string): void {
    this.socket?.emit('sendMessage', { leadId, content });
  }
}
