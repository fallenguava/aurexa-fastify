import { type FastifyRequest, type FastifyReply } from "fastify";
import { ResponseUtil } from "../utils/response";

export async function verifyToken(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    return await reply
      .status(401)
      .send(ResponseUtil.error("Unauthorized: Invalid or expired token"));
  }
}
