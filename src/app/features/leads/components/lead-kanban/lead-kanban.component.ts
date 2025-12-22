import { Component, OnInit, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import {
  LeadService,
  KanbanStateService,
  KanbanColumn,
  LeadStatusService,
  FloatingChatService,
} from '../../../../core/services';
import { ILead, ILeadFilter, LeadStatus } from '../../../../core/models';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';
import { LeadEditDialogComponent } from '../../../../shared/components/lead-edit-dialog/lead-edit-dialog.component';

interface PendingStatusChange {
  lead: ILead;
  previousStatus: LeadStatus;
  targetStatus: LeadStatus;
  event: CdkDragDrop<ILead[]>;
}

interface DateFilterOption {
  label: string;
  value: string;
}

interface GroupByOption {
  label: string;
  value: 'status' | 'category' | 'assignedUser';
}

interface DynamicColumn {
  id: string;
  title: string;
  color: string;
  bgColor: string;
  icon: string;
  leads: ILead[];
  count: number;
}

interface Category {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
}

@Component({
  selector: 'app-lead-kanban',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DragDropModule,
    ButtonModule,
    SelectModule,
    MultiSelectModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    ToastModule,
    TooltipModule,
    BadgeModule,
    DatePickerModule,
    DialogModule,
    TextareaModule,
    LayoutComponent,
    LeadEditDialogComponent,
  ],
  providers: [MessageService],
  styleUrls: ['./lead-kanban.component.scss'],
  template: `
    <app-layout>
      <p-toast />
      <div class="page-container">
        <!-- Header -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Leads Pipeline</h1>
            <p class="page-subtitle">Drag and drop to update lead status</p>
          </div>
          <div class="view-toggle">
            <button
              pButton
              icon="pi pi-list"
              [outlined]="true"
              size="small"
              pTooltip="Table View"
              (click)="switchToTable()"
            ></button>
            <button
              pButton
              icon="pi pi-th-large"
              size="small"
              pTooltip="Kanban View"
              class="active-view"
            ></button>
          </div>
        </div>

        <!-- Filters -->
        <div class="filter-card">
          <!-- Date Quick Filters -->
          <div class="date-filter-row">
            <span class="filter-label">Date:</span>
            @for (option of dateFilterOptions; track option.value) {
            <button
              pButton
              [label]="option.label"
              [outlined]="selectedDateFilter !== option.value"
              [severity]="
                selectedDateFilter === option.value ? 'primary' : 'secondary'
              "
              size="small"
              (click)="onDateFilterSelect(option.value)"
              class="date-filter-btn"
            ></button>
            } @if (selectedDateFilter === 'custom') {
            <p-datepicker
              [(ngModel)]="customDateRange"
              selectionMode="range"
              [showIcon]="true"
              placeholder="Select range"
              dateFormat="dd/mm/yy"
              (onSelect)="onCustomDateChange()"
              class="custom-date-picker"
            />
            } @if (selectedDateFilter) {
            <button
              pButton
              icon="pi pi-times"
              [text]="true"
              [rounded]="true"
              size="small"
              severity="danger"
              pTooltip="Clear date filter"
              (click)="clearDateFilter()"
            ></button>
            }
          </div>

          <!-- All Filters in Single Row -->
          <div class="filter-row">
            <p-inputgroup class="search-group">
              <p-inputgroup-addon>
                <i class="pi pi-search"></i>
              </p-inputgroup-addon>
              <input
                type="text"
                pInputText
                [(ngModel)]="searchQuery"
                placeholder="Search leads..."
                (input)="onFilterChange()"
              />
            </p-inputgroup>

            <p-multiselect
              [options]="categories()"
              [(ngModel)]="selectedCategoryIds"
              optionLabel="name"
              optionValue="id"
              placeholder="All Categories"
              [showClear]="true"
              [filter]="true"
              filterPlaceholder="Search categories"
              (onChange)="onFilterChange()"
              class="filter-multiselect"
              display="chip"
              [maxSelectedLabels]="2"
              selectedItemsLabel="{0} categories"
            />

            <p-multiselect
              [options]="users()"
              [(ngModel)]="selectedUserIds"
              optionLabel="name"
              optionValue="id"
              placeholder="All Users"
              [showClear]="true"
              [filter]="true"
              filterPlaceholder="Search users"
              (onChange)="onFilterChange()"
              class="filter-multiselect"
              display="chip"
              [maxSelectedLabels]="2"
              selectedItemsLabel="{0} users"
            />

            <div class="group-by-section">
              <span class="filter-label">Group by:</span>
              <p-select
                [options]="groupByOptions"
                [(ngModel)]="selectedGroupBy"
                optionLabel="label"
                optionValue="value"
                (onChange)="onGroupByChange()"
                class="group-select"
              />
            </div>
          </div>
        </div>

        <!-- Kanban Board -->
        <div class="board-container">
          <div class="kanban-board" cdkDropListGroup>
            @for (column of dynamicColumns(); track column.id) {
            <div
              class="kanban-column"
              [style.--column-color]="column.color"
              [style.--column-bg]="column.bgColor"
            >
              <div class="column-header">
                <div class="column-title">
                  <i class="pi {{ column.icon }}"></i>
                  <span>{{ column.title }}</span>
                </div>
                <span class="column-count">{{ column.count }}</span>
              </div>
              <div
                class="column-content"
                cdkDropList
                [cdkDropListData]="column.leads"
                [id]="column.id"
                (cdkDropListDropped)="onDrop($event, column.id)"
              >
                @for (lead of column.leads; track lead.id) {
                <div class="lead-card" cdkDrag [cdkDragData]="lead">
                  <div class="card-header">
                    <span class="phone-number">
                      <i class="pi pi-phone"></i>
                      {{ lead.phoneNumber }}
                    </span>
                  </div>
                  <div class="card-body">
                    <div class="customer-name">
                      {{ lead.name || 'Unknown Customer' }}
                    </div>
                    @if (lead.category) {
                    <div class="category-badge">
                      {{ lead.category.name }}
                    </div>
                    }
                  </div>
                  <div class="card-footer">
                    <div class="assigned-user">
                      <i class="pi pi-user"></i>
                      {{ lead.assignedTo?.name || 'Unassigned' }}
                    </div>
                    <div class="card-actions">
                      <button
                        pButton
                        icon="pi pi-pencil"
                        [text]="true"
                        [rounded]="true"
                        size="small"
                        pTooltip="Edit Lead"
                        (click)="openEditDialog(lead); $event.stopPropagation()"
                      ></button>
                      <button
                        pButton
                        icon="pi pi-comments"
                        [text]="true"
                        [rounded]="true"
                        size="small"
                        pTooltip="Open Floating Chat"
                        (click)="openFloatingChat(lead)"
                      ></button>
                      <button
                        pButton
                        icon="pi pi-external-link"
                        [text]="true"
                        [rounded]="true"
                        size="small"
                        pTooltip="Float Chat"
                        (click)="openFloatingChat(lead)"
                        class="float-chat-btn"
                      ></button>
                      <button
                        pButton
                        icon="pi pi-eye"
                        [text]="true"
                        [rounded]="true"
                        size="small"
                        pTooltip="View Details"
                        [routerLink]="['/leads', lead.id]"
                      ></button>
                    </div>
                  </div>
                  <div class="card-date">
                    <i class="pi pi-calendar"></i>
                    {{ lead.createdAt | date : 'MMM d, y' }}
                  </div>
                  <!-- Drag preview -->
                  <div class="drag-preview" *cdkDragPreview>
                    <div class="preview-card">
                      <span class="phone-number">{{ lead.phoneNumber }}</span>
                      <span class="customer-name">{{
                        lead.name || 'Unknown'
                      }}</span>
                    </div>
                  </div>
                </div>
                } @empty {
                <div class="empty-column">
                  <i class="pi pi-inbox"></i>
                  <span>No leads</span>
                </div>
                }
              </div>
            </div>
            }
          </div>

          @if (loading()) {
          <div class="loading-overlay">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Loading leads...</span>
          </div>
          }
        </div>
      </div>

      <!-- Edit Dialog -->
      <app-lead-edit-dialog
        [lead]="selectedLead()"
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
          @if (pendingStatusChange) {
          <p class="status-change-info">
            Moving lead to
            <strong>{{
              getStatusTitle(pendingStatusChange.targetStatus)
            }}</strong>
          </p>
          }
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
              (click)="onStatusChangeConfirm()"
            ></button>
          </div>
        </ng-template>
      </p-dialog>
    </app-layout>
  `,
})
export class LeadKanbanComponent implements OnInit {
  // State
  allLeads = signal<ILead[]>([]);
  columns = signal<KanbanColumn[]>([]);
  dynamicColumns = signal<DynamicColumn[]>([]);
  loading = signal(false);
  categories = signal<Category[]>([]);
  users = signal<User[]>([]);
  statuses = signal<any[]>([]);

