export interface ILeadStatus {
  id: string;
  name: string;
  description?: string;
  color: string;
  bgColor: string;
  icon: string;
  order: number;
  isActive: boolean;
  isInitial?: boolean;
  isFinal?: boolean;
  statusType?: string; // 'positive', 'negative', 'neutral'
  createdAt: Date;
  updatedAt: Date;
}
