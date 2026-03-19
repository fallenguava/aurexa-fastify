export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: "INCOMING" | "OUTCOMING";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateCategoryDTO {
  name: string;
  type: "INCOMING" | "OUTCOMING";
}

export interface UpdateCategoryDTO {
  name?: string;
  type?: "INCOMING" | "OUTCOMING";
}
