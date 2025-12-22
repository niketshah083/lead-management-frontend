import { Injectable, signal } from '@angular/core';
import { ILead } from '../models';

export interface FloatingChatWindow {
  id: string;
  lead: ILead;
  isMinimized: boolean;
  position: { x: number; y: number };
  zIndex: number;
  unreadCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class FloatingChatService {
  private readonly MAX_WINDOWS = 5;
  private readonly WINDOW_WIDTH = 350;
  private readonly WINDOW_HEIGHT = 500;
  private readonly WINDOW_SPACING = 20;
  private nextZIndex = 1000;

  chatWindows = signal<FloatingChatWindow[]>([]);

  openChat(lead: ILead): void {
    const existingWindow = this.chatWindows().find((w) => w.id === lead.id);

    if (existingWindow) {
      // Bring existing window to front and unminimize
      this.bringToFront(existingWindow.id);
      this.minimizeWindow(existingWindow.id, false);
      return;
    }

    // Check if we've reached the maximum number of windows
    if (this.chatWindows().length >= this.MAX_WINDOWS) {
      // Close the oldest window (first in array)
      const oldestWindow = this.chatWindows()[0];
      this.closeWindow(oldestWindow.id);
    }

    // Calculate position for new window
    const position = this.calculateNewWindowPosition();

    const newWindow: FloatingChatWindow = {
      id: lead.id,
      lead,
      isMinimized: false,
      position,
      zIndex: this.nextZIndex++,
      unreadCount: 0,
    };

    this.chatWindows.update((windows) => [...windows, newWindow]);
  }

  closeWindow(windowId: string): void {
    this.chatWindows.update((windows) =>
      windows.filter((w) => w.id !== windowId)
    );
  }

  minimizeWindow(windowId: string, minimize: boolean = true): void {
    this.chatWindows.update((windows) =>
      windows.map((w) =>
        w.id === windowId ? { ...w, isMinimized: minimize } : w
      )
    );
  }

  bringToFront(windowId: string): void {
    this.chatWindows.update((windows) =>
      windows.map((w) =>
        w.id === windowId ? { ...w, zIndex: this.nextZIndex++ } : w
      )
    );
  }

  updatePosition(windowId: string, position: { x: number; y: number }): void {
    this.chatWindows.update((windows) =>
      windows.map((w) => (w.id === windowId ? { ...w, position } : w))
    );
  }

  incrementUnreadCount(windowId: string): void {
    this.chatWindows.update((windows) =>
      windows.map((w) =>
        w.id === windowId ? { ...w, unreadCount: w.unreadCount + 1 } : w
      )
    );
  }

  resetUnreadCount(windowId: string): void {
    this.chatWindows.update((windows) =>
      windows.map((w) => (w.id === windowId ? { ...w, unreadCount: 0 } : w))
    );
  }

  private calculateNewWindowPosition(): { x: number; y: number } {
    const windows = this.chatWindows();
    const windowCount = windows.length;

    // Start from bottom-right corner
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const baseX = viewportWidth - this.WINDOW_WIDTH - this.WINDOW_SPACING;
    const baseY = viewportHeight - this.WINDOW_HEIGHT - this.WINDOW_SPACING;

    // Offset each new window slightly
    const offsetX = (windowCount * 30) % 200; // Wrap around after 200px
    const offsetY = (windowCount * 30) % 150; // Wrap around after 150px

    return {
      x: Math.max(this.WINDOW_SPACING, baseX - offsetX),
      y: Math.max(this.WINDOW_SPACING, baseY - offsetY),
    };
  }

  minimizeAll(): void {
    this.chatWindows.update((windows) =>
      windows.map((w) => ({ ...w, isMinimized: true }))
    );
  }

  closeAll(): void {
    this.chatWindows.set([]);
  }
}
