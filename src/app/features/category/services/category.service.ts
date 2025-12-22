import { Injectable, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import {
  ICategory,
  ICreateCategory,
  IUpdateCategory,
  IMedia,
  IApiResponse,
} from '../../../core/models';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private categoriesSignal = signal<ICategory[]>([]);
  private loadingSignal = signal<boolean>(false);
  private selectedCategorySignal = signal<ICategory | null>(null);

  readonly categories = this.categoriesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly selectedCategory = this.selectedCategorySignal.asReadonly();
  readonly activeCategories = computed(() =>
    this.categoriesSignal().filter((c) => c.isActive)
  );

  constructor(private apiService: ApiService) {}

  /**
   * Load all categories
   */
  loadCategories(): Observable<IApiResponse<ICategory[]>> {
    this.loadingSignal.set(true);
    return this.apiService.get<ICategory[]>('categories').pipe(
      tap((response) => {
        this.categoriesSignal.set(response.data);
        this.loadingSignal.set(false);
      })
    );
  }

  /**
   * Get a single category by ID
   */
  getCategory(id: string): Observable<IApiResponse<ICategory>> {
    return this.apiService.get<ICategory>(`categories/${id}`).pipe(
      tap((response) => {
        this.selectedCategorySignal.set(response.data);
      })
    );
  }

  /**
   * Create a new category
   */
  createCategory(
    category: ICreateCategory
  ): Observable<IApiResponse<ICategory>> {
    return this.apiService.post<ICategory>('categories', category).pipe(
      tap((response) => {
        this.categoriesSignal.update((categories) => [
          response.data,
          ...categories,
        ]);
      })
    );
  }

  /**
   * Update a category
   */
  updateCategory(
    id: string,
    category: IUpdateCategory
  ): Observable<IApiResponse<ICategory>> {
    return this.apiService.put<ICategory>(`categories/${id}`, category).pipe(
      tap((response) => {
        this.categoriesSignal.update((categories) =>
          categories.map((c) => (c.id === id ? response.data : c))
        );
        if (this.selectedCategorySignal()?.id === id) {
          this.selectedCategorySignal.set(response.data);
        }
      })
    );
  }

  /**
   * Delete (soft-delete) a category
   */
  deleteCategory(id: string): Observable<IApiResponse<void>> {
    return this.apiService.delete<void>(`categories/${id}`).pipe(
      tap(() => {
        this.categoriesSignal.update((categories) =>
          categories.filter((c) => c.id !== id)
        );
        if (this.selectedCategorySignal()?.id === id) {
          this.selectedCategorySignal.set(null);
        }
      })
    );
  }

  /**
   * Upload media files to a category
   */
  uploadMedia(
    categoryId: string,
    files: File[]
  ): Observable<IApiResponse<IMedia[]>> {
    return this.apiService
      .uploadFiles<IMedia[]>(`categories/${categoryId}/media`, files)
      .pipe(
        tap((response) => {
          // Update the category with new media
          this.categoriesSignal.update((categories) =>
            categories.map((c) => {
              if (c.id === categoryId) {
                return {
                  ...c,
                  media: [...(c.media || []), ...response.data],
                };
              }
              return c;
            })
          );
        })
      );
  }

  /**
   * Delete media from a category
   */
  deleteMedia(
    categoryId: string,
    mediaId: string
  ): Observable<IApiResponse<void>> {
    return this.apiService
      .delete<void>(`categories/${categoryId}/media/${mediaId}`)
      .pipe(
        tap(() => {
          this.categoriesSignal.update((categories) =>
            categories.map((c) => {
              if (c.id === categoryId) {
                return {
                  ...c,
                  media: (c.media || []).filter((m) => m.id !== mediaId),
                };
              }
              return c;
            })
          );
        })
      );
  }

  /**
   * Get media for a category
   */
  getMedia(categoryId: string): Observable<IApiResponse<IMedia[]>> {
    return this.apiService.get<IMedia[]>(`categories/${categoryId}/media`);
  }

  /**
   * Clear selected category
   */
  clearSelectedCategory(): void {
    this.selectedCategorySignal.set(null);
  }
}
