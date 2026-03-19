import { BaseRepository } from "./BaseRepository";
import { type Snapshot, type SnapshotUpsertData } from "../entities/Snapshot";

export class SnapshotRepository extends BaseRepository<Snapshot> {
  constructor() {
    super("monthly_snapshots");
  }

  async findSnapshot(
    pocketId: string,
    year: number,
    month: number,
  ): Promise<Snapshot | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select("*")
      .eq("pocket_id", pocketId)
      .eq("year", year)
      .eq("month", month)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(
        `[monthly_snapshots] findSnapshot failed: ${error.message}`,
      );
    }

    return data as Snapshot;
  }

  async upsertSnapshot(data: SnapshotUpsertData): Promise<Snapshot> {
    const { data: result, error } = await this.client
      .from(this.tableName)
      .upsert(data, { onConflict: "pocket_id,year,month" })
      .select()
      .single();

    if (error) {
      throw new Error(
        `[monthly_snapshots] upsertSnapshot failed: ${error.message}`,
      );
    }

    return result as Snapshot;
  }

  async invalidateSnapshot(
    pocketId: string,
    year: number,
    month: number,
  ): Promise<void> {
    await this.client
      .from(this.tableName)
      .delete()
      .eq("pocket_id", pocketId)
      .eq("year", year)
      .eq("month", month);
  }
}
