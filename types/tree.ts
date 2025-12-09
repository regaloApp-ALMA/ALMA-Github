// ⚠️ IMPORTANTE: Estos tipos deben coincidir EXACTAMENTE con el esquema SQL
// Tabla branches: id, tree_id, name, category, color, is_shared, position, created_at
// ⚠️ NO tiene: user_id, description
export type BranchType = {
  id: string;
  name: string;
  categoryId: string; // Mapeado desde 'category' en SQL
  color: string;
  createdAt: string; // Mapeado desde created_at
  isShared: boolean; // Mapeado desde is_shared
  position?: { x: number; y: number };
  // Campos legacy/compatibilidad (no están en el SQL pero se mantienen para compatibilidad)
  sharedWith?: string[];
  // ❌ NO incluir userId - no existe en el esquema SQL
};

// Tabla fruits: id, branch_id, title, description, media_urls, date, is_shared, position, created_at
// ⚠️ NO tiene: user_id, tree_id, location
export type FruitType = {
  id: string;
  title: string;
  description: string;
  branchId: string; // Mapeado desde branch_id
  mediaUrls?: string[]; // Mapeado desde media_urls
  date?: string; // Mapeado desde date
  createdAt: string; // Mapeado desde created_at
  isShared: boolean; // Mapeado desde is_shared
  position?: { x: number; y: number };
  // Campos legacy/compatibilidad (no están en el SQL pero se mantienen para compatibilidad)
  tags?: string[];
  people?: string[];
  emotions?: string[];
  sharedWith?: string[];
  // ⚠️ location NO existe en el SQL, se omite en inserts/updates
  // ❌ NO incluir userId ni treeId - no existen en el esquema SQL
};

export type RootType = {
  id: string;
  name: string;
  relation: string;
  treeId?: string;
  createdAt: string;
};

export type TreeType = {
  id: string;
  ownerId: string;
  name: string;
  createdAt: string;
  branches: BranchType[];
  fruits: FruitType[];
  roots: RootType[];
};