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
  selector: 'app-dashboard',
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
    LayoutComponent,
  ],
  providers: [MessageService],
  template: `
    <app-layout>
      <p-toast />
      <div class="dashboard-container">
        <!-- Header -->
        <div class="dashboard-header">
          <div class="welcome-section">
            <h1 class="welcome-title">
              Welcome back, {{ authService.currentUser()?.name }}!
            </h1>
            <p class="welcome-subtitle">
              Business Performance Dashboard - Lead Lifecycle Analytics
            </p>
          </div>
          <div class="header-actions">
            <!-- Date Range Filter -->
            <div class="filter-group">
              <label>From:</label>
              <input
                type="date"
                [(ngModel)]="dateFromStr"
                (change)="onDateChange()"
                class="date-input"
              />
            </div>
            <div class="filter-group">
              <label>To:</label>
              <input
                type="date"
                [(ngModel)]="dateToStr"
                (change)="onDateChange()"
                class="date-input"
              />
            </div>
            <!-- Period Selection -->
            <div class="filter-group">
              <label>Period:</label>
              <select
                [(ngModel)]="selectedPeriod"
                (change)="onPeriodChange()"
                class="period-select"
              >
                <option [ngValue]="null">Select Period</option>
                <option [ngValue]="option" *ngFor="let option of periodOptions">
                  {{ option.label }}
                </option>
              </select>
            </div>
            <button
              pButton
              icon="pi pi-refresh"
              label="Refresh"
              (click)="loadAllData()"
              [loading]="loading()"
            ></button>
          </div>
        </div>

        @if (businessReport()) {
        <!-- Business Overview Stats -->
        <div class="section-header">
          <h2 class="section-title">
            <i class="pi pi-chart-line"></i> Business Overview
          </h2>
        </div>
        <div class="stats-grid">
          <div class="stat-card stat-blue">
            <div class="stat-icon">
              <i class="pi pi-users"></i>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ businessReport()!.totalLeads }}</span>
              <span class="stat-label">Total Leads</span>
              <span class="stat-trend">All time</span>
            </div>
          </div>
          <div class="stat-card stat-green">
            <div class="stat-icon">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ businessReport()!.wonLeads }}</span>
              <span class="stat-label">Won Deals</span>
              <span class="stat-trend"
                >{{ businessReport()!.winRate | number : '1.1-1' }}% win
                rate</span
              >
            </div>
          </div>
          <div class="stat-card stat-red">
            <div class="stat-icon">
              <i class="pi pi-times-circle"></i>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ businessReport()!.lostLeads }}</span>
              <span class="stat-label">Lost Deals</span>
              <span class="stat-trend"
                >{{ businessReport()!.lossRate | number : '1.1-1' }}% loss
                rate</span
              >
            </div>
          </div>
          <div class="stat-card stat-orange">
            <div class="stat-icon">
              <i class="pi pi-clock"></i>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{
                businessReport()!.avgDealCycle
              }}</span>
              <span class="stat-label">Avg Deal Cycle</span>
              <span class="stat-trend">days to close</span>
            </div>
          </div>
          <div class="stat-card stat-purple">
            <div class="stat-icon">
              <i class="pi pi-indian-rupee"></i>
            </div>
            <div class="stat-content">
              <span class="stat-value"
                >₹{{ businessReport()!.totalRevenue | number : '1.0-0' }}</span
              >
              <span class="stat-label">Total Revenue</span>
              <span class="stat-trend">from won deals</span>
            </div>
          </div>
          <div class="stat-card stat-teal">
            <div class="stat-icon">
              <i class="pi pi-indian-rupee"></i>
            </div>
            <div class="stat-content">
              <span class="stat-value"
                >₹{{ businessReport()!.avgDealValue | number : '1.0-0' }}</span
              >
              <span class="stat-label">Avg Deal Value</span>
              <span class="stat-trend">per won lead</span>
            </div>
          </div>
        </div>

        <!-- Executive Performance Table -->
        <div class="section-header">
          <h2 class="section-title">
            <i class="pi pi-users"></i> Executive Performance Report
          </h2>
          <button
            pButton
            icon="pi pi-download"
            label="Export CSV"
            severity="secondary"
            size="small"
            (click)="exportReport('csv')"
          ></button>
        </div>
        <div class="table-card">
          <p-table
            [value]="businessReport()!.executivePerformance"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[10, 25, 50]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} executives"
            styleClass="executive-table"
            [responsiveLayout]="'scroll'"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Executive</th>
                <th>Role</th>
                <th>Total Leads</th>
                <th>Won</th>
                <th>Lost</th>
                <th>In Progress</th>
                <th>Win Rate</th>
                <th>Revenue</th>
                <th>Follow-ups</th>
                <th>SLA</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-exec>
              <tr>
                <td>
                  <div class="exec-name">
                    <div class="exec-avatar">
                      {{ getInitials(exec.userName) }}
                    </div>
                    <span>{{ exec.userName }}</span>
                  </div>
                </td>
                <td>
                  <p-tag
                    [value]="exec.userRole"
                    [severity]="getRoleSeverity(exec.userRole)"
                    styleClass="role-tag"
                  />
                </td>
                <td>
                  <span class="metric-value">{{ exec.totalLeads }}</span>
                </td>
                <td>
                  <span class="metric-value metric-success">{{
                    exec.wonLeads
                  }}</span>
                </td>
                <td>
                  <span class="metric-value metric-danger">{{
                    exec.lostLeads
                  }}</span>
                </td>
                <td>
                  <span class="metric-value metric-info">{{
                    exec.inProgressLeads
                  }}</span>
                </td>
                <td>
                  <div class="win-rate">
                    <span class="win-rate-value"
                      >{{ exec.winRate | number : '1.1-1' }}%</span
                    >
                    <p-progressBar
                      [value]="exec.winRate"
                      [showValue]="false"
                      styleClass="win-rate-bar"
                    />
                  </div>
                </td>
                <td>
                  <span class="metric-value metric-revenue"
                    >₹{{ exec.totalRevenue | number : '1.0-0' }}</span
                  >
                </td>
                <td>
                  <div class="followup-summary">
                    <span class="followup-total">{{
                      exec.followUpStats.totalFollowUps
                    }}</span>
                    <div class="followup-breakdown">
                      <span class="followup-completed"
                        >✓ {{ exec.followUpStats.completedFollowUps }}</span
                      >
                      <span class="followup-pending"
                        >⏳ {{ exec.followUpStats.pendingFollowUps }}</span
                      >
                      @if (exec.followUpStats.overdueFollowUps > 0) {
                      <span class="followup-overdue"
                        >⚠ {{ exec.followUpStats.overdueFollowUps }}</span
                      >
                      }
                    </div>
                  </div>
                </td>
                <td>
                  <div class="sla-metric">
                    <span
                      class="sla-value"
                      [class.sla-good]="exec.slaCompliance >= 90"
                      [class.sla-warning]="
                        exec.slaCompliance >= 70 && exec.slaCompliance < 90
                      "
                      [class.sla-danger]="exec.slaCompliance < 70"
                      >{{ exec.slaCompliance | number : '1.0-0' }}%</span
                    >
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="10">
                  <div class="empty-state">
                    <i class="pi pi-inbox empty-icon"></i>
                    <p class="empty-text">No executive data available</p>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Lead Status Breakdown with Filters -->
        <div class="section-header">
          <h2 class="section-title">
            <i class="pi pi-chart-pie"></i> Lead Status Breakdown
          </h2>
        </div>

        <!-- Status Report Filters -->
        <div class="status-filters-card">
          <div class="filter-row">
            <div class="filter-item">
              <label>Date From:</label>
              <input
                type="date"
                [(ngModel)]="statusDateFrom"
                (change)="onStatusFilterChange()"
                class="date-input"
              />
            </div>
            <div class="filter-item">
              <label>Date To:</label>
              <input
                type="date"
                [(ngModel)]="statusDateTo"
                (change)="onStatusFilterChange()"
                class="date-input"
              />
            </div>
            <div class="filter-item">
              <label>Select User:</label>
              <select
                [(ngModel)]="selectedUserId"
                (change)="onStatusFilterChange()"
                class="user-select"
              >
                <option [ngValue]="null">All Users (Total Report)</option>
                <option [ngValue]="user.id" *ngFor="let user of users()">
                  {{ user.name }} ({{ user.role }})
                </option>
              </select>
            </div>
            <button
              pButton
              icon="pi pi-filter-slash"
              label="Clear Filters"
              severity="secondary"
              size="small"
              (click)="clearStatusFilters()"
            ></button>
          </div>
        </div>

        <!-- Status Report Content -->
        @if (leadStatusReport()) {
        <div class="status-report-container">
          <!-- Left Panel: Total/Filtered Report -->
          <div class="status-panel">
            <div class="panel-header">
              <h3>
                @if (selectedUserId) {
                <i class="pi pi-user"></i> Individual Report:
                {{ getSelectedUserName() }}
                } @else {
                <i class="pi pi-users"></i> Total Company Report }
              </h3>
              <p class="panel-subtitle">
                @if (statusDateFrom || statusDateTo) { Filtered:
                {{ statusDateFrom || 'Start' }} to {{ statusDateTo || 'Now' }}
                } @else { All Time Data }
              </p>
            </div>

            <div class="status-breakdown-section">
              <h4>Status Distribution</h4>
              <div class="status-items">
                @for (status of leadStatusReport()!.statusBreakdown; track
                status.status) {
                <div class="status-item">
                  <div class="status-info">
                    <span class="status-name">{{
                      status.status.replace('_', ' ') | titlecase
                    }}</span>
                    <span class="status-count">{{ status.count }} leads</span>
                  </div>
                  <div class="status-metrics">
                    <span class="status-percentage"
                      >{{ status.percentage | number : '1.1-1' }}%</span
                    >
                    @if (status.revenue > 0) {
                    <span class="status-revenue"
                      >₹{{ status.revenue | number : '1.0-0' }}</span
                    >
                    }
                  </div>
                </div>
                }
              </div>
            </div>

            <div class="conversion-funnel-section">
              <h4>Conversion Funnel</h4>
              <div class="funnel-stages">
                @for (stage of leadStatusReport()!.conversionFunnel; track
                stage.stage) {
                <div class="funnel-stage">
                  <div class="stage-info">
                    <span class="stage-name">{{ stage.stage }}</span>
                    <span class="stage-count">{{ stage.count }} leads</span>
                  </div>
                  <div class="stage-rate">
                    <span class="conversion-rate"
                      >{{ stage.conversionRate | number : '1.1-1' }}%</span
                    >
                    <p-progressBar
                      [value]="stage.conversionRate"
                      [showValue]="false"
                      styleClass="funnel-bar"
                    />
                  </div>
                </div>
                }
              </div>
            </div>
          </div>

          <!-- Right Panel: Executive Breakdown -->
          <div class="status-panel">
            <div class="panel-header">
              <h3>
                <i class="pi pi-chart-bar"></i> Executive Status Breakdown
              </h3>
              <p class="panel-subtitle">
                Status distribution by executive @if (executiveDatePreset) { -
                {{ getExecutiveDateLabel() }} }
              </p>
            </div>

            <!-- Executive Date Filter -->
            <div class="executive-date-filter">
              <div class="date-preset-buttons">
                <button
                  pButton
                  label="Today"
                  [outlined]="executiveDatePreset !== 'today'"
                  severity="secondary"
                  size="small"
                  (click)="setExecutiveDatePreset('today')"
                  [class.active-preset]="executiveDatePreset === 'today'"
                ></button>
                <button
                  pButton
                  label="This Week"
                  [outlined]="executiveDatePreset !== 'week'"
                  severity="secondary"
                  size="small"
                  (click)="setExecutiveDatePreset('week')"
                  [class.active-preset]="executiveDatePreset === 'week'"
                ></button>
                <button
                  pButton
                  label="This Month"
                  [outlined]="executiveDatePreset !== 'month'"
                  severity="secondary"
                  size="small"
                  (click)="setExecutiveDatePreset('month')"
                  [class.active-preset]="executiveDatePreset === 'month'"
                ></button>
                <button
                  pButton
                  label="Custom Range"
                  [outlined]="executiveDatePreset !== 'custom'"
                  severity="secondary"
                  size="small"
                  (click)="setExecutiveDatePreset('custom')"
                  [class.active-preset]="executiveDatePreset === 'custom'"
                ></button>
              </div>

              @if (executiveDatePreset === 'custom') {
              <div class="custom-date-range">
                <div class="date-range-inputs">
                  <div class="date-input-group">
                    <label>From:</label>
                    <input
                      type="date"
                      [(ngModel)]="executiveDateFrom"
                      (change)="onExecutiveDateChange()"
                      class="date-input-small"
                    />
                  </div>
                  <div class="date-input-group">
                    <label>To:</label>
                    <input
                      type="date"
                      [(ngModel)]="executiveDateTo"
                      (change)="onExecutiveDateChange()"
                      class="date-input-small"
                    />
                  </div>
                </div>
              </div>
              }
            </div>

            <!-- Executive Quick Filters -->
            <div class="executive-filters">
              <div class="quick-filter-row">
                <div class="filter-item-small">
                  <label>Search Executive:</label>
                  <input
                    type="text"
                    [(ngModel)]="executiveSearchTerm"
                    (input)="filterExecutives()"
                    placeholder="Type name..."
                    class="search-input"
                  />
                </div>
                <div class="filter-item-small">
                  <label>Min Total Leads:</label>
                  <input
                    type="number"
                    [(ngModel)]="minLeadsFilter"
                    (input)="filterExecutives()"
                    placeholder="0"
                    class="number-input"
                    min="0"
                  />
                </div>
                <div class="filter-item-small">
                  <label>Status Filter:</label>
                  <select
                    [(ngModel)]="statusFilter"
                    (change)="filterExecutives()"
                    class="status-filter-select"
                  >
                    <option value="">All Statuses</option>
                    <option value="hasWon">Has Won Leads</option>
                    <option value="hasLost">Has Lost Leads</option>
                    <option value="hasNew">Has New Leads</option>
                    <option value="hasQualified">Has Qualified Leads</option>
                  </select>
                </div>
                <button
                  pButton
                  icon="pi pi-times"
                  label="Clear"
                  severity="secondary"
                  size="small"
                  (click)="clearExecutiveFilters()"
                  class="clear-btn"
                ></button>
              </div>
            </div>

            <div class="executive-status-table">
              <table class="status-table">
                <thead>
                  <tr>
                    <th
                      (click)="sortExecutives('name')"
                      class="sortable-header"
                    >
                      Executive
                      <i
                        class="pi"
                        [class.pi-sort-up]="
                          sortField === 'name' && sortOrder === 1
                        "
                        [class.pi-sort-down]="
                          sortField === 'name' && sortOrder === -1
                        "
                        [class.pi-sort]="sortField !== 'name'"
                      ></i>
                    </th>
                    <th (click)="sortExecutives('new')" class="sortable-header">
                      New
                      <i
                        class="pi"
                        [class.pi-sort-up]="
                          sortField === 'new' && sortOrder === 1
                        "
                        [class.pi-sort-down]="
                          sortField === 'new' && sortOrder === -1
                        "
                        [class.pi-sort]="sortField !== 'new'"
                      ></i>
                    </th>
                    <th
                      (click)="sortExecutives('qualified')"
                      class="sortable-header"
                    >
                      Qualified
                      <i
                        class="pi"
                        [class.pi-sort-up]="
                          sortField === 'qualified' && sortOrder === 1
                        "
                        [class.pi-sort-down]="
                          sortField === 'qualified' && sortOrder === -1
                        "
                        [class.pi-sort]="sortField !== 'qualified'"
                      ></i>
                    </th>
                    <th (click)="sortExecutives('won')" class="sortable-header">
                      Won
                      <i
                        class="pi"
                        [class.pi-sort-up]="
                          sortField === 'won' && sortOrder === 1
                        "
                        [class.pi-sort-down]="
                          sortField === 'won' && sortOrder === -1
                        "
                        [class.pi-sort]="sortField !== 'won'"
                      ></i>
                    </th>
                    <th
                      (click)="sortExecutives('lost')"
                      class="sortable-header"
                    >
                      Lost
                      <i
                        class="pi"
                        [class.pi-sort-up]="
                          sortField === 'lost' && sortOrder === 1
                        "
                        [class.pi-sort-down]="
                          sortField === 'lost' && sortOrder === -1
                        "
                        [class.pi-sort]="sortField !== 'lost'"
                      ></i>
                    </th>
                    <th
                      (click)="sortExecutives('total')"
                      class="sortable-header"
                    >
                      Total
                      <i
                        class="pi"
                        [class.pi-sort-up]="
                          sortField === 'total' && sortOrder === 1
                        "
                        [class.pi-sort-down]="
                          sortField === 'total' && sortOrder === -1
                        "
                        [class.pi-sort]="sortField !== 'total'"
                      ></i>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  @for (exec of filteredExecutives(); track exec.userId) {
                  <tr>
                    <td>
                      <div class="exec-cell">
                        <div class="exec-avatar-small">
                          {{ getInitials(exec.userName) }}
                        </div>
                        <span>{{ exec.userName }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="status-badge status-new">{{
                        exec.statusCounts['NEW'] || 0
                      }}</span>
                    </td>
                    <td>
                      <span class="status-badge status-qualified">{{
                        exec.statusCounts['QUALIFIED'] || 0
                      }}</span>
                    </td>
                    <td>
                      <span class="status-badge status-won">{{
                        exec.statusCounts['WON'] || 0
                      }}</span>
                    </td>
                    <td>
                      <span class="status-badge status-lost">{{
                        exec.statusCounts['LOST'] || 0
                      }}</span>
                    </td>
                    <td>
                      <span class="status-badge status-total">{{
                        getTotalLeads(exec.statusCounts)
                      }}</span>
                    </td>
                  </tr>
                  } @empty {
                  <tr>
                    <td colspan="6" class="empty-row">
                      <div class="empty-state-small">
                        <i class="pi pi-filter"></i>
                        <span>No executives match the current filters</span>
                      </div>
                    </td>
                  </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
        }

        <!-- Period Report -->
        @if (periodReport()) {
        <div class="section-header">
          <h2 class="section-title">
            <i class="pi pi-calendar"></i>
            {{ selectedPeriod?.label }} Performance Report
          </h2>
        </div>
        <div class="period-summary-card">
          <div class="period-stats">
            <div class="period-stat">
              <span class="period-value">{{
                periodReport()!.summary.totalLeads
              }}</span>
              <span class="period-label">Total Leads</span>
            </div>
            <div class="period-stat">
              <span class="period-value">{{
                periodReport()!.summary.wonLeads
              }}</span>
              <span class="period-label">Won Leads</span>
            </div>
            <div class="period-stat">
              <span class="period-value"
                >{{ periodReport()!.summary.winRate | number : '1.1-1' }}%</span
              >
              <span class="period-label">Win Rate</span>
            </div>
            <div class="period-stat">
              <span class="period-value"
                >₹{{
                  periodReport()!.summary.totalRevenue | number : '1.0-0'
                }}</span
              >
              <span class="period-label">Revenue</span>
            </div>
          </div>
        </div>
        } }

        <!-- Loading State -->
        @if (loading() && !businessReport()) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner loading-icon"></i>
          <p>Loading business report...</p>
        </div>
        }
      </div>
    </app-layout>
  `,
  styles: [
    `
      .dashboard-container {
        padding: 1.5rem;
        max-width: 1600px;
        margin: 0 auto;
      }

      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .welcome-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 0.5rem 0;
      }

      .welcome-subtitle {
        color: #6b7280;
        margin: 0;
        font-size: 1rem;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .filter-group label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
      }

      .date-input,
      .period-select {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.875rem;
        min-width: 120px;
      }

      .date-input:focus,
      .period-select:focus {
        outline: none;
        border-color: #25d366;
        box-shadow: 0 0 0 2px rgba(37, 211, 102, 0.1);
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
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

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s, box-shadow 0.2s;
        border-left: 4px solid transparent;
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      }

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .stat-icon i {
        font-size: 1.5rem;
        color: white;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        flex: 1;
      }

      .stat-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1f2937;
        line-height: 1;
      }

      .stat-label {
        font-size: 0.875rem;
        color: #6b7280;
        margin-top: 0.25rem;
      }

      .stat-trend {
        font-size: 0.75rem;
        color: #9ca3af;
        margin-top: 0.25rem;
      }

      .stat-blue .stat-icon {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      }
      .stat-blue {
        border-left-color: #3b82f6;
      }

      .stat-green .stat-icon {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      }
      .stat-green {
        border-left-color: #10b981;
      }

      .stat-red .stat-icon {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      }
      .stat-red {
        border-left-color: #ef4444;
      }

      .stat-orange .stat-icon {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      }
      .stat-orange {
        border-left-color: #f59e0b;
      }

      .stat-purple .stat-icon {
        background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
      }
      .stat-purple {
        border-left-color: #8b5cf6;
      }

      .stat-teal .stat-icon {
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      }
      .stat-teal {
        border-left-color: #14b8a6;
      }

      .table-card {
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        margin-bottom: 2rem;
      }

      .exec-name {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .exec-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.75rem;
        flex-shrink: 0;
      }

      .metric-value {
        font-weight: 600;
        font-size: 0.875rem;
      }

      .metric-success {
        color: #10b981;
      }
      .metric-danger {
        color: #ef4444;
      }
      .metric-info {
        color: #3b82f6;
      }
      .metric-revenue {
        color: #8b5cf6;
        font-weight: 700;
      }

      .win-rate {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .win-rate-value {
        font-weight: 600;
        font-size: 0.875rem;
        color: #1f2937;
      }

      .followup-summary {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .followup-total {
        font-weight: 600;
        color: #1f2937;
      }

      .followup-breakdown {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .followup-completed {
        font-size: 0.75rem;
        color: #10b981;
      }
      .followup-pending {
        font-size: 0.75rem;
        color: #f59e0b;
      }
      .followup-overdue {
        font-size: 0.75rem;
        color: #ef4444;
        font-weight: 600;
      }

      .sla-metric {
        display: flex;
        align-items: center;
      }

      .sla-value {
        font-weight: 600;
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        font-size: 0.75rem;
      }

      .sla-good {
        background: #dcfce7;
        color: #166534;
      }
      .sla-warning {
        background: #fef3c7;
        color: #92400e;
      }
      .sla-danger {
        background: #fee2e2;
        color: #991b1b;
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem;
        color: #6b7280;
        gap: 1rem;
      }

      .loading-icon {
        font-size: 2rem;
        color: #25d366;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        color: #9ca3af;
        gap: 0.5rem;
      }

      .empty-icon {
        font-size: 2.5rem;
      }

      .empty-text {
        font-weight: 600;
        margin: 0;
      }

      .status-report-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .status-filters-card {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        margin-bottom: 1.5rem;
      }

      .filter-row {
        display: flex;
        align-items: end;
        gap: 1.5rem;
        flex-wrap: wrap;
      }

      .filter-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        min-width: 150px;
      }

      .filter-item label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
      }

      .user-select {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.875rem;
        min-width: 200px;
        background: white;
      }

      .user-select:focus {
        outline: none;
        border-color: #25d366;
        box-shadow: 0 0 0 2px rgba(37, 211, 102, 0.1);
      }

      .status-report-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .status-panel {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }

      .panel-header {
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
      }

      .panel-header h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .panel-header h3 i {
        color: #25d366;
      }

      .panel-subtitle {
        margin: 0;
        font-size: 0.875rem;
        color: #6b7280;
      }

      .status-breakdown-section,
      .conversion-funnel-section {
        margin-bottom: 2rem;
      }

      .status-breakdown-section h4,
      .conversion-funnel-section h4 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
      }

      .executive-status-table {
        overflow-x: auto;
      }

      .status-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }

      .status-table th {
        background: #f9fafb;
        padding: 0.75rem 0.5rem;
        text-align: left;
        font-weight: 600;
        color: #374151;
        border-bottom: 1px solid #e5e7eb;
      }

      .status-table td {
        padding: 0.75rem 0.5rem;
        border-bottom: 1px solid #f3f4f6;
      }

      .exec-cell {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .exec-avatar-small {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.625rem;
        flex-shrink: 0;
      }

      .status-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.75rem;
        text-align: center;
        min-width: 30px;
      }

      .status-new {
        background: #dbeafe;
        color: #1e40af;
      }

      .status-qualified {
        background: #fef3c7;
        color: #92400e;
      }

      .status-won {
        background: #dcfce7;
        color: #166534;
      }

      .status-lost {
        background: #fee2e2;
        color: #991b1b;
      }

      .status-total {
        background: #f3f4f6;
        color: #374151;
        font-weight: 700;
      }

      .executive-filters {
        margin-bottom: 1rem;
        padding: 1rem;
        background: #f9fafb;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
      }

      .executive-date-filter {
        margin-bottom: 1rem;
        padding: 1rem;
        background: #ffffff;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
      }

      .date-preset-buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 0.5rem;
      }

      .active-preset {
        background: #25d366 !important;
        color: white !important;
        border-color: #25d366 !important;
      }

      .custom-date-range {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
      }

      .date-range-inputs {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .date-input-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 140px;
      }

      .date-input-group label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #374151;
      }

      .date-input-small {
        padding: 0.375rem 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 0.75rem;
        background: white;
      }

      .date-input-small:focus {
        outline: none;
        border-color: #25d366;
        box-shadow: 0 0 0 1px rgba(37, 211, 102, 0.1);
      }

      .quick-filter-row {
        display: flex;
        align-items: end;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .filter-item-small {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 120px;
      }

      .filter-item-small label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #374151;
      }

      .search-input,
      .number-input,
      .status-filter-select {
        padding: 0.375rem 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 0.75rem;
        background: white;
      }

      .search-input:focus,
      .number-input:focus,
      .status-filter-select:focus {
        outline: none;
        border-color: #25d366;
        box-shadow: 0 0 0 1px rgba(37, 211, 102, 0.1);
      }

      .clear-btn {
        height: fit-content;
      }

      .sortable-header {
        cursor: pointer;
        user-select: none;
        transition: background-color 0.2s;
        position: relative;
      }

      .sortable-header:hover {
        background: #f3f4f6;
      }

      .sortable-header i {
        margin-left: 0.25rem;
        font-size: 0.75rem;
        color: #6b7280;
      }

      .empty-row {
        text-align: center;
        padding: 2rem;
      }

      .empty-state-small {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        color: #9ca3af;
      }

      .empty-state-small i {
        font-size: 1.5rem;
      }

      .status-breakdown-card,
      .conversion-funnel-card {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }

      .status-breakdown-card h3,
      .conversion-funnel-card h3 {
        margin: 0 0 1rem 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
      }

      .status-items,
      .funnel-stages {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .status-item,
      .funnel-stage {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        background: #f9fafb;
        border-radius: 8px;
      }

      .status-info,
      .stage-info {
        display: flex;
        flex-direction: column;
      }

      .status-name,
      .stage-name {
        font-weight: 600;
        color: #1f2937;
        font-size: 0.875rem;
      }

      .status-count,
      .stage-count {
        font-size: 0.75rem;
        color: #6b7280;
      }

      .status-metrics {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.25rem;
      }

      .status-percentage {
        font-weight: 600;
        color: #3b82f6;
      }

      .status-revenue {
        font-size: 0.75rem;
        color: #10b981;
        font-weight: 600;
      }

      .stage-rate {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.25rem;
        min-width: 100px;
      }

      .conversion-rate {
        font-weight: 600;
        color: #8b5cf6;
        font-size: 0.875rem;
      }

      .period-summary-card {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        margin-bottom: 2rem;
      }

      .period-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 2rem;
      }

      .period-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .period-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
      }

      .period-label {
        font-size: 0.875rem;
        color: #6b7280;
        margin-top: 0.25rem;
      }

      @media (max-width: 1400px) {
        .stats-grid {
          grid-template-columns: repeat(3, 1fr);
        }

        .status-report-grid,
        .status-report-container {
          grid-template-columns: 1fr;
        }

        .period-stats {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 1024px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .period-stats {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 640px) {
        .dashboard-container {
          padding: 1rem;
        }

        .welcome-title {
          font-size: 1.5rem;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }

        .stat-card {
          padding: 1rem;
        }

        .stat-value {
          font-size: 1.5rem;
        }

        .dashboard-header {
          flex-direction: column;
          align-items: stretch;
        }

        .header-actions {
          justify-content: stretch;
          flex-direction: column;
        }

        .filter-group {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        }

        .period-stats {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  metrics = signal<IDashboardMetrics | null>(null);
  businessReport = signal<IBusinessReport | null>(null);
  periodReport = signal<IPeriodReport | null>(null);
  leadStatusReport = signal<ILeadStatusReport | null>(null);
  users = signal<IUser[]>([]);
  loading = signal(false);

  // Filter properties
  dateFromStr: string = '';
  dateToStr: string = '';
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
  sortOrder: number = 1; // 1 for ascending, -1 for descending
  filteredExecutives = signal<any[]>([]);

  // Executive date filtering
  executiveDatePreset: string = 'month'; // Default to current month
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
    // Set default period to monthly
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
        this.filterExecutives(); // Update filtered executives when data changes
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

  onStatusFilterChange(): void {
    this.loadLeadStatusReport();
  }

  clearStatusFilters(): void {
    this.statusDateFrom = '';
    this.statusDateTo = '';
    this.selectedUserId = null;
    this.loadLeadStatusReport();
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

  getTotalLeads(statusCounts: { [key: string]: number }): number {
    return Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
  }

  filterExecutives(): void {
    // Use executive-specific report if available, otherwise fall back to main report
    const report = this.executiveLeadStatusReport() || this.leadStatusReport();
    if (!report) {
      this.filteredExecutives.set([]);
      return;
    }

    let filtered = [...report.executiveStatusBreakdown];

    // Apply search filter
    if (this.executiveSearchTerm) {
      const searchTerm = this.executiveSearchTerm.toLowerCase();
      filtered = filtered.filter((exec) =>
        exec.userName.toLowerCase().includes(searchTerm)
      );
    }

    // Apply minimum leads filter
    if (this.minLeadsFilter !== null && this.minLeadsFilter > 0) {
      filtered = filtered.filter(
        (exec) => this.getTotalLeads(exec.statusCounts) >= this.minLeadsFilter!
      );
    }

    // Apply status filter
    if (this.statusFilter) {
      filtered = filtered.filter((exec) => {
        switch (this.statusFilter) {
          case 'hasWon':
            return (exec.statusCounts['WON'] || 0) > 0;
          case 'hasLost':
            return (exec.statusCounts['LOST'] || 0) > 0;
          case 'hasNew':
            return (exec.statusCounts['NEW'] || 0) > 0;
          case 'hasQualified':
            return (exec.statusCounts['QUALIFIED'] || 0) > 0;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    if (this.sortField) {
      filtered.sort((a, b) => {
        let aValue: number;
        let bValue: number;

        switch (this.sortField) {
          case 'name':
            return this.sortOrder * a.userName.localeCompare(b.userName);
          case 'new':
            aValue = a.statusCounts['NEW'] || 0;
            bValue = b.statusCounts['NEW'] || 0;
            break;
          case 'qualified':
            aValue = a.statusCounts['QUALIFIED'] || 0;
            bValue = b.statusCounts['QUALIFIED'] || 0;
            break;
          case 'won':
            aValue = a.statusCounts['WON'] || 0;
            bValue = b.statusCounts['WON'] || 0;
            break;
          case 'lost':
            aValue = a.statusCounts['LOST'] || 0;
            bValue = b.statusCounts['LOST'] || 0;
            break;
          case 'total':
            aValue = this.getTotalLeads(a.statusCounts);
            bValue = this.getTotalLeads(b.statusCounts);
            break;
          default:
            return 0;
        }

        return this.sortOrder * (aValue - bValue);
      });
    }

    this.filteredExecutives.set(filtered);
  }

  sortExecutives(field: string): void {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    } else {
      this.sortField = field;
      this.sortOrder = 1;
    }
    this.filterExecutives();
  }

  clearExecutiveFilters(): void {
    this.executiveSearchTerm = '';
    this.minLeadsFilter = null;
    this.statusFilter = '';
    this.sortField = '';
    this.sortOrder = 1;
    this.filterExecutives();
  }

  initializeExecutiveDateFilter(): void {
    // Set default to current month
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
        // Get start of current week (Monday)
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);

        // Get end of current week (Sunday)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        this.executiveDateFrom = startOfWeek.toISOString().split('T')[0];
        this.executiveDateTo = endOfWeek.toISOString().split('T')[0];
        break;

      case 'month':
        // Get start of current month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        // Get end of current month
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        this.executiveDateFrom = startOfMonth.toISOString().split('T')[0];
        this.executiveDateTo = endOfMonth.toISOString().split('T')[0];
        break;

      case 'custom':
        // Keep existing dates or set to current month if empty
        if (!this.executiveDateFrom || !this.executiveDateTo) {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          this.executiveDateFrom = startOfMonth.toISOString().split('T')[0];
          this.executiveDateTo = endOfMonth.toISOString().split('T')[0];
        }
        break;
    }

    if (preset !== 'custom') {
      this.loadExecutiveStatusReport();
    }
  }

  onExecutiveDateChange(): void {
    if (this.executiveDateFrom && this.executiveDateTo) {
      this.loadExecutiveStatusReport();
    }
  }

  getExecutiveDateLabel(): string {
    switch (this.executiveDatePreset) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'custom':
        if (this.executiveDateFrom && this.executiveDateTo) {
          return `${this.executiveDateFrom} to ${this.executiveDateTo}`;
        }
        return 'Custom Range';
      default:
        return '';
    }
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

  onDateChange(): void {
    this.loadAllData();
  }

  onPeriodChange(): void {
    this.loadPeriodReport();
  }

  getFilters(): IReportFilter {
    const filters: IReportFilter = {};

    if (this.dateFromStr) {
      filters.dateFrom = this.dateFromStr;
    }

    if (this.dateToStr) {
      filters.dateTo = this.dateToStr;
    }

    return filters;
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

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getRoleSeverity(
    role: string
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'danger';
      case 'manager':
        return 'warn';
      case 'customer_executive':
        return 'info';
      default:
        return 'success';
    }
  }
}
