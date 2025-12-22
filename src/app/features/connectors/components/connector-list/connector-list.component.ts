import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';
import { ConnectorService, AuthService } from '../../../../core/services';
import {
  IConnector,
  IConnectorType,
  ConnectorType,
  ConnectorStatus,
  ICreateConnector,
} from '../../../../core/models';

@Component({
  selector: 'app-connector-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TooltipModule,
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
            <h1 class="page-title">Connector Master</h1>
            <p class="page-subtitle">
              Manage integrations with external platforms and webhooks
            </p>
          </div>
          @if (authService.isAdmin() || authService.isManager()) {
          <button
            pButton
            label="Add Connector"
            icon="pi pi-plus"
            class="add-btn"
            (click)="openCreateDialog()"
          ></button>
          }
        </div>

        <!-- Connector Type Cards -->
        <div class="connector-types-grid">
          @if (connectorService.connectorTypes().length === 0) {
          <div class="loading-types">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Loading connector types...</span>
          </div>
          } @else { @for (type of connectorService.connectorTypes(); track
          type.type) {
          <div
            class="connector-type-card"
            [class.has-connector]="hasConnectorOfType(type.type)"
            (click)="selectConnectorType(type)"
          >
            <div class="type-icon" [attr.data-type]="type.type">
              <i class="pi" [ngClass]="type.icon"></i>
            </div>
            <div class="type-info">
              <h3>{{ type.name }}</h3>
              <p>{{ type.description }}</p>
            </div>
            <div class="type-status">
              @if (hasConnectorOfType(type.type)) {
              <span class="status-badge connected">
                <i class="pi pi-check-circle"></i> Connected
              </span>
              } @else {
              <span class="status-badge not-connected">
                <i class="pi pi-circle"></i> Not Connected
              </span>
              }
            </div>
          </div>
          } }
        </div>

        <!-- Active Connectors Table -->
        <div class="section-header">
          <h2 class="section-title">
            <i class="pi pi-list"></i> Active Connectors
          </h2>
        </div>

        <div class="table-card">
          <p-table
            [value]="connectorService.connectors()"
            [loading]="connectorService.loading()"
            [paginator]="true"
            [rows]="10"
            styleClass="modern-table"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Connector</th>
                <th>Type</th>
                <th>Status</th>
                <th>Last Sync</th>
                <th>Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-connector>
              <tr>
                <td>
                  <div class="connector-name">
                    <div
                      class="connector-icon"
                      [attr.data-type]="connector.type"
                    >
                      <i
                        class="pi"
                        [ngClass]="
                          connectorService.getConnectorIcon(connector.type)
                        "
                      ></i>
                    </div>
                    <div class="connector-details">
                      <span class="name">{{ connector.name }}</span>
                      <span class="description">{{
                        connector.description || 'No description'
                      }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <p-tag
                    [value]="getTypeName(connector.type)"
                    [severity]="getTypeSeverity(connector.type)"
                  />
                </td>
                <td>
                  <div
                    class="status-indicator"
                    [class.connected]="connector.status === 'connected'"
                    [class.error]="connector.status === 'error'"
                    [class.disconnected]="connector.status === 'disconnected'"
                  >
                    <span class="status-dot"></span>
                    <span>{{ connector.status | titlecase }}</span>
                  </div>
                </td>
                <td>
                  @if (connector.lastSyncAt) {
                  <span class="last-sync">{{
                    connector.lastSyncAt | date : 'short'
                  }}</span>
                  } @else {
                  <span class="no-sync">Never</span>
                  }
                </td>
                <td>
                  <div class="action-buttons">
                    <button
                      pButton
                      icon="pi pi-cog"
                      [rounded]="true"
                      [text]="true"
                      pTooltip="Configure"
                      (click)="configureConnector(connector)"
                    ></button>
                    <button
                      pButton
                      icon="pi pi-refresh"
                      [rounded]="true"
                      [text]="true"
                      severity="info"
                      pTooltip="Test Connection"
                      (click)="testConnection(connector)"
                    ></button>
                    @if (authService.isAdmin()) {
                    <button
                      pButton
                      icon="pi pi-trash"
                      [rounded]="true"
                      [text]="true"
                      severity="danger"
                      pTooltip="Delete"
                      (click)="confirmDelete(connector)"
                    ></button>
                    }
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="5" class="empty-state">
                  <i class="pi pi-plug empty-icon"></i>
                  <h3>No connectors configured</h3>
                  <p>
                    Add a connector to start receiving leads from external
                    platforms
                  </p>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>

      <!-- Create Connector Dialog -->
      <p-dialog
        [(visible)]="createDialogVisible"
        header="Add New Connector"
        [modal]="true"
        [style]="{ width: '500px' }"
      >
        <div class="form-grid">
          <div class="form-field">
            <label>Connector Type *</label>
            <p-select
              [options]="connectorService.connectorTypes()"
              [(ngModel)]="selectedType"
              optionLabel="name"
              placeholder="Select type"
              styleClass="w-full"
            >
              <ng-template let-type pTemplate="item">
                <div class="type-option">
                  <i class="pi" [ngClass]="type.icon"></i>
                  <span>{{ type.name }}</span>
                </div>
              </ng-template>
            </p-select>
          </div>
          <div class="form-field">
            <label>Name *</label>
            <input
              pInputText
              [(ngModel)]="newConnector.name"
              placeholder="e.g., Facebook Lead Ads"
              class="w-full"
            />
          </div>
          <div class="form-field">
            <label>Description</label>
            <input
              pInputText
              [(ngModel)]="newConnector.description"
              placeholder="Optional description"
              class="w-full"
            />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button
            pButton
            label="Cancel"
            severity="secondary"
            (click)="createDialogVisible = false"
          ></button>
          <button
            pButton
            label="Create"
            icon="pi pi-check"
            (click)="createConnector()"
            [loading]="creating()"
            [disabled]="!selectedType || !newConnector.name"
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
        align-items: flex-start;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
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
      }

      .add-btn {
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        border: none;
      }

      /* Connector Type Cards */
      .connector-types-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .connector-type-card {
        background: white;
        border-radius: 12px;
        padding: 1.25rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        cursor: pointer;
        transition: all 0.2s;
        border: 2px solid transparent;
      }

      .connector-type-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
        border-color: #25d366;
      }

      .connector-type-card.has-connector {
        border-color: #10b981;
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      }

      .type-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .type-icon i {
        font-size: 1.5rem;
        color: white;
      }

      .type-icon[data-type='webhook'] {
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      }
      .type-icon[data-type='meta'] {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      }
      .type-icon[data-type='google'] {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      }
      .type-icon[data-type='youtube'] {
        background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
      }
      .type-icon[data-type='linkedin'] {
        background: linear-gradient(135deg, #0077b5 0%, #005885 100%);
      }
      .type-icon[data-type='whatsapp'] {
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
      }
      .type-icon[data-type='indiamart'] {
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
      }
      .type-icon[data-type='tradeindia'] {
        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      }

      .type-info {
        flex: 1;
      }

      .type-info h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
      }

      .type-info p {
        margin: 0;
        font-size: 0.75rem;
        color: #6b7280;
        line-height: 1.4;
      }

      .type-status {
        flex-shrink: 0;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.7rem;
        font-weight: 500;
      }

      .status-badge.connected {
        background: #dcfce7;
        color: #166534;
      }

      .status-badge.not-connected {
        background: #f3f4f6;
        color: #6b7280;
      }

      /* Section Header */
      .section-header {
        margin: 2rem 0 1rem 0;
      }

      .section-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .section-title i {
        color: #25d366;
      }

      /* Table */
      .table-card {
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }

      :host ::ng-deep .modern-table .p-datatable-thead > tr > th {
        background: #f8fafc;
        color: #64748b;
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;
        padding: 1rem 1.5rem;
        border: none;
        border-bottom: 1px solid #e2e8f0;
      }

      :host ::ng-deep .modern-table .p-datatable-tbody > tr > td {
        padding: 1rem 1.5rem;
        border: none;
        border-bottom: 1px solid #f1f5f9;
      }

      :host ::ng-deep .modern-table .p-datatable-tbody > tr:hover {
        background: #f8fafc;
      }

      .connector-name {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .connector-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .connector-icon i {
        font-size: 1.25rem;
        color: white;
      }

      .connector-icon[data-type='webhook'] {
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      }
      .connector-icon[data-type='meta'] {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      }
      .connector-icon[data-type='google'] {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      }
      .connector-icon[data-type='youtube'] {
        background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
      }
      .connector-icon[data-type='linkedin'] {
        background: linear-gradient(135deg, #0077b5 0%, #005885 100%);
      }
      .connector-icon[data-type='whatsapp'] {
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
      }
      .connector-icon[data-type='indiamart'] {
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
      }
      .connector-icon[data-type='tradeindia'] {
        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      }

      .connector-details {
        display: flex;
        flex-direction: column;
      }

      .connector-details .name {
        font-weight: 600;
        color: #1f2937;
      }

      .connector-details .description {
        font-size: 0.75rem;
        color: #6b7280;
      }

      .status-indicator {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .status-indicator.connected {
        background: #dcfce7;
        color: #166534;
      }

      .status-indicator.error {
        background: #fee2e2;
        color: #991b1b;
      }

      .status-indicator.disconnected {
        background: #f3f4f6;
        color: #6b7280;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
      }

      .last-sync {
        font-size: 0.875rem;
        color: #6b7280;
      }

      .no-sync {
        font-size: 0.875rem;
        color: #9ca3af;
        font-style: italic;
      }

      .action-buttons {
        display: flex;
        gap: 0.25rem;
      }

      .empty-state {
        text-align: center;
        padding: 3rem;
      }

      .empty-icon {
        font-size: 3rem;
        color: #d1d5db;
        margin-bottom: 1rem;
      }

      .empty-state h3 {
        margin: 0 0 0.5rem 0;
        color: #6b7280;
      }

      .empty-state p {
        margin: 0;
        color: #9ca3af;
      }

      /* Form */
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

      .w-full {
        width: 100%;
      }

      .type-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      @media (max-width: 768px) {
        .page-container {
          padding: 1rem;
        }

        .connector-types-grid {
          grid-template-columns: 1fr;
        }
      }

      .loading-types {
        grid-column: 1 / -1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 2rem;
        color: #6b7280;
      }

      .loading-types i {
        font-size: 1.25rem;
        color: #25d366;
      }
    `,
  ],
})
export class ConnectorListComponent implements OnInit {
  createDialogVisible = false;
  creating = signal(false);
  selectedType: IConnectorType | null = null;
  newConnector: Partial<ICreateConnector> = {};

  constructor(
    public connectorService: ConnectorService,
    public authService: AuthService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.connectorService.loadConnectors().subscribe({
      error: (err) => {
        console.error('Failed to load connectors:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load connectors',
        });
      },
    });
    this.connectorService.loadConnectorTypes().subscribe({
      error: (err) => {
        console.error('Failed to load connector types:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load connector types',
        });
      },
    });
  }

  hasConnectorOfType(type: ConnectorType): boolean {
    return this.connectorService
      .connectors()
      .some((c) => c.type === type && c.status === ConnectorStatus.CONNECTED);
  }

  selectConnectorType(type: IConnectorType): void {
    const existing = this.connectorService
      .connectors()
      .find((c) => c.type === type.type);
    if (existing) {
      this.configureConnector(existing);
    } else {
      this.selectedType = type;
      this.newConnector = { name: type.name };
      this.createDialogVisible = true;
    }
  }

  openCreateDialog(): void {
    this.selectedType = null;
    this.newConnector = {};
    this.createDialogVisible = true;
  }

  createConnector(): void {
    if (!this.selectedType || !this.newConnector.name) return;

    this.creating.set(true);
    const dto: ICreateConnector = {
      name: this.newConnector.name,
      type: this.selectedType.type,
      description: this.newConnector.description,
    };

    this.connectorService.createConnector(dto).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Connector created successfully',
        });
        this.createDialogVisible = false;
        this.creating.set(false);
        this.configureConnector(response.data);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to create connector',
        });
        this.creating.set(false);
      },
    });
  }

  configureConnector(connector: IConnector): void {
    this.router.navigate(['/connectors', connector.id]);
  }

  testConnection(connector: IConnector): void {
    this.connectorService.testConnection(connector.id).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: response.data.success ? 'success' : 'warn',
          summary: response.data.success ? 'Connected' : 'Connection Issue',
          detail: response.data.message,
        });
        this.loadData();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to test connection',
        });
      },
    });
  }

  confirmDelete(connector: IConnector): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${connector.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteConnector(connector),
    });
  }

  deleteConnector(connector: IConnector): void {
    this.connectorService.deleteConnector(connector.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Connector deleted successfully',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete connector',
        });
      },
    });
  }

  getTypeName(type: ConnectorType): string {
    const names: Record<ConnectorType, string> = {
      [ConnectorType.WEBHOOK]: 'Webhook',
      [ConnectorType.META]: 'Meta',
      [ConnectorType.GOOGLE]: 'Google',
      [ConnectorType.YOUTUBE]: 'YouTube',
      [ConnectorType.LINKEDIN]: 'LinkedIn',
      [ConnectorType.WHATSAPP]: 'WhatsApp',
      [ConnectorType.INDIAMART]: 'IndiaMART',
      [ConnectorType.TRADEINDIA]: 'TradeIndia',
    };
    return names[type] || type;
  }

  getTypeSeverity(
    type: ConnectorType
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severities: Record<
      ConnectorType,
      'success' | 'info' | 'warn' | 'danger' | 'secondary'
    > = {
      [ConnectorType.WEBHOOK]: 'info',
      [ConnectorType.META]: 'info',
      [ConnectorType.GOOGLE]: 'danger',
      [ConnectorType.YOUTUBE]: 'danger',
      [ConnectorType.LINKEDIN]: 'info',
      [ConnectorType.WHATSAPP]: 'success',
      [ConnectorType.INDIAMART]: 'warn',
      [ConnectorType.TRADEINDIA]: 'warn',
    };
    return severities[type] || 'secondary';
  }
}
