import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { IApiResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Observable<IApiResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, String(params[key]));
        }
      });
    }
    return this.http.get<IApiResponse<T>>(`${this.baseUrl}/${endpoint}`, {
      params: httpParams,
    });
  }

  post<T>(endpoint: string, body: unknown): Observable<IApiResponse<T>> {
    return this.http.post<IApiResponse<T>>(`${this.baseUrl}/${endpoint}`, body);
  }

  postFormData<T>(
    endpoint: string,
    formData: FormData
  ): Observable<IApiResponse<T>> {
    return this.http.post<IApiResponse<T>>(
      `${this.baseUrl}/${endpoint}`,
      formData
    );
  }

  put<T>(endpoint: string, body: unknown): Observable<IApiResponse<T>> {
    return this.http.put<IApiResponse<T>>(`${this.baseUrl}/${endpoint}`, body);
  }

  delete<T>(endpoint: string): Observable<IApiResponse<T>> {
    return this.http.delete<IApiResponse<T>>(`${this.baseUrl}/${endpoint}`);
  }

  uploadFiles<T>(
    endpoint: string,
    files: File[],
    fieldName: string = 'files'
  ): Observable<IApiResponse<T>> {
    const formData = new FormData();
    // Ensure files is an array before iterating
    const fileArray = Array.isArray(files) ? files : [];
    fileArray.forEach((file) => {
      formData.append(fieldName, file, file.name);
    });
    return this.http.post<IApiResponse<T>>(
      `${this.baseUrl}/${endpoint}`,
      formData
    );
  }

  /**
   * Upload a single file
   */
  uploadFile<T>(
    endpoint: string,
    file: File,
    fieldName: string = 'file'
  ): Observable<IApiResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, file, file.name);
    return this.http.post<IApiResponse<T>>(
      `${this.baseUrl}/${endpoint}`,
      formData
    );
  }

  patch<T>(endpoint: string, body: unknown): Observable<IApiResponse<T>> {
    return this.http.patch<IApiResponse<T>>(
      `${this.baseUrl}/${endpoint}`,
      body
    );
  }

  getBlob(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Observable<Blob> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, String(params[key]));
        }
      });
    }
    return this.http.get(`${this.baseUrl}/${endpoint}`, {
      params: httpParams,
      responseType: 'blob',
    });
  }

  /**
   * Extract data from API response
   */
  extractData<T>(response: IApiResponse<T>): T {
    return response.data;
  }

  /**
   * Get array data directly (extracts from response.data)
   */
  getArray<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Observable<T[]> {
    return this.get<T[]>(endpoint, params).pipe(
      map((response) => response.data || [])
    );
  }
}
