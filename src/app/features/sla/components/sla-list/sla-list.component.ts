import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';
import {
  SlaService,
  ISlaPolicy,
  ICreateSlaPolicy,
} from '../../../../core/services/sla.service';
import { AuthService } from '../../../../core/services';

@Component({
  selector: 'app-sla-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    FormsModule,
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
            <h1 class="page-title">SLA Policies</h1>
            <p class="page-subtitle">Manage service level agreements</p>
          </div>
          @if (authService.isAdmin()) {
          <button
            pButton
            label="Add Policy"
            icon="pi pi-plus"
            class="add-btn"
            (click)="openCreateDialog()"
          ></button>
          }
        </div>

        <div class="stats-row">
          <div class="stat-card warning">
            <div class="stat-icon">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ warningLeads().length }}</span>
              <span class="stat-label">Approaching Breach</span>
            </div>
          </div>
          <div class="stat-card danger">
            <div class="stat-icon"><i class="pi pi-times-circle"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ breachedLeads().length }}</span>
              <span class="stat-label">Breached</span>
            </div>
          </div>
        </div>

        <div class="table-card">
          <p-table
            [value]="policies()"
            [loading]="loading()"
            [paginator]="true"
            [rows]="10"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Name</th>
                <th>First Response</th>
                <th>Follow Up</th>
                <th>Resolution</th>
                <th>Warning %</th>
                <th>Default</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-policy>
              <tr>
                <td>
                  <strong>{{ policy.name }}</strong>
                </td>
                <td>{{ formatMinutes(policy.firstResponseMinutes) }}</td>
                <td>{{ formatMinutes(policy.followUpMinutes) }}</td>
                <td>{{ formatMinutes(policy.resolutionMinutes) }}</td>
                <td>{{ policy.warningThresholdPercent }}%</td>
                <td>
                  @if (policy.isDefault) {
                  <p-tag value="Default" severity="info" />
                  } @else {
                  <span class="text-muted">-</span>
                  }
                </td>
                <td>
                  <p-tag
                    [value]="policy.isActive ? 'Active' : 'Inactive'"
                    [severity]="policy.isActive ? 'success' : 'danger'"
                  />
                </td>
                <td>
                  @if (authService.isAdmin()) {
                  <button
                    pButton
                    icon="pi pi-pencil"
                    [text]="true"
                    [rounded]="true"
                    severity="info"
                    (click)="openEditDialog(policy)"
                  ></button>
                  }
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="8">
                  <div class="empty-state">
                    <i class="pi pi-clock"></i>
                    <h3>No SLA policies found</h3>
                    <p>Create your first SLA policy to get started</p>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>

      <!-- Create/Edit Dialog -->
      <p-dialog
        [(visible)]="dialogVisible"
        [header]="isEditing ? 'Edit Policy' : 'Create Policy'"
        [modal]="true"
        [style]="{ width: '500px' }"
      >
        <div class="form-grid">
          <div class="form-field">
            <label>Name *</label>
            <input pInputText [(ngModel)]="formData.name" class="w-full" />
          </div>
          <div class="form-field">
            <label>First Response Time (minutes) *</label>
            <p-inputNumber
              [(ngModel)]="formData.firstResponseMinutes"
              [min]="1"
              class="w-full"
            />
            <small class="hint"
              >Time allowed for first response to a lead</small
            >
          </div>
          <div class="form-field">
            <label>Follow Up Time (minutes) *</label>
            <p-inputNumber
              [(ngModel)]="formData.followUpMinutes"
              [min]="1"
              class="w-full"
            />
            <small class="hint">Time allowed between follow-ups</small>
          </div>
          <div class="form-field">
            <label>Resolution Time (minutes) *</label>
            <p-inputNumber
              [(ngModel)]="formData.resolutionMinutes"
              [min]="1"
              class="w-full"
            />
            <small class="hint">Total time allowed to resolve a lead</small>
          </div>
          <div class="form-field">
            <label>Warning Threshold (%)</label>
            <p-inputNumber
              [(ngModel)]="formData.warningThresholdPercent"
              [min]="1"
              [max]="100"
              class="w-full"
            />
            <small class="hint"
              >Alert when this percentage of time has elapsed</small
            >
          </div>
          <div class="form-field-checkbox">
            <p-checkbox
              [(ngModel)]="formData.isDefault"
              [binary]="true"
              inputId="isDefault"
            />
            <label for="isDefault">Set as default policy</label>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button
            pButton
            label="Cancel"
            severity="secondary"
            (click)="dialogVisible = false"
          ></button>
          <button
            pButton
            [label]="isEditing ? 'Update' : 'Create'"
            (click)="savePolicy()"
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
        max-width: 1400px;
        margin: 0 auto;
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .page-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
      }
      .page-subtitle {
        color: #6b7280;
        margin: 0.25rem 0 0;
      }
      .add-btn {
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        border: none;
      }
      .stats-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .stat-card {
        background: white;
        border-radius: 12px;
        padding: 1.25rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
      .stat-card.warning .stat-icon {
        background: #fef3c7;
        color: #d97706;
      }
      .stat-card.danger .stat-icon {
        background: #fee2e2;
        color: #dc2626;
      }
      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
      }
      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
      }
      .stat-label {
        font-size: 0.875rem;
        color: #6b7280;
      }
      .stat-info {
        display: flex;
        flex-direction: column;
      }
      .table-card {
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      .text-muted {
        color: #9ca3af;
      }
      .empty-state {
        text-align: center;
        padding: 3rem;
        color: #6b7280;
      }
      .empty-state i {
        font-size: 3rem;
        color: #d1d5db;
        margin-bottom: 1rem;
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
        font-weight: 500;
        color: #374151;
      }
      .form-field-checkbox {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .form-field-checkbox label {
        font-weight: 500;
        color: #374151;
        cursor: pointer;
      }
      .hint {
        color: #9ca3af;
        font-size: 0.75rem;
      }
      .w-full {
        width: 100%;
      }
    `,
  ],
})
export class SlaListComponent implements OnInit {
  policies = signal<ISlaPolicy[]>([]);
  warningLeads = signal<any[]>([]);
  breachedLeads = signal<any[]>([]);
  loading = signal(false);
  saving = signal(false);
  dialogVisible = false;
  isEditing = false;
  editingId = '';

  formData: ICreateSlaPolicy = {
    name: '',
    firstResponseMinutes: 60,
    followUpMinutes: 120,
    resolutionMinutes: 480,
    warningThresholdPercent: 80,
    isDefault: false,
  };

  constructor(
    private slaService: SlaService,
    public authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadPolicies();
    this.loadWarnings();
    this.loadBreaches();
  }

  loadPolicies(): void {
    this.loading.set(true);
    this.slaService.getPolicies().subscribe({
      next: (res) => {
        this.policies.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load policies',
        });
      },
    });
  }

  loadWarnings(): void {
    this.slaService.getLeadsApproachingBreach().subscribe({
      next: (res) => this.warningLeads.set(res.data || []),
    });
  }

  loadBreaches(): void {
    this.slaService.getBreachedLeads().subscribe({
      next: (res) => this.breachedLeads.set(res.data || []),
    });
  }

  openCreateDialog(): void {
    this.isEditing = false;
    this.formData = {
      name: '',
      firstResponseMinutes: 60,
      followUpMinutes: 120,
      resolutionMinutes: 480,
      warningThresholdPercent: 80,
      isDefault: false,
    };
    this.dialogVisible = true;
  }

  openEditDialog(policy: ISlaPolicy): void {
    this.isEditing = true;
    this.editingId = policy.id;
    this.formData = {
      name: policy.name,
      firstResponseMinutes: policy.firstResponseMinutes,
      followUpMinutes: policy.followUpMinutes,
      resolutionMinutes: policy.resolutionMinutes,
      warningThresholdPercent: policy.warningThresholdPercent,
      isDefault: policy.isDefault,
    };
    this.dialogVisible = true;
  }

  savePolicy(): void {
    if (!this.formData.name) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Name is required',
      });
      return;
    }
    this.saving.set(true);
    const obs = this.isEditing
      ? this.slaService.updatePolicy(this.editingId, this.formData)
      : this.slaService.createPolicy(this.formData);

    obs.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: this.isEditing ? 'Policy updated' : 'Policy created',
        });
        this.dialogVisible = false;
        this.saving.set(false);
        this.loadPolicies();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save policy',
        });
      },
    });
  }

  formatMinutes(minutes: number): string {
    if (!minutes && minutes !== 0) return '-';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
}
