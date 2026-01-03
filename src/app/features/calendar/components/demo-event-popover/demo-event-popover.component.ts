import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CalendarService } from '../../../../core/services';
import {
  IDemoEvent,
  DemoStatus,
  DemoOutcome,
  DemoStatusLabels,
  DemoStatusColors,
  DemoTypeLabels,
  DemoOutcomeLabels,
  DemoTimeBasedColors,
} from '../../../../core/models';

@Component({
  selector: 'app-demo-event-popover',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    TextareaModule,
    TooltipModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <!-- Main Popover -->
    <div
      class="event-popover"
      [style.top.px]="position.top"
      [style.left.px]="position.left"
      [class.imminent]="isImminent()"
      [class.overdue]="isOverdue()"
    >
      <div class="popover-header">
        <div class="header-content">
          <h3>{{ demo?.lead?.name || 'Demo' }}</h3>
          <div class="status-row">
            <span
              class="status-badge"
              [style.background-color]="getEffectiveColor()"
            >
              {{ getStatusLabel(demo?.status) }}
            </span>
            @if (isOverdue()) {
            <span class="time-badge overdue-badge">
              <i class="pi pi-exclamation-triangle"></i>
              {{ getOverdueTime() }}
            </span>
            } @else if (isImminent()) {
            <span class="time-badge imminent-badge">
              <i class="pi pi-clock"></i>
              {{ getTimeUntilStart() }}
            </span>
            } @else if (isStartingSoon()) {
            <span class="time-badge starting-soon-badge"> Starting Soon </span>
            }
          </div>
        </div>
        <button
          pButton
          icon="pi pi-times"
          [text]="true"
          [rounded]="true"
          (click)="onClose()"
        ></button>
      </div>

      <div class="popover-body">
        <!-- Date & Time -->
        <div class="popover-row">
          <i class="pi pi-calendar"></i>
          <span>{{ demo?.scheduledAt | date : 'EEEE, MMMM d, yyyy' }}</span>
        </div>
        <div class="popover-row">
          <i class="pi pi-clock"></i>
          <span
            >{{ formatTime(demo?.scheduledAt) }} ({{
              demo?.durationMinutes
            }}
            min)</span
          >
        </div>

        <!-- Demo Type -->
        <div class="popover-row">
          <i class="pi pi-tag"></i>
          <span>{{ getTypeLabel(demo?.demoType) }}</span>
        </div>

        <!-- Assigned User -->
        @if (demo?.user) {
        <div class="popover-row">
          <i class="pi pi-user"></i>
          <span>{{ demo!.user!.name }}</span>
        </div>
        }

        <!-- Meeting Link -->
        @if (demo?.meetingLink) {
        <div class="popover-row">
          <i class="pi pi-link"></i>
          <a
            [href]="demo!.meetingLink"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join Meeting
          </a>
        </div>
        }

        <!-- Notes -->
        @if (demo?.notes) {
        <div class="popover-row notes">
          <i class="pi pi-file"></i>
          <span>{{ demo!.notes }}</span>
        </div>
        }

        <!-- Outcome (for completed demos) -->
        @if (demo?.status === DemoStatus.COMPLETED && demo?.outcome) {
        <div class="popover-row outcome">
          <i class="pi pi-check-circle"></i>
          <div class="outcome-info">
            <span class="outcome-label">Outcome:</span>
            <span class="outcome-value">{{
              getOutcomeLabel(demo!.outcome!)
            }}</span>
            @if (demo!.outcomeNotes) {
            <p class="outcome-notes">{{ demo!.outcomeNotes }}</p>
            }
          </div>
        </div>
        }

        <!-- Time Window Indicator -->
        @if (isWithinStartWindow()) {
        <div class="time-window-indicator">
          <i class="pi pi-info-circle"></i>
          <span>Demo can be started now</span>
        </div>
        }
      </div>

      <div class="popover-actions">
        <!-- Start Demo Button (within time window) -->
        @if (canStartDemo()) {
        <button
          pButton
          icon="pi pi-play"
          label="Start Demo"
          class="p-button-success"
          [loading]="actionLoading()"
          (click)="onStartDemo()"
        ></button>
        }

        <!-- Complete Demo Button (for in-progress demos) -->
        @if (demo?.status === DemoStatus.IN_PROGRESS) {
        <button
          pButton
          icon="pi pi-check"
          label="Complete"
          class="p-button-success"
          (click)="openCompleteDialog()"
        ></button>
        }

        <!-- Edit Button (for scheduled/confirmed demos) -->
        @if (canEdit()) {
        <button
          pButton
          icon="pi pi-pencil"
          label="Edit"
          [outlined]="true"
          (click)="onEdit()"
        ></button>
        }

        <!-- Reschedule Button (for scheduled/confirmed demos) -->
        @if (canReschedule()) {
        <button
          pButton
          icon="pi pi-calendar-plus"
          label="Reschedule"
          [outlined]="true"
          (click)="onReschedule()"
        ></button>
        }

        <!-- Cancel Button (for scheduled/confirmed demos) -->
        @if (canCancel()) {
        <button
          pButton
          icon="pi pi-times"
          label="Cancel"
          [outlined]="true"
          severity="danger"
          (click)="openCancelDialog()"
        ></button>
        }

        <!-- Add Comment Button -->
        <button
          pButton
          icon="pi pi-comment"
          label="Add Comment"
          [outlined]="true"
          (click)="openCommentDialog()"
          pTooltip="Add a comment to this demo"
        ></button>

        <!-- View Lead Button -->
        <button
          pButton
          icon="pi pi-external-link"
          label="View Lead"
          [outlined]="true"
          (click)="onViewLead()"
        ></button>
      </div>
    </div>

    <!-- Backdrop -->
    <div class="popover-backdrop" (click)="onClose()"></div>

    <!-- Complete Demo Dialog -->
    <p-dialog
      [(visible)]="showCompleteDialog"
      header="Complete Demo"
      [modal]="true"
      [style]="{ width: '450px' }"
      [draggable]="false"
      [closable]="true"
    >
      <div class="complete-dialog-content">
        <div class="form-field">
          <label for="outcome">Outcome *</label>
          <p-select
            id="outcome"
            [(ngModel)]="selectedOutcome"
            [options]="outcomeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select outcome"
            [style]="{ width: '100%' }"
          />
        </div>
        <div class="form-field">
          <label for="outcomeNotes">Notes</label>
          <textarea
            pTextarea
            id="outcomeNotes"
            [(ngModel)]="outcomeNotes"
            rows="4"
            placeholder="Add any notes about the demo outcome..."
            [style]="{ width: '100%' }"
          ></textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button
          pButton
          label="Cancel"
          [text]="true"
          (click)="showCompleteDialog = false"
        ></button>
        <button
          pButton
          label="Complete Demo"
          [loading]="actionLoading()"
          [disabled]="!selectedOutcome"
          (click)="onCompleteDemo()"
        ></button>
      </ng-template>
    </p-dialog>

    <!-- Cancel Demo Dialog -->
    <p-dialog
      [(visible)]="showCancelDialog"
      header="Cancel Demo"
      [modal]="true"
      [style]="{ width: '450px' }"
      [draggable]="false"
      [closable]="true"
    >
      <div class="cancel-dialog-content">
        <p class="warning-text">
          <i class="pi pi-exclamation-triangle"></i>
          Are you sure you want to cancel this demo?
        </p>
        <div class="form-field">
          <label for="cancellationReason">Reason for cancellation *</label>
          <textarea
            pTextarea
            id="cancellationReason"
            [(ngModel)]="cancellationReason"
            rows="3"
            placeholder="Please provide a reason for cancellation..."
            [style]="{ width: '100%' }"
          ></textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button
          pButton
          label="Keep Demo"
          [text]="true"
          (click)="showCancelDialog = false"
        ></button>
        <button
          pButton
          label="Cancel Demo"
          severity="danger"
          [loading]="actionLoading()"
          [disabled]="!cancellationReason.trim()"
          (click)="onCancelDemo()"
        ></button>
      </ng-template>
    </p-dialog>

    <!-- Add Comment Dialog -->
    <p-dialog
      [(visible)]="showCommentDialog"
      header="Add Comment"
      [modal]="true"
      [style]="{ width: '450px' }"
      [draggable]="false"
      [closable]="true"
    >
      <div class="comment-dialog-content">
        <div class="form-field">
          <label for="commentText">Comment</label>
          <textarea
            pTextarea
            id="commentText"
            [(ngModel)]="commentText"
            rows="4"
            placeholder="Add your comment or notes..."
            [style]="{ width: '100%' }"
          ></textarea>
        </div>
        @if (demo?.notes) {
        <div class="existing-notes">
          <label>Existing Notes:</label>
          <p>{{ demo!.notes }}</p>
        </div>
        }
      </div>
      <ng-template pTemplate="footer">
        <button
          pButton
          label="Cancel"
          [text]="true"
          (click)="showCommentDialog = false"
        ></button>
        <button
          pButton
          label="Save Comment"
          [loading]="actionLoading()"
          [disabled]="!commentText.trim()"
          (click)="onSaveComment()"
        ></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [
    `
      .event-popover {
        position: fixed;
        width: 360px;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        overflow: hidden;
        transition: box-shadow 0.3s ease;

        &.imminent {
          animation: popover-pulse 1.5s ease-in-out infinite;
        }

        &.overdue {
          box-shadow: 0 10px 40px rgba(239, 68, 68, 0.3);
        }
      }

      @keyframes popover-pulse {
        0%,
        100% {
          box-shadow: 0 10px 40px rgba(249, 115, 22, 0.3);
        }
        50% {
          box-shadow: 0 10px 40px rgba(249, 115, 22, 0.5),
            0 0 0 4px rgba(249, 115, 22, 0.2);
        }
      }

      .popover-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;

        .header-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
        }
      }

      .status-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        color: white;
        font-size: 0.75rem;
        font-weight: 500;
        width: fit-content;
      }

      .time-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 600;

        i {
          font-size: 0.65rem;
        }

        &.starting-soon-badge {
          background: rgba(245, 158, 11, 0.15);
          color: #d97706;
        }

        &.imminent-badge {
          background: rgba(249, 115, 22, 0.15);
          color: #ea580c;
          animation: badge-pulse 1s ease-in-out infinite;
        }

        &.overdue-badge {
          background: rgba(239, 68, 68, 0.15);
          color: #dc2626;
        }
      }

      @keyframes badge-pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }

      .popover-body {
        padding: 1rem;
      }

      .popover-row {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        margin-bottom: 0.75rem;

        &:last-child {
          margin-bottom: 0;
        }

        i {
          color: #6b7280;
          margin-top: 2px;
          flex-shrink: 0;
          width: 16px;
        }

        span {
          font-size: 0.875rem;
          color: #1f2937;
        }

        a {
          font-size: 0.875rem;
          color: #3b82f6;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }

        &.notes {
          span {
            color: #6b7280;
            font-size: 0.8rem;
            line-height: 1.4;
          }
        }

        &.outcome {
          .outcome-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .outcome-label {
            font-size: 0.75rem;
            color: #6b7280;
          }

          .outcome-value {
            font-weight: 500;
            color: #1f2937;
          }

          .outcome-notes {
            margin: 0.25rem 0 0;
            font-size: 0.8rem;
            color: #6b7280;
          }
        }
      }

      .time-window-indicator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        margin-top: 0.75rem;
        background: #ecfdf5;
        border: 1px solid #10b981;
        border-radius: 8px;
        color: #065f46;
        font-size: 0.875rem;

        i {
          color: #10b981;
        }
      }

      .popover-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        padding: 1rem;
        border-top: 1px solid #e5e7eb;
        background: #f9fafb;
      }

      .popover-backdrop {
        position: fixed;
        inset: 0;
        z-index: 999;
      }

      /* Dialog Styles */
      .complete-dialog-content,
      .cancel-dialog-content,
      .comment-dialog-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .existing-notes {
        padding: 0.75rem;
        background: #f3f4f6;
        border-radius: 8px;

        label {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
          display: block;
          margin-bottom: 0.25rem;
        }

        p {
          margin: 0;
          font-size: 0.875rem;
          color: #374151;
          white-space: pre-wrap;
        }
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        label {
          font-weight: 500;
          color: #374151;
          font-size: 0.875rem;
        }
      }

      .warning-text {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        background: #fef3c7;
        border: 1px solid #f59e0b;
        border-radius: 8px;
        color: #92400e;
        margin: 0;

        i {
          font-size: 1.25rem;
          color: #f59e0b;
        }
      }

      :host ::ng-deep {
        .p-select,
        .p-textarea {
          width: 100%;
        }
      }
    `,
  ],
})
export class DemoEventPopoverComponent {
  @Input() demo: IDemoEvent | null = null;
  @Input() position: { top: number; left: number } = { top: 0, left: 0 };

  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<IDemoEvent>();
  @Output() reschedule = new EventEmitter<IDemoEvent>();
  @Output() demoUpdated = new EventEmitter<IDemoEvent>();

