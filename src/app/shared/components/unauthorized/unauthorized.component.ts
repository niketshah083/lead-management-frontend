import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  template: `
    <div class="unauthorized-container">
      <div class="unauthorized-card">
        <div class="icon-wrapper">
          <i class="pi pi-lock"></i>
        </div>
        <h1 class="title">Access Denied</h1>
        <p class="message">You don't have permission to access this page.</p>
        <p class="submessage">
          Please contact your administrator if you believe this is an error.
        </p>
        <button
          pButton
          label="Go to Dashboard"
          icon="pi pi-home"
          [routerLink]="['/dashboard']"
          class="home-btn"
        ></button>
      </div>
    </div>
  `,
  styles: [
    `
      .unauthorized-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
      }

      .unauthorized-card {
        background: white;
        border-radius: 24px;
        padding: 3rem;
        text-align: center;
        max-width: 400px;
        width: 100%;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      }

      .icon-wrapper {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.5rem;
      }

      .icon-wrapper i {
        font-size: 2.5rem;
        color: white;
      }

      .title {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 0.75rem 0;
      }

      .message {
        color: #374151;
        font-size: 1rem;
        margin: 0 0 0.5rem 0;
      }

      .submessage {
        color: #9ca3af;
        font-size: 0.875rem;
        margin: 0 0 2rem 0;
      }

      .home-btn {
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        border: none;
        padding: 0.875rem 2rem;
        font-weight: 600;
      }

      @media (max-width: 480px) {
        .unauthorized-card {
          padding: 2rem;
          border-radius: 16px;
        }

        .icon-wrapper {
          width: 60px;
          height: 60px;
        }

        .icon-wrapper i {
          font-size: 2rem;
        }

        .title {
          font-size: 1.5rem;
        }
      }
    `,
  ],
})
export class UnauthorizedComponent {}
