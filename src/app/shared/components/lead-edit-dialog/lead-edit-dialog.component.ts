import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import {
  LeadService,
  AuthService,
  LeadStatusService,
} from '../../../core/services';
import { ILead } from '../../../core/models';
import { ILeadStatus } from '../../../core/models/lead-status.model';

interface Category {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
}

@Component({
  selector: 'app-lead-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    SelectModule,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <p-dialog
      [(visible)]="visible"
      [header]="'Edit Lead: ' + (lead?.phoneNumber || '')"
      [modal]="true"
      [style]="{ width: '450px' }"
      [draggable]="false"
      [resizable]="false"
      (onHide)="onCancel()"
    >
      <div class="edit-form">
        <!-- Status -->
        <div class="form-field">
          <label class="field-label">Status</label>
          <p-select
            [options]="statusOptions"
            [(ngModel)]="selectedStatus"
            optionLabel="label"
            optionValue="value"
            placeholder="Select status"
            class="w-full"
          />
        </div>

        <!-- Category -->
        <div class="form-field">
          <label class="field-label">Category</label>
          <p-select
            [options]="categories()"
            [(ngModel)]="selectedCategoryId"
            optionLabel="name"
            optionValue="id"
            placeholder="Select category"
            [showClear]="true"
            [filter]="true"
            filterPlaceholder="Search categories"
            class="w-full"
          />
        </div>

        <!-- Assignee (Admin/Manager only) -->
        @if (authService.isAdmin() || authService.isManager()) {
        <div class="form-field">
          <label class="field-label">Assigned To</label>
          <p-select
            [options]="users()"
            [(ngModel)]="selectedUserId"
            optionLabel="name"
            optionValue="id"
            placeholder="Select user"
            [showClear]="true"
            [filter]="true"
            filterPlaceholder="Search users"
            class="w-full"
          />
        </div>
        }
      </div>

      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <button
            pButton
            label="Cancel"
            [text]="true"
            severity="secondary"
            (click)="onCancel()"
          ></button>
          <button
            pButton
            label="Save Changes"
            [loading]="saving()"
            (click)="onSave()"
          ></button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [
    `
      .edit-form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        padding: 0.5rem 0;
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .field-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
      }

      :host ::ng-deep .w-full {
        width: 100%;
      }

      .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }
    `,
  ],
})
export class LeadEditDialogComponent {
  @Input() lead: ILead | null = null;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() leadUpdated = new EventEmitter<ILead>();

  categories = signal<Category[]>([]);
  users = signal<User[]>([]);
  statuses = signal<ILeadStatus[]>([]);
  saving = signal(false);

  selectedStatus: string | null = null;
  selectedCategoryId: string | null = null;
  selectedUserId: string | null = null;

  statusOptions: Array<{ label: string; value: string }> = [];

  constructor(
    private leadService: LeadService,
    public authService: AuthService,
    private messageService: MessageService,
    private leadStatusService: LeadStatusService
  ) {
    this.loadCategories();
    this.loadUsers();
    this.loadStatuses();
  }

  ngOnChanges(): void {
    if (this.lead && this.visible) {
      this.selectedStatus = this.lead.status;
      this.selectedCategoryId = this.lead.categoryId || null;
      this.selectedUserId = this.lead.assignedToId || null;
    }
  }

  loadCategories(): void {
    this.leadService.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => console.warn('Failed to load categories'),
    });
  }

  loadUsers(): void {
    this.leadService.getUsers().subscribe({
      next: (users) => this.users.set(users),
      error: () => console.warn('Failed to load users'),
    });
  }

  loadStatuses(): void {
    this.leadStatusService.getAll().subscribe({
      next: (response) => {
        this.statuses.set(response.data);
        this.statusOptions = response.data
          .filter((s) => s.isActive)
          .sort((a, b) => a.order - b.order)
          .map((s) => ({
            label: s.name,
            value: s.name,
          }));
      },
      error: () => console.warn('Failed to load statuses'),
    });
  }

  onCancel(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onSave(): void {
    if (!this.lead) return;

    const updates: { categoryId?: string; status?: string } = {};
    let hasChanges = false;

    // Check for status change
    if (this.selectedStatus && this.selectedStatus !== this.lead.status) {
      updates.status = this.selectedStatus;
      hasChanges = true;
    }

    // Check for category change
    if (this.selectedCategoryId !== (this.lead.categoryId || null)) {
      updates.categoryId = this.selectedCategoryId || undefined;
      hasChanges = true;
    }

    // Handle reassignment separately if changed
    const reassignNeeded =
      this.selectedUserId !== (this.lead.assignedToId || null);

    if (!hasChanges && !reassignNeeded) {
      this.messageService.add({
        severity: 'info',
        summary: 'No Changes',
        detail: 'No changes were made',
      });
      return;
    }

    this.saving.set(true);

    // First update lead (status/category)
    if (hasChanges) {
      this.leadService.updateLead(this.lead.id, updates).subscribe({
        next: (response) => {
          if (reassignNeeded && this.selectedUserId) {
            this.reassignLead(response.data);
          } else {
            this.onUpdateSuccess(response.data);
          }
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update lead',
          });
        },
      });
    } else if (reassignNeeded && this.selectedUserId) {
      this.reassignLead(this.lead);
    }
  }

  private reassignLead(lead: ILead): void {
    if (!this.selectedUserId) {
      this.onUpdateSuccess(lead);
      return;
    }

    this.leadService.reassignLead(lead.id, this.selectedUserId).subscribe({
      next: (response) => this.onUpdateSuccess(response.data),
      error: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to reassign lead',
        });
      },
    });
  }

  private onUpdateSuccess(lead: ILead): void {
    this.saving.set(false);
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Lead updated successfully',
    });
    this.leadUpdated.emit(lead);
    this.onCancel();
  }
}
