import { type FastifyRequest, type FastifyReply } from "fastify";
import { AuthService } from "../services/AuthService";
import { ResponseUtil } from "../utils/response";
import { type CreateUserDTO } from "../entities/User";

interface LoginBody {
  username: string;
  password: string;
}

export const AuthController = {
  /**
   * @summary Register a new user account.
   *
   * @description
   * Creates a regular user account, hashes the password, and marks the account
   * as pending verification according to the auth service policy.
   *
   * @route POST /api/auth/register
   *
   * @authentication
   * Public
   * Role required: none
   *
   * @body {string} username - Required. Unique username.
   * @body {string} email - Required. User email address.
   * @body {string} password - Required. Plain-text password to hash.
   *
   * @returns {201} Created - User registered successfully with safe user payload.
   * @returns {400} Bad Request - Registration failed (duplicate or invalid input).
   */
  async register(
    request: FastifyRequest<{ Body: CreateUserDTO }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const user = await AuthService.register(request.body);
      return await reply
        .status(201)
        .send(ResponseUtil.success("User registered successfully", user));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      return await reply.status(400).send(ResponseUtil.error(message));
    }
  },

  /**
   * @summary Authenticate user credentials and issue JWT tokens.
   *
   * @description
   * Validates username and password, enforces verification status, returns an
   * access token, and stores a refresh token in an HttpOnly cookie.
   *
   * @route POST /api/auth/login
   *
   * @authentication
   * Public
   * Role required: none
   *
   * @body {string} username - Required. User login username.
   * @body {string} password - Required. User login password.
   *
   * @returns {200} Success - Returns { user, accessToken } and sets refresh cookie.
   * @returns {401} Unauthorized - Invalid credentials.
   * @returns {403} Forbidden - Account pending admin verification.
   * @returns {400} Bad Request - Login failed for other reasons.
   *
   * @sideEffects Sets/overwrites refreshToken HttpOnly cookie.
   */
  async login(
    request: FastifyRequest<{ Body: LoginBody }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { username, password } = request.body;
      const user = await AuthService.login(username, password);

      const accessToken = request.server.jwt.sign(
        { id: user.id, type: user.type },
        { expiresIn: "59m" },
      );

      const refreshToken = request.server.jwt.sign(
        { id: user.id, type: user.type },
        { expiresIn: "7d" },
      );

      reply.setCookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      return await reply
        .status(200)
        .send(ResponseUtil.success("Login successful", { user, accessToken }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";

      const status =
        message === "Invalid credentials"
          ? 401
          : message === "Account pending admin verification"
            ? 403
            : 400;

      return await reply.status(status).send(ResponseUtil.error(message));
    }
  },

  /**
   * @summary Refresh access token using refresh-token cookie.
   *
   * @description
   * Verifies refresh token from cookie, validates the underlying user account,
   * issues a new short-lived access token, and rotates the refresh token cookie.
   *
   * @route POST /api/auth/refresh
   *
   * @authentication
   * Public
   * Role required: none
   *
   * @returns {200} Success - Returns { accessToken } and refreshes cookie.
   * @returns {401} Unauthorized - Missing/invalid refresh token or unauthorized user.
   *
   * @sideEffects Sets/overwrites refreshToken HttpOnly cookie.
   */
  async refresh(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const refreshToken = request.cookies.refreshToken;
      if (!refreshToken) {
        return await reply
          .status(401)
          .send(ResponseUtil.error("No refresh token provided"));
      }

      let payload: { id: string; type: "REG" | "ADM" };
      try {
        payload = request.server.jwt.verify<{
          id: string;
          type: "REG" | "ADM";
        }>(refreshToken);
      } catch {
        return await reply
          .status(401)
          .send(ResponseUtil.error("Invalid or expired refresh token"));
      }

      let user;
      try {
        user = await AuthService.getVerifiedUserById(payload.id);
      } catch {
        return await reply.status(401).send(ResponseUtil.error("Unauthorized"));
      }

      const accessToken = request.server.jwt.sign(
        { id: user.id, type: user.type },
        { expiresIn: "15m" },
      );

      const newRefreshToken = request.server.jwt.sign(
        { id: user.id, type: user.type },
        { expiresIn: "7d" },
      );

      reply.setCookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      return await reply
        .status(200)
        .send(ResponseUtil.success("Token refreshed", { accessToken }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Token refresh failed";
      return await reply.status(401).send(ResponseUtil.error(message));
    }
  },

  /**
   * @summary Get the authenticated user's profile details.
   *
   * @description
   * Returns the current user's persisted profile information without sensitive
   * password hash fields.
   *
   * @route GET /api/auth/me
   *
   * @authentication
   * Protected (JWT Bearer)
   * Role required: user // ⚠️ inferred
   *
   * @returns {200} Success - User profile details.
   * @returns {401} Unauthorized - Missing or invalid access token.
   * @returns {404} Not Found - User record no longer exists.
   * @returns {400} Bad Request - Failed to retrieve user details.
   */
  /**
   * @summary Log out the current user.
   *
   * @description
   * Clears the HttpOnly refresh-token cookie, invalidating the user's session on
   * this device. The short-lived access token remains technically valid until it
   * expires (≤59 min), so clients must discard it locally on logout.
   *
   * @route POST /api/auth/logout
   *
   * @authentication
   * Protected (JWT Bearer)
   * Role required: none
   *
   * @returns {200} Success - Logged out successfully.
   * @returns {401} Unauthorized - Missing or invalid access token.
   *
   * @sideEffects Clears the refreshToken HttpOnly cookie.
   */
  async logout(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    reply.clearCookie("refreshToken", { path: "/" });
    return await reply
      .status(200)
      .send(ResponseUtil.success("Logged out successfully", null));
  },

  async me(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const safeUser = await AuthService.getProfileById(request.user.id);
      return await reply
        .status(200)
        .send(
          ResponseUtil.success("User details retrieved successfully", safeUser),
        );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to retrieve user details";
      const status = message === "User not found" ? 404 : 400;
      return await reply.status(status).send(ResponseUtil.error(message));
    }
  },
};