  // Status change dialog
  statusChangeDialogVisible = false;
  statusChangeComment = '';
  pendingStatusChange: PendingStatusChange | null = null;

  // Edit dialog
  selectedLead = signal<ILead | null>(null);
  editDialogVisible = false;

  // Filters
  searchQuery = '';
  selectedCategoryIds: string[] = [];
  selectedUserIds: string[] = [];
  selectedDateFilter: string | null = null;
  customDateRange: Date[] | null = null;
  dateFrom: Date | null = null;
  dateTo: Date | null = null;
  selectedGroupBy: 'status' | 'category' | 'assignedUser' = 'status';

  dateFilterOptions: DateFilterOption[] = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'This Week', value: 'this_week' },
    { label: 'Last Week', value: 'last_week' },
    { label: 'This Month', value: 'this_month' },
    { label: 'Custom', value: 'custom' },
  ];

  groupByOptions: GroupByOption[] = [
    { label: 'Status', value: 'status' },
    { label: 'Category', value: 'category' },
    { label: 'Assigned User', value: 'assignedUser' },
  ];

  @Output() viewChange = new EventEmitter<'table' | 'kanban'>();

  constructor(
    private leadService: LeadService,
    private kanbanStateService: KanbanStateService,
    private leadStatusService: LeadStatusService,
    private messageService: MessageService,
    private router: Router,
    private floatingChatService: FloatingChatService
  ) {}

  ngOnInit(): void {
    this.loadStatuses();
    this.loadStatuses();
    this.loadLeads();
    this.loadCategories();
    this.loadUsers();
    this.kanbanStateService.setViewPreference('kanban');
  }

  loadStatuses(): void {
    this.leadStatusService.getAll().subscribe({
      next: (response) => {
        this.statuses.set(response.data);
      },
      error: () => {
        console.warn('Failed to load lead statuses');
      },
    });
  }

  loadLeads(): void {
    this.loading.set(true);
    const filters: ILeadFilter = {};

    this.leadService.getLeads(filters).subscribe({
      next: (response) => {
        this.allLeads.set(response.data);
        this.applyFiltersAndGroup();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load leads',
        });
      },
    });
  }

  loadCategories(): void {
    this.leadService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
      error: () => {
        console.warn('Failed to load categories');
      },
    });
  }

  loadUsers(): void {
    this.leadService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
      },
      error: () => {
        console.warn('Failed to load users');
      },
    });
  }

  onFilterChange(): void {
    this.applyFiltersAndGroup();
  }

  onDateFilterSelect(value: string): void {
    if (this.selectedDateFilter === value) {
      this.clearDateFilter();
      return;
    }

    this.selectedDateFilter = value;
    this.customDateRange = null;

    if (value !== 'custom') {
      this.calculateDateRange(value);
      this.onFilterChange();
    }
  }

  onCustomDateChange(): void {
    if (this.customDateRange && this.customDateRange.length === 2) {
      this.dateFrom = this.customDateRange[0];
      this.dateTo = this.customDateRange[1];
      this.onFilterChange();
    }
  }

  clearDateFilter(): void {
    this.selectedDateFilter = null;
    this.customDateRange = null;
    this.dateFrom = null;
    this.dateTo = null;
    this.onFilterChange();
  }

  private calculateDateRange(filter: string): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'today':
        this.dateFrom = new Date(today);
        this.dateTo = new Date(today);
        this.dateTo.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        this.dateFrom = new Date(today);
        this.dateFrom.setDate(this.dateFrom.getDate() - 1);
        this.dateTo = new Date(this.dateFrom);
        this.dateTo.setHours(23, 59, 59, 999);
        break;
      case 'this_week':
        const dayOfWeek = today.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        this.dateFrom = new Date(today);
        this.dateFrom.setDate(today.getDate() - diffToMonday);
        this.dateTo = new Date(today);
        this.dateTo.setHours(23, 59, 59, 999);
        break;
      case 'last_week':
        const lastWeekDay = today.getDay();
        const diffToLastMonday = lastWeekDay === 0 ? 13 : lastWeekDay + 6;
        this.dateFrom = new Date(today);
        this.dateFrom.setDate(today.getDate() - diffToLastMonday);
        this.dateTo = new Date(this.dateFrom);
        this.dateTo.setDate(this.dateTo.getDate() + 6);
        this.dateTo.setHours(23, 59, 59, 999);
        break;
      case 'this_month':
        this.dateFrom = new Date(today.getFullYear(), today.getMonth(), 1);
        this.dateTo = new Date(today);
        this.dateTo.setHours(23, 59, 59, 999);
        break;
      default:
        this.dateFrom = null;
        this.dateTo = null;
    }
  }

  onGroupByChange(): void {
    this.applyFiltersAndGroup();
  }

  private applyFiltersAndGroup(): void {
    let filtered = this.allLeads();

    // Apply search filter
    if (this.searchQuery) {
      filtered = this.kanbanStateService.filterBySearch(
        filtered,
        this.searchQuery
      );
    }

    // Apply multi-select category filter
    if (this.selectedCategoryIds && this.selectedCategoryIds.length > 0) {
      filtered = filtered.filter(
        (lead) =>
          lead.categoryId && this.selectedCategoryIds.includes(lead.categoryId)
      );
    }

    // Apply multi-select user filter
    if (this.selectedUserIds && this.selectedUserIds.length > 0) {
      filtered = filtered.filter(
        (lead) =>
          lead.assignedToId && this.selectedUserIds.includes(lead.assignedToId)
      );
    }

    // Apply date filter
    if (this.dateFrom && this.dateTo) {
      filtered = filtered.filter((lead) => {
        const leadDate = new Date(lead.createdAt);
        return leadDate >= this.dateFrom! && leadDate <= this.dateTo!;
      });
    }

    // Group by selected option
    const columns = this.groupLeads(filtered);
    this.dynamicColumns.set(columns);

    // Also update status columns for backward compatibility
    const statusColumns = this.kanbanStateService.groupLeadsByStatus(filtered);
    this.columns.set(statusColumns);
  }

  private groupLeads(leads: ILead[]): DynamicColumn[] {
    switch (this.selectedGroupBy) {
      case 'category':
        return this.groupByCategory(leads);
      case 'assignedUser':
        return this.groupByAssignedUser(leads);
      case 'status':
      default:
        return this.groupByStatus(leads);
    }
  }

  private groupByStatus(leads: ILead[]): DynamicColumn[] {
    const statusList = this.statuses();

    // If no statuses loaded, return empty
    if (!statusList || statusList.length === 0) {
      return [];
    }

    return statusList.map((status) => {
      const columnLeads = leads.filter(
        (lead) => lead.statusMasterId === status.id
      );
      return {
        id: status.id,
        title: status.name,
        color: status.color,
        bgColor: status.bgColor,
        icon: status.icon,
        leads: columnLeads,
        count: columnLeads.length,
      };
    });
  }

  private groupByCategory(leads: ILead[]): DynamicColumn[] {
    const categoryColors = [
      '#3B82F6',
      '#10B981',
      '#F59E0B',
      '#EC4899',
      '#8B5CF6',
      '#EF4444',
      '#06B6D4',
      '#84CC16',
    ];
    const categoryBgColors = [
      '#EFF6FF',
      '#D1FAE5',
      '#FEF3C7',
      '#FCE7F3',
      '#F3E8FF',
      '#FEE2E2',
      '#CFFAFE',
      '#ECFCCB',
    ];

    // Get unique categories from leads
    const categoryMap = new Map<string, { name: string; leads: ILead[] }>();

    // Add "Uncategorized" column
    categoryMap.set('uncategorized', { name: 'Uncategorized', leads: [] });

    leads.forEach((lead) => {
      if (lead.category && lead.categoryId) {
        if (!categoryMap.has(lead.categoryId)) {
          categoryMap.set(lead.categoryId, {
            name: lead.category.name,
            leads: [],
          });
        }
        categoryMap.get(lead.categoryId)!.leads.push(lead);
      } else {
        categoryMap.get('uncategorized')!.leads.push(lead);
      }
    });

    const columns: DynamicColumn[] = [];
    let colorIndex = 0;

    categoryMap.forEach((value, key) => {
      columns.push({
        id: key,
        title: value.name,
        color: categoryColors[colorIndex % categoryColors.length],
        bgColor: categoryBgColors[colorIndex % categoryBgColors.length],
        icon: key === 'uncategorized' ? 'pi-question-circle' : 'pi-tag',
        leads: value.leads,
        count: value.leads.length,
      });
      colorIndex++;
    });

    return columns;
  }

  private groupByAssignedUser(leads: ILead[]): DynamicColumn[] {
    const userColors = [
      '#10B981',
      '#3B82F6',
      '#F59E0B',
      '#EC4899',
      '#8B5CF6',
      '#EF4444',
      '#06B6D4',
      '#84CC16',
    ];
    const userBgColors = [
      '#D1FAE5',
      '#EFF6FF',
      '#FEF3C7',
      '#FCE7F3',
      '#F3E8FF',
      '#FEE2E2',
      '#CFFAFE',
      '#ECFCCB',
    ];

    // Get unique users from leads
    const userMap = new Map<string, { name: string; leads: ILead[] }>();

    // Add "Unassigned" column
    userMap.set('unassigned', { name: 'Unassigned', leads: [] });

    leads.forEach((lead) => {
      if (lead.assignedTo && lead.assignedToId) {
        if (!userMap.has(lead.assignedToId)) {
          userMap.set(lead.assignedToId, {
            name: lead.assignedTo.name,
            leads: [],
          });
        }
        userMap.get(lead.assignedToId)!.leads.push(lead);
      } else {
        userMap.get('unassigned')!.leads.push(lead);
      }
    });

    const columns: DynamicColumn[] = [];
    let colorIndex = 0;

    userMap.forEach((value, key) => {
      columns.push({
        id: key,
        title: value.name,
        color: userColors[colorIndex % userColors.length],
        bgColor: userBgColors[colorIndex % userBgColors.length],
        icon: key === 'unassigned' ? 'pi-user-minus' : 'pi-user',
        leads: value.leads,
        count: value.leads.length,
      });
      colorIndex++;
    });

    return columns;
  }

  async onDrop(
    event: CdkDragDrop<ILead[]>,
    targetColumnId: string
  ): Promise<void> {
    if (event.previousContainer === event.container) {
      // Reordering within the same column
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      return;
    }

    const lead = event.item.data as ILead;

    // Only allow drag-drop for status grouping
    if (this.selectedGroupBy !== 'status') {
      this.messageService.add({
        severity: 'info',
        summary: 'Info',
        detail: 'Drag and drop is only available when grouped by Status',
      });
      return;
    }

    // Find the target status by ID
    const targetStatusMaster = this.statuses().find(
      (s) => s.id === targetColumnId
    );
    if (!targetStatusMaster) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Target status not found',
      });
      return;
    }

    const previousStatus = lead.status;

    // Store pending change and show dialog
    this.pendingStatusChange = {
      lead,
      previousStatus,
      targetStatus: targetStatusMaster.name as LeadStatus,
      event,
    };
    this.statusChangeComment = '';
    this.statusChangeDialogVisible = true;
  }

  onStatusChangeConfirm(): void {
    if (!this.pendingStatusChange) return;

    const { lead, previousStatus, targetStatus, event } =
      this.pendingStatusChange;

    // Optimistic update - move the card
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    // Update lead status locally
    lead.status = targetStatus;

    // Update column counts
    this.updateColumnCounts();

    // Call API to persist the change with comment
    this.leadService
      .updateLeadStatus(
        lead.id,
        targetStatus,
        this.statusChangeComment || undefined
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Status Updated',
            detail: `Lead moved to ${this.getStatusTitle(targetStatus)}`,
          });
        },
        error: () => {
          // Revert on failure
          lead.status = previousStatus;
          transferArrayItem(
            event.container.data,
            event.previousContainer.data,
            event.currentIndex,
            event.previousIndex
          );
          this.updateColumnCounts();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update lead status',
          });
        },
      });

    // Close dialog and reset
    this.statusChangeDialogVisible = false;
    this.pendingStatusChange = null;
    this.statusChangeComment = '';
  }

  onStatusChangeCancel(): void {
    // Just close the dialog without making changes
    this.statusChangeDialogVisible = false;
    this.pendingStatusChange = null;
    this.statusChangeComment = '';
  }

  private updateColumnCounts(): void {
    const currentColumns = this.dynamicColumns();
    for (const column of currentColumns) {
      column.count = column.leads.length;
    }
    this.dynamicColumns.set([...currentColumns]);
  }

  getStatusTitle(status: LeadStatus): string {
    const config = this.kanbanStateService.getColumnConfig(status);
    return config?.title || status;
  }

  switchToTable(): void {
    this.kanbanStateService.setViewPreference('table');
    this.router.navigate(['/leads'], { queryParams: { view: 'table' } });
  }

  openEditDialog(lead: ILead): void {
    this.selectedLead.set(lead);
    this.editDialogVisible = true;
  }

  openFloatingChat(lead: ILead): void {
    this.floatingChatService.openChat(lead);
  }

  onLeadUpdated(updatedLead: ILead): void {
    // Update the lead in allLeads
    const leads = this.allLeads();
    const index = leads.findIndex((l) => l.id === updatedLead.id);
    if (index !== -1) {
      leads[index] = updatedLead;
      this.allLeads.set([...leads]);
      this.applyFiltersAndGroup();
    }
  }
}
