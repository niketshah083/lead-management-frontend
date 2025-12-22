import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ChipModule } from 'primeng/chip';
import { MessageService } from 'primeng/api';
import { UserService } from '../../../../core/services';
import { CategoryService } from '../../../category/services/category.service';
import {
  IUser,
  ICreateUser,
  IUpdateUser,
  UserRole,
  ICategory,
} from '../../../../core/models';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    PasswordModule,
    SelectModule,
    MultiSelectModule,
    ButtonModule,
    ToastModule,
    ChipModule,
    LayoutComponent,
  ],
  providers: [MessageService],
  template: `
    <app-layout>
      <p-toast />
      <div class="page-container">
        <div class="page-header">
          <div class="header-content">
            <h1 class="page-title">
              {{ isEdit() ? 'Edit User' : 'Create User' }}
            </h1>
            <p class="page-subtitle">
              {{
                isEdit()
                  ? 'Update user information and role'
                  : 'Add a new team member to your organization'
              }}
            </p>
          </div>
          <button
            pButton
            label="Back to Users"
            icon="pi pi-arrow-left"
            [text]="true"
            routerLink="/users"
          ></button>
        </div>

        <div class="form-card">
          <form (ngSubmit)="onSubmit()" class="user-form">
            <div class="form-section">
              <h3 class="section-title">
                <i class="pi pi-user"></i> Basic Information
              </h3>
              <div class="form-grid">
                <div class="form-group">
                  <label for="name" class="form-label"
                    >Full Name <span class="required">*</span></label
                  >
                  <input
                    pInputText
                    id="name"
                    [(ngModel)]="formData.name"
                    name="name"
                    placeholder="Enter full name"
                    required
                    class="form-input"
                  />
                </div>

                <div class="form-group">
                  <label for="email" class="form-label"
                    >Email Address <span class="required">*</span></label
                  >
                  <input
                    pInputText
                    id="email"
                    type="email"
                    [(ngModel)]="formData.email"
                    name="email"
                    placeholder="Enter email address"
                    required
                    [disabled]="isEdit()"
                    class="form-input"
                    [ngClass]="{ disabled: isEdit() }"
                  />
                </div>

                @if (!isEdit()) {
                <div class="form-group">
                  <label for="password" class="form-label"
                    >Password <span class="required">*</span></label
                  >
                  <p-password
                    id="password"
                    [(ngModel)]="formData.password"
                    name="password"
                    [feedback]="true"
                    [toggleMask]="true"
                    placeholder="Enter password"
                    required
                    [style]="{ width: '100%' }"
                    [inputStyle]="{ width: '100%' }"
                  />
                </div>
                }

                <div class="form-group">
                  <label for="phone" class="form-label">Phone Number</label>
                  <input
                    pInputText
                    id="phone"
                    [(ngModel)]="formData.phone"
                    name="phone"
                    placeholder="Enter phone number"
                    class="form-input"
                  />
                </div>
              </div>
            </div>

            <div class="form-section">
              <h3 class="section-title">
                <i class="pi pi-shield"></i> Role & Permissions
              </h3>
              <div class="form-grid">
                <div class="form-group">
                  <label for="role" class="form-label"
                    >Role <span class="required">*</span></label
                  >
                  <p-select
                    id="role"
                    [options]="roleOptions"
                    [(ngModel)]="formData.role"
                    name="role"
                    placeholder="Select Role"
                    [style]="{ width: '100%' }"
                  />
                </div>

                @if (formData.role === 'customer_executive') {
                <div class="form-group">
                  <label for="manager" class="form-label"
                    >Reporting Manager</label
                  >
                  <p-select
                    id="manager"
                    [options]="managers()"
                    [(ngModel)]="formData.managerId"
                    name="managerId"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Select Manager"
                    [showClear]="true"
                    [style]="{ width: '100%' }"
                  />
                </div>
                }
              </div>
            </div>

            <!-- Category Assignment Section - Only for Customer Executives when editing -->
            @if (isEdit() && formData.role === 'customer_executive') {
            <div class="form-section">
              <h3 class="section-title">
                <i class="pi pi-tags"></i> Assigned Categories
              </h3>
              <p class="section-description">
                Select the categories this user can handle leads for
              </p>

              <div class="form-group">
                <label for="categories" class="form-label">Categories</label>
                <p-multiSelect
                  id="categories"
                  [options]="categories()"
                  [(ngModel)]="selectedCategoryIds"
                  name="categories"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Select categories"
                  [showClear]="true"
                  [filter]="true"
                  filterPlaceholder="Search categories"
                  [style]="{ width: '100%' }"
                  display="chip"
                />
              </div>

              @if (userCategories().length > 0) {
              <div class="current-categories">
                <label class="form-label">Currently Assigned:</label>
                <div class="category-chips">
                  @for (cat of userCategories(); track cat.id) {
                  <p-chip
                    [label]="cat.name"
                    [removable]="true"
                    (onRemove)="removeCategory(cat.id)"
                  />
                  }
                </div>
              </div>
              }
            </div>
            }

            <div class="form-actions">
              <button
                pButton
                type="button"
                label="Cancel"
                severity="secondary"
                [outlined]="true"
                routerLink="/users"
                class="cancel-btn"
              ></button>
              <button
                pButton
                type="submit"
                [label]="isEdit() ? 'Update User' : 'Create User'"
                [loading]="saving()"
                icon="pi pi-check"
                class="submit-btn"
              ></button>
            </div>
          </form>
        </div>
      </div>
    </app-layout>
  `,
  styles: [
    `
      .page-container {
        padding: 1.5rem;
        max-width: 800px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
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

      .form-card {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }

      .user-form {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .form-section {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .section-title {
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #e5e7eb;
      }

      .section-title i {
        color: #25d366;
      }

      .section-description {
        color: #6b7280;
        font-size: 0.875rem;
        margin: -0.5rem 0 0.5rem 0;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.25rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
      }

      .required {
        color: #ef4444;
      }

      .form-input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 2px solid #e5e7eb;
        border-radius: 10px;
        font-size: 0.9375rem;
        transition: all 0.2s ease;
      }

      .form-input:focus {
        border-color: #25d366;
        box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.1);
        outline: none;
      }

      .form-input.disabled {
        background: #f9fafb;
        color: #6b7280;
        cursor: not-allowed;
      }

      :host ::ng-deep .p-password {
        width: 100%;
      }

      :host ::ng-deep .p-password input {
        width: 100%;
        padding: 0.75rem 2.5rem 0.75rem 1rem;
        border: 2px solid #e5e7eb;
        border-radius: 10px;
        font-size: 0.9375rem;
      }

      :host ::ng-deep .p-password input:focus {
        border-color: #25d366;
        box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.1);
        outline: none;
      }

      :host ::ng-deep .p-select,
      :host ::ng-deep .p-multiselect {
        width: 100%;
        border: 2px solid #e5e7eb;
        border-radius: 10px;
      }

      :host ::ng-deep .p-select:focus,
      :host ::ng-deep .p-select.p-focus,
      :host ::ng-deep .p-multiselect:focus,
      :host ::ng-deep .p-multiselect.p-focus {
        border-color: #25d366;
        box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.1);
      }

      .current-categories {
        margin-top: 1rem;
        padding: 1rem;
        background: #f9fafb;
        border-radius: 10px;
      }

      .category-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }

      :host ::ng-deep .p-chip {
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        color: white;
      }

      :host ::ng-deep .p-chip .p-chip-remove-icon {
        color: white;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1rem;
        padding-top: 1.5rem;
        border-top: 1px solid #e5e7eb;
      }

      .cancel-btn {
        padding: 0.75rem 1.5rem;
      }

      .submit-btn {
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        border: none;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
      }

      .submit-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(37, 211, 102, 0.4);
      }

      @media (max-width: 640px) {
        .page-container {
          padding: 1rem;
        }

        .page-title {
          font-size: 1.5rem;
        }

        .page-header {
          flex-direction: column;
        }

        .form-card {
          padding: 1.5rem;
        }

        .form-grid {
          grid-template-columns: 1fr;
        }

        .form-actions {
          flex-direction: column-reverse;
        }

        .cancel-btn,
        .submit-btn {
          width: 100%;
          justify-content: center;
        }
      }
    `,
  ],
})
export class UserFormComponent implements OnInit {
  isEdit = signal(false);
  saving = signal(false);
  managers = signal<IUser[]>([]);
  categories = signal<ICategory[]>([]);
  userCategories = signal<ICategory[]>([]);
  selectedCategoryIds: string[] = [];
  userId = '';

