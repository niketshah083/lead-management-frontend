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
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
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
    TextareaModule,
    SelectModule,
    TooltipModule,
    LayoutComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './auto-reply-list.component.html',
  styleUrl: './auto-reply-list.component.scss',
})
export class AutoReplyListComponent implements OnInit {
  @ViewChild('dt') table!: Table;

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

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.table?.filterGlobal(target.value, 'contains');
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
