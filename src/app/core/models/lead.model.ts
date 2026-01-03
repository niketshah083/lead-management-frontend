// LeadStatus is now dynamic from database - keeping enum for backward compatibility
// but components should use ILeadStatus from lead-status.model.ts for dynamic statuses
export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  NEGOTIATION = 'negotiation',
  WON = 'won',
  LOST = 'lost',
}

export interface ILeadContact {
  id: string;
  leadId: string;
  name: string;
  designation?: string;
  phone?: string;
  email?: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILead {
  id: string;
  phoneNumber: string;
  name?: string;
  businessName?: string;
  email?: string;
  pincode?: string;
  source?: string; // Lead source (IndiaMART, Gmail, WhatsApp, etc.)
  // Address fields
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
  };
  // Business Type for custom fields
  businessTypeId?: string | null;
  businessType?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  assignedToId?: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  status: string; // Dynamic status name from database
  statusMasterId?: string;
  statusMaster?: {
    id: string;
    name: string;
    color: string;
    bgColor: string;
    icon: string;
    isInitial?: boolean;
    isFinal?: boolean;
    statusType?: string;
  };
  notes?: string;
  firstMessage?: string; // First message content (product, notes, etc.)
  slaStatus?: {
    firstResponseDue: Date;
    resolutionDue: Date;
    firstResponseBreached: boolean;
    resolutionBreached: boolean;
  };
  contacts?: ILeadContact[];
  // Custom field values (populated when requested)
  customFieldValues?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeadFilter {
  status?: string[]; // Dynamic status names
  categoryId?: string;
  assignedToId?: string;
  unassignedOnly?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface IMessage {
  id: string;
  leadId: string;
  content: string;
  direction: 'inbound' | 'outbound';
  senderId?: string;
  sender?: {
    id: string;
    name: string;
  };
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document';
  isAutoReply: boolean;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  createdAt: Date;
}

export interface ISendMessage {
  content: string;
  mediaUrl?: string;
  mediaType?: string;
}

export interface ILeadHistory {
  id: string;
  leadId: string;
  previousStatus?: string; // Dynamic status name
  newStatus: string; // Dynamic status name
  changedById: string;
  changedBy?: {
    id: string;
    name: string;
    email: string;
  };
  notes?: string;
  createdAt: Date;
}
