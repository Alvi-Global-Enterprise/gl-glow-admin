import adminApiClient from '@/lib/adminApiClient';
import { ApiResponse, Category, CreateCategoryPayload, UpdateCategoryPayload } from '@/types/admin';

export const categoryService = {
  /**
   * List all store categories with optional filters
   */
  async listCategories(params?: {
    search?: string;
    is_active?: boolean | string;
    parent_id?: number | null | string;
  }): Promise<ApiResponse<Category[]>> {
    const res = await adminApiClient.get<ApiResponse<Category[]>>('/admin/categories', {
      params,
    });
    return res.data;
  },

  /**
   * Fetch single category details by ID
   */
  async getCategory(id: number): Promise<ApiResponse<Category>> {
    const res = await adminApiClient.get<ApiResponse<Category>>(`/admin/categories/${id}`);
    return res.data;
  },

  /**
   * Create a new category
   */
  async createCategory(payload: CreateCategoryPayload): Promise<ApiResponse<Category>> {
    const res = await adminApiClient.post<ApiResponse<Category>>('/admin/categories', payload);
    return res.data;
  },

  /**
   * Update an existing category
   */
  async updateCategory(id: number, payload: UpdateCategoryPayload): Promise<ApiResponse<Category>> {
    // Backend supports PUT or PATCH
    const res = await adminApiClient.put<ApiResponse<Category>>(`/admin/categories/${id}`, payload);
    return res.data;
  },

  /**
   * Quick toggle active status
   */
  async toggleActive(id: number, is_active: boolean): Promise<ApiResponse<Category>> {
    const res = await adminApiClient.patch<ApiResponse<Category>>(`/admin/categories/${id}`, {
      is_active,
    });
    return res.data;
  },

  /**
   * Delete a category
   */
  async deleteCategory(id: number): Promise<ApiResponse<{ message?: string }>> {
    const res = await adminApiClient.delete<ApiResponse<{ message?: string }>>(`/admin/categories/${id}`);
    return res.data;
  },
};

export default categoryService;