  // Expose enum for template
  DemoStatus = DemoStatus;

  // Dialog states
  showCompleteDialog = false;
  showCancelDialog = false;
  showCommentDialog = false;

  // Form values
  selectedOutcome: DemoOutcome | null = null;
  outcomeNotes = '';
  cancellationReason = '';
  commentText = '';

  // Loading state
  actionLoading = signal(false);

  // Outcome options
  outcomeOptions = Object.values(DemoOutcome).map((outcome) => ({
    label: DemoOutcomeLabels[outcome],
    value: outcome,
  }));

  constructor(
    private calendarService: CalendarService,
    private router: Router,
    private messageService: MessageService
  ) {}

  // Status helpers
  getStatusColor(status?: DemoStatus): string {
    return status ? DemoStatusColors[status] : '#6b7280';
  }

  /**
   * Get the effective display color considering time-based indicators
   */
  getEffectiveColor(): string {
    if (!this.demo) return '#6b7280';

    // For completed, cancelled, missed, or rescheduled demos, use status color
    if (
      this.demo.status === DemoStatus.COMPLETED ||
      this.demo.status === DemoStatus.CANCELLED ||
      this.demo.status === DemoStatus.MISSED ||
      this.demo.status === DemoStatus.RESCHEDULED
    ) {
      return DemoStatusColors[this.demo.status];
    }

    // Check time-based conditions for scheduled/confirmed demos
    if (this.isOverdue()) {
      return DemoTimeBasedColors.OVERDUE;
    }

    if (this.isImminent()) {
      return DemoTimeBasedColors.IMMINENT;
    }

    if (this.isStartingSoon()) {
      return DemoTimeBasedColors.STARTING_SOON;
    }

    return DemoStatusColors[this.demo.status] || '#6b7280';
  }