  formData: ICreateUser & { managerId?: string } = {
    email: '',
    password: '',
    name: '',
    phone: '',
    role: UserRole.CUSTOMER_EXECUTIVE,
    managerId: undefined,
  };

  roleOptions = Object.values(UserRole).map((r) => ({
    label: r.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value: r,
  }));

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private categoryService: CategoryService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    this.isEdit.set(!!this.userId);
    this.loadManagers();
    this.loadCategories();
    if (this.isEdit()) {
      this.loadUser();
      this.loadUserCategories();
    }
  }

  loadManagers(): void {
    this.userService.getManagers().subscribe({
      next: (response) => {
        this.managers.set(response.data);
      },
    });
  }

  loadCategories(): void {
    this.categoryService.loadCategories().subscribe({
      next: (response) => {
        this.categories.set(response.data);
      },
    });
  }

  loadUserCategories(): void {
    this.userService.getUserCategories(this.userId).subscribe({
      next: (response) => {
        this.userCategories.set(response.data || []);
        this.selectedCategoryIds = (response.data || []).map(
          (c: ICategory) => c.id
        );
      },
    });
  }

  loadUser(): void {
    this.userService.getUser(this.userId).subscribe({
      next: (response) => {
        const user = response.data;
        this.formData = {
          email: user.email,
          password: '',
          name: user.name,
          phone: user.phone || '',
          role: user.role,
          managerId: user.managerId,
        };
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load user',
        });
      },
    });
  }

  removeCategory(categoryId: string): void {
    this.userService.removeCategory(this.userId, categoryId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Category removed',
        });
        this.loadUserCategories();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to remove category',
        });
      },
    });
  }

  onSubmit(): void {
    if (!this.formData.name || !this.formData.email) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fill in all required fields',
      });
      return;
    }

    if (!this.isEdit() && !this.formData.password) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Password is required',
      });
      return;
    }

    this.saving.set(true);

    if (this.isEdit()) {
      const updateData: IUpdateUser = {
        name: this.formData.name,
        phone: this.formData.phone,
        role: this.formData.role,
        managerId: this.formData.managerId,
      };

      this.userService.updateUser(this.userId, updateData).subscribe({
        next: () => {
          // If role is CE, also update categories
          if (this.formData.role === UserRole.CUSTOMER_EXECUTIVE) {
            this.userService
              .assignCategories(this.userId, this.selectedCategoryIds)
              .subscribe({
                next: () => {
                  this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'User updated successfully',
                  });
                  this.router.navigate(['/users']);
                },
                error: () => {
                  this.saving.set(false);
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update categories',
                  });
                },
              });
          } else {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'User updated successfully',
            });
            this.router.navigate(['/users']);
          }
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update user',
          });
        },
      });
    } else {
      this.userService.createUser(this.formData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User created successfully',
          });
          this.router.navigate(['/users']);
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create user',
          });
        },
      });
    }
  }
}
