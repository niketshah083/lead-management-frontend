import { Injectable } from '@angular/core';
import { ILead, LeadStatus } from '../models';

export interface KanbanColumn {
  status: LeadStatus;
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
  status: LeadStatus;
  title: string;
  color: string;
  bgColor: string;
  icon: string;
}

const STORAGE_KEY = 'lead_view_preferences';

export const KANBAN_COLUMNS_CONFIG: KanbanColumnConfig[] = [
  {
    status: LeadStatus.NEW,
    title: 'New',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    icon: 'pi-inbox',
  },
  {
    status: LeadStatus.CONTACTED,
    title: 'Contacted',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: 'pi-phone',
  },
  {
    status: LeadStatus.QUALIFIED,
    title: 'Qualified',
    color: '#8B5CF6',
    bgColor: '#F3E8FF',
    icon: 'pi-check-circle',
  },
  {
    status: LeadStatus.NEGOTIATION,
    title: 'Negotiation',
    color: '#EC4899',
    bgColor: '#FCE7F3',
    icon: 'pi-comments',
  },
  {
    status: LeadStatus.WON,
    title: 'Won',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: 'pi-trophy',
  },
  {
    status: LeadStatus.LOST,
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
   * Group leads by their status into Kanban columns
   * @param leads Array of leads to group
   * @returns Array of KanbanColumn objects with leads organized by status
   */
  groupLeadsByStatus(leads: ILead[]): KanbanColumn[] {
    const columns: KanbanColumn[] = KANBAN_COLUMNS_CONFIG.map((config) => ({
      ...config,
      leads: [],
      count: 0,
    }));

    // Group leads into their respective columns
    for (const lead of leads) {
      const column = columns.find((col) => col.status === lead.status);
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
   * Get column configuration by status
   * @param status Lead status
   * @returns Column configuration or undefined
   */
  getColumnConfig(status: LeadStatus): KanbanColumnConfig | undefined {
    return KANBAN_COLUMNS_CONFIG.find((col) => col.status === status);
  }
}
