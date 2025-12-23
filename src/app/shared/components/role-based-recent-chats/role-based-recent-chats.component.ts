import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { InputTextModule } from 'primeng/inputtext';
import { Subscription } from 'rxjs';
import {
  RoleBasedChatService,
  FloatingChatService,
  AuthService,
} from '../../../core/services';
import { RecentChatItem } from '../../../core/services/role-based-chat.service';

@Component({
  selector: 'app-role-based-recent-chats',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    TooltipModule,
    BadgeModule,
    InputTextModule,
  ],
  template: `
    <div class="recent-chats-container">
      <!-- Header -->
      <div class="chat-header">
        <div class="header-left">
          <div class="header-icon">
            <i class="pi pi-comments"></i>
          </div>
          <div class="header-info">
            <span class="header-title">Recent Chats</span>
            <span class="header-subtitle">{{ getRoleDisplayText() }}</span>
          </div>
        </div>
        @if (roleBasedChatService.unreadCount() > 0) {
        <span class="unread-badge"
          >{{ roleBasedChatService.unreadCount() }} new</span
        >
        }
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button
          class="action-chip"
          (click)="refreshChats()"
          pTooltip="Refresh"
          tooltipPosition="bottom"
        >
          <i class="pi pi-refresh"></i>
          <span>Refresh</span>
        </button>
        <button
          class="action-chip"
          (click)="markAllAsRead()"
          [disabled]="roleBasedChatService.unreadCount() === 0"
          pTooltip="Mark all read"
          tooltipPosition="bottom"
        >
          <i class="pi pi-check-circle"></i>
          <span>Mark Read</span>
        </button>
        <div class="action-spacer"></div>
        <!-- Search -->
        <div class="search-wrapper">
          <i class="pi pi-search"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search..."
            class="search-input"
          />
          @if (searchQuery) {
          <i class="pi pi-times clear-btn" (click)="clearSearch()"></i>
          }
        </div>
      </div>

      <!-- Chat List -->
      <div class="chat-list">
        @if (getFilteredChats().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <i class="pi pi-inbox"></i>
          </div>
          <h4>No chats found</h4>
          <p>
            @if (searchQuery) { No results for "{{ searchQuery }}" } @else {
            Recent conversations will appear here }
          </p>
        </div>
        } @else { @for (chat of getDisplayedChats(); track chat.leadId) {
        <div
          class="chat-item"
          [class.unread]="chat.unreadCount > 0"
          (click)="openChat(chat)"
        >
          <!-- Avatar -->
          <div
            class="chat-avatar"
            [style.background]="getAvatarGradient(chat.leadId)"
          >
            {{ getLeadInitials(chat.lead) }}
          </div>

          <!-- Content -->
          <div class="chat-content">
            <div class="chat-row-top">
              <span class="chat-name">{{
                chat.lead.name || chat.lead.phoneNumber
              }}</span>
              <span class="chat-time">{{
                getTimeAgo(chat.lastMessageTime)
              }}</span>
            </div>
            <div class="chat-row-phone">
              <i class="pi pi-whatsapp"></i>
              {{ chat.lead.phoneNumber }}
            </div>
            <div class="chat-row-message">
              <i
                class="pi"
                [class.pi-arrow-down-left]="chat.isInbound"
                [class.pi-arrow-up-right]="!chat.isInbound"
              ></i>
              <span class="message-text">{{ chat.lastMessage }}</span>
              @if (chat.unreadCount > 0) {
              <span class="unread-count">{{ chat.unreadCount }}</span>
              }
            </div>
            @if (chat.lead.category) {
            <span class="category-badge">
              <i class="pi pi-tag"></i>
              {{ chat.lead.category.name }}
            </span>
            }
          </div>

          <!-- Action -->
          <button
            class="chat-action-btn"
            (click)="openFloatingChat(chat, $event)"
            pTooltip="Open chat"
            tooltipPosition="left"
          >
            <i class="pi pi-external-link"></i>
          </button>
        </div>
        } @if (!showAllChats && getFilteredChats().length > 5) {
        <div class="show-more" (click)="toggleShowAll()">
          <span>Show {{ getFilteredChats().length - 5 }} more</span>
          <i class="pi pi-chevron-down"></i>
        </div>
        } @if (showAllChats && getFilteredChats().length > 5) {
        <div class="show-more" (click)="toggleShowAll()">
          <span>Show less</span>
          <i class="pi pi-chevron-up"></i>
        </div>
        } }
      </div>

      <!-- Footer -->
      <div class="chat-footer">
        <span class="footer-stat">
          <i class="pi pi-comments"></i>
          {{ getAllChats().length }} chats
        </span>
        @if (roleBasedChatService.unreadCount() > 0) {
        <span class="footer-stat highlight">
          <i class="pi pi-envelope"></i>
          {{ roleBasedChatService.unreadCount() }} unread
        </span>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .recent-chats-container {
        background: #ffffff;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
      }

      /* Header */
      .chat-header {
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
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
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

      .header-subtitle {
        font-size: 0.7rem;
        color: #6b7280;
      }

      .unread-badge {
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        color: white;
        font-size: 0.7rem;
        font-weight: 600;
        padding: 0.35rem 0.75rem;
        border-radius: 20px;
      }

      /* Quick Actions */
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

      .action-chip:hover:not(:disabled) {
        border-color: #25d366;
        color: #25d366;
        background: rgba(37, 211, 102, 0.05);
      }

      .action-chip:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .action-chip i {
        font-size: 0.8rem;
      }

      .action-spacer {
        flex: 1;
      }

      .search-wrapper {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.375rem 0.75rem;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        min-width: 120px;
      }

      .search-wrapper i {
        font-size: 0.8rem;
        color: #9ca3af;
      }

      .search-input {
        border: none;
        outline: none;
        font-size: 0.75rem;
        width: 80px;
        background: transparent;
        color: #374151;
      }

      .search-input::placeholder {
        color: #9ca3af;
      }

      .clear-btn {
        cursor: pointer;
        padding: 0.125rem;
        border-radius: 50%;
        transition: all 0.2s;
      }

      .clear-btn:hover {
        background: #f1f5f9;
        color: #374151;
      }

      /* Chat List */
      .chat-list {
        flex: 1;
        overflow-y: auto;
        max-height: 400px;
      }

      .chat-list::-webkit-scrollbar {
        width: 5px;
      }

      .chat-list::-webkit-scrollbar-track {
        background: transparent;
      }

      .chat-list::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 3px;
      }

      /* Empty State */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2.5rem 1.5rem;
        text-align: center;
      }

      .empty-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;
      }

      .empty-icon i {
        font-size: 1.5rem;
        color: #94a3b8;
      }

      .empty-state h4 {
        margin: 0 0 0.375rem 0;
        font-size: 0.95rem;
        font-weight: 600;
        color: #374151;
      }

      .empty-state p {
        margin: 0;
        font-size: 0.8rem;
        color: #6b7280;
      }

      /* Chat Item */
      .chat-item {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.875rem 1rem;
        border-bottom: 1px solid #f1f5f9;
        cursor: pointer;
        transition: all 0.15s ease;
        position: relative;
      }

      .chat-item:hover {
        background: #f8fafc;
      }

      .chat-item:hover .chat-action-btn {
        opacity: 1;
      }

      .chat-item.unread {
        background: linear-gradient(
          90deg,
          rgba(37, 211, 102, 0.06) 0%,
          transparent 100%
        );
        border-left: 3px solid #25d366;
      }

      .chat-item:last-of-type {
        border-bottom: none;
      }

      /* Avatar */
      .chat-avatar {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 0.85rem;
        flex-shrink: 0;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      }

      /* Chat Content */
      .chat-content {
        flex: 1;
        min-width: 0;
      }

      .chat-row-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.2rem;
      }

      .chat-name {
        font-weight: 600;
        font-size: 0.875rem;
        color: #1f2937;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 150px;
      }

      .chat-time {
        font-size: 0.65rem;
        color: #9ca3af;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .chat-row-phone {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.7rem;
        color: #6b7280;
        margin-bottom: 0.35rem;
      }

      .chat-row-phone i {
        font-size: 0.65rem;
        color: #25d366;
      }

      .chat-row-message {
        display: flex;
        align-items: center;
        gap: 0.375rem;
      }

      .chat-row-message > i {
        font-size: 0.6rem;
        color: #9ca3af;
      }

      .chat-row-message > i.pi-arrow-down-left {
        color: #25d366;
      }

      .message-text {
        flex: 1;
        font-size: 0.75rem;
        color: #4b5563;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .unread-count {
        background: #ef4444;
        color: white;
        font-size: 0.6rem;
        font-weight: 700;
        padding: 0.15rem 0.4rem;
        border-radius: 8px;
        min-width: 18px;
        text-align: center;
        flex-shrink: 0;
      }

      .category-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
        margin-top: 0.35rem;
        padding: 0.15rem 0.4rem;
        background: #f1f5f9;
        border-radius: 4px;
        font-size: 0.6rem;
        color: #64748b;
      }

      .category-badge i {
        font-size: 0.55rem;
      }

      /* Chat Action */
      .chat-action-btn {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        border: none;
        background: rgba(37, 211, 102, 0.1);
        color: #25d366;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: all 0.2s ease;
        flex-shrink: 0;
        margin-top: 0.25rem;
      }

      .chat-action-btn:hover {
        background: rgba(37, 211, 102, 0.2);
        transform: scale(1.05);
      }

      .chat-action-btn i {
        font-size: 0.8rem;
      }

      /* Show More */
      .show-more {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.375rem;
        padding: 0.75rem;
        background: #f8fafc;
        color: #3b82f6;
        font-size: 0.75rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        border-top: 1px solid #e5e7eb;
      }

      .show-more:hover {
        background: #f1f5f9;
        color: #2563eb;
      }

      .show-more i {
        font-size: 0.7rem;
      }

      /* Footer */
      .chat-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        background: #f8fafc;
        border-top: 1px solid #e5e7eb;
      }

      .footer-stat {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.7rem;
        color: #6b7280;
      }

      .footer-stat i {
        font-size: 0.75rem;
      }

      .footer-stat.highlight {
        color: #25d366;
        font-weight: 600;
      }

      /* Mobile Responsive */
      @media (max-width: 480px) {
        .recent-chats-container {
          border-radius: 0;
          max-height: 100vh;
        }

        .chat-header {
          padding: 0.875rem 1rem;
        }

        .header-icon {
          width: 36px;
          height: 36px;
          font-size: 1rem;
        }

        .header-title {
          font-size: 0.9rem;
        }

        .quick-actions {
          padding: 0.625rem 0.875rem;
          gap: 0.375rem;
        }

        .action-chip span {
          display: none;
        }

        .action-chip {
          padding: 0.4rem 0.5rem;
        }

        .search-wrapper {
          flex: 1;
          min-width: auto;
        }

        .search-input {
          width: 100%;
        }

        .chat-item {
          padding: 0.75rem 0.875rem;
        }

        .chat-avatar {
          width: 38px;
          height: 38px;
          font-size: 0.8rem;
        }

        .chat-name {
          max-width: 120px;
          font-size: 0.8rem;
        }

        .chat-action-btn {
          opacity: 1;
          width: 28px;
          height: 28px;
        }

        .chat-list {
          max-height: calc(100vh - 200px);
        }
      }

      @media (max-width: 360px) {
        .header-subtitle {
          display: none;
        }

        .chat-name {
          max-width: 100px;
        }

        .action-spacer {
          display: none;
        }

        .quick-actions {
          justify-content: space-between;
        }
      }
    `,
  ],
})
export class RoleBasedRecentChatsComponent implements OnInit, OnDestroy {
  @Output() chatSelected = new EventEmitter<RecentChatItem>();

