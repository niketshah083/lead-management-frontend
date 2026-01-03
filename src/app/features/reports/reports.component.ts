import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import {
  ReportService,
  IDashboardMetrics,
  IUserPerformance,
  IReportFilter,
  IBusinessReport,
  ILeadStatusReport,
  AuthService,
} from '../../core/services';
import { LayoutComponent } from '../../shared/components/layout/layout.component';

interface IReportSummary {
  title: string;
  description: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
}

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
    CardModule,
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
        <!-- Report Summary Section -->
        <div class="summary-section">
          <h2 class="section-title">
            <i class="pi pi-chart-line"></i>
            Report Summary
          </h2>
          <div class="summary-grid">
            @for (summary of reportSummaries(); track summary.title) {
            <div class="summary-card" [style.border-left-color]="summary.color">
              <div class="summary-header">
                <div
                  class="summary-icon"
                  [style.background]="summary.color + '20'"
                  [style.color]="summary.color"
                >
                  <i [class]="summary.icon"></i>
                </div>
                <div class="summary-trend" *ngIf="summary.change !== undefined">
                  <i
                    [class]="
                      summary.trend === 'up'
                        ? 'pi pi-arrow-up'
                        : summary.trend === 'down'
                        ? 'pi pi-arrow-down'
                        : 'pi pi-minus'
                    "
                    [style.color]="
                      summary.trend === 'up'
                        ? '#10B981'
                        : summary.trend === 'down'
                        ? '#EF4444'
                        : '#6B7280'
                    "
                  ></i>
                  <span
                    [style.color]="
                      summary.trend === 'up'
                        ? '#10B981'
                        : summary.trend === 'down'
                        ? '#EF4444'
                        : '#6B7280'
                    "
                  >
                    {{ summary.change > 0 ? '+' : ''
                    }}{{ summary.change | number : '1.1-1' }}%
                  </span>
                </div>
              </div>
              <div class="summary-content">
                <span class="summary-value">{{ summary.value }}</span>
                <span class="summary-title">{{ summary.title }}</span>
                <span class="summary-description">{{
                  summary.description
                }}</span>
              </div>
            </div>
            }
          </div>
        </div>

        <!-- Key Insights -->
        <div class="insights-section">
          <h2 class="section-title">
            <i class="pi pi-lightbulb"></i>
            Key Insights
          </h2>
          <div class="insights-grid">
            @for (insight of keyInsights(); track insight) {
            <div class="insight-card">
              <i class="pi pi-info-circle insight-icon"></i>
              <span class="insight-text">{{ insight }}</span>
            </div>
            }
          </div>
        </div>

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

        <!-- Lead Source Chart -->
        @if (sourceChartData()) {
        <div class="chart-card full-width">
          <h3 class="chart-title">Leads by Source</h3>
          <div class="chart-container-wide">
            <p-chart
              type="bar"
              [data]="sourceChartData()"
              [options]="horizontalBarOptions"
            />
          </div>
        </div>
        }

        <!-- Status Breakdown Table -->
        @if (statusReport()) {
        <div class="table-card">
          <h3 class="table-title">Status Breakdown Summary</h3>
          <p-table
            [value]="statusReport()!.statusBreakdown"
            styleClass="modern-table"
            [responsiveLayout]="'scroll'"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Status</th>
                <th>Count</th>
                <th>Percentage</th>
                <th class="hidden-mobile">Revenue</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-item>
              <tr>
                <td>
                  <span
                    class="status-badge"
                    [class]="'status-' + item.status.toLowerCase()"
                  >
                    {{ item.status }}
                  </span>
                </td>
                <td>
                  <span class="metric-value">{{ item.count }}</span>
                </td>
                <td>
                  <div class="percentage-bar">
                    <div
                      class="percentage-fill"
                      [style.width.%]="item.percentage"
                    ></div>
                    <span class="percentage-text"
                      >{{ item.percentage | number : '1.1-1' }}%</span
                    >
                  </div>
                </td>
                <td class="hidden-mobile">
                  <span class="metric-value">₹{{ item.revenue | number }}</span>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
        } }

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

      /* Summary Section Styles */
      .summary-section,
      .insights-section {
        margin-bottom: 1.5rem;
      }

      .section-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 1rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .section-title i {
        color: #3b82f6;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
      }

      .summary-card {
        background: white;
        border-radius: 12px;
        padding: 1.25rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        border-left: 4px solid;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .summary-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .summary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
      }

      .summary-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .summary-icon i {
        font-size: 1.25rem;
      }

      .summary-trend {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .summary-content {
        display: flex;
        flex-direction: column;
      }

      .summary-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
      }

      .summary-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        margin-top: 0.25rem;
      }

      .summary-description {
        font-size: 0.75rem;
        color: #6b7280;
        margin-top: 0.25rem;
      }

      /* Insights Section */
      .insights-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }

      .insight-card {
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border-radius: 12px;
        padding: 1rem 1.25rem;
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        border: 1px solid #bae6fd;
      }

      .insight-icon {
        color: #0284c7;
        font-size: 1.25rem;
        flex-shrink: 0;
        margin-top: 0.125rem;
      }

      .insight-text {
        font-size: 0.875rem;
        color: #0c4a6e;
        line-height: 1.5;
      }

      /* Full width chart */
      .chart-card.full-width {
        grid-column: span 2;
        margin-bottom: 1.5rem;
      }

      .chart-container-wide {
        height: 250px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Status badges */
      .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: capitalize;
      }

      .status-new {
        background: #dbeafe;
        color: #1d4ed8;
      }
      .status-contacted {
        background: #fef3c7;
        color: #d97706;
      }
      .status-qualified {
        background: #e0e7ff;
        color: #4f46e5;
      }
      .status-negotiation {
        background: #fce7f3;
        color: #be185d;
      }
      .status-won {
        background: #d1fae5;
        color: #059669;
      }
      .status-lost {
        background: #fee2e2;
        color: #dc2626;
      }

      /* Percentage bar */
      .percentage-bar {
        position: relative;
        height: 24px;
        background: #f1f5f9;
        border-radius: 12px;
        overflow: hidden;
        min-width: 100px;
      }

      .percentage-fill {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
        border-radius: 12px;
        transition: width 0.3s ease;
      }

      .percentage-text {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 0.75rem;
        font-weight: 600;
        color: #1f2937;
        z-index: 1;
      }

      @media (max-width: 1024px) {
        .summary-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .insights-grid {
          grid-template-columns: 1fr;
        }

        .chart-card.full-width {
          grid-column: span 1;
        }
      }

      @media (max-width: 640px) {
        .summary-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ReportsComponent implements OnInit {
  metrics = signal<IDashboardMetrics | null>(null);
  userPerformance = signal<IUserPerformance[]>([]);
  businessReport = signal<IBusinessReport | null>(null);
  statusReport = signal<ILeadStatusReport | null>(null);
  loading = signal(false);

  dateFrom: Date | null = null;
  dateTo: Date | null = null;

  statusChartData = signal<any>(null);
  categoryChartData = signal<any>(null);
  sourceChartData = signal<any>(null);

  // Computed report summaries
  reportSummaries = computed<IReportSummary[]>(() => {
    const m = this.metrics();
    const b = this.businessReport();
    if (!m) return [];

    return [
      {
        title: 'Total Leads',
        description: 'All leads in selected period',
        value: m.totalLeads,
        icon: 'pi pi-users',
        color: '#3B82F6',
      },
      {
        title: 'Conversion Rate',
        description: 'Leads converted to won',
        value: `${m.conversionRate.toFixed(1)}%`,
        change: b ? b.winRate - 50 : undefined,
        trend: b ? (b.winRate >= 50 ? 'up' : 'down') : undefined,
        icon: 'pi pi-percentage',
        color: '#10B981',
      },
      {
        title: 'Avg Response Time',
        description: 'Minutes to first response',
        value: `${m.avgResponseTime} min`,
        change:
          m.avgResponseTime < 30
            ? -((30 - m.avgResponseTime) / 30) * 100
            : ((m.avgResponseTime - 30) / 30) * 100,
        trend: m.avgResponseTime < 30 ? 'up' : 'down',
        icon: 'pi pi-clock',
        color: '#F59E0B',
      },
      {
        title: 'SLA Compliance',
        description: 'Leads within SLA targets',
        value: `${m.slaCompliance.toFixed(1)}%`,
        change: m.slaCompliance - 80,
        trend: m.slaCompliance >= 80 ? 'up' : 'down',
        icon: 'pi pi-check-circle',
        color: '#8B5CF6',
      },
    ];
  });

  // Computed key insights
  keyInsights = computed<string[]>(() => {
    const m = this.metrics();
    const b = this.businessReport();
    if (!m) return [];

    const insights: string[] = [];

    // Conversion insight
    if (m.conversionRate > 20) {
      insights.push(
        `Strong conversion rate of ${m.conversionRate.toFixed(
          1
        )}% - above industry average of 20%.`
      );
    } else if (m.conversionRate < 10) {
      insights.push(
        `Conversion rate of ${m.conversionRate.toFixed(
          1
        )}% is below target. Consider reviewing lead qualification process.`
      );
    }

    // Response time insight
    if (m.avgResponseTime < 15) {
      insights.push(
        `Excellent response time of ${m.avgResponseTime} minutes. Quick responses improve conversion by up to 21%.`
      );
    } else if (m.avgResponseTime > 60) {
      insights.push(
        `Response time of ${m.avgResponseTime} minutes is high. Aim for under 30 minutes for better engagement.`
      );
    }

    // SLA insight
    if (m.slaCompliance >= 90) {
      insights.push(
        `Outstanding SLA compliance at ${m.slaCompliance.toFixed(
          1
        )}%. Team is meeting service commitments.`
      );
    } else if (m.slaCompliance < 70) {
      insights.push(
        `SLA compliance at ${m.slaCompliance.toFixed(
          1
        )}% needs attention. Review workload distribution.`
      );
    }

    // Category insight
    if (m.leadsByCategory.length > 0) {
      const topCategory = m.leadsByCategory.reduce((a, b) =>
        a.count > b.count ? a : b
      );
      insights.push(
        `${topCategory.categoryName} is the top performing category with ${
          topCategory.count
        } leads (${((topCategory.count / m.totalLeads) * 100).toFixed(
          1
        )}% of total).`
      );
    }

    // Status distribution insight
    const newLeads =
      m.leadsByStatus.find((s) => s.status.toLowerCase() === 'new')?.count || 0;
    if (newLeads > m.totalLeads * 0.4) {
      insights.push(
        `${((newLeads / m.totalLeads) * 100).toFixed(
          0
        )}% of leads are still in 'New' status. Consider faster initial contact.`
      );
    }

    return insights.slice(0, 4); // Limit to 4 insights
  });

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

  horizontalBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { beginAtZero: true, grid: { color: '#f1f5f9' } },
      y: { grid: { display: false } },
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

    // Load dashboard metrics
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

    // Load business report for additional insights
    this.reportService.getBusinessReport(filters).subscribe({
      next: (response) => {
        this.businessReport.set(response.data);
      },
      error: () => {
        console.warn('Failed to load business report');
      },
    });

    // Load status report for breakdown
    this.reportService.getLeadStatusReport(filters).subscribe({
      next: (response) => {
        this.statusReport.set(response.data);
      },
      error: () => {
        console.warn('Failed to load status report');
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

    // Source chart - using actual leadsBySource data
    const sourceColors: Record<string, string> = {
      IndiaMART: '#FF9900',
      TradeIndia: '#008000',
      Gmail: '#EA4335',
      Outlook: '#0078D4',
      WhatsApp: '#25D366',
      Website: '#6366F1',
      Manual: '#9CA3AF',
      'Zoho Mail': '#C8202B',
      IMAP: '#4A90D9',
      Unknown: '#6B7280',
    };

    const sourceData = metrics.leadsBySource || [];
    if (sourceData.length > 0) {
      this.sourceChartData.set({
        labels: sourceData.map((s) => s.source),
        datasets: [
          {
            label: 'Leads by Source',
            data: sourceData.map((s) => s.count),
            backgroundColor: sourceData.map(
              (s) => sourceColors[s.source] || '#3B82F6'
            ),
            borderRadius: 6,
          },
        ],
      });
    } else {
      this.sourceChartData.set(null);
    }
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
