export type UserType = {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  createdAt: string;
  treeId: string;
  connections: string[];
  current_streak?: number;
  last_interaction_date?: string | null;
  invite_code?: string | null;
  // Campos nuevos para Supabase
  bio?: string;
  phone?: string;
  location?: string;
  birth_date?: string;
  settings?: {
    notifications?: {
      gifts: boolean;
      memories: boolean;
      family: boolean;
      timeCapsules: boolean;
      comments: boolean;
      push: boolean;
      email: boolean;
    };
    privacy?: {
      profileVisible: boolean;
      allowFriendRequests: boolean;
      shareLocation: boolean;
      dataAnalytics: boolean;
    };
  };
};