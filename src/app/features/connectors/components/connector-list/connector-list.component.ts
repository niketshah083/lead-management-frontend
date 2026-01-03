import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule, Table } from 'primeng/table';
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
  templateUrl: './connector-list.component.html',
  styleUrl: './connector-list.component.scss',
})
export class ConnectorListComponent implements OnInit {
  @ViewChild('dt') table!: Table;

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

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.table?.filterGlobal(target.value, 'contains');
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
      [ConnectorType.EMAIL]: 'Email',
      [ConnectorType.GMAIL]: 'Gmail',
      [ConnectorType.OUTLOOK]: 'Outlook',
      [ConnectorType.ZOHO_MAIL]: 'Zoho Mail',
      [ConnectorType.IMAP_EMAIL]: 'IMAP Email',
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
      [ConnectorType.EMAIL]: 'info',
      [ConnectorType.GMAIL]: 'danger',
      [ConnectorType.OUTLOOK]: 'info',
      [ConnectorType.ZOHO_MAIL]: 'warn',
      [ConnectorType.IMAP_EMAIL]: 'success',
    };
    return severities[type] || 'secondary';
  }
}
