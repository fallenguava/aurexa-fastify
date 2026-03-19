import Fastify, { type FastifyInstance } from "fastify";
import { ResponseUtil } from "./utils/response";
import { registerAppModules } from "./app.register";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("Missing environment variable: JWT_SECRET");
  }

  await registerAppModules(app, jwtSecret);

  app.get("/ping", async (_request, reply) => {
    return reply.status(200).send(ResponseUtil.success("pong"));
  });

  return app;
}
