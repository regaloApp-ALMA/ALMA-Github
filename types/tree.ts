export type BranchType = {
  id: string;
  name: string;
  categoryId: string;
  color: string;
  createdAt: string;
  isShared: boolean;
  sharedWith?: string[];
  position?: { x: number; y: number };
};

export type FruitType = {
  id: string;
  title: string;
  description: string;
  branchId: string;
  mediaUrls?: string[];
  createdAt: string;
  tags?: string[];
  location?: {
    name: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  people?: string[];
  emotions?: string[];
  isShared: boolean;
  sharedWith?: string[];
  position?: { x: number; y: number };
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