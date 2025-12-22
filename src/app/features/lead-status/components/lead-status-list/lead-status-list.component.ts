import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LeadStatusService } from '../../../../core/services';
import { ILeadStatus } from '../../../../core/models';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';

@Component({
  selector: 'app-lead-status-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    ColorPickerModule,
    ToastModule,
    ConfirmDialogModule,
    LayoutComponent,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <app-layout>
      <p-toast />
      <p-confirmDialog />
      <div class="page-container">
        <div class="page-header">
          <h1>Lead Status Master</h1>
          <button
            pButton
            label="Add Status"
            icon="pi pi-plus"
            (click)="openDialog()"
          ></button>
        </div>

        <p-table
          [value]="statuses()"
          [loading]="loading()"
          responsiveLayout="scroll"
        >
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="order">
                Order <p-sortIcon field="order"></p-sortIcon>
              </th>
              <th pSortableColumn="name">
                Name <p-sortIcon field="name"></p-sortIcon>
              </th>
              <th>Color</th>
              <th pSortableColumn="isActive">
                Active <p-sortIcon field="isActive"></p-sortIcon>
              </th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-status>
            <tr>
              <td>{{ status.order }}</td>
              <td>{{ status.name }}</td>
              <td>
                <div class="color-badge" [style.backgroundColor]="status.color">
                  {{ status.color }}
                </div>
              </td>
              <td>
                <span
                  [class.active]="status.isActive"
                  [class.inactive]="!status.isActive"
                >
                  {{ status.isActive ? 'Yes' : 'No' }}
                </span>
              </td>
              <td>
                <button
                  pButton
                  icon="pi pi-pencil"
                  [text]="true"
                  [rounded]="true"
                  size="small"
                  (click)="editStatus(status)"
                  pTooltip="Edit"
                ></button>
                <button
                  pButton
                  icon="pi pi-trash"
                  [text]="true"
                  [rounded]="true"
                  size="small"
                  severity="danger"
                  (click)="deleteStatus(status)"
                  pTooltip="Delete"
                ></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Dialog -->
      <p-dialog
        [(visible)]="dialogVisible"
        [header]="editingStatus ? 'Edit Status' : 'Add Status'"
        [modal]="true"
        [style]="{ width: '500px' }"
      >
        <div class="form-grid">
          <div class="form-field">
            <label>Name *</label>
            <input
              pInputText
              [(ngModel)]="formData.name"
              placeholder="Status name"
            />
          </div>
          <div class="form-field">
            <label>Description</label>
            <input
              pInputText
              [(ngModel)]="formData.description"
              placeholder="Description"
            />
          </div>
          <div class="form-field">
            <label>Color</label>
            <p-colorPicker [(ngModel)]="formData.color" [inline]="false" />
          </div>
          <div class="form-field">
            <label>Background Color</label>
            <p-colorPicker [(ngModel)]="formData.bgColor" [inline]="false" />
          </div>
          <div class="form-field">
            <label>Icon</label>
            <input
              pInputText
              [(ngModel)]="formData.icon"
              placeholder="e.g., pi-inbox"
            />
          </div>
          <div class="form-field">
            <label>Order</label>
            <input pInputText type="number" [(ngModel)]="formData.order" />
          </div>
          <div class="form-field checkbox">
            <input
              type="checkbox"
              [(ngModel)]="formData.isActive"
              id="isActive"
            />
            <label for="isActive">Active</label>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button
            pButton
            label="Cancel"
            [text]="true"
            (click)="dialogVisible = false"
          ></button>
          <button
            pButton
            label="Save"
            (click)="saveStatus()"
            [loading]="saving()"
          ></button>
        </ng-template>
      </p-dialog>
    </app-layout>
  `,
  styles: [
    `
      .page-container {
        padding: 1.5rem;
        max-width: 1200px;
        margin: 0 auto;
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .page-header h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 700;
        color: #1f2937;
      }
      .color-badge {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        font-size: 0.85rem;
      }
      .active {
        color: #10b981;
        font-weight: 600;
      }
      .inactive {
        color: #ef4444;
        font-weight: 600;
      }
      .form-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .form-field label {
        font-weight: 600;
        color: #374151;
        font-size: 0.875rem;
      }
      .form-field.checkbox {
        flex-direction: row;
        align-items: center;
      }
      .form-field.checkbox input {
        width: auto;
      }
      :host ::ng-deep .p-colorpicker {
        width: 100%;
      }
    `,
  ],
})
export class LeadStatusListComponent implements OnInit {
  statuses = signal<ILeadStatus[]>([]);
  loading = signal(false);
  saving = signal(false);
  dialogVisible = false;
  editingStatus: ILeadStatus | null = null;
  formData: Partial<ILeadStatus> = {};

  constructor(
    private statusService: LeadStatusService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadStatuses();
  }

  loadStatuses(): void {
    this.loading.set(true);
    this.statusService.getAll().subscribe({
      next: (response) => {
        this.statuses.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load statuses',
        });
      },
    });
  }

  openDialog(): void {
    this.editingStatus = null;
    this.formData = {
      name: '',
      description: '',
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      icon: 'pi-inbox',
      order: 0,
      isActive: true,
    };
    this.dialogVisible = true;
  }

  editStatus(status: ILeadStatus): void {
    this.editingStatus = status;
    this.formData = { ...status };
    this.dialogVisible = true;
  }

  saveStatus(): void {
    if (!this.formData.name) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Name is required',
      });
      return;
    }

    this.saving.set(true);

    // Only send allowed fields to the API
    const payload = {
      name: this.formData.name,
      description: this.formData.description,
      color: this.formData.color,
      bgColor: this.formData.bgColor,
      icon: this.formData.icon,
      order: this.formData.order,
      isActive: this.formData.isActive,
      isInitial: this.formData.isInitial,
      isFinal: this.formData.isFinal,
      statusType: this.formData.statusType,
    };

    const request = this.editingStatus
      ? this.statusService.update(this.editingStatus.id, payload)
      : this.statusService.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible = false;
        this.loadStatuses();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: this.editingStatus ? 'Status updated' : 'Status created',
        });
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save status',
        });
      },
    });
  }

  deleteStatus(status: ILeadStatus): void {
    this.confirmationService.confirm({
      message: `Delete status "${status.name}"?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.statusService.delete(status.id).subscribe({
          next: () => {
            this.loadStatuses();
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Status deleted',
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete status',
            });
          },
        });
      },
    });
  }
}
