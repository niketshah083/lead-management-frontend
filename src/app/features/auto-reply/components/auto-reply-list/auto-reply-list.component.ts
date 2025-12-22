import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';
import {
  AutoReplyService,
  IAutoReplyTemplate,
  ICreateAutoReplyTemplate,
} from '../../../../core/services/auto-reply.service';
import { CategoryService } from '../../../category/services/category.service';
import { AuthService } from '../../../../core/services';
import { ICategory } from '../../../../core/models';

@Component({
  selector: 'app-auto-reply-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    FormsModule,
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
            <h1 class="page-title">Auto-Reply Templates</h1>
            <p class="page-subtitle">Manage automated response templates</p>
          </div>
          @if (authService.isAdmin()) {
          <button
            pButton
            label="Add Template"
            icon="pi pi-plus"
            class="add-btn"
            (click)="openCreateDialog()"
          ></button>
          }
        </div>

        <div class="table-card">
          <p-table
            [value]="templates()"
            [loading]="loading()"
            [paginator]="true"
            [rows]="10"
          >
            <ng-template pTemplate="header">
              <tr>
                <th style="width: 15%">Trigger Keyword</th>
                <th style="width: 35%">Message Content</th>
                <th style="width: 15%">Category</th>
                <th style="width: 10%">Priority</th>
                <th style="width: 10%">Status</th>
                <th style="width: 15%">Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-template>
              <tr>
                <td>
                  <span class="keyword-badge">{{
                    template.triggerKeyword
                  }}</span>
                </td>
                <td>
                  <div class="message-preview">
                    {{ template.messageContent }}
                  </div>
                </td>
                <td>
                  @if (template.category) {
                  <p-tag [value]="template.category.name" severity="info" />
                  } @else {
                  <span class="text-muted">-</span>
                  }
                </td>
                <td>
                  <span class="priority-badge">{{ template.priority }}</span>
                </td>
                <td>
                  <p-tag
                    [value]="template.isActive ? 'Active' : 'Inactive'"
                    [severity]="template.isActive ? 'success' : 'danger'"
                  />
                </td>
                <td>
                  @if (authService.isAdmin()) {
                  <div class="action-buttons">
                    <button
                      pButton
                      icon="pi pi-pencil"
                      [text]="true"
                      [rounded]="true"
                      severity="info"
                      (click)="openEditDialog(template)"
                    ></button>
                    <button
                      pButton
                      icon="pi pi-trash"
                      [text]="true"
                      [rounded]="true"
                      severity="danger"
                      (click)="confirmDelete(template)"
                    ></button>
                  </div>
                  }
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="6">
                  <div class="empty-state">
                    <i class="pi pi-comments"></i>
                    <h3>No auto-reply templates found</h3>
                    <p>Create your first template to automate responses</p>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>

      <!-- Create/Edit Dialog -->
      <p-dialog
        [(visible)]="dialogVisible"
        [header]="isEditing ? 'Edit Template' : 'Create Template'"
        [modal]="true"
        [style]="{ width: '600px' }"
      >
        <div class="form-grid">
          <div class="form-field">
            <label>Category *</label>
            <p-select
              [(ngModel)]="formData.categoryId"
              [options]="categoryOptions()"
              optionLabel="name"
              optionValue="id"
              placeholder="Select a category"
              class="w-full"
            />
          </div>
          <div class="form-field">
            <label>Trigger Keyword *</label>
            <input
              pInputText
              [(ngModel)]="formData.triggerKeyword"
              class="w-full"
              placeholder="e.g., hello, price, info"
            />
            <small class="hint"
              >The keyword that triggers this auto-reply</small
            >
          </div>
          <div class="form-field">
            <label>Priority</label>
            <p-inputNumber
              [(ngModel)]="formData.priority"
              [min]="0"
              [max]="100"
              class="w-full"
            />
            <small class="hint"
              >Higher priority templates are matched first</small
            >
          </div>
          <div class="form-field">
            <label>Message Content *</label>
            <textarea
              pTextarea
              [(ngModel)]="formData.messageContent"
              rows="5"
              class="w-full"
              placeholder="Enter the auto-reply message..."
            ></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button
            pButton
            label="Cancel"
            severity="secondary"
            (click)="dialogVisible = false"
          ></button>
          <button
            pButton
            [label]="isEditing ? 'Update' : 'Create'"
            (click)="saveTemplate()"
            [loading]="saving()"
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
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .page-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
      }
      .page-subtitle {
        color: #6b7280;
        margin: 0.25rem 0 0;
      }
      .add-btn {
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        border: none;
      }
      .table-card {
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      .keyword-badge {
        background: #e0f2fe;
        color: #0369a1;
        padding: 0.25rem 0.75rem;
        border-radius: 6px;
        font-weight: 500;
        font-size: 0.875rem;
      }
      .priority-badge {
        background: #f3f4f6;
        color: #374151;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-weight: 600;
      }
      .message-preview {
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #6b7280;
      }
      .text-muted {
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
        color: #6b7280;
      }
      .empty-state i {
        font-size: 3rem;
        color: #d1d5db;
        margin-bottom: 1rem;
      }
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
      .hint {
        color: #9ca3af;
        font-size: 0.75rem;
      }
      .w-full {
        width: 100%;
      }
    `,
  ],
})
export class AutoReplyListComponent implements OnInit {
  templates = signal<IAutoReplyTemplate[]>([]);
  categoryOptions = signal<ICategory[]>([]);
  loading = signal(false);
  saving = signal(false);
  dialogVisible = false;
  isEditing = false;
  editingId = '';

  formData: ICreateAutoReplyTemplate = {
    triggerKeyword: '',
    messageContent: '',
    categoryId: '',
    priority: 0,
  };

  constructor(
    private autoReplyService: AutoReplyService,
    private categoryService: CategoryService,
    public authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
    this.loadCategories();
  }

  loadTemplates(): void {
    this.loading.set(true);
    this.autoReplyService.getAll().subscribe({
      next: (res) => {
        this.templates.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load templates',
        });
      },
    });
  }

  loadCategories(): void {
    this.categoryService.loadCategories().subscribe({
      next: (res) => this.categoryOptions.set(res.data),
    });
  }

  openCreateDialog(): void {
    this.isEditing = false;
    this.formData = {
      triggerKeyword: '',
      messageContent: '',
      categoryId: '',
      priority: 0,
    };
    this.dialogVisible = true;
  }

  openEditDialog(template: IAutoReplyTemplate): void {
    this.isEditing = true;
    this.editingId = template.id;
    this.formData = {
      triggerKeyword: template.triggerKeyword,
      messageContent: template.messageContent,
      categoryId: template.categoryId,
      priority: template.priority,
    };
    this.dialogVisible = true;
  }

  saveTemplate(): void {
    if (
      !this.formData.triggerKeyword ||
      !this.formData.messageContent ||
      !this.formData.categoryId
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Category, trigger keyword and message are required',
      });
      return;
    }
    this.saving.set(true);
    const obs = this.isEditing
      ? this.autoReplyService.update(this.editingId, this.formData)
      : this.autoReplyService.create(this.formData);

    obs.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: this.isEditing ? 'Template updated' : 'Template created',
        });
        this.dialogVisible = false;
        this.saving.set(false);
        this.loadTemplates();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save template',
        });
      },
    });
  }

  confirmDelete(template: IAutoReplyTemplate): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the template with keyword "${template.triggerKeyword}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteTemplate(template.id),
    });
  }

  deleteTemplate(id: string): void {
    this.autoReplyService.delete(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Template deleted',
        });
        this.loadTemplates();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete template',
        });
      },
    });
  }
}
