import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { debounceTime, Subject } from 'rxjs';
import { CalendarService, LeadService } from '../../../../core/services';
import {
  IDemoEvent,
  ICreateDemoEvent,
  DemoType,
  DemoTypeLabels,
  IDemoConflict,
  ILead,
} from '../../../../core/models';

interface DurationOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-demo-scheduler-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    AutoCompleteModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-dialog
      [(visible)]="visible"
      [header]="editingDemo ? 'Edit Demo' : 'Schedule Demo'"
      [modal]="true"
      [style]="{ width: '550px' }"
      [draggable]="false"
      [closable]="true"
      (onHide)="onCancel()"
    >
      <p-toast />

      <form
        [formGroup]="demoForm"
        class="scheduler-form"
        (ngSubmit)="onSubmit()"
      >
        <!-- Lead Selector -->
        <div class="form-field">
          <label for="lead">Lead *</label>
          <p-autoComplete
            id="lead"
            formControlName="lead"
            [suggestions]="filteredLeads()"
            (completeMethod)="searchLeads($event)"
            field="displayName"
            [dropdown]="true"
            [forceSelection]="true"
            placeholder="Search for a lead..."
            [disabled]="!!preselectedLead"
            [class.ng-invalid]="
              demoForm.get('lead')?.invalid && demoForm.get('lead')?.touched
            "
            [class.ng-dirty]="demoForm.get('lead')?.dirty"
          >
            <ng-template let-lead pTemplate="item">
              <div class="lead-option">
                <span class="lead-name">{{
                  lead.name || lead.phoneNumber
                }}</span>
                <span class="lead-phone">{{ lead.phoneNumber }}</span>
              </div>
            </ng-template>
          </p-autoComplete>
          @if (demoForm.get('lead')?.invalid && demoForm.get('lead')?.touched) {
          <small class="error-text">Lead is required</small>
          }
        </div>

        <!-- Date and Time -->
        <div class="form-row">
          <div class="form-field">
            <label for="scheduledDate">Date *</label>
            <p-datepicker
              id="scheduledDate"
              formControlName="scheduledDate"
              [showTime]="false"
              [minDate]="minDate"
              dateFormat="dd/mm/yy"
              placeholder="Select date"
              [class.ng-invalid]="
                demoForm.get('scheduledDate')?.invalid &&
                demoForm.get('scheduledDate')?.touched
              "
              [class.ng-dirty]="demoForm.get('scheduledDate')?.dirty"
            />
            @if (demoForm.get('scheduledDate')?.invalid &&
            demoForm.get('scheduledDate')?.touched) {
            <small class="error-text">Date is required</small>
            }
          </div>
          <div class="form-field">
            <label for="scheduledTime">Time *</label>
            <p-datepicker
              id="scheduledTime"
              formControlName="scheduledTime"
              [timeOnly]="true"
              [showTime]="true"
              [hourFormat]="'12'"
              placeholder="Select time"
              [class.ng-invalid]="
                demoForm.get('scheduledTime')?.invalid &&
                demoForm.get('scheduledTime')?.touched
              "
              [class.ng-dirty]="demoForm.get('scheduledTime')?.dirty"
            />
            @if (demoForm.get('scheduledTime')?.invalid &&
            demoForm.get('scheduledTime')?.touched) {
            <small class="error-text">Time is required</small>
            }
          </div>
        </div>

        <!-- Duration -->
        <div class="form-field">
          <label for="duration">Duration *</label>
          <p-select
            id="duration"
            formControlName="durationMinutes"
            [options]="durationOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select duration"
            [class.ng-invalid]="
              demoForm.get('durationMinutes')?.invalid &&
              demoForm.get('durationMinutes')?.touched
            "
            [class.ng-dirty]="demoForm.get('durationMinutes')?.dirty"
          />
          @if (demoForm.get('durationMinutes')?.invalid &&
          demoForm.get('durationMinutes')?.touched) {
          <small class="error-text">Duration is required</small>
          }
        </div>

        <!-- Demo Type -->
        <div class="form-field">
          <label for="demoType">Demo Type *</label>
          <p-select
            id="demoType"
            formControlName="demoType"
            [options]="demoTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select demo type"
            [class.ng-invalid]="
              demoForm.get('demoType')?.invalid &&
              demoForm.get('demoType')?.touched
            "
            [class.ng-dirty]="demoForm.get('demoType')?.dirty"
          />
          @if (demoForm.get('demoType')?.invalid &&
          demoForm.get('demoType')?.touched) {
          <small class="error-text">Demo type is required</small>
          }
        </div>

        <!-- Meeting Link -->
        <div class="form-field">
          <label for="meetingLink">Meeting Link</label>
          <input
            pInputText
            id="meetingLink"
            formControlName="meetingLink"
            placeholder="https://meet.google.com/..."
            class="w-full"
          />
        </div>

        <!-- Notes -->
        <div class="form-field">
          <label for="notes">Notes</label>
          <textarea
            pTextarea
            id="notes"
            formControlName="notes"
            rows="3"
            placeholder="Add any notes or agenda items..."
            class="w-full"
          ></textarea>
        </div>

        <!-- Conflict Warning -->
        @if (conflicts().length > 0) {
        <div class="conflict-warning">
          <i class="pi pi-exclamation-triangle"></i>
          <div class="conflict-content">
            <strong>Scheduling Conflict Detected</strong>
            <p>This time overlaps with:</p>
            <ul>
              @for (conflict of conflicts(); track conflict.id) {
              <li>
                {{ conflict.leadName || 'Demo' }} at
                {{ formatTime(conflict.scheduledAt) }}
              </li>
              }
            </ul>
            @if (suggestedSlot()) {
            <p class="suggested-slot">
              <strong>Suggested:</strong> {{ formatDateTime(suggestedSlot()!) }}
              <button
                pButton
                type="button"
                label="Use this time"
                size="small"
                [text]="true"
                (click)="useSuggestedSlot()"
              ></button>
            </p>
            }
          </div>
        </div>
        }
      </form>

      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <button
            pButton
            type="button"
            label="Cancel"
            [text]="true"
            (click)="onCancel()"
          ></button>
          <button
            pButton
            type="button"
            [label]="editingDemo ? 'Update' : 'Schedule'"
            [loading]="submitting()"
            [disabled]="demoForm.invalid || submitting()"
            (click)="onSubmit()"
          ></button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [
    `
      .scheduler-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
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

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .lead-option {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        .lead-name {
          font-weight: 500;
        }

        .lead-phone {
          font-size: 0.75rem;
          color: #6b7280;
        }
      }

      .error-text {
        color: #ef4444;
        font-size: 0.75rem;
      }

      .conflict-warning {
        display: flex;
        gap: 0.75rem;
        padding: 1rem;
        background: #fef3c7;
        border: 1px solid #f59e0b;
        border-radius: 8px;
        color: #92400e;

        i {
          font-size: 1.25rem;
          color: #f59e0b;
        }

        .conflict-content {
          flex: 1;

          strong {
            display: block;
            margin-bottom: 0.5rem;
          }

          p {
            margin: 0.25rem 0;
            font-size: 0.875rem;
          }

          ul {
            margin: 0.5rem 0;
            padding-left: 1.25rem;
            font-size: 0.875rem;
          }

          .suggested-slot {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-top: 0.75rem;
            padding-top: 0.75rem;
            border-top: 1px solid #fcd34d;
          }
        }
      }

      .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }

      :host ::ng-deep {
        .p-autocomplete,
        .p-select,
        .p-datepicker {
          width: 100%;
        }

        .p-inputtext,
        .p-textarea {
          width: 100%;
        }
      }
    `,
  ],
})
export class DemoSchedulerDialogComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() selectedDate: Date | null = null;
  @Input() selectedTime: string | null = null;
  @Input() editingDemo: IDemoEvent | null = null;
  @Input() preselectedLead: ILead | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() demoScheduled = new EventEmitter<IDemoEvent>();
  @Output() demoUpdated = new EventEmitter<IDemoEvent>();

  demoForm!: FormGroup;
  minDate = new Date();

  // Signals
  filteredLeads = signal<ILead[]>([]);
  conflicts = signal<IDemoConflict[]>([]);
  suggestedSlot = signal<Date | null>(null);
  submitting = signal(false);

  // Lead display function for autocomplete
  leadDisplayFn = (lead: ILead) => lead?.name || lead?.phoneNumber || '';

  // Options
  durationOptions: DurationOption[] = [
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '45 minutes', value: 45 },
    { label: '60 minutes', value: 60 },
    { label: '90 minutes', value: 90 },
    { label: '120 minutes', value: 120 },
  ];

  demoTypeOptions = Object.values(DemoType).map((type) => ({
    label: DemoTypeLabels[type],
    value: type,
  }));

  private conflictCheckSubject = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private calendarService: CalendarService,
    private leadService: LeadService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.initForm();

    // Debounce conflict checks
    this.conflictCheckSubject.pipe(debounceTime(500)).subscribe(() => {
      this.checkConflicts();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
    }
    if (changes['editingDemo'] && this.editingDemo) {
      this.populateForm(this.editingDemo);
    }
    if (changes['preselectedLead'] && this.preselectedLead) {
      this.demoForm?.patchValue({ lead: this.preselectedLead });
    }
    if (changes['selectedDate'] && this.selectedDate) {
      this.demoForm?.patchValue({ scheduledDate: this.selectedDate });
    }
  }

  private initForm(): void {
    this.demoForm = this.fb.group({
      lead: [null, Validators.required],
      scheduledDate: [new Date(), Validators.required],
      scheduledTime: [this.getDefaultTime(), Validators.required],
      durationMinutes: [30, Validators.required],
      demoType: [DemoType.PRODUCT_DEMO, Validators.required],
      meetingLink: [''],
      notes: [''],
    });

    // Watch for time changes to check conflicts
    this.demoForm.get('scheduledDate')?.valueChanges.subscribe(() => {
      this.conflictCheckSubject.next();
    });
    this.demoForm.get('scheduledTime')?.valueChanges.subscribe(() => {
      this.conflictCheckSubject.next();
    });
    this.demoForm.get('durationMinutes')?.valueChanges.subscribe(() => {
      this.conflictCheckSubject.next();
    });
  }

  private getDefaultTime(): Date {
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30);
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now;
  }

  private resetForm(): void {
    if (!this.demoForm) return;

    this.demoForm.reset({
      lead: this.preselectedLead || null,
      scheduledDate: this.selectedDate || new Date(),
      scheduledTime: this.getDefaultTime(),
      durationMinutes: 30,
      demoType: DemoType.PRODUCT_DEMO,
      meetingLink: '',
      notes: '',
    });
    this.conflicts.set([]);
    this.suggestedSlot.set(null);
  }

  private populateForm(demo: IDemoEvent): void {
    if (!this.demoForm) return;

    const scheduledAt = new Date(demo.scheduledAt);
    this.demoForm.patchValue({
      lead: demo.lead,
      scheduledDate: scheduledAt,
      scheduledTime: scheduledAt,
      durationMinutes: demo.durationMinutes,
      demoType: demo.demoType,
      meetingLink: demo.meetingLink || '',
      notes: demo.notes || '',
    });
  }

  searchLeads(event: { query: string }): void {
    this.leadService.getLeads({ limit: 20 }).subscribe({
      next: (response) => {
        if (response.data) {
          const leads = response.data as unknown as ILead[];
          const query = event.query.toLowerCase();
          const filtered = leads
            .filter(
              (lead) =>
                lead.name?.toLowerCase().includes(query) ||
                lead.phoneNumber?.includes(query)
            )
            .map((lead) => ({
              ...lead,
              displayName: lead.name || lead.phoneNumber || 'Unknown',
            }));
          this.filteredLeads.set(filtered as ILead[]);
        }
      },
      error: () => {
        this.filteredLeads.set([]);
      },
    });
  }

  private checkConflicts(): void {
    const formValue = this.demoForm.value;
    if (!formValue.scheduledDate || !formValue.scheduledTime) return;

    const scheduledAt = this.combineDateTime(
      formValue.scheduledDate,
      formValue.scheduledTime
    );
    const endTime = new Date(
      scheduledAt.getTime() + formValue.durationMinutes * 60 * 1000
    );

    this.calendarService
      .checkConflicts(
        scheduledAt.toISOString(),
        endTime.toISOString(),
        undefined,
        this.editingDemo?.id
      )
      .subscribe({
        next: (response) => {
          if (response.data?.conflicts) {
            this.conflicts.set(response.data.conflicts);
            if (response.data.conflicts.length > 0) {
              this.findNextAvailableSlot(scheduledAt);
            } else {
              this.suggestedSlot.set(null);
            }
          }
        },
        error: () => {
          this.conflicts.set([]);
        },
      });
  }

  private findNextAvailableSlot(preferredTime: Date): void {
    // Simple algorithm: try 30-minute increments after the preferred time
    const candidate = new Date(preferredTime);
    candidate.setMinutes(candidate.getMinutes() + 30);

    // For now, just suggest the next 30-minute slot
    // A more sophisticated implementation would check against all conflicts
    this.suggestedSlot.set(candidate);
  }

  useSuggestedSlot(): void {
    const slot = this.suggestedSlot();
    if (slot) {
      this.demoForm.patchValue({
        scheduledDate: slot,
        scheduledTime: slot,
      });
    }
  }

  getLeadDisplayName(lead: ILead | null): string {
    if (!lead) return '';
    return lead.name || lead.phoneNumber || '';
  }

  private combineDateTime(date: Date, time: Date): Date {
    const combined = new Date(date);
    combined.setHours(time.getHours());
    combined.setMinutes(time.getMinutes());
    combined.setSeconds(0);
    combined.setMilliseconds(0);
    return combined;
  }

  formatTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  formatDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  onSubmit(): void {
    // Mark all fields as touched to trigger validation display
    if (this.demoForm.invalid) {
      Object.keys(this.demoForm.controls).forEach((key) => {
        const control = this.demoForm.get(key);
        control?.markAsTouched();
        control?.markAsDirty();
      });
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields',
      });
      return;
    }

    this.submitting.set(true);
    const formValue = this.demoForm.value;
    const scheduledAt = this.combineDateTime(
      formValue.scheduledDate,
      formValue.scheduledTime
    );

    const demoData: ICreateDemoEvent = {
      leadId: formValue.lead.id,
      scheduledAt: scheduledAt.toISOString(),
      durationMinutes: formValue.durationMinutes,
      demoType: formValue.demoType,
      notes: formValue.notes || undefined,
      meetingLink: formValue.meetingLink || undefined,
    };

    if (this.editingDemo) {
      this.calendarService
        .updateDemo(this.editingDemo.id, {
          scheduledAt: demoData.scheduledAt,
          durationMinutes: demoData.durationMinutes,
          demoType: demoData.demoType,
          notes: demoData.notes,
          meetingLink: demoData.meetingLink,
        })
        .subscribe({
          next: (response) => {
            this.submitting.set(false);
            if (response.data) {
              this.messageService.add({
                severity: 'success',
                summary: 'Demo Updated',
                detail: 'Demo has been updated successfully',
              });
              this.demoUpdated.emit(response.data);
              this.closeDialog();
            }
          },
          error: (error) => {
            this.submitting.set(false);
            this.handleApiError(error);
          },
        });
    } else {
      this.calendarService.createDemo(demoData).subscribe({
        next: (response) => {
          this.submitting.set(false);
          if (response.data) {
            this.messageService.add({
              severity: 'success',
              summary: 'Demo Scheduled',
              detail: 'Demo has been scheduled successfully',
            });
            this.demoScheduled.emit(response.data);
            this.closeDialog();
          }
        },
        error: (error) => {
          this.submitting.set(false);
          this.handleApiError(error);
        },
      });
    }
  }

  private handleApiError(error: any): void {
    const errorCode = error.error?.code;
    const errorMessage = error.error?.message;

    switch (errorCode) {
      case 'SCHEDULING_CONFLICT':
        this.messageService.add({
          severity: 'warn',
          summary: 'Scheduling Conflict',
          detail:
            'This time slot conflicts with an existing demo. Please choose a different time.',
        });
        // Refresh conflicts
        this.checkConflicts();
        break;
      case 'LEAD_NOT_SCHEDULABLE':
        this.messageService.add({
          severity: 'error',
          summary: 'Cannot Schedule',
          detail: 'Cannot schedule demo for a closed or lost lead',
        });
        break;
      case 'LEAD_NOT_FOUND':
        this.messageService.add({
          severity: 'error',
          summary: 'Lead Not Found',
          detail: 'The selected lead could not be found',
        });
        break;
      default:
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage || 'Failed to schedule demo. Please try again.',
        });
    }
  }

  onCancel(): void {
    this.closeDialog();
  }

  private closeDialog(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.resetForm();
  }
}