  /**
   * Check if demo is starting soon (within 60 minutes)
   */
  isStartingSoon(): boolean {
    if (!this.demo) return false;
    if (
      this.demo.status !== DemoStatus.SCHEDULED &&
      this.demo.status !== DemoStatus.CONFIRMED
    ) {
      return false;
    }
    const now = new Date();
    const scheduledTime = new Date(this.demo.scheduledAt);
    const diff = scheduledTime.getTime() - now.getTime();
    return diff > 0 && diff <= 60 * 60 * 1000;
  }

  /**
   * Check if demo is imminent (within 15 minutes) - triggers pulsing
   */
  isImminent(): boolean {
    if (!this.demo) return false;
    if (
      this.demo.status !== DemoStatus.SCHEDULED &&
      this.demo.status !== DemoStatus.CONFIRMED
    ) {
      return false;
    }
    const now = new Date();
    const scheduledTime = new Date(this.demo.scheduledAt);
    const diff = scheduledTime.getTime() - now.getTime();
    return diff > 0 && diff <= 15 * 60 * 1000;
  }

  /**
   * Check if demo is overdue
   */
  isOverdue(): boolean {
    if (!this.demo) return false;
    if (
      this.demo.status !== DemoStatus.SCHEDULED &&
      this.demo.status !== DemoStatus.CONFIRMED
    ) {
      return false;
    }
    const now = new Date();
    const scheduledTime = new Date(this.demo.scheduledAt);
    return now > scheduledTime;
  }

