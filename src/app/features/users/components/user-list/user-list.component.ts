import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UserService, AuthService } from '../../../../core/services';
import { IUser, UserRole } from '../../../../core/models';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    AvatarModule,
    LayoutComponent,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <app-layout>
      <p-toast />
      <p-confirmDialog />
      <div class="page-container">
        <div class="page-header">
          <div class="header-content">
            <h1 class="page-title">Users</h1>
            <p class="page-subtitle">Manage team members and their roles</p>
          </div>
          @if (authService.isAdmin()) {
          <button
            pButton
            label="Add User"
            icon="pi pi-plus"
            routerLink="/users/create"
            class="add-btn"
          ></button>
          }
        </div>

        <div class="table-card">
          <p-table
            [value]="users()"
            [loading]="loading()"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[10, 25, 50]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
          >
            <ng-template pTemplate="header">
              <tr>
                <th style="width: 20%">User</th>
                <th style="width: 20%" class="hidden-mobile">Email</th>
                <th style="width: 12%">Role</th>
                <th style="width: 12%" class="hidden-mobile">Manager</th>
                <th style="width: 18%" class="hidden-mobile">Categories</th>
                <th style="width: 8%">Status</th>
                <th style="width: 10%">Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-user>
              <tr class="table-row">
                <td>
                  <div class="user-cell">
                    <div
                      class="user-avatar"
                      [ngStyle]="{ background: getAvatarColor(user.role) }"
                    >
                      {{ getInitials(user.name) }}
                    </div>
                    <div class="user-info">
                      <span class="user-name">{{ user.name }}</span>
                      <span class="user-email-mobile">{{ user.email }}</span>
                    </div>
                  </div>
                </td>
                <td class="hidden-mobile">
                  <span class="email-text">{{ user.email }}</span>
                </td>
                <td>
                  <span class="role-badge" [ngClass]="getRoleClass(user.role)">
                    {{ formatRole(user.role) }}
                  </span>
                </td>
                <td class="hidden-mobile">
                  <span class="manager-text">{{
                    user.manager?.name || '-'
                  }}</span>
                </td>
                <td class="hidden-mobile">
                  <div class="categories-cell">
                    @if (user.categories && user.categories.length > 0) { @for
                    (cat of user.categories.slice(0, 2); track cat.id) {
                    <span class="category-tag">{{ cat.name }}</span>
                    } @if (user.categories.length > 2) {
                    <span
                      class="category-more"
                      [pTooltip]="getCategoryTooltip(user)"
                      tooltipPosition="top"
                    >
                      +{{ user.categories.length - 2 }}
                    </span>
                    } } @else {
                    <span class="no-categories">-</span>
                    }
                  </div>
                </td>
                <td>
                  <div
                    class="status-badge"
                    [ngClass]="{
                      active: user.isActive,
                      inactive: !user.isActive
                    }"
                  >
                    <span class="status-dot"></span>
                    <span class="status-text">{{
                      user.isActive ? 'Active' : 'Inactive'
                    }}</span>
                  </div>
                </td>
                <td>
                  <div class="action-buttons">
                    @if (authService.isAdmin()) {
                    <button
                      pButton
                      icon="pi pi-pencil"
                      [text]="true"
                      [rounded]="true"
                      severity="info"
                      pTooltip="Edit"
                      tooltipPosition="top"
                      [routerLink]="['/users', user.id, 'edit']"
                    ></button>
                    @if (user.isActive) {
                    <button
                      pButton
                      icon="pi pi-ban"
                      [text]="true"
                      [rounded]="true"
                      severity="danger"
                      pTooltip="Deactivate"
                      tooltipPosition="top"
                      (click)="confirmDeactivate(user)"
                    ></button>
                    } }
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="7">
                  <div class="empty-state">
                    <i class="pi pi-users"></i>
                    <h3>No users found</h3>
                    <p>Add your first team member to get started</p>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </app-layout>
  `,
  styles: [
    `
      .page-container {
        padding: 1.5rem;
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .header-content {
        flex: 1;
      }

      .page-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 0.25rem 0;
      }

      .page-subtitle {
        color: #6b7280;
        margin: 0;
        font-size: 0.875rem;
      }

      .add-btn {
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        border: none;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
      }

      .add-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(37, 211, 102, 0.4);
      }

      .table-card {
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }

      :host ::ng-deep .p-datatable {
        .p-datatable-thead > tr > th {
          background: #f8fafc;
          color: #64748b;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 1rem 1.25rem;
          border: none;
          border-bottom: 1px solid #e2e8f0;
        }

        .p-datatable-tbody > tr {
          transition: background 0.2s ease;
        }

        .p-datatable-tbody > tr > td {
          padding: 1rem 1.25rem;
          border: none;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .p-datatable-tbody > tr:hover {
          background: #f8fafc;
        }

        .p-paginator {
          border: none;
          padding: 1rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
      }

      .user-cell {
        display: flex;
        align-items: center;
        gap: 0.875rem;
      }

      .user-avatar {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 0.875rem;
        flex-shrink: 0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .user-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .user-name {
        font-weight: 600;
        color: #1f2937;
        font-size: 0.9375rem;
      }

      .user-email-mobile {
        display: none;
        font-size: 0.75rem;
        color: #6b7280;
      }

      .email-text {
        color: #6b7280;
        font-size: 0.875rem;
      }

      .role-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.375rem 0.75rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: capitalize;
      }

      .role-badge.admin {
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        color: #dc2626;
      }

      .role-badge.manager {
        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        color: #d97706;
      }

      .role-badge.customer_executive {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        color: #2563eb;
      }

      .manager-text {
        color: #6b7280;
        font-size: 0.875rem;
      }

      .categories-cell {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
        align-items: center;
      }

      .category-tag {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.5rem;
        background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
        color: #0369a1;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 500;
        white-space: nowrap;
      }

      .category-more {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.25rem 0.5rem;
        background: #f1f5f9;
        color: #64748b;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 600;
        cursor: pointer;
      }

      .no-categories {
        color: #9ca3af;
        font-size: 0.875rem;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.375rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .status-badge.active {
        background: #d1fae5;
        color: #059669;
      }

      .status-badge.inactive {
        background: #fee2e2;
        color: #dc2626;
      }

      .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }

      .action-buttons {
        display: flex;
        gap: 0.25rem;
      }

      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        color: #6b7280;
      }

      .empty-state i {
        font-size: 3.5rem;
        color: #d1d5db;
        margin-bottom: 1rem;
      }

      .empty-state h3 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #374151;
        margin: 0 0 0.5rem 0;
      }

      .empty-state p {
        margin: 0;
        font-size: 0.875rem;
      }

      @media (max-width: 768px) {
        .page-container {
          padding: 1rem;
        }

        .page-title {
          font-size: 1.5rem;
        }

        .page-header {
          flex-direction: column;
          align-items: stretch;
        }

        .add-btn {
          width: 100%;
          justify-content: center;
        }

        .hidden-mobile {
          display: none !important;
        }

        .user-email-mobile {
          display: block;
        }

        :host ::ng-deep .p-datatable {
          .p-datatable-thead > tr > th,
          .p-datatable-tbody > tr > td {
            padding: 0.75rem 1rem;
          }
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          font-size: 0.75rem;
        }

        .status-text {
          display: none;
        }

        .status-badge {
          padding: 0.375rem;
          min-width: auto;
        }

        .status-dot {
          width: 8px;
          height: 8px;
        }
      }
    `,
  ],
})
export class UserListComponent implements OnInit {
  users = signal<IUser[]>([]);
  loading = signal(false);

  constructor(
    private userService: UserService,
    public authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load users',
        });
      },
    });
  }

  confirmDeactivate(user: IUser): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to deactivate ${user.name}?`,
      header: 'Confirm Deactivation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deactivateUser(user),
    });
  }

  deactivateUser(user: IUser): void {
    this.userService.deactivateUser(user.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'User deactivated successfully',
        });
        this.loadUsers();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to deactivate user',
        });
      },
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getAvatarColor(role: UserRole): string {
    const colors: Record<UserRole, string> = {
      [UserRole.ADMIN]: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      [UserRole.MANAGER]: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      [UserRole.CUSTOMER_EXECUTIVE]:
        'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    };
    return colors[role] || 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
  }

  getRoleClass(role: UserRole): string {
    return role.toLowerCase();
  }

  formatRole(role: UserRole): string {
    return role.replace(/_/g, ' ');
  }

  getRoleSeverity(
    role: UserRole
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<
      UserRole,
      'success' | 'info' | 'warn' | 'danger' | 'secondary'
    > = {
      [UserRole.ADMIN]: 'danger',
      [UserRole.MANAGER]: 'warn',
      [UserRole.CUSTOMER_EXECUTIVE]: 'info',
    };
    return map[role] || 'info';
  }

  getCategoryTooltip(user: IUser): string {
    if (!user.categories || user.categories.length === 0) return '';
    return user.categories.map((c) => c.name).join(', ');
  }
}
