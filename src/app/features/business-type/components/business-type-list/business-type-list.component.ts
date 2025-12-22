import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';
import { BusinessTypeService } from '../../../../core/services';
import {
  IBusinessType,
  IFieldDefinition,
  FieldType,
} from '../../../../core/models';

@Component({
  selector: 'app-business-type-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    CheckboxModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    LayoutComponent,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <app-layout>
      <p-toast />
      <p-confirmDialog />

      <div class="page-container">
        <div class="page-header">
          <div>
            <h1>Business Types</h1>
            <p class="subtitle">
              Configure business types and custom fields for leads
            </p>
          </div>
          <button
            pButton
            label="Add Business Type"
            icon="pi pi-plus"
            (click)="openBusinessTypeDialog()"
          ></button>
        </div>

        @if (loading()) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Loading business types...</p>
        </div>
        } @else {
        <div class="business-types-grid">
          @for (bt of businessTypes(); track bt.id) {
          <div class="business-type-card">
            <div class="bt-header">
              <div class="bt-icon" [style.background]="bt.color + '20'">
                <i [class]="bt.icon" [style.color]="bt.color"></i>
              </div>
              <div class="bt-info">
                <h3>{{ bt.name }}</h3>
                <p>{{ bt.description || 'No description' }}</p>
              </div>
              <div class="bt-actions">
                <button
                  pButton
                  icon="pi pi-pencil"
                  [text]="true"
                  [rounded]="true"
                  size="small"
                  pTooltip="Edit"
                  (click)="editBusinessType(bt)"
                ></button>
                <button
                  pButton
                  icon="pi pi-trash"
                  [text]="true"
                  [rounded]="true"
                  size="small"
                  severity="danger"
                  pTooltip="Delete"
                  (click)="confirmDeleteBusinessType(bt)"
                ></button>
              </div>
            </div>

            <div class="bt-fields">
              <div class="fields-header">
                <span class="fields-count"
                  >{{ bt.fields?.length || 0 }} Fields</span
                >
                <button
                  pButton
                  label="Add Field"
                  icon="pi pi-plus"
                  [text]="true"
                  size="small"
                  (click)="openFieldDialog(bt)"
                ></button>
              </div>

              @if (bt.fields && bt.fields.length > 0) {
              <div class="fields-list">
                @for (field of bt.fields; track field.id) {
                <div class="field-item" [class.inactive]="!field.isActive">
                  <div class="field-info">
                    <span class="field-label">{{ field.label }}</span>
                    <div class="field-meta">
                      <p-tag
                        [value]="getFieldTypeLabel(field.fieldType)"
                        [severity]="getFieldTypeSeverity(field.fieldType)"
                        [rounded]="true"
                      />
                      @if (field.isRequired) {
                      <span class="required-badge">Required</span>
                      }
                    </div>
                  </div>
                  <div class="field-actions">
                    <button
                      pButton
                      icon="pi pi-pencil"
                      [text]="true"
                      [rounded]="true"
                      size="small"
                      (click)="editField(bt, field)"
                    ></button>
                    <button
                      pButton
                      icon="pi pi-trash"
                      [text]="true"
                      [rounded]="true"
                      size="small"
                      severity="danger"
                      (click)="confirmDeleteField(field)"
                    ></button>
                  </div>
                </div>
                }
              </div>
              } @else {
              <div class="no-fields">
                <i class="pi pi-inbox"></i>
                <span>No fields configured</span>
              </div>
              }
            </div>
          </div>
          } @empty {
          <div class="empty-state">
            <i class="pi pi-briefcase"></i>
            <h3>No Business Types</h3>
            <p>
              Create your first business type to start configuring custom fields
            </p>
            <button
              pButton
              label="Create Business Type"
              icon="pi pi-plus"
              (click)="openBusinessTypeDialog()"
            ></button>
          </div>
          }
        </div>
        }
      </div>

      <!-- Business Type Dialog -->
      <p-dialog
        [(visible)]="businessTypeDialogVisible"
        [header]="
          editingBusinessType ? 'Edit Business Type' : 'Add Business Type'
        "
        [modal]="true"
        [style]="{ width: '500px' }"
        [draggable]="false"
      >
        <div class="form-grid">
          <div class="form-field">
            <label class="field-label">Name *</label>
            <input
              pInputText
              [(ngModel)]="businessTypeForm.name"
              class="w-full"
              placeholder="e.g., Manufacturing"
            />
          </div>
          <div class="form-field">
            <label class="field-label">Description</label>
            <textarea
              pTextarea
              [(ngModel)]="businessTypeForm.description"
              class="w-full"
              rows="3"
              placeholder="Brief description"
            ></textarea>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">Icon</label>
              <p-select
                [(ngModel)]="businessTypeForm.icon"
                [options]="iconOptions"
                placeholder="Select icon"
                class="w-full"
              >
                <ng-template pTemplate="selectedItem" let-item>
                  <div class="icon-option">
                    <i [class]="item.value"></i>
                    <span>{{ item.label }}</span>
                  </div>
                </ng-template>
                <ng-template pTemplate="item" let-item>
                  <div class="icon-option">
                    <i [class]="item.value"></i>
                    <span>{{ item.label }}</span>
                  </div>
                </ng-template>
              </p-select>
            </div>
            <div class="form-field">
              <label class="field-label">Color</label>
              <input
                type="color"
                [(ngModel)]="businessTypeForm.color"
                class="color-input"
              />
            </div>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button
            pButton
            label="Cancel"
            [text]="true"
            severity="secondary"
            (click)="businessTypeDialogVisible = false"
          ></button>
          <button
            pButton
            [label]="editingBusinessType ? 'Update' : 'Create'"
            (click)="saveBusinessType()"
            [loading]="saving()"
            [disabled]="!businessTypeForm.name"
          ></button>
        </ng-template>
      </p-dialog>

      <!-- Field Dialog -->
      <p-dialog
        [(visible)]="fieldDialogVisible"
        [header]="editingField ? 'Edit Field' : 'Add Field'"
        [modal]="true"
        [style]="{ width: '600px' }"
        [draggable]="false"
      >
        <div class="form-grid">
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">Field Name *</label>
              <input
                pInputText
                [(ngModel)]="fieldForm.name"
                class="w-full"
                placeholder="e.g., product_category"
              />
              <small class="help-text">Internal name (no spaces)</small>
            </div>
            <div class="form-field">
              <label class="field-label">Label *</label>
              <input
                pInputText
                [(ngModel)]="fieldForm.label"
                class="w-full"
                placeholder="e.g., Product Category"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">Field Type *</label>
              <p-select
                [(ngModel)]="fieldForm.fieldType"
                [options]="fieldTypeOptions"
                placeholder="Select type"
                class="w-full"
              />
            </div>
            <div class="form-field checkbox-field">
              <p-checkbox
                [(ngModel)]="fieldForm.isRequired"
                [binary]="true"
                inputId="isRequired"
              />
              <label for="isRequired">Required Field</label>
            </div>
          </div>
          <div class="form-field">
            <label class="field-label">Placeholder</label>
            <input
              pInputText
              [(ngModel)]="fieldForm.placeholder"
              class="w-full"
              placeholder="Placeholder text"
            />
          </div>
          <div class="form-field">
            <label class="field-label">Help Text</label>
            <input
              pInputText
              [(ngModel)]="fieldForm.helpText"
              class="w-full"
              placeholder="Help text for users"
            />
          </div>

          @if (fieldForm.fieldType === 'dropdown' || fieldForm.fieldType ===
          'multi_select') {
          <div class="form-field">
            <label class="field-label">Options</label>
            <div class="options-list">
              @for (opt of fieldForm.options; track $index) {
              <div class="option-row">
                <input
                  pInputText
                  [(ngModel)]="opt.label"
                  placeholder="Label"
                  class="option-input"
                />
                <input
                  pInputText
                  [(ngModel)]="opt.value"
                  placeholder="Value"
                  class="option-input"
                />
                <button
                  pButton
                  icon="pi pi-trash"
                  [text]="true"
                  [rounded]="true"
                  size="small"
                  severity="danger"
                  (click)="removeOption($index)"
                ></button>
              </div>
              }
              <button
                pButton
                label="Add Option"
                icon="pi pi-plus"
                [text]="true"
                size="small"
                (click)="addOption()"
              ></button>
            </div>
          </div>
          }
        </div>
        <ng-template pTemplate="footer">
          <button
            pButton
            label="Cancel"
            [text]="true"
            severity="secondary"
            (click)="fieldDialogVisible = false"
          ></button>
          <button
            pButton
            [label]="editingField ? 'Update' : 'Create'"
            (click)="saveField()"
            [loading]="saving()"
            [disabled]="
              !fieldForm.name || !fieldForm.label || !fieldForm.fieldType
            "
          ></button>
        </ng-template>
      </p-dialog>
    </app-layout>
  `,
  styles: [
    `
      .page-container {
        padding: 1.5rem;
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
      }

      .page-header h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
      }

      .subtitle {
        margin: 0.25rem 0 0;
        color: #6b7280;
        font-size: 0.875rem;
      }

      .loading-state {
        text-align: center;
        padding: 4rem;
        background: white;
        border-radius: 16px;
      }

      .loading-state i {
        font-size: 2rem;
        color: #25d366;
      }

      .business-types-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: 1.5rem;
      }

      .business-type-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        overflow: hidden;
      }

      .bt-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.25rem;
        border-bottom: 1px solid #f1f5f9;
      }

      .bt-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .bt-icon i {
        font-size: 1.5rem;
      }

      .bt-info {
        flex: 1;
        min-width: 0;
      }

      .bt-info h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #1f2937;
      }

      .bt-info p {
        margin: 0.25rem 0 0;
        font-size: 0.8rem;
        color: #6b7280;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .bt-actions {
        display: flex;
        gap: 0.25rem;
      }

      .bt-fields {
        padding: 1rem 1.25rem;
      }

      .fields-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
      }

      .fields-count {
        font-size: 0.8rem;
        font-weight: 600;
        color: #6b7280;
      }

      .fields-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .field-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem;
        background: #f8fafc;
        border-radius: 8px;
        transition: background 0.2s;
      }

      .field-item:hover {
        background: #f1f5f9;
      }

      .field-item.inactive {
        opacity: 0.5;
      }

      .field-info {
        flex: 1;
        min-width: 0;
      }

      .field-label {
        font-weight: 500;
        color: #1f2937;
        font-size: 0.9rem;
      }

      .field-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.25rem;
      }

      .required-badge {
        font-size: 0.65rem;
        color: #ef4444;
        font-weight: 600;
      }

      .field-actions {
        display: flex;
        gap: 0.25rem;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .field-item:hover .field-actions {
        opacity: 1;
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

      .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 4rem;
        background: white;
        border-radius: 16px;
      }

      .empty-state i {
        font-size: 3rem;
        color: #d1d5db;
        margin-bottom: 1rem;
      }

      .empty-state h3 {
        margin: 0;
        color: #374151;
      }

      .empty-state p {
        color: #6b7280;
        margin: 0.5rem 0 1.5rem;
      }

      .form-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-field.checkbox-field {
        flex-direction: row;
        align-items: center;
        padding-top: 1.5rem;
      }

      .field-label {
        font-weight: 500;
        color: #374151;
        font-size: 0.875rem;
      }

      .help-text {
        color: #9ca3af;
        font-size: 0.75rem;
      }

      .color-input {
        width: 100%;
        height: 40px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        cursor: pointer;
      }

      .icon-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .options-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .option-row {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }

      .option-input {
        flex: 1;
      }

      .w-full {
        width: 100%;
      }
    `,
  ],
})
export class BusinessTypeListComponent implements OnInit {
  businessTypes = signal<IBusinessType[]>([]);
  loading = signal(true);
  saving = signal(false);

  businessTypeDialogVisible = false;
  fieldDialogVisible = false;

  editingBusinessType: IBusinessType | null = null;
  editingField: IFieldDefinition | null = null;
  selectedBusinessType: IBusinessType | null = null;

  businessTypeForm = {
    name: '',
    description: '',
    icon: 'pi-briefcase',
    color: '#3B82F6',
  };

  fieldForm: any = {
    name: '',
    label: '',
    fieldType: '',
    placeholder: '',
    helpText: '',
    isRequired: false,
    options: [],
  };

  iconOptions = [
    { label: 'Briefcase', value: 'pi pi-briefcase' },
    { label: 'Cog', value: 'pi pi-cog' },
    { label: 'Desktop', value: 'pi pi-desktop' },
    { label: 'Cloud', value: 'pi pi-cloud' },
    { label: 'Shopping Cart', value: 'pi pi-shopping-cart' },
    { label: 'Building', value: 'pi pi-building' },
    { label: 'Chart Bar', value: 'pi pi-chart-bar' },
    { label: 'Users', value: 'pi pi-users' },
    { label: 'Globe', value: 'pi pi-globe' },
    { label: 'Truck', value: 'pi pi-truck' },
  ];

  fieldTypeOptions = [
    { label: 'Text', value: FieldType.TEXT },
    { label: 'Number', value: FieldType.NUMBER },
    { label: 'Date', value: FieldType.DATE },
    { label: 'Dropdown', value: FieldType.DROPDOWN },
    { label: 'Multi-Select', value: FieldType.MULTI_SELECT },
    { label: 'Checkbox', value: FieldType.CHECKBOX },
    { label: 'Email', value: FieldType.EMAIL },
    { label: 'Phone', value: FieldType.PHONE },
    { label: 'URL', value: FieldType.URL },
    { label: 'Text Area', value: FieldType.TEXTAREA },
    { label: 'Currency', value: FieldType.CURRENCY },
  ];

  constructor(
    private businessTypeService: BusinessTypeService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadBusinessTypes();
  }

  loadBusinessTypes() {
    this.loading.set(true);
    this.businessTypeService.getAll().subscribe({
      next: (res) => {
        this.businessTypes.set(res.data || res || []);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load business types',
        });
        this.loading.set(false);
      },
    });
  }

  openBusinessTypeDialog(bt?: IBusinessType) {
    this.editingBusinessType = bt || null;
    this.businessTypeForm = {
      name: bt?.name || '',
      description: bt?.description || '',
      icon: bt?.icon || 'pi-briefcase',
      color: bt?.color || '#3B82F6',
    };
    this.businessTypeDialogVisible = true;
  }

  editBusinessType(bt: IBusinessType) {
    this.openBusinessTypeDialog(bt);
  }

  saveBusinessType() {
    this.saving.set(true);

    const data = {
      name: this.businessTypeForm.name,
      description: this.businessTypeForm.description,
      icon: this.businessTypeForm.icon,
      color: this.businessTypeForm.color,
    };

    const request = this.editingBusinessType
      ? this.businessTypeService.update(this.editingBusinessType.id, data)
      : this.businessTypeService.create(data);

    request.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: this.editingBusinessType
            ? 'Business type updated'
            : 'Business type created',
        });
        this.businessTypeDialogVisible = false;
        this.loadBusinessTypes();
        this.saving.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save business type',
        });
        this.saving.set(false);
      },
    });
  }

  confirmDeleteBusinessType(bt: IBusinessType) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${bt.name}"? This will also delete all associated fields.`,
      header: 'Delete Business Type',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.businessTypeService.delete(bt.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: 'Business type deleted',
            });
            this.loadBusinessTypes();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete business type',
            });
          },
        });
      },
    });
  }

  openFieldDialog(bt: IBusinessType, field?: IFieldDefinition) {
    this.selectedBusinessType = bt;
    this.editingField = field || null;
    this.fieldForm = {
      name: field?.name || '',
      label: field?.label || '',
      fieldType: field?.fieldType || '',
      placeholder: field?.placeholder || '',
      helpText: field?.helpText || '',
      isRequired: field?.isRequired || false,
      options: field?.options ? [...field.options] : [],
    };
    this.fieldDialogVisible = true;
  }

  editField(bt: IBusinessType, field: IFieldDefinition) {
    this.openFieldDialog(bt, field);
  }

  saveField() {
    if (!this.selectedBusinessType) return;

    this.saving.set(true);

    const data: any = {
      name: this.fieldForm.name,
      label: this.fieldForm.label,
      fieldType: this.fieldForm.fieldType,
      placeholder: this.fieldForm.placeholder,
      helpText: this.fieldForm.helpText,
      isRequired: this.fieldForm.isRequired,
    };

    if (
      this.fieldForm.fieldType === FieldType.DROPDOWN ||
      this.fieldForm.fieldType === FieldType.MULTI_SELECT
    ) {
      data.options = this.fieldForm.options.filter(
        (o: any) => o.label && o.value
      );
    }

    const request = this.editingField
      ? this.businessTypeService.updateField(this.editingField.id, data)
      : this.businessTypeService.createField(
          this.selectedBusinessType.id,
          data
        );

    request.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: this.editingField ? 'Field updated' : 'Field created',
        });
        this.fieldDialogVisible = false;
        this.loadBusinessTypes();
        this.saving.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save field',
        });
        this.saving.set(false);
      },
    });
  }

  confirmDeleteField(field: IFieldDefinition) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the field "${field.label}"?`,
      header: 'Delete Field',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.businessTypeService.deleteField(field.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: 'Field deleted',
            });
            this.loadBusinessTypes();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete field',
            });
          },
        });
      },
    });
  }

  addOption() {
    this.fieldForm.options.push({ label: '', value: '' });
  }

  removeOption(index: number) {
    this.fieldForm.options.splice(index, 1);
  }

  getFieldTypeLabel(type: FieldType): string {
    const option = this.fieldTypeOptions.find((o) => o.value === type);
    return option?.label || type;
  }

  getFieldTypeSeverity(type: FieldType): any {
    const severityMap: Record<string, any> = {
      [FieldType.TEXT]: 'info',
      [FieldType.NUMBER]: 'success',
      [FieldType.DATE]: 'warn',
      [FieldType.DROPDOWN]: 'secondary',
      [FieldType.MULTI_SELECT]: 'secondary',
      [FieldType.CHECKBOX]: 'contrast',
      [FieldType.EMAIL]: 'info',
      [FieldType.PHONE]: 'info',
      [FieldType.URL]: 'info',
      [FieldType.TEXTAREA]: 'info',
      [FieldType.CURRENCY]: 'success',
    };
    return severityMap[type] || 'info';
  }
}
