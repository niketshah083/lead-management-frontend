import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { Subscription } from 'rxjs';
import {
  RoleBasedChatService,
  FloatingChatService,
  AuthService,
  LeadService,
} from '../../../core/services';
import { RecentChatItem } from '../../../core/services/role-based-chat.service';

@Component({
  selector: 'app-role-based-recent-chats',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    TooltipModule,
    BadgeModule,
    ScrollPanelModule,
  ],
  template: `
    <div class="recent-chats-panel">
      <div class="panel-header">
        <div class="header-title">
          <i class="pi pi-comments"></i>
          <span>Recent Chats</span>
          @if (roleBasedChatService.unreadCount() > 0) {
          <span class="unread-badge">{{
            roleBasedChatService.unreadCount()
          }}</span>
          }
        </div>
        <div class="header-actions">
          <button
            pButton
            icon="pi pi-refresh"
            [text]="true"
            [rounded]="true"
            size="small"
            pTooltip="Refresh"
            (click)="refreshChats()"
            class="refresh-btn"
          ></button>
          <button
            pButton
            icon="pi pi-check-circle"
            [text]="true"
            [rounded]="true"
            size="small"
            pTooltip="Mark all as read"
            (click)="markAllAsRead()"
            [disabled]="roleBasedChatService.unreadCount() === 0"
            class="mark-read-btn"
          ></button>
        </div>
      </div>

      <div class="role-indicator">
        <i class="pi pi-user"></i>
        <span>{{ getRoleDisplayText() }}</span>
      </div>

      <div class="chats-content">
        <!-- Top 5 Recent Chats -->
        <div class="recent-section">
          <div class="section-title">
            Recent ({{ getRecentChats().length }})
          </div>
          @if (getRecentChats().length === 0) {
          <div class="empty-chats">
            <i class="pi pi-inbox"></i>
            <span>No recent chats</span>
          </div>
          } @else { @for (chat of getRecentChats(); track chat.leadId) {
          <div
            class="chat-item"
            [class.unread]="chat.unreadCount > 0"
            [class.has-unread]="chat.unreadCount > 0"
            (click)="openChat(chat)"
          >
            <div class="chat-avatar">
              {{ getLeadInitials(chat.lead) }}
            </div>
            <div class="chat-info">
              <div class="chat-header">
                <div class="chat-name">
                  {{ chat.lead.name || chat.lead.phoneNumber }}
                </div>
                <div class="chat-time">
                  {{ getTimeAgo(chat.lastMessageTime) }}
                </div>
              </div>
              <div class="chat-phone">{{ chat.lead.phoneNumber }}</div>
              <div class="chat-preview">
                @if (chat.isInbound) {
                <i class="pi pi-arrow-down-left"></i>
                } @else {
                <i class="pi pi-arrow-up-right"></i>
                }
                <span class="message-text">{{ chat.lastMessage }}</span>
                @if (chat.unreadCount > 0) {
                <span class="unread-count">{{ chat.unreadCount }}</span>
                }
              </div>
              @if (chat.lead.category) {
              <div class="chat-category">
                <i class="pi pi-tag"></i>
                <span>{{ chat.lead.category.name }}</span>
              </div>
              }
            </div>
            <div class="chat-actions">
              <button
                pButton
                icon="pi pi-external-link"
                [text]="true"
                [rounded]="true"
                size="small"
                pTooltip="Open floating chat"
                (click)="openFloatingChat(chat, $event)"
                class="float-action"
              ></button>
            </div>
          </div>
          } }
        </div>

        <!-- All Chats (Scrollable) -->
        @if (getAllChats().length > 5) {
        <div class="all-chats-section">
          <div class="section-title">
            All Chats ({{ getAllChats().length }})
            <button
              pButton
              [icon]="showAllChats ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
              [text]="true"
              [rounded]="true"
              size="small"
              (click)="toggleAllChats()"
              class="toggle-btn"
            ></button>
          </div>

          @if (showAllChats) {
          <p-scrollPanel
            [style]="{ width: '100%', height: '300px' }"
            styleClass="custom-scrollpanel"
          >
            @for (chat of getAllChats().slice(5); track chat.leadId) {
            <div
              class="chat-item compact"
              [class.unread]="chat.unreadCount > 0"
              (click)="openChat(chat)"
            >
              <div class="chat-avatar small">
                {{ getLeadInitials(chat.lead) }}
              </div>
              <div class="chat-info">
                <div class="chat-header">
                  <div class="chat-name">
                    {{ chat.lead.name || chat.lead.phoneNumber }}
                  </div>
                  @if (chat.unreadCount > 0) {
                  <span class="unread-count small">{{ chat.unreadCount }}</span>
                  }
                </div>
                <div class="chat-preview compact">
                  @if (chat.isInbound) {
                  <i class="pi pi-arrow-down-left"></i>
                  } @else {
                  <i class="pi pi-arrow-up-right"></i>
                  }
                  <span class="message-text">{{ chat.lastMessage }}</span>
                </div>
              </div>
              <div class="chat-time small">
                {{ getTimeAgo(chat.lastMessageTime) }}
              </div>
            </div>
            }
          </p-scrollPanel>
          }
        </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .recent-chats-panel {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
        overflow: hidden;
        max-height: 600px;
        display: flex;
        flex-direction: column;
      }

      .panel-header {
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
        color: #25d366;
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

      .role-indicator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1.25rem;
        background: rgba(37, 211, 102, 0.1);
        border-bottom: 1px solid #e5e7eb;
        font-size: 0.8rem;
        color: #25d366;
        font-weight: 500;
      }

      .role-indicator i {
        font-size: 0.75rem;
      }

      .chats-content {
        flex: 1;
        overflow: hidden;
      }

      .recent-section,
      .all-chats-section {
        border-bottom: 1px solid #f1f5f9;
      }

      .section-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1.25rem;
        background: #f8fafc;
        font-size: 0.8rem;
        font-weight: 600;
        color: #374151;
        border-bottom: 1px solid #e5e7eb;
      }

      .toggle-btn {
        width: 24px !important;
        height: 24px !important;
        color: #6b7280 !important;
        background: transparent !important;
        border: none !important;
      }

      .empty-chats {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        color: #9ca3af;
        gap: 0.5rem;
      }

      .empty-chats i {
        font-size: 2rem;
      }

      .chat-item {
        display: flex;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid #f1f5f9;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
      }

      .chat-item:hover {
        background: #f8fafc;
      }

      .chat-item.unread {
        background: #f0fdf4;
        border-left: 3px solid #25d366;
      }

      .chat-item.compact {
        padding: 0.75rem 1.25rem;
      }

      .chat-avatar {
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

      .chat-avatar.small {
        width: 32px;
        height: 32px;
        font-size: 0.75rem;
      }

      .chat-info {
        flex: 1;
        min-width: 0;
      }

      .chat-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.25rem;
      }

      .chat-name {
        font-weight: 600;
        color: #1f2937;
        font-size: 0.875rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .chat-time {
        font-size: 0.7rem;
        color: #9ca3af;
        white-space: nowrap;
      }

      .chat-time.small {
        font-size: 0.65rem;
      }

      .chat-phone {
        font-size: 0.75rem;
        color: #6b7280;
        margin-bottom: 0.5rem;
      }

      .chat-preview {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        color: #4b5563;
        line-height: 1.4;
      }

      .chat-preview.compact {
        font-size: 0.75rem;
        gap: 0.25rem;
      }

      .chat-preview i {
        font-size: 0.7rem;
        color: #9ca3af;
        flex-shrink: 0;
      }

      .message-text {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .unread-count {
        background: #ef4444;
        color: white;
        font-size: 0.65rem;
        font-weight: 600;
        padding: 0.15rem 0.4rem;
        border-radius: 8px;
        min-width: 18px;
        text-align: center;
        flex-shrink: 0;
      }

      .unread-count.small {
        font-size: 0.6rem;
        padding: 0.1rem 0.3rem;
        min-width: 16px;
      }

      .chat-category {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.7rem;
        color: #6b7280;
        margin-top: 0.25rem;
      }

      .chat-category i {
        font-size: 0.65rem;
      }

      .chat-actions {
        display: flex;
        align-items: center;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .chat-item:hover .chat-actions {
        opacity: 1;
      }

      .float-action {
        width: 28px !important;
        height: 28px !important;
        color: #25d366 !important;
        background: rgba(37, 211, 102, 0.1) !important;
        border: none !important;
      }

      .float-action:hover {
        background: rgba(37, 211, 102, 0.2) !important;
      }

      /* Custom scrollpanel styles */
      :host ::ng-deep .custom-scrollpanel .p-scrollpanel-bar-y {
        background: #cbd5e1;
        width: 4px;
        border-radius: 2px;
      }

      :host ::ng-deep .custom-scrollpanel .p-scrollpanel-thumb-y {
        background: #94a3b8;
        border-radius: 2px;
      }
    `,
  ],
})
export class RoleBasedRecentChatsComponent implements OnInit, OnDestroy {
  @Output() chatSelected = new EventEmitter<RecentChatItem>();