  /**
   * Get elapsed time since demo was supposed to start
   */
  getOverdueTime(): string {
    if (!this.demo || !this.isOverdue()) return '';
    const now = new Date();
    const scheduledTime = new Date(this.demo.scheduledAt);
    const diffMs = now.getTime() - scheduledTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `${diffMins} min overdue`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m overdue` : `${hours}h overdue`;
  }

  /**
   * Get time until demo starts
   */
  getTimeUntilStart(): string {
    if (!this.demo) return '';
    const now = new Date();
    const scheduledTime = new Date(this.demo.scheduledAt);
    const diffMs = scheduledTime.getTime() - now.getTime();

    if (diffMs <= 0) return '';

    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `in ${diffMins} min`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`;
  }

  getStatusLabel(status?: DemoStatus): string {
    return status ? DemoStatusLabels[status] : '';
  }

  getTypeLabel(type?: string): string {
    return type
      ? DemoTypeLabels[type as keyof typeof DemoTypeLabels] || type
      : '';
  }

  getOutcomeLabel(outcome?: DemoOutcome): string {
    return outcome ? DemoOutcomeLabels[outcome] : '';
  }

  formatTime(date?: string | Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  // Permission checks
  canStartDemo(): boolean {
    if (!this.demo) return false;
    if (
      this.demo.status !== DemoStatus.SCHEDULED &&
      this.demo.status !== DemoStatus.CONFIRMED
    ) {
      return false;
    }
    return this.isWithinStartWindow();
  }

  isWithinStartWindow(): boolean {
    if (!this.demo) return false;
    const now = new Date();
    const scheduledTime = new Date(this.demo.scheduledAt);
    const windowStart = new Date(scheduledTime.getTime() - 15 * 60 * 1000); // 15 min before
    const windowEnd = new Date(scheduledTime.getTime() + 30 * 60 * 1000); // 30 min after
    return now >= windowStart && now <= windowEnd;
  }

  canEdit(): boolean {
    if (!this.demo) return false;
    return (
      this.demo.status === DemoStatus.SCHEDULED ||
      this.demo.status === DemoStatus.CONFIRMED
    );
  }

  canReschedule(): boolean {
    if (!this.demo) return false;
    return (
      this.demo.status === DemoStatus.SCHEDULED ||
      this.demo.status === DemoStatus.CONFIRMED
    );
  }

  canCancel(): boolean {
    if (!this.demo) return false;
    return (
      this.demo.status === DemoStatus.SCHEDULED ||
      this.demo.status === DemoStatus.CONFIRMED
    );
  }

  // Actions
  onClose(): void {
    this.close.emit();
  }

  onStartDemo(): void {
    if (!this.demo) return;

    this.actionLoading.set(true);
    this.calendarService.startDemo(this.demo.id).subscribe({
      next: (response) => {
        this.actionLoading.set(false);
        if (response.data) {
          this.messageService.add({
            severity: 'success',
            summary: 'Demo Started',
            detail: 'Demo has been started successfully',
          });
          this.demoUpdated.emit(response.data);
          // Navigate to lead detail
          this.router.navigate(['/leads', this.demo!.leadId]);
          this.onClose();
        }
      },
      error: (error) => {
        this.actionLoading.set(false);
        this.handleError(error, 'Failed to start demo');
      },
    });
  }

  onEdit(): void {
    if (this.demo) {
      this.edit.emit(this.demo);
    }
  }

  onReschedule(): void {
    if (this.demo) {
      this.reschedule.emit(this.demo);
    }
  }

  onViewLead(): void {
    if (this.demo?.leadId) {
      this.router.navigate(['/leads', this.demo.leadId]);
      this.onClose();
    }
  }

  // Complete dialog
  openCompleteDialog(): void {
    this.selectedOutcome = null;
    this.outcomeNotes = '';
    this.showCompleteDialog = true;
  }

  onCompleteDemo(): void {
    if (!this.demo || !this.selectedOutcome) return;

    this.actionLoading.set(true);
    this.calendarService
      .completeDemo(this.demo.id, {
        outcome: this.selectedOutcome,
        outcomeNotes: this.outcomeNotes || undefined,
      })
      .subscribe({
        next: (response) => {
          this.actionLoading.set(false);
          if (response.data) {
            this.messageService.add({
              severity: 'success',
              summary: 'Demo Completed',
              detail: 'Demo has been marked as completed',
            });
            this.showCompleteDialog = false;
            this.demoUpdated.emit(response.data);
            this.onClose();
          }
        },
        error: (error) => {
          this.actionLoading.set(false);
          this.handleError(error, 'Failed to complete demo');
        },
      });
  }

  // Cancel dialog
  openCancelDialog(): void {
    this.cancellationReason = '';
    this.showCancelDialog = true;
  }

  onCancelDemo(): void {
    if (!this.demo || !this.cancellationReason?.trim()) return;

    this.actionLoading.set(true);
    this.calendarService
      .cancelDemo(this.demo.id, {
        cancellationReason: this.cancellationReason.trim(),
      })
      .subscribe({
        next: (response) => {
          this.actionLoading.set(false);
          if (response.data) {
            this.messageService.add({
              severity: 'success',
              summary: 'Demo Cancelled',
              detail: 'Demo has been cancelled',
            });
            this.showCancelDialog = false;
            this.demoUpdated.emit(response.data);
            this.onClose();
          }
        },
        error: (error) => {
          this.actionLoading.set(false);
          this.handleError(error, 'Failed to cancel demo');
        },
      });
  }

  // Comment dialog
  openCommentDialog(): void {
    this.commentText = '';
    this.showCommentDialog = true;
  }

  onSaveComment(): void {
    if (!this.demo || !this.commentText?.trim()) return;

    this.actionLoading.set(true);

    // Append new comment to existing notes
    const existingNotes = this.demo.notes || '';
    const timestamp = new Date().toLocaleString();
    const newNotes = existingNotes
      ? `${existingNotes}\n\n[${timestamp}]\n${this.commentText.trim()}`
      : `[${timestamp}]\n${this.commentText.trim()}`;

    this.calendarService
      .updateDemo(this.demo.id, { notes: newNotes })
      .subscribe({
        next: (response) => {
          this.actionLoading.set(false);
          if (response.data) {
            this.messageService.add({
              severity: 'success',
              summary: 'Comment Added',
              detail: 'Your comment has been saved',
            });
            this.showCommentDialog = false;
            this.demoUpdated.emit(response.data);
          }
        },
        error: (error) => {
          this.actionLoading.set(false);
          this.handleError(error, 'Failed to save comment');
        },
      });
  }

  private handleError(error: any, defaultMessage: string): void {
    const errorMessage = error.error?.message || defaultMessage;
    const errorCode = error.error?.code;

    switch (errorCode) {
      case 'OUTSIDE_INITIATION_WINDOW':
        this.messageService.add({
          severity: 'warn',
          summary: 'Cannot Start Demo',
          detail:
            'Demo can only be started within 15 minutes before to 30 minutes after the scheduled time',
        });
        break;
      case 'INVALID_STATUS_TRANSITION':
        this.messageService.add({
          severity: 'error',
          summary: 'Invalid Action',
          detail:
            'This action cannot be performed on the demo in its current state',
        });
        break;
      case 'DEMO_ALREADY_STARTED':
        this.messageService.add({
          severity: 'warn',
          summary: 'Demo In Progress',
          detail: 'This demo has already been started',
        });
        break;
      case 'DEMO_ALREADY_COMPLETED':
        this.messageService.add({
          severity: 'warn',
          summary: 'Demo Completed',
          detail: 'This demo has already been completed',
        });
        break;
      default:
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
        });
    }
  }
}
