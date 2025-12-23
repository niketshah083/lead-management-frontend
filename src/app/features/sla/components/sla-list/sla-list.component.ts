import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
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
    FormsModule,
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
    TooltipModule,
    LayoutComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './sla-list.component.html',
  styleUrl: './sla-list.component.scss',
})
export class SlaListComponent implements OnInit {
  @ViewChild('dt') table!: Table;

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
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadPolicies();
    this.loadWarnings();
    this.loadBreaches();
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.table?.filterGlobal(target.value, 'contains');
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
