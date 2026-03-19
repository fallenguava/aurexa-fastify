export interface Snapshot {
  id: string;
  pocket_id: string;
  year: number;
  month: number;
  starting_balance: number;
  ending_balance: number;
  is_locked: boolean;
  deleted_at: string | null;
}

export interface SnapshotUpsertData {
  pocket_id: string;
  year: number;
  month: number;
  starting_balance: number;
  ending_balance: number;
  is_locked: boolean;
}
