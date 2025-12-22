import { Routes } from '@angular/router';
import { authGuard } from './core/guards';
import { UserRole } from './core/models';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/components/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/compact-dashboard.component').then(
        (m) => m.CompactDashboardComponent
      ),
  },
  {
    path: 'leads',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            './features/leads/components/lead-list/lead-list.component'
          ).then((m) => m.LeadListComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import(
            './features/leads/components/lead-detail/lead-detail.component'
          ).then((m) => m.LeadDetailComponent),
      },
      {
        path: ':id/chat',
        loadComponent: () =>
          import('./features/leads/components/chat/chat.component').then(
            (m) => m.ChatComponent
          ),
      },
    ],
  },
  {
    path: 'categories',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            './features/category/components/category-list/category-list.component'
          ).then((m) => m.CategoryListComponent),
      },
      {
        path: 'create',
        canActivate: [authGuard],
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () =>
          import(
            './features/category/components/category-form/category-form.component'
          ).then((m) => m.CategoryFormComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import(
            './features/category/components/category-detail/category-detail.component'
          ).then((m) => m.CategoryDetailComponent),
      },
      {
        path: ':id/edit',
        canActivate: [authGuard],
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () =>
          import(
            './features/category/components/category-form/category-form.component'
          ).then((m) => m.CategoryFormComponent),
      },
    ],
  },
  {
    path: 'users',
    canActivate: [authGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            './features/users/components/user-list/user-list.component'
          ).then((m) => m.UserListComponent),
      },
      {
        path: 'create',
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () =>
          import(
            './features/users/components/user-form/user-form.component'
          ).then((m) => m.UserFormComponent),
      },
      {
        path: ':id/edit',
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () =>
          import(
            './features/users/components/user-form/user-form.component'
          ).then((m) => m.UserFormComponent),
      },
    ],
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
    loadComponent: () =>
      import('./features/reports/reports.component').then(
        (m) => m.ReportsComponent
      ),
  },
  {
    path: 'sla',
    canActivate: [authGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
    loadComponent: () =>
      import('./features/sla/components/sla-list/sla-list.component').then(
        (m) => m.SlaListComponent
      ),
  },
  {
    path: 'auto-reply',
    canActivate: [authGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
    loadComponent: () =>
      import(
        './features/auto-reply/components/auto-reply-list/auto-reply-list.component'
      ).then((m) => m.AutoReplyListComponent),
  },
  {
    path: 'lead-statuses',
    canActivate: [authGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
    loadComponent: () =>
      import(
        './features/lead-status/components/lead-status-list/lead-status-list.component'
      ).then((m) => m.LeadStatusListComponent),
  },
  {
    path: 'connectors',
    canActivate: [authGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            './features/connectors/components/connector-list/connector-list.component'
          ).then((m) => m.ConnectorListComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import(
            './features/connectors/components/connector-detail/connector-detail.component'
          ).then((m) => m.ConnectorDetailComponent),
      },
    ],
  },
  {
    path: 'business-types',
    canActivate: [authGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
    loadComponent: () =>
      import(
        './features/business-type/components/business-type-list/business-type-list.component'
      ).then((m) => m.BusinessTypeListComponent),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./shared/components/unauthorized/unauthorized.component').then(
        (m) => m.UnauthorizedComponent
      ),
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
