import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';
import { ConnectorService, AuthService } from '../../../../core/services';
import {
  IConnector,
  IConnectorLog,
  ConnectorType,
} from '../../../../core/models';

@Component({
  selector: 'app-connector-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    ToastModule,
    InputTextModule,
    TextareaModule,
    ToggleSwitchModule,
    SelectModule,
    TableModule,
    TabsModule,
    TooltipModule,
    PasswordModule,
    LayoutComponent,
  ],
  providers: [MessageService],
  template: `
    <app-layout>
      <p-toast />
      <div class="page-container" *ngIf="connector(); else loadingTpl">
        <div class="page-header">
          <div class="header-left">
            <button
              pButton
              icon="pi pi-arrow-left"
              [text]="true"
              (click)="goBack()"
            ></button>
            <div class="header-info">
              <div class="connector-title">
                <div
                  class="connector-icon"
                  [attr.data-type]="connector()!.type"
                >
                  <i
                    class="pi"
                    [ngClass]="
                      connectorService.getConnectorIcon(connector()!.type)
                    "
                  ></i>
                </div>
                <h1>{{ connector()!.name }}</h1>
              </div>
              <p class="page-subtitle">
                {{
                  connector()!.description ||
                    'Configure your connector settings'
                }}
              </p>
            </div>
          </div>
          <div class="header-actions">
            <div class="status-toggle">
              <span>Active</span
              ><p-toggleswitch
                [(ngModel)]="isActive"
                (onChange)="toggleActive()"
              ></p-toggleswitch>
            </div>
            <button
              pButton
              icon="pi pi-refresh"
              label="Test Connection"
              severity="secondary"
              (click)="testConnection()"
              [loading]="testing()"
            ></button>
          </div>
        </div>
        <div
          class="status-card"
          [class.connected]="connector()!.status === 'connected'"
          [class.error]="connector()!.status === 'error'"
        >
          <div class="status-info">
            <div class="status-indicator">
              <span class="status-dot"></span
              ><span class="status-text">{{
                connector()!.status | titlecase
              }}</span>
            </div>
            <span class="last-sync" *ngIf="connector()!.lastSyncAt"
              >Last sync: {{ connector()!.lastSyncAt | date : 'medium' }}</span
            >
          </div>
          <div class="error-message" *ngIf="connector()!.lastError">
            <i class="pi pi-exclamation-triangle"></i
            >{{ connector()!.lastError }}
          </div>
        </div>
        <p-tabs value="0">
          <p-tablist>
            <p-tab value="0">Configuration</p-tab>
            <p-tab value="1">Field Mapping</p-tab>
            <p-tab value="2" *ngIf="connector()!.type === 'webhook'"
              >Test Webhook</p-tab
            >
            <p-tab value="3">Activity Log</p-tab>
          </p-tablist>
          <p-tabpanels>
            <p-tabpanel value="0">
              <div class="config-section">
                <ng-container *ngIf="connector()!.type === 'webhook'">
                  <div class="webhook-config">
                    <h3><i class="pi pi-link"></i> Webhook URL</h3>
                    <p class="hint">
                      Send POST requests to this URL to create leads
                    </p>
                    <div class="webhook-url-box">
                      <code>{{ getWebhookFullUrl() }}</code
                      ><button
                        pButton
                        icon="pi pi-copy"
                        [text]="true"
                        pTooltip="Copy URL"
                        (click)="copyToClipboard(getWebhookFullUrl())"
                      ></button>
                    </div>
                    <h3><i class="pi pi-key"></i> Webhook Secret</h3>
                    <p class="hint">
                      Use this secret to sign your webhook payloads
                      (HMAC-SHA256)
                    </p>
                    <div class="webhook-url-box">
                      <code>{{ connector()!.webhookSecret }}</code
                      ><button
                        pButton
                        icon="pi pi-copy"
                        [text]="true"
                        pTooltip="Copy Secret"
                        (click)="
                          copyToClipboard(connector()!.webhookSecret || '')
                        "
                      ></button
                      ><button
                        pButton
                        icon="pi pi-refresh"
                        [text]="true"
                        severity="warn"
                        pTooltip="Regenerate"
                        (click)="regenerateSecret()"
                      ></button>
                    </div>
                  </div>
                </ng-container>
                <ng-container *ngIf="connector()!.type === 'indiamart'">
                  <div class="webhook-config">
                    <h3>
                      <i class="pi pi-shopping-cart"></i> IndiaMART Push API
                      Setup
                    </h3>
                    <p class="hint">
                      Configure this webhook URL in your IndiaMART Lead Manager
                      to receive leads automatically
                    </p>
                    <div class="webhook-url-box">
                      <code>{{ getWebhookFullUrl() }}</code
                      ><button
                        pButton
                        icon="pi pi-copy"
                        [text]="true"
                        pTooltip="Copy URL"
                        (click)="copyToClipboard(getWebhookFullUrl())"
                      ></button>
                    </div>
                    <div class="setup-instructions">
                      <h4>
                        <i class="pi pi-info-circle"></i> Setup Instructions
                      </h4>
                      <ol>
                        <li>Login to your IndiaMART Lead Manager</li>
                        <li>Go to Settings → Push API Configuration</li>
                        <li>Enter the webhook URL shown above</li>
                        <li>
                          Enter your GLID and Mobile Key in the configuration
                          below
                        </li>
                        <li>Save and test the connection</li>
                      </ol>
                    </div>
                  </div>
                </ng-container>
                <ng-container *ngIf="connector()!.type === 'tradeindia'">
                  <div class="sync-config">
                    <h3><i class="pi pi-globe"></i> TradeIndia Sync Status</h3>
                    <p class="hint">
                      TradeIndia uses Pull API - leads are fetched periodically
                      based on your sync interval
                    </p>
                    <div class="sync-status-box">
                      <div class="sync-info">
                        <span class="sync-label">Last Sync:</span>
                        <span
                          class="sync-value"
                          *ngIf="configValues['lastSyncTime']"
                        >
                          {{ configValues['lastSyncTime'] | date : 'medium' }}
                        </span>
                        <span
                          class="sync-value"
                          *ngIf="!configValues['lastSyncTime']"
                          >Never</span
                        >
                      </div>
                      <div class="sync-info">
                        <span class="sync-label">Sync Status:</span>
                        <span
                          class="sync-value"
                          [class.syncing]="
                            configValues['syncStatus'] === 'syncing'
                          "
                        >
                          {{ configValues['syncStatus'] || 'idle' | titlecase }}
                        </span>
                      </div>
                      <button
                        pButton
                        label="Sync Now"
                        icon="pi pi-sync"
                        (click)="syncTradeIndia()"
                        [loading]="syncingTradeIndia()"
                        [disabled]="!isConfigValid()"
                      ></button>
                    </div>
                  </div>
                </ng-container>
                <ng-container
                  *ngIf="connectorTypeConfig()?.configFields?.length"
                >
                  <div class="config-fields">
                    <h3>
                      <i class="pi pi-cog"></i>
                      {{ getTypeName() }} Configuration
                    </h3>
                    <p class="hint">
                      Configure your {{ getTypeName() }} integration settings
                    </p>
                    <div class="config-grid">
                      <ng-container
                        *ngFor="
                          let field of connectorTypeConfig()!.configFields
                        "
                      >
                        <div
                          class="config-field"
                          [class.full-width]="field.type === 'textarea'"
                        >
                          <label [for]="field.key"
                            >{{ field.label
                            }}<span class="required" *ngIf="field.required"
                              >*</span
                            ></label
                          >
                          <ng-container [ngSwitch]="field.type">
                            <input
                              *ngSwitchCase="'text'"
                              pInputText
                              [id]="field.key"
                              [(ngModel)]="configValues[field.key]"
                              [placeholder]="field.placeholder || ''"
                              [readonly]="field.readOnly"
                              class="w-full"
                            />
                            <p-password
                              *ngSwitchCase="'password'"
                              [id]="field.key"
                              [(ngModel)]="configValues[field.key]"
                              [placeholder]="field.placeholder || ''"
                              [feedback]="false"
                              [toggleMask]="true"
                              class="w-full"
                            ></p-password>
                            <textarea
                              *ngSwitchCase="'textarea'"
                              pTextarea
                              [id]="field.key"
                              [(ngModel)]="configValues[field.key]"
                              [placeholder]="field.placeholder || ''"
                              [readonly]="field.readOnly"
                              rows="4"
                              class="w-full"
                            ></textarea>
                            <p-select
                              *ngSwitchCase="'select'"
                              [id]="field.key"
                              [(ngModel)]="configValues[field.key]"
                              [options]="field.options || []"
                              optionLabel="label"
                              optionValue="value"
                              [placeholder]="field.placeholder || 'Select...'"
                              class="w-full"
                            ></p-select>
                            <p-toggleswitch
                              *ngSwitchCase="'toggle'"
                              [id]="field.key"
                              [(ngModel)]="configValues[field.key]"
                            ></p-toggleswitch>
                            <input
                              *ngSwitchCase="'number'"
                              pInputText
                              type="number"
                              [id]="field.key"
                              [(ngModel)]="configValues[field.key]"
                              [placeholder]="field.placeholder || ''"
                              class="w-full"
                            />
                          </ng-container>
                          <small class="field-hint" *ngIf="field.hint">{{
                            field.hint
                          }}</small>
                        </div>
                      </ng-container>
                    </div>
                    <div class="config-actions">
                      <button
                        pButton
                        label="Save Configuration"
                        icon="pi pi-save"
                        (click)="saveConfig()"
                        [loading]="savingConfig()"
                        [disabled]="!isConfigValid()"
                      ></button>
                      <button
                        *ngIf="
                          connectorTypeConfig()?.authType === 'oauth' &&
                          connector()!.status !== 'connected'
                        "
                        pButton
                        label="Connect with {{ getTypeName() }}"
                        icon="pi pi-external-link"
                        severity="success"
                        (click)="initiateOAuth()"
                        [disabled]="!isConfigValid()"
                      ></button>
                    </div>
                  </div>
                </ng-container>
                <ng-container
                  *ngIf="
                    connectorTypeConfig()?.authType === 'oauth' &&
                    connector()!.status === 'connected'
                  "
                >
                  <div class="oauth-config">
                    <div class="connected-account">
                      <i class="pi pi-check-circle"></i>
                      <div class="account-info">
                        <span class="account-name">{{
                          connector()!.externalAccountName ||
                            'Connected Account'
                        }}</span
                        ><span
                          class="page-name"
                          *ngIf="connector()!.externalPageName"
                          >{{ connector()!.externalPageName }}</span
                        >
                      </div>
                      <button
                        pButton
                        label="Disconnect"
                        severity="danger"
                        [outlined]="true"
                        (click)="disconnect()"
                      ></button>
                    </div>
                  </div>
                </ng-container>
                <ng-container *ngIf="connector()!.type === 'webhook'">
                  <div class="sample-section">
                    <h3><i class="pi pi-code"></i> Sample Payload</h3>
                    <pre class="sample-payload">{{
                      getSamplePayload() | json
                    }}</pre>
                  </div>
                </ng-container>
              </div>
            </p-tabpanel>
            <p-tabpanel value="1">
              <div class="mapping-section">
                <h3>
                  <i class="pi pi-arrows-h"></i> Map External Fields to Lead
                  Fields
                </h3>
                <p class="hint">
                  Define how incoming data maps to your lead fields. Use dot
                  notation for nested fields.
                </p>
                <div class="mapping-grid">
                  <div
                    class="mapping-row"
                    *ngFor="let field of connectorService.fieldOptions()"
                  >
                    <div class="lead-field">
                      <span class="field-label">{{ field.label }}</span
                      ><span class="required" *ngIf="field.required">*</span>
                    </div>
                    <i class="pi pi-arrow-left"></i>
                    <input
                      pInputText
                      [(ngModel)]="fieldMapping[field.value]"
                      placeholder="Source field path"
                      class="source-field"
                    />
                  </div>
                </div>
                <div class="mapping-actions">
                  <button
                    pButton
                    label="Save Mapping"
                    icon="pi pi-save"
                    (click)="saveFieldMapping()"
                    [loading]="savingMapping()"
                  ></button>
                  <button
                    pButton
                    label="Reset to Default"
                    severity="secondary"
                    (click)="resetFieldMapping()"
                  ></button>
                </div>
              </div>
            </p-tabpanel>
            <p-tabpanel value="2" *ngIf="connector()!.type === 'webhook'">
              <div class="test-section">
                <h3><i class="pi pi-play"></i> Test Your Webhook</h3>
                <p class="hint">
                  Send a test payload to verify your field mapping
                </p>
                <div class="test-payload-input">
                  <label>Test Payload (JSON)</label
                  ><textarea
                    pTextarea
                    [(ngModel)]="testPayloadStr"
                    rows="10"
                  ></textarea>
                </div>
                <button
                  pButton
                  label="Test Webhook"
                  icon="pi pi-send"
                  (click)="testWebhook()"
                  [loading]="testingWebhook()"
                ></button>
                <div
                  class="test-result"
                  *ngIf="testResult()"
                  [class.success]="testResult()!.success"
                  [class.error]="!testResult()!.success"
                >
                  <h4>{{ testResult()!.success ? 'Success' : 'Error' }}</h4>
                  <p>{{ testResult()!.message }}</p>
                  <ng-container *ngIf="testResult()!.normalizedData"
                    ><h5>Normalized Data:</h5>
                    <pre>{{ testResult()!.normalizedData | json }}</pre>
                  </ng-container>
                </div>
              </div>
            </p-tabpanel>
            <p-tabpanel value="3">
              <div class="logs-section">
                <p-table
                  [value]="logs()"
                  [loading]="loadingLogs()"
                  [paginator]="true"
                  [rows]="10"
                >
                  <ng-template pTemplate="header"
                    ><tr>
                      <th>Time</th>
                      <th>Action</th>
                      <th>Status</th>
                      <th>Message</th>
                    </tr></ng-template
                  >
                  <ng-template pTemplate="body" let-log
                    ><tr>
                      <td>{{ log.createdAt | date : 'short' }}</td>
                      <td>{{ log.action }}</td>
                      <td>
                        <p-tag
                          [value]="log.level"
                          [severity]="getLogSeverity(log.level)"
                        />
                      </td>
                      <td>{{ log.message }}</td>
                    </tr></ng-template
                  >
                  <ng-template pTemplate="emptymessage"
                    ><tr>
                      <td colspan="4" class="empty-logs">
                        <i class="pi pi-inbox"></i
                        ><span>No activity logs yet</span>
                      </td>
                    </tr></ng-template
                  >
                </p-table>
              </div>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
      </div>
      <ng-template #loadingTpl
        ><div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i><span>Loading connector...</span>
        </div></ng-template
      >
    </app-layout>
  `,
  styles: [
    `
      .page-container {
        padding: 1.5rem;
        max-width: 1200px;
        margin: 0 auto;
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .header-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .header-info {
        display: flex;
        flex-direction: column;
      }
      .connector-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .connector-title h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
      }
      .connector-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .connector-icon i {
        font-size: 1.25rem;
        color: white;
      }
      .connector-icon[data-type='webhook'] {
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      }
      .connector-icon[data-type='meta'] {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      }
      .connector-icon[data-type='google'] {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      }
      .connector-icon[data-type='youtube'] {
        background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
      }
      .connector-icon[data-type='linkedin'] {
        background: linear-gradient(135deg, #0077b5 0%, #005885 100%);
      }
      .connector-icon[data-type='whatsapp'] {
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
      }
      .connector-icon[data-type='indiamart'] {
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
      }
      .connector-icon[data-type='tradeindia'] {
        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      }
      .page-subtitle {
        margin: 0.25rem 0 0;
        color: #6b7280;
        font-size: 0.875rem;
      }
      .header-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .status-toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
        color: #374151;
      }
      .status-card {
        background: white;
        border-radius: 12px;
        padding: 1rem 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        border-left: 4px solid #9ca3af;
      }
      .status-card.connected {
        border-left-color: #10b981;
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      }
      .status-card.error {
        border-left-color: #ef4444;
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      }
      .status-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .status-indicator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .status-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #9ca3af;
      }
      .status-card.connected .status-dot {
        background: #10b981;
      }
      .status-card.error .status-dot {
        background: #ef4444;
      }
      .status-text {
        font-weight: 600;
        color: #1f2937;
      }
      .last-sync {
        font-size: 0.875rem;
        color: #6b7280;
      }
      .error-message {
        margin-top: 0.75rem;
        padding: 0.75rem;
        background: rgba(239, 68, 68, 0.1);
        border-radius: 6px;
        color: #991b1b;
        font-size: 0.875rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .config-section,
      .mapping-section,
      .test-section,
      .logs-section {
        padding: 1rem 0;
      }
      .config-section h3,
      .mapping-section h3,
      .test-section h3 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .config-section h3 i,
      .mapping-section h3 i,
      .test-section h3 i {
        color: #25d366;
      }
      .hint {
        margin: 0 0 1rem;
        color: #6b7280;
        font-size: 0.875rem;
      }
      .webhook-url-box {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        margin-bottom: 1.5rem;
      }
      .webhook-url-box code {
        flex: 1;
        font-family: monospace;
        font-size: 0.875rem;
        color: #1f2937;
        word-break: break-all;
      }
      .config-fields {
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid #e2e8f0;
      }
      .config-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
        margin-bottom: 1.5rem;
      }
      .config-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .config-field.full-width {
        grid-column: 1 / -1;
      }
      .config-field label {
        font-weight: 500;
        color: #374151;
        font-size: 0.875rem;
      }
      .required {
        color: #ef4444;
        margin-left: 0.25rem;
      }
      .field-hint {
        color: #6b7280;
        font-size: 0.75rem;
      }
      .config-actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }
      .setup-instructions {
        margin-top: 1.5rem;
        padding: 1rem;
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 8px;
      }
      .setup-instructions h4 {
        margin: 0 0 0.75rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #0369a1;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .setup-instructions ol {
        margin: 0;
        padding-left: 1.25rem;
        color: #374151;
        font-size: 0.875rem;
        line-height: 1.8;
      }
      .sync-config {
        margin-bottom: 1.5rem;
      }
      .sync-status-box {
        display: flex;
        align-items: center;
        gap: 2rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1rem 1.5rem;
        flex-wrap: wrap;
      }
      .sync-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .sync-label {
        font-size: 0.75rem;
        color: #6b7280;
        text-transform: uppercase;
        font-weight: 500;
      }
      .sync-value {
        font-weight: 600;
        color: #1f2937;
      }
      .sync-value.syncing {
        color: #f59e0b;
      }
      .sample-section {
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid #e2e8f0;
      }
      .sample-payload {
        background: #1f2937;
        color: #e5e7eb;
        padding: 1rem;
        border-radius: 8px;
        font-size: 0.75rem;
        overflow-x: auto;
      }
      .oauth-config {
        margin-top: 2rem;
      }
      .oauth-config .connected-account {
        display: flex;
        align-items: center;
        gap: 1rem;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 12px;
        padding: 1.5rem;
      }
      .oauth-config .connected-account i {
        font-size: 2rem;
        color: #10b981;
      }
      .oauth-config .account-info {
        flex: 1;
      }
      .oauth-config .account-name {
        display: block;
        font-weight: 600;
        color: #1f2937;
      }
      .oauth-config .page-name {
        display: block;
        font-size: 0.875rem;
        color: #6b7280;
      }
      .mapping-grid {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
      }
      .mapping-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem;
        background: #f8fafc;
        border-radius: 8px;
      }
      .lead-field {
        min-width: 150px;
        font-weight: 500;
        color: #374151;
      }
      .mapping-row i {
        color: #9ca3af;
      }
      .source-field {
        flex: 1;
      }
      .mapping-actions {
        display: flex;
        gap: 0.75rem;
      }
      .test-payload-input {
        margin-bottom: 1rem;
      }
      .test-payload-input label {
        display: block;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.5rem;
      }
      .test-payload-input textarea {
        width: 100%;
        font-family: monospace;
      }
      .test-result {
        margin-top: 1.5rem;
        padding: 1rem;
        border-radius: 8px;
      }
      .test-result.success {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
      }
      .test-result.error {
        background: #fef2f2;
        border: 1px solid #fecaca;
      }
      .test-result h4 {
        margin: 0 0 0.5rem;
      }
      .test-result.success h4 {
        color: #166534;
      }
      .test-result.error h4 {
        color: #991b1b;
      }
      .test-result pre {
        background: #1f2937;
        color: #e5e7eb;
        padding: 0.75rem;
        border-radius: 6px;
        font-size: 0.75rem;
        overflow-x: auto;
        margin-top: 0.75rem;
      }
      .empty-logs {
        text-align: center;
        padding: 2rem;
        color: #9ca3af;
      }
      .empty-logs i {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        display: block;
      }
      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem;
        color: #6b7280;
        gap: 1rem;
      }
      .loading-state i {
        font-size: 2rem;
        color: #25d366;
      }
      .w-full {
        width: 100%;
      }
      :host ::ng-deep .p-password {
        width: 100%;
      }
      @media (max-width: 768px) {
        .config-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ConnectorDetailComponent implements OnInit {
  connector = signal<IConnector | null>(null);
  logs = signal<IConnectorLog[]>([]);
  loading = signal(false);
  loadingLogs = signal(false);
  testing = signal(false);
  testingWebhook = signal(false);
  savingMapping = signal(false);
  savingConfig = signal(false);
  syncingTradeIndia = signal(false);
  testResult = signal<{
    success: boolean;
    message: string;
    normalizedData?: Record<string, any>;
  } | null>(null);
  isActive = false;
  fieldMapping: Record<string, string> = {};
  configValues: Record<string, any> = {};
  testPayloadStr =
    '{\n  "phone": "+919876543210",\n  "name": "Test Lead",\n  "email": "test@example.com"\n}';
  connectorTypeConfig = computed(() => {
    const c = this.connector();
    if (!c) return null;
    return this.connectorService
      .connectorTypes()
      .find((t) => t.type === c.type);
  });
  constructor(
    public connectorService: ConnectorService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {}
  ngOnInit(): void {
    this.connectorService.loadFieldOptions().subscribe();
    this.connectorService.loadConnectorTypes().subscribe();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadConnector(id);
  }
  loadConnector(id: string): void {
    this.loading.set(true);
    this.connectorService.getConnector(id).subscribe({
      next: (response) => {
        this.connector.set(response.data);
        this.isActive = response.data.isActive;
        this.fieldMapping = response.data.fieldMapping
          ? { ...response.data.fieldMapping }
          : {};
        this.configValues = response.data.config
          ? { ...response.data.config }
          : {};
        this.loading.set(false);
        this.loadLogs(id);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load connector',
        });
        this.loading.set(false);
        this.router.navigate(['/connectors']);
      },
    });
  }
  loadLogs(connectorId: string): void {
    this.loadingLogs.set(true);
    this.connectorService
      .getConnectorLogs(connectorId, { limit: 50 })
      .subscribe({
        next: (response) => {
          this.logs.set(response.data || []);
          this.loadingLogs.set(false);
        },
        error: () => this.loadingLogs.set(false),
      });
  }
  goBack(): void {
    this.router.navigate(['/connectors']);
  }
  getWebhookFullUrl(): string {
    const c = this.connector();
    return c ? this.connectorService.getWebhookFullUrl(c) : '';
  }
  getSamplePayload(): Record<string, any> {
    const typeConfig = this.connectorTypeConfig();
    if (typeConfig?.defaultFieldMapping) {
      const sample: Record<string, any> = {};
      Object.keys(typeConfig.defaultFieldMapping).forEach((key) => {
        if (key.includes('.')) {
          sample[key.split('.')[0]] = { [key.split('.')[1]]: 'sample_value' };
        } else {
          sample[key] = key === 'phone' ? '+919876543210' : 'sample_value';
        }
      });
      return sample;
    }
    return {
      phone: '+919876543210',
      name: 'John Doe',
      email: 'john@example.com',
      source: 'Website Form',
    };
  }
  getTypeName(): string {
    const c = this.connector();
    if (!c) return '';
    const names: Record<ConnectorType, string> = {
      [ConnectorType.WEBHOOK]: 'Webhook',
      [ConnectorType.META]: 'Meta',
      [ConnectorType.GOOGLE]: 'Google',
      [ConnectorType.YOUTUBE]: 'YouTube',
      [ConnectorType.LINKEDIN]: 'LinkedIn',
      [ConnectorType.WHATSAPP]: 'WhatsApp',
      [ConnectorType.INDIAMART]: 'IndiaMART',
      [ConnectorType.TRADEINDIA]: 'TradeIndia',
    };
    return names[c.type] || c.type;
  }
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
    this.messageService.add({
      severity: 'success',
      summary: 'Copied',
      detail: 'Copied to clipboard',
    });
  }
  toggleActive(): void {
    const c = this.connector();
    if (!c) return;
    this.connectorService
      .updateConnector(c.id, { isActive: this.isActive })
      .subscribe({
        next: (response) => {
          this.connector.set(response.data);
          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: `Connector ${this.isActive ? 'activated' : 'deactivated'}`,
          });
        },
        error: () => {
          this.isActive = !this.isActive;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update',
          });
        },
      });
  }
  saveConfig(): void {
    const c = this.connector();
    if (!c) return;
    this.savingConfig.set(true);
    this.connectorService
      .updateConnector(c.id, { config: this.configValues })
      .subscribe({
        next: (response) => {
          this.connector.set(response.data);
          this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Configuration saved successfully',
          });
          this.savingConfig.set(false);
        },
        error: () => {
          this.savingConfig.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save configuration',
          });
        },
      });
  }
  testConnection(): void {
    const c = this.connector();
    if (!c) return;
    this.testing.set(true);
    this.connectorService.testConnection(c.id).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: response.data.success ? 'success' : 'warn',
          summary: response.data.success ? 'Connected' : 'Issue',
          detail: response.data.message,
        });
        this.testing.set(false);
        this.loadConnector(c.id);
      },
      error: () => {
        this.testing.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Test failed',
        });
      },
    });
  }
  regenerateSecret(): void {
    const c = this.connector();
    if (!c) return;
    this.connectorService.regenerateSecret(c.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Regenerated',
          detail: 'New secret generated',
        });
        this.loadConnector(c.id);
      },
      error: () =>
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to regenerate',
        }),
    });
  }
  syncTradeIndia(): void {
    const c = this.connector();
    if (!c || c.type !== 'tradeindia') return;
    this.syncingTradeIndia.set(true);
    this.connectorService.syncTradeIndia(c.id).subscribe({
      next: (response) => {
        const data = response.data;
        this.messageService.add({
          severity: data.success ? 'success' : 'warn',
          summary: data.success ? 'Sync Complete' : 'Sync Issue',
          detail: `${data.message}. Created: ${data.leadsCreated}, Duplicates: ${data.leadsDuplicate}`,
        });
        this.syncingTradeIndia.set(false);
        this.loadConnector(c.id);
      },
      error: () => {
        this.syncingTradeIndia.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to sync TradeIndia leads',
        });
      },
    });
  }
  saveFieldMapping(): void {
    const c = this.connector();
    if (!c) return;
    this.savingMapping.set(true);
    this.connectorService
      .updateFieldMapping(c.id, this.fieldMapping)
      .subscribe({
        next: (response) => {
          this.connector.set(response.data);
          this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Field mapping updated',
          });
          this.savingMapping.set(false);
        },
        error: () => {
          this.savingMapping.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save',
          });
        },
      });
  }
  resetFieldMapping(): void {
    const typeConfig = this.connectorTypeConfig();
    if (typeConfig?.defaultFieldMapping) {
      this.fieldMapping = { ...typeConfig.defaultFieldMapping };
    } else {
      const c = this.connector();
      if (c) this.fieldMapping = c.fieldMapping ? { ...c.fieldMapping } : {};
    }
  }
  testWebhook(): void {
    const c = this.connector();
    if (!c) return;
    this.testingWebhook.set(true);
    this.testResult.set(null);
    try {
      const payload = JSON.parse(this.testPayloadStr);
      this.connectorService.testWebhook(c.id, payload).subscribe({
        next: (response) => {
          this.testResult.set(response.data);
          this.testingWebhook.set(false);
        },
        error: () => {
          this.testingWebhook.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Test failed',
          });
        },
      });
    } catch {
      this.testingWebhook.set(false);
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid JSON',
        detail: 'Please enter valid JSON',
      });
    }
  }
  initiateOAuth(): void {
    const c = this.connector();
    if (!c) return;
    this.connectorService.getOAuthUrl(c.type, c.id).subscribe({
      next: (response) => (window.location.href = response.data.url),
      error: () =>
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to initiate OAuth',
        }),
    });
  }
  disconnect(): void {
    const c = this.connector();
    if (!c) return;
    this.connectorService
      .updateConnector(c.id, { config: { disconnected: true } })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Disconnected',
            detail: 'Account disconnected',
          });
          this.loadConnector(c.id);
        },
        error: () =>
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to disconnect',
          }),
      });
  }
  getLogSeverity(level: string): 'success' | 'info' | 'warn' | 'danger' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
      success: 'success',
      info: 'info',
      warning: 'warn',
      error: 'danger',
    };
    return map[level] || 'info';
  }
  isConfigValid(): boolean {
    const typeConfig = this.connectorTypeConfig();
    if (!typeConfig?.configFields) return true;
    return typeConfig.configFields
      .filter((f) => f.required)
      .every((f) => this.configValues[f.key]);
  }
}
