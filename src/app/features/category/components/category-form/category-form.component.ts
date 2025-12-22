import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Chip } from 'primeng/chip';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CategoryService } from '../../services';
import {
  ICreateCategory,
  IUpdateCategory,
  IMedia,
  MediaType,
} from '../../../../core/models';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    Chip,
    FileUploadModule,
    ToastModule,
    ConfirmDialogModule,
    LayoutComponent,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <app-layout>
      <p-toast />
      <div class="page-container">
        <div class="page-header">
          <div>
            <h1 class="page-title">
              {{ isEditMode() ? 'Edit Category' : 'Create Category' }}
            </h1>
            <p class="page-subtitle">
              {{
                isEditMode()
                  ? 'Update category information'
                  : 'Add a new product category'
              }}
            </p>
          </div>
          <button
            pButton
            label="Back to Categories"
            icon="pi pi-arrow-left"
            [text]="true"
            [routerLink]="['/categories']"
          ></button>
        </div>

        <div class="form-card">
          <form (ngSubmit)="onSubmit()" class="form-content">
            <div class="form-group">
              <label for="name" class="form-label"
                >Category Name <span class="required">*</span></label
              >
              <input
                pInputText
                id="name"
                [(ngModel)]="formData.name"
                name="name"
                placeholder="Enter category name"
                required
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="description" class="form-label"
                >Description <span class="required">*</span></label
              >
              <textarea
                pTextarea
                id="description"
                [(ngModel)]="formData.description"
                name="description"
                placeholder="Enter category description"
                rows="4"
                required
                class="form-input"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label"
                >Keywords <span class="required">*</span></label
              >
              <div class="keyword-input-row">
                <input
                  pInputText
                  [(ngModel)]="newKeyword"
                  name="keywordInput"
                  placeholder="Type keyword and press Enter"
                  (keydown.enter)="addKeyword($event)"
                  class="form-input"
                />
                <button
                  pButton
                  type="button"
                  icon="pi pi-plus"
                  (click)="addKeywordFromButton()"
                  [disabled]="!newKeyword"
                ></button>
              </div>
              <div class="keywords-wrap">
                @for (keyword of formData.keywords; track keyword; let i =
                $index) {
                <p-chip
                  [label]="keyword"
                  [removable]="true"
                  (onRemove)="removeKeyword(i)"
                  styleClass="keyword-chip"
                />
                }
              </div>
              <small class="form-hint"
                >Press Enter or click + to add keywords</small
              >
            </div>

            <div class="form-group">
              <label class="form-label">Media Files</label>

              <!-- Existing Media (Edit Mode) -->
              @if (existingMedia().length > 0) {
              <div class="existing-media-section">
                <p class="section-title">Current Media</p>
                <div class="media-grid">
                  @for (media of existingMedia(); track media.id) {
                  <div
                    class="media-item"
                    [class.removing]="mediaToRemove().includes(media.id)"
                  >
                    @if (media.type === 'image') {
                    <div class="media-preview image-preview">
                      <img
                        [src]="media.signedUrl || media.url"
                        [alt]="media.filename"
                      />
                    </div>
                    } @else if (media.type === 'document') {
                    <div class="media-preview document-preview">
                      <i class="pi pi-file-pdf"></i>
                    </div>
                    } @else {
                    <div class="media-preview video-preview">
                      <i class="pi pi-video"></i>
                    </div>
                    }
                    <div class="media-info">
                      <span class="media-name" [title]="media.filename">{{
                        media.filename
                      }}</span>
                      <span class="media-size">{{
                        formatFileSize(media.size)
                      }}</span>
                    </div>
                    <div class="media-actions">
                      @if (mediaToRemove().includes(media.id)) {
                      <button
                        pButton
                        type="button"
                        icon="pi pi-undo"
                        [rounded]="true"
                        [text]="true"
                        severity="success"
                        pTooltip="Undo remove"
                        (click)="undoRemoveMedia(media.id)"
                      ></button>
                      } @else {
                      <button
                        pButton
                        type="button"
                        icon="pi pi-trash"
                        [rounded]="true"
                        [text]="true"
                        severity="danger"
                        pTooltip="Remove"
                        (click)="markMediaForRemoval(media.id)"
                      ></button>
                      }
                    </div>
                    @if (mediaToRemove().includes(media.id)) {
                    <div class="remove-overlay">
                      <span>Will be removed</span>
                    </div>
                    }
                  </div>
                  }
                </div>
                @if (mediaToRemove().length > 0) {
                <p class="remove-warning">
                  <i class="pi pi-exclamation-triangle"></i>
                  {{ mediaToRemove().length }} file(s) will be removed when you
                  save
                </p>
                }
              </div>
              }

              <!-- Upload New Media -->
              <div class="upload-section">
                <p class="section-title">
                  {{ isEditMode() ? 'Add New Media' : 'Upload Media' }}
                </p>
                <p-fileUpload
                  name="files"
                  [multiple]="true"
                  accept="image/*,video/*,.pdf"
                  [maxFileSize]="104857600"
                  (onSelect)="onFilesSelected($event)"
                  (onRemove)="onFileRemoved($event)"
                  [showUploadButton]="false"
                  [showCancelButton]="false"
                  [styleClass]="'file-upload'"
                >
                  <ng-template pTemplate="content">
                    <div class="upload-content">
                      <i class="pi pi-cloud-upload upload-icon"></i>
                      <p class="upload-text">
                        Drag and drop files here or click to browse
                      </p>
                      <small class="upload-hint"
                        >Images (jpg, png, webp), Videos (mp4, webm), Documents
                        (pdf)</small
                      >
                    </div>
                  </ng-template>
                </p-fileUpload>
              </div>

              <!-- Newly Selected Files -->
              @if (selectedFiles().length > 0) {
              <div class="selected-files">
                <p class="files-title">New files to upload:</p>
                @for (file of selectedFiles(); track file.name) {
                <div class="file-item">
                  <i
                    class="pi"
                    [class.pi-image]="isImage(file)"
                    [class.pi-file-pdf]="isPdf(file)"
                    [class.pi-video]="isVideo(file)"
                    [class.pi-file]="
                      !isImage(file) && !isPdf(file) && !isVideo(file)
                    "
                  ></i>
                  <span>{{ file.name }}</span>
                  <span class="file-size"
                    >({{ formatFileSize(file.size) }})</span
                  >
                  <button
                    pButton
                    type="button"
                    icon="pi pi-times"
                    [rounded]="true"
                    [text]="true"
                    severity="danger"
                    (click)="removeFile(file)"
                    class="remove-file-btn"
                  ></button>
                </div>
                }
              </div>
              }
            </div>

            <p-confirmDialog />

            <div class="form-actions">
              <button
                pButton
                type="button"
                label="Cancel"
                severity="secondary"
                [outlined]="true"
                [routerLink]="['/categories']"
              ></button>
              <button
                pButton
                type="submit"
                [label]="isEditMode() ? 'Update Category' : 'Create Category'"
                [loading]="saving()"
                class="submit-btn"
              ></button>
            </div>
          </form>
        </div>
      </div>
    </app-layout>
  `,
  styles: [
    `
      .page-container {
        padding: 1.5rem;
        max-width: 800px;
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
      .form-card {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      .form-content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .form-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
      }
      .required {
        color: #ef4444;
      }
      .form-input {
        width: 100%;
      }
      .keyword-input-row {
        display: flex;
        gap: 0.5rem;
      }
      .keyword-input-row input {
        flex: 1;
      }
      .keywords-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
      :host ::ng-deep .keyword-chip {
        background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
      }
      .form-hint {
        color: #9ca3af;
        font-size: 0.75rem;
      }
      :host ::ng-deep .file-upload {
        width: 100%;
      }
      :host ::ng-deep .file-upload .p-fileupload-content {
        border: 2px dashed #e5e7eb;
        border-radius: 12px;
        background: #f9fafb;
      }
      .upload-content {
        text-align: center;
        padding: 2rem;
      }
      .upload-icon {
        font-size: 2.5rem;
        color: #9ca3af;
        margin-bottom: 0.5rem;
      }
      .upload-text {
        color: #374151;
        margin: 0 0 0.25rem 0;
      }
      .upload-hint {
        color: #9ca3af;
      }
      .selected-files {
        margin-top: 1rem;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 8px;
      }
      .files-title {
        font-weight: 600;
        color: #374151;
        margin: 0 0 0.5rem 0;
        font-size: 0.875rem;
      }
      .file-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0;
        color: #6b7280;
        font-size: 0.875rem;
      }
      .file-size {
        color: #9ca3af;
        flex: 1;
      }
      .remove-file-btn {
        width: 1.5rem;
        height: 1.5rem;
        padding: 0;
      }
      .existing-media-section {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 12px;
      }
      .section-title {
        font-weight: 600;
        color: #374151;
        margin: 0 0 1rem 0;
        font-size: 0.9rem;
      }
      .upload-section {
        margin-top: 1rem;
      }
      .media-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 1rem;
      }
      .media-item {
        position: relative;
        background: white;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
        transition: all 0.2s ease;
      }
      .media-item:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      .media-item.removing {
        opacity: 0.5;
      }
      .media-preview {
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f1f5f9;
      }
      .media-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .media-preview i {
        font-size: 2.5rem;
        color: #64748b;
      }
      .document-preview i {
        color: #ef4444;
      }
      .video-preview i {
        color: #3b82f6;
      }
      .media-info {
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .media-name {
        font-size: 0.75rem;
        color: #374151;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .media-size {
        font-size: 0.7rem;
        color: #9ca3af;
      }
      .media-actions {
        position: absolute;
        top: 0.25rem;
        right: 0.25rem;
      }
      .media-actions button {
        width: 1.75rem;
        height: 1.75rem;
        background: rgba(255, 255, 255, 0.9) !important;
      }
      .remove-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(239, 68, 68, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
      .remove-overlay span {
        background: #ef4444;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 500;
      }
      .remove-warning {
        margin-top: 1rem;
        padding: 0.75rem;
        background: #fef3c7;
        border-radius: 8px;
        color: #92400e;
        font-size: 0.8rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .remove-warning i {
        color: #f59e0b;
      }
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1rem;
        padding-top: 1.5rem;
        border-top: 1px solid #e5e7eb;
      }
      .submit-btn {
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        border: none;
      }
      @media (max-width: 640px) {
        .page-container {
          padding: 1rem;
        }
        .page-title {
          font-size: 1.5rem;
        }
        .form-card {
          padding: 1.5rem;
        }
      }
    `,
  ],
})
export class CategoryFormComponent implements OnInit {
  isEditMode = signal(false);
  saving = signal(false);
  categoryId = signal<string | null>(null);
  selectedFiles = signal<File[]>([]);
  existingMedia = signal<IMedia[]>([]);
  mediaToRemove = signal<string[]>([]);
  formData: ICreateCategory = { name: '', description: '', keywords: [] };
  newKeyword = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.categoryId.set(id);
      this.loadCategory(id);
    }
  }

  private loadCategory(id: string): void {
    this.categoryService.getCategory(id).subscribe({
      next: (response) => {
        const cat = response.data;
        this.formData = {
          name: cat.name,
          description: cat.description,
          keywords: [...cat.keywords],
        };
        // Load existing media
        if (cat.media && cat.media.length > 0) {
          this.existingMedia.set(cat.media);
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load category',
        });
        this.router.navigate(['/categories']);
      },
    });
  }

  onFilesSelected(event: any): void {
    // PrimeNG FileUpload provides currentFiles (all selected) and files (newly added)
    const files = event.currentFiles || event.files || [];
    // Ensure we have an array of File objects
    this.selectedFiles.set(Array.isArray(files) ? [...files] : []);
  }

  onSubmit(): void {
    if (
      !this.formData.name ||
      !this.formData.description ||
      this.formData.keywords.length === 0
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fill in all required fields',
      });
      return;
    }
    this.saving.set(true);
    if (this.isEditMode()) {
      this.updateCategory();
    } else {
      this.createCategory();
    }
  }

  private createCategory(): void {
    this.categoryService.createCategory(this.formData).subscribe({
      next: (response) => {
        const categoryId = response.data.id;
        if (this.selectedFiles().length > 0) {
          // Upload media files after category creation
          this.categoryService
            .uploadMedia(categoryId, this.selectedFiles())
            .subscribe({
              next: () => {
                this.saving.set(false);
                this.messageService.add({
                  severity: 'success',
                  summary: 'Success',
                  detail: 'Category created with media successfully',
                });
                this.router.navigate(['/categories', categoryId]);
              },
              error: () => {
                this.saving.set(false);
                this.messageService.add({
                  severity: 'warn',
                  summary: 'Warning',
                  detail: 'Category created but some files failed to upload',
                });
                this.router.navigate(['/categories', categoryId]);
              },
            });
        } else {
          this.saving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Category created successfully',
          });
          this.router.navigate(['/categories', categoryId]);
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to create category',
        });
      },
    });
  }

  private updateCategory(): void {
    const id = this.categoryId();
    if (!id) return;
    const updateData: IUpdateCategory = {
      name: this.formData.name,
      description: this.formData.description,
      keywords: this.formData.keywords,
    };
    this.categoryService.updateCategory(id, updateData).subscribe({
      next: () => {
        // First remove marked media, then upload new files
        this.processMediaChanges(id);
      },
      error: (err) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to update category',
        });
      },
    });
  }

  private async processMediaChanges(categoryId: string): Promise<void> {
    // Remove marked media files
    const mediaToRemoveIds = this.mediaToRemove();
    if (mediaToRemoveIds.length > 0) {
      for (const mediaId of mediaToRemoveIds) {
        try {
          await this.categoryService
            .deleteMedia(categoryId, mediaId)
            .toPromise();
        } catch (error) {
          console.warn(`Failed to delete media ${mediaId}`, error);
        }
      }
    }

    // Upload new files
    if (this.selectedFiles().length > 0) {
      this.uploadFiles(categoryId);
    } else {
      this.onUpdateSuccess();
    }
  }

  private uploadFiles(categoryId: string): void {
    this.categoryService
      .uploadMedia(categoryId, this.selectedFiles())
      .subscribe({
        next: () => {
          this.onUpdateSuccess();
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Category updated but some files failed to upload',
          });
          this.router.navigate(['/categories', categoryId]);
        },
      });
  }

  private onUpdateSuccess(): void {
    this.saving.set(false);
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Category updated successfully',
    });
    this.router.navigate(['/categories', this.categoryId()]);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  addKeyword(event: Event): void {
    event.preventDefault();
    this.addKeywordFromButton();
  }
  addKeywordFromButton(): void {
    const keyword = this.newKeyword.trim();
    if (keyword && !this.formData.keywords.includes(keyword)) {
      this.formData.keywords.push(keyword);
      this.newKeyword = '';
    }
  }
  removeKeyword(index: number): void {
    this.formData.keywords.splice(index, 1);
  }

  removeFile(file: File): void {
    this.selectedFiles.update((files) => files.filter((f) => f !== file));
  }

  onFileRemoved(event: { file: File }): void {
    this.removeFile(event.file);
  }

  // Media removal methods
  markMediaForRemoval(mediaId: string): void {
    this.mediaToRemove.update((ids) => [...ids, mediaId]);
  }

  undoRemoveMedia(mediaId: string): void {
    this.mediaToRemove.update((ids) => ids.filter((id) => id !== mediaId));
  }

  // File type helpers
  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  isPdf(file: File): boolean {
    return file.type === 'application/pdf';
  }

  isVideo(file: File): boolean {
    return file.type.startsWith('video/');
  }
}
