import { type FastifyInstance } from "fastify";
import { AuthController } from "../controllers/AuthController";
import { verifyToken } from "../middlewares/auth.guard";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/register", AuthController.register);
  app.post("/login", AuthController.login);
  app.post("/refresh", AuthController.refresh);
  app.post("/logout", { preHandler: verifyToken }, AuthController.logout);
  app.get("/me", { preHandler: verifyToken }, AuthController.me);
}
