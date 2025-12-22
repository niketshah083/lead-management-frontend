import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import {
  IUser,
  ILoginCredentials,
  ITokenResponse,
  IApiResponse,
} from '../models';

const TOKEN_KEY = 'access_token';
const USER_KEY = 'current_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSignal = signal<IUser | null>(null);
  private tokenSignal = signal<string | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');
  readonly isManager = computed(
    () => this.currentUserSignal()?.role === 'manager'
  );
  readonly isCustomerExecutive = computed(
    () => this.currentUserSignal()?.role === 'customer_executive'
  );

  constructor(private apiService: ApiService, private router: Router) {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as IUser;
        this.tokenSignal.set(token);
        this.currentUserSignal.set(user);
      } catch {
        this.clearAuth();
      }
    }
  }

  login(
    credentials: ILoginCredentials
  ): Observable<IApiResponse<ITokenResponse>> {
    return this.apiService.post<ITokenResponse>('auth/login', credentials).pipe(
      tap((response) => {
        const { accessToken, user } = response.data;
        this.setAuth(accessToken, user);
      }),
      catchError((error) => {
        this.clearAuth();
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  private setAuth(token: string, user: IUser): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.tokenSignal.set(token);
    this.currentUserSignal.set(user);
  }

  private clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
  }

  hasRole(roles: string[]): boolean {
    const user = this.currentUserSignal();
    return user ? roles.includes(user.role) : false;
  }
}
