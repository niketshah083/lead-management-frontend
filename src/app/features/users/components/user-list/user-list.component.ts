import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UserService, AuthService } from '../../../../core/services';
import { IUser, UserRole } from '../../../../core/models';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    AvatarModule,
    InputTextModule,
    LayoutComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  @ViewChild('dt') table!: Table;

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

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.table?.filterGlobal(target.value, 'contains');
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

  getCategoryTooltip(user: IUser): string {
    if (!user.categories || user.categories.length === 0) return '';
    return user.categories.map((c) => c.name).join(', ');
  }
}
