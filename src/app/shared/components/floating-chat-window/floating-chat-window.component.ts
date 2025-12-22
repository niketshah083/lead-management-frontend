import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  signal,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { FileUploadModule } from 'primeng/fileupload';
import { ImageModule } from 'primeng/image';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import {
  LeadService,
  WebSocketService,
  AuthService,
  ApiService,
  FloatingChatService,
  NotificationService,
  RecentChatsService,
  RoleBasedChatService,
} from '../../../core/services';
import { IMessage, ILead } from '../../../core/models';
import { FloatingChatWindow } from '../../../core/services/floating-chat.service';

@Component({
  selector: 'app-floating-chat-window',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TextareaModule,
    ToastModule,
    FileUploadModule,
    ImageModule,
  ],
  providers: [MessageService],
  template: `
    <div
      class="floating-chat-window"
      [style.left.px]="chatWindow.position.x"
      [style.top.px]="chatWindow.position.y"
      [style.z-index]="chatWindow.zIndex"
      [class.minimized]="chatWindow.isMinimized"
      (mousedown)="onWindowMouseDown($event)"
    >
      <!-- Window Header -->
      <div
        class="chat-window-header"
        [class.dragging]="isDragging"
        (mousedown)="startDrag($event)"
      >
        <div class="header-info">
          <div class="lead-avatar">
            {{ getLeadInitials() }}
          </div>
          <div class="lead-details">
            <div class="lead-name">
              {{ chatWindow.lead.name || chatWindow.lead.phoneNumber }}
            </div>
            <div class="lead-phone">{{ chatWindow.lead.phoneNumber }}</div>
          </div>
          @if (chatWindow.unreadCount > 0 && chatWindow.isMinimized) {
          <div class="unread-indicator">{{ chatWindow.unreadCount }}</div>
          }
        </div>
        <div class="header-actions">
          <button
            pButton
            [icon]="
              chatWindow.isMinimized
                ? 'pi pi-window-maximize'
                : 'pi pi-window-minimize'
            "
            [text]="true"
            [rounded]="true"
            size="small"
            (click)="toggleMinimize()"
            class="minimize-btn"
          ></button>
          <button
            pButton
            icon="pi pi-times"
            [text]="true"
            [rounded]="true"
            size="small"
            (click)="closeWindow()"
            class="close-btn"
          ></button>
        </div>
      </div>

      <!-- Window Content -->
      @if (!chatWindow.isMinimized) {
      <div class="chat-window-content">
        <!-- Connection Status -->
        <div
          class="connection-status"
          [class.connected]="wsService.status() === 'connected'"
          [class.disconnected]="wsService.status() === 'disconnected'"
        >
          <span class="status-dot"></span>
          <span class="status-text">{{ wsService.status() }}</span>
        </div>

        <!-- Messages Container -->
        <div #messageContainer class="messages-container">
          @for (message of messages(); track message.id) {
          <div
            class="message-wrapper"
            [class.outbound]="message.direction === 'outbound'"
            [class.inbound]="message.direction === 'inbound'"
          >
            <div class="message-bubble">
              @if (message.mediaUrl) {
              <div class="message-media">
                @if (message.mediaType === 'image') {
                <p-image
                  [src]="message.mediaUrl"
                  [alt]="'Media'"
                  [preview]="true"
                  width="150"
                  class="chat-image"
                />
                } @else if (message.mediaType === 'video') {
                <video
                  [src]="message.mediaUrl"
                  controls
                  class="chat-video"
                ></video>
                } @else if (message.mediaType === 'document') {
                <a
                  [href]="message.mediaUrl"
                  target="_blank"
                  class="document-link"
                >
                  <i class="pi pi-file-pdf"></i>
                  <span>Document</span>
                </a>
                }
              </div>
              } @if (message.content) {
              <p class="message-content">{{ message.content }}</p>
              }
              <div class="message-meta">
                <span class="message-time">{{
                  message.createdAt | date : 'shortTime'
                }}</span>
                @if (message.isAutoReply) {
                <span class="auto-badge">Auto</span>
                }
              </div>
            </div>
          </div>
          } @empty {
          <div class="empty-messages">
            <i class="pi pi-comments"></i>
            <p>No messages yet</p>
          </div>
          }
        </div>

        <!-- Input Container -->
        <div class="input-container">
          @if (selectedFile()) {
          <div class="media-preview">
            @if (selectedFile()!.type.startsWith('image/')) {
            <img [src]="filePreviewUrl()" alt="Preview" class="preview-image" />
            } @else {
            <div class="file-preview">
              <i
                class="pi"
                [class.pi-video]="selectedFile()!.type.startsWith('video/')"
                [class.pi-file-pdf]="selectedFile()!.type === 'application/pdf'"
              ></i>
              <span>{{ selectedFile()!.name }}</span>
            </div>
            }
            <button
              pButton
              icon="pi pi-times"
              [rounded]="true"
              [text]="true"
              severity="danger"
              size="small"
              (click)="clearSelectedFile()"
            ></button>
          </div>
          }
          <div class="input-wrapper">
            <input
              type="file"
              #fileInput
              (change)="onFileSelected($event)"
              accept="image/*,video/*,.pdf"
              style="display: none"
            />
            <button
              pButton
              icon="pi pi-paperclip"
              [text]="true"
              [rounded]="true"
              size="small"
              (click)="fileInput.click()"
              [disabled]="uploading()"
            ></button>
            <textarea
              pTextarea
              [(ngModel)]="newMessage"
              placeholder="Type a message..."
              [rows]="1"
              class="message-input"
              (keydown.enter)="sendMessage($event)"
              [autoResize]="true"
              (focus)="onInputFocus()"
            ></textarea>
            <button
              pButton
              icon="pi pi-send"
              [loading]="sending() || uploading()"
              (click)="sendMessage()"
              [disabled]="!newMessage.trim() && !selectedFile()"
              size="small"
            ></button>
          </div>
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .floating-chat-window {
        position: fixed;
        width: 300px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        border: 1px solid #e5e7eb;
        overflow: hidden;
        transition: all 0.3s ease;
        user-select: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
          sans-serif;
      }

      .floating-chat-window.minimized {
        height: 52px !important;
      }

      .floating-chat-window:not(.minimized) {
        height: 450px;
      }

      .chat-window-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.625rem 0.875rem;
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        color: white;
        cursor: move;
        user-select: none;
        border-radius: 16px 16px 0 0;
      }

      .chat-window-header.dragging {
        cursor: grabbing;
      }

      .header-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
        min-width: 0;
      }

      .lead-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.8rem;
        flex-shrink: 0;
      }

      .lead-details {
        flex: 1;
        min-width: 0;
      }

      .lead-name {
        font-weight: 600;
        font-size: 0.8rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .lead-phone {
        font-size: 0.7rem;
        opacity: 0.9;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .unread-indicator {
        background: #ef4444;
        color: white;
        font-size: 0.7rem;
        font-weight: 600;
        padding: 0.2rem 0.5rem;
        border-radius: 10px;
        min-width: 20px;
        text-align: center;
      }

      .header-actions {
        display: flex;
        gap: 0.25rem;
      }

      .minimize-btn,
      .close-btn {
        width: 24px !important;
        height: 24px !important;
        color: white !important;
        background: rgba(255, 255, 255, 0.1) !important;
        border: none !important;
        border-radius: 50% !important;
      }

      .minimize-btn:hover,
      .close-btn:hover {
        background: rgba(255, 255, 255, 0.2) !important;
      }

      .close-btn:hover {
        background: rgba(239, 68, 68, 0.8) !important;
      }

      .chat-window-content {
        display: flex;
        flex-direction: column;
        height: 398px;
      }

      .connection-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        font-size: 0.75rem;
        font-weight: 500;
        border-bottom: 1px solid #f1f5f9;
      }

      .connection-status.connected {
        background: #f0fdf4;
        color: #059669;
      }

      .connection-status.disconnected {
        background: #fef2f2;
        color: #dc2626;
      }

      .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }

      .messages-container {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        background: #f8fafc;
      }

      .message-wrapper {
        display: flex;
        max-width: 80%;
      }

      .message-wrapper.outbound {
        align-self: flex-end;
      }

      .message-wrapper.inbound {
        align-self: flex-start;
      }

      .message-bubble {
        padding: 0.375rem 0.625rem;
        border-radius: 16px;
        max-width: 100%;
      }

      .outbound .message-bubble {
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        color: white;
        border-bottom-right-radius: 6px;
      }

      .inbound .message-bubble {
        background: white;
        color: #1f2937;
        border-bottom-left-radius: 6px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      .message-content {
        margin: 0 0 0.25rem 0;
        line-height: 1.3;
        word-wrap: break-word;
        font-size: 0.8rem;
      }

      .message-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.65rem;
        opacity: 0.8;
      }

      .auto-badge {
        background: rgba(255, 255, 255, 0.2);
        padding: 0.125rem 0.375rem;
        border-radius: 6px;
        font-style: italic;
      }

      .inbound .auto-badge {
        background: #f1f5f9;
      }

      .empty-messages {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #9ca3af;
        gap: 0.5rem;
      }

      .empty-messages i {
        font-size: 2rem;
      }

      .empty-messages p {
        font-size: 0.875rem;
        margin: 0;
      }

      .message-media {
        margin-bottom: 0.5rem;
      }

      :host ::ng-deep .chat-image img {
        border-radius: 6px;
        max-width: 150px;
      }

      .chat-video {
        max-width: 180px;
        border-radius: 6px;
      }

      .document-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        color: inherit;
        text-decoration: none;
        font-size: 0.75rem;
      }

      .inbound .document-link {
        background: #f1f5f9;
      }

      .input-container {
        padding: 0.5rem;
        background: white;
        border-top: 1px solid #e5e7eb;
        border-radius: 0 0 16px 16px;
      }

      .media-preview {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        margin-bottom: 0.5rem;
        background: #f8fafc;
        border-radius: 8px;
      }

      .preview-image {
        max-width: 60px;
        max-height: 50px;
        border-radius: 4px;
        object-fit: cover;
      }

      .file-preview {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #374151;
        font-size: 0.75rem;
        flex: 1;
      }

      .file-preview i {
        font-size: 1.2rem;
        color: #6b7280;
      }

      .input-wrapper {
        display: flex;
        align-items: flex-end;
        gap: 0.5rem;
      }

      .message-input {
        flex: 1;
        border-radius: 20px;
        padding: 0.375rem 0.625rem;
        border: 1px solid #e5e7eb;
        resize: none;
        max-height: 60px;
        font-size: 0.8rem;
        background: #f8fafc;
      }

      .message-input:focus {
        border-color: #25d366;
        box-shadow: 0 0 0 2px rgba(37, 211, 102, 0.1);
      }

      /* Scrollbar styling */
      .messages-container::-webkit-scrollbar {
        width: 4px;
      }

      .messages-container::-webkit-scrollbar-track {
        background: transparent;
      }

      .messages-container::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 2px;
      }

      .messages-container::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `,
  ],
})
export class FloatingChatWindowComponent implements OnInit, OnDestroy {
  @Input() chatWindow!: FloatingChatWindow;
  @ViewChild('messageContainer') messageContainer!: ElementRef;

