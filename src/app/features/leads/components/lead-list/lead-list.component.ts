import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';
import {
  LeadService,
  AuthService,
  KanbanStateService,
  ApiService,
  FloatingChatService,
  LeadStatusService,
  UserService,
} from '../../../../core/services';
import { CategoryService } from '../../../category/services/category.service';
import { ILead, ILeadFilter, ICategory } from '../../../../core/models';
import { ILeadStatus } from '../../../../core/models/lead-status.model';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';
import { LeadKanbanComponent } from '../lead-kanban/lead-kanban.component';
import { LeadEditDialogComponent } from '../../../../shared/components/lead-edit-dialog/lead-edit-dialog.component';

@Component({
  selector: 'app-lead-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    SelectModule,
    InputTextModule,
    ToastModule,
    TooltipModule,
    DialogModule,
    FileUploadModule,
    ProgressBarModule,
    LayoutComponent,
    LeadKanbanComponent,
    LeadEditDialogComponent,
  ],
  providers: [MessageService],
  template: `
    @if (currentView() === 'kanban') {
    <app-lead-kanban />
    } @else {
    <app-layout>
      <p-toast />
      <div class="page-container">
        <!-- Header -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Leads</h1>
            <p class="page-subtitle">Manage and track all your leads</p>
          </div>
          <div class="header-actions">
            <div class="action-buttons">
              <button
                pButton
                label="Manual Upload"
                icon="pi pi-plus"
                severity="success"
                size="small"
                (click)="openManualUploadDialog()"
                pTooltip="Add lead manually"
              ></button>
              <button
                pButton
                label="Bulk Upload"
                icon="pi pi-upload"
                severity="info"
                size="small"
                (click)="openBulkUploadDialog()"
                pTooltip="Upload leads from CSV file"
              ></button>
              <button
                pButton
                label="Download Template"
                icon="pi pi-download"
                [outlined]="true"
                size="small"
                (click)="downloadTemplate()"
                pTooltip="Download CSV template"
              ></button>
            </div>
            <div class="view-toggle">
              <button
                pButton
                icon="pi pi-list"
                size="small"
                pTooltip="Table View"
                class="active-view"
              ></button>
              <button
                pButton
                icon="pi pi-th-large"
                [outlined]="true"
                size="small"
                pTooltip="Kanban View"
                (click)="switchToKanban()"
              ></button>
            </div>
          </div>
        </div>

        <!-- Modern Filters -->
        <div class="filter-card">
          <div class="filter-grid">
            <!-- Search Input -->
            <div class="filter-item search-item">
              <label class="filter-label">Search</label>
              <div class="search-wrapper">
                <i class="pi pi-search search-icon"></i>
                <input
                  pInputText
                  type="text"
                  [(ngModel)]="searchQuery"
                  placeholder="Search by name, phone, email..."
                  class="search-input"
                  (input)="onSearchChange()"
                />
                @if (searchQuery) {
                <i class="pi pi-times clear-search" (click)="clearSearch()"></i>
                }
              </div>
            </div>

            <!-- Status Filter -->
            <div class="filter-item">
              <label class="filter-label">Status</label>
              <p-select
                [options]="statusOptions"
                [(ngModel)]="selectedStatus"
                placeholder="All Statuses"
                [showClear]="true"
                (onChange)="loadLeads()"
                styleClass="filter-dropdown"
              />
            </div>

            <!-- Category Filter -->
            <div class="filter-item">
              <label class="filter-label">Category</label>
              <p-select
                [options]="categoryOptions"
                [(ngModel)]="selectedCategory"
                placeholder="All Categories"
                [showClear]="true"
                (onChange)="loadLeads()"
                styleClass="filter-dropdown"
              />
            </div>

            <!-- Assigned To Filter -->
            <div class="filter-item">
              <label class="filter-label">Assigned To</label>
              <p-select
                [options]="userOptions"
                [(ngModel)]="selectedAssignee"
                placeholder="All Users"
                [showClear]="true"
                (onChange)="loadLeads()"
                styleClass="filter-dropdown"
              />
            </div>
          </div>

          <!-- Filter Actions Row -->
          <div class="filter-actions">
            <div class="filter-toggles">
              <div
                class="toggle-chip"
                [class.active]="showUnassignedOnly"
                (click)="toggleUnassigned()"
              >
                <i
                  class="pi"
                  [class.pi-check]="showUnassignedOnly"
                  [class.pi-user-minus]="!showUnassignedOnly"
                ></i>
                <span>Unassigned Only</span>
              </div>
            </div>
            @if (hasActiveFilters()) {
            <button
              pButton
              label="Clear All Filters"
              icon="pi pi-filter-slash"
              [text]="true"
              size="small"
              class="clear-filters-btn"
              (click)="clearAllFilters()"
            ></button>
            }
          </div>
        </div>

        <!-- Table -->
        <div class="table-card">
          <p-table
            [value]="leads()"
            [loading]="loading()"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[10, 25, 50]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} leads"
            styleClass="modern-table"
            [responsiveLayout]="'scroll'"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Phone</th>
                <th>Customer</th>
                <th class="hidden-mobile">Source</th>
                <th class="hidden-mobile">Category</th>
                <th>Status</th>
                <th class="hidden-mobile">Notes</th>
                <th class="hidden-mobile">Assigned To</th>
                <th class="hidden-mobile">Created</th>
                <th>Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-lead>
              <tr>
                <td>
                  <span class="phone-number">{{ lead.phoneNumber }}</span>
                </td>
                <td>
                  <span class="customer-name">{{ lead.name || '-' }}</span>
                </td>
                <td class="hidden-mobile">
                  <span
                    class="source-badge"
                    [class]="getSourceClass(lead.source)"
                  >
                    <i [class]="getSourceIcon(lead.source)"></i>
                    {{ lead.source || '-' }}
                  </span>
                </td>
                <td class="hidden-mobile">
                  <span class="category-badge">{{
                    lead.category?.name || '-'
                  }}</span>
                </td>
                <td>
                  <p-tag
                    [severity]="getStatusSeverity(lead.status)"
                    [value]="lead.status"
                    styleClass="status-tag"
                  />
                </td>
                <td class="hidden-mobile">
                  <span
                    class="notes-text"
                    [pTooltip]="lead.firstMessage"
                    tooltipPosition="top"
                  >
                    {{ truncateNotes(lead.firstMessage) }}
                  </span>
                </td>
                <td class="hidden-mobile">
                  <span class="assigned-to">{{
                    lead.assignedTo?.name || 'Unassigned'
                  }}</span>
                </td>
                <td class="hidden-mobile">
                  <span class="date-text">{{
                    lead.createdAt | date : 'short'
                  }}</span>
                </td>
                <td>
                  <div class="action-buttons">
                    @if (lead.status === 'new' &&
                    authService.isCustomerExecutive()) {
                    <button
                      pButton
                      label="Claim"
                      severity="success"
                      size="small"
                      class="claim-btn"
                      (click)="claimLead(lead)"
                    ></button>
                    }
                    <button
                      pButton
                      icon="pi pi-pencil"
                      severity="secondary"
                      size="small"
                      [text]="true"
                      [rounded]="true"
                      pTooltip="Edit Lead"
                      (click)="openEditDialog(lead)"
                    ></button>
                    <button
                      pButton
                      icon="pi pi-eye"
                      severity="info"
                      size="small"
                      [text]="true"
                      [rounded]="true"
                      pTooltip="View Details"
                      [routerLink]="['/leads', lead.id]"
                    ></button>
                    <button
                      pButton
                      icon="pi pi-comments"
                      severity="secondary"
                      size="small"
                      [text]="true"
                      [rounded]="true"
                      pTooltip="Open Floating Chat"
                      (click)="openFloatingChat(lead)"
                    ></button>
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="9">
                  <div class="empty-state">
                    <i class="pi pi-inbox empty-icon"></i>
                    <p class="empty-text">No leads found</p>
                    <p class="empty-subtext">Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>

      <!-- Edit Dialog -->
      <app-lead-edit-dialog
        [lead]="selectedLead()"
        [(visible)]="editDialogVisible"
        (leadUpdated)="onLeadUpdated($event)"
      />

      <!-- Manual Upload Dialog -->
      <p-dialog
        header="Add Lead Manually"
        [(visible)]="manualUploadVisible"
        [modal]="true"
        [style]="{ width: '500px' }"
        [closable]="true"
        [draggable]="false"
        [resizable]="false"
      >
        <div class="manual-upload-form">
          <div class="form-field">
            <label for="phoneNumber">Phone Number *</label>
            <input
              pInputText
              id="phoneNumber"
              [(ngModel)]="manualLead.phoneNumber"
              placeholder="+1234567890"
              class="form-input"
            />
          </div>
          <div class="form-field">
            <label for="name">Name</label>
            <input
              pInputText
              id="name"
              [(ngModel)]="manualLead.name"
              placeholder="Customer name"
              class="form-input"
            />
          </div>
          <div class="form-field">
            <label for="email">Email</label>
            <input
              pInputText
              id="email"
              type="email"
              [(ngModel)]="manualLead.email"
              placeholder="customer@example.com"
              class="form-input"
            />
          </div>
          <div class="form-field">
            <label for="businessName">Business Name</label>
            <input
              pInputText
              id="businessName"
              [(ngModel)]="manualLead.businessName"
              placeholder="Business name"
              class="form-input"
            />
          </div>
          <div class="form-field">
            <label for="category">Category</label>
            <p-select
              [options]="categoryOptions"
              [(ngModel)]="manualLead.categoryId"
              placeholder="Select category"
              [showClear]="true"
              class="form-input"
            />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <button
              pButton
              label="Cancel"
              severity="secondary"
              [outlined]="true"
              (click)="manualUploadVisible = false"
            ></button>
            <button
              pButton
              label="Add Lead"
              severity="success"
              [loading]="manualUploading()"
              [disabled]="!manualLead.phoneNumber"
              (click)="submitManualLead()"
            ></button>
          </div>
        </ng-template>
      </p-dialog>

      <!-- Bulk Upload Dialog -->
      <p-dialog
        header="Bulk Upload Leads"
        [(visible)]="bulkUploadVisible"
        [modal]="true"
        [style]="{ width: '600px' }"
        [closable]="true"
        [draggable]="false"
        [resizable]="false"
      >
        <div class="bulk-upload-content">
          <div class="upload-instructions">
            <h4>Upload Instructions</h4>
            <ul>
              <li>Upload a CSV file with lead data</li>
              <li>Required columns: <strong>phoneNumber</strong></li>
              <li>
                Optional columns:
                <strong>name, email, businessName, categoryName</strong>
              </li>
              <li>Maximum file size: 5MB</li>
              <li>Maximum 1000 leads per upload</li>
            </ul>
            <p>
              <strong>Note:</strong> If categoryName is provided, it will be
              matched with existing categories.
            </p>
          </div>

          @if (uploadProgress() > 0 && uploadProgress() < 100) {
          <div class="upload-progress">
            <p>Uploading... {{ uploadProgress() }}%</p>
            <p-progressBar [value]="uploadProgress()" />
          </div>
          } @if (uploadResult()) {
          <div
            class="upload-result"
            [class.success]="uploadResult()!.success"
            [class.error]="!uploadResult()!.success"
          >
            <h4>
              {{
                uploadResult()!.success ? 'Upload Successful' : 'Upload Failed'
              }}
            </h4>
            <p>{{ uploadResult()!.message }}</p>
            @if (uploadResult()!.details) {
            <div class="result-details">
              <p>
                <strong>Total processed:</strong>
                {{ uploadResult()!.details!.total }}
              </p>
              <p>
                <strong>Successfully created:</strong>
                {{ uploadResult()!.details!.created }}
              </p>
              <p>
                <strong>Skipped (duplicates):</strong>
                {{ uploadResult()!.details!.skipped }}
              </p>
              @if (uploadResult()!.details!.errors &&
              uploadResult()!.details!.errors.length > 0) {
              <div class="error-list">
                <p><strong>Errors:</strong></p>
                <ul>
                  @for (error of uploadResult()!.details!.errors; track $index)
                  {
                  <li>Row {{ error.row }}: {{ error.message }}</li>
                  }
                </ul>
              </div>
              }
            </div>
            }
          </div>
          }

          <p-fileUpload
            #fileUpload
            mode="basic"
            accept=".csv"
            [maxFileSize]="5000000"
            [auto]="false"
            chooseLabel="Choose CSV File"
            [showUploadButton]="false"
            [showCancelButton]="false"
            (onSelect)="onFileSelect($event)"
            (onClear)="onFileClear()"
            styleClass="bulk-upload-input"
          />
        </div>
        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <button
              pButton
              label="Cancel"
              severity="secondary"
              [outlined]="true"
              (click)="closeBulkUploadDialog()"
            ></button>
            <button
              pButton
              label="Upload"
              severity="success"
              [loading]="bulkUploading()"
              [disabled]="!selectedFile() || bulkUploading()"
              (click)="submitBulkUpload()"
            ></button>
          </div>
        </ng-template>
      </p-dialog>
    </app-layout>
    }
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

      .header-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .action-buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .view-toggle {
        display: flex;
        gap: 0.25rem;
        background: #f1f5f9;
        padding: 0.25rem;
        border-radius: 8px;
      }

      .view-toggle button {
        border-radius: 6px;
      }

      .active-view {
        background: white !important;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

      .filter-card {
        background: white;
        border-radius: 16px;
        padding: 1.25rem 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        border: 1px solid #e5e7eb;
      }

      .filter-grid {
        display: grid;
        grid-template-columns: 1.5fr repeat(3, 1fr);
        gap: 1rem;
        align-items: end;
      }

      .filter-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .filter-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      /* Modern Search Input */
      .search-item {
        grid-column: span 1;
      }

      .search-wrapper {
        position: relative;
        width: 100%;
      }

      .search-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
        font-size: 0.9rem;
        z-index: 1;
        pointer-events: none;
      }

      .search-input {
        width: 100%;
        padding: 0.75rem 2.5rem 0.75rem 2.75rem !important;
        border: 2px solid #e5e7eb !important;
        border-radius: 10px !important;
        font-size: 0.875rem;
        background: #f9fafb;
        transition: all 0.2s ease;
      }

      .search-input::placeholder {
        color: #9ca3af;
      }

      .search-input:hover {
        border-color: #d1d5db !important;
        background: white;
      }

      .search-input:focus {
        border-color: #3b82f6 !important;
        background: white;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        outline: none;
      }

      .clear-search {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
        font-size: 0.8rem;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 50%;
        transition: all 0.2s;
      }

      .clear-search:hover {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
      }

      /* Filter Dropdowns */
      :host ::ng-deep .filter-dropdown {
        width: 100%;
        border-radius: 10px !important;

        .p-select {
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          background: #f9fafb;
          transition: all 0.2s ease;

          &:hover {
            border-color: #d1d5db;
            background: white;
          }

          &.p-focus {
            border-color: #3b82f6;
            background: white;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
        }
      }

      /* Filter Actions */
      .filter-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #f1f5f9;
      }

      .filter-toggles {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .toggle-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: #f1f5f9;
        border: 2px solid transparent;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 500;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .toggle-chip:hover {
        background: #e2e8f0;
        color: #475569;
      }

      .toggle-chip.active {
        background: rgba(16, 185, 129, 0.1);
        border-color: #10b981;
        color: #059669;
      }

      .toggle-chip.active i {
        color: #10b981;
      }

      .clear-filters-btn {
        color: #ef4444 !important;
        font-size: 0.8rem;
      }

      .clear-filters-btn:hover {
        background: rgba(239, 68, 68, 0.1) !important;
      }

      .table-card {
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      :host ::ng-deep .modern-table {
        .p-datatable-header {
          background: transparent;
          border: none;
          padding: 1rem 1.5rem;
        }

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

        .p-paginator {
          border: none;
          padding: 1rem;
          background: transparent;
        }
      }

      .phone-number {
        font-weight: 600;
        color: #1f2937;
      }

      .customer-name {
        color: #374151;
      }

      .category-badge {
        background: #f1f5f9;
        color: #475569;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 500;
      }

      /* Source Badge Styles */
      .source-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.7rem;
        font-weight: 500;
        white-space: nowrap;
      }

      .source-badge i {
        font-size: 0.7rem;
      }

      .source-indiamart {
        background: rgba(255, 153, 0, 0.15);
        color: #cc7a00;
      }

      .source-tradeindia {
        background: rgba(0, 128, 0, 0.15);
        color: #006600;
      }

      .source-gmail {
        background: rgba(234, 67, 53, 0.15);
        color: #c5221f;
      }

      .source-outlook {
        background: rgba(0, 120, 212, 0.15);
        color: #0078d4;
      }

      .source-zoho {
        background: rgba(226, 35, 26, 0.15);
        color: #e2231a;
      }

      .source-email {
        background: rgba(107, 114, 128, 0.15);
        color: #4b5563;
      }

      .source-whatsapp {
        background: rgba(37, 211, 102, 0.15);
        color: #128c7e;
      }

      .source-meta,
      .source-facebook {
        background: rgba(24, 119, 242, 0.15);
        color: #1877f2;
      }

      .source-website {
        background: rgba(99, 102, 241, 0.15);
        color: #4f46e5;
      }

      .source-manual {
        background: rgba(156, 163, 175, 0.15);
        color: #6b7280;
      }

      .source-bulk {
        background: rgba(16, 185, 129, 0.15);
        color: #059669;
      }

      .source-default {
        background: #f1f5f9;
        color: #475569;
      }

      /* Notes text */
      .notes-text {
        color: #6b7280;
        font-size: 0.8rem;
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: inline-block;
        cursor: default;
      }

      :host ::ng-deep .status-tag {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: capitalize;
      }

      .assigned-to {
        color: #6b7280;
      }

      .date-text {
        color: #9ca3af;
        font-size: 0.875rem;
      }

      .action-buttons {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }

      .claim-btn {
        font-size: 0.75rem;
        padding: 0.5rem 1rem;
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
        margin: 0 0 0.5rem 0;
      }

      .empty-subtext {
        color: #9ca3af;
        margin: 0;
      }

      @media (max-width: 768px) {
        .page-container {
          padding: 1rem;
        }

        .page-title {
          font-size: 1.5rem;
        }

        .hidden-mobile {
          display: none !important;
        }

        .header-actions {
          width: 100%;
          justify-content: space-between;
        }

        .action-buttons {
          flex-direction: column;
          width: 100%;
        }

        .filter-grid {
          grid-template-columns: 1fr;
        }

        .filter-actions {
          flex-direction: column;
          gap: 1rem;
          align-items: flex-start;
        }

        :host ::ng-deep .modern-table {
          .p-datatable-thead > tr > th,
          .p-datatable-tbody > tr > td {
            padding: 0.75rem 1rem;
          }
        }
      }

      @media (max-width: 1024px) and (min-width: 769px) {
        .filter-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      /* Dialog Styles */
      .manual-upload-form {
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

      .form-input {
        width: 100%;
      }

      .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }

      .bulk-upload-content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .upload-instructions {
        background: #f8fafc;
        padding: 1rem;
        border-radius: 8px;
        border-left: 4px solid #3b82f6;
      }

      .upload-instructions h4 {
        margin: 0 0 0.75rem 0;
        color: #1f2937;
        font-size: 1rem;
      }

      .upload-instructions ul {
        margin: 0;
        padding-left: 1.25rem;
        color: #4b5563;
      }

      .upload-instructions li {
        margin-bottom: 0.25rem;
      }

      .upload-progress {
        background: #f0f9ff;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #bae6fd;
      }

      .upload-progress p {
        margin: 0 0 0.5rem 0;
        color: #0369a1;
        font-weight: 500;
      }

      .upload-result {
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid;
      }

      .upload-result.success {
        background: #f0fdf4;
        border-color: #bbf7d0;
        color: #166534;
      }

      .upload-result.error {
        background: #fef2f2;
        border-color: #fecaca;
        color: #dc2626;
      }

      .upload-result h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1rem;
      }

      .upload-result p {
        margin: 0 0 0.75rem 0;
      }

      .result-details p {
        margin: 0.25rem 0;
        font-size: 0.875rem;
      }

      .error-list {
        margin-top: 0.75rem;
        max-height: 150px;
        overflow-y: auto;
      }

      .error-list ul {
        margin: 0.5rem 0 0 0;
        padding-left: 1.25rem;
        font-size: 0.8rem;
      }

      .error-list li {
        margin-bottom: 0.25rem;
      }

      :host ::ng-deep .bulk-upload-input {
        width: 100%;
      }

      :host ::ng-deep .bulk-upload-input .p-fileupload-choose {
        width: 100%;
        justify-content: center;
      }
    `,
  ],
})
export class LeadListComponent implements OnInit {
  leads = signal<ILead[]>([]);
  loading = signal(false);
  currentView = signal<'table' | 'kanban'>('table');
  selectedStatus: string | null = null;
  selectedCategory: string | null = null;
  selectedAssignee: string | null = null;
  searchQuery = '';
  showUnassignedOnly = false;

