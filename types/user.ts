// ⚠️ IMPORTANTE: Este tipo debe coincidir EXACTAMENTE con el esquema SQL
// Tabla profiles: id, email, name, avatar_url, bio, phone, location, birth_date, 
//                 current_streak, last_interaction_date, created_at, settings, updated_at
export type UserType = {
  id: string;
  name: string; // ⚠️ NO full_name, es 'name' en el SQL
  email: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  location?: string;
  birth_date?: string;
  current_streak?: number;
  max_streak?: number;
  last_interaction_date?: string;
  createdAt: string; // Mapeado desde created_at
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
  // Campos legacy/compatibilidad (no están en el SQL pero se mantienen para compatibilidad)
  treeId?: string;
  connections?: string[];
};