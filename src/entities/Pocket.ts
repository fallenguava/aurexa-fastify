export interface Pocket {
  id: string;
  user_id: string;
  name: string;
  current_balance: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreatePocketDTO {
  name: string;
  current_balance?: number;
}

export interface UpdatePocketDTO {
  name: string;
}