  showAllChats = false;
  private subscription?: Subscription;

  constructor(
    public roleBasedChatService: RoleBasedChatService,
    private floatingChatService: FloatingChatService,
    public authService: AuthService,
    private leadService: LeadService
  ) {}

  ngOnInit(): void {
    // Subscribe to chat updates
    this.subscription = this.roleBasedChatService.recentChats$.subscribe();

    // Initial load
    this.roleBasedChatService.refreshChats();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  getRecentChats(): RecentChatItem[] {
    return this.roleBasedChatService.getRecentChats(5);
  }

  getAllChats(): RecentChatItem[] {
    return this.roleBasedChatService.getAllRecentChats();
  }

  getLeadInitials(lead: any): string {
    const name = lead.name || lead.phoneNumber;
    return name
      .split(' ')
      .map((n: string) => n[0])
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

  getRoleDisplayText(): string {
    const user = this.authService.currentUser();
    if (!user) return '';

    switch (user.role) {
      case 'admin':
        return 'Admin - All Leads';
      case 'manager':
        return 'Manager - Category Leads';
      case 'customer_executive':
        return 'Executive - Assigned Leads';
      default:
        return user.role;
    }
  }

  openChat(chat: RecentChatItem): void {
    this.roleBasedChatService.markAsRead(chat.leadId);
    // Open floating chat popup directly instead of emitting for navigation
    this.floatingChatService.openChat(chat.lead);
    // Still emit for parent component to close panel
    this.chatSelected.emit(chat);
  }

  openFloatingChat(chat: RecentChatItem, event: Event): void {
    event.stopPropagation();
    this.roleBasedChatService.markAsRead(chat.leadId);
    this.floatingChatService.openChat(chat.lead);
  }

  refreshChats(): void {
    this.roleBasedChatService.refreshChats();
  }

  markAllAsRead(): void {
    const allChats = this.roleBasedChatService.getAllRecentChats();
    allChats.forEach((chat) => {
      if (chat.unreadCount > 0) {
        this.roleBasedChatService.markAsRead(chat.leadId);
      }
    });
  }

  toggleAllChats(): void {
    this.showAllChats = !this.showAllChats;
  }
}
