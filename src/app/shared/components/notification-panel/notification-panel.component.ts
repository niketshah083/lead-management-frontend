import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { Router } from '@angular/router';
import {
  NotificationService,
  FloatingChatService,
  LeadService,
} from '../../../core/services';
import { ChatNotification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule, BadgeModule],
  template: `
    <div class="notification-panel" [class.auto-opened]="wasAutoOpened">
      @if (wasAutoOpened) {
      <div class="auto-open-indicator">
        <i class="pi pi-info-circle"></i>
        <span>Auto-opened for new message</span>
      </div>
      }
      <div class="notification-header">
        <div class="header-title">
          <i class="pi pi-bell"></i>
          <span>Notifications</span>
          @if (notificationService.unreadCount() > 0) {
          <span class="unread-badge">{{
            notificationService.unreadCount()
          }}</span>
          }
        </div>
        <div class="header-actions">
          <button
            pButton
            icon="pi pi-plus"
            [text]="true"
            [rounded]="true"
            size="small"
            pTooltip="Test notification"
            (click)="testNotification()"
            class="test-btn"
          ></button>
          <button
            pButton
            [icon]="autoOpenEnabled ? 'pi pi-eye' : 'pi pi-eye-slash'"
            [text]="true"
            [rounded]="true"
            size="small"
            [pTooltip]="
              autoOpenEnabled
                ? 'Auto-open enabled - Click to disable'
                : 'Auto-open disabled - Click to enable'
            "
            (click)="toggleAutoOpen()"
            [class.auto-open-enabled]="autoOpenEnabled"
          ></button>
          <button
            pButton
            icon="pi pi-volume-up"
            [text]="true"
            [rounded]="true"
            size="small"
            [pTooltip]="
              notificationService.soundEnabled()
                ? 'Disable sound'
                : 'Enable sound'
            "
            (click)="notificationService.toggleSound()"
            [class.sound-enabled]="notificationService.soundEnabled()"
          ></button>
          <button
            pButton
            icon="pi pi-check-circle"
            [text]="true"
            [rounded]="true"
            size="small"
            pTooltip="Mark all as read"
            (click)="notificationService.markAllAsRead()"
            [disabled]="notificationService.unreadCount() === 0"
          ></button>
          <button
            pButton
            icon="pi pi-trash"
            [text]="true"
            [rounded]="true"
            size="small"
            pTooltip="Clear all"
            (click)="notificationService.clearAll()"
            [disabled]="notificationService.notifications().length === 0"
          ></button>
        </div>
      </div>

      <div class="notification-content">
        @if (notificationService.notifications().length === 0) {
        <div class="empty-notifications">
          <i class="pi pi-bell-slash"></i>
          <span>No notifications</span>
        </div>
        } @else { @for (notification of
        notificationService.getRecentNotifications(20); track notification.id) {
        <div
          class="notification-item"
          [class.unread]="!notification.isRead"
          [class.new-chat]="notification.type === 'new_chat'"
          (click)="handleNotificationClick(notification)"
        >
          <div class="notification-avatar">
            {{ getLeadInitials(notification.leadName) }}
          </div>
          <div class="notification-content-area">
            <div class="notification-header-info">
              <div class="notification-name">{{ notification.leadName }}</div>
              <div class="notification-time">
                {{ getTimeAgo(notification.timestamp) }}
              </div>
            </div>
            <div class="notification-phone">
              {{ notification.phoneNumber }}
            </div>
            <div class="notification-message">
              @if (notification.type === 'new_chat') {
              <i class="pi pi-comments type-icon"></i>
              <span class="type-text">Started a new chat</span>
              } @else {
              <i class="pi pi-envelope type-icon"></i>
              }
              <span class="message-text">{{ notification.message }}</span>
            </div>
          </div>
          <div class="notification-actions">
            <button
              pButton
              icon="pi pi-external-link"
              [text]="true"
              [rounded]="true"
              size="small"
              pTooltip="Open floating chat"
              (click)="openFloatingChat(notification, $event)"
              class="float-action"
            ></button>
            <button
              pButton
              icon="pi pi-times"
              [text]="true"
              [rounded]="true"
              size="small"
              pTooltip="Dismiss"
              (click)="dismissNotification(notification, $event)"
              class="dismiss-action"
            ></button>
          </div>
        </div>
        } }
      </div>
    </div>
  `,
  styles: [
    `
      .notification-panel {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
        overflow: hidden;
        max-height: 500px;
        display: flex;
        flex-direction: column;
        position: relative;
      }

      .notification-panel.auto-opened {
        animation: pulseNotification 0.5s ease-out;
      }

      @keyframes pulseNotification {
        0% {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        50% {
          box-shadow: 0 4px 20px rgba(37, 211, 102, 0.3);
        }
        100% {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
      }

      .auto-open-indicator {
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        color: white;
        padding: 0.5rem 1rem;
        font-size: 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: slideDown 0.3s ease-out;
      }

      @keyframes slideDown {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .notification-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.25rem;
        background: #f8fafc;
        border-bottom: 1px solid #e5e7eb;
      }

      .header-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        color: #1f2937;
        font-size: 0.9rem;
      }

      .header-title i {
        color: #f59e0b;
        font-size: 1rem;
      }

      .unread-badge {
        background: #ef4444;
        color: white;
        font-size: 0.7rem;
        font-weight: 600;
        padding: 0.2rem 0.5rem;
        border-radius: 10px;
        min-width: 20px;
        text-align: center;
      }

      .header-actions {
        display: flex;
        gap: 0.25rem;
      }

      .header-actions button {
        width: 28px !important;
        height: 28px !important;
        color: #6b7280 !important;
        background: transparent !important;
        border: none !important;
      }

      .header-actions button:hover {
        background: rgba(107, 114, 128, 0.1) !important;
      }

      .header-actions button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .test-btn {
        color: #3b82f6 !important;
      }

      .auto-open-enabled {
        color: #3b82f6 !important;
      }

      .sound-enabled {
        color: #25d366 !important;
      }

      .notification-content {
        flex: 1;
        overflow-y: auto;
        max-height: 400px;
      }

      .empty-notifications {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        color: #9ca3af;
        gap: 0.5rem;
      }

      .empty-notifications i {
        font-size: 2.5rem;
      }

      .notification-item {
        display: flex;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid #f1f5f9;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
      }

      .notification-item:hover {
        background: #f8fafc;
      }

      .notification-item.unread {
        background: #f0fdf4;
        border-left: 3px solid #25d366;
      }

      .notification-item.new-chat {
        border-left-color: #3b82f6;
      }

      .notification-item.new-chat.unread {
        background: #eff6ff;
      }

      .notification-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.875rem;
        flex-shrink: 0;
      }

      .notification-content-area {
        flex: 1;
        min-width: 0;
      }

      .notification-header-info {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.25rem;
      }

      .notification-name {
        font-weight: 600;
        color: #1f2937;
        font-size: 0.875rem;
      }

      .notification-time {
        font-size: 0.7rem;
        color: #9ca3af;
        white-space: nowrap;
      }

      .notification-phone {
        font-size: 0.75rem;
        color: #6b7280;
        margin-bottom: 0.5rem;
      }

      .notification-message {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        font-size: 0.8rem;
        color: #4b5563;
        line-height: 1.4;
      }

      .type-icon {
        font-size: 0.7rem;
        color: #9ca3af;
        margin-top: 0.1rem;
        flex-shrink: 0;
      }

      .type-text {
        font-style: italic;
        color: #6b7280;
      }

      .message-text {
        word-break: break-word;
      }

      .notification-actions {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .notification-item:hover .notification-actions {
        opacity: 1;
      }

      .notification-actions button {
        width: 24px !important;
        height: 24px !important;
        border: none !important;
      }

      .float-action {
        color: #25d366 !important;
        background: rgba(37, 211, 102, 0.1) !important;
      }

      .float-action:hover {
        background: rgba(37, 211, 102, 0.2) !important;
      }

      .dismiss-action {
        color: #ef4444 !important;
        background: rgba(239, 68, 68, 0.1) !important;
      }

      .dismiss-action:hover {
        background: rgba(239, 68, 68, 0.2) !important;
      }

      /* Scrollbar styling */
      .notification-content::-webkit-scrollbar {
        width: 4px;
      }

      .notification-content::-webkit-scrollbar-track {
        background: transparent;
      }

      .notification-content::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 2px;
      }

      .notification-content::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `,
  ],
})
export class NotificationPanelComponent {
  @Input() wasAutoOpened = false;
  @Output() notificationClick = new EventEmitter<ChatNotification>();
  @Output() autoOpenToggle = new EventEmitter<boolean>();

