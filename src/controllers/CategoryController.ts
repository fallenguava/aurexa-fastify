import { type FastifyRequest, type FastifyReply } from "fastify";
import { CategoryService } from "../services/CategoryService";
import { ResponseUtil } from "../utils/response";
import {
  type CreateCategoryDTO,
  type UpdateCategoryDTO,
} from "../entities/Category";

interface CategoryParams {
  id: string;
}

export const CategoryController = {
  /**
   * @summary Create a category for the authenticated user.
   *
   * @description
   * Creates a user-owned category used to classify transactions as INCOMING
   * or OUTCOMING.
   *
   * @route POST /api/categories/
   *
   * @authentication
   * Protected (JWT Bearer)
   * Role required: user // ⚠️ inferred
   *
   * @body {string} name - Required. Category display name.
   * @body {"INCOMING"|"OUTCOMING"} type - Required. Transaction direction.
   *
   * @returns {201} Created - Category created successfully.
   * @returns {400} Bad Request - Failed to create category.
   * @returns {401} Unauthorized - Missing or invalid access token.
   */
  async create(
    request: FastifyRequest<{ Body: CreateCategoryDTO }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const category = await CategoryService.createCategory(
        request.user.id,
        request.body,
      );
      return await reply
        .status(201)
        .send(ResponseUtil.success("Category created successfully", category));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create category";
      return await reply.status(400).send(ResponseUtil.error(message));
    }
  },

  /**
   * @summary Retrieve all categories for the authenticated user.
   *
   * @description
   * Returns every non-deleted category owned by the current user.
   *
   * @route GET /api/categories/
   *
   * @authentication
   * Protected (JWT Bearer)
   * Role required: user // ⚠️ inferred
   *
   * @returns {200} Success - Array of user categories.
   * @returns {400} Bad Request - Failed to retrieve categories.
   * @returns {401} Unauthorized - Missing or invalid access token.
   */
  async getAll(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const categories = await CategoryService.getUserCategories(
        request.user.id,
      );
      return await reply
        .status(200)
        .send(
          ResponseUtil.success("Categories retrieved successfully", categories),
        );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to retrieve categories";
      return await reply.status(400).send(ResponseUtil.error(message));
    }
  },

  /**
   * @summary Retrieve one category by ID.
   *
   * @description
   * Returns a single category if it exists and belongs to the authenticated user.
   *
   * @route GET /api/categories/:id
   *
   * @authentication
   * Protected (JWT Bearer)
   * Role required: user // ⚠️ inferred
   *
   * @param {string} params.id - Path parameter: category identifier.
   *
   * @returns {200} Success - Category details.
   * @returns {404} Not Found - Category not found or unauthorized.
   * @returns {400} Bad Request - Failed to retrieve category.
   * @returns {401} Unauthorized - Missing or invalid access token.
   */
  async getById(
    request: FastifyRequest<{ Params: CategoryParams }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const category = await CategoryService.getCategoryById(
        request.params.id,
        request.user.id,
      );
      return await reply
        .status(200)
        .send(
          ResponseUtil.success("Category retrieved successfully", category),
        );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to retrieve category";
      const status =
        message === "Category not found or unauthorized" ? 404 : 400;
      return await reply.status(status).send(ResponseUtil.error(message));
    }
  },

  /**
   * @summary Update an existing category.
   *
   * @description
   * Updates category name and/or type when the category belongs to the current user.
   *
   * @route PUT /api/categories/:id
   *
   * @authentication
   * Protected (JWT Bearer)
   * Role required: user // ⚠️ inferred
   *
   * @param {string} params.id - Path parameter: category identifier.
   * @body {string} [name] - Optional. New category name.
   * @body {"INCOMING"|"OUTCOMING"} [type] - Optional. New transaction direction.
   *
   * @returns {200} Success - Category updated successfully.
   * @returns {404} Not Found - Category not found or unauthorized.
   * @returns {400} Bad Request - Failed to update category.
   * @returns {401} Unauthorized - Missing or invalid access token.
   */
  async update(
    request: FastifyRequest<{
      Params: CategoryParams;
      Body: UpdateCategoryDTO;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const category = await CategoryService.updateCategory(
        request.params.id,
        request.user.id,
        request.body,
      );
      return await reply
        .status(200)
        .send(ResponseUtil.success("Category updated successfully", category));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update category";
      const status =
        message === "Category not found or unauthorized" ? 404 : 400;
      return await reply.status(status).send(ResponseUtil.error(message));
    }
  },

  /**
   * @summary Soft-delete a category.
   *
   * @description
   * Marks the category as deleted when it belongs to the authenticated user.
   *
   * @route DELETE /api/categories/:id
   *
   * @authentication
   * Protected (JWT Bearer)
   * Role required: user // ⚠️ inferred
   *
   * @param {string} params.id - Path parameter: category identifier.
   *
   * @returns {200} Success - Category deleted successfully.
   * @returns {404} Not Found - Category not found or unauthorized.
   * @returns {400} Bad Request - Failed to delete category.
   * @returns {401} Unauthorized - Missing or invalid access token.
   */
  async delete(
    request: FastifyRequest<{ Params: CategoryParams }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      await CategoryService.deleteCategory(request.params.id, request.user.id);
      return await reply
        .status(200)
        .send(ResponseUtil.success("Category deleted successfully"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete category";
      const status =
        message === "Category not found or unauthorized" ? 404 : 400;
      return await reply.status(status).send(ResponseUtil.error(message));
    }
  },
};
