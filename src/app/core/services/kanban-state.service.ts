import { Injectable } from '@angular/core';
import { ILead } from '../models';
import { ILeadStatus } from '../models/lead-status.model';

export interface KanbanColumn {
  id: string;
  status: string;
  title: string;
  color: string;
  bgColor: string;
  icon: string;
  leads: ILead[];
  count: number;
}

export interface ViewPreference {
  view: 'table' | 'kanban';
  lastUpdated: Date;
}

export interface KanbanColumnConfig {
  id: string;
  status: string;
  title: string;
  color: string;
  bgColor: string;
  icon: string;
}

const STORAGE_KEY = 'lead_view_preferences';

// Default fallback columns (used when no statuses are loaded from database)
export const DEFAULT_KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: 'new',
    status: 'new',
    title: 'New',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    icon: 'pi-inbox',
  },
  {
    id: 'contacted',
    status: 'contacted',
    title: 'Contacted',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: 'pi-phone',
  },
  {
    id: 'qualified',
    status: 'qualified',
    title: 'Qualified',
    color: '#8B5CF6',
    bgColor: '#F3E8FF',
    icon: 'pi-check-circle',
  },
  {
    id: 'negotiation',
    status: 'negotiation',
    title: 'Negotiation',
    color: '#EC4899',
    bgColor: '#FCE7F3',
    icon: 'pi-comments',
  },
  {
    id: 'won',
    status: 'won',
    title: 'Won',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: 'pi-trophy',
  },
  {
    id: 'lost',
    status: 'lost',
    title: 'Lost',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: 'pi-times-circle',
  },
];

@Injectable({
  providedIn: 'root',
})
export class KanbanStateService {
  /**
   * Convert ILeadStatus array to KanbanColumnConfig array
   * @param statuses Array of lead statuses from database
   * @returns Array of KanbanColumnConfig objects
   */
  convertStatusesToColumns(statuses: ILeadStatus[]): KanbanColumnConfig[] {
    return statuses
      .filter((s) => s.isActive)
      .sort((a, b) => a.order - b.order)
      .map((status) => ({
        id: status.id,
        status: status.name,
        title: status.name,
        color: status.color,
        bgColor: status.bgColor,
        icon: status.icon,
      }));
  }

  /**
   * Group leads by their status into Kanban columns using dynamic statuses
   * @param leads Array of leads to group
   * @param statuses Array of lead statuses from database
   * @returns Array of KanbanColumn objects with leads organized by status
   */
  groupLeadsByDynamicStatus(
    leads: ILead[],
    statuses: ILeadStatus[]
  ): KanbanColumn[] {
    const columnConfigs = this.convertStatusesToColumns(statuses);

    const columns: KanbanColumn[] = columnConfigs.map((config) => ({
      ...config,
      leads: [],
      count: 0,
    }));

    // Group leads into their respective columns by statusMasterId or status name
    for (const lead of leads) {
      let column = columns.find((col) => col.id === lead.statusMasterId);
      if (!column) {
        // Fallback to matching by status name
        column = columns.find(
          (col) => col.status.toLowerCase() === lead.status?.toLowerCase()
        );
      }
      if (column) {
        column.leads.push(lead);
        column.count++;
      }
    }

    return columns;
  }

  /**
   * Group leads by their status into Kanban columns (legacy - uses default columns)
   * @param leads Array of leads to group
   * @returns Array of KanbanColumn objects with leads organized by status
   */
  groupLeadsByStatus(leads: ILead[]): KanbanColumn[] {
    const columns: KanbanColumn[] = DEFAULT_KANBAN_COLUMNS.map((config) => ({
      ...config,
      leads: [],
      count: 0,
    }));

    // Group leads into their respective columns
    for (const lead of leads) {
      const column = columns.find(
        (col) => col.status.toLowerCase() === lead.status?.toLowerCase()
      );
      if (column) {
        column.leads.push(lead);
        column.count++;
      }
    }

    return columns;
  }

  /**
   * Get the current view preference from local storage
   * @returns ViewPreference object or default to 'table' view
   */
  getViewPreference(): ViewPreference {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          view: parsed.view || 'table',
          lastUpdated: new Date(parsed.lastUpdated),
        };
      }
    } catch (error) {
      console.warn('Failed to read view preference from localStorage:', error);
    }
    return { view: 'table', lastUpdated: new Date() };
  }

  /**
   * Save the view preference to local storage
   * @param view The view type to save ('table' or 'kanban')
   */
  setViewPreference(view: 'table' | 'kanban'): void {
    try {
      const preference: ViewPreference = {
        view,
        lastUpdated: new Date(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
    } catch (error) {
      console.warn('Failed to save view preference to localStorage:', error);
    }
  }

  /**
   * Filter leads based on search query (matches phone number or customer name)
   * @param leads Array of leads to filter
   * @param query Search query string
   * @returns Filtered array of leads
   */
  filterBySearch(leads: ILead[], query: string): ILead[] {
    if (!query || query.trim() === '') {
      return leads;
    }
    const lowerQuery = query.toLowerCase().trim();
    return leads.filter(
      (lead) =>
        lead.phoneNumber.toLowerCase().includes(lowerQuery) ||
        (lead.name && lead.name.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Filter leads by category
   * @param leads Array of leads to filter
   * @param categoryId Category ID to filter by
   * @returns Filtered array of leads
   */
  filterByCategory(leads: ILead[], categoryId: string | null): ILead[] {
    if (!categoryId) {
      return leads;
    }
    return leads.filter((lead) => lead.categoryId === categoryId);
  }

  /**
   * Filter leads by assigned user
   * @param leads Array of leads to filter
   * @param userId User ID to filter by
   * @returns Filtered array of leads
   */
  filterByAssignedUser(leads: ILead[], userId: string | null): ILead[] {
    if (!userId) {
      return leads;
    }
    return leads.filter((lead) => lead.assignedToId === userId);
  }

  /**
   * Apply all filters to leads
   * @param leads Array of leads to filter
   * @param filters Object containing filter values
   * @returns Filtered array of leads
   */
  applyFilters(
    leads: ILead[],
    filters: {
      search?: string;
      categoryId?: string | null;
      assignedToId?: string | null;
    }
  ): ILead[] {
    let filtered = leads;

    if (filters.search) {
      filtered = this.filterBySearch(filtered, filters.search);
    }

    if (filters.categoryId) {
      filtered = this.filterByCategory(filtered, filters.categoryId);
    }

    if (filters.assignedToId) {
      filtered = this.filterByAssignedUser(filtered, filters.assignedToId);
    }

    return filtered;
  }

  /**
   * Get column configuration by status name
   * @param status Lead status name
   * @param statuses Optional array of dynamic statuses
   * @returns Column configuration or undefined
   */
  getColumnConfig(
    status: string,
    statuses?: ILeadStatus[]
  ): KanbanColumnConfig | undefined {
    if (statuses && statuses.length > 0) {
      const dynamicStatus = statuses.find(
        (s) => s.name.toLowerCase() === status.toLowerCase()
      );
      if (dynamicStatus) {
        return {
          id: dynamicStatus.id,
          status: dynamicStatus.name,
          title: dynamicStatus.name,
          color: dynamicStatus.color,
          bgColor: dynamicStatus.bgColor,
          icon: dynamicStatus.icon,
        };
      }
    }
    return DEFAULT_KANBAN_COLUMNS.find(
      (col) => col.status.toLowerCase() === status.toLowerCase()
    );
  }
}
