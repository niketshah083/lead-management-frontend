import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import {
  AuthService,
  ReportService,
  UserService,
  IDashboardMetrics,
  IBusinessReport,
  IExecutivePerformance,
  IReportFilter,
  IPeriodReport,
  ILeadStatusReport,
} from '../../core/services';
import { IUser } from '../../core/models';
import { LayoutComponent } from '../../shared/components/layout/layout.component';

@Component({
  selector: 'app-compact-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CardModule,
    ButtonModule,
    ToastModule,
    TableModule,
    TagModule,
    ProgressBarModule,
    InputTextModule,
    DatePickerModule,
    LayoutComponent,
  ],
  providers: [MessageService],
  template: `
    <app-layout>
      <p-toast />
      <div class="compact-dashboard">
        <!-- Compact Header -->
        <div class="compact-header">
          <div class="header-info">
            <h1>{{ authService.currentUser()?.name }}'s Dashboard</h1>
            <div class="quick-filters">
              <p-datepicker
                [(ngModel)]="dateFrom"
                (onSelect)="onDateChange()"
                [showIcon]="true"
                dateFormat="mm/dd/yy"
                placeholder="mm/dd/yyyy"
                [style]="{ width: '140px' }"
                inputStyleClass="compact-date-input"
              />
              <p-datepicker
                [(ngModel)]="dateTo"
                (onSelect)="onDateChange()"
                [showIcon]="true"
                dateFormat="mm/dd/yy"
                placeholder="mm/dd/yyyy"
                [style]="{ width: '140px' }"
                inputStyleClass="compact-date-input"
              />
              <button
                pButton
                icon="pi pi-refresh"
                (click)="loadAllData()"
                [loading]="loading()"
                class="refresh-btn"
              ></button>
            </div>
          </div>
        </div>

        @if (businessReport()) {
        <!-- KPI Cards Grid -->
        <div class="kpi-grid">
          <div class="kpi-card total-leads">
            <div class="kpi-icon">
              <i class="pi pi-users"></i>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ businessReport()!.totalLeads }}</div>
              <div class="kpi-label">Total Leads</div>
              <div class="kpi-trend">
                <i class="pi pi-arrow-up"></i>
                <span>All Time</span>
              </div>
            </div>
          </div>

          <div class="kpi-card won-deals">
            <div class="kpi-icon">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ businessReport()!.wonLeads }}</div>
              <div class="kpi-label">Won Deals</div>
              <div class="kpi-trend">
                <i class="pi pi-percentage"></i>
                <span
                  >{{ businessReport()!.winRate | number : '1.1-1' }}%
                  Rate</span
                >
              </div>
            </div>
          </div>

          <div class="kpi-card lost-deals">
            <div class="kpi-icon">
              <i class="pi pi-times-circle"></i>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ businessReport()!.lostLeads }}</div>
              <div class="kpi-label">Lost Deals</div>
              <div class="kpi-trend">
                <i class="pi pi-percentage"></i>
                <span
                  >{{ businessReport()!.lossRate | number : '1.1-1' }}%
                  Rate</span
                >
              </div>
            </div>
          </div>

          <div class="kpi-card revenue">
            <div class="kpi-icon">
              <i class="pi pi-indian-rupee"></i>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">
                ₹{{ businessReport()!.totalRevenue / 1000 | number : '1.0-0' }}K
              </div>
              <div class="kpi-label">Revenue</div>
              <div class="kpi-trend">
                <i class="pi pi-chart-line"></i>
                <span>Total</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts and Analytics Grid -->
        <div class="analytics-grid">
          <!-- Lead Status Chart Card -->
          <div class="chart-card status-chart">
            <div class="card-header">
              <h3><i class="pi pi-chart-pie"></i> Lead Status</h3>
              <div class="date-filter-mini">
                <button
                  pButton
                  label="Today"
                  size="small"
                  [outlined]="executiveDatePreset !== 'today'"
                  (click)="setExecutiveDatePreset('today')"
                ></button>
                <button
                  pButton
                  label="Week"
                  size="small"
                  [outlined]="executiveDatePreset !== 'week'"
                  (click)="setExecutiveDatePreset('week')"
                ></button>
                <button
                  pButton
                  label="Month"
                  size="small"
                  [outlined]="executiveDatePreset !== 'month'"
                  (click)="setExecutiveDatePreset('month')"
                ></button>
              </div>
            </div>
            @if (leadStatusReport()) {
            <div class="status-visual">
              @for (status of leadStatusReport()!.statusBreakdown; track
              status.status) {
              <div class="status-bar">
                <div class="status-info">
                  <span class="status-name">{{
                    status.status.replace('_', ' ') | titlecase
                  }}</span>
                  <span class="status-count">{{ status.count }}</span>
                </div>
                <div class="progress-container">
                  <div
                    class="progress-bar"
                    [style.width.%]="status.percentage"
                    [attr.data-status]="status.status.toLowerCase()"
                  ></div>
                  <span class="percentage"
                    >{{ status.percentage | number : '1.0-0' }}%</span
                  >
                </div>
              </div>
              }
            </div>
            }
          </div>

          <!-- Executive Performance Card -->
          <div class="chart-card executive-chart">
            <div class="card-header">
              <h3><i class="pi pi-users"></i> Top Performers</h3>
              <div class="filter-mini">
                <input
                  type="text"
                  [(ngModel)]="executiveSearchTerm"
                  (input)="filterExecutives()"
                  placeholder="Search..."
                  class="search-mini"
                />
              </div>
            </div>
            <div class="executive-list">
              @for (exec of getTopExecutives(); track exec.userId) {
              <div class="executive-item">
                <div class="exec-avatar">{{ getInitials(exec.userName) }}</div>
                <div class="exec-details">
                  <div class="exec-name">{{ exec.userName }}</div>
                  <div class="exec-stats">
                    <span class="stat won"
                      >{{ exec.statusCounts['WON'] || 0 }} Won</span
                    >
                    <span class="stat total"
                      >{{ getTotalLeads(exec.statusCounts) }} Total</span
                    >
                  </div>
                </div>
                <div class="exec-progress">
                  <div class="win-rate">
                    {{ getWinRate(exec.statusCounts) | number : '1.0-0' }}%
                  </div>
                  <div class="progress-mini">
                    <div
                      class="progress-fill"
                      [style.width.%]="getWinRate(exec.statusCounts)"
                    ></div>
                  </div>
                </div>
              </div>
              }
            </div>
          </div>

          <!-- Conversion Funnel Card -->
          <div class="chart-card funnel-chart">
            <div class="card-header">
              <h3><i class="pi pi-filter"></i> Conversion Funnel</h3>
            </div>
            @if (leadStatusReport()) {
            <div class="funnel-visual">
              @for (stage of leadStatusReport()!.conversionFunnel; track
              stage.stage) {
              <div class="funnel-stage" [style.width.%]="stage.conversionRate">
                <div class="stage-content">
                  <div class="stage-name">{{ stage.stage }}</div>
                  <div class="stage-metrics">
                    <span class="stage-count">{{ stage.count }}</span>
                    <span class="stage-rate"
                      >{{ stage.conversionRate | number : '1.0-0' }}%</span
                    >
                  </div>
                </div>
              </div>
              }
            </div>
            }
          </div>

          <!-- Quick Stats Card -->
          <div class="chart-card stats-card">
            <div class="card-header">
              <h3><i class="pi pi-chart-bar"></i> Quick Stats</h3>
            </div>
            <div class="quick-stats">
              <div class="stat-item">
                <div class="stat-icon cycle">
                  <i class="pi pi-clock"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">
                    {{ businessReport()!.avgDealCycle }}
                  </div>
                  <div class="stat-label">Avg Deal Cycle</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon value">
                  <i class="pi pi-indian-rupee"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">
                    ₹{{
                      businessReport()!.avgDealValue / 1000 | number : '1.0-0'
                    }}K
                  </div>
                  <div class="stat-label">Avg Deal Value</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon progress">
                  <i class="pi pi-spinner"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">
                    {{ businessReport()!.inProgressLeads }}
                  </div>
                  <div class="stat-label">In Progress</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Executive Table (Compact) -->
        <div class="compact-table-card">
          <div class="table-header">
            <h3><i class="pi pi-table"></i> Executive Performance</h3>
            <div class="table-actions">
              <button
                pButton
                icon="pi pi-download"
                label="Export"
                size="small"
                (click)="exportReport('csv')"
              ></button>
            </div>
          </div>
          <div class="compact-table">
            <table>
              <thead>
                <tr>
                  <th>Executive</th>
                  <th>Total</th>
                  <th>Won</th>
                  <th>Lost</th>
                  <th>Win Rate</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                @for (exec of getFilteredExecutives(); track exec.userId) {
                <tr>
                  <td>
                    <div class="exec-cell">
                      <div class="exec-avatar-mini">
                        {{ getInitials(exec.userName) }}
                      </div>
                      <span>{{ exec.userName }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="metric total">{{
                      getTotalLeads(exec.statusCounts)
                    }}</span>
                  </td>
                  <td>
                    <span class="metric won">{{
                      exec.statusCounts['WON'] || 0
                    }}</span>
                  </td>
                  <td>
                    <span class="metric lost">{{
                      exec.statusCounts['LOST'] || 0
                    }}</span>
                  </td>
                  <td>
                    <div class="win-rate-cell">
                      <span
                        >{{
                          getWinRate(exec.statusCounts) | number : '1.0-0'
                        }}%</span
                      >
                      <div class="mini-bar">
                        <div
                          class="bar-fill"
                          [style.width.%]="getWinRate(exec.statusCounts)"
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="metric revenue"
                      >₹{{ exec.totalRevenue / 1000 | number : '1.0-0' }}K</span
                    >
                  </td>
                </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
        }

        <!-- Loading State -->
        @if (loading() && !businessReport()) {
        <div class="loading-compact">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Loading dashboard...</span>
        </div>
        }
      </div>
    </app-layout>
  `,
  styles: [
    `
      .compact-dashboard {
        padding: 1rem;
        max-width: 1400px;
        margin: 0 auto;
        background: #f8fafc;
        min-height: 100vh;
      }

      .compact-header {
        background: white;
        border-radius: 12px;
        padding: 1rem 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .header-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .header-info h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }

      .quick-filters {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }

      :host ::ng-deep .compact-date-input {
        padding: 0.5rem 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.875rem;
        background: white;
      }

      :host ::ng-deep .p-datepicker {
        border-radius: 8px;
      }

      .refresh-btn {
        padding: 0.5rem !important;
      }

      /* KPI Cards */
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .kpi-card {
        background: white;
        border-radius: 12px;
        padding: 1.25rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        transition: transform 0.2s, box-shadow 0.2s;
        border-left: 4px solid transparent;
      }

      .kpi-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      }

      .kpi-icon {
        width: 48px;
        height: 48px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .kpi-icon i {
        font-size: 1.25rem;
        color: white;
      }

      .kpi-content {
        flex: 1;
      }

      .kpi-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1e293b;
        line-height: 1;
      }

      .kpi-label {
        font-size: 0.875rem;
        color: #64748b;
        margin-top: 0.25rem;
      }

      .kpi-trend {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        margin-top: 0.5rem;
        font-size: 0.75rem;
        color: #10b981;
      }

      .total-leads {
        border-left-color: #3b82f6;
      }
      .total-leads .kpi-icon {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      }

      .won-deals {
        border-left-color: #10b981;
      }
      .won-deals .kpi-icon {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      }

      .lost-deals {
        border-left-color: #ef4444;
      }
      .lost-deals .kpi-icon {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      }

      .revenue {
        border-left-color: #8b5cf6;
      }
      .revenue .kpi-icon {
        background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
      }

      /* Analytics Grid */
      .analytics-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .chart-card {
        background: white;
        border-radius: 12px;
        padding: 1.25rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #f1f5f9;
      }

      .card-header h3 {
        font-size: 1rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .card-header i {
        color: #3b82f6;
      }

      .date-filter-mini {
        display: flex;
        gap: 0.25rem;
      }

      .search-mini {
        padding: 0.375rem 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        font-size: 0.75rem;
        width: 120px;
      }

      /* Status Visual */
      .status-visual {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .status-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .status-info {
        display: flex;
        flex-direction: column;
        min-width: 80px;
      }

      .status-name {
        font-weight: 600;
        font-size: 0.875rem;
        color: #1e293b;
      }

      .status-count {
        font-size: 0.75rem;
        color: #64748b;
      }

      .progress-container {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-left: 1rem;
      }

      .progress-bar {
        height: 8px;
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .progress-bar[data-status='new'] {
        background: #3b82f6;
      }
      .progress-bar[data-status='qualified'] {
        background: #f59e0b;
      }
      .progress-bar[data-status='won'] {
        background: #10b981;
      }
      .progress-bar[data-status='lost'] {
        background: #ef4444;
      }

      .percentage {
        font-size: 0.75rem;
        font-weight: 600;
        color: #64748b;
        min-width: 35px;
      }

      /* Executive List */
      .executive-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .executive-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: #f8fafc;
        border-radius: 8px;
        transition: background 0.2s;
      }

      .executive-item:hover {
        background: #f1f5f9;
      }

      .exec-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.875rem;
        flex-shrink: 0;
      }

      .exec-details {
        flex: 1;
      }

      .exec-name {
        font-weight: 600;
        font-size: 0.875rem;
        color: #1e293b;
      }

      .exec-stats {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.25rem;
      }

      .stat {
        font-size: 0.75rem;
        padding: 0.125rem 0.375rem;
        border-radius: 4px;
      }

      .stat.won {
        background: #dcfce7;
        color: #166534;
      }

      .stat.total {
        background: #f1f5f9;
        color: #475569;
      }

      .exec-progress {
        text-align: right;
      }

      .win-rate {
        font-weight: 600;
        font-size: 0.875rem;
        color: #1e293b;
      }

      .progress-mini {
        width: 60px;
        height: 4px;
        background: #e2e8f0;
        border-radius: 2px;
        margin-top: 0.25rem;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: #10b981;
        transition: width 0.3s ease;
      }

      /* Funnel Visual */
      .funnel-visual {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .funnel-stage {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        border-radius: 6px;
        padding: 0.75rem;
        color: white;
        transition: width 0.3s ease;
        min-width: 120px;
      }

      .stage-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .stage-name {
        font-weight: 600;
        font-size: 0.875rem;
      }

      .stage-metrics {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }

      .stage-count {
        font-size: 0.875rem;
        font-weight: 600;
      }

      .stage-rate {
        font-size: 0.75rem;
        opacity: 0.9;
      }

      /* Quick Stats */
      .quick-stats {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .stat-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .stat-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .stat-icon i {
        font-size: 1rem;
        color: white;
      }

      .stat-icon.cycle {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      }

      .stat-icon.value {
        background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
      }

      .stat-icon.progress {
        background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
      }

      .stat-content {
        flex: 1;
      }

      .stat-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1e293b;
        line-height: 1;
      }

      .stat-label {
        font-size: 0.75rem;
        color: #64748b;
        margin-top: 0.25rem;
      }

      /* Compact Table */
      .compact-table-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        overflow: hidden;
      }

      .table-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem;
        border-bottom: 1px solid #f1f5f9;
      }

      .table-header h3 {
        font-size: 1rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .compact-table {
        overflow-x: auto;
      }

      .compact-table table {
        width: 100%;
        border-collapse: collapse;
      }

      .compact-table th {
        background: #f8fafc;
        padding: 0.75rem 1rem;
        text-align: left;
        font-weight: 600;
        font-size: 0.875rem;
        color: #475569;
        border-bottom: 1px solid #e2e8f0;
      }

      .compact-table td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #f1f5f9;
        font-size: 0.875rem;
      }

      .exec-cell {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .exec-avatar-mini {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.75rem;
        flex-shrink: 0;
      }

      .metric {
        font-weight: 600;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
      }

      .metric.total {
        background: #f1f5f9;
        color: #475569;
      }

      .metric.won {
        background: #dcfce7;
        color: #166534;
      }

      .metric.lost {
        background: #fee2e2;
        color: #991b1b;
      }

      .metric.revenue {
        background: #f3e8ff;
        color: #7c3aed;
      }

      .win-rate-cell {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .mini-bar {
        width: 60px;
        height: 4px;
        background: #e2e8f0;
        border-radius: 2px;
        overflow: hidden;
      }

      .bar-fill {
        height: 100%;
        background: #10b981;
        transition: width 0.3s ease;
      }

      /* Loading */
      .loading-compact {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem;
        color: #64748b;
        gap: 1rem;
      }

      .loading-compact i {
        font-size: 2rem;
        color: #3b82f6;
      }

      /* Responsive */
      @media (max-width: 1200px) {
        .kpi-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .analytics-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 768px) {
        .compact-dashboard {
          padding: 0.75rem;
        }

        .kpi-grid {
          grid-template-columns: 1fr;
        }

        .header-info {
          flex-direction: column;
          align-items: stretch;
        }

        .quick-filters {
          justify-content: stretch;
        }

        .compact-date {
          flex: 1;
        }
      }
    `,
  ],
})
export class CompactDashboardComponent implements OnInit {
  metrics = signal<IDashboardMetrics | null>(null);
  businessReport = signal<IBusinessReport | null>(null);
  periodReport = signal<IPeriodReport | null>(null);
  leadStatusReport = signal<ILeadStatusReport | null>(null);
  users = signal<IUser[]>([]);
  loading = signal(false);

