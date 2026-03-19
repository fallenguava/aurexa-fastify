import { BaseRepository } from "./BaseRepository";
import { type Category } from "../entities/Category";

export class CategoryRepository extends BaseRepository<Category> {
  constructor() {
    super("categories");
  }

  async findByUserId(userId: string): Promise<Category[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (error) {
      throw new Error(`[categories] findByUserId failed: ${error.message}`);
    }

    return (data ?? []) as Category[];
  }

  async findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<Category | null> {
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
      throw new Error(
        `[categories] findByIdAndUserId failed: ${error.message}`,
      );
    }

    return data as Category;
  }

  async findByIdsAndUserId(
    userId: string,
    categoryIds: string[],
  ): Promise<Category[]> {
    if (categoryIds.length === 0) {
      return [];
    }

    const { data, error } = await this.client
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .in("id", categoryIds)
      .is("deleted_at", null);

    if (error) {
      throw new Error(
        `[categories] findByIdsAndUserId failed: ${error.message}`,
      );
    }

    return (data ?? []) as Category[];
  }
}
