import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TimelineModule } from 'primeng/timeline';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MessageService } from 'primeng/api';
import {
  LeadService,
  AuthService,
  FloatingChatService,
} from '../../../../core/services';
import {
  ILead,
  ILeadHistory,
  ILeadContact,
  LeadStatus,
} from '../../../../core/models';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';
import { LeadEditDialogComponent } from '../../../../shared/components/lead-edit-dialog/lead-edit-dialog.component';

@Component({
  selector: 'app-lead-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    TagModule,
    SelectModule,
    ToastModule,
    TimelineModule,
    DialogModule,
    TextareaModule,
    InputTextModule,
    CheckboxModule,
    AutoCompleteModule,
    LayoutComponent,
    LeadEditDialogComponent,
  ],
  providers: [MessageService],
  template: `
    <app-layout>
      <p-toast />
      <div class="page-container">
        @if (loading()) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Loading lead...</p>
        </div>
        } @else if (lead()) {
        <div class="page-header">
          <button
            pButton
            label="Back to Leads"
            icon="pi pi-arrow-left"
            [text]="true"
            routerLink="/leads"
          ></button>
          <div class="header-actions">
            <button
              pButton
              label="Edit"
              icon="pi pi-pencil"
              [outlined]="true"
              (click)="openEditDialog()"
            ></button>
            <button
              pButton
              label="Open Floating Chat"
              icon="pi pi-comments"
              (click)="openFloatingChat()"
              class="chat-btn"
            ></button>
            <button
              pButton
              label="Float Chat"
              icon="pi pi-external-link"
              (click)="openFloatingChat()"
              class="float-chat-btn"
              pTooltip="Open chat in floating window"
            ></button>
          </div>
        </div>

        <div class="detail-layout">
          <!-- Left Column - Lead Info -->
          <div class="left-column">
            <!-- Visiting Card Style - Editable -->
            <div class="visiting-card">
              <div class="vc-header">
                <div class="vc-name-section">
                  @if (editingField === 'name') {
                  <input
                    pInputText
                    [(ngModel)]="editValue"
                    class="vc-edit-input vc-name-input"
                    (blur)="saveField('name')"
                    (keyup.enter)="saveField('name')"
                    (keyup.escape)="cancelEdit()"
                    autofocus
                  />
                  } @else {
                  <h1
                    class="vc-name vc-editable"
                    (click)="startEdit('name', lead()!.name || '')"
                  >
                    {{ lead()!.name || 'Click to add name' }}
                    <i class="pi pi-pencil vc-edit-icon"></i>
                  </h1>
                  } @if (editingField === 'businessName') {
                  <input
                    pInputText
                    [(ngModel)]="editValue"
                    class="vc-edit-input vc-business-input"
                    placeholder="Business name"
                    (blur)="saveField('businessName')"
                    (keyup.enter)="saveField('businessName')"
                    (keyup.escape)="cancelEdit()"
                    autofocus
                  />
                  } @else {
                  <span
                    class="vc-business vc-editable"
                    (click)="
                      startEdit('businessName', lead()!.businessName || '')
                    "
                  >
                    {{ lead()!.businessName || 'Add business name' }}
                    <i class="pi pi-pencil vc-edit-icon"></i>
                  </span>
                  }
                </div>
                <p-tag
                  [severity]="getStatusSeverity(lead()!.status)"
                  [value]="lead()!.status"
                  class="status-tag"
                />
              </div>
              <div class="vc-body">
                <div class="vc-contact-row">
                  <span class="vc-item vc-readonly"
                    ><i class="pi pi-phone"></i> {{ lead()!.phoneNumber }}</span
                  >
                  @if (editingField === 'email') {
                  <input
                    pInputText
                    [(ngModel)]="editValue"
                    class="vc-edit-input vc-email-input"
                    type="email"
                    placeholder="Email"
                    (blur)="saveField('email')"
                    (keyup.enter)="saveField('email')"
                    (keyup.escape)="cancelEdit()"
                    autofocus
                  />
                  } @else {
                  <span
                    class="vc-item vc-editable"
                    (click)="startEdit('email', lead()!.email || '')"
                  >
                    <i class="pi pi-envelope"></i>
                    {{ lead()!.email || 'Add email' }}
                    <i class="pi pi-pencil vc-edit-icon"></i>
                  </span>
                  }
                </div>
                <div class="vc-meta-row">
                  @if (editingField === 'category') {
                  <p-select
                    [options]="categoryOptions"
                    [(ngModel)]="editValue"
                    placeholder="Category"
                    class="vc-meta-select"
                    size="small"
                    (onChange)="saveField('category')"
                    (onBlur)="cancelEdit()"
                    appendTo="body"
                  />
                  } @else {
                  <span
                    class="vc-meta vc-editable"
                    (click)="startEdit('category', lead()!.categoryId || '')"
                  >
                    <i class="pi pi-tag"></i>
                    {{ lead()!.category?.name || 'No Category' }}
                    <i class="pi pi-pencil vc-edit-icon"></i>
                  </span>
                  } @if (editingField === 'assignedTo') {
                  <p-select
                    [options]="userOptions"
                    [(ngModel)]="editValue"
                    placeholder="Assign to"
                    class="vc-meta-select"
                    size="small"
                    (onChange)="saveField('assignedTo')"
                    (onBlur)="cancelEdit()"
                    appendTo="body"
                  />
                  } @else {
                  <span
                    class="vc-meta vc-editable"
                    (click)="
                      startEdit('assignedTo', lead()!.assignedToId || '')
                    "
                  >
                    <i class="pi pi-user"></i>
                    {{ lead()!.assignedTo?.name || 'Unassigned' }}
                    <i class="pi pi-pencil vc-edit-icon"></i>
                  </span>
                  }
                  <span class="vc-meta vc-readonly"
                    ><i class="pi pi-calendar"></i>
                    {{ lead()!.createdAt | date : 'shortDate' }}</span
                  >
                </div>
              </div>
              @if (canUpdateStatus()) {
              <div class="vc-footer">
                <p-select
                  [options]="statusOptions"
                  [(ngModel)]="newStatus"
                  placeholder="Change status"
                  class="vc-status-select"
                  size="small"
                />
                <button
                  pButton
                  label="Update"
                  size="small"
                  (click)="openStatusChangeDialog()"
                  [disabled]="!newStatus"
                ></button>
              </div>
              }
            </div>

            <!-- Business Address Card -->
            <div class="address-card">
              <div class="card-header-row">
                <h2 class="card-title">
                  <i class="pi pi-map"></i> Business Address
                </h2>
                <button
                  pButton
                  icon="pi pi-pencil"
                  [text]="true"
                  [rounded]="true"
                  size="small"
                  pTooltip="Edit Address"
                  (click)="openAddressDialog()"
                ></button>
              </div>
              @if (hasAddress()) {
              <div class="address-content">
                @if (lead()!.addressLine1) {
                <p>{{ lead()!.addressLine1 }}</p>
                } @if (lead()!.addressLine2) {
                <p>{{ lead()!.addressLine2 }}</p>
                }
                <p>
                  @if (lead()!.city) { {{ lead()!.city }} } @if (lead()!.state)
                  { , {{ lead()!.state }} }
                </p>
                @if (lead()!.country) {
                <p>{{ lead()!.country }}</p>
                }
              </div>
              } @else {
              <div class="empty-state">
                <i class="pi pi-map-marker"></i>
                <span>No address added</span>
                <button
                  pButton
                  label="Add Address"
                  [text]="true"
                  size="small"
                  (click)="openAddressDialog()"
                ></button>
              </div>
              }
            </div>

            <!-- Contact Persons Card -->
            <div class="contacts-card">
              <div class="card-header-row">
                <h2 class="card-title">
                  <i class="pi pi-users"></i> Contact Persons
                </h2>
                <button
                  pButton
                  icon="pi pi-plus"
                  [text]="true"
                  [rounded]="true"
                  size="small"
                  pTooltip="Add Contact"
                  (click)="openContactDialog()"
                ></button>
              </div>
              @if (contacts().length > 0) {
              <div class="contacts-list">
                @for (contact of contacts(); track contact.id) {
                <div class="contact-item" [class.primary]="contact.isPrimary">
                  <div class="contact-info">
                    <div class="contact-name">
                      {{ contact.name }}
                      @if (contact.isPrimary) {
                      <span class="primary-badge">Primary</span>
                      }
                    </div>
                    @if (contact.designation) {
                    <div class="contact-designation">
                      {{ contact.designation }}
                    </div>
                    }
                    <div class="contact-details">
                      @if (contact.phone) {
                      <span
                        ><i class="pi pi-phone"></i> {{ contact.phone }}</span
                      >
                      } @if (contact.email) {
                      <span
                        ><i class="pi pi-envelope"></i>
                        {{ contact.email }}</span
                      >
                      }
                    </div>
                  </div>
                  <div class="contact-actions">
                    <button
                      pButton
                      icon="pi pi-pencil"
                      [text]="true"
                      [rounded]="true"
                      size="small"
                      (click)="editContact(contact)"
                    ></button>
                    <button
                      pButton
                      icon="pi pi-trash"
                      [text]="true"
                      [rounded]="true"
                      size="small"
                      severity="danger"
                      (click)="deleteContact(contact)"
                    ></button>
                  </div>
                </div>
                }
              </div>
              } @else {
              <div class="empty-state">
                <i class="pi pi-user-plus"></i>
                <span>No contacts added</span>
                <button
                  pButton
                  label="Add Contact"
                  [text]="true"
                  size="small"
                  (click)="openContactDialog()"
                ></button>
              </div>
              }
            </div>

            @if (lead()!.slaStatus) {
            <div class="sla-card">
              <h2 class="card-title"><i class="pi pi-clock"></i> SLA Status</h2>
              <div class="sla-grid">
                <div
                  class="sla-item"
                  [class.breached]="lead()!.slaStatus!.firstResponseBreached"
                >
                  <span class="sla-label">First Response Due</span>
                  <span class="sla-value">{{
                    lead()!.slaStatus!.firstResponseDue | date : 'medium'
                  }}</span>
                  @if (lead()!.slaStatus!.firstResponseBreached) {
                  <span class="breach-badge"
                    ><i class="pi pi-exclamation-triangle"></i> Breached</span
                  >
                  }
                </div>
                <div
                  class="sla-item"
                  [class.breached]="lead()!.slaStatus!.resolutionBreached"
                >
                  <span class="sla-label">Resolution Due</span>
                  <span class="sla-value">{{
                    lead()!.slaStatus!.resolutionDue | date : 'medium'
                  }}</span>
                  @if (lead()!.slaStatus!.resolutionBreached) {
                  <span class="breach-badge"
                    ><i class="pi pi-exclamation-triangle"></i> Breached</span
                  >
                  }
                </div>
              </div>
            </div>
            }
          </div>

          <!-- Right Column - Lead History -->
          <div class="right-column">
            <div class="history-card">
              <div class="history-header">
                <h2 class="card-title">
                  <i class="pi pi-history"></i> Activity History
                </h2>
                <span class="history-count">{{ history().length }} events</span>
              </div>

              @if (historyLoading()) {
              <div class="history-loading">
                <i class="pi pi-spin pi-spinner"></i>
                <span>Loading history...</span>
              </div>
              } @else if (history().length === 0) {
              <div class="history-empty">
                <i class="pi pi-inbox"></i>
                <span>No activity history yet</span>
              </div>
              } @else {
              <div class="history-list">
                @for (event of history(); track event.id) {
                <div class="history-item">
                  <div
                    class="history-icon"
                    [ngClass]="getEventIconClass(event)"
                  >
                    <i [class]="getEventIcon(event)"></i>
                  </div>
                  <div class="history-content">
                    <div class="history-title">
                      {{ getEventTitle(event) }}
                    </div>
                    <div class="history-details">
                      @if (event.previousStatus && event.previousStatus !==
                      event.newStatus) {
                      <div class="status-change">
                        <p-tag
                          [severity]="getStatusSeverity(event.previousStatus)"
                          [value]="event.previousStatus"
                          class="status-tag-small"
                        />
                        <i class="pi pi-arrow-right"></i>
                        <p-tag
                          [severity]="getStatusSeverity(event.newStatus)"
                          [value]="event.newStatus"
                          class="status-tag-small"
                        />
                      </div>
                      } @if (event.notes) {
                      <p class="history-notes">{{ event.notes }}</p>
                      }
                    </div>
                    <div class="history-meta">
                      <span class="history-user">
                        <i class="pi pi-user"></i>
                        {{ event.changedBy?.name || 'System' }}
                      </span>
                      <span class="history-time">
                        <i class="pi pi-clock"></i>
                        {{ event.createdAt | date : 'medium' }}
                      </span>
                    </div>
                  </div>
                </div>
                }
              </div>
              }
            </div>
          </div>
        </div>
        } @else {
        <div class="not-found">
          <i class="pi pi-exclamation-circle"></i>
          <p>Lead not found</p>
        </div>
        }
      </div>

      <!-- Edit Dialog -->
      <app-lead-edit-dialog
        [lead]="lead()"
        [(visible)]="editDialogVisible"
        (leadUpdated)="onLeadUpdated($event)"
      />

      <!-- Status Change Comment Dialog -->
      <p-dialog
        [(visible)]="statusChangeDialogVisible"
        header="Add Comment"
        [modal]="true"
        [style]="{ width: '400px' }"
        [draggable]="false"
        [resizable]="false"
        (onHide)="onStatusChangeCancel()"
      >
        <div class="status-change-dialog">
          <p class="status-change-info">
            Changing status to
            <strong>{{ newStatus ? getStatusLabel(newStatus) : '' }}</strong>
          </p>
          <div class="comment-field">
            <label class="field-label">Comment (optional)</label>
            <textarea
              pTextarea
              [(ngModel)]="statusChangeComment"
              placeholder="Add a comment about this status change..."
              rows="3"
              class="w-full"
            ></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <button
              pButton
              label="Cancel"
              [text]="true"
              severity="secondary"
              (click)="onStatusChangeCancel()"
            ></button>
            <button
              pButton
              label="Confirm"
              (click)="confirmStatusChange()"
            ></button>
          </div>
        </ng-template>
      </p-dialog>

      <!-- Address Dialog -->
      <p-dialog
        [(visible)]="addressDialogVisible"
        header="Business Address"
        [modal]="true"
        [style]="{ width: '500px' }"
        [draggable]="false"
        [resizable]="false"
      >
        <div class="form-grid">
          <div class="form-field">
            <label class="field-label">Pincode</label>
            <div class="pincode-row">
              <input
                pInputText
                [(ngModel)]="addressForm.pincode"
                class="pincode-input"
                placeholder="Enter pincode"
                maxlength="6"
                (keyup)="onPincodeChange()"
              />
              <button
                pButton
                icon="pi pi-search"
                [loading]="loadingPincode"
                (click)="lookupPincode()"
                [disabled]="
                  !addressForm.pincode || addressForm.pincode.length !== 6
                "
                pTooltip="Lookup city & state"
              ></button>
            </div>
          </div>
          <div class="form-field">
            <label class="field-label">Address Line 1</label>
            <input
              pInputText
              [(ngModel)]="addressForm.addressLine1"
              class="w-full"
              placeholder="Street address"
            />
          </div>
          <div class="form-field">
            <label class="field-label">Address Line 2</label>
            <input
              pInputText
              [(ngModel)]="addressForm.addressLine2"
              class="w-full"
              placeholder="Apt, suite, etc."
            />
          </div>
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">City</label>
              <input pInputText [(ngModel)]="addressForm.city" class="w-full" />
            </div>
            <div class="form-field">
              <label class="field-label">State</label>
              <input
                pInputText
                [(ngModel)]="addressForm.state"
                class="w-full"
              />
            </div>
          </div>
          <div class="form-field">
            <label class="field-label">Country</label>
            <input
              pInputText
              [(ngModel)]="addressForm.country"
              class="w-full"
            />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <button
              pButton
              label="Cancel"
              [text]="true"
              severity="secondary"
              (click)="addressDialogVisible = false"
            ></button>
            <button
              pButton
              label="Save"
              (click)="saveAddress()"
              [loading]="savingAddress"
            ></button>
          </div>
        </ng-template>
      </p-dialog>

      <!-- Contact Dialog -->
      <p-dialog
        [(visible)]="contactDialogVisible"
        [header]="editingContact ? 'Edit Contact' : 'Add Contact'"
        [modal]="true"
        [style]="{ width: '500px' }"
        [draggable]="false"
        [resizable]="false"
      >
        <div class="form-grid">
          <div class="form-field">
            <label class="field-label">Name *</label>
            <input
              pInputText
              [(ngModel)]="contactForm.name"
              class="w-full"
              placeholder="Contact name"
            />
          </div>
          <div class="form-field">
            <label class="field-label">Designation</label>
            <p-autoComplete
              [(ngModel)]="contactForm.designation"
              [suggestions]="filteredDesignations"
              (completeMethod)="filterDesignations($event)"
              [dropdown]="true"
              placeholder="Select or type designation"
              class="w-full"
            />
          </div>
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">Phone</label>
              <input
                pInputText
                [(ngModel)]="contactForm.phone"
                class="w-full"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div class="form-field">
              <label class="field-label">Email</label>
              <input
                pInputText
                [(ngModel)]="contactForm.email"
                class="w-full"
                placeholder="email@example.com"
              />
            </div>
          </div>
          <div class="form-field checkbox-field">
            <p-checkbox
              [(ngModel)]="contactForm.isPrimary"
              [binary]="true"
              inputId="isPrimary"
            />
            <label for="isPrimary">Set as primary contact</label>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <button
              pButton
              label="Cancel"
              [text]="true"
              severity="secondary"
              (click)="contactDialogVisible = false"
            ></button>
            <button
              pButton
              [label]="editingContact ? 'Update' : 'Add'"
              (click)="saveContact()"
              [loading]="savingContact"
              [disabled]="!contactForm.name"
            ></button>
          </div>
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
        align-items: center;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .header-actions {
        display: flex;
        gap: 0.75rem;
      }
      .chat-btn {
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        border: none;
      }
      .float-chat-btn {
        background: rgba(37, 211, 102, 0.1) !important;
        border: 1px solid #25d366 !important;
        color: #25d366 !important;
      }
      .float-chat-btn:hover {
        background: rgba(37, 211, 102, 0.2) !important;
      }
      .loading-state,
      .not-found {
        text-align: center;
        padding: 4rem;
        background: white;
        border-radius: 16px;
      }
      .loading-state i,
      .not-found i {
        font-size: 3rem;
        color: #d1d5db;
        margin-bottom: 1rem;
      }
      .detail-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        align-items: start;
      }
      .left-column {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      .right-column {
        position: sticky;
        top: 1.5rem;
      }
      .info-card,
      .sla-card,
      .history-card,
      .address-card,
      .contacts-card {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      /* Visiting Card Style */
      .visiting-card {
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border-radius: 12px;
        padding: 1.25rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        border: 1px solid #e5e7eb;
      }
      .vc-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.75rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #e5e7eb;
      }
      .vc-name-section {
        flex: 1;
      }
      .vc-name {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
        line-height: 1.2;
      }
      .vc-business {
        font-size: 0.8rem;
        color: #6b7280;
        display: block;
        margin-top: 0.25rem;
      }
      .vc-body {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .vc-contact-row {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .vc-item {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.85rem;
        color: #374151;
      }
      .vc-item i {
        color: #25d366;
        font-size: 0.8rem;
      }
      .vc-meta-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 0.25rem;
      }
      .vc-meta {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.75rem;
        color: #6b7280;
        background: #f1f5f9;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
      }
      .vc-meta i {
        font-size: 0.65rem;
      }
      .vc-footer {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid #e5e7eb;
      }
      :host ::ng-deep .vc-status-select {
        flex: 1;
      }

      /* Inline Editing Styles */
      .vc-editable {
        cursor: pointer;
        position: relative;
        transition: background 0.2s;
        border-radius: 4px;
        padding: 0.1rem 0.25rem;
        margin: -0.1rem -0.25rem;
      }
      .vc-editable:hover {
        background: rgba(37, 211, 102, 0.1);
      }
      .vc-editable:hover .vc-edit-icon {
        opacity: 1;
      }
      .vc-edit-icon {
        font-size: 0.65rem;
        color: #25d366;
        opacity: 0;
        transition: opacity 0.2s;
        margin-left: 0.25rem;
      }
      .vc-readonly {
        opacity: 0.8;
      }
      .vc-edit-input {
        font-size: inherit;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        border: 1px solid #25d366;
        outline: none;
        width: 100%;
      }
      .vc-name-input {
        font-size: 1.25rem;
        font-weight: 700;
      }
      .vc-business-input {
        font-size: 0.8rem;
        margin-top: 0.25rem;
      }
      .vc-email-input {
        font-size: 0.85rem;
        width: auto;
        min-width: 150px;
      }
      .vc-edit-row {
        margin-top: 0.25rem;
      }
      .vc-designation-row {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.8rem;
        color: #6b7280;
        margin-top: 0.25rem;
      }
      .vc-designation-row i:first-child {
        color: #9ca3af;
      }
      :host ::ng-deep .vc-designation-input {
        width: 100%;
      }
      :host ::ng-deep .vc-meta-select {
        min-width: 120px;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .card-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      .lead-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
      }
      :host ::ng-deep .status-tag {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: capitalize;
      }
      :host ::ng-deep .status-tag-small {
        font-size: 0.7rem;
        padding: 0.2rem 0.5rem;
        text-transform: capitalize;
      }
      .card-title {
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .sla-grid {
        display: grid;
        gap: 1rem;
      }
      .sla-card .card-title {
        margin-bottom: 1rem;
      }
      .sla-item {
        padding: 1rem;
        background: #f8fafc;
        border-radius: 8px;
        border-left: 3px solid #25d366;
      }
      .sla-item.breached {
        border-left-color: #ef4444;
        background: #fef2f2;
      }
      .sla-label {
        display: block;
        font-size: 0.75rem;
        color: #6b7280;
        text-transform: uppercase;
        margin-bottom: 0.25rem;
      }
      .sla-value {
        display: block;
        font-weight: 600;
        color: #1f2937;
      }
      .breach-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        margin-top: 0.5rem;
        color: #ef4444;
        font-size: 0.75rem;
        font-weight: 600;
      }

      /* Address Card */
      .address-content p {
        margin: 0 0 0.25rem 0;
        color: #374151;
      }
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 2rem;
        color: #9ca3af;
      }
      .empty-state i {
        font-size: 2rem;
      }

      /* Contacts Card */
      .contacts-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .contact-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 8px;
        border-left: 3px solid #e5e7eb;
      }
      .contact-item.primary {
        border-left-color: #25d366;
        background: #f0fdf4;
      }
      .contact-name {
        font-weight: 600;
        color: #1f2937;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .primary-badge {
        font-size: 0.65rem;
        background: #25d366;
        color: white;
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        font-weight: 500;
      }
      .contact-designation {
        font-size: 0.875rem;
        color: #6b7280;
        margin-top: 0.25rem;
      }
      .contact-details {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-top: 0.5rem;
        font-size: 0.8rem;
        color: #4b5563;
      }
      .contact-details span {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }
      .contact-details i {
        font-size: 0.7rem;
        color: #9ca3af;
      }
      .contact-actions {
        display: flex;
        gap: 0.25rem;
      }

      /* History Card Styles */
      .history-card {
        max-height: calc(100vh - 150px);
        display: flex;
        flex-direction: column;
      }
      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
      }
      .history-count {
        font-size: 0.75rem;
        color: #6b7280;
        background: #f1f5f9;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
      }
      .history-loading,
      .history-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        color: #9ca3af;
        gap: 0.5rem;
      }
      .history-loading i,
      .history-empty i {
        font-size: 2rem;
      }
      .history-list {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-height: 500px;
        padding-right: 0.5rem;
      }
      .history-item {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 12px;
        transition: all 0.2s;
      }
      .history-item:hover {
        background: #f1f5f9;
      }
      .history-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .history-icon i {
        font-size: 1rem;
        color: white;
      }
      .history-icon.status-change {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      }
      .history-icon.reassign {
        background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
      }
      .history-icon.category-change {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      }
      .history-icon.created {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      }
      .history-content {
        flex: 1;
        min-width: 0;
      }
      .history-title {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.5rem;
      }
      .history-details {
        margin-bottom: 0.5rem;
      }
      .status-change {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }
      .status-change i {
        font-size: 0.75rem;
        color: #9ca3af;
      }
      .history-notes {
        font-size: 0.875rem;
        color: #4b5563;
        margin: 0;
        padding: 0.5rem;
        background: white;
        border-radius: 6px;
        border-left: 3px solid #e5e7eb;
      }
      .history-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.75rem;
        color: #6b7280;
      }
      .history-user,
      .history-time {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }
      .history-user i,
      .history-time i {
        font-size: 0.7rem;
      }

      /* Dialog Styles */
      .form-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .field-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
      }
      .pincode-row {
        display: flex;
        gap: 0.5rem;
      }
      .pincode-input {
        flex: 1;
      }
      .checkbox-field {
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
      }
      .checkbox-field label {
        font-weight: normal;
        color: #4b5563;
      }
      :host ::ng-deep .w-full {
        width: 100%;
      }
      :host ::ng-deep .p-autocomplete {
        width: 100%;
      }
      :host ::ng-deep .p-autocomplete-input {
        width: 100%;
      }
      .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }
      .status-change-dialog {
        padding: 0.5rem 0;
      }
      .status-change-info {
        margin: 0 0 1rem 0;
        color: #4b5563;
      }
      .comment-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      @media (max-width: 1024px) {
        .detail-layout {
          grid-template-columns: 1fr;
        }
        .right-column {
          position: static;
        }
        .history-card {
          max-height: none;
        }
        .history-list {
          max-height: 400px;
        }
      }
      @media (max-width: 640px) {
        .page-container {
          padding: 1rem;
        }
        .lead-title {
          font-size: 1.25rem;
        }
        .history-list {
          max-height: 300px;
        }
        .history-meta {
          flex-direction: column;
          gap: 0.25rem;
        }
        .form-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class LeadDetailComponent implements OnInit {
  lead = signal<ILead | null>(null);
  history = signal<ILeadHistory[]>([]);
  contacts = signal<ILeadContact[]>([]);
  loading = signal(true);
  historyLoading = signal(false);
  newStatus: LeadStatus | null = null;
  editDialogVisible = false;
  statusChangeDialogVisible = false;
  statusChangeComment = '';

  // Inline editing
  editingField: string | null = null;
  editValue: string = '';
  categoryOptions: { label: string; value: string }[] = [];
  userOptions: { label: string; value: string }[] = [];

  // Address dialog
  addressDialogVisible = false;
  savingAddress = false;
  loadingPincode = false;
  addressForm = {
    pincode: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
  };

  // Contact dialog
  contactDialogVisible = false;
  savingContact = false;
  editingContact: ILeadContact | null = null;
  contactForm = {
    name: '',
    designation: '',
    phone: '',
    email: '',
    isPrimary: false,
  };

  // Designation options
  designationOptions = [
    'Owner',
    'Director',
    'CEO',
    'Managing Director',
    'General Manager',
    'Manager',
    'Assistant Manager',
    'Supervisor',
    'Team Lead',
    'Executive',
    'Sales Manager',
    'Purchase Manager',
    'Accounts Manager',
    'HR Manager',
    'Operations Manager',
    'Partner',
    'Proprietor',
    'Consultant',
    'Advisor',
    'Other',
  ];
  filteredDesignations: string[] = [];

  statusOptions = Object.values(LeadStatus).map((s) => ({
    label: s.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value: s,
  }));

  constructor(
    private route: ActivatedRoute,
    private leadService: LeadService,
    public authService: AuthService,
    private messageService: MessageService,
    private floatingChatService: FloatingChatService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadLead(id);
      this.loadHistory(id);
      this.loadCategoriesAndUsers();
    }
  }

  loadLead(id: string): void {
    this.loading.set(true);
    this.leadService.getLead(id).subscribe({
      next: (response) => {
        this.lead.set(response.data);
        this.contacts.set(response.data.contacts || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load lead',
        });
      },
    });
  }

  loadHistory(leadId: string): void {
    this.historyLoading.set(true);
    this.leadService.getLeadHistory(leadId).subscribe({
      next: (response) => {
        this.history.set(response.data);
        this.historyLoading.set(false);
      },
      error: () => {
        this.historyLoading.set(false);
      },
    });
  }

  loadCategoriesAndUsers(): void {
    this.leadService.getCategories().subscribe({
      next: (categories) => {
        this.categoryOptions = categories.map((c: any) => ({
          label: c.name,
          value: c.id,
        }));
      },
    });
    this.leadService.getUsers().subscribe({
      next: (users) => {
        this.userOptions = users.map((u: any) => ({
          label: u.name,
          value: u.id,
        }));
      },
    });
  }

  // Inline editing methods
  startEdit(field: string, currentValue: string): void {
    this.editingField = field;
    this.editValue = currentValue || '';
  }

  cancelEdit(): void {
    this.editingField = null;
    this.editValue = '';
  }

  saveField(field: string): void {
    const lead = this.lead();
    if (!lead) return;

    const value = this.editValue;
    this.editingField = null;

    // Build update payload based on field
    let updateData: any = {};
    switch (field) {
      case 'name':
        if (value === lead.name) return;
        updateData = { name: value };
        break;
      case 'businessName':
        if (value === lead.businessName) return;
        updateData = { businessName: value };
        break;
      case 'email':
        if (value === lead.email) return;
        updateData = { email: value };
        break;
      case 'category':
        if (value === lead.categoryId) return;
        updateData = { categoryId: value || null };
        break;
      case 'assignedTo':
        if (value === lead.assignedToId) return;
        // Use reassign endpoint for assigned user
        this.leadService.reassignLead(lead.id, value).subscribe({
          next: (response) => {
            this.lead.set(response.data);
            this.loadHistory(lead.id);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Lead reassigned',
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to reassign lead',
            });
          },
        });
        return;
      default:
        return;
    }

    this.leadService.updateLead(lead.id, updateData).subscribe({
      next: (response) => {
        this.lead.set(response.data);
        this.loadHistory(lead.id);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update',
        });
      },
    });
  }

  hasAddress(): boolean {
    const l = this.lead();
    return !!(
      l?.addressLine1 ||
      l?.addressLine2 ||
      l?.city ||
      l?.state ||
      l?.country
    );
  }

  canUpdateStatus(): boolean {
    const lead = this.lead();
    if (!lead) return false;
    const user = this.authService.currentUser();
    if (!user) return false;
    if (this.authService.isAdmin() || this.authService.isManager()) return true;
    return lead.assignedToId === user.id;
  }

  openStatusChangeDialog(): void {
    if (!this.newStatus) return;
    this.statusChangeComment = '';
    this.statusChangeDialogVisible = true;
  }

  confirmStatusChange(): void {
    const lead = this.lead();
    if (!lead || !this.newStatus) return;

    this.leadService
      .updateLeadStatus(
        lead.id,
        this.newStatus,
        this.statusChangeComment || undefined
      )
      .subscribe({
        next: (response) => {
          this.lead.set(response.data);
          this.newStatus = null;
          this.statusChangeDialogVisible = false;
          this.statusChangeComment = '';
          this.loadHistory(lead.id);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Status updated successfully',
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update status',
          });
        },
      });
  }

  onStatusChangeCancel(): void {
    this.statusChangeDialogVisible = false;
    this.statusChangeComment = '';
  }

  // Address methods
  openAddressDialog(): void {
    const l = this.lead();
    this.addressForm = {
      pincode: l?.pincode || '',
      addressLine1: l?.addressLine1 || '',
      addressLine2: l?.addressLine2 || '',
      city: l?.city || '',
      state: l?.state || '',
      country: l?.country || 'India',
    };
    this.addressDialogVisible = true;
  }

  onPincodeChange(): void {
    if (this.addressForm.pincode?.length === 6) {
      this.lookupPincode();
    }
  }

  lookupPincode(): void {
    if (!this.addressForm.pincode || this.addressForm.pincode.length !== 6)
      return;

    this.loadingPincode = true;
    this.leadService.lookupPincode(this.addressForm.pincode).subscribe({
      next: (response) => {
        this.loadingPincode = false;
        if (response.data) {
          this.addressForm.city = response.data.city;
          this.addressForm.state = response.data.state;
          this.addressForm.country = response.data.country;
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Not Found',
            detail: 'Could not find location for this pincode',
          });
        }
      },
      error: () => {
        this.loadingPincode = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to lookup pincode',
        });
      },
    });
  }

  saveAddress(): void {
    const lead = this.lead();
    if (!lead) return;

    this.savingAddress = true;
    this.leadService.updateLeadAddress(lead.id, this.addressForm).subscribe({
      next: (response) => {
        this.lead.set(response.data);
        this.addressDialogVisible = false;
        this.savingAddress = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Address updated successfully',
        });
      },
      error: () => {
        this.savingAddress = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update address',
        });
      },
    });
  }

  // Contact methods
  openContactDialog(): void {
    this.editingContact = null;
    this.contactForm = {
      name: '',
      designation: '',
      phone: '',
      email: '',
      isPrimary: false,
    };
    this.contactDialogVisible = true;
  }

  editContact(contact: ILeadContact): void {
    this.editingContact = contact;
    this.contactForm = {
      name: contact.name,
      designation: contact.designation || '',
      phone: contact.phone || '',
      email: contact.email || '',
      isPrimary: contact.isPrimary,
    };
    this.contactDialogVisible = true;
  }

  saveContact(): void {
    const lead = this.lead();
    if (!lead || !this.contactForm.name) return;

    this.savingContact = true;

    if (this.editingContact) {
      this.leadService
        .updateLeadContact(lead.id, this.editingContact.id, this.contactForm)
        .subscribe({
          next: () => {
            this.loadLead(lead.id);
            this.contactDialogVisible = false;
            this.savingContact = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Contact updated successfully',
            });
          },
          error: () => {
            this.savingContact = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to update contact',
            });
          },
        });
    } else {
      this.leadService.createLeadContact(lead.id, this.contactForm).subscribe({
        next: () => {
          this.loadLead(lead.id);
          this.contactDialogVisible = false;
          this.savingContact = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Contact added successfully',
          });
        },
        error: () => {
          this.savingContact = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to add contact',
          });
        },
      });
    }
  }

  deleteContact(contact: ILeadContact): void {
    const lead = this.lead();
    if (!lead) return;

    this.leadService.deleteLeadContact(lead.id, contact.id).subscribe({
      next: () => {
        this.loadLead(lead.id);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Contact deleted successfully',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete contact',
        });
      },
    });
  }

  filterDesignations(event: any): void {
    const query = event.query?.toLowerCase() || '';
    this.filteredDesignations = this.designationOptions.filter((d) =>
      d.toLowerCase().includes(query)
    );
  }

  getStatusLabel(status: LeadStatus): string {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getStatusSeverity(
    status: LeadStatus
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<
      LeadStatus,
      'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'
    > = {
      [LeadStatus.NEW]: 'info',
      [LeadStatus.CONTACTED]: 'warn',
      [LeadStatus.QUALIFIED]: 'contrast',
      [LeadStatus.NEGOTIATION]: 'warn',
      [LeadStatus.WON]: 'success',
      [LeadStatus.LOST]: 'danger',
    };
    return map[status] || 'info';
  }

  getEventTitle(event: ILeadHistory): string {
    if (event.notes?.includes('Reassigned')) {
      return 'Lead Reassigned';
    }
    if (event.notes?.toLowerCase().includes('category')) {
      return 'Category Changed';
    }
    if (event.notes?.toLowerCase().includes('name changed')) {
      return 'Name Updated';
    }
    if (!event.previousStatus) {
      return 'Lead Created';
    }
    if (event.previousStatus !== event.newStatus) {
      return 'Status Changed';
    }
    return 'Lead Updated';
  }

  getEventIcon(event: ILeadHistory): string {
    if (event.notes?.includes('Reassigned')) {
      return 'pi pi-user-edit';
    }
    if (event.notes?.toLowerCase().includes('category')) {
      return 'pi pi-tag';
    }
    if (event.notes?.toLowerCase().includes('name changed')) {
      return 'pi pi-id-card';
    }
    if (!event.previousStatus) {
      return 'pi pi-plus-circle';
    }
    return 'pi pi-sync';
  }

  getEventIconClass(event: ILeadHistory): string {
    if (event.notes?.includes('Reassigned')) {
      return 'reassign';
    }
    if (event.notes?.toLowerCase().includes('category')) {
      return 'category-change';
    }
    if (!event.previousStatus) {
      return 'created';
    }
    return 'status-change';
  }

  openEditDialog(): void {
    this.editDialogVisible = true;
  }

  openFloatingChat(): void {
    const currentLead = this.lead();
    if (currentLead) {
      this.floatingChatService.openChat(currentLead);
    }
  }

  onLeadUpdated(updatedLead: ILead): void {
    this.lead.set(updatedLead);
    this.loadHistory(updatedLead.id);
  }
}
