export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  DROPDOWN = 'dropdown',
  MULTI_SELECT = 'multi_select',
  CHECKBOX = 'checkbox',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  TEXTAREA = 'textarea',
  CURRENCY = 'currency',
}

export interface ICustomFieldOption {
  label: string;
  value: string;
}

export interface IFieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
}

export interface IVisibilityCondition {
  dependsOn?: string;
  showWhen?: string[];
}

export interface IFieldDefinition {
  id: string;
  businessTypeId: string;
  name: string;
  label: string;
  fieldType: FieldType;
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  isActive: boolean;
  order: number;
  options?: ICustomFieldOption[];
  validation?: IFieldValidation;
  defaultValue?: string;
  visibilityCondition?: IVisibilityCondition;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBusinessType {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  isActive: boolean;
  order: number;
  fields?: IFieldDefinition[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeadCustomField {
  id: string;
  leadId: string;
  fieldDefinitionId: string;
  fieldDefinition?: IFieldDefinition;
  value?: string;
  arrayValue?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IStatusTransition {
  id: string;
  fromStatusId: string;
  fromStatus?: {
    id: string;
    name: string;
    color: string;
  };
  toStatusId: string;
  toStatus?: {
    id: string;
    name: string;
    color: string;
  };
  isActive: boolean;
  requiresComment: boolean;
  allowedRoles?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// DTOs for creating/updating
export interface ICreateBusinessType {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface IUpdateBusinessType {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  order?: number;
}

export interface ICreateFieldDefinition {
  businessTypeId: string;
  name: string;
  label: string;
  fieldType: FieldType;
  placeholder?: string;
  helpText?: string;
  isRequired?: boolean;
  order?: number;
  options?: ICustomFieldOption[];
  validation?: IFieldValidation;
  defaultValue?: string;
  visibilityCondition?: IVisibilityCondition;
}

export interface IUpdateFieldDefinition {
  name?: string;
  label?: string;
  fieldType?: FieldType;
  placeholder?: string;
  helpText?: string;
  isRequired?: boolean;
  isActive?: boolean;
  order?: number;
  options?: ICustomFieldOption[];
  validation?: IFieldValidation;
  defaultValue?: string;
  visibilityCondition?: IVisibilityCondition;
}

export interface ISetCustomFieldValue {
  fieldDefinitionId: string;
  value?: string;
  arrayValue?: string[];
}

export interface ICreateStatusTransition {
  fromStatusId: string;
  toStatusId: string;
  requiresComment?: boolean;
  allowedRoles?: string[];
}

export interface IBulkCreateTransitions {
  fromStatusId: string;
  toStatusIds: string[];
  requiresComment?: boolean;
}
