import { BaseRepository } from "./BaseRepository";
import { type Transaction } from "../entities/Transaction";

export class TransactionRepository extends BaseRepository<Transaction> {
  constructor() {
    super("transactions");
  }

  async createMany(data: Partial<Transaction>[]): Promise<Transaction[]> {
    if (data.length === 0) {
      return [];
    }

    const { data: created, error } = await this.client
      .from(this.tableName)
      .insert(data)
      .select("*");

    if (error) {
      throw new Error(`[transactions] createMany failed: ${error.message}`);
    }

    return (created ?? []) as Transaction[];
  }

  async findByPocketId(
    pocketId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Transaction[]; total: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await this.client
      .from(this.tableName)
      .select("*", { count: "exact" })
      .eq("pocket_id", pocketId)
      .is("deleted_at", null)
      .order("date", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`[transactions] findByPocketId failed: ${error.message}`);
    }

    return {
      data: (data ?? []) as Transaction[],
      total: count ?? 0,
    };
  }

  async findAfterDate(
    pocketId: string,
    afterDate: string,
  ): Promise<Transaction[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select("*")
      .eq("pocket_id", pocketId)
      .gt("date", afterDate)
      .is("deleted_at", null);

    if (error) {
      throw new Error(`[transactions] findAfterDate failed: ${error.message}`);
    }

    return (data ?? []) as Transaction[];
  }

  async findByDateRange(
    pocketId: string,
    startDate: string,
    endDate: string,
  ): Promise<Transaction[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select("*")
      .eq("pocket_id", pocketId)
      .gte("date", startDate)
      .lte("date", endDate)
      .is("deleted_at", null)
      .order("date", { ascending: true });

    if (error) {
      throw new Error(
        `[transactions] findByDateRange failed: ${error.message}`,
      );
    }

    return (data ?? []) as Transaction[];
  }

  async findRecentByUserId(
    userId: string,
    limit: number = 5,
  ): Promise<Transaction[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("date", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(
        `[transactions] findRecentByUserId failed: ${error.message}`,
      );
    }

    return (data ?? []) as Transaction[];
  }
}
