export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

export interface IMedia {
  id: string;
  url: string;
  signedUrl?: string;
  type: MediaType;
  filename: string;
  size: number;
}

export interface IAutoReplyTemplate {
  id: string;
  triggerKeyword: string;
  messageContent: string;
  priority: number;
  isActive: boolean;
}

export interface ICategory {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  media?: IMedia[];
  autoReplyTemplates?: IAutoReplyTemplate[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateCategory {
  name: string;
  description: string;
  keywords: string[];
}

export interface IUpdateCategory {
  name?: string;
  description?: string;
  keywords?: string[];
  isActive?: boolean;
}