  // Edit dialog
  selectedLead = signal<ILead | null>(null);
  editDialogVisible = false;

  // Manual upload
  manualUploadVisible = false;
  manualUploading = signal(false);
  manualLead = {
    phoneNumber: '',
    name: '',
    email: '',
    businessName: '',
    categoryId: null as string | null,
  };

  // Bulk upload
  bulkUploadVisible = false;
  bulkUploading = signal(false);
  selectedFile = signal<File | null>(null);
  uploadProgress = signal(0);
  uploadResult = signal<{
    success: boolean;
    message: string;
    details?: {
      total: number;
      created: number;
      skipped: number;
      errors: Array<{ row: number; message: string }>;
    };
  } | null>(null);

  // Categories for manual upload
  categories = signal<ICategory[]>([]);
  categoryOptions: Array<{ label: string; value: string }> = [];

  // Dynamic statuses from database
  statuses = signal<ILeadStatus[]>([]);
  statusOptions: Array<{ label: string; value: string }> = [];

  // Users for filter
  userOptions: Array<{ label: string; value: string }> = [];

  constructor(
    private leadService: LeadService,
    public authService: AuthService,
    private messageService: MessageService,
    private kanbanStateService: KanbanStateService,
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private apiService: ApiService,
    private floatingChatService: FloatingChatService,
    private leadStatusService: LeadStatusService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Load categories for manual upload
    this.loadCategories();
    // Load dynamic statuses
    this.loadStatuses();
    // Load users for filter
    this.loadUsers();

    // Check for view preference from local storage or query params
    const savedPref = this.kanbanStateService.getViewPreference();

    // Check query params first
    this.route.queryParams.subscribe((params) => {
      const previousView = this.currentView();

      if (params['view'] === 'kanban') {
        this.currentView.set('kanban');
      } else if (params['view'] === 'table') {
        this.currentView.set('table');
      } else {
        this.currentView.set(savedPref.view);
      }

      // Load leads when switching to table view or when initially loading table view
      if (this.currentView() === 'table') {
        this.loadLeads();
      }
    });
  }

