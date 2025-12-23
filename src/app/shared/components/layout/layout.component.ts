import {
  Component,
  signal,
  ViewEncapsulation,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { AvatarModule } from 'primeng/avatar';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { Subscription } from 'rxjs';
import {
  AuthService,
  RecentChatsService,
  WebSocketService,
  LeadService,
  FloatingChatService,
  NotificationService,
  RoleBasedChatService,
} from '../../../core/services';
import { FloatingChatContainerComponent } from '../floating-chat-container/floating-chat-container.component';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';
import { RoleBasedRecentChatsComponent } from '../role-based-recent-chats/role-based-recent-chats.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    DrawerModule,
    AvatarModule,
    RippleModule,
    TooltipModule,
    BadgeModule,
    FloatingChatContainerComponent,
    NotificationPanelComponent,
    RoleBasedRecentChatsComponent,
  ],
  template: `
    <div class="crm-layout-wrapper">
      <!-- Desktop Sidebar -->
      <aside class="crm-sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="crm-sidebar-header">
          <div class="crm-logo">
            <i class="pi pi-briefcase crm-logo-icon"></i>
            <span class="crm-logo-text">Lead Management</span>
          </div>
        </div>

        <nav class="crm-sidebar-nav">
          <!-- Floating Chat Controls -->
          @if (floatingChatService.chatWindows().length > 0) {
          <div class="crm-nav-section">
            <div class="floating-chat-controls">
              <div class="control-header">
                <span
                  >Floating Chats ({{
                    floatingChatService.chatWindows().length
                  }})</span
                >
                <div class="control-actions">
                  <button
                    pButton
                    icon="pi pi-window-minimize"
                    [text]="true"
                    [rounded]="true"
                    size="small"
                    pTooltip="Minimize All"
                    (click)="floatingChatService.minimizeAll()"
                  ></button>
                  <button
                    pButton
                    icon="pi pi-times"
                    [text]="true"
                    [rounded]="true"
                    size="small"
                    pTooltip="Close All"
                    (click)="floatingChatService.closeAll()"
                  ></button>
                </div>
              </div>
              @for (window of floatingChatService.chatWindows(); track
              window.id) {
              <div
                class="floating-chat-item"
                [class.minimized]="window.isMinimized"
              >
                <div
                  class="chat-window-info"
                  (click)="
                    floatingChatService.bringToFront(window.id);
                    floatingChatService.minimizeWindow(window.id, false)
                  "
                >
                  <div class="window-avatar">
                    {{ getWindowInitials(window.lead) }}
                  </div>
                  <div class="window-details">
                    <div class="window-name">
                      {{ window.lead.name || window.lead.phoneNumber }}
                    </div>
                    @if (window.unreadCount > 0) {
                    <span class="window-unread">{{ window.unreadCount }}</span>
                    }
                  </div>
                </div>
                <button
                  pButton
                  icon="pi pi-times"
                  [text]="true"
                  [rounded]="true"
                  size="small"
                  (click)="floatingChatService.closeWindow(window.id)"
                  class="window-close-btn"
                ></button>
              </div>
              }
            </div>
          </div>
          }

          <a
            routerLink="/dashboard"
            routerLinkActive="active"
            class="crm-nav-item"
            pRipple
          >
            <i class="pi pi-home"></i>
            <span>Dashboard</span>
          </a>
          <a
            routerLink="/leads"
            routerLinkActive="active"
            class="crm-nav-item"
            pRipple
          >
            <i class="pi pi-users"></i>
            <span>Leads</span>
          </a>
          <a
            routerLink="/categories"
            routerLinkActive="active"
            class="crm-nav-item"
            pRipple
          >
            <i class="pi pi-tags"></i>
            <span>Categories</span>
          </a>
          @if (authService.isAdmin() || authService.isManager()) {
          <a
            routerLink="/users"
            routerLinkActive="active"
            class="crm-nav-item"
            pRipple
          >
            <i class="pi pi-user-edit"></i>
            <span>Users</span>
          </a>
          <a
            routerLink="/sla"
            routerLinkActive="active"
            class="crm-nav-item"
            pRipple
          >
            <i class="pi pi-clock"></i>
            <span>SLA Policies</span>
          </a>
          <a
            routerLink="/auto-reply"
            routerLinkActive="active"
            class="crm-nav-item"
            pRipple
          >
            <i class="pi pi-comments"></i>
            <span>Auto-Reply</span>
          </a>
          <a
            routerLink="/lead-statuses"
            routerLinkActive="active"
            class="crm-nav-item"
            pRipple
          >
            <i class="pi pi-list"></i>
            <span>Lead Statuses</span>
          </a>
          <a
            routerLink="/connectors"
            routerLinkActive="active"
            class="crm-nav-item"
            pRipple
          >
            <i class="pi pi-link"></i>
            <span>Connectors</span>
          </a>
          <a
            routerLink="/business-types"
            routerLinkActive="active"
            class="crm-nav-item"
            pRipple
          >
            <i class="pi pi-briefcase"></i>
            <span>Business Types</span>
          </a>
          <a
            routerLink="/reports"
            routerLinkActive="active"
            class="crm-nav-item"
            pRipple
          >
            <i class="pi pi-chart-bar"></i>
            <span>Reports</span>
          </a>
          }
        </nav>

        <div class="crm-sidebar-footer">
          <div class="crm-user-info">
            <div class="crm-user-avatar">{{ getUserInitials() }}</div>
            <div class="crm-user-details">
              <span class="crm-user-name">{{
                authService.currentUser()?.name
              }}</span>
              <span class="crm-user-role">{{
                authService.currentUser()?.role
              }}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Mobile Header -->
      <header class="crm-mobile-header">
        <button
          pButton
          pRipple
          icon="pi pi-bars"
          class="crm-menu-toggle"
          (click)="mobileMenuOpen.set(true)"
        ></button>
        <div class="crm-mobile-logo">
          <i class="pi pi-briefcase"></i>
          <span>Lead Management</span>
        </div>
        <div class="crm-mobile-avatar">{{ getUserInitials() }}</div>
      </header>

      <!-- Mobile Drawer -->
      <p-drawer [(visible)]="mobileMenuVisible" [modal]="true" position="left">
        <ng-template pTemplate="header">
          <div class="crm-drawer-header">
            <i class="pi pi-briefcase"></i>
            <span>Lead Management</span>
          </div>
        </ng-template>
        <ng-template pTemplate="content">
          <nav class="crm-drawer-nav">
            <a
              routerLink="/dashboard"
              routerLinkActive="active"
              class="crm-drawer-nav-item"
              (click)="closeMobileMenu()"
            >
              <i class="pi pi-home"></i><span>Dashboard</span>
            </a>
            <a
              routerLink="/leads"
              routerLinkActive="active"
              class="crm-drawer-nav-item"
              (click)="closeMobileMenu()"
            >
              <i class="pi pi-users"></i><span>Leads</span>
            </a>
            <a
              routerLink="/categories"
              routerLinkActive="active"
              class="crm-drawer-nav-item"
              (click)="closeMobileMenu()"
            >
              <i class="pi pi-tags"></i><span>Categories</span>
            </a>
            @if (authService.isAdmin() || authService.isManager()) {
            <a
              routerLink="/users"
              routerLinkActive="active"
              class="crm-drawer-nav-item"
              (click)="closeMobileMenu()"
            >
              <i class="pi pi-user-edit"></i><span>Users</span>
            </a>
            <a
              routerLink="/sla"
              routerLinkActive="active"
              class="crm-drawer-nav-item"
              (click)="closeMobileMenu()"
            >
              <i class="pi pi-clock"></i><span>SLA Policies</span>
            </a>
            <a
              routerLink="/auto-reply"
              routerLinkActive="active"
              class="crm-drawer-nav-item"
              (click)="closeMobileMenu()"
            >
              <i class="pi pi-comments"></i><span>Auto-Reply</span>
            </a>
            <a
              routerLink="/connectors"
              routerLinkActive="active"
              class="crm-drawer-nav-item"
              (click)="closeMobileMenu()"
            >
              <i class="pi pi-link"></i><span>Connectors</span>
            </a>
            <a
              routerLink="/reports"
              routerLinkActive="active"
              class="crm-drawer-nav-item"
              (click)="closeMobileMenu()"
            >
              <i class="pi pi-chart-bar"></i><span>Reports</span>
            </a>
            }
          </nav>
          <div class="crm-drawer-footer">
            <div class="crm-drawer-user">
              <div class="crm-drawer-avatar">{{ getUserInitials() }}</div>
              <div>
                <div class="crm-drawer-user-name">
                  {{ authService.currentUser()?.name }}
                </div>
                <div class="crm-drawer-user-role">
                  {{ authService.currentUser()?.role }}
                </div>
              </div>
            </div>
            <button
              pButton
              label="Logout"
              icon="pi pi-sign-out"
              severity="danger"
              class="crm-drawer-logout"
              (click)="logout()"
            ></button>
          </div>
        </ng-template>
      </p-drawer>

      <!-- Main Content Area -->
      <main
        class="crm-main-content"
        [class.sidebar-collapsed]="sidebarCollapsed()"
      >
        <!-- Top Header Bar -->
        <header class="crm-top-header">
          <div class="header-left">
            <button
              class="sidebar-toggle-btn"
              (click)="toggleSidebar()"
              pTooltip="Toggle Sidebar"
              tooltipPosition="bottom"
            >
              <i class="pi pi-bars"></i>
            </button>
          </div>

          <div class="header-center">
            <div class="header-logo">
              <i class="pi pi-briefcase"></i>
              <span>Lead Management</span>
            </div>
          </div>

          <div class="header-right">
            <!-- Recent Chats -->
            <button
              class="header-icon-btn"
              (click)="toggleChatPanel()"
              pTooltip="Recent Chats"
              tooltipPosition="bottom"
            >
              <i class="pi pi-comments"></i>
              @if (roleBasedChatService.unreadCount() > 0) {
              <span class="icon-badge">{{
                roleBasedChatService.unreadCount()
              }}</span>
              }
            </button>

            <!-- Notifications -->
            <button
              class="header-icon-btn"
              (click)="toggleNotificationPanel()"
              pTooltip="Notifications"
              tooltipPosition="bottom"
            >
              <i class="pi pi-bell"></i>
              @if (notificationService.unreadCount() > 0) {
              <span class="icon-badge notification">{{
                notificationService.unreadCount()
              }}</span>
              }
            </button>

            <!-- User Menu -->
            <div class="header-user-menu">
              <div class="user-avatar">{{ getUserInitials() }}</div>
              <div class="user-info">
                <span class="user-name">{{
                  authService.currentUser()?.name
                }}</span>
                <span class="user-role">{{
                  authService.currentUser()?.role | titlecase
                }}</span>
              </div>
              <button
                pButton
                icon="pi pi-sign-out"
                [text]="true"
                [rounded]="true"
                size="small"
                class="logout-btn"
                pTooltip="Logout"
                tooltipPosition="bottom"
                (click)="logout()"
              ></button>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <div class="crm-page-content">
          <ng-content></ng-content>
        </div>
      </main>

      <!-- Floating Chat Container -->
      <app-floating-chat-container />

      <!-- Recent Chats Panel -->
      @if (chatPanelVisible) {
      <div class="chat-panel-overlay" (click)="closeChatPanel()"></div>
      <aside class="chat-panel">
        <div class="chat-panel-header">
          <button
            pButton
            icon="pi pi-times"
            [text]="true"
            [rounded]="true"
            size="small"
            (click)="closeChatPanel()"
            class="close-panel-btn"
          ></button>
        </div>
        <app-role-based-recent-chats (chatSelected)="onChatSelected($event)" />
      </aside>
      }

      <!-- Notifications Panel -->
      @if (notificationPanelVisible) {
      <div
        class="notification-panel-overlay"
        (click)="closeNotificationPanel()"
      ></div>
      <aside class="notification-panel-container">
        <app-notification-panel
          [wasAutoOpened]="notificationWasAutoOpened"
          (notificationClick)="onNotificationClick($event)"
          (autoOpenToggle)="onAutoOpenToggle($event)"
          (close)="closeNotificationPanel()"
        />
      </aside>
      }
    </div>
  `,
  styles: [
    `
      app-layout {
        display: block;
      }

      .crm-layout-wrapper {
        display: flex;
        min-height: 100vh;
        background-color: #f8fafc;
      }

      /* Desktop Sidebar */
      .crm-sidebar {
        width: 260px;
        min-width: 260px;
        background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
        display: flex;
        flex-direction: column;
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        z-index: 1000;
        transition: all 0.3s ease;
      }

      .crm-sidebar.collapsed {
        width: 80px;
        min-width: 80px;
      }

      .crm-sidebar.collapsed .crm-logo-text,
      .crm-sidebar.collapsed .crm-nav-item span,
      .crm-sidebar.collapsed .crm-user-details,
      .crm-sidebar.collapsed .floating-chat-controls,
      .crm-sidebar.collapsed .crm-nav-section {
        display: none;
      }

      .crm-sidebar.collapsed .crm-sidebar-header {
        padding: 1.5rem 1rem;
        justify-content: center;
      }

      .crm-sidebar.collapsed .crm-logo {
        justify-content: center;
      }

      .crm-sidebar.collapsed .crm-nav-item {
        padding: 0.875rem;
        justify-content: center;
      }

      .crm-sidebar.collapsed .crm-nav-item i {
        margin: 0;
        font-size: 1.25rem;
      }

      .crm-sidebar.collapsed .crm-sidebar-footer {
        padding: 1rem;
        justify-content: center;
      }

      .crm-sidebar.collapsed .crm-user-info {
        justify-content: center;
      }

      /* Main content adjustment for collapsed sidebar */
      .crm-main-content.sidebar-collapsed {
        margin-left: 80px !important;
        max-width: calc(100vw - 80px) !important;
      }

      .crm-sidebar-header {
        padding: 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .crm-logo {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .crm-logo-icon {
        font-size: 2rem;
        color: #3b82f6;
      }

      .crm-logo-text {
        font-size: 1.25rem;
        font-weight: 700;
        color: white;
      }

      .crm-sidebar-nav {
        flex: 1;
        padding: 1rem 0;
        overflow-y: auto;
      }

      .crm-nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1.5rem;
        color: #94a3b8;
        text-decoration: none;
        transition: all 0.2s ease;
        border-left: 3px solid transparent;
      }

      .crm-nav-item:hover {
        background: rgba(255, 255, 255, 0.05);
        color: white;
      }

      .crm-nav-item.active {
        background: rgba(37, 211, 102, 0.1);
        color: #25d366;
        border-left-color: #25d366;
      }

      .crm-nav-item i {
        font-size: 1.1rem;
        width: 24px;
      }

      .crm-sidebar-footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }

      .crm-user-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
        min-width: 0;
      }

      .crm-user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.875rem;
        flex-shrink: 0;
      }

      .crm-user-details {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .crm-user-name {
        color: white;
        font-weight: 600;
        font-size: 0.875rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .crm-user-role {
        color: #64748b;
        font-size: 0.75rem;
        text-transform: capitalize;
      }

      .crm-logout-btn {
        background: rgba(239, 68, 68, 0.1) !important;
        border: none !important;
        color: #ef4444 !important;
        width: 36px;
        height: 36px;
        flex-shrink: 0;
      }

      .crm-logout-btn:hover {
        background: rgba(239, 68, 68, 0.2) !important;
      }

      /* Main Content */
      .crm-main-content {
        flex: 1;
        margin-left: 260px;
        min-height: 100vh;
        background-color: #f8fafc;
        overflow-x: hidden;
        max-width: calc(100vw - 260px);
        display: flex;
        flex-direction: column;
      }

      /* Top Header Bar */
      .crm-top-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1.5rem;
        background: white;
        border-bottom: 1px solid #e5e7eb;
        position: sticky;
        top: 0;
        z-index: 100;
        min-height: 64px;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
      }

      .sidebar-toggle-btn {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        border: none;
        background: #f1f5f9;
        color: #64748b;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .sidebar-toggle-btn:hover {
        background: #e2e8f0;
        color: #374151;
      }

      .sidebar-toggle-btn i {
        font-size: 1.2rem;
      }

      .header-center {
        flex: 2;
        display: flex;
        justify-content: center;
      }

      .header-logo {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        font-weight: 700;
        font-size: 1.125rem;
        color: #1f2937;
      }

      .header-logo i {
        font-size: 1.5rem;
        color: #3b82f6;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
        justify-content: flex-end;
      }

      .header-icon-btn {
        position: relative;
        width: 42px;
        height: 42px;
        border-radius: 12px;
        border: none;
        background: #f1f5f9;
        color: #64748b;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .header-icon-btn:hover {
        background: #e2e8f0;
        color: #374151;
      }

      .header-icon-btn i {
        font-size: 1.1rem;
      }

      .icon-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: 9px;
        background: #3b82f6;
        color: white;
        font-size: 0.65rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
      }

      .icon-badge.notification {
        background: #ef4444;
      }

      .header-user-menu {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0.75rem 0.5rem 1rem;
        margin-left: 0.5rem;
        background: #f8fafc;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
      }

      .header-user-menu .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.8rem;
      }

      .header-user-menu .user-info {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }

      .header-user-menu .user-name {
        font-weight: 600;
        font-size: 0.85rem;
        color: #1f2937;
      }

      .header-user-menu .user-role {
        font-size: 0.7rem;
        color: #6b7280;
      }

      .header-user-menu .logout-btn {
        color: #ef4444 !important;
        margin-left: 0.25rem;
      }

      .header-user-menu .logout-btn:hover {
        background: rgba(239, 68, 68, 0.1) !important;
      }

      /* Page Content */
      .crm-page-content {
        flex: 1;
        overflow-y: auto;
      }

      /* Mobile Header - Hidden on desktop */
      .crm-mobile-header {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        z-index: 999;
        padding: 0 1rem;
        align-items: center;
        justify-content: space-between;
      }

      .crm-menu-toggle {
        background: transparent !important;
        border: none !important;
        color: #374151 !important;
        width: 40px;
        height: 40px;
      }

      .crm-mobile-logo {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 700;
        color: #3b82f6;
      }

      .crm-mobile-logo i {
        font-size: 1.5rem;
      }

      .crm-mobile-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.75rem;
      }

      /* Drawer Styles */
      .crm-drawer-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 700;
        font-size: 1.25rem;
        color: #3b82f6;
      }

      .crm-drawer-header i {
        font-size: 1.75rem;
      }

      .crm-drawer-nav {
        padding: 1rem 0;
      }

      .crm-drawer-nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        color: #374151;
        text-decoration: none;
        transition: all 0.2s ease;
      }

      .crm-drawer-nav-item:hover {
        background: #f1f5f9;
      }

      .crm-drawer-nav-item.active {
        background: rgba(37, 211, 102, 0.1);
        color: #25d366;
      }

      .crm-drawer-nav-item i {
        font-size: 1.1rem;
        width: 24px;
      }

      .crm-drawer-footer {
        padding: 1.5rem;
        border-top: 1px solid #e2e8f0;
        margin-top: auto;
      }

      .crm-drawer-user {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .crm-drawer-avatar {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
      }

      .crm-drawer-user-name {
        font-weight: 600;
        color: #1f2937;
      }

      .crm-drawer-user-role {
        font-size: 0.875rem;
        color: #6b7280;
        text-transform: capitalize;
      }

      .crm-drawer-logout {
        width: 100%;
      }

      /* Responsive - Show mobile header, hide sidebar on small screens */
      @media (max-width: 1024px) {
        .crm-sidebar {
          display: none !important;
        }

        .crm-mobile-header {
          display: none !important;
        }

        .crm-main-content,
        .crm-main-content.sidebar-collapsed {
          margin-left: 0 !important;
          max-width: 100vw !important;
        }

        .crm-top-header {
          padding: 0.5rem 1rem;
        }

        .sidebar-toggle-btn {
          display: none;
        }

        .header-center {
          flex: 1;
        }

        .header-logo span {
          display: none;
        }

        .header-user-menu .user-info {
          display: none;
        }

        .header-user-menu {
          padding: 0.375rem;
          gap: 0.5rem;
        }
      }

      @media (max-width: 576px) {
        .header-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
        }

        .header-logo {
          font-size: 1rem;
        }

        .header-logo i {
          font-size: 1.25rem;
        }

        .header-user-menu .user-avatar {
          width: 32px;
          height: 32px;
        }

        .header-user-menu .logout-btn {
          display: none;
        }
      }

      /* Ensure sidebar is visible on desktop (screens > 1024px) */
      @media (min-width: 1025px) {
        .crm-sidebar {
          display: flex !important;
        }

        .crm-mobile-header {
          display: none !important;
        }

        .crm-main-content {
          margin-left: 260px !important;
        }
      }

      /* Recent Chats Button */
      .crm-nav-section {
        padding: 0.5rem 1rem;
        margin-bottom: 0.5rem;
      }

      /* Chat Panel */
      .chat-panel-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        z-index: 1001;
        opacity: 0;
        animation: fadeIn 0.15s ease-out forwards;
      }

      @keyframes fadeIn {
        to {
          opacity: 1;
        }
      }

      .chat-panel {
        position: fixed;
        top: 70px;
        right: 1rem;
        left: auto;
        width: 340px;
        max-height: calc(100vh - 90px);
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        border: 1px solid #e5e7eb;
        z-index: 1002;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .chat-panel-header {
        display: none;
      }

      .close-panel-btn {
        width: 28px !important;
        height: 28px !important;
        color: #6b7280 !important;
        background: transparent !important;
        border: none !important;
      }

      .close-panel-btn:hover {
        background: rgba(107, 114, 128, 0.1) !important;
      }

      .chat-panel-content {
        flex: 1;
        overflow-y: auto;
      }

      .chat-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        color: #9ca3af;
        gap: 0.5rem;
      }

      .chat-empty i {
        font-size: 2.5rem;
      }

      .chat-item {
        display: flex;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid #f1f5f9;
        cursor: pointer;
        transition: background 0.2s;
      }

      .chat-item:hover {
        background: #f8fafc;
      }

      .chat-item.unread {
        background: #f0fdf4;
      }

      .chat-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 1rem;
        flex-shrink: 0;
      }

      .chat-info {
        flex: 1;
        min-width: 0;
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

      .float-btn {
        width: 32px !important;
        height: 32px !important;
        color: #25d366 !important;
        background: rgba(37, 211, 102, 0.1) !important;
        border: none !important;
      }

      .float-btn:hover {
        background: rgba(37, 211, 102, 0.2) !important;
      }

      .chat-name {
        font-weight: 600;
        color: #1f2937;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .unread-badge {
        background: #25d366;
        color: white;
        font-size: 0.65rem;
        padding: 0.15rem 0.4rem;
        border-radius: 8px;
        font-weight: 600;
      }

      .chat-phone {
        font-size: 0.75rem;
        color: #6b7280;
        margin-top: 0.15rem;
      }

      .chat-preview {
        font-size: 0.8rem;
        color: #4b5563;
        margin-top: 0.25rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .chat-preview i {
        font-size: 0.7rem;
        color: #9ca3af;
      }

      .chat-time {
        font-size: 0.7rem;
        color: #9ca3af;
        white-space: nowrap;
      }

      @media (max-width: 1024px) {
        .chat-panel-overlay {
          left: 0;
        }

        .chat-panel {
          right: 1rem;
          left: auto;
          top: 70px;
          width: calc(100% - 2rem);
          max-width: 340px;
        }
      }

      @media (max-width: 480px) {
        .chat-panel {
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          max-width: 100%;
          max-height: 100vh;
          border-radius: 0;
        }
      }

      /* Floating Chat Controls */
      .floating-chat-controls {
        background: rgba(37, 211, 102, 0.05);
        border-radius: 10px;
        padding: 0.75rem;
        border: 1px solid rgba(37, 211, 102, 0.2);
      }

      .control-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
        font-size: 0.8rem;
        font-weight: 600;
        color: #25d366;
      }

      .control-actions {
        display: flex;
        gap: 0.25rem;
      }

      .control-actions button {
        width: 24px !important;
        height: 24px !important;
        color: #25d366 !important;
        background: rgba(37, 211, 102, 0.1) !important;
        border: none !important;
      }

      .control-actions button:hover {
        background: rgba(37, 211, 102, 0.2) !important;
      }

      .floating-chat-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 6px;
        margin-bottom: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
      }

      .floating-chat-item:last-child {
        margin-bottom: 0;
      }

      .floating-chat-item:hover {
        background: white;
      }

      .floating-chat-item.minimized {
        opacity: 0.7;
      }

      .chat-window-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
      }

      .window-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.7rem;
        flex-shrink: 0;
      }

      .window-details {
        flex: 1;
        min-width: 0;
      }

      .window-name {
        font-size: 0.75rem;
        font-weight: 500;
        color: #1f2937;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .window-unread {
        background: #ef4444;
        color: white;
        font-size: 0.6rem;
        font-weight: 600;
        padding: 0.1rem 0.3rem;
        border-radius: 8px;
        margin-top: 0.2rem;
        display: inline-block;
      }

      .window-close-btn {
        width: 20px !important;
        height: 20px !important;
        color: #ef4444 !important;
        background: rgba(239, 68, 68, 0.1) !important;
        border: none !important;
        flex-shrink: 0;
      }

      .window-close-btn:hover {
        background: rgba(239, 68, 68, 0.2) !important;
      }

      /* Notification Panel */
      .notification-panel-overlay {
        position: fixed;
        top: 0;
        left: 260px;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        z-index: 1001;
        opacity: 0;
        animation: fadeIn 0.15s ease-out forwards;
      }

      .notification-panel-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        left: auto;
        width: auto;
        height: auto;
        max-height: calc(100vh - 2rem);
        background: transparent;
        box-shadow: none;
        z-index: 1002;
        display: flex;
        flex-direction: column;
        transform: translateY(-10px);
        opacity: 0;
        animation: slideDown 0.25s ease-out forwards;
      }

      @keyframes slideDown {
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .close-panel-btn {
        width: 32px !important;
        height: 32px !important;
        color: #6b7280 !important;
        background: transparent !important;
        border: none !important;
      }

      .close-panel-btn:hover {
        background: rgba(107, 114, 128, 0.1) !important;
      }

      @media (max-width: 768px) {
        .notification-panel-overlay {
          left: 0;
        }

        .notification-panel-container {
          top: 0;
          right: 0;
          left: 0;
          width: 100%;
          max-height: 100vh;
          border-radius: 0;
        }
      }
    `,
  ],
})
export class LayoutComponent implements OnInit, OnDestroy {
  mobileMenuOpen = signal(false);
  sidebarCollapsed = signal(false);
  chatPanelVisible = false;
  notificationPanelVisible = false;
  notificationWasAutoOpened = false;
  private messageSubscription?: Subscription;
  private notificationSubscription?: Subscription;
  private panelToggleTimeout?: number;
  private autoOpenNotifications = true; // User preference for auto-opening notifications
  private notificationAutoCloseTimeout?: number;

