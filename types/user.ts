export type UserType = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  treeId: string;
  connections: string[];
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