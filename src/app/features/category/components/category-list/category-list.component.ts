import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
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
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
    InputTextModule,
    LayoutComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss',
})
export class CategoryListComponent implements OnInit {
  @ViewChild('dt') table!: Table;

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

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.table?.filterGlobal(target.value, 'contains');
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
