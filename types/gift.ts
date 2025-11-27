export type GiftType = {
  id: string;
  type: 'branch' | 'fruit' | 'tree' | 'timeCapsule';
  senderId: string;
  senderName: string;
  recipientId: string;
  message: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
  contentId: string;
  // AÑADIDO: Este es el campo que faltaba
  contentData?: any;
  unlockDate?: string;
  isNew: boolean;
};