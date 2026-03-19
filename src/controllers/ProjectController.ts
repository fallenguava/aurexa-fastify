import { type FastifyRequest, type FastifyReply } from "fastify";
import { ProjectService } from "../services/ProjectService";
import { ResponseUtil } from "../utils/response";
import {
  type CreateProjectDTO,
  type UpdateProjectDTO,
} from "../entities/Project";

interface ProjectParams {
  id: string;
}

interface PocketQuery {
  pocket_id: string;
}

export const ProjectController = {
  /**
   * @summary Create a project inside a pocket.
   *
   * @description
   * Creates a project scoped to a specific pocket after validating pocket ownership.
   *
   * @route POST /api/projects/
   *
   * @authentication
   * Protected (JWT Bearer)
   * Role required: user // ⚠️ inferred
   *
   * @body {string} name - Required. Project name.
   * @body {string} pocket_id - Required. Parent pocket identifier.
   *
   * @returns {201} Created - Project created successfully.
   * @returns {403} Forbidden - Unauthorized or pocket not found.
   * @returns {400} Bad Request - Failed to create project.
   * @returns {401} Unauthorized - Missing or invalid access token.
   */
  async create(
    request: FastifyRequest<{ Body: CreateProjectDTO }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const project = await ProjectService.createProject(
        request.user.id,
        request.body,
      );
      return await reply
        .status(201)
        .send(ResponseUtil.success("Project created successfully", project));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create project";
      const status = message === "Unauthorized or Pocket not found" ? 403 : 400;
      return await reply.status(status).send(ResponseUtil.error(message));
    }
  },

  /**
   * @summary Retrieve all projects for a pocket.
   *
   * @description
   * Returns all non-deleted projects for the provided pocket when owned by current user.
   *
   * @route GET /api/projects/
   *
   * @authentication
   * Protected (JWT Bearer)
   * Role required: user // ⚠️ inferred
   *
   * @param {string} query.pocket_id - Query parameter: pocket identifier.
   *
   * @returns {200} Success - Array of projects.
   * @returns {403} Forbidden - Unauthorized or pocket not found.
   * @returns {400} Bad Request - Failed to retrieve projects.
   * @returns {401} Unauthorized - Missing or invalid access token.
   */
  async getAll(
    request: FastifyRequest<{ Querystring: PocketQuery }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const projects = await ProjectService.getPocketProjects(
        request.user.id,
        request.query.pocket_id,
      );
      return await reply
        .status(200)
        .send(
          ResponseUtil.success("Projects retrieved successfully", projects),
        );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to retrieve projects";
      const status = message === "Unauthorized or Pocket not found" ? 403 : 400;
      return await reply.status(status).send(ResponseUtil.error(message));
    }
  },

  /**
   * @summary Retrieve a project by ID.
   *
   * @description
   * Returns one project by ID after validating pocket ownership and project existence.
   *
   * @route GET /api/projects/:id
   *
   * @authentication
   * Protected (JWT Bearer)
   * Role required: user // ⚠️ inferred
   *
   * @param {string} params.id - Path parameter: project identifier.
   * @param {string} query.pocket_id - Query parameter: pocket identifier.
   *
   * @returns {200} Success - Project details.
   * @returns {404} Not Found - Project not found.
   * @returns {403} Forbidden - Unauthorized or pocket not found.
   * @returns {400} Bad Request - Failed to retrieve project.
   * @returns {401} Unauthorized - Missing or invalid access token.
   */
  async getById(
    request: FastifyRequest<{
      Params: ProjectParams;
      Querystring: PocketQuery;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const project = await ProjectService.getProjectById(
        request.params.id,
        request.query.pocket_id,
        request.user.id,
      );
      return await reply
        .status(200)
        .send(ResponseUtil.success("Project retrieved successfully", project));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to retrieve project";
      const status =
        message === "Project not found"
          ? 404
          : message === "Unauthorized or Pocket not found"
            ? 403
            : 400;
      return await reply.status(status).send(ResponseUtil.error(message));
    }
  },

  /**
   * @summary Update a project by ID.
   *
   * @description
   * Updates a project name after validating ownership of parent pocket and project.
   *
   * @route PUT /api/projects/:id
   *
   * @authentication
   * Protected (JWT Bearer)
   * Role required: user // ⚠️ inferred
   *
   * @param {string} params.id - Path parameter: project identifier.
   * @param {string} query.pocket_id - Query parameter: pocket identifier.
   * @body {string} name - Required. New project name.
   *
   * @returns {200} Success - Project updated successfully.
   * @returns {404} Not Found - Project not found.
   * @returns {403} Forbidden - Unauthorized or pocket not found.
   * @returns {400} Bad Request - Failed to update project.
   * @returns {401} Unauthorized - Missing or invalid access token.
   */
  async update(
    request: FastifyRequest<{
      Params: ProjectParams;
      Querystring: PocketQuery;
      Body: UpdateProjectDTO;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const project = await ProjectService.updateProject(
        request.params.id,
        request.query.pocket_id,
        request.user.id,
        request.body,
      );
      return await reply
        .status(200)
        .send(ResponseUtil.success("Project updated successfully", project));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update project";
      const status =
        message === "Project not found"
          ? 404
          : message === "Unauthorized or Pocket not found"
            ? 403
            : 400;
      return await reply.status(status).send(ResponseUtil.error(message));
    }
  },

  /**
   * @summary Soft-delete a project by ID.
   *
   * @description
   * Marks a project as deleted after validating ownership of the parent pocket.
   *
   * @route DELETE /api/projects/:id
   *
   * @authentication
   * Protected (JWT Bearer)
   * Role required: user // ⚠️ inferred
   *
   * @param {string} params.id - Path parameter: project identifier.
   * @param {string} query.pocket_id - Query parameter: pocket identifier.
   *
   * @returns {200} Success - Project deleted successfully.
   * @returns {404} Not Found - Project not found.
   * @returns {403} Forbidden - Unauthorized or pocket not found.
   * @returns {400} Bad Request - Failed to delete project.
   * @returns {401} Unauthorized - Missing or invalid access token.
   */
  async delete(
    request: FastifyRequest<{
      Params: ProjectParams;
      Querystring: PocketQuery;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      await ProjectService.deleteProject(
        request.params.id,
        request.query.pocket_id,
        request.user.id,
      );
      return await reply
        .status(200)
        .send(ResponseUtil.success("Project deleted successfully"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete project";
      const status =
        message === "Project not found"
          ? 404
          : message === "Unauthorized or Pocket not found"
            ? 403
            : 400;
      return await reply.status(status).send(ResponseUtil.error(message));
    }
  },
};
