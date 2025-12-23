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
  templateUrl: './business-type-list.component.html',
  styleUrl: './business-type-list.component.scss',
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
