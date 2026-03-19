import { type SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../utils/supabase";

export abstract class BaseRepository<T extends object> {
  constructor(protected readonly tableName: string) {}

  protected get client(): SupabaseClient {
    return supabase;
  }

  async findAll(filters?: Record<string, unknown>): Promise<T[]> {
    let query = this.client
      .from(this.tableName)
      .select("*")
      .is("deleted_at", null);

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`[${this.tableName}] findAll failed: ${error.message}`);
    }

    return (data ?? []) as T[];
  }

  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`[${this.tableName}] findById failed: ${error.message}`);
    }

    return data as T;
  }

  async create(data: Partial<T>): Promise<T> {
    const { data: created, error } = await this.client
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`[${this.tableName}] create failed: ${error.message}`);
    }

    return created as T;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const { data: updated, error } = await this.client
      .from(this.tableName)
      .update(data)
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error(
          `[${this.tableName}] update failed: record not found or already deleted`,
        );
      }
      throw new Error(`[${this.tableName}] update failed: ${error.message}`);
    }

    return updated as T;
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await this.client
      .from(this.tableName)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .is("deleted_at", null);

    if (error) {
      throw new Error(
        `[${this.tableName}] softDelete failed: ${error.message}`,
      );
    }
  }
}
