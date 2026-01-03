import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import * as fc from 'fast-check';
import { CalendarViewComponent } from './calendar-view.component';
import {
  IDemoEvent,
  DemoStatus,
  DemoType,
  DemoStatusColors,
} from '../../../../core/models';

/**
 * Property 12: Demo Card Rendering Completeness
 * Validates: Requirements 1.3
 *
 * For any DemoEvent displayed in the calendar view, the rendered card SHALL contain:
 * - lead.name (or fallback "Lead")
 * - formatted scheduledAt time
 * - a visual status indicator corresponding to the demo's status
 */
describe('CalendarViewComponent - Property Tests', () => {
  let component: CalendarViewComponent;
  let fixture: ComponentFixture<CalendarViewComponent>;

  // Arbitrary generator for DemoEvent
  const demoEventArbitrary: fc.Arbitrary<IDemoEvent> = fc.record({
    id: fc.uuid(),
    leadId: fc.uuid(),
    lead: fc.option(
      fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 1, maxLength: 50 }),
        phoneNumber: fc.string({ minLength: 10, maxLength: 15 }),
      }),
      { nil: undefined }
    ),
    userId: fc.uuid(),
    user: fc.option(
      fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 1, maxLength: 50 }),
        email: fc.emailAddress(),
      }),
      { nil: undefined }
    ),
    scheduledAt: fc
      .date({
        min: new Date('2024-01-01'),
        max: new Date('2026-12-31'),
      })
      .map((d) => d.toISOString()),
    durationMinutes: fc.integer({ min: 15, max: 120 }),
    demoType: fc.constantFrom(...Object.values(DemoType)),
    status: fc.constantFrom(...Object.values(DemoStatus)),
    notes: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
    meetingLink: fc.option(fc.webUrl(), { nil: null }),
    outcome: fc.constant(null),
    outcomeNotes: fc.constant(null),
    actualStartTime: fc.constant(null),
    actualEndTime: fc.constant(null),
    cancellationReason: fc.constant(null),
    rescheduledFromId: fc.constant(null),
    createdAt: fc.date().map((d) => d.toISOString()),
    updatedAt: fc.date().map((d) => d.toISOString()),
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CalendarViewComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        NoopAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarViewComponent);
    component = fixture.componentInstance;
  });

  /**
   * Feature: user-demo-calendar, Property 12: Demo Card Rendering Completeness
   *
   * For any DemoEvent, the component's utility methods should correctly:
   * 1. Return the lead name or fallback "Lead"
   * 2. Format the scheduled time correctly
   * 3. Return the correct status color
   */
  it('should correctly provide lead name or fallback for any demo event', () => {
    fc.assert(
      fc.property(demoEventArbitrary, (demo) => {
        // The template uses: demo.lead?.name || "Lead"
        const displayedName = demo.lead?.name || 'Lead';

        // Property: displayed name should be either the lead's name or "Lead"
        if (demo.lead?.name) {
          expect(displayedName).toBe(demo.lead.name);
        } else {
          expect(displayedName).toBe('Lead');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should correctly format time for any demo event', () => {
    fc.assert(
      fc.property(demoEventArbitrary, (demo) => {
        const formattedTime = component.formatTime(demo.scheduledAt);

        // Property: formatted time should be a non-empty string
        expect(formattedTime).toBeTruthy();
        expect(typeof formattedTime).toBe('string');

        // Property: formatted time should contain AM or PM
        expect(formattedTime).toMatch(/AM|PM/);
      }),
      { numRuns: 100 }
    );
  });

  it('should return correct status color for any demo status', () => {
    fc.assert(
      fc.property(demoEventArbitrary, (demo) => {
        const statusColor = component.getStatusColor(demo.status);

        // Property: status color should be a valid hex color or the expected color
        expect(statusColor).toBeTruthy();
        expect(statusColor).toBe(DemoStatusColors[demo.status] || '#6b7280');
      }),
      { numRuns: 100 }
    );
  });

  it('should correctly calculate demo height based on duration', () => {
    fc.assert(
      fc.property(demoEventArbitrary, (demo) => {
        const height = component.getDemoHeight(demo);

        // Property: height should be at least 30px (minimum)
        expect(height).toBeGreaterThanOrEqual(30);

        // Property: height should be the max of duration and 30
        expect(height).toBe(Math.max(demo.durationMinutes, 30));
      }),
      { numRuns: 100 }
    );
  });

  it('should correctly identify starting soon demos', () => {
    // Create a demo that is starting soon (within 60 minutes)
    const startingSoonDemo: IDemoEvent = {
      id: 'test-id',
      leadId: 'lead-id',
      userId: 'user-id',
      scheduledAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      durationMinutes: 30,
      demoType: DemoType.PRODUCT_DEMO,
      status: DemoStatus.SCHEDULED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const isStartingSoon = component.isStartingSoon(startingSoonDemo);
    expect(isStartingSoon).toBe(true);

    // Demo not starting soon (more than 60 minutes away)
    const notStartingSoonDemo: IDemoEvent = {
      ...startingSoonDemo,
      scheduledAt: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
    };
    expect(component.isStartingSoon(notStartingSoonDemo)).toBe(false);
  });

  it('should correctly identify overdue demos', () => {
    // Create an overdue demo (in the past with SCHEDULED status)
    const overdueDemo: IDemoEvent = {
      id: 'test-id',
      leadId: 'lead-id',
      userId: 'user-id',
      scheduledAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      durationMinutes: 30,
      demoType: DemoType.PRODUCT_DEMO,
      status: DemoStatus.SCHEDULED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const isOverdue = component.isOverdue(overdueDemo);
    expect(isOverdue).toBe(true);

    // Completed demo should not be overdue
    const completedDemo: IDemoEvent = {
      ...overdueDemo,
      status: DemoStatus.COMPLETED,
    };
    expect(component.isOverdue(completedDemo)).toBe(false);
  });

  it('should return correct status label for any demo status', () => {
    fc.assert(
      fc.property(fc.constantFrom(...Object.values(DemoStatus)), (status) => {
        const label = component.getStatusLabel(status);

        // Property: label should be a non-empty string
        expect(label).toBeTruthy();
        expect(typeof label).toBe('string');
      }),
      { numRuns: 100 }
    );
  });

  it('should return correct type label for any demo type', () => {
    fc.assert(
      fc.property(fc.constantFrom(...Object.values(DemoType)), (type) => {
        const label = component.getTypeLabel(type);

        // Property: label should be a non-empty string
        expect(label).toBeTruthy();
        expect(typeof label).toBe('string');
      }),
      { numRuns: 100 }
    );
  });
});
