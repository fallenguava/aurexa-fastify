import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: string; type: "REG" | "ADM" };
    user: { id: string; type: "REG" | "ADM" };
  }
}
