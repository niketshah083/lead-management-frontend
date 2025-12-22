import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CategoryService } from '../../services';
import { ICategory } from '../../../../core/models';
import { AuthService } from '../../../../core/services';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
    LayoutComponent,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <app-layout>
      <p-toast />
      <p-confirmDialog />
      <div class="page-container">
        <div class="page-header">
          <div>
            <h1 class="page-title">Categories</h1>
            <p class="page-subtitle">
              Manage product categories and media assets
            </p>
          </div>
          @if (authService.isAdmin()) {
          <button
            pButton
            label="Add Category"
            icon="pi pi-plus"
            (click)="navigateToCreate()"
            class="add-btn"
          ></button>
          }
        </div>

        <div class="table-card">
          <p-table
            [value]="categoryService.categories()"
            [loading]="categoryService.loading()"
            [paginator]="true"
            [rows]="10"
            styleClass="modern-table"
            [responsiveLayout]="'scroll'"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Name</th>
                <th class="hidden-mobile">Description</th>
                <th class="hidden-mobile">Keywords</th>
                <th>Media</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-category>
              <tr>
                <td>
                  <span class="category-name">{{ category.name }}</span>
                </td>
                <td class="hidden-mobile">
                  <span class="desc-text"
                    >{{ category.description | slice : 0 : 50 }}...</span
                  >
                </td>
                <td class="hidden-mobile">
                  <div class="keywords-wrap">
                    @for (keyword of category.keywords.slice(0, 3); track
                    keyword) {
                    <span class="keyword-badge">{{ keyword }}</span>
                    } @if (category.keywords.length > 3) {
                    <span class="more-badge"
                      >+{{ category.keywords.length - 3 }}</span
                    >
                    }
                  </div>
                </td>
                <td>
                  <span class="media-count"
                    >{{ category.media?.length || 0 }} files</span
                  >
                </td>
                <td>
                  <div
                    class="status-badge"
                    [class.active]="category.isActive"
                    [class.inactive]="!category.isActive"
                  >
                    <span class="status-dot"></span
                    >{{ category.isActive ? 'Active' : 'Inactive' }}
                  </div>
                </td>
                <td>
                  <div class="action-buttons">
                    <button
                      pButton
                      icon="pi pi-eye"
                      [rounded]="true"
                      [text]="true"
                      pTooltip="View"
                      (click)="viewCategory(category)"
                    ></button>
                    @if (authService.isAdmin()) {
                    <button
                      pButton
                      icon="pi pi-pencil"
                      [rounded]="true"
                      [text]="true"
                      severity="info"
                      pTooltip="Edit"
                      (click)="editCategory(category)"
                    ></button>
                    <button
                      pButton
                      icon="pi pi-trash"
                      [rounded]="true"
                      [text]="true"
                      severity="danger"
                      pTooltip="Delete"
                      (click)="confirmDelete(category)"
                    ></button>
                    }
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="6" class="empty-state">
                  <i class="pi pi-tags empty-icon"></i>
                  <p>No categories found</p>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
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
      .add-btn {
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        border: none;
      }
      .table-card {
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
      .category-name {
        font-weight: 600;
        color: #1f2937;
      }
      .desc-text {
        color: #6b7280;
        font-size: 0.875rem;
      }
      .keywords-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
      }
      .keyword-badge {
        background: #e0f2fe;
        color: #0369a1;
        padding: 0.125rem 0.5rem;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 500;
      }
      .more-badge {
        background: #f1f5f9;
        color: #64748b;
        padding: 0.125rem 0.5rem;
        border-radius: 12px;
        font-size: 0.7rem;
      }
      .media-count {
        color: #6b7280;
        font-size: 0.875rem;
      }
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 500;
      }
      .status-badge.active {
        background: #d1fae5;
        color: #059669;
      }
      .status-badge.inactive {
        background: #fee2e2;
        color: #dc2626;
      }
      .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
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
      }
    `,
  ],
})
export class CategoryListComponent implements OnInit {
  constructor(
    public categoryService: CategoryService,
    public authService: AuthService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.loadCategories().subscribe({
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load categories',
        });
      },
    });
  }

  navigateToCreate(): void {
    this.router.navigate(['/categories/create']);
  }
  viewCategory(category: ICategory): void {
    this.router.navigate(['/categories', category.id]);
  }
  editCategory(category: ICategory): void {
    this.router.navigate(['/categories', category.id, 'edit']);
  }

  confirmDelete(category: ICategory): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${category.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteCategory(category);
      },
    });
  }

  private deleteCategory(category: ICategory): void {
    this.categoryService.deleteCategory(category.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Category deleted successfully',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete category',
        });
      },
    });
  }
}
