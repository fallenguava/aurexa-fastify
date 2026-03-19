import { CategoryRepository } from "../repositories/CategoryRepository";
import {
  type Category,
  type CreateCategoryDTO,
  type UpdateCategoryDTO,
} from "../entities/Category";

const categoryRepository = new CategoryRepository();

async function assertCategoryOwnership(
  id: string,
  userId: string,
): Promise<Category> {
  const category = await categoryRepository.findByIdAndUserId(id, userId);
  if (!category) {
    throw new Error("Category not found or unauthorized");
  }
  return category;
}

export const CategoryService = {
  async createCategory(
    userId: string,
    dto: CreateCategoryDTO,
  ): Promise<Category> {
    return categoryRepository.create({ ...dto, user_id: userId });
  },

  async getUserCategories(userId: string): Promise<Category[]> {
    return categoryRepository.findByUserId(userId);
  },

  async getCategoryById(id: string, userId: string): Promise<Category> {
    return assertCategoryOwnership(id, userId);
  },

  async updateCategory(
    id: string,
    userId: string,
    dto: UpdateCategoryDTO,
  ): Promise<Category> {
    await assertCategoryOwnership(id, userId);
    return categoryRepository.update(id, dto);
  },

  async deleteCategory(id: string, userId: string): Promise<void> {
    await assertCategoryOwnership(id, userId);
    await categoryRepository.softDelete(id);
  },
};