  autoOpenEnabled = true;

  constructor(
    public notificationService: NotificationService,
    private floatingChatService: FloatingChatService,
    private leadService: LeadService,
    private router: Router
  ) {
    // Load auto-open preference
    const autoOpenPref = localStorage.getItem('auto_open_notifications');
    if (autoOpenPref !== null) {
      this.autoOpenEnabled = autoOpenPref === 'true';
    }
  }

  getLeadInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString();
  }

  handleNotificationClick(notification: ChatNotification): void {
    // Mark as read
    this.notificationService.markAsRead(notification.id);

    // Open floating chat popup instead of navigating
    this.loadLeadAndOpenFloatingChat(notification.leadId);

    // Emit event for parent component
    this.notificationClick.emit(notification);
  }

  openFloatingChat(notification: ChatNotification, event: Event): void {
    event.stopPropagation();

    // Mark as read
    this.notificationService.markAsRead(notification.id);

    // Load lead and open floating chat
    this.loadLeadAndOpenFloatingChat(notification.leadId);
  }

  private loadLeadAndOpenFloatingChat(leadId: string): void {
    this.leadService.getLead(leadId).subscribe({
      next: (response) => {
        this.floatingChatService.openChat(response.data);
      },
      error: (error) => {
        console.error('Error loading lead for floating chat:', error);
      },
    });
  }

  dismissNotification(notification: ChatNotification, event: Event): void {
    event.stopPropagation();
    this.notificationService.removeNotification(notification.id);
  }

  testNotification(): void {
    // Create a test notification
    const testLead = {
      id: 'test-lead-id',
      name: 'Test Contact',
      phoneNumber: '+1234567890',
    } as any;

    const testMessage = {
      id: 'test-message-id',
      leadId: 'test-lead-id',
      content: 'This is a test notification message',
      direction: 'inbound' as const,
      isAutoReply: false,
      status: 'delivered' as const,
      createdAt: new Date(),
    };

    this.notificationService.addNotification(testLead, testMessage, false);
  }

  toggleAutoOpen(): void {
    this.autoOpenEnabled = !this.autoOpenEnabled;
    localStorage.setItem(
      'auto_open_notifications',
      this.autoOpenEnabled.toString()
    );
    this.autoOpenToggle.emit(this.autoOpenEnabled);

    console.log(
      'NotificationPanel: Auto-open notifications:',
      this.autoOpenEnabled
    );
  }
}
