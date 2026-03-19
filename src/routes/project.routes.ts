import { type FastifyInstance } from "fastify";
import { ProjectController } from "../controllers/ProjectController";
import { verifyToken } from "../middlewares/auth.guard";

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", verifyToken);

  app.post("/", ProjectController.create);
  app.get("/", ProjectController.getAll);
  app.get("/:id", ProjectController.getById);
  app.put("/:id", ProjectController.update);
  app.delete("/:id", ProjectController.delete);
}