  showAllChats = false;
  searchQuery = '';
  private subscription?: Subscription;

  private avatarColors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  ];

  constructor(
    public roleBasedChatService: RoleBasedChatService,
    private floatingChatService: FloatingChatService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.subscription = this.roleBasedChatService.recentChats$.subscribe();
    this.roleBasedChatService.refreshChats();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  getFilteredChats(): RecentChatItem[] {
    const allChats = this.roleBasedChatService.getAllRecentChats();
    if (!this.searchQuery.trim()) {
      return allChats;
    }

    const query = this.searchQuery.toLowerCase();
    return allChats.filter(
      (chat) =>
        (chat.lead.name && chat.lead.name.toLowerCase().includes(query)) ||
        chat.lead.phoneNumber.includes(query) ||
        chat.lastMessage.toLowerCase().includes(query)
    );
  }

  getDisplayedChats(): RecentChatItem[] {
    const filtered = this.getFilteredChats();
    return this.showAllChats ? filtered : filtered.slice(0, 5);
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

  getAvatarGradient(leadId: string): string {
    const hash = leadId
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return this.avatarColors[hash % this.avatarColors.length];
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
        return 'All Leads';
      case 'manager':
        return 'Category Leads';
      case 'customer_executive':
        return 'Assigned Leads';
      default:
        return user.role;
    }
  }

  openChat(chat: RecentChatItem): void {
    this.roleBasedChatService.markAsRead(chat.leadId);
    this.floatingChatService.openChat(chat.lead);
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

  toggleShowAll(): void {
    this.showAllChats = !this.showAllChats;
  }

  clearSearch(): void {
    this.searchQuery = '';
  }
}