  switchToKanban(): void {
    this.kanbanStateService.setViewPreference('kanban');
    this.currentView.set('kanban');
    this.router.navigate([], {
      queryParams: { view: 'kanban' },
      queryParamsHandling: 'merge',
    });
  }

  switchToTable(): void {
    this.kanbanStateService.setViewPreference('table');
    this.currentView.set('table');
    this.router.navigate([], {
      queryParams: { view: 'table' },
      queryParamsHandling: 'merge',
    });
    this.loadLeads();
  }

  loadLeads(): void {
    this.loading.set(true);
    const filters: ILeadFilter = {};
    if (this.selectedStatus) {
      filters.status = [this.selectedStatus];
    }
    if (this.selectedCategory) {
      filters.categoryId = this.selectedCategory;
    }
    if (this.selectedAssignee) {
      filters.assignedToId = this.selectedAssignee;
    }
    if (this.searchQuery?.trim()) {
      filters.search = this.searchQuery.trim();
    }
    if (this.showUnassignedOnly) {
      filters.unassignedOnly = true;
    }

    this.leadService.getLeads(filters).subscribe({
      next: (response) => {
        this.leads.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load leads',
        });
      },
    });
  }

  claimLead(lead: ILead): void {
    this.leadService.claimLead(lead.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Lead claimed successfully',
        });
        this.loadLeads();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to claim lead',
        });
      },
    });
  }

  getStatusSeverity(
    status: string
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    // Find the status in dynamic statuses
    const statusObj = this.statuses().find(
      (s) => s.name.toLowerCase() === status?.toLowerCase()
    );
    if (statusObj) {
      // Map statusType to severity
      switch (statusObj.statusType) {
        case 'positive':
          return 'success';
        case 'negative':
          return 'danger';
        default:
          // Use color-based mapping as fallback
          if (statusObj.color?.includes('10B981')) return 'success';
          if (statusObj.color?.includes('EF4444')) return 'danger';
          if (statusObj.color?.includes('F59E0B')) return 'warn';
          return 'info';
      }
    }
    // Fallback for legacy statuses
    const lowerStatus = status?.toLowerCase();
    if (lowerStatus === 'won') return 'success';
    if (lowerStatus === 'lost') return 'danger';
    if (lowerStatus === 'contacted' || lowerStatus === 'negotiation')
      return 'warn';
    if (lowerStatus === 'qualified') return 'contrast';
    return 'info';
  }

  // Source display helpers
  getSourceIcon(source: string): string {
    const sourceIcons: Record<string, string> = {
      IndiaMART: 'pi pi-globe',
      TradeIndia: 'pi pi-globe',
      Gmail: 'pi pi-envelope',
      Outlook: 'pi pi-envelope',
      'Zoho Mail': 'pi pi-envelope',
      'Email (IMAP)': 'pi pi-envelope',
      WhatsApp: 'pi pi-whatsapp',
      'Meta Ads': 'pi pi-facebook',
      Facebook: 'pi pi-facebook',
      Website: 'pi pi-desktop',
      'Manual Entry': 'pi pi-user',
      'Bulk Upload': 'pi pi-upload',
    };
    return sourceIcons[source] || 'pi pi-question-circle';
  }

  getSourceClass(source: string): string {
    const sourceClasses: Record<string, string> = {
      IndiaMART: 'source-indiamart',
      TradeIndia: 'source-tradeindia',
      Gmail: 'source-gmail',
      Outlook: 'source-outlook',
      'Zoho Mail': 'source-zoho',
      'Email (IMAP)': 'source-email',
      WhatsApp: 'source-whatsapp',
      'Meta Ads': 'source-meta',
      Facebook: 'source-facebook',
      Website: 'source-website',
      'Manual Entry': 'source-manual',
      'Bulk Upload': 'source-bulk',
    };
    return sourceClasses[source] || 'source-default';
  }

  truncateNotes(notes: string | null | undefined): string {
    if (!notes) return '-';
    return notes.length > 40 ? notes.substring(0, 40) + '...' : notes;
  }

  loadStatuses(): void {
    this.leadStatusService.getAll().subscribe({
      next: (response) => {
        this.statuses.set(response.data);
        this.statusOptions = response.data
          .filter((s) => s.isActive)
          .sort((a, b) => a.order - b.order)
          .map((s) => ({
            label: s.name,
            value: s.name,
          }));
      },
      error: () => {
        console.warn('Failed to load statuses');
      },
    });
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (response: { data: Array<{ id: string; name: string }> }) => {
        this.userOptions = response.data.map((user) => ({
          label: user.name,
          value: user.id,
        }));
      },
      error: () => {
        console.warn('Failed to load users');
      },
    });
  }

  // Search and filter helpers
  onSearchChange(): void {
    // Debounce search - load after user stops typing
    clearTimeout((this as any).searchTimeout);
    (this as any).searchTimeout = setTimeout(() => {
      this.loadLeads();
    }, 300);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadLeads();
  }

  toggleUnassigned(): void {
    this.showUnassignedOnly = !this.showUnassignedOnly;
    this.loadLeads();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.selectedStatus ||
      this.selectedCategory ||
      this.selectedAssignee ||
      this.searchQuery ||
      this.showUnassignedOnly
    );
  }

  clearAllFilters(): void {
    this.selectedStatus = null;
    this.selectedCategory = null;
    this.selectedAssignee = null;
    this.searchQuery = '';
    this.showUnassignedOnly = false;
    this.loadLeads();
  }

  openEditDialog(lead: ILead): void {
    this.selectedLead.set(lead);
    this.editDialogVisible = true;
  }

  onLeadUpdated(updatedLead: ILead): void {
    // Update the lead in the list
    const leads = this.leads();
    const index = leads.findIndex((l) => l.id === updatedLead.id);
    if (index !== -1) {
      leads[index] = updatedLead;
      this.leads.set([...leads]);
    }
  }

  openFloatingChat(lead: ILead): void {
    this.floatingChatService.openChat(lead);
  }

  // Categories
  loadCategories(): void {
    this.categoryService.loadCategories().subscribe({
      next: (response) => {
        this.categories.set(response.data);
        this.categoryOptions = response.data.map((cat) => ({
          label: cat.name,
          value: cat.id,
        }));
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load categories',
        });
      },
    });
  }

  // Manual Upload
  openManualUploadDialog(): void {
    this.resetManualForm();
    this.manualUploadVisible = true;
  }

  resetManualForm(): void {
    this.manualLead = {
      phoneNumber: '',
      name: '',
      email: '',
      businessName: '',
      categoryId: null,
    };
  }

  submitManualLead(): void {
    if (!this.manualLead.phoneNumber.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Phone number is required',
      });
      return;
    }

    this.manualUploading.set(true);

    const leadData = {
      phoneNumber: this.manualLead.phoneNumber.trim(),
      name: this.manualLead.name.trim() || undefined,
      email: this.manualLead.email.trim() || undefined,
      businessName: this.manualLead.businessName.trim() || undefined,
      categoryId: this.manualLead.categoryId || undefined,
    };

    this.leadService.createLead(leadData).subscribe({
      next: () => {
        this.manualUploading.set(false);
        this.manualUploadVisible = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Lead created successfully',
        });
        this.loadLeads();
      },
      error: (error) => {
        this.manualUploading.set(false);
        const errorMessage = error.error?.message || 'Failed to create lead';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
        });
      },
    });
  }

  // Bulk Upload
  openBulkUploadDialog(): void {
    this.resetBulkUpload();
    this.bulkUploadVisible = true;
  }

  closeBulkUploadDialog(): void {
    this.bulkUploadVisible = false;
    this.resetBulkUpload();
  }

  resetBulkUpload(): void {
    this.selectedFile.set(null);
    this.uploadProgress.set(0);
    this.uploadResult.set(null);
  }

  onFileSelect(event: any): void {
    const file = event.files[0];
    if (file) {
      this.selectedFile.set(file);
      this.uploadResult.set(null);
    }
  }

  onFileClear(): void {
    this.selectedFile.set(null);
    this.uploadResult.set(null);
  }

  submitBulkUpload(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.bulkUploading.set(true);
    this.uploadProgress.set(0);
    this.uploadResult.set(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      const current = this.uploadProgress();
      if (current < 90) {
        this.uploadProgress.set(current + 10);
      }
    }, 200);

    this.leadService.bulkUploadLeads(file).subscribe({
      next: (response) => {
        clearInterval(progressInterval);
        this.uploadProgress.set(100);
        this.bulkUploading.set(false);

        this.uploadResult.set({
          success: true,
          message: 'Bulk upload completed successfully',
          details: response.data,
        });

        // Refresh leads list
        this.loadLeads();
      },
      error: (error) => {
        clearInterval(progressInterval);
        this.uploadProgress.set(0);
        this.bulkUploading.set(false);

        const errorMessage = error.error?.message || 'Bulk upload failed';
        this.uploadResult.set({
          success: false,
          message: errorMessage,
          details: error.error?.details,
        });
      },
    });
  }

  downloadTemplate(): void {
    // Create CSV template
    const csvContent =
      'phoneNumber,name,email,businessName,categoryName\n+1234567890,John Doe,john@example.com,Acme Corp,Technology';

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'leads_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);

    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Template downloaded successfully',
    });
  }
}
