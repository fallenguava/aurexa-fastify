import { BaseRepository } from "./BaseRepository";
import { type Project } from "../entities/Project";

export class ProjectRepository extends BaseRepository<Project> {
  constructor() {
    super("projects");
  }

  async findByPocketId(pocketId: string): Promise<Project[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select("*")
      .eq("pocket_id", pocketId)
      .is("deleted_at", null);

    if (error) {
      throw new Error(`[projects] findByPocketId failed: ${error.message}`);
    }

    return (data ?? []) as Project[];
  }

  async findByIdAndPocketId(
    id: string,
    pocketId: string,
  ): Promise<Project | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .eq("pocket_id", pocketId)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(
        `[projects] findByIdAndPocketId failed: ${error.message}`,
      );
    }

    return data as Project;
  }

  async findByIds(projectIds: string[]): Promise<Project[]> {
    if (projectIds.length === 0) {
      return [];
    }

    const { data, error } = await this.client
      .from(this.tableName)
      .select("*")
      .in("id", projectIds)
      .is("deleted_at", null);

    if (error) {
      throw new Error(`[projects] findByIds failed: ${error.message}`);
    }

    return (data ?? []) as Project[];
  }
}
