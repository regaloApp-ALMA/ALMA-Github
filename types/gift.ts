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
  unlockDate?: string;
  isNew: boolean;
};