import { PocketRepository } from "../repositories/PocketRepository";
import {
  type Pocket,
  type CreatePocketDTO,
  type UpdatePocketDTO,
} from "../entities/Pocket";

const pocketRepository = new PocketRepository();

export const PocketService = {
  async createPocket(userId: string, dto: CreatePocketDTO): Promise<Pocket> {
    return await pocketRepository.create({ ...dto, user_id: userId });
  },

  async getUserPockets(userId: string): Promise<Pocket[]> {
    return pocketRepository.findByUserId(userId);
  },

  async getPocketById(id: string, userId: string): Promise<Pocket> {
    const pocket = await pocketRepository.findUserPocketById(id, userId);
    if (!pocket) {
      throw new Error("Pocket not found or unauthorized");
    }
    return pocket;
  },

  async updatePocket(
    id: string,
    userId: string,
    dto: UpdatePocketDTO,
  ): Promise<Pocket> {
    await PocketService.getPocketById(id, userId);
    return pocketRepository.update(id, { name: dto.name });
  },

  async deletePocket(id: string, userId: string): Promise<void> {
    await PocketService.getPocketById(id, userId);
    await pocketRepository.softDelete(id);
  },
};