  // Filter properties
  dateFrom: Date | null = null;
  dateTo: Date | null = null;
  selectedPeriod: { label: string; value: string } | null = null;

  // Status report specific filters
  statusDateFrom: string = '';
  statusDateTo: string = '';
  selectedUserId: string | null = null;

  // Executive table filters and sorting
  executiveSearchTerm: string = '';
  minLeadsFilter: number | null = null;
  statusFilter: string = '';
  sortField: string = '';
  sortOrder: number = 1;
  filteredExecutives = signal<any[]>([]);

  // Executive date filtering
  executiveDatePreset: string = 'month';
  executiveDateFrom: string = '';
  executiveDateTo: string = '';
  executiveLeadStatusReport = signal<ILeadStatusReport | null>(null);

  periodOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
  ];

  constructor(
    public authService: AuthService,
    private reportService: ReportService,
    private userService: UserService,
    private messageService: MessageService
  ) {
    this.selectedPeriod = this.periodOptions[2];
  }

  ngOnInit(): void {
    this.initializeExecutiveDateFilter();
    this.loadAllData();
    this.loadUsers();
    this.loadExecutiveStatusReport();
  }

  loadAllData(): void {
    this.loading.set(true);
    this.loadMetrics();
    this.loadBusinessReport();
    this.loadPeriodReport();
    this.loadLeadStatusReport();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.users.set(response.data);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load users',
        });
      },
    });
  }

  loadMetrics(): void {
    const filters = this.getFilters();
    this.reportService.getDashboardMetrics(filters).subscribe({
      next: (response) => {
        this.metrics.set(response.data);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load dashboard metrics',
        });
      },
    });
  }

  loadBusinessReport(): void {
    const filters = this.getFilters();
    this.reportService.getBusinessReport(filters).subscribe({
      next: (response) => {
        this.businessReport.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load business report',
        });
        this.loading.set(false);
      },
    });
  }

  loadPeriodReport(): void {
    if (!this.selectedPeriod) return;

    const filters = this.getFilters();
    this.reportService
      .getPeriodReport(
        this.selectedPeriod.value as 'daily' | 'weekly' | 'monthly',
        filters
      )
      .subscribe({
        next: (response) => {
          this.periodReport.set(response.data);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load period report',
          });
        },
      });
  }

  loadLeadStatusReport(): void {
    const filters = this.getStatusFilters();
    this.reportService.getLeadStatusReport(filters).subscribe({
      next: (response) => {
        this.leadStatusReport.set(response.data);
        this.filterExecutives();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load lead status report',
        });
      },
    });
  }

  // Helper methods for template
  getTopExecutives(): any[] {
    const report = this.executiveLeadStatusReport() || this.leadStatusReport();
    if (!report) return [];

    return report.executiveStatusBreakdown
      .filter((exec) => this.getTotalLeads(exec.statusCounts) > 0)
      .sort(
        (a, b) =>
          this.getTotalLeads(b.statusCounts) -
          this.getTotalLeads(a.statusCounts)
      )
      .slice(0, 5);
  }

  getFilteredExecutives(): any[] {
    return this.filteredExecutives().slice(0, 10);
  }

  getWinRate(statusCounts: { [key: string]: number }): number {
    const total = this.getTotalLeads(statusCounts);
    const won = statusCounts['WON'] || 0;
    return total > 0 ? (won / total) * 100 : 0;
  }

  getTotalLeads(statusCounts: { [key: string]: number }): number {
    return Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // Executive date filtering methods
  initializeExecutiveDateFilter(): void {
    this.setExecutiveDatePreset('month');
  }

  setExecutiveDatePreset(preset: string): void {
    this.executiveDatePreset = preset;
    const now = new Date();

    switch (preset) {
      case 'today':
        const today = now.toISOString().split('T')[0];
        this.executiveDateFrom = today;
        this.executiveDateTo = today;
        break;

      case 'week':
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        this.executiveDateFrom = startOfWeek.toISOString().split('T')[0];
        this.executiveDateTo = endOfWeek.toISOString().split('T')[0];
        break;

      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        this.executiveDateFrom = startOfMonth.toISOString().split('T')[0];
        this.executiveDateTo = endOfMonth.toISOString().split('T')[0];
        break;
    }

    this.loadExecutiveStatusReport();
  }

  loadExecutiveStatusReport(): void {
    const filters = this.getExecutiveFilters();
    this.reportService.getLeadStatusReport(filters).subscribe({
      next: (response) => {
        this.executiveLeadStatusReport.set(response.data);
        this.filterExecutives();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load executive status report',
        });
      },
    });
  }

  getExecutiveFilters(): IReportFilter {
    const filters: IReportFilter = {};

    if (this.executiveDateFrom) {
      filters.dateFrom = this.executiveDateFrom;
    }

    if (this.executiveDateTo) {
      filters.dateTo = this.executiveDateTo;
    }

    return filters;
  }

  filterExecutives(): void {
    const report = this.executiveLeadStatusReport() || this.leadStatusReport();
    if (!report) {
      this.filteredExecutives.set([]);
      return;
    }

    let filtered = [...report.executiveStatusBreakdown];

    if (this.executiveSearchTerm) {
      const searchTerm = this.executiveSearchTerm.toLowerCase();
      filtered = filtered.filter((exec) =>
        exec.userName.toLowerCase().includes(searchTerm)
      );
    }

    this.filteredExecutives.set(filtered);
  }

  // Other required methods
  onDateChange(): void {
    this.loadAllData();
  }

  onPeriodChange(): void {
    this.loadPeriodReport();
  }

  onStatusFilterChange(): void {
    this.loadLeadStatusReport();
  }

  clearStatusFilters(): void {
    this.statusDateFrom = '';
    this.statusDateTo = '';
    this.selectedUserId = null;
    this.loadLeadStatusReport();
  }

  getFilters(): IReportFilter {
    const filters: IReportFilter = {};

    if (this.dateFrom) {
      filters.dateFrom = this.dateFrom.toISOString().split('T')[0];
    }

    if (this.dateTo) {
      filters.dateTo = this.dateTo.toISOString().split('T')[0];
    }

    return filters;
  }

  getStatusFilters(): IReportFilter {
    const filters: IReportFilter = {};

    if (this.statusDateFrom) {
      filters.dateFrom = this.statusDateFrom;
    }

    if (this.statusDateTo) {
      filters.dateTo = this.statusDateTo;
    }

    if (this.selectedUserId) {
      filters.userId = this.selectedUserId;
    }

    return filters;
  }

  getSelectedUserName(): string {
    if (!this.selectedUserId) return '';
    const user = this.users().find((u) => u.id === this.selectedUserId);
    return user ? user.name : '';
  }

  exportReport(format: 'csv' | 'pdf'): void {
    const filters = this.getFilters();
    const exportMethod =
      format === 'csv'
        ? this.reportService.exportCsv(filters)
        : this.reportService.exportPdf(filters);

    exportMethod.subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `business-report.${format}`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to export ${format.toUpperCase()} report`,
        });
      },
    });
  }
}
