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
        <span>New message received</span>
      </div>
      }

      <!-- Header -->
      <div class="notification-header">
        <div class="header-left">
          <div class="header-icon">
            <i class="pi pi-bell"></i>
          </div>
          <div class="header-info">
            <span class="header-title">Notifications</span>
            @if (notificationService.unreadCount() > 0) {
            <span class="unread-count"
              >{{ notificationService.unreadCount() }} unread</span
            >
            }
          </div>
        </div>
        <button
          pButton
          icon="pi pi-times"
          [text]="true"
          [rounded]="true"
          size="small"
          class="close-btn"
          (click)="closePanel()"
        ></button>
      </div>

      <!-- Quick Actions Bar -->
      <div class="quick-actions">
        <button
          class="action-chip"
          [class.active]="notificationService.soundEnabled()"
          (click)="notificationService.toggleSound()"
          pTooltip="Toggle sound"
        >
          <i
            [class]="
              notificationService.soundEnabled()
                ? 'pi pi-volume-up'
                : 'pi pi-volume-off'
            "
          ></i>
          <span>{{
            notificationService.soundEnabled() ? 'Sound On' : 'Sound Off'
          }}</span>
        </button>
        <button
          class="action-chip"
          [class.active]="autoOpenEnabled"
          (click)="toggleAutoOpen()"
          pTooltip="Auto-open on new messages"
        >
          <i [class]="autoOpenEnabled ? 'pi pi-eye' : 'pi pi-eye-slash'"></i>
          <span>{{ autoOpenEnabled ? 'Auto-open' : 'Manual' }}</span>
        </button>
        <div class="action-spacer"></div>
        <button
          class="action-link"
          (click)="notificationService.markAllAsRead()"
          [disabled]="notificationService.unreadCount() === 0"
        >
          <i class="pi pi-check-circle"></i>
          <span>Mark all read</span>
        </button>
        <button
          class="action-link danger"
          (click)="notificationService.clearAll()"
          [disabled]="notificationService.notifications().length === 0"
        >
          <i class="pi pi-trash"></i>
          <span>Clear all</span>
        </button>
      </div>

      <!-- Notification List -->
      <div class="notification-list">
        @if (notificationService.notifications().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <i class="pi pi-bell-slash"></i>
          </div>
          <h3>No notifications yet</h3>
          <p>When you receive new messages, they'll appear here</p>
          <button
            pButton
            label="Send Test Notification"
            icon="pi pi-send"
            [outlined]="true"
            size="small"
            (click)="testNotification()"
          ></button>
        </div>
        } @else { @for (notification of
        notificationService.getRecentNotifications(20); track notification.id) {
        <div
          class="notification-card"
          [class.unread]="!notification.isRead"
          [class.new-chat]="notification.type === 'new_chat'"
          (click)="handleNotificationClick(notification)"
        >
          <!-- Unread indicator -->
          @if (!notification.isRead) {
          <div class="unread-dot"></div>
          }

          <!-- Avatar -->
          <div
            class="notification-avatar"
            [class.new-chat-avatar]="notification.type === 'new_chat'"
          >
            <span class="avatar-text">{{
              getLeadInitials(notification.leadName)
            }}</span>
          </div>

          <!-- Content -->
          <div class="notification-body">
            <div class="notification-top">
              <span class="notification-name">{{ notification.leadName }}</span>
              <span class="notification-time">{{
                getTimeAgo(notification.timestamp)
              }}</span>
            </div>
            <div class="notification-phone">{{ notification.phoneNumber }}</div>
            <div class="notification-preview">
              @if (notification.type === 'new_chat') {
              <span class="chat-badge">
                <i class="pi pi-comments"></i>
                New conversation
              </span>
              } @else {
              <span class="message-preview">{{ notification.message }}</span>
              }
            </div>
          </div>

          <!-- Actions -->
          <div class="notification-actions">
            <button
              class="action-btn chat-btn"
              (click)="openFloatingChat(notification, $event)"
              pTooltip="Open chat"
            >
              <i class="pi pi-comments"></i>
            </button>
            <button
              class="action-btn dismiss-btn"
              (click)="dismissNotification(notification, $event)"
              pTooltip="Dismiss"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>
        </div>
        } }
      </div>
    </div>
  `,
  styles: [
    `
      /* Panel Container */
      .notification-panel {
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        border: 1px solid #e5e7eb;
        overflow: hidden;
        max-height: 85vh;
        width: 380px;
        display: flex;
        flex-direction: column;
        position: relative;
      }

      .notification-panel.auto-opened {
        animation: pulseGlow 0.6s ease-out;
      }

      @keyframes pulseGlow {
        0% {
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        }
        50% {
          box-shadow: 0 10px 40px rgba(37, 211, 102, 0.4);
        }
        100% {
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        }
      }

      /* Auto-open Indicator */
      .auto-open-indicator {
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        color: white;
        padding: 0.625rem 1rem;
        font-size: 0.8rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      /* Header */
      .notification-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.25rem;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-bottom: 1px solid #e5e7eb;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .header-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.1rem;
      }

      .header-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .header-title {
        font-weight: 700;
        font-size: 1rem;
        color: #1f2937;
      }

      .unread-count {
        font-size: 0.75rem;
        color: #ef4444;
        font-weight: 600;
      }

      .close-btn {
        color: #6b7280 !important;
        width: 32px !important;
        height: 32px !important;
      }

      .close-btn:hover {
        background: rgba(107, 114, 128, 0.1) !important;
        color: #374151 !important;
      }

      /* Quick Actions Bar */
      .quick-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: #f8fafc;
        border-bottom: 1px solid #e5e7eb;
        flex-wrap: wrap;
      }

      .action-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.375rem 0.75rem;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 500;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .action-chip:hover {
        border-color: #d1d5db;
        background: #f9fafb;
      }

      .action-chip.active {
        background: rgba(37, 211, 102, 0.1);
        border-color: #25d366;
        color: #059669;
      }

      .action-chip i {
        font-size: 0.8rem;
      }

      .action-spacer {
        flex: 1;
      }

      .action-link {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        background: transparent;
        border: none;
        font-size: 0.7rem;
        font-weight: 500;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s;
        border-radius: 4px;
      }

      .action-link:hover:not(:disabled) {
        color: #3b82f6;
        background: rgba(59, 130, 246, 0.1);
      }

      .action-link.danger:hover:not(:disabled) {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
      }

      .action-link:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .action-link i {
        font-size: 0.75rem;
      }

      /* Notification List */
      .notification-list {
        flex: 1;
        overflow-y: auto;
        max-height: 450px;
      }

      /* Empty State */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 2rem;
        text-align: center;
      }

      .empty-icon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.25rem;
      }

      .empty-icon i {
        font-size: 2rem;
        color: #94a3b8;
      }

      .empty-state h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
      }

      .empty-state p {
        margin: 0 0 1.5rem 0;
        font-size: 0.875rem;
        color: #6b7280;
        line-height: 1.5;
      }

      /* Notification Card */
      .notification-card {
        display: flex;
        align-items: flex-start;
        gap: 0.875rem;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid #f1f5f9;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        background: white;
      }

      .notification-card:hover {
        background: #f8fafc;
      }

      .notification-card:last-child {
        border-bottom: none;
      }

      .notification-card.unread {
        background: linear-gradient(
          90deg,
          rgba(37, 211, 102, 0.08) 0%,
          rgba(255, 255, 255, 0) 100%
        );
      }

      .notification-card.unread.new-chat {
        background: linear-gradient(
          90deg,
          rgba(59, 130, 246, 0.08) 0%,
          rgba(255, 255, 255, 0) 100%
        );
      }

      /* Unread Dot */
      .unread-dot {
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #25d366;
      }

      .notification-card.new-chat .unread-dot {
        background: #3b82f6;
      }

      /* Avatar */
      .notification-avatar {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(37, 211, 102, 0.3);
      }

      .notification-avatar.new-chat-avatar {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
      }

      .avatar-text {
        color: white;
        font-weight: 700;
        font-size: 0.875rem;
        letter-spacing: 0.5px;
      }

      /* Notification Body */
      .notification-body {
        flex: 1;
        min-width: 0;
      }

      .notification-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.25rem;
      }

      .notification-name {
        font-weight: 600;
        font-size: 0.9rem;
        color: #1f2937;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .notification-time {
        font-size: 0.7rem;
        color: #9ca3af;
        white-space: nowrap;
        margin-left: 0.5rem;
      }

      .notification-phone {
        font-size: 0.75rem;
        color: #6b7280;
        margin-bottom: 0.375rem;
      }

      .notification-preview {
        font-size: 0.8rem;
        color: #4b5563;
        line-height: 1.4;
      }

      .chat-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.25rem 0.625rem;
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 600;
      }

      .chat-badge i {
        font-size: 0.65rem;
      }

      .message-preview {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-break: break-word;
      }

      /* Notification Actions */
      .notification-actions {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .notification-card:hover .notification-actions {
        opacity: 1;
      }

      .action-btn {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .action-btn i {
        font-size: 0.85rem;
      }

      .chat-btn {
        background: rgba(37, 211, 102, 0.1);
        color: #25d366;
      }

      .chat-btn:hover {
        background: rgba(37, 211, 102, 0.2);
        transform: scale(1.05);
      }

      .dismiss-btn {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }

      .dismiss-btn:hover {
        background: rgba(239, 68, 68, 0.2);
        transform: scale(1.05);
      }

      /* Scrollbar */
      .notification-list::-webkit-scrollbar {
        width: 6px;
      }

      .notification-list::-webkit-scrollbar-track {
        background: transparent;
      }

      .notification-list::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 3px;
      }

      .notification-list::-webkit-scrollbar-thumb:hover {
        background: #cbd5e1;
      }

      /* Mobile Responsive */
      @media (max-width: 480px) {
        .notification-panel {
          width: 100%;
          max-width: 100vw;
          border-radius: 0;
          max-height: 100vh;
          height: 100vh;
        }

        .notification-header {
          padding: 1rem;
        }

        .quick-actions {
          padding: 0.625rem 1rem;
        }

        .action-chip span {
          display: none;
        }

        .action-chip {
          padding: 0.5rem;
        }

        .action-link span {
          display: none;
        }

        .notification-card {
          padding: 0.875rem 1rem;
        }

        .notification-avatar {
          width: 40px;
          height: 40px;
        }

        .notification-actions {
          opacity: 1;
          flex-direction: row;
        }

        .action-btn {
          width: 36px;
          height: 36px;
        }

        .notification-list {
          max-height: calc(100vh - 180px);
        }
      }

      @media (max-width: 360px) {
        .header-icon {
          width: 36px;
          height: 36px;
          font-size: 1rem;
        }

        .header-title {
          font-size: 0.9rem;
        }

        .notification-name {
          font-size: 0.85rem;
        }
      }
    `,
  ],
})
export class NotificationPanelComponent {
  @Input() wasAutoOpened = false;
  @Output() notificationClick = new EventEmitter<ChatNotification>();
  @Output() autoOpenToggle = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

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

  closePanel(): void {
    this.close.emit();
  }
}
