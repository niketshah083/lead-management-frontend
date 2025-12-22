import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FloatingChatService } from '../../../core/services/floating-chat.service';
import { FloatingChatWindowComponent } from '../floating-chat-window/floating-chat-window.component';

@Component({
  selector: 'app-floating-chat-container',
  standalone: true,
  imports: [CommonModule, FloatingChatWindowComponent],
  template: `
    @for (chatWindow of floatingChatService.chatWindows(); track chatWindow.id)
    {
    <app-floating-chat-window [chatWindow]="chatWindow" />
    }
  `,
  styles: [
    `
      :host {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 999;
      }

      :host ::ng-deep .floating-chat-window {
        pointer-events: all;
      }
    `,
  ],
})
export class FloatingChatContainerComponent {
  constructor(public floatingChatService: FloatingChatService) {}
}
