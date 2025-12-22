import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import {
  ReportService,
  IDashboardMetrics,
  IUserPerformance,
  IReportFilter,
  AuthService,
} from '../../core/services';
import { LayoutComponent } from '../../shared/components/layout/layout.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DatePickerModule,
    TableModule,
    ChartModule,
    ToastModule,
    LayoutComponent,
  ],
  providers: [MessageService],
  template: `
    <app-layout>
      <p-toast />
      <div class="page-container">
        <!-- Header -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Reports & Analytics</h1>
            <p class="page-subtitle">Track performance and insights</p>
          </div>
          <div class="header-actions">
            <button
              pButton
              label="Export CSV"
              icon="pi pi-file"
              severity="secondary"
              class="export-btn"
              (click)="exportCsv()"
            ></button>
            <button
              pButton
              label="Export PDF"
              icon="pi pi-file-pdf"
              severity="secondary"
              class="export-btn"
              (click)="exportPdf()"
            ></button>
          </div>
        </div>

        <!-- Filters -->
        <div class="filter-card">
          <div class="filter-row">
            <div class="filter-item">
              <label class="filter-label">Date From</label>
              <p-datepicker
                [(ngModel)]="dateFrom"
                dateFormat="yy-mm-dd"
                placeholder="Select date"
                styleClass="filter-input"
              />
            </div>
            <div class="filter-item">
              <label class="filter-label">Date To</label>
              <p-datepicker
                [(ngModel)]="dateTo"
                dateFormat="yy-mm-dd"
                placeholder="Select date"
                styleClass="filter-input"
              />
            </div>
            <div class="filter-item filter-action">
              <button
                pButton
                label="Apply Filters"
                icon="pi pi-filter"
                (click)="loadData()"
              ></button>
            </div>
          </div>
        </div>

        <!-- Stats Cards -->
        @if (metrics()) {
        <div class="stats-grid">
          <div class="stat-card stat-blue">
            <div class="stat-icon"><i class="pi pi-users"></i></div>
            <div class="stat-content">
              <span class="stat-value">{{ metrics()!.totalLeads }}</span>
              <span class="stat-label">Total Leads</span>
            </div>
          </div>
          <div class="stat-card stat-green">
            <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
            <div class="stat-content">
              <span class="stat-value">{{ metrics()!.convertedLeads }}</span>
              <span class="stat-label">Converted</span>
            </div>
          </div>
          <div class="stat-card stat-purple">
            <div class="stat-icon"><i class="pi pi-percentage"></i></div>
            <div class="stat-content">
              <span class="stat-value"
                >{{ metrics()!.conversionRate | number : '1.1-1' }}%</span
              >
              <span class="stat-label">Conversion Rate</span>
            </div>
          </div>
          <div class="stat-card stat-orange">
            <div class="stat-icon"><i class="pi pi-clock"></i></div>
            <div class="stat-content">
              <span class="stat-value"
                >{{ metrics()!.slaCompliance | number : '1.1-1' }}%</span
              >
              <span class="stat-label">SLA Compliance</span>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="charts-grid">
          <div class="chart-card">
            <h3 class="chart-title">Leads by Status</h3>
            <div class="chart-container">
              <p-chart
                type="doughnut"
                [data]="statusChartData()"
                [options]="doughnutOptions"
              />
            </div>
          </div>
          <div class="chart-card">
            <h3 class="chart-title">Leads by Category</h3>
            <div class="chart-container">
              <p-chart
                type="bar"
                [data]="categoryChartData()"
                [options]="barOptions"
              />
            </div>
          </div>
        </div>
        }

        <!-- User Performance Table (Admin/Manager only) -->
        @if (authService.isAdmin() || authService.isManager()) {
        <div class="table-card">
          <h3 class="table-title">User Performance</h3>
          <p-table
            [value]="userPerformance()"
            [loading]="loading()"
            styleClass="modern-table"
            [responsiveLayout]="'scroll'"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>User</th>
                <th>Total Leads</th>
                <th>Converted</th>
                <th class="hidden-mobile">Conversion Rate</th>
                <th class="hidden-mobile">Avg Response (min)</th>
                <th>SLA Compliance</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-user>
              <tr>
                <td>
                  <span class="user-name">{{ user.userName }}</span>
                </td>
                <td>
                  <span class="metric-value">{{ user.totalLeads }}</span>
                </td>
                <td>
                  <span class="metric-value success">{{
                    user.convertedLeads
                  }}</span>
                </td>
                <td class="hidden-mobile">
                  <span class="metric-value"
                    >{{ user.conversionRate | number : '1.1-1' }}%</span
                  >
                </td>
                <td class="hidden-mobile">
                  <span class="metric-value">{{
                    user.avgResponseTime | number : '1.0-0'
                  }}</span>
                </td>
                <td>
                  <div
                    class="sla-badge"
                    [class.good]="user.slaCompliance >= 80"
                    [class.warning]="
                      user.slaCompliance >= 50 && user.slaCompliance < 80
                    "
                    [class.danger]="user.slaCompliance < 50"
                  >
                    {{ user.slaCompliance | number : '1.1-1' }}%
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="6">
                  <div class="empty-state">
                    <i class="pi pi-chart-bar empty-icon"></i>
                    <p class="empty-text">No performance data available</p>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
        }
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
        align-items: flex-start;
        margin-bottom: 1.5rem;
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

      .header-actions {
        display: flex;
        gap: 0.75rem;
      }

      .export-btn {
        font-size: 0.875rem;
      }

      .filter-card {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .filter-row {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        align-items: flex-end;
      }

      .filter-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .filter-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
      }

      :host ::ng-deep .filter-input {
        width: 100%;
      }

      .filter-action {
        margin-top: auto;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .stat-card {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .stat-icon i {
        font-size: 1.5rem;
        color: white;
      }

      .stat-blue .stat-icon {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      }
      .stat-green .stat-icon {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      }
      .stat-purple .stat-icon {
        background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
      }
      .stat-orange .stat-icon {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      }

      .stat-content {
        display: flex;
        flex-direction: column;
      }

      .stat-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1f2937;
      }

      .stat-label {
        font-size: 0.875rem;
        color: #6b7280;
      }

      .charts-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .chart-card {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .chart-title {
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 1rem 0;
      }

      .chart-container {
        height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .table-card {
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .table-title {
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
        padding: 1.5rem 1.5rem 0;
      }

      :host ::ng-deep .modern-table {
        .p-datatable-thead > tr > th {
          background: #f8fafc;
          color: #64748b;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 1rem 1.5rem;
          border: none;
          border-bottom: 1px solid #e2e8f0;
        }

        .p-datatable-tbody > tr > td {
          padding: 1rem 1.5rem;
          border: none;
          border-bottom: 1px solid #f1f5f9;
        }

        .p-datatable-tbody > tr:hover {
          background: #f8fafc;
        }
      }

      .user-name {
        font-weight: 600;
        color: #1f2937;
      }

      .metric-value {
        color: #374151;
        font-weight: 500;
      }

      .metric-value.success {
        color: #10b981;
      }

      .sla-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .sla-badge.good {
        background: #d1fae5;
        color: #059669;
      }

      .sla-badge.warning {
        background: #fef3c7;
        color: #d97706;
      }

      .sla-badge.danger {
        background: #fee2e2;
        color: #dc2626;
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

      .empty-text {
        font-size: 1.125rem;
        font-weight: 600;
        color: #374151;
        margin: 0;
      }

      @media (max-width: 1024px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .charts-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 640px) {
        .page-container {
          padding: 1rem;
        }

        .page-title {
          font-size: 1.5rem;
        }

        .header-actions {
          width: 100%;
          flex-direction: column;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }

        .hidden-mobile {
          display: none !important;
        }

        .filter-row {
          flex-direction: column;
        }

        .filter-item {
          width: 100%;
        }
      }
    `,
  ],
})
export class ReportsComponent implements OnInit {
  metrics = signal<IDashboardMetrics | null>(null);
  userPerformance = signal<IUserPerformance[]>([]);
  loading = signal(false);

