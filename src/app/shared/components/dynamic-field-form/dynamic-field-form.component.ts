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
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import {
  IFieldDefinition,
  ILeadCustomField,
  FieldType,
} from '../../../core/models';

export interface CustomFieldValue {
  fieldDefinitionId: string;
  value?: string;
  arrayValue?: string[];
}

@Component({
  selector: 'app-dynamic-field-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    MultiSelectModule,
    CheckboxModule,
    DatePickerModule,
    ButtonModule,
    TooltipModule,
  ],
  template: `
    <div class="dynamic-form">
      @for (field of fields; track field.id) {
      <div
        class="form-field"
        [class.required]="field.isRequired"
        [class.hidden]="!isFieldVisible(field)"
      >
        <label class="field-label">
          {{ field.label }}
          @if (field.isRequired) {
          <span class="required-mark">*</span>
          }
        </label>

        @switch (field.fieldType) { @case ('text') {
        <input
          pInputText
          [ngModel]="getFieldValue(field.id)"
          (ngModelChange)="onFieldChange(field.id, $event)"
          [placeholder]="field.placeholder || ''"
          class="w-full"
        />
        } @case ('number') {
        <p-inputNumber
          [ngModel]="getFieldValueAsNumber(field.id)"
          (ngModelChange)="onFieldChange(field.id, $event?.toString())"
          [placeholder]="field.placeholder || ''"
          [min]="field.validation?.min"
          [max]="field.validation?.max"
          class="w-full"
        />
        } @case ('currency') {
        <p-inputNumber
          [ngModel]="getFieldValueAsNumber(field.id)"
          (ngModelChange)="onFieldChange(field.id, $event?.toString())"
          [placeholder]="field.placeholder || ''"
          mode="currency"
          currency="INR"
          locale="en-IN"
          class="w-full"
        />
        } @case ('date') {
        <p-datepicker
          [ngModel]="getFieldValueAsDate(field.id)"
          (ngModelChange)="onDateChange(field.id, $event)"
          [placeholder]="field.placeholder || 'Select date'"
          dateFormat="dd/mm/yy"
          [showIcon]="true"
          class="w-full"
        />
        } @case ('dropdown') {
        <p-select
          [ngModel]="getFieldValue(field.id)"
          (ngModelChange)="onFieldChange(field.id, $event)"
          [options]="field.options || []"
          optionLabel="label"
          optionValue="value"
          [placeholder]="field.placeholder || 'Select'"
          class="w-full"
        />
        } @case ('multi_select') {
        <p-multiSelect
          [ngModel]="getFieldArrayValue(field.id)"
          (ngModelChange)="onArrayFieldChange(field.id, $event)"
          [options]="field.options || []"
          optionLabel="label"
          optionValue="value"
          [placeholder]="field.placeholder || 'Select'"
          class="w-full"
        />
        } @case ('checkbox') {
        <p-checkbox
          [ngModel]="getFieldValueAsBoolean(field.id)"
          (ngModelChange)="onFieldChange(field.id, $event ? 'true' : 'false')"
          [binary]="true"
          [inputId]="'field_' + field.id"
        />
        } @case ('email') {
        <input
          pInputText
          type="email"
          [ngModel]="getFieldValue(field.id)"
          (ngModelChange)="onFieldChange(field.id, $event)"
          [placeholder]="field.placeholder || 'email@example.com'"
          class="w-full"
        />
        } @case ('phone') {
        <input
          pInputText
          type="tel"
          [ngModel]="getFieldValue(field.id)"
          (ngModelChange)="onFieldChange(field.id, $event)"
          [placeholder]="field.placeholder || '+91 XXXXX XXXXX'"
          class="w-full"
        />
        } @case ('url') {
        <input
          pInputText
          type="url"
          [ngModel]="getFieldValue(field.id)"
          (ngModelChange)="onFieldChange(field.id, $event)"
          [placeholder]="field.placeholder || 'https://'"
          class="w-full"
        />
        } @case ('textarea') {
        <textarea
          pTextarea
          [ngModel]="getFieldValue(field.id)"
          (ngModelChange)="onFieldChange(field.id, $event)"
          [placeholder]="field.placeholder || ''"
          rows="3"
          class="w-full"
        ></textarea>
        } @default {
        <input
          pInputText
          [ngModel]="getFieldValue(field.id)"
          (ngModelChange)="onFieldChange(field.id, $event)"
          [placeholder]="field.placeholder || ''"
          class="w-full"
        />
        } } @if (field.helpText) {
        <small class="help-text">{{ field.helpText }}</small>
        }
      </div>
      } @empty {
      <div class="no-fields">
        <i class="pi pi-inbox"></i>
        <span>No custom fields configured</span>
      </div>
      } @if (fields.length > 0 && showSaveButton) {
      <div class="form-actions">
        <button
          pButton
          label="Save Custom Fields"
          icon="pi pi-save"
          (click)="onSave()"
          [loading]="saving()"
        ></button>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .dynamic-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-field.hidden {
        display: none;
      }

      .field-label {
        font-weight: 500;
        color: #374151;
        font-size: 0.875rem;
      }

      .required-mark {
        color: #ef4444;
        margin-left: 0.25rem;
      }

      .help-text {
        color: #9ca3af;
        font-size: 0.75rem;
      }

      .no-fields {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2rem;
        color: #9ca3af;
        gap: 0.5rem;
      }

      .no-fields i {
        font-size: 1.5rem;
      }

      .form-actions {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
      }

      .w-full {
        width: 100%;
      }

      :host ::ng-deep .p-inputnumber,
      :host ::ng-deep .p-calendar,
      :host ::ng-deep .p-select,
      :host ::ng-deep .p-multiselect {
        width: 100%;
      }
    `,
  ],
})
export class DynamicFieldFormComponent implements OnInit, OnChanges {
  @Input() fields: IFieldDefinition[] = [];
  @Input() values: ILeadCustomField[] = [];
  @Input() showSaveButton = true;
  @Output() valuesChange = new EventEmitter<CustomFieldValue[]>();
  @Output() save = new EventEmitter<CustomFieldValue[]>();

