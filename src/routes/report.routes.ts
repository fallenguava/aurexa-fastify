import { type FastifyInstance } from "fastify";
import { ReportController } from "../controllers/ReportController";
import { verifyToken } from "../middlewares/auth.guard";

export async function reportRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", verifyToken);

  app.get("/generate", ReportController.generate);
}