  dateFrom: Date | null = null;
  dateTo: Date | null = null;

  statusChartData = signal<any>(null);
  categoryChartData = signal<any>(null);

  doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 20, usePointStyle: true },
      },
    },
  };

  barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
      x: { grid: { display: false } },
    },
  };

  constructor(
    private reportService: ReportService,
    private messageService: MessageService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    const filters = this.getFilters();

    this.reportService.getDashboardMetrics(filters).subscribe({
      next: (response) => {
        this.metrics.set(response.data);
        this.updateCharts(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load metrics',
        });
      },
    });

    // Only load user performance for Admin/Manager
    if (this.authService.isAdmin() || this.authService.isManager()) {
      this.reportService.getExecutivePerformance(filters).subscribe({
        next: (response: any) => {
          this.userPerformance.set(response.data);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load user performance',
          });
        },
      });
    }
  }

  private updateCharts(metrics: IDashboardMetrics): void {
    this.statusChartData.set({
      labels: metrics.leadsByStatus.map((s) => s.status),
      datasets: [
        {
          data: metrics.leadsByStatus.map((s) => s.count),
          backgroundColor: [
            '#3B82F6',
            '#F59E0B',
            '#10B981',
            '#EF4444',
            '#6B7280',
            '#8B5CF6',
          ],
          borderWidth: 0,
        },
      ],
    });

    this.categoryChartData.set({
      labels: metrics.leadsByCategory.map((c) => c.categoryName),
      datasets: [
        {
          label: 'Leads',
          data: metrics.leadsByCategory.map((c) => c.count),
          backgroundColor: '#25d366',
          borderRadius: 8,
        },
      ],
    });
  }

  private getFilters(): IReportFilter {
    const filters: IReportFilter = {};
    if (this.dateFrom) {
      filters.dateFrom = this.dateFrom.toISOString().split('T')[0];
    }
    if (this.dateTo) {
      filters.dateTo = this.dateTo.toISOString().split('T')[0];
    }
    return filters;
  }

  exportCsv(): void {
    this.reportService.exportCsv(this.getFilters()).subscribe({
      next: (blob) => this.downloadFile(blob, 'leads-report.csv'),
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to export CSV',
        });
      },
    });
  }

  exportPdf(): void {
    this.reportService.exportPdf(this.getFilters()).subscribe({
      next: (blob) => this.downloadFile(blob, 'leads-report.pdf'),
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to export PDF',
        });
      },
    });
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
