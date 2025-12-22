import { Injectable, signal } from '@angular/core';
import { ILead } from '../models';

export interface RecentChat {
  leadId: string;
  leadName: string;
  phoneNumber: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isInbound: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class RecentChatsService {
  private readonly STORAGE_KEY = 'recent_chats';
  private readonly MAX_RECENT = 10;

  recentChats = signal<RecentChat[]>([]);
  totalUnread = signal(0);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const chats = JSON.parse(stored) as RecentChat[];
        // Convert date strings back to Date objects
        chats.forEach((c) => (c.lastMessageTime = new Date(c.lastMessageTime)));
        this.recentChats.set(chats);
        this.updateTotalUnread();
      }
    } catch {
      this.recentChats.set([]);
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.recentChats()));
  }

  private updateTotalUnread(): void {
    const total = this.recentChats().reduce((sum, c) => sum + c.unreadCount, 0);
    this.totalUnread.set(total);
  }

  addOrUpdateChat(lead: ILead, lastMessage: string, isInbound: boolean): void {
    const chats = [...this.recentChats()];
    const existingIndex = chats.findIndex((c) => c.leadId === lead.id);

    const chat: RecentChat = {
      leadId: lead.id,
      leadName: lead.name || 'Unknown',
      phoneNumber: lead.phoneNumber,
      lastMessage: lastMessage.substring(0, 100),
      lastMessageTime: new Date(),
      unreadCount: isInbound
        ? existingIndex >= 0
          ? chats[existingIndex].unreadCount + 1
          : 1
        : 0,
      isInbound,
    };

    if (existingIndex >= 0) {
      // Update existing and move to top
      if (!isInbound) {
        chat.unreadCount = 0; // Reset unread when user sends message
      }
      chats.splice(existingIndex, 1);
    }

    // Add to top
    chats.unshift(chat);

    // Keep only MAX_RECENT
    if (chats.length > this.MAX_RECENT) {
      chats.pop();
    }

    this.recentChats.set(chats);
    this.updateTotalUnread();
    this.saveToStorage();
  }

  markAsRead(leadId: string): void {
    const chats = this.recentChats().map((c) =>
      c.leadId === leadId ? { ...c, unreadCount: 0 } : c
    );
    this.recentChats.set(chats);
    this.updateTotalUnread();
    this.saveToStorage();
  }

  removeChat(leadId: string): void {
    const chats = this.recentChats().filter((c) => c.leadId !== leadId);
    this.recentChats.set(chats);
    this.updateTotalUnread();
    this.saveToStorage();
  }

  clearAll(): void {
    this.recentChats.set([]);
    this.totalUnread.set(0);
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
