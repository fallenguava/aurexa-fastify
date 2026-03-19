import { UserRepository } from "../repositories/UserRepository";
import { HashUtil } from "../utils/hash";
import { type CreateUserDTO, type User } from "../entities/User";

export type SafeUser = Omit<User, "password_hash">;
export type UserProfile = Omit<User, "password_hash">;

const userRepository = new UserRepository();

export const AuthService = {
  async register(dto: CreateUserDTO): Promise<SafeUser> {
    const [existingByUsername, existingByEmail] = await Promise.all([
      userRepository.findByUsername(dto.username),
      userRepository.findByEmail(dto.email),
    ]);

    if (existingByUsername ?? existingByEmail) {
      throw new Error("Username or email already in use");
    }

    const password_hash = await HashUtil.hashPassword(dto.password);

    const user = await userRepository.create({
      username: dto.username,
      email: dto.email,
      password_hash,
      type: "REG",
      verified: false,
    });

    const { password_hash: _ph, ...safeUser } = user;
    return safeUser as SafeUser;
  },

  async login(username: string, password: string): Promise<SafeUser> {
    const user = await userRepository.findByUsername(username);

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isMatch = await HashUtil.comparePassword(
      password,
      user.password_hash,
    );

    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    if (!user.verified) {
      throw new Error("Account pending admin verification");
    }

    const { password_hash: _ph, ...safeUser } = user;
    return safeUser as SafeUser;
  },

  async getVerifiedUserById(id: string): Promise<SafeUser> {
    const user = await userRepository.findById(id);
    if (!user || !user.verified) {
      throw new Error("Unauthorized");
    }

    const { password_hash: _ph, ...safeUser } = user;
    return safeUser as SafeUser;
  },

  async getProfileById(id: string): Promise<UserProfile> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error("User not found");
    }

    const { password_hash: _ph, ...profile } = user;
    return profile as UserProfile;
  },
};
