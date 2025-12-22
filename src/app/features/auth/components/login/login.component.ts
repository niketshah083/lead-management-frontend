import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../core/services';
import { ILoginCredentials } from '../../../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="login-container">
      <div class="login-wrapper">
        <!-- Left side - Branding -->
        <div class="login-branding">
          <div class="branding-content">
            <div class="logo-container">
              <i class="pi pi-whatsapp logo-icon"></i>
            </div>
            <h1 class="brand-title">WhatsApp Lead Management</h1>
            <p class="brand-subtitle">
              Streamline your customer conversations and boost sales with our
              powerful CRM solution
            </p>
            <div class="features-list">
              <div class="feature-item">
                <i class="pi pi-check-circle"></i
                ><span>Real-time messaging</span>
              </div>
              <div class="feature-item">
                <i class="pi pi-check-circle"></i
                ><span>Lead tracking & analytics</span>
              </div>
              <div class="feature-item">
                <i class="pi pi-check-circle"></i
                ><span>Team collaboration</span>
              </div>
              <div class="feature-item">
                <i class="pi pi-check-circle"></i><span>SLA management</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right side - Login Form -->
        <div class="login-form-container">
          <div class="login-form-wrapper">
            <div class="form-header">
              <h2 class="form-title">Welcome Back</h2>
              <p class="form-subtitle">Sign in to continue to your dashboard</p>
            </div>

            <form (ngSubmit)="onSubmit()" class="login-form">
              @if (error()) {
              <div class="error-message">
                <i class="pi pi-exclamation-circle"></i>
                <span>{{ error() }}</span>
              </div>
              }

              <div class="form-field">
                <label for="email" class="field-label">Email Address</label>
                <div class="input-group">
                  <span class="input-icon"><i class="pi pi-envelope"></i></span>
                  <input
                    pInputText
                    id="email"
                    type="email"
                    [(ngModel)]="credentials.email"
                    name="email"
                    placeholder="Enter your email"
                    required
                    class="form-input with-icon"
                  />
                </div>
              </div>

              <div class="form-field">
                <label for="password" class="field-label">Password</label>
                <div class="input-group password-group">
                  <span class="input-icon"><i class="pi pi-lock"></i></span>
                  <p-password
                    id="password"
                    [(ngModel)]="credentials.password"
                    name="password"
                    placeholder="Enter your password"
                    [feedback]="false"
                    [toggleMask]="true"
                    styleClass="password-field"
                    inputStyleClass="form-input with-icon"
                    required
                  />
                </div>
              </div>

              <button
                pButton
                type="submit"
                label="Sign In"
                [loading]="loading()"
                class="submit-button"
                icon="pi pi-sign-in"
              ></button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .login-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
      }

      .login-wrapper {
        display: flex;
        width: 100%;
        max-width: 1000px;
        background: white;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      }

      .login-branding {
        flex: 1;
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        padding: 3rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }

      .branding-content {
        text-align: center;
      }

      .logo-container {
        width: 80px;
        height: 80px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.5rem;
        backdrop-filter: blur(10px);
      }

      .logo-icon {
        font-size: 2.5rem;
        color: white;
      }
      .brand-title {
        font-size: 1.75rem;
        font-weight: 700;
        margin-bottom: 0.75rem;
        line-height: 1.2;
      }
      .brand-subtitle {
        font-size: 0.95rem;
        opacity: 0.9;
        line-height: 1.6;
        margin-bottom: 2rem;
      }
      .features-list {
        text-align: left;
        display: inline-block;
      }
      .feature-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
        font-size: 0.9rem;
      }
      .feature-item i {
        color: rgba(255, 255, 255, 0.9);
      }

      .login-form-container {
        flex: 1;
        padding: 3rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .login-form-wrapper {
        width: 100%;
        max-width: 360px;
      }
      .form-header {
        text-align: center;
        margin-bottom: 2rem;
      }
      .form-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.5rem;
      }
      .form-subtitle {
        color: #6b7280;
        font-size: 0.95rem;
      }
      .login-form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .error-message {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.875rem 1rem;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 12px;
        color: #dc2626;
        font-size: 0.875rem;
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .field-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
      }

      .input-group {
        position: relative;
        display: flex;
        align-items: center;
      }

      .input-icon {
        position: absolute;
        left: 1rem;
        z-index: 1;
        color: #9ca3af;
        display: flex;
        align-items: center;
        pointer-events: none;
      }

      .form-input {
        width: 100%;
        padding: 0.875rem 1rem;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        font-size: 0.95rem;
        transition: all 0.2s ease;
      }

      .form-input.with-icon {
        padding-left: 2.75rem !important;
      }

      .form-input:focus {
        border-color: #25d366;
        box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.1);
        outline: none;
      }

      .password-group {
        width: 100%;
      }

      :host ::ng-deep .password-field {
        width: 100%;
      }

      :host ::ng-deep .password-field input {
        width: 100%;
        padding: 0.875rem 2.5rem 0.875rem 2.75rem !important;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        font-size: 0.95rem;
      }

      :host ::ng-deep .password-field input:focus {
        border-color: #25d366;
        box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.1);
        outline: none;
      }

      :host ::ng-deep .password-field .p-password-toggle-icon {
        right: 1rem;
        color: #9ca3af;
      }

      .submit-button {
        width: 100%;
        padding: 0.875rem 1.5rem;
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        border: none;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        margin-top: 0.5rem;
        transition: all 0.2s ease;
      }

      .submit-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(37, 211, 102, 0.3);
      }

      .demo-credentials {
        margin-top: 2rem;
        padding: 1rem;
        background: #f9fafb;
        border-radius: 12px;
        border: 1px dashed #d1d5db;
      }

      .demo-title {
        font-size: 0.75rem;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.75rem;
        text-align: center;
      }

      .credentials-grid {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .credential-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        flex-wrap: wrap;
      }

      .credential-item .role {
        font-weight: 600;
        color: #374151;
        min-width: 60px;
      }
      .credential-item .email {
        color: #6b7280;
      }
      .credential-item .pass {
        color: #25d366;
        font-family: monospace;
        background: #ecfdf5;
        padding: 0.125rem 0.375rem;
        border-radius: 4px;
      }

      @media (max-width: 768px) {
        .login-wrapper {
          flex-direction: column;
          max-width: 420px;
        }
        .login-branding {
          padding: 2rem;
        }
        .brand-title {
          font-size: 1.5rem;
        }
        .features-list {
          display: none;
        }
        .login-form-container {
          padding: 2rem;
        }
        .form-title {
          font-size: 1.5rem;
        }
      }

      @media (max-width: 480px) {
        .login-container {
          padding: 0.5rem;
        }
        .login-wrapper {
          border-radius: 16px;
        }
        .login-branding {
          padding: 1.5rem;
        }
        .logo-container {
          width: 60px;
          height: 60px;
        }
        .logo-icon {
          font-size: 2rem;
        }
        .brand-title {
          font-size: 1.25rem;
        }
        .brand-subtitle {
          font-size: 0.85rem;
        }
        .login-form-container {
          padding: 1.5rem;
        }
        .form-title {
          font-size: 1.25rem;
        }
        .credential-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.25rem;
        }
      }
    `,
  ],
})
export class LoginComponent {
  credentials: ILoginCredentials = { email: '', password: '' };
  loading = signal(false);
  error = signal<string | null>(null);
  private returnUrl: string = '/';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit(): void {
    if (!this.credentials.email || !this.credentials.password) {
      this.error.set('Please enter email and password');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.router.navigate([this.returnUrl]);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err.error?.message || 'Login failed. Please check your credentials.'
        );
        this.messageService.add({
          severity: 'error',
          summary: 'Login Failed',
          detail: err.error?.message || 'Please check your credentials.',
        });
      },
    });
  }
}
