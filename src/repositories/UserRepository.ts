import { BaseRepository } from "./BaseRepository";
import { type User } from "../entities/User";

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super("users");
  }

  async findByUsername(username: string): Promise<User | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select("*")
      .eq("username", username)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`[users] findByUsername failed: ${error.message}`);
    }

    return data as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select("*")
      .eq("email", email)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`[users] findByEmail failed: ${error.message}`);
    }

    return data as User;
  }
}
