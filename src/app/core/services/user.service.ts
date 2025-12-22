import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { IApiResponse, IUser, ICreateUser, IUpdateUser } from '../models';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly basePath = 'users';

  constructor(private apiService: ApiService) {}

  getUsers(): Observable<IApiResponse<IUser[]>> {
    return this.apiService.get<IUser[]>(this.basePath);
  }

  getUser(id: string): Observable<IApiResponse<IUser>> {
    return this.apiService.get<IUser>(`${this.basePath}/${id}`);
  }

  createUser(data: ICreateUser): Observable<IApiResponse<IUser>> {
    return this.apiService.post<IUser>(this.basePath, data);
  }

  updateUser(id: string, data: IUpdateUser): Observable<IApiResponse<IUser>> {
    return this.apiService.put<IUser>(`${this.basePath}/${id}`, data);
  }

  deactivateUser(id: string): Observable<IApiResponse<void>> {
    return this.apiService.delete<void>(`${this.basePath}/${id}`);
  }

  getManagers(): Observable<IApiResponse<IUser[]>> {
    // Get all users and filter managers on the client side
    // since backend doesn't have a dedicated managers endpoint
    return this.apiService.get<IUser[]>(`${this.basePath}`).pipe(
      map((response) => ({
        ...response,
        data: response.data.filter(
          (user) => user.role === 'manager' || user.role === 'admin'
        ),
      }))
    );
  }

  assignCEToManager(
    ceId: string,
    managerId: string
  ): Observable<IApiResponse<IUser>> {
    return this.apiService.post<IUser>(
      `${this.basePath}/${ceId}/assign-manager/${managerId}`,
      {}
    );
  }

  unassignManager(ceId: string): Observable<IApiResponse<IUser>> {
    return this.apiService.delete<IUser>(
      `${this.basePath}/${ceId}/unassign-manager`
    );
  }

  getTeamMembers(managerId: string): Observable<IApiResponse<IUser[]>> {
    return this.apiService.get<IUser[]>(
      `${this.basePath}/manager/${managerId}/team`
    );
  }

  assignCategories(
    userId: string,
    categoryIds: string[]
  ): Observable<IApiResponse<IUser>> {
    return this.apiService.put<IUser>(`${this.basePath}/${userId}/categories`, {
      categoryIds,
    });
  }

  addCategory(
    userId: string,
    categoryId: string
  ): Observable<IApiResponse<IUser>> {
    return this.apiService.post<IUser>(
      `${this.basePath}/${userId}/categories/${categoryId}`,
      {}
    );
  }

  removeCategory(
    userId: string,
    categoryId: string
  ): Observable<IApiResponse<IUser>> {
    return this.apiService.delete<IUser>(
      `${this.basePath}/${userId}/categories/${categoryId}`
    );
  }

  getUserCategories(userId: string): Observable<IApiResponse<any[]>> {
    return this.apiService.get<any[]>(`${this.basePath}/${userId}/categories`);
  }
}
