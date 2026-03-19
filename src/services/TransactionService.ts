import { TransactionRepository } from "../repositories/TransactionRepository";
import { PocketRepository } from "../repositories/PocketRepository";
import { ProjectRepository } from "../repositories/ProjectRepository";
import { CategoryRepository } from "../repositories/CategoryRepository";
import { SnapshotRepository } from "../repositories/SnapshotRepository";
import {
  type Transaction,
  type CreateTransactionDTO,
} from "../entities/Transaction";
import { processInChunks } from "../utils/bulk";

const transactionRepository = new TransactionRepository();
const pocketRepository = new PocketRepository();
const projectRepository = new ProjectRepository();
const categoryRepository = new CategoryRepository();
const snapshotRepository = new SnapshotRepository();
const TRANSACTION_BULK_CHUNK_SIZE = 500;

export const TransactionService = {
  async createTransaction(
    userId: string,
    dto: CreateTransactionDTO,
  ): Promise<Transaction> {
    const [transaction] = await this.createTransactions(userId, [dto]);
    return transaction;
  },

  async createTransactions(
    userId: string,
    dtos: CreateTransactionDTO[],
  ): Promise<Transaction[]> {
    if (dtos.length === 0) {
      throw new Error("Transaction payload cannot be empty");
    }

    const pocketIds = [...new Set(dtos.map((dto) => dto.pocket_id))];
    const categoryIds = [...new Set(dtos.map((dto) => dto.category_id))];
    const projectIds = [
      ...new Set(
        dtos
          .map((dto) => dto.project_id)
          .filter((projectId): projectId is string => Boolean(projectId)),
      ),
    ];

    const [pockets, categories, projects] = await Promise.all([
      pocketRepository.findUserPocketsByIds(userId, pocketIds),
      categoryRepository.findByIdsAndUserId(userId, categoryIds),
      projectIds.length > 0
        ? projectRepository.findByIds(projectIds)
        : Promise.resolve([]),
    ]);

    const pocketById = new Map(pockets.map((pocket) => [pocket.id, pocket]));
    const categoryById = new Map(
      categories.map((category) => [category.id, category]),
    );
    const projectById = new Map(
      projects.map((project) => [project.id, project]),
    );

    for (const pocketId of pocketIds) {
      if (!pocketById.has(pocketId)) {
        throw new Error("Invalid Pocket");
      }
    }

    for (const categoryId of categoryIds) {
      if (!categoryById.has(categoryId)) {
        throw new Error("Invalid Category");
      }
    }

    for (const dto of dtos) {
      if (!dto.project_id) {
        continue;
      }

      const project = projectById.get(dto.project_id);
      if (!project || project.pocket_id !== dto.pocket_id) {
        throw new Error("Invalid Project");
      }
    }

    const balanceDeltaByPocket = new Map<string, number>();
    const snapshotKeys = new Set<string>();

    const insertPayload = dtos.map((dto) => {
      const category = categoryById.get(dto.category_id);
      if (!category) {
        throw new Error("Invalid Category");
      }

      const amount = Math.abs(dto.amount);
      const type = category.type;
      const currentDelta = balanceDeltaByPocket.get(dto.pocket_id) ?? 0;
      const nextDelta =
        type === "INCOMING" ? currentDelta + amount : currentDelta - amount;

      balanceDeltaByPocket.set(dto.pocket_id, nextDelta);

      const dateObj = new Date(dto.date);
      if (!Number.isNaN(dateObj.getTime())) {
        snapshotKeys.add(
          `${dto.pocket_id}:${dateObj.getFullYear()}:${dateObj.getMonth() + 1}`,
        );
      }

      return {
        user_id: userId,
        pocket_id: dto.pocket_id,
        project_id: dto.project_id ?? null,
        category_id: dto.category_id,
        type,
        amount,
        date: dto.date,
        title: dto.title,
        description: dto.description ?? null,
      };
    });

    const transactions = await processInChunks(
      insertPayload,
      TRANSACTION_BULK_CHUNK_SIZE,
      async (chunk) => transactionRepository.createMany([...chunk]),
    );

    await Promise.all(
      [...balanceDeltaByPocket.entries()].map(([pocketId, delta]) => {
        const pocket = pocketById.get(pocketId);
        if (!pocket) {
          throw new Error("Invalid Pocket");
        }

        return pocketRepository.update(pocketId, {
          current_balance: pocket.current_balance + delta,
        });
      }),
    );

    await Promise.all(
      [...snapshotKeys].map((snapshotKey) => {
        const [pocketId, year, month] = snapshotKey.split(":");
        return snapshotRepository.invalidateSnapshot(
          pocketId,
          Number(year),
          Number(month),
        );
      }),
    );

    return transactions;
  },

  async getPocketTransactions(
    userId: string,
    pocketId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Transaction[]; total: number }> {
    const pocket = await pocketRepository.findUserPocketById(pocketId, userId);
    if (!pocket) {
      throw new Error("Invalid Pocket");
    }
    return transactionRepository.findByPocketId(pocketId, page, limit);
  },

  async getRecentTransactions(userId: string): Promise<Transaction[]> {
    return transactionRepository.findRecentByUserId(userId, 10);
  },
};
