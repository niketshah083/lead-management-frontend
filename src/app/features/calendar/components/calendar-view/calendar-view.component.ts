import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ViewEncapsulation,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  CdkDragDrop,
  CdkDrag,
  CdkDropList,
  CdkDropListGroup,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { ChipModule } from 'primeng/chip';
import { MessageService } from 'primeng/api';
import { Subscription, interval } from 'rxjs';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';
import { DemoSchedulerDialogComponent } from '../demo-scheduler-dialog/demo-scheduler-dialog.component';
import { DemoEventPopoverComponent } from '../demo-event-popover/demo-event-popover.component';
import {
  CalendarService,
  AuthService,
  UserService,
} from '../../../../core/services';
import { CategoryService } from '../../../category/services/category.service';
import {
  IDemoEvent,
  IDemoFilter,
  DemoStatus,
  DemoType,
  DemoStatusLabels,
  DemoStatusColors,
  DemoTypeLabels,
  DemoTimeBasedColors,
  ICategory,
} from '../../../../core/models';

// Local storage key for filter persistence
const CALENDAR_FILTERS_KEY = 'calendar_filters';

type ViewMode = 'day' | 'week' | 'month' | 'agenda';

interface CalendarDay {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  demos: IDemoEvent[];
}

interface TimeSlot {
  hour: number;
  label: string;
}

