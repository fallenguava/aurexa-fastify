export interface Transaction {
  id: string;
  user_id: string;
  pocket_id: string;
  project_id: string | null;
  category_id: string;
  type: "INCOMING" | "OUTCOMING";
  amount: number;
  date: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateTransactionDTO {
  pocket_id: string;
  project_id?: string | null;
  category_id: string;
  amount: number;
  date: string;
  title: string;
  description?: string | null;
}
