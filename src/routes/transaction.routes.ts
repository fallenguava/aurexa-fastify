import { type FastifyInstance } from "fastify";
import { TransactionController } from "../controllers/TransactionController";
import { verifyToken } from "../middlewares/auth.guard";

export async function transactionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", verifyToken);

  app.post("/", TransactionController.create);
  app.get("/", TransactionController.getByPocket);
  app.get("/recent", TransactionController.getRecent);
}
