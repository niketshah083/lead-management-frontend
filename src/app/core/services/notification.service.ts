import { Injectable, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ILead, IMessage } from '../models';

export interface ChatNotification {
  id: string;
  leadId: string;
  leadName: string;
  phoneNumber: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  type: 'new_chat' | 'new_message';
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly STORAGE_KEY = 'chat_notifications';
  private readonly MAX_NOTIFICATIONS = 50;

  notifications = signal<ChatNotification[]>([]);
  unreadCount = signal(0);
  soundEnabled = signal(true);
  browserNotificationsEnabled = signal(false);

  constructor(private messageService: MessageService) {
    this.loadFromStorage();
    this.requestBrowserPermission();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const notifications = JSON.parse(stored) as ChatNotification[];
        // Convert date strings back to Date objects
        notifications.forEach((n) => (n.timestamp = new Date(n.timestamp)));
        this.notifications.set(notifications);
        this.updateUnreadCount();
      }
    } catch {
      this.notifications.set([]);
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(this.notifications())
    );
  }

  private updateUnreadCount(): void {
    const unread = this.notifications().filter((n) => !n.isRead).length;
    this.unreadCount.set(unread);
  }

  private async requestBrowserPermission(): Promise<void> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.browserNotificationsEnabled.set(permission === 'granted');
    }
  }

  addNotification(
    lead: ILead,
    message: IMessage,
    isNewChat: boolean = false
  ): void {
    console.log(
      'NotificationService: Adding notification for lead:',
      lead.id,
      'message:',
      message.content,
      'isNewChat:',
      isNewChat
    );

    const notification: ChatNotification = {
      id: `${lead.id}-${message.id}-${Date.now()}`,
      leadId: lead.id,
      leadName: lead.name || 'Unknown Contact',
      phoneNumber: lead.phoneNumber,
      message: message.content || 'Media message',
      timestamp: new Date(),
      isRead: false,
      type: isNewChat ? 'new_chat' : 'new_message',
    };

    console.log('NotificationService: Created notification:', notification);

    // Add to notifications
    const notifications = [notification, ...this.notifications()];

    // Keep only MAX_NOTIFICATIONS
    if (notifications.length > this.MAX_NOTIFICATIONS) {
      notifications.splice(this.MAX_NOTIFICATIONS);
    }

    this.notifications.set(notifications);
    this.updateUnreadCount();
    this.saveToStorage();

    console.log(
      'NotificationService: Updated notifications array, total count:',
      this.notifications().length,
      'unread count:',
      this.unreadCount()
    );

    // Show toast notification
    this.showToastNotification(notification);

    // Play sound if enabled
    if (this.soundEnabled()) {
      this.playNotificationSound();
    }

    // Show browser notification if tab is not active
    if (this.browserNotificationsEnabled() && document.hidden) {
      this.showBrowserNotification(notification);
    }
  }

  private showToastNotification(notification: ChatNotification): void {
    const summary =
      notification.type === 'new_chat'
        ? '💬 New Chat Started'
        : '📩 New Message';

    const detail = `${notification.leadName}: ${notification.message.substring(
      0,
      50
    )}${notification.message.length > 50 ? '...' : ''}`;

    this.messageService.add({
      severity: 'info',
      summary,
      detail,
      life: 5000,
      sticky: false,
      closable: true,
      data: { leadId: notification.leadId },
    });
  }

  private playNotificationSound(): void {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }

  private showBrowserNotification(notification: ChatNotification): void {
    if (!this.browserNotificationsEnabled()) return;

    const title =
      notification.type === 'new_chat'
        ? `New chat from ${notification.leadName}`
        : `Message from ${notification.leadName}`;

    const options = {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.leadId, // This will replace previous notifications from same lead
      requireInteraction: false,
      silent: false,
    };

    const browserNotification = new Notification(title, options);

    // Auto close after 5 seconds
    setTimeout(() => browserNotification.close(), 5000);

    // Handle click to focus window and open chat
    browserNotification.onclick = () => {
      window.focus();
      // You can emit an event here to open the chat
      browserNotification.close();
    };
  }

  markAsRead(notificationId: string): void {
    const notifications = this.notifications().map((n) =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    this.notifications.set(notifications);
    this.updateUnreadCount();
    this.saveToStorage();
  }

  markAllAsRead(): void {
    const notifications = this.notifications().map((n) => ({
      ...n,
      isRead: true,
    }));
    this.notifications.set(notifications);
    this.updateUnreadCount();
    this.saveToStorage();
  }

  markLeadNotificationsAsRead(leadId: string): void {
    const notifications = this.notifications().map((n) =>
      n.leadId === leadId ? { ...n, isRead: true } : n
    );
    this.notifications.set(notifications);
    this.updateUnreadCount();
    this.saveToStorage();
  }

  removeNotification(notificationId: string): void {
    const notifications = this.notifications().filter(
      (n) => n.id !== notificationId
    );
    this.notifications.set(notifications);
    this.updateUnreadCount();
    this.saveToStorage();
  }

  clearAll(): void {
    this.notifications.set([]);
    this.unreadCount.set(0);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  toggleSound(): void {
    this.soundEnabled.update((enabled) => !enabled);
    localStorage.setItem(
      'notification_sound_enabled',
      this.soundEnabled().toString()
    );
  }

  getRecentNotifications(limit: number = 10): ChatNotification[] {
    return this.notifications().slice(0, limit);
  }

  getUnreadNotifications(): ChatNotification[] {
    return this.notifications().filter((n) => !n.isRead);
  }
}
