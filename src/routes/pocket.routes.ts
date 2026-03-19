import { type FastifyInstance } from "fastify";
import { PocketController } from "../controllers/PocketController";
import { verifyToken } from "../middlewares/auth.guard";

export async function pocketRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", verifyToken);

  app.post("/", PocketController.create);
  app.get("/", PocketController.getAll);
  app.get("/:id", PocketController.getById);
  app.put("/:id", PocketController.update);
  app.delete("/:id", PocketController.delete);
}
