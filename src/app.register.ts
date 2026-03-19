import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import cookie from "@fastify/cookie";
import type { FastifyInstance } from "fastify";
import { authRoutes } from "./routes/auth.routes";
import { pocketRoutes } from "./routes/pocket.routes";
import { projectRoutes } from "./routes/project.routes";
import { categoryRoutes } from "./routes/category.routes";
import { transactionRoutes } from "./routes/transaction.routes";
import { reportRoutes } from "./routes/report.routes";

export async function registerAppPlugins(
  app: FastifyInstance,
  jwtSecret: string,
): Promise<void> {
  await app.register(cors, {
    origin: ["http://localhost:5173", "http://192.168.1.25:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  await app.register(jwt, { secret: jwtSecret });
  await app.register(cookie);
}

export async function registerAppRoutes(app: FastifyInstance): Promise<void> {
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(pocketRoutes, { prefix: "/api/pockets" });
  await app.register(projectRoutes, { prefix: "/api/projects" });
  await app.register(categoryRoutes, { prefix: "/api/categories" });
  await app.register(transactionRoutes, { prefix: "/api/transactions" });
  await app.register(reportRoutes, { prefix: "/api/reports" });
}

export async function registerAppModules(
  app: FastifyInstance,
  jwtSecret: string,
): Promise<void> {
  await registerAppPlugins(app, jwtSecret);
  await registerAppRoutes(app);
}
