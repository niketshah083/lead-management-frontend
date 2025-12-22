export enum ConnectorType {
  WEBHOOK = 'webhook',
  META = 'meta',
  GOOGLE = 'google',
  YOUTUBE = 'youtube',
  LINKEDIN = 'linkedin',
  WHATSAPP = 'whatsapp',
  INDIAMART = 'indiamart',
  TRADEINDIA = 'tradeindia',
}

export enum ConnectorStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  PENDING = 'pending',
}

export interface IConfigFieldOption {
  label: string;
  value: string;
}

export interface IConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'textarea' | 'select' | 'toggle' | 'number';
  placeholder?: string;
  hint?: string;
  required: boolean;
  readOnly?: boolean;
  defaultValue?: any;
  options?: IConfigFieldOption[];
}

export interface IOAuthConfig {
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
}

export interface IConnector {
  id: string;
  name: string;
  type: ConnectorType;
  status: ConnectorStatus;
  description?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  externalAccountId?: string;
  externalAccountName?: string;
  externalPageId?: string;
  externalPageName?: string;
  config?: Record<string, any>;
  fieldMapping?: Record<string, string>;
  isActive: boolean;
  lastSyncAt?: string;
  lastError?: string;
  syncIntervalMinutes: number;
  createdById?: string;
  createdBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IConnectorType {
  type: ConnectorType;
  name: string;
  description: string;
  icon: string;
  authType: 'webhook' | 'oauth' | 'api_key';
  oauthConfig?: IOAuthConfig;
  configFields: IConfigField[];
  defaultFieldMapping: Record<string, string>;
}

export interface IConnectorLog {
  id: string;
  connectorId: string;
  action: string;
  level: 'success' | 'error' | 'warning' | 'info';
  message: string;
  rawPayload?: Record<string, any>;
  processedData?: Record<string, any>;
  leadId?: string;
  errorDetails?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface IFieldOption {
  value: string;
  label: string;
  required: boolean;
}

export interface ICreateConnector {
  name: string;
  type: ConnectorType;
  description?: string;
  config?: Record<string, any>;
  fieldMapping?: Record<string, string>;
  syncIntervalMinutes?: number;
}

export interface IUpdateConnector {
  name?: string;
  description?: string;
  config?: Record<string, any>;
  fieldMapping?: Record<string, string>;
  isActive?: boolean;
  syncIntervalMinutes?: number;
}

export interface IConnectorFilter {
  type?: ConnectorType;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface ITestWebhookResult {
  success: boolean;
  normalizedData: Record<string, any>;
  message: string;
}

export interface IWebhookProcessResult {
  success: boolean;
  leadId?: string;
  message: string;
}
