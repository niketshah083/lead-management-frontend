import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
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
  RecentChatsService,
  NotificationService,
  RoleBasedChatService,
} from '../../../../core/services';
import { ILead, IMessage } from '../../../../core/models';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    TextareaModule,
    ToastModule,
    FileUploadModule,
    ImageModule,
    LayoutComponent,
  ],
  providers: [MessageService],
  template: `
    <app-layout>
      <p-toast />
      <div class="chat-container">
        <div class="chat-header">
          <div class="header-info">
            <button
              pButton
              icon="pi pi-arrow-left"
              [text]="true"
              [rounded]="true"
              [routerLink]="['/leads', leadId]"
            ></button>
            <div class="lead-info">
              @if (lead()) {
              <h1 class="lead-name">
                {{ lead()!.name || lead()!.phoneNumber }}
              </h1>
              <p class="lead-phone">{{ lead()!.phoneNumber }}</p>
              }
            </div>
          </div>
          <div
            class="connection-status"
            [class.connected]="wsService.status() === 'connected'"
            [class.disconnected]="wsService.status() === 'disconnected'"
          >
            <span class="status-dot"></span>
            <span class="status-text">{{ wsService.status() }}</span>
          </div>
        </div>

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
                  width="200"
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
                  <span>View Document</span>
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
                @if (message.sender) {
                <span class="message-sender">{{ message.sender.name }}</span>
                } @if (message.isAutoReply) {
                <span class="auto-badge">Auto</span>
                }
              </div>
            </div>
          </div>
          } @empty {
          <div class="empty-messages">
            <i class="pi pi-comments"></i>
            <p>No messages yet</p>
            <span>Start the conversation!</span>
          </div>
          }
        </div>

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
              (click)="clearSelectedFile()"
              class="clear-file-btn"
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
              (click)="fileInput.click()"
              class="attach-btn"
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
            ></textarea>
            <button
              pButton
              icon="pi pi-send"
              [loading]="sending() || uploading()"
              (click)="sendMessage()"
              [disabled]="!newMessage.trim() && !selectedFile()"
              class="send-btn"
            ></button>
          </div>
        </div>
      </div>
    </app-layout>
  `,
  styles: [
    `
      .chat-container {
        display: flex;
        flex-direction: column;
        height: calc(100vh - 60px);
        background: #f0f2f5;
      }
      @media (min-width: 1025px) {
        .chat-container {
          height: 100vh;
        }
      }
      .chat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        background: white;
        border-bottom: 1px solid #e5e7eb;
      }
      .header-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .lead-info {
        display: flex;
        flex-direction: column;
      }
      .lead-name {
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
      }
      .lead-phone {
        font-size: 0.75rem;
        color: #6b7280;
        margin: 0;
      }
      .connection-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.375rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 500;
      }
      .connection-status.connected {
        background: #d1fae5;
        color: #059669;
      }
      .connection-status.disconnected {
        background: #fee2e2;
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
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .message-wrapper {
        display: flex;
        max-width: 75%;
      }
      .message-wrapper.outbound {
        align-self: flex-end;
      }
      .message-wrapper.inbound {
        align-self: flex-start;
      }
      .message-bubble {
        padding: 0.75rem 1rem;
        border-radius: 16px;
        max-width: 100%;
      }
      .outbound .message-bubble {
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        color: white;
        border-bottom-right-radius: 4px;
      }
      .inbound .message-bubble {
        background: white;
        color: #1f2937;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      .message-content {
        margin: 0 0 0.25rem 0;
        line-height: 1.4;
        word-wrap: break-word;
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
        border-radius: 8px;
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
      }
      .empty-messages i {
        font-size: 3rem;
        margin-bottom: 1rem;
      }
      .empty-messages p {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0 0 0.25rem 0;
      }
      .empty-messages span {
        font-size: 0.875rem;
      }
      .message-media {
        margin-bottom: 0.5rem;
      }
      :host ::ng-deep .chat-image img {
        border-radius: 8px;
        max-width: 200px;
      }
      .chat-video {
        max-width: 250px;
        border-radius: 8px;
      }
      .document-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: inherit;
        text-decoration: none;
        font-size: 0.875rem;
      }
      .inbound .document-link {
        background: #f1f5f9;
      }
      .input-container {
        padding: 1rem 1.5rem;
        background: white;
        border-top: 1px solid #e5e7eb;
      }
      .media-preview {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        margin-bottom: 0.75rem;
        background: #f8fafc;
        border-radius: 12px;
        max-width: 1200px;
        margin-left: auto;
        margin-right: auto;
      }
      .preview-image {
        max-width: 100px;
        max-height: 80px;
        border-radius: 8px;
        object-fit: cover;
      }
      .file-preview {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #374151;
        font-size: 0.875rem;
      }
      .file-preview i {
        font-size: 1.5rem;
        color: #6b7280;
      }
      .clear-file-btn {
        margin-left: auto;
      }
      .input-wrapper {
        display: flex;
        align-items: flex-end;
        gap: 0.5rem;
        max-width: 1200px;
        margin: 0 auto;
      }
      .attach-btn {
        width: 40px;
        height: 40px;
        color: #6b7280;
      }
      .message-input {
        flex: 1;
        border-radius: 24px;
        padding: 0.75rem 1rem;
        border: 1px solid #e5e7eb;
        resize: none;
        max-height: 120px;
      }
      .message-input:focus {
        border-color: #25d366;
        box-shadow: 0 0 0 2px rgba(37, 211, 102, 0.1);
      }
      .send-btn {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
        border: none;
      }
      @media (max-width: 640px) {
        .chat-header {
          padding: 0.75rem 1rem;
        }
        .messages-container {
          padding: 0.75rem;
        }
        .message-wrapper {
          max-width: 85%;
        }
        .input-container {
          padding: 0.75rem 1rem;
        }
      }
    `,
  ],
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  lead = signal<ILead | null>(null);
  messages = signal<IMessage[]>([]);
  loading = signal(true);
  sending = signal(false);
  uploading = signal(false);
  selectedFile = signal<File | null>(null);
  filePreviewUrl = signal<string>('');
  newMessage = '';
  leadId = '';
  private messageSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private leadService: LeadService,
    private apiService: ApiService,
    public wsService: WebSocketService,
    public authService: AuthService,
    private messageService: MessageService,
    private recentChatsService: RecentChatsService,
    private notificationService: NotificationService,
    private roleBasedChatService: RoleBasedChatService
  ) {}

  ngOnInit(): void {
    this.leadId = this.route.snapshot.paramMap.get('id') || '';
    if (this.leadId) {
      this.loadLead();
      this.loadMessages();
      this.setupWebSocket();
      // Mark this chat as read when entering
      this.recentChatsService.markAsRead(this.leadId);
      // Also mark notifications as read
      this.notificationService.markLeadNotificationsAsRead(this.leadId);
      // Mark role-based chat as read
      this.roleBasedChatService.markAsRead(this.leadId);
    }
  }

  ngOnDestroy(): void {
    if (this.leadId) {
      this.wsService.leaveLeadRoom(this.leadId);
    }
    this.messageSubscription?.unsubscribe();
  }

  private loadLead(): void {
    this.leadService.getLead(this.leadId).subscribe({
      next: (response) => {
        this.lead.set(response.data);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load lead',
        });
      },
    });
  }

  private loadMessages(): void {
    this.loading.set(true);
    this.leadService.getMessages(this.leadId).subscribe({
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
    this.wsService.joinLeadRoom(this.leadId);
    this.messageSubscription = this.wsService.messages$.subscribe((message) => {
      if (message.leadId === this.leadId) {
        // Check for duplicate message before adding
        this.messages.update((msgs) => {
          const exists = msgs.some((m) => m.id === message.id);
          if (exists) {
            return msgs;
          }
          return [...msgs, message];
        });
        this.scrollToBottom();
        // Update recent chats for incoming messages
        if (message.direction === 'inbound' && this.lead()) {
          this.recentChatsService.addOrUpdateChat(
            this.lead()!,
            message.content || 'Media',
            true
          );
          this.roleBasedChatService.addOrUpdateChat(
            this.lead()!,
            message.content || 'Media',
            true
          );
          // Mark as read since user is viewing this chat
          this.recentChatsService.markAsRead(this.leadId);
          this.roleBasedChatService.markAsRead(this.leadId);
          this.notificationService.markLeadNotificationsAsRead(this.leadId);
        }
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile.set(file);

      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.filePreviewUrl.set(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
    // Reset input so same file can be selected again
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
      // Upload file first, then send message
      this.uploadAndSendMessage(content, file);
    } else {
      // Send text-only message
      this.sendTextMessage(content);
    }
  }

  private uploadAndSendMessage(content: string, file: File): void {
    this.uploading.set(true);

    this.apiService.uploadFile<any>('messages/upload', file).subscribe({
      next: (response) => {
        this.uploading.set(false);
        // Send message with media
        this.leadService
          .sendMessage(this.leadId, {
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
              // Update recent chats for outbound message
              if (this.lead()) {
                this.recentChatsService.addOrUpdateChat(
                  this.lead()!,
                  content || file.name,
                  false
                );
              }
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
    this.leadService.sendMessage(this.leadId, { content }).subscribe({
      next: (response) => {
        this.messages.update((msgs) => [...msgs, response.data]);
        this.newMessage = '';
        this.sending.set(false);
        this.scrollToBottom();
        // Update recent chats for outbound message
        if (this.lead()) {
          this.recentChatsService.addOrUpdateChat(this.lead()!, content, false);
        }
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
