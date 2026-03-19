import { BaseRepository } from "./BaseRepository";
import { type Pocket } from "../entities/Pocket";

export class PocketRepository extends BaseRepository<Pocket> {
  constructor() {
    super("pockets");
  }

  async findByUserId(userId: string): Promise<Pocket[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (error) {
      throw new Error(`[pockets] findByUserId failed: ${error.message}`);
    }

    return (data ?? []) as Pocket[];
  }

  async findUserPocketById(id: string, userId: string): Promise<Pocket | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`[pockets] findUserPocketById failed: ${error.message}`);
    }

    return data as Pocket;
  }

  async findUserPocketsByIds(
    userId: string,
    pocketIds: string[],
  ): Promise<Pocket[]> {
    if (pocketIds.length === 0) {
      return [];
    }

    const { data, error } = await this.client
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .in("id", pocketIds)
      .is("deleted_at", null);

    if (error) {
      throw new Error(
        `[pockets] findUserPocketsByIds failed: ${error.message}`,
      );
    }

    return (data ?? []) as Pocket[];
  }
}
