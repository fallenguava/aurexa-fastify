import { type FastifyInstance } from "fastify";
import { CategoryController } from "../controllers/CategoryController";
import { verifyToken } from "../middlewares/auth.guard";

export async function categoryRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", verifyToken);

  app.post("/", CategoryController.create);
  app.get("/", CategoryController.getAll);
  app.get("/:id", CategoryController.getById);
  app.put("/:id", CategoryController.update);
  app.delete("/:id", CategoryController.delete);
}