  messages = signal<IMessage[]>([]);
  loading = signal(true);
  sending = signal(false);
  uploading = signal(false);
  selectedFile = signal<File | null>(null);
  filePreviewUrl = signal<string>('');
  newMessage = '';

  // Dragging state
  isDragging = false;
  dragOffset = { x: 0, y: 0 };

  private messageSubscription?: Subscription;

  constructor(
    private leadService: LeadService,
    private apiService: ApiService,
    public wsService: WebSocketService,
    public authService: AuthService,
    private messageService: MessageService,
    private floatingChatService: FloatingChatService,
    private notificationService: NotificationService,
    private recentChatsService: RecentChatsService,
    private roleBasedChatService: RoleBasedChatService
  ) {}

  ngOnInit(): void {
    this.loadMessages();
    this.setupWebSocket();
    // Mark all services as read when opening the chat window
    this.markAllAsRead();
  }

  ngOnDestroy(): void {
    if (this.chatWindow.id) {
      this.wsService.leaveLeadRoom(this.chatWindow.id);
    }
    this.messageSubscription?.unsubscribe();
  }

  private loadMessages(): void {
    this.loading.set(true);
    this.leadService.getMessages(this.chatWindow.id).subscribe({
      next: (response) => {
        this.messages.set(response.data);
        this.loading.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load messages',
        });
      },
    });
  }

  private setupWebSocket(): void {
    this.wsService.connect();
    this.wsService.joinLeadRoom(this.chatWindow.id);
    this.messageSubscription = this.wsService.messages$.subscribe((message) => {
      if (message.leadId === this.chatWindow.id) {
        // Check for duplicate message before adding
        this.messages.update((msgs) => {
          const exists = msgs.some((m) => m.id === message.id);
          if (exists) {
            return msgs;
          }
          return [...msgs, message];
        });
        this.scrollToBottom();

        // Handle inbound messages
        if (message.direction === 'inbound') {
          if (this.chatWindow.isMinimized) {
            // Update unread count if window is minimized
            this.floatingChatService.incrementUnreadCount(this.chatWindow.id);
          } else {
            // Mark as read since user is viewing this chat (window is expanded)
            this.markAllAsRead();
          }
        }
      }
    });
  }

  getLeadInitials(): string {
    const name = this.chatWindow.lead.name || this.chatWindow.lead.phoneNumber;
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  toggleMinimize(): void {
    this.floatingChatService.minimizeWindow(
      this.chatWindow.id,
      !this.chatWindow.isMinimized
    );

    // Reset unread counts when expanding
    if (this.chatWindow.isMinimized) {
      this.markAllAsRead();
    }
  }

  closeWindow(): void {
    this.floatingChatService.closeWindow(this.chatWindow.id);
  }

  onWindowMouseDown(event: MouseEvent): void {
    // Bring window to front when clicked
    this.floatingChatService.bringToFront(this.chatWindow.id);
  }

  startDrag(event: MouseEvent): void {
    if (event.button !== 0) return; // Only left mouse button

    event.preventDefault();
    this.isDragging = true;

    this.dragOffset = {
      x: event.clientX - this.chatWindow.position.x,
      y: event.clientY - this.chatWindow.position.y,
    };

    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('mouseup', this.stopDrag);
  }

  private onDrag = (event: MouseEvent): void => {
    if (!this.isDragging) return;

    const newX = Math.max(
      0,
      Math.min(window.innerWidth - 300, event.clientX - this.dragOffset.x)
    );
    const newY = Math.max(
      0,
      Math.min(
        window.innerHeight - (this.chatWindow.isMinimized ? 52 : 450),
        event.clientY - this.dragOffset.y
      )
    );

    this.floatingChatService.updatePosition(this.chatWindow.id, {
      x: newX,
      y: newY,
    });
  };

  private stopDrag = (): void => {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
  };

  @HostListener('window:resize')
  onWindowResize(): void {
    // Ensure window stays within viewport bounds
    const maxX = window.innerWidth - 300;
    const maxY = window.innerHeight - (this.chatWindow.isMinimized ? 52 : 450);

    if (
      this.chatWindow.position.x > maxX ||
      this.chatWindow.position.y > maxY
    ) {
      this.floatingChatService.updatePosition(this.chatWindow.id, {
        x: Math.min(this.chatWindow.position.x, maxX),
        y: Math.min(this.chatWindow.position.y, maxY),
      });
    }
  }

  onInputFocus(): void {
    // Reset all unread counts when user focuses on input
    this.markAllAsRead();
  }

  /**
   * Mark all services as read for this chat window
   */
  private markAllAsRead(): void {
    this.floatingChatService.resetUnreadCount(this.chatWindow.id);
    this.notificationService.markLeadNotificationsAsRead(this.chatWindow.id);
    this.recentChatsService.markAsRead(this.chatWindow.id);
    this.roleBasedChatService.markAsRead(this.chatWindow.id);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile.set(file);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.filePreviewUrl.set(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
    input.value = '';
  }

  clearSelectedFile(): void {
    this.selectedFile.set(null);
    this.filePreviewUrl.set('');
  }

  sendMessage(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    const content = this.newMessage.trim();
    const file = this.selectedFile();

    if (!content && !file) return;

    this.sending.set(true);

    if (file) {
      this.uploadAndSendMessage(content, file);
    } else {
      this.sendTextMessage(content);
    }
  }

  private uploadAndSendMessage(content: string, file: File): void {
    this.uploading.set(true);

    this.apiService.uploadFile<any>('messages/upload', file).subscribe({
      next: (response) => {
        this.uploading.set(false);
        this.leadService
          .sendMessage(this.chatWindow.id, {
            content: content || file.name,
            mediaUrl: response.data.url,
            mediaType: response.data.mediaType,
          })
          .subscribe({
            next: (msgResponse) => {
              this.messages.update((msgs) => [...msgs, msgResponse.data]);
              this.newMessage = '';
              this.clearSelectedFile();
              this.sending.set(false);
              this.scrollToBottom();
            },
            error: () => {
              this.sending.set(false);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to send message',
              });
            },
          });
      },
      error: () => {
        this.uploading.set(false);
        this.sending.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to upload file',
        });
      },
    });
  }

  private sendTextMessage(content: string): void {
    this.leadService.sendMessage(this.chatWindow.id, { content }).subscribe({
      next: (response) => {
        this.messages.update((msgs) => [...msgs, response.data]);
        this.newMessage = '';
        this.sending.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.sending.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to send message',
        });
      },
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messageContainer) {
        const el = this.messageContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 100);
  }
}
