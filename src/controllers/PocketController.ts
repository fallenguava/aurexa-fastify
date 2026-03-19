import { type FastifyRequest, type FastifyReply } from "fastify";
import { PocketService } from "../services/PocketService";
import { ResponseUtil } from "../utils/response";
import { type CreatePocketDTO, type UpdatePocketDTO } from "../entities/Pocket";

interface PocketParams {
  id: string;
}

export const PocketController = {
  /**
   * @summary Create a new pocket for the authenticated user.
   *
   * @description
   * Creates a user-owned pocket that tracks a running current balance.
   *
   * @route POST /api/pockets/
   *
   * @authentication
   * Protected (JWT Bearer)
   * Role required: user // ⚠️ inferred
   *
   * @body {string} name - Required. Pocket display name.
   * @body {number} [current_balance] - Optional. Initial balance.
   *
   * @returns {201} Created - Pocket created successfully.
   * @returns {400} Bad Request - Failed to create pocket.
   * @returns {401} Unauthorized - Missing or invalid access token.
   */
  async create(
    request: FastifyRequest<{ Body: CreatePocketDTO }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const pocket = await PocketService.createPocket(
        request.user.id,
        request.body,
      );
      return await reply
        .status(201)
        .send(ResponseUtil.success("Pocket created successfully", pocket));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create pocket";
      return await reply.status(400).send(ResponseUtil.error(message));
    }
  },

  /**
   * @summary Retrieve all pockets for the authenticated user.
   *
   * @description
   * Returns every non-deleted pocket owned by the current user.
   *
   * @route GET /api/pockets/
   *
   * @authentication
   * Protected (JWT Bearer)
   * Role required: user // ⚠️ inferred
   *
   * @returns {200} Success - Array of user pockets.
   * @returns {400} Bad Request - Failed to retrieve pockets.
   * @returns {401} Unauthorized - Missing or invalid access token.
   */
  async getAll(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const pockets = await PocketService.getUserPockets(request.user.id);
      return await reply
        .status(200)
        .send(ResponseUtil.success("Pockets retrieved successfully", pockets));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to retrieve pockets";
      return await reply.status(400).send(ResponseUtil.error(message));
    }
  },

  /**
   * @summary Retrieve one pocket by ID.
   *
   * @description
   * Returns a single pocket if it exists and belongs to the authenticated user.
   *
   * @route GET /api/pockets/:id
   *
   * @authentication
   * Protected (JWT Bearer)
   * Role required: user // ⚠️ inferred
   *
   * @param {string} params.id - Path parameter: pocket identifier.
   *
   * @returns {200} Success - Pocket details.
   * @returns {404} Not Found - Pocket not found or unauthorized.
   * @returns {400} Bad Request - Failed to retrieve pocket.
   * @returns {401} Unauthorized - Missing or invalid access token.
   */
  async getById(
    request: FastifyRequest<{ Params: PocketParams }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const pocket = await PocketService.getPocketById(
        request.params.id,
        request.user.id,
      );
      return await reply
        .status(200)
        .send(ResponseUtil.success("Pocket retrieved successfully", pocket));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to retrieve pocket";
      const status = message === "Pocket not found or unauthorized" ? 404 : 400;
      return await reply.status(status).send(ResponseUtil.error(message));
    }
  },

  /**
   * @summary Update a pocket by ID.
   *
   * @description
   * Updates a pocket owned by the current user, currently supporting pocket name updates.
   *
   * @route PUT /api/pockets/:id
   *
   * @authentication
   * Protected (JWT Bearer)
   * Role required: user // ⚠️ inferred
   *
   * @param {string} params.id - Path parameter: pocket identifier.
   * @body {string} name - Required. New pocket name.
   *
   * @returns {200} Success - Pocket updated successfully.
   * @returns {404} Not Found - Pocket not found or unauthorized.
   * @returns {400} Bad Request - Failed to update pocket.
   * @returns {401} Unauthorized - Missing or invalid access token.
   */
  async update(
    request: FastifyRequest<{ Params: PocketParams; Body: UpdatePocketDTO }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const pocket = await PocketService.updatePocket(
        request.params.id,
        request.user.id,
        request.body,
      );
      return await reply
        .status(200)
        .send(ResponseUtil.success("Pocket updated successfully", pocket));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update pocket";
      const status = message === "Pocket not found or unauthorized" ? 404 : 400;
      return await reply.status(status).send(ResponseUtil.error(message));
    }
  },

  /**
   * @summary Soft-delete a pocket by ID.
   *
   * @description
   * Marks the pocket as deleted when it belongs to the authenticated user.
   *
   * @route DELETE /api/pockets/:id
   *
   * @authentication
   * Protected (JWT Bearer)
   * Role required: user // ⚠️ inferred
   *
   * @param {string} params.id - Path parameter: pocket identifier.
   *
   * @returns {200} Success - Pocket deleted successfully.
   * @returns {404} Not Found - Pocket not found or unauthorized.
   * @returns {400} Bad Request - Failed to delete pocket.
   * @returns {401} Unauthorized - Missing or invalid access token.
   */
  async delete(
    request: FastifyRequest<{ Params: PocketParams }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      await PocketService.deletePocket(request.params.id, request.user.id);
      return await reply
        .status(200)
        .send(ResponseUtil.success("Pocket deleted successfully"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete pocket";
      const status = message === "Pocket not found or unauthorized" ? 404 : 400;
      return await reply.status(status).send(ResponseUtil.error(message));
    }
  },
};
