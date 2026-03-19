import { type FastifyRequest, type FastifyReply } from "fastify";
import { TransactionService } from "../services/TransactionService";
import { ResponseUtil } from "../utils/response";
import { type CreateTransactionDTO } from "../entities/Transaction";

interface PocketQuery {
  pocket_id: string;
  page?: string;
  limit?: string;
}

export const TransactionController = {
  /**
   * @summary Create a transaction for the authenticated user.
   *
   * @description
   * Validates pocket/project/category ownership, derives transaction type from
   * category, updates pocket balance, and invalidates monthly snapshot cache.
   *
   * @route POST /api/transactions/
   *
   * @authentication
   * Protected (JWT Bearer)
   * Role required: user // ⚠️ inferred
   *
   * @body {string} pocket_id - Required. Pocket identifier.
   * @body {string} [project_id] - Optional. Project identifier.
   * @body {string} category_id - Required. Category identifier.
   * @body {number} amount - Required. Transaction amount.
   * @body {string} date - Required. Transaction date string.
   * @body {string} title - Required. Transaction title.
   * @body {string} [description] - Optional. Transaction description.
   * @body {CreateTransactionDTO[]} [*] - Optional. Array payload for bulk creation.
   *
   * @returns {201} Created - Transaction created successfully.
   * @returns {201} Created - Transactions created successfully (bulk).
   * @returns {422} Unprocessable Entity - Invalid pocket/project/category relation.
   * @returns {400} Bad Request - Failed to create transaction.
   * @returns {401} Unauthorized - Missing or invalid access token.
   *
   * @sideEffects Updates pocket current_balance and invalidates monthly snapshot cache.
   */
  async create(
    request: FastifyRequest<{
      Body: CreateTransactionDTO | CreateTransactionDTO[];
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      if (Array.isArray(request.body)) {
        const transactions = await TransactionService.createTransactions(
          request.user.id,
          request.body,
        );

        return await reply.status(201).send(
          ResponseUtil.success("Transactions created successfully", {
            count: transactions.length,
            transactions,
          }),
        );
      }

      const transaction = await TransactionService.createTransaction(
        request.user.id,
        request.body,
      );
      return await reply
        .status(201)
        .send(
          ResponseUtil.success("Transaction created successfully", transaction),
        );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create transaction";
      const status =
        message === "Invalid Pocket" ||
        message === "Invalid Project" ||
        message === "Invalid Category"
          ? 422
          : 400;
      return await reply.status(status).send(ResponseUtil.error(message));
    }
  },

  /**
   * @summary Retrieve transactions filtered by pocket.
   *
   * @description
   * Validates pocket ownership and returns paginated transactions for that pocket.
   *
   * @route GET /api/transactions/
   *
   * @authentication
   * Protected (JWT Bearer)
   * Role required: user // ⚠️ inferred
   *
   * @param {string} query.pocket_id - Query parameter: pocket identifier.
   * @param {string} [query.page] - Query parameter: page number (default: 1).
   * @param {string} [query.limit] - Query parameter: items per page (default: 20).
   *
   * @returns {200} Success - Paginated pocket transactions with pagination meta.
   * @returns {422} Unprocessable Entity - Invalid pocket.
   * @returns {400} Bad Request - Failed to retrieve transactions.
   * @returns {401} Unauthorized - Missing or invalid access token.
   */
  async getByPocket(
    request: FastifyRequest<{ Querystring: PocketQuery }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const page = Math.max(
        1,
        Number.parseInt(request.query.page ?? "1", 10) || 1,
      );
      const limit = Math.max(
        1,
        Math.min(100, Number.parseInt(request.query.limit ?? "20", 10) || 20),
      );

      const result = await TransactionService.getPocketTransactions(
        request.user.id,
        request.query.pocket_id,
        page,
        limit,
      );

      return await reply.status(200).send(
        ResponseUtil.paginated(
          "Transactions retrieved successfully",
          result.data,
          {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
          },
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to retrieve transactions";
      const status = message === "Invalid Pocket" ? 422 : 400;
      return await reply.status(status).send(ResponseUtil.error(message));
    }
  },

  /**
   * @summary Retrieve the most recent transactions across all pockets.
   *
   * @description
   * Returns the latest 10 transactions for the authenticated user without pocket filtering.
   *
   * @route GET /api/transactions/recent
   *
   * @authentication
   * Protected (JWT Bearer)
   * Role required: user // ⚠️ inferred
   *
   * @returns {200} Success - Array of recent transactions.
   * @returns {400} Bad Request - Failed to retrieve recent transactions.
   * @returns {401} Unauthorized - Missing or invalid access token.
   */
  async getRecent(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const transactions = await TransactionService.getRecentTransactions(
        request.user.id,
      );
      return await reply
        .status(200)
        .send(
          ResponseUtil.success(
            "Recent transactions retrieved successfully",
            transactions,
          ),
        );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to retrieve recent transactions";
      return await reply.status(400).send(ResponseUtil.error(message));
    }
  },
};
