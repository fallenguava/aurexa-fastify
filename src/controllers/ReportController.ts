import { type FastifyRequest, type FastifyReply } from "fastify";
import { ReportService } from "../services/ReportService";
import { ResponseUtil } from "../utils/response";

interface ReportQuery {
  pocket_id: string;
  month: string;
  year: string;
}

export const ReportController = {
  /**
   * @summary Generate a monthly report and return a signed URL.
   *
   * @description
   * Validates month/year query parameters, generates or reuses computed monthly
   * financial data, renders a PDF report, uploads it to storage, and returns a
   * temporary signed download URL.
   *
   * @route GET /api/reports/generate
   *
   * @authentication
   * Protected (JWT Bearer)
   * Role required: user // ⚠️ inferred
   *
   * @param {string} query.pocket_id - Query parameter: pocket identifier.
   * @param {string} query.month - Query parameter: month number (1-12).
   * @param {string} query.year - Query parameter: year value (2000-2100).
   *
   * @returns {200} Success - Returns { url } for generated report.
   * @returns {400} Bad Request - Missing or invalid query parameters.
   * @returns {401} Unauthorized - Missing or invalid access token.
   * @returns {422} Unprocessable Entity - Invalid pocket.
   * @returns {500} Internal Server Error - Report generation/storage failure.
   *
   * @sideEffects Generates PDF, writes file to storage, and upserts monthly snapshot cache.
   */
  async generate(
    request: FastifyRequest<{ Querystring: ReportQuery }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { pocket_id, month: monthStr, year: yearStr } = request.query;

    if (!pocket_id || !monthStr || !yearStr) {
      return await reply
        .status(400)
        .send(ResponseUtil.error("pocket_id, month, and year are required"));
    }

    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    if (
      isNaN(month) ||
      isNaN(year) ||
      month < 1 ||
      month > 12 ||
      year < 2000 ||
      year > 2100
    ) {
      return await reply
        .status(400)
        .send(ResponseUtil.error("Invalid month or year value"));
    }

    try {
      const url = await ReportService.generateMonthlyReport(
        request.user.id,
        pocket_id,
        month,
        year,
      );
      return await reply
        .status(200)
        .send(ResponseUtil.success("Report generated successfully", { url }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate report";
      const status = message === "Invalid Pocket" ? 422 : 500;
      return await reply.status(status).send(ResponseUtil.error(message));
    }
  },
};