interface CalendarFilters {
  statuses: DemoStatus[];
  types: DemoType[];
  categoryId: string | null;
  userId: string | null;
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DragDropModule,
    ButtonModule,
    SelectModule,
    MultiSelectModule,
    DialogModule,
    TooltipModule,
    ProgressSpinnerModule,
    ToastModule,
    ChipModule,
    LayoutComponent,
    DemoSchedulerDialogComponent,
    DemoEventPopoverComponent,
  ],
  providers: [MessageService],
  templateUrl: './calendar-view.component.html',
  styleUrl: './calendar-view.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CalendarViewComponent implements OnInit, OnDestroy {
  // View state
  viewMode = signal<ViewMode>('week');
  currentDate = signal<Date>(new Date());
  loading = signal(false);

  // Data
  demos = signal<IDemoEvent[]>([]);
  users = signal<any[]>([]);
  categories = signal<ICategory[]>([]);

  // Filters
  selectedStatuses = signal<DemoStatus[]>([]);
  selectedTypes = signal<DemoType[]>([]);
  selectedCategoryId = signal<string | null>(null);
  selectedUserId = signal<string | null>(null);

  // Filter count for indicator
  activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedStatuses().length > 0) count++;
    if (this.selectedTypes().length > 0) count++;
    if (this.selectedCategoryId()) count++;
    if (this.selectedUserId()) count++;
    return count;
  });

  // Dialog state
  showScheduleDialog = signal(false);
  showEventPopover = signal(false);
  showRescheduleDialog = signal(false);
  selectedDemo = signal<IDemoEvent | null>(null);
  editingDemo = signal<IDemoEvent | null>(null);
  reschedulingDemo = signal<IDemoEvent | null>(null);
  popoverPosition = signal({ top: 0, left: 0 });
  selectedScheduleDate = signal<Date | null>(null);

  // Time slots for day/week view
  timeSlots: TimeSlot[] = [];

  // Subscriptions
  private subscriptions: Subscription[] = [];
  private refreshInterval?: Subscription;

  // Computed values
  weekDays = computed(() => this.getWeekDays());
  monthDays = computed(() => this.getMonthDays());
  agendaDays = computed(() => this.getAgendaDays());
  currentTimePosition = computed(() => this.getCurrentTimePosition());
  headerDateRange = computed(() => this.getHeaderDateRange());

  // Filter options
  statusOptions = Object.values(DemoStatus).map((s) => ({
    label: DemoStatusLabels[s],
    value: s,
  }));

  typeOptions = Object.values(DemoType).map((t) => ({
    label: DemoTypeLabels[t],
    value: t,
  }));

  // Category options computed from loaded categories
  categoryOptions = computed(() =>
    this.categories().map((c) => ({
      label: c.name,
      value: c.id,
    }))
  );

  // User options for team member selector
  userOptions = computed(() =>
    this.users().map((u) => ({
      label: u.name,
      value: u.id,
    }))
  );

  constructor(
    private calendarService: CalendarService,
    public authService: AuthService,
    private userService: UserService,
    private categoryService: CategoryService,
    private messageService: MessageService
  ) {
    // Initialize time slots (6 AM to 10 PM)
    for (let hour = 6; hour <= 22; hour++) {
      this.timeSlots.push({
        hour,
        label: this.formatHour(hour),
      });
    }
  }

  ngOnInit(): void {
    // Restore filters from localStorage
    this.restoreFilters();

    this.loadDemos();
    this.loadUsers();
    this.loadCategories();

    // Connect to WebSocket and subscribe to calendar updates
    this.setupWebSocketSubscriptions();

    // Refresh every minute for current time indicator
    this.refreshInterval = interval(60000).subscribe(() => {
      // Trigger reactivity for current time
      this.currentDate.set(new Date(this.currentDate()));
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.refreshInterval?.unsubscribe();

    // Disconnect from WebSocket
    this.cleanupWebSocketSubscriptions();
  }

  /**
   * Set up WebSocket subscriptions for real-time calendar updates
   * Requirements: 7.8
   */
  private setupWebSocketSubscriptions(): void {
    // Connect to WebSocket
    this.calendarService.connectWebSocket();

    // Subscribe to calendar updates for the current user
    const currentUser = this.authService.currentUser();
    if (currentUser?.id) {
      // Wait for connection before subscribing
      const checkConnection = setInterval(() => {
        if (this.calendarService.isWebSocketConnected()) {
          this.calendarService.subscribeToCalendar(currentUser.id);
          clearInterval(checkConnection);
        }
      }, 100);

      // Clear interval after 5 seconds if not connected
      setTimeout(() => clearInterval(checkConnection), 5000);
    }

    // Subscribe to demo-created events
    this.subscriptions.push(
      this.calendarService.demoCreated$.subscribe((demo) => {
        this.handleDemoCreated(demo);
      })
    );

    // Subscribe to demo-updated events
    this.subscriptions.push(
      this.calendarService.demoUpdated$.subscribe((demo) => {
        this.handleDemoUpdated(demo);
      })
    );

    // Subscribe to demo-deleted events
    this.subscriptions.push(
      this.calendarService.demoDeleted$.subscribe((data) => {
        this.handleDemoDeleted(data.id);
      })
    );

    // Subscribe to demo-status-changed events
    this.subscriptions.push(
      this.calendarService.demoStatusChanged$.subscribe((data) => {
        this.handleDemoStatusChanged(data.demo, data.previousStatus);
      })
    );

    // Subscribe to demo-reminder events
    this.subscriptions.push(
      this.calendarService.demoReminder$.subscribe((data) => {
        this.handleDemoReminder(data.demo, data.minutesUntilStart);
      })
    );
  }

  /**
   * Clean up WebSocket subscriptions
   */
  private cleanupWebSocketSubscriptions(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser?.id) {
      this.calendarService.unsubscribeFromCalendar(currentUser.id);
    }
    this.calendarService.disconnectWebSocket();
  }

  /**
   * Handle demo-created WebSocket event
   * Updates calendar view in real-time when a new demo is created
   */
  private handleDemoCreated(demo: IDemoEvent): void {
    const currentDemos = this.demos();
    // Check if demo is within current view date range
    const { startDate, endDate } = this.getDateRange();
    const demoDate = new Date(demo.scheduledAt);

    if (demoDate >= startDate && demoDate <= endDate) {
      // Add the new demo to the list if not already present
      if (!currentDemos.find((d) => d.id === demo.id)) {
        this.demos.set([...currentDemos, demo]);
        this.messageService.add({
          severity: 'info',
          summary: 'New Demo',
          detail: `Demo scheduled with ${demo.lead?.name || 'Lead'}`,
          life: 3000,
        });
      }
    }
  }

  /**
   * Handle demo-updated WebSocket event
   * Updates calendar view in real-time when a demo is updated
   */
  private handleDemoUpdated(demo: IDemoEvent): void {
    const currentDemos = this.demos();
    const index = currentDemos.findIndex((d) => d.id === demo.id);

    if (index !== -1) {
      // Update existing demo
      const updatedDemos = [...currentDemos];
      updatedDemos[index] = demo;
      this.demos.set(updatedDemos);
    } else {
      // Demo might have been moved into current view range
      const { startDate, endDate } = this.getDateRange();
      const demoDate = new Date(demo.scheduledAt);

      if (demoDate >= startDate && demoDate <= endDate) {
        this.demos.set([...currentDemos, demo]);
      }
    }
  }

  /**
   * Handle demo-deleted WebSocket event
   * Updates calendar view in real-time when a demo is deleted
   */
  private handleDemoDeleted(demoId: string): void {
    const currentDemos = this.demos();
    const filteredDemos = currentDemos.filter((d) => d.id !== demoId);

    if (filteredDemos.length !== currentDemos.length) {
      this.demos.set(filteredDemos);
    }

    // Close popover if the deleted demo was selected
    if (this.selectedDemo()?.id === demoId) {
      this.closePopover();
    }
  }

  /**
   * Handle demo-status-changed WebSocket event
   * Updates calendar view in real-time when a demo status changes
   */
  private handleDemoStatusChanged(
    demo: IDemoEvent,
    previousStatus: string
  ): void {
    this.handleDemoUpdated(demo);
  }

  /**
   * Handle demo-reminder WebSocket event
   * Shows a notification when a demo is about to start
   */
  private handleDemoReminder(
    demo: IDemoEvent,
    minutesUntilStart: number
  ): void {
    const leadName = demo.lead?.name || 'Lead';
    this.messageService.add({
      severity: 'warn',
      summary: 'Demo Reminder',
      detail: `Demo with ${leadName} starts in ${minutesUntilStart} minutes`,
      life: 10000,
    });
  }

  // Data loading
  loadDemos(): void {
    this.loading.set(true);
    const { startDate, endDate } = this.getDateRange();

    const filters: IDemoFilter = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: 100,
    };

    if (this.selectedStatuses().length > 0) {
      filters.status = this.selectedStatuses();
    }
    if (this.selectedTypes().length > 0) {
      filters.demoType = this.selectedTypes();
    }
    if (this.selectedCategoryId()) {
      filters.categoryId = this.selectedCategoryId()!;
    }
    if (this.selectedUserId()) {
      filters.userId = this.selectedUserId()!;
    }

    this.calendarService.getDemos(filters).subscribe({
      next: (response) => {
        // response.data is the demos array (transformed by backend interceptor)
        const demos = Array.isArray(response.data) ? response.data : [];
        this.demos.set(demos);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading demos:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load calendar events',
        });
        this.loading.set(false);
      },
    });
  }

  loadUsers(): void {
    if (this.authService.isAdmin() || this.authService.isManager()) {
      this.userService.getUsers().subscribe({
        next: (response) => {
          if (response.data) {
            this.users.set(response.data);
          }
        },
        error: (error) => console.error('Error loading users:', error),
      });
    }
  }

  loadCategories(): void {
    this.categoryService.loadCategories().subscribe({
      next: (response) => {
        if (response.data) {
          this.categories.set(response.data);
        }
      },
      error: (error) => console.error('Error loading categories:', error),
    });
  }

  // Navigation
  navigatePrevious(): void {
    const current = this.currentDate();
    const newDate = new Date(current);

    switch (this.viewMode()) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }

    this.currentDate.set(newDate);
    this.loadDemos();
  }

  navigateNext(): void {
    const current = this.currentDate();
    const newDate = new Date(current);

    switch (this.viewMode()) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }

    this.currentDate.set(newDate);
    this.loadDemos();
  }

  goToToday(): void {
    this.currentDate.set(new Date());
    this.loadDemos();
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.loadDemos();
  }

  // Filter handlers
  onStatusFilterChange(statuses: DemoStatus[]): void {
    this.selectedStatuses.set(statuses);
    this.saveFilters();
    this.loadDemos();
  }

  onTypeFilterChange(types: DemoType[]): void {
    this.selectedTypes.set(types);
    this.saveFilters();
    this.loadDemos();
  }

  onCategoryFilterChange(categoryId: string | null): void {
    this.selectedCategoryId.set(categoryId);
    this.saveFilters();
    this.loadDemos();
  }

  onUserFilterChange(userId: string | null): void {
    this.selectedUserId.set(userId);
    this.saveFilters();
    this.loadDemos();
  }

  clearAllFilters(): void {
    this.selectedStatuses.set([]);
    this.selectedTypes.set([]);
    this.selectedCategoryId.set(null);
    this.selectedUserId.set(null);
    this.saveFilters();
    this.loadDemos();
  }

  // Filter persistence
  private saveFilters(): void {
    const filters: CalendarFilters = {
      statuses: this.selectedStatuses(),
      types: this.selectedTypes(),
      categoryId: this.selectedCategoryId(),
      userId: this.selectedUserId(),
    };
    localStorage.setItem(CALENDAR_FILTERS_KEY, JSON.stringify(filters));
  }

  private restoreFilters(): void {
    try {
      const stored = localStorage.getItem(CALENDAR_FILTERS_KEY);
      if (stored) {
        const filters: CalendarFilters = JSON.parse(stored);
        if (filters.statuses) this.selectedStatuses.set(filters.statuses);
        if (filters.types) this.selectedTypes.set(filters.types);
        if (filters.categoryId) this.selectedCategoryId.set(filters.categoryId);
        // Only restore userId if user is manager/admin
        if (
          filters.userId &&
          (this.authService.isAdmin() || this.authService.isManager())
        ) {
          this.selectedUserId.set(filters.userId);
        }
      }
    } catch (error) {
      console.error('Error restoring filters:', error);
      // Clear corrupted data
      localStorage.removeItem(CALENDAR_FILTERS_KEY);
    }
  }

  // Date range calculation
  private getDateRange(): { startDate: Date; endDate: Date } {
    const current = this.currentDate();
    let startDate: Date;
    let endDate: Date;

    switch (this.viewMode()) {
      case 'day':
        startDate = new Date(current);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(current);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = this.getWeekStart(current);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
      case 'agenda':
        startDate = new Date(current.getFullYear(), current.getMonth(), 1);
        endDate = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    return { startDate, endDate };
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // Week view helpers
  private getWeekDays(): CalendarDay[] {
    const weekStart = this.getWeekStart(this.currentDate());
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);

      days.push({
        date,
        isToday: date.getTime() === today.getTime(),
        isCurrentMonth: date.getMonth() === this.currentDate().getMonth(),
        demos: this.getDemosForDate(date),
      });
    }

    return days;
  }

  // Month view helpers
  private getMonthDays(): CalendarDay[][] {
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weeks: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];

    // Fill in days from previous month
    const startDay = firstDay.getDay() || 7; // Monday = 1
    for (let i = startDay - 1; i > 0; i--) {
      const date = new Date(year, month, 1 - i);
      currentWeek.push({
        date,
        isToday: false,
        isCurrentMonth: false,
        demos: this.getDemosForDate(date),
      });
    }

    // Fill in days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      currentWeek.push({
        date,
        isToday: date.getTime() === today.getTime(),
        isCurrentMonth: true,
        demos: this.getDemosForDate(date),
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill in days from next month
    if (currentWeek.length > 0) {
      let nextDay = 1;
      while (currentWeek.length < 7) {
        const date = new Date(year, month + 1, nextDay++);
        currentWeek.push({
          date,
          isToday: false,
          isCurrentMonth: false,
          demos: this.getDemosForDate(date),
        });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }

  // Agenda view helpers - returns all days in the current month that have demos
  private getAgendaDays(): CalendarDay[] {
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: CalendarDay[] = [];

    for (let day = 1; day <= lastDay; day++) {
      const date = new Date(year, month, day);
      const demos = this.getDemosForDate(date);

      // Only include days that have demos or are today/future
      if (demos.length > 0 || date >= today) {
        days.push({
          date,
          isToday: date.getTime() === today.getTime(),
          isCurrentMonth: true,
          demos: demos.sort(
            (a, b) =>
              new Date(a.scheduledAt).getTime() -
              new Date(b.scheduledAt).getTime()
          ),
        });
      }
    }

    return days;
  }

  getDemosForDate(date: Date): IDemoEvent[] {
    return this.demos().filter((demo) => {
      const demoDate = new Date(demo.scheduledAt);
      return (
        demoDate.getFullYear() === date.getFullYear() &&
        demoDate.getMonth() === date.getMonth() &&
        demoDate.getDate() === date.getDate()
      );
    });
  }

  getDemosForHour(date: Date, hour: number): IDemoEvent[] {
    return this.demos().filter((demo) => {
      const demoDate = new Date(demo.scheduledAt);
      return (
        demoDate.getFullYear() === date.getFullYear() &&
        demoDate.getMonth() === date.getMonth() &&
        demoDate.getDate() === date.getDate() &&
        demoDate.getHours() === hour
      );
    });
  }

  // Current time indicator
  private getCurrentTimePosition(): number {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    // Position relative to 6 AM start
    return ((hours - 6) * 60 + minutes) * (60 / 60); // 60px per hour
  }

  isCurrentHourVisible(): boolean {
    const now = new Date();
    return now.getHours() >= 6 && now.getHours() <= 22;
  }

  // Header date range display
  private getHeaderDateRange(): string {
    const current = this.currentDate();
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      year: 'numeric',
    };

    switch (this.viewMode()) {
      case 'day':
        return current.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      case 'week':
        const weekStart = this.getWeekStart(current);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${weekStart.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
          })} - ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
        }
        return `${weekStart.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })} - ${weekEnd.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}`;
      case 'month':
      case 'agenda':
        return current.toLocaleDateString('en-US', options);
    }
  }

  // Event handlers
  onDemoClick(demo: IDemoEvent, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedDemo.set(demo);
    this.showEventPopover.set(true);

    // Position popover near click
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.popoverPosition.set({
      top: rect.bottom + 10,
      left: Math.min(rect.left, window.innerWidth - 320),
    });
  }

  closePopover(): void {
    this.showEventPopover.set(false);
    this.selectedDemo.set(null);
  }

  openScheduleDialog(): void {
    this.showScheduleDialog.set(true);
  }

  closeScheduleDialog(): void {
    this.showScheduleDialog.set(false);
    this.selectedScheduleDate.set(null);
    this.editingDemo.set(null);
  }

  onDemoScheduled(demo: IDemoEvent): void {
    this.loadDemos();
    this.closeScheduleDialog();
  }

  onDemoUpdated(demo: IDemoEvent): void {
    this.loadDemos();
    this.closeScheduleDialog();
  }

  // Handle demo update from popover
  onPopoverDemoUpdated(demo: IDemoEvent): void {
    this.loadDemos();
    this.closePopover();
  }

  // Edit demo - open scheduler dialog with demo data
  editDemo(demo: IDemoEvent): void {
    this.editingDemo.set(demo);
    this.showScheduleDialog.set(true);
    this.closePopover();
  }

  // Reschedule demo - open scheduler dialog for rescheduling
  rescheduleDemo(demo: IDemoEvent): void {
    this.reschedulingDemo.set(demo);
    this.showRescheduleDialog.set(true);
    this.closePopover();
  }

  // Close reschedule dialog
  closeRescheduleDialog(): void {
    this.showRescheduleDialog.set(false);
    this.reschedulingDemo.set(null);
  }

  // Demo actions
  startDemo(demo: IDemoEvent): void {
    this.calendarService.startDemo(demo.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Demo Started',
          detail: 'Demo has been started successfully',
        });
        this.loadDemos();
        this.closePopover();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Failed to start demo',
        });
      },
    });
  }

  canStartDemo(demo: IDemoEvent): boolean {
    if (
      demo.status !== DemoStatus.SCHEDULED &&
      demo.status !== DemoStatus.CONFIRMED
    ) {
      return false;
    }

    const now = new Date();
    const scheduledTime = new Date(demo.scheduledAt);
    const windowStart = new Date(scheduledTime.getTime() - 15 * 60 * 1000);
    const windowEnd = new Date(scheduledTime.getTime() + 30 * 60 * 1000);

    return now >= windowStart && now <= windowEnd;
  }

  // Utility methods
  formatHour(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour} ${period}`;
  }

  formatTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
    });
  }

  getStatusColor(status: DemoStatus): string {
    return DemoStatusColors[status] || '#6b7280';
  }

  /**
   * Get the effective display color for a demo, considering both status and time-based indicators
   * Priority: Overdue > Imminent (15 min) > Starting Soon (60 min) > Status color
   */
  getEffectiveColor(demo: IDemoEvent): string {
    // For completed, cancelled, missed, or rescheduled demos, use status color
    if (
      demo.status === DemoStatus.COMPLETED ||
      demo.status === DemoStatus.CANCELLED ||
      demo.status === DemoStatus.MISSED ||
      demo.status === DemoStatus.RESCHEDULED
    ) {
      return DemoStatusColors[demo.status];
    }

    // Check time-based conditions for scheduled/confirmed demos
    if (this.isOverdue(demo)) {
      return DemoTimeBasedColors.OVERDUE;
    }

    if (this.isImminent(demo)) {
      return DemoTimeBasedColors.IMMINENT;
    }

    if (this.isStartingSoon(demo)) {
      return DemoTimeBasedColors.STARTING_SOON;
    }

    return DemoStatusColors[demo.status] || '#6b7280';
  }

  getStatusLabel(status: DemoStatus): string {
    return DemoStatusLabels[status] || status;
  }

  getTypeLabel(type: DemoType): string {
    return DemoTypeLabels[type] || type;
  }

  getDemoHeight(demo: IDemoEvent): number {
    // 1px per minute, minimum 30px
    return Math.max(demo.durationMinutes, 30);
  }

  getDemoTop(demo: IDemoEvent): number {
    const date = new Date(demo.scheduledAt);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    // Position relative to 6 AM start, 60px per hour
    return (hours - 6) * 60 + minutes;
  }

  // Get the minute offset within the hour cell (for week view)
  getDemoMinuteOffset(demo: IDemoEvent): number {
    const date = new Date(demo.scheduledAt);
    return date.getMinutes();
  }

  isStartingSoon(demo: IDemoEvent): boolean {
    if (
      demo.status !== DemoStatus.SCHEDULED &&
      demo.status !== DemoStatus.CONFIRMED
    ) {
      return false;
    }
    const now = new Date();
    const scheduledTime = new Date(demo.scheduledAt);
    const diff = scheduledTime.getTime() - now.getTime();
    // Within 60 minutes but not yet overdue
    return diff > 0 && diff <= 60 * 60 * 1000;
  }

  /**
   * Check if demo is imminent (within 15 minutes) - triggers pulsing border
   */
  isImminent(demo: IDemoEvent): boolean {
    if (
      demo.status !== DemoStatus.SCHEDULED &&
      demo.status !== DemoStatus.CONFIRMED
    ) {
      return false;
    }
    const now = new Date();
    const scheduledTime = new Date(demo.scheduledAt);
    const diff = scheduledTime.getTime() - now.getTime();
    // Within 15 minutes but not yet overdue
    return diff > 0 && diff <= 15 * 60 * 1000;
  }

  isOverdue(demo: IDemoEvent): boolean {
    if (
      demo.status !== DemoStatus.SCHEDULED &&
      demo.status !== DemoStatus.CONFIRMED
    ) {
      return false;
    }
    const now = new Date();
    const scheduledTime = new Date(demo.scheduledAt);
    return now > scheduledTime;
  }

  /**
   * Get elapsed time since demo was supposed to start (for overdue indicator)
   */
  getOverdueTime(demo: IDemoEvent): string {
    if (!this.isOverdue(demo)) {
      return '';
    }
    const now = new Date();
    const scheduledTime = new Date(demo.scheduledAt);
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
   * Get time until demo starts (for starting soon indicator)
   */
  getTimeUntilStart(demo: IDemoEvent): string {
    const now = new Date();
    const scheduledTime = new Date(demo.scheduledAt);
    const diffMs = scheduledTime.getTime() - now.getTime();

    if (diffMs <= 0) {
      return '';
    }

    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `in ${diffMins} min`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`;
  }

  // Summary stats
  getTodayDemoCount(): number {
    const today = new Date();
    return this.getDemosForDate(today).length;
  }

  getNextDemo(): IDemoEvent | null {
    const now = new Date();
    const upcoming = this.demos()
      .filter(
        (d) =>
          new Date(d.scheduledAt) > now && d.status === DemoStatus.SCHEDULED
      )
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
    return upcoming[0] || null;
  }

  // Drag and drop functionality
  isDragging = signal(false);

  /**
   * Check if a demo can be dragged (only scheduled/confirmed demos)
   */
  canDragDemo(demo: IDemoEvent): boolean {
    return (
      demo.status === DemoStatus.SCHEDULED ||
      demo.status === DemoStatus.CONFIRMED
    );
  }

  /**
   * Handle drag start event
   */
  onDragStarted(demo: IDemoEvent): void {
    this.isDragging.set(true);
  }

  /**
   * Handle drag end event
   */
  onDragEnded(): void {
    this.isDragging.set(false);
  }

  /**
   * Generate unique drop list ID for a day column
   */
  getDropListId(date: Date): string {
    return `drop-list-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  /**
   * Get all connected drop list IDs for week view
   */
  getConnectedDropLists(): string[] {
    return this.weekDays().map((day) => this.getDropListId(day.date));
  }

  /**
   * Handle demo drop event in week/day view
   */
  onDemoDrop(
    event: CdkDragDrop<{ date: Date; hour: number }>,
    targetDate: Date,
    targetHour: number
  ): void {
    const demo = event.item.data as IDemoEvent;

    if (!demo || !this.canDragDemo(demo)) {
      return;
    }

    // Calculate new scheduled time based on drop position
    const dropY = event.dropPoint.y;
    const containerRect = (
      event.container.element.nativeElement as HTMLElement
    ).getBoundingClientRect();
    const relativeY = dropY - containerRect.top;

    // Calculate minutes within the hour (60px per hour)
    const minutesInHour = Math.floor(((relativeY % 60) / 60) * 60);
    const roundedMinutes = Math.round(minutesInHour / 15) * 15; // Round to nearest 15 minutes

    // Create new scheduled time
    const newScheduledAt = new Date(targetDate);
    newScheduledAt.setHours(targetHour, roundedMinutes, 0, 0);

    // Check if the time actually changed
    const originalTime = new Date(demo.scheduledAt);
    if (newScheduledAt.getTime() === originalTime.getTime()) {
      return;
    }

    // Call reschedule API
    this.rescheduleDemoByDrag(demo, newScheduledAt);
  }

  /**
   * Handle demo drop in day view
   */
  onDemoDropDay(event: CdkDragDrop<any>, targetHour: number): void {
    const demo = event.item.data as IDemoEvent;

    if (!demo || !this.canDragDemo(demo)) {
      return;
    }

    // Calculate new scheduled time
    const dropY = event.dropPoint.y;
    const containerRect = (
      event.container.element.nativeElement as HTMLElement
    ).getBoundingClientRect();
    const relativeY = dropY - containerRect.top;

    // Calculate minutes within the hour
    const minutesInHour = Math.floor(((relativeY % 60) / 60) * 60);
    const roundedMinutes = Math.round(minutesInHour / 15) * 15;

    const newScheduledAt = new Date(this.currentDate());
    newScheduledAt.setHours(targetHour, roundedMinutes, 0, 0);

    const originalTime = new Date(demo.scheduledAt);
    if (newScheduledAt.getTime() === originalTime.getTime()) {
      return;
    }

    this.rescheduleDemoByDrag(demo, newScheduledAt);
  }

  /**
   * Handle demo drop in week view with precise time calculation
   */
  onDemoDropWeek(event: CdkDragDrop<any>, targetDate: Date): void {
    console.log('Drop event triggered', event);
    const demo = event.item.data as IDemoEvent;

    if (!demo || !this.canDragDemo(demo)) {
      console.log('Cannot drag this demo', demo);
      return;
    }

    // Get the drop position
    const dropY = event.dropPoint.y;
    const dayColumn = event.container.element.nativeElement as HTMLElement;

    // Find the first hour-cell to get the actual start position of the time grid
    const firstHourCell = dayColumn.querySelector('.hour-cell') as HTMLElement;
    if (!firstHourCell) {
      console.error('Could not find hour-cell');
      return;
    }

    const firstCellRect = firstHourCell.getBoundingClientRect();

    // Calculate relative Y position from the top of the first hour cell
    const relativeY = dropY - firstCellRect.top;

    console.log('Drop calculation:', {
      dropY,
      firstCellRectTop: firstCellRect.top,
      relativeY,
    });

    // Each hour cell is 60px tall, starting at 6 AM
    // relativeY / 60 gives us the hour offset from 6 AM
    const hourOffset = Math.max(0, relativeY) / 60;
    const hour = Math.floor(hourOffset) + 6; // 6 AM start
    const minuteFraction = hourOffset - Math.floor(hourOffset);
    const minutes = Math.round((minuteFraction * 60) / 15) * 15; // Round to nearest 15 minutes

    // Clamp hour to valid range (6 AM - 10 PM)
    const clampedHour = Math.max(6, Math.min(22, hour));
    const finalMinutes = minutes >= 60 ? 0 : minutes;
    const finalHour =
      minutes >= 60 ? Math.min(22, clampedHour + 1) : clampedHour;

    // Create new scheduled time in user's local timezone
    const newScheduledAt = new Date(targetDate);
    newScheduledAt.setHours(finalHour, finalMinutes, 0, 0);

    console.log('Time calculation:', {
      hourOffset,
      hour,
      minutes,
      clampedHour,
      finalHour,
      finalMinutes,
      newScheduledAtLocal: newScheduledAt.toString(),
      newScheduledAtISO: newScheduledAt.toISOString(),
      userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    const originalTime = new Date(demo.scheduledAt);
    if (newScheduledAt.getTime() === originalTime.getTime()) {
      console.log('Time unchanged, skipping');
      return;
    }

    this.rescheduleDemoByDrag(demo, newScheduledAt);
  }

  /**
   * Update demo time via drag and drop (uses update API, not reschedule)
   * This keeps the same demo record instead of creating a new one
   */
  private rescheduleDemoByDrag(demo: IDemoEvent, newScheduledAt: Date): void {
    this.loading.set(true);

    // Use updateDemo instead of rescheduleDemo to keep the same demo record
    this.calendarService
      .updateDemo(demo.id, {
        scheduledAt: newScheduledAt.toISOString(),
      })
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Demo Updated',
            detail: `Demo moved to ${this.formatTime(
              newScheduledAt
            )} on ${newScheduledAt.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}`,
          });
          this.loadDemos();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Reschedule Failed',
            detail: error.error?.message || 'Failed to reschedule demo',
          });
          this.loading.set(false);
        },
      });
  }
}
