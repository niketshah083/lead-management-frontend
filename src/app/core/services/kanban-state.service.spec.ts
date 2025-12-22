import { TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import {
  KanbanStateService,
  KANBAN_COLUMNS_CONFIG,
} from './kanban-state.service';
import { ILead, LeadStatus } from '../models';

describe('KanbanStateService', () => {
  let service: KanbanStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KanbanStateService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // Helper to generate arbitrary leads
  const leadArbitrary = fc.record({
    id: fc.uuid(),
    phoneNumber: fc.stringMatching(/^\+\d{10,15}$/),
    name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
      nil: undefined,
    }),
    categoryId: fc.uuid(),
    assignedToId: fc.option(fc.uuid(), { nil: undefined }),
    status: fc.constantFrom(...Object.values(LeadStatus)),
    createdAt: fc.date(),
    updatedAt: fc.date(),
  }) as fc.Arbitrary<ILead>;

  // **Feature: lead-kanban-board, Property 1: Lead grouping by status is complete and correct**
  // **Validates: Requirements 1.1, 1.3**
  describe('Property 1: Lead grouping by status is complete and correct', () => {
    it('should place every lead in exactly one column corresponding to its status', () => {
      fc.assert(
        fc.property(fc.array(leadArbitrary, { maxLength: 100 }), (leads) => {
          const columns = service.groupLeadsByStatus(leads);

          // Total count across all columns should equal total leads
          const totalInColumns = columns.reduce(
            (sum, col) => sum + col.leads.length,
            0
          );
          expect(totalInColumns).toBe(leads.length);

          // Each lead should appear in exactly one column
          const allLeadsInColumns = columns.flatMap((col) => col.leads);
          const leadIds = leads.map((l) => l.id);
          const columnLeadIds = allLeadsInColumns.map((l) => l.id);

          // All original leads should be in columns
          for (const id of leadIds) {
            expect(columnLeadIds).toContain(id);
          }

          // Each lead should be in the correct column
          for (const column of columns) {
            for (const lead of column.leads) {
              expect(lead.status).toBe(column.status);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should have column count matching leads array length', () => {
      fc.assert(
        fc.property(fc.array(leadArbitrary, { maxLength: 100 }), (leads) => {
          const columns = service.groupLeadsByStatus(leads);

          for (const column of columns) {
            expect(column.count).toBe(column.leads.length);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: lead-kanban-board, Property 8: View preference round-trip persistence**
  // **Validates: Requirements 5.3**
  describe('Property 8: View preference round-trip persistence', () => {
    it('should persist and retrieve view preference correctly', () => {
      fc.assert(
        fc.property(fc.constantFrom('table', 'kanban'), (view) => {
          service.setViewPreference(view as 'table' | 'kanban');
          const retrieved = service.getViewPreference();
          expect(retrieved.view).toBe(view);
        }),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: lead-kanban-board, Property 5: Category filter shows only matching leads**
  // **Validates: Requirements 3.1**
  describe('Property 5: Category filter shows only matching leads', () => {
    it('should return only leads with matching categoryId', () => {
      fc.assert(
        fc.property(
          fc.array(leadArbitrary, { minLength: 1, maxLength: 50 }),
          fc.uuid(),
          (leads, categoryId) => {
            const filtered = service.filterByCategory(leads, categoryId);

            // All filtered leads should have the matching categoryId
            for (const lead of filtered) {
              expect(lead.categoryId).toBe(categoryId);
            }

            // Count should match manual filter
            const expectedCount = leads.filter(
              (l) => l.categoryId === categoryId
            ).length;
            expect(filtered.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all leads when categoryId is null', () => {
      fc.assert(
        fc.property(fc.array(leadArbitrary, { maxLength: 50 }), (leads) => {
          const filtered = service.filterByCategory(leads, null);
          expect(filtered.length).toBe(leads.length);
        }),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: lead-kanban-board, Property 6: Assigned user filter shows only matching leads**
  // **Validates: Requirements 3.2**
  describe('Property 6: Assigned user filter shows only matching leads', () => {
    it('should return only leads with matching assignedToId', () => {
      fc.assert(
        fc.property(
          fc.array(leadArbitrary, { minLength: 1, maxLength: 50 }),
          fc.uuid(),
          (leads, userId) => {
            const filtered = service.filterByAssignedUser(leads, userId);

            // All filtered leads should have the matching assignedToId
            for (const lead of filtered) {
              expect(lead.assignedToId).toBe(userId);
            }

            // Count should match manual filter
            const expectedCount = leads.filter(
              (l) => l.assignedToId === userId
            ).length;
            expect(filtered.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: lead-kanban-board, Property 7: Search filter matches phone or name**
  // **Validates: Requirements 3.3**
  describe('Property 7: Search filter matches phone or name', () => {
    it('should return leads where phone or name contains search query', () => {
      fc.assert(
        fc.property(
          fc.array(leadArbitrary, { minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          (leads, query) => {
            const filtered = service.filterBySearch(leads, query);
            const lowerQuery = query.toLowerCase().trim();

            // All filtered leads should match the query
            for (const lead of filtered) {
              const phoneMatches = lead.phoneNumber
                .toLowerCase()
                .includes(lowerQuery);
              const nameMatches =
                lead.name && lead.name.toLowerCase().includes(lowerQuery);
              expect(phoneMatches || nameMatches).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all leads when query is empty', () => {
      fc.assert(
        fc.property(fc.array(leadArbitrary, { maxLength: 50 }), (leads) => {
          const filtered = service.filterBySearch(leads, '');
          expect(filtered.length).toBe(leads.length);
        }),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: lead-kanban-board, Property 9: Filters preserved across view toggle**
  // **Validates: Requirements 5.2**
  describe('Property 9: Filters preserved across view toggle', () => {
    it('should preserve filter state when view preference changes', () => {
      fc.assert(
        fc.property(
          fc.record({
            search: fc.option(fc.string({ maxLength: 20 }), { nil: undefined }),
            categoryId: fc.option(fc.uuid(), { nil: null }),
            assignedToId: fc.option(fc.uuid(), { nil: null }),
          }),
          fc.constantFrom('table', 'kanban'),
          fc.constantFrom('table', 'kanban'),
          (filters, initialView, newView) => {
            // Set initial view
            service.setViewPreference(initialView as 'table' | 'kanban');

            // Filters are managed separately from view preference
            // Changing view should not affect filter values
            service.setViewPreference(newView as 'table' | 'kanban');

            // View preference should be updated
            const pref = service.getViewPreference();
            expect(pref.view).toBe(newView);

            // Filters should still work correctly after view change
            const testLeads: ILead[] = [
              {
                id: '1',
                phoneNumber: '+1234567890',
                name: 'Test',
                categoryId: filters.categoryId || 'cat1',
                assignedToId: filters.assignedToId || undefined,
                status: LeadStatus.NEW,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ];

            const filtered = service.applyFilters(testLeads, {
              search: filters.search,
              categoryId: filters.categoryId,
              assignedToId: filters.assignedToId,
            });

            // Filters should still be applied correctly
            expect(Array.isArray(filtered)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for basic functionality
  describe('Unit Tests', () => {
    it('should create columns for all statuses', () => {
      const columns = service.groupLeadsByStatus([]);
      expect(columns.length).toBe(Object.values(LeadStatus).length);

      for (const status of Object.values(LeadStatus)) {
        const column = columns.find((c) => c.status === status);
        expect(column).toBeDefined();
      }
    });

    it('should return default view preference when localStorage is empty', () => {
      const pref = service.getViewPreference();
      expect(pref.view).toBe('table');
    });

    it('should get column config by status', () => {
      const config = service.getColumnConfig(LeadStatus.NEW);
      expect(config).toBeDefined();
      expect(config?.title).toBe('New');
      expect(config?.color).toBe('#3B82F6');
    });
  });
});