  saving = signal(false);
  private fieldValues: Map<string, CustomFieldValue> = new Map();

  ngOnInit() {
    this.initializeValues();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['values'] || changes['fields']) {
      this.initializeValues();
    }
  }

  private initializeValues() {
    this.fieldValues.clear();

    // Initialize from existing values
    for (const val of this.values) {
      this.fieldValues.set(val.fieldDefinitionId, {
        fieldDefinitionId: val.fieldDefinitionId,
        value: val.value,
        arrayValue: val.arrayValue,
      });
    }

    // Initialize missing fields with defaults
    for (const field of this.fields) {
      if (!this.fieldValues.has(field.id)) {
        this.fieldValues.set(field.id, {
          fieldDefinitionId: field.id,
          value: field.defaultValue,
          arrayValue: undefined,
        });
      }
    }
  }

  getFieldValue(fieldId: string): string {
    return this.fieldValues.get(fieldId)?.value || '';
  }

  getFieldArrayValue(fieldId: string): string[] {
    return this.fieldValues.get(fieldId)?.arrayValue || [];
  }

  getFieldValueAsNumber(fieldId: string): number | null {
    const val = this.getFieldValue(fieldId);
    return val ? parseFloat(val) : null;
  }

  getFieldValueAsBoolean(fieldId: string): boolean {
    return this.getFieldValue(fieldId) === 'true';
  }

  getFieldValueAsDate(fieldId: string): Date | null {
    const val = this.getFieldValue(fieldId);
    return val ? new Date(val) : null;
  }

  onFieldChange(fieldId: string, value: string | null) {
    const current = this.fieldValues.get(fieldId) || {
      fieldDefinitionId: fieldId,
    };
    current.value = value || undefined;
    this.fieldValues.set(fieldId, current);
    this.emitChanges();
  }

  onArrayFieldChange(fieldId: string, values: string[]) {
    const current = this.fieldValues.get(fieldId) || {
      fieldDefinitionId: fieldId,
    };
    current.arrayValue = values;
    this.fieldValues.set(fieldId, current);
    this.emitChanges();
  }

  onDateChange(fieldId: string, date: Date | null) {
    this.onFieldChange(fieldId, date ? date.toISOString() : null);
  }

  isFieldVisible(field: IFieldDefinition): boolean {
    if (!field.visibilityCondition?.dependsOn) {
      return true;
    }

    const dependsOnValue = this.getFieldValue(
      field.visibilityCondition.dependsOn
    );
    const showWhen = field.visibilityCondition.showWhen || [];

    return showWhen.includes(dependsOnValue);
  }

  private emitChanges() {
    const values = Array.from(this.fieldValues.values()).filter(
      (v) => v.value !== undefined || (v.arrayValue && v.arrayValue.length > 0)
    );
    this.valuesChange.emit(values);
  }

  onSave() {
    const values = Array.from(this.fieldValues.values()).filter(
      (v) => v.value !== undefined || (v.arrayValue && v.arrayValue.length > 0)
    );
    this.save.emit(values);
  }

  setSaving(value: boolean) {
    this.saving.set(value);
  }
}
