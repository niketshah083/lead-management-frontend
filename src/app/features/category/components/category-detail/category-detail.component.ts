import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { GalleriaModule } from 'primeng/galleria';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CategoryService } from '../../services';
import { AuthService } from '../../../../core/services';
import { ICategory, IMedia, MediaType } from '../../../../core/models';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';

@Component({
  selector: 'app-category-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    TagModule,
    GalleriaModule,
    ToastModule,
    LayoutComponent,
  ],
  providers: [MessageService],
  template: `
    <app-layout>
      <p-toast />
      <div class="page-container">
        <div class="page-header">
          <button
            pButton
            label="Back to Categories"
            icon="pi pi-arrow-left"
            [text]="true"
            [routerLink]="['/categories']"
          ></button>
          @if (authService.isAdmin() && category()) {
          <button
            pButton
            label="Edit Category"
            icon="pi pi-pencil"
            [routerLink]="['/categories', category()!.id, 'edit']"
            class="edit-btn"
          ></button>
          }
        </div>

        @if (loading()) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Loading category...</p>
        </div>
        } @else if (category()) {
        <div class="detail-grid">
          <div class="info-card">
            <div class="card-header">
              <h1 class="category-title">{{ category()!.name }}</h1>
              <div
                class="status-badge"
                [class.active]="category()!.isActive"
                [class.inactive]="!category()!.isActive"
              >
                <span class="status-dot"></span
                >{{ category()!.isActive ? 'Active' : 'Inactive' }}
              </div>
            </div>
            <div class="info-section">
              <h3 class="section-title">Description</h3>
              <p class="description-text">{{ category()!.description }}</p>
            </div>
            <div class="info-section">
              <h3 class="section-title">Keywords</h3>
              <div class="keywords-wrap">
                @for (keyword of category()!.keywords; track keyword) {
                <span class="keyword-badge">{{ keyword }}</span>
                }
              </div>
            </div>
          </div>

          <div class="media-card">
            <h2 class="card-title">Media Assets</h2>
            @if (images().length > 0) {
            <div class="media-section">
              <h4 class="media-title">
                <i class="pi pi-image"></i> Images ({{ images().length }})
              </h4>
              <p-galleria
                [value]="images()"
                [numVisible]="5"
                [thumbnailsPosition]="'bottom'"
                [containerStyle]="{ 'max-width': '100%' }"
              >
                <ng-template pTemplate="item" let-item>
                  <img
                    [src]="item.signedUrl || item.url"
                    [alt]="item.filename"
                    class="gallery-image"
                  />
                </ng-template>
                <ng-template pTemplate="thumbnail" let-item>
                  <img
                    [src]="item.signedUrl || item.url"
                    [alt]="item.filename"
                    class="gallery-thumb"
                  />
                </ng-template>
              </p-galleria>
            </div>
            } @if (videos().length > 0) {
            <div class="media-section">
              <h4 class="media-title">
                <i class="pi pi-video"></i> Videos ({{ videos().length }})
              </h4>
              <div class="file-list">
                @for (video of videos(); track video.id) {
                <div class="file-item">
                  <i class="pi pi-video file-icon video"></i>
                  <span class="file-name">{{ video.filename }}</span>
                  <a [href]="video.signedUrl || video.url" target="_blank"
                    ><button
                      pButton
                      icon="pi pi-external-link"
                      [text]="true"
                      [rounded]="true"
                    ></button
                  ></a>
                </div>
                }
              </div>
            </div>
            } @if (documents().length > 0) {
            <div class="media-section">
              <h4 class="media-title">
                <i class="pi pi-file-pdf"></i> Documents ({{
                  documents().length
                }})
              </h4>
              <div class="file-list">
                @for (doc of documents(); track doc.id) {
                <div class="file-item">
                  <i class="pi pi-file-pdf file-icon pdf"></i>
                  <span class="file-name">{{ doc.filename }}</span>
                  <a [href]="doc.signedUrl || doc.url" target="_blank"
                    ><button
                      pButton
                      icon="pi pi-download"
                      [text]="true"
                      [rounded]="true"
                    ></button
                  ></a>
                </div>
                }
              </div>
            </div>
            } @if (!category()!.media || category()!.media!.length === 0) {
            <div class="empty-media">
              <i class="pi pi-images"></i>
              <p>No media assets uploaded</p>
            </div>
            }
          </div>
        </div>
        } @else {
        <div class="not-found">
          <i class="pi pi-exclamation-circle"></i>
          <p>Category not found</p>
        </div>
        }
      </div>
    </app-layout>
  `,
  styles: [
    `
      .page-container {
        padding: 1.5rem;
        max-width: 1200px;
        margin: 0 auto;
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .edit-btn {
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        border: none;
      }
      .loading-state,
      .not-found {
        text-align: center;
        padding: 4rem;
        background: white;
        border-radius: 16px;
      }
      .loading-state i,
      .not-found i {
        font-size: 3rem;
        color: #d1d5db;
        margin-bottom: 1rem;
      }
      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
      }
      .info-card,
      .media-card {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .category-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
      }
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.375rem 1rem;
        border-radius: 20px;
        font-size: 0.875rem;
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
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
      }
      .info-section {
        margin-bottom: 1.5rem;
      }
      .section-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0 0 0.75rem 0;
      }
      .description-text {
        color: #374151;
        line-height: 1.6;
        margin: 0;
      }
      .keywords-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .keyword-badge {
        background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
        color: #0369a1;
        padding: 0.375rem 0.875rem;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 500;
      }
      .card-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 1.5rem 0;
      }
      .media-section {
        margin-bottom: 1.5rem;
      }
      .media-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        margin: 0 0 1rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .gallery-image {
        width: 100%;
        max-height: 300px;
        object-fit: contain;
        border-radius: 8px;
      }
      .gallery-thumb {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 4px;
      }
      .file-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .file-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        background: #f8fafc;
        border-radius: 8px;
      }
      .file-icon {
        font-size: 1.25rem;
      }
      .file-icon.video {
        color: #8b5cf6;
      }
      .file-icon.pdf {
        color: #ef4444;
      }
      .file-name {
        flex: 1;
        color: #374151;
        font-size: 0.875rem;
      }
      .empty-media {
        text-align: center;
        padding: 2rem;
        color: #9ca3af;
      }
      .empty-media i {
        font-size: 2rem;
        margin-bottom: 0.5rem;
      }
      @media (max-width: 1024px) {
        .detail-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 640px) {
        .page-container {
          padding: 1rem;
        }
        .category-title {
          font-size: 1.25rem;
        }
      }
    `,
  ],
})
export class CategoryDetailComponent implements OnInit {
  category = signal<ICategory | null>(null);
  loading = signal(true);
  images = signal<IMedia[]>([]);
  videos = signal<IMedia[]>([]);
  documents = signal<IMedia[]>([]);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    public authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCategory(id);
    } else {
      this.router.navigate(['/categories']);
    }
  }

  private loadCategory(id: string): void {
    this.loading.set(true);
    this.categoryService.getCategory(id).subscribe({
      next: (response) => {
        this.category.set(response.data);
        this.categorizeMedia(response.data.media || []);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load category',
        });
        this.loading.set(false);
      },
    });
  }

  private categorizeMedia(media: IMedia[]): void {
    this.images.set(media.filter((m) => m.type === MediaType.IMAGE));
    this.videos.set(media.filter((m) => m.type === MediaType.VIDEO));
    this.documents.set(media.filter((m) => m.type === MediaType.DOCUMENT));
  }
}