  get mobileMenuVisible(): boolean {
    return this.mobileMenuOpen();
  }

  set mobileMenuVisible(value: boolean) {
    this.mobileMenuOpen.set(value);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
    // Save preference to localStorage
    localStorage.setItem(
      'sidebar_collapsed',
      this.sidebarCollapsed().toString()
    );
  }

  constructor(
    public authService: AuthService,
    public recentChatsService: RecentChatsService,
    private wsService: WebSocketService,
    private leadService: LeadService,
    private router: Router,
    public floatingChatService: FloatingChatService,
    public notificationService: NotificationService,
    public roleBasedChatService: RoleBasedChatService
  ) {}

  ngOnInit(): void {
    // Load user preferences
    const autoOpenPref = localStorage.getItem('auto_open_notifications');
    if (autoOpenPref !== null) {
      this.autoOpenNotifications = autoOpenPref === 'true';
    }

    // Load sidebar collapsed preference
    const sidebarPref = localStorage.getItem('sidebar_collapsed');
    if (sidebarPref !== null) {
      this.sidebarCollapsed.set(sidebarPref === 'true');
    }

    // Connect to WebSocket and listen for incoming messages globally
    this.wsService.connect();

    // Subscribe to notifications$ for user-specific notifications
    // This handles notifications sent to user rooms (for users NOT viewing the specific chat)
    this.notificationSubscription = this.wsService.notifications$.subscribe(
      (notification) => {
        console.log('Layout: Received WebSocket notification:', notification);

        if (notification.leadId) {
          // Fetch lead info to update recent chats and notifications
          this.leadService.getLead(notification.leadId).subscribe({
            next: (response) => {
              const lead = response.data;

              // Update recent chats and role-based chats
              this.recentChatsService.addOrUpdateChat(
                lead,
                notification.message || 'Media',
                true
              );

              // Update role-based chat service
              this.roleBasedChatService.addOrUpdateChat(
                lead,
                notification.message || 'Media',
                true
              );

              // Check if this is a new chat
              const existingChats = this.recentChatsService.recentChats();
              const existingChat = existingChats.find(
                (c) => c.leadId === lead.id
              );
              const isNewChat =
                !existingChat ||
                existingChat.lastMessageTime <
                  new Date(Date.now() - 24 * 60 * 60 * 1000);

              // Create a message-like object for the notification service
              const messageForNotification = {
                id: notification.messageId,
                content: notification.message,
                direction: 'inbound' as const,
                status: 'delivered' as const,
                isAutoReply: false,
                createdAt: notification.timestamp,
              };

              // Add notification
              this.notificationService.addNotification(
                lead,
                messageForNotification as any,
                isNewChat
              );

              // Auto-open notification panel for new messages
              this.autoOpenNotificationPanel();
            },
            error: (error) => {
              console.error(
                'Layout: Error fetching lead data for notification:',
                error
              );
            },
          });
        }
      }
    );

    // Subscribe to messages$ for lead-room messages (when user is viewing a specific chat)
    // This is mainly for updating recent chats when user is actively in a chat
    this.messageSubscription = this.wsService.messages$.subscribe((message) => {
      console.log('Layout: Received WebSocket message:', message);

      // Only handle inbound messages for recent chats notification
      if (message.direction === 'inbound' && message.leadId) {
        console.log(
          'Layout: Processing inbound message for lead:',
          message.leadId
        );

        // Fetch lead info to update recent chats and notifications
        this.leadService.getLead(message.leadId).subscribe({
          next: (response) => {
            const lead = response.data;
            console.log('Layout: Lead data fetched:', lead);

            // Update recent chats and role-based chats
            this.recentChatsService.addOrUpdateChat(
              lead,
              message.content || 'Media',
              true
            );

            // Update role-based chat service
            this.roleBasedChatService.addOrUpdateChat(
              lead,
              message.content || 'Media',
              true
            );

            // Check if this is a new chat (first message from this lead)
            const existingChats = this.recentChatsService.recentChats();
            const existingChat = existingChats.find(
              (c) => c.leadId === lead.id
            );
            const isNewChat =
              !existingChat ||
              existingChat.lastMessageTime <
                new Date(Date.now() - 24 * 60 * 60 * 1000); // Consider new if no chat in last 24h

            console.log('Layout: Adding notification - isNewChat:', isNewChat);

            // Add notification
            this.notificationService.addNotification(lead, message, isNewChat);

            console.log(
              'Layout: Current notifications count:',
              this.notificationService.notifications().length
            );

            // Auto-open notification panel for new messages
            this.autoOpenNotificationPanel();
          },
          error: (error) => {
            console.error('Layout: Error fetching lead data:', error);
          },
        });
      } else {
        console.log(
          'Layout: Ignoring message - not inbound or no leadId:',
          message
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.messageSubscription?.unsubscribe();
    this.notificationSubscription?.unsubscribe();
    if (this.panelToggleTimeout) {
      clearTimeout(this.panelToggleTimeout);
    }
    if (this.notificationAutoCloseTimeout) {
      clearTimeout(this.notificationAutoCloseTimeout);
    }
  }

  getUserInitials(): string {
    const name = this.authService.currentUser()?.name || '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  openChat(leadId: string): void {
    this.recentChatsService.markAsRead(leadId);
    this.closeChatPanel();
    // Load lead and open floating chat instead of navigation
    this.leadService.getLead(leadId).subscribe({
      next: (response) => {
        this.floatingChatService.openChat(response.data);
      },
      error: (error) => {
        console.error('Error loading lead for floating chat:', error);
      },
    });
  }

  openFloatingChat(leadId: string, event: Event): void {
    event.stopPropagation();
    this.leadService.getLead(leadId).subscribe({
      next: (response) => {
        this.floatingChatService.openChat(response.data);
        this.recentChatsService.markAsRead(leadId);
      },
    });
  }

  getWindowInitials(lead: any): string {
    const name = lead.name || lead.phoneNumber;
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  onChatSelected(chatItem: any): void {
    // Close chat panel when user selects a chat
    this.closeChatPanel();

    // Mark all services as read for this lead
    this.notificationService.markLeadNotificationsAsRead(chatItem.leadId);
    this.recentChatsService.markAsRead(chatItem.leadId);
    this.roleBasedChatService.markAsRead(chatItem.leadId);

    // Open floating chat popup instead of navigating
    this.floatingChatService.openChat(chatItem.lead);
  }

  onNotificationClick(notification: any): void {
    // Close notification panel when user clicks on a notification
    this.closeNotificationPanel();

    // Mark all services as read for this lead
    this.notificationService.markLeadNotificationsAsRead(notification.leadId);
    this.recentChatsService.markAsRead(notification.leadId);
    this.roleBasedChatService.markAsRead(notification.leadId);
  }

  onAutoOpenToggle(enabled: boolean): void {
    this.autoOpenNotifications = enabled;
    console.log('Layout: Auto-open notifications updated to:', enabled);
  }

  // Optimized panel toggle methods
  toggleChatPanel(): void {
    if (this.panelToggleTimeout) {
      clearTimeout(this.panelToggleTimeout);
    }

    this.panelToggleTimeout = window.setTimeout(() => {
      // Close notification panel if open
      if (this.notificationPanelVisible) {
        this.notificationPanelVisible = false;
      }

      // Toggle chat panel
      this.chatPanelVisible = !this.chatPanelVisible;
    }, 50);
  }

  toggleNotificationPanel(): void {
    if (this.panelToggleTimeout) {
      clearTimeout(this.panelToggleTimeout);
    }

    this.panelToggleTimeout = window.setTimeout(() => {
      // Close chat panel if open
      if (this.chatPanelVisible) {
        this.chatPanelVisible = false;
      }

      // Toggle notification panel
      this.notificationPanelVisible = !this.notificationPanelVisible;

      // Reset auto-opened flag when manually toggling
      if (!this.notificationPanelVisible) {
        this.notificationWasAutoOpened = false;
      }
    }, 50);
  }

  closeChatPanel(): void {
    this.chatPanelVisible = false;
  }

  closeNotificationPanel(): void {
    this.notificationPanelVisible = false;
    this.notificationWasAutoOpened = false;
    // Clear any auto-close timeout when manually closing
    if (this.notificationAutoCloseTimeout) {
      clearTimeout(this.notificationAutoCloseTimeout);
    }
  }

  autoOpenNotificationPanel(): void {
    // Only auto-open if user preference allows and panel is not already open
    if (this.autoOpenNotifications && !this.notificationPanelVisible) {
      console.log('Layout: Auto-opening notification panel for new message');

      // Close chat panel if open
      if (this.chatPanelVisible) {
        this.chatPanelVisible = false;
      }

      // Open notification panel and mark as auto-opened
      this.notificationPanelVisible = true;
      this.notificationWasAutoOpened = true;

      // Auto-close after 10 seconds unless user interacts
      this.notificationAutoCloseTimeout = window.setTimeout(() => {
        if (this.notificationPanelVisible) {
          console.log('Layout: Auto-closing notification panel after timeout');
          this.notificationPanelVisible = false;
          this.notificationWasAutoOpened = false;
        }
      }, 10000); // 10 seconds

      // Clear the auto-opened flag after 3 seconds (for the indicator)
      window.setTimeout(() => {
        this.notificationWasAutoOpened = false;
      }, 3000);
    }
  }

  // Method to toggle auto-open preference
  toggleAutoOpenNotifications(): void {
    this.autoOpenNotifications = !this.autoOpenNotifications;
    localStorage.setItem(
      'auto_open_notifications',
      this.autoOpenNotifications.toString()
    );
    console.log('Layout: Auto-open notifications:', this.autoOpenNotifications);
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
}
