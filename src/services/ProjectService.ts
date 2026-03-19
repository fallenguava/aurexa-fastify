import { ProjectRepository } from "../repositories/ProjectRepository";
import { PocketRepository } from "../repositories/PocketRepository";
import {
  type Project,
  type CreateProjectDTO,
  type UpdateProjectDTO,
} from "../entities/Project";

const projectRepository = new ProjectRepository();
const pocketRepository = new PocketRepository();

async function assertPocketOwnership(
  pocketId: string,
  userId: string,
): Promise<void> {
  const pocket = await pocketRepository.findUserPocketById(pocketId, userId);
  if (!pocket) {
    throw new Error("Unauthorized or Pocket not found");
  }
}

async function assertProjectExists(
  id: string,
  pocketId: string,
): Promise<Project> {
  const project = await projectRepository.findByIdAndPocketId(id, pocketId);
  if (!project) {
    throw new Error("Project not found");
  }
  return project;
}

export const ProjectService = {
  async createProject(userId: string, dto: CreateProjectDTO): Promise<Project> {
    await assertPocketOwnership(dto.pocket_id, userId);
    return projectRepository.create({
      name: dto.name,
      pocket_id: dto.pocket_id,
    });
  },

  async getPocketProjects(
    userId: string,
    pocketId: string,
  ): Promise<Project[]> {
    await assertPocketOwnership(pocketId, userId);
    return projectRepository.findByPocketId(pocketId);
  },

  async getProjectById(
    id: string,
    pocketId: string,
    userId: string,
  ): Promise<Project> {
    await assertPocketOwnership(pocketId, userId);
    return assertProjectExists(id, pocketId);
  },

  async updateProject(
    id: string,
    pocketId: string,
    userId: string,
    dto: UpdateProjectDTO,
  ): Promise<Project> {
    await assertPocketOwnership(pocketId, userId);
    await assertProjectExists(id, pocketId);
    return projectRepository.update(id, { name: dto.name });
  },

  async deleteProject(
    id: string,
    pocketId: string,
    userId: string,
  ): Promise<void> {
    await assertPocketOwnership(pocketId, userId);
    await assertProjectExists(id, pocketId);
    await projectRepository.softDelete(id);
  },
};
