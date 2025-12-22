import { Injectable, signal } from '@angular/core';
import { AuthService, LeadService } from './';
import { ILead, UserRole } from '../models';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export interface RecentChatItem {
  leadId: string;
  lead: ILead;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isInbound: boolean;
  hasAccess: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class RoleBasedChatService {
  private readonly MAX_RECENT_CHATS = 50; // Store more, show 5 by default
  private recentChatsSubject = new BehaviorSubject<RecentChatItem[]>([]);
  private refreshTrigger = new BehaviorSubject<number>(0);

  recentChats$ = this.recentChatsSubject.asObservable();
  filteredChats = signal<RecentChatItem[]>([]);
  unreadCount = signal(0);

  constructor(
    private authService: AuthService,
    private leadService: LeadService
  ) {
    this.initializeRoleBasedFiltering();
  }

  private initializeRoleBasedFiltering(): void {
    // Watch for refresh triggers (auth changes handled separately)
    this.refreshTrigger
      .asObservable()
      .pipe(switchMap(() => this.loadRoleBasedChats()))
      .subscribe((chats) => {
        this.updateFilteredChats(chats);
      });
  }

  private loadRoleBasedChats(): Observable<RecentChatItem[]> {
    const user = this.authService.currentUser();
    if (!user) {
      return new Observable((observer) => observer.next([]));
    }

    // Load leads based on user role
    return this.leadService.getLeads({}).pipe(
      map((response) => {
        const leads = response.data || [];
        return this.filterLeadsByRole(leads, user);
      }),
      switchMap((accessibleLeads) => {
        // Convert leads to recent chat items
        return this.convertLeadsToRecentChats(accessibleLeads);
      })
    );
  }

  private filterLeadsByRole(leads: ILead[], user: any): ILead[] {
    switch (user.role) {
      case UserRole.ADMIN:
        // Admin sees all leads
        return leads;

      case UserRole.MANAGER:
        // Manager sees leads in their categories
        const managerCategories = user.categories?.map((c: any) => c.id) || [];
        return leads.filter(
          (lead) =>
            !lead.categoryId || managerCategories.includes(lead.categoryId)
        );

      case UserRole.CUSTOMER_EXECUTIVE:
      default:
        // Customer Executive sees only assigned leads
        return leads.filter((lead) => lead.assignedToId === user.id);
    }
  }

  private convertLeadsToRecentChats(
    leads: ILead[]
  ): Observable<RecentChatItem[]> {
    return new Observable((observer) => {
      const recentChats: RecentChatItem[] = [];

      // Get stored recent chats from localStorage
      const storedChats = this.getStoredRecentChats();

      leads.forEach((lead) => {
        const storedChat = storedChats.find((c) => c.leadId === lead.id);

        const recentChat: RecentChatItem = {
          leadId: lead.id,
          lead: lead,
          lastMessage: storedChat?.lastMessage || 'No messages yet',
          lastMessageTime:
            storedChat?.lastMessageTime || lead.createdAt || new Date(),
          unreadCount: storedChat?.unreadCount || 0,
          isInbound: storedChat?.isInbound || false,
          hasAccess: true,
        };

        recentChats.push(recentChat);
      });

      // Sort by last message time (newest first)
      recentChats.sort(
        (a, b) =>
          new Date(b.lastMessageTime).getTime() -
          new Date(a.lastMessageTime).getTime()
      );

      observer.next(recentChats);
      observer.complete();
    });
  }

  private updateFilteredChats(chats: RecentChatItem[]): void {
    this.recentChatsSubject.next(chats);
    this.filteredChats.set(chats);

    // Update unread count
    const totalUnread = chats.reduce((sum, chat) => sum + chat.unreadCount, 0);
    this.unreadCount.set(totalUnread);
  }

  // Public methods for managing chats
  addOrUpdateChat(lead: ILead, message: string, isInbound: boolean): void {
    const user = this.authService.currentUser();
    if (!user) return;

    // Check if user has access to this lead
    const hasAccess = this.checkLeadAccess(lead, user);
    if (!hasAccess) return;

    const currentChats = this.recentChatsSubject.value;
    const existingIndex = currentChats.findIndex((c) => c.leadId === lead.id);

    const chatItem: RecentChatItem = {
      leadId: lead.id,
      lead: lead,
      lastMessage: message.substring(0, 100),
      lastMessageTime: new Date(),
      unreadCount: isInbound
        ? existingIndex >= 0
          ? currentChats[existingIndex].unreadCount + 1
          : 1
        : 0,
      isInbound: isInbound,
      hasAccess: true,
    };

    let updatedChats: RecentChatItem[];
    if (existingIndex >= 0) {
      // Update existing chat
      updatedChats = [...currentChats];
      if (!isInbound) {
        chatItem.unreadCount = 0; // Reset unread when user sends message
      }
      updatedChats[existingIndex] = chatItem;
    } else {
      // Add new chat
      updatedChats = [chatItem, ...currentChats];
    }

    // Sort by last message time and limit
    updatedChats.sort(
      (a, b) =>
        new Date(b.lastMessageTime).getTime() -
        new Date(a.lastMessageTime).getTime()
    );

    if (updatedChats.length > this.MAX_RECENT_CHATS) {
      updatedChats = updatedChats.slice(0, this.MAX_RECENT_CHATS);
    }

    this.updateFilteredChats(updatedChats);
    this.storeRecentChats(updatedChats);
  }

  markAsRead(leadId: string): void {
    const currentChats = this.recentChatsSubject.value;
    const updatedChats = currentChats.map((chat) =>
      chat.leadId === leadId ? { ...chat, unreadCount: 0 } : chat
    );

    this.updateFilteredChats(updatedChats);
    this.storeRecentChats(updatedChats);
  }

  getRecentChats(limit: number = 5): RecentChatItem[] {
    return this.filteredChats().slice(0, limit);
  }

  getAllRecentChats(): RecentChatItem[] {
    return this.filteredChats();
  }

  getUnreadChats(): RecentChatItem[] {
    return this.filteredChats().filter((chat) => chat.unreadCount > 0);
  }

  refreshChats(): void {
    this.refreshTrigger.next(Date.now());
  }

  private checkLeadAccess(lead: ILead, user: any): boolean {
    switch (user.role) {
      case UserRole.ADMIN:
        return true;

      case UserRole.MANAGER:
        const managerCategories = user.categories?.map((c: any) => c.id) || [];
        return !lead.categoryId || managerCategories.includes(lead.categoryId);

      case UserRole.CUSTOMER_EXECUTIVE:
      default:
        return lead.assignedToId === user.id;
    }
  }

  private getStoredRecentChats(): any[] {
    try {
      const stored = localStorage.getItem('role_based_recent_chats');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private storeRecentChats(chats: RecentChatItem[]): void {
    try {
      // Store only essential data to avoid circular references
      const storableChats = chats.map((chat) => ({
        leadId: chat.leadId,
        lastMessage: chat.lastMessage,
        lastMessageTime: chat.lastMessageTime,
        unreadCount: chat.unreadCount,
        isInbound: chat.isInbound,
      }));
      localStorage.setItem(
        'role_based_recent_chats',
        JSON.stringify(storableChats)
      );
    } catch (error) {
      console.warn('Failed to store recent chats:', error);
    }
  }

  clearAll(): void {
    this.updateFilteredChats([]);
    localStorage.removeItem('role_based_recent_chats');
  }
}
