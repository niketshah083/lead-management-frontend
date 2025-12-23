import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule, Table } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
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
    CheckboxModule,
    TooltipModule,
    LayoutComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './lead-status-list.component.html',
  styleUrl: './lead-status-list.component.scss',
})
export class LeadStatusListComponent implements OnInit {
  @ViewChild('dt') table!: Table;

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

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.table?.filterGlobal(target.value, 'contains');
  }

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
