export interface ApiResponse<TData = unknown, TMeta = unknown> {
  success: boolean;
  message: string;
  data: TData | null;
  meta: TMeta | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const ResponseUtil = {
  success<TData = unknown>(
    message: string,
    data: TData | null = null,
  ): ApiResponse<TData> {
    return { success: true, message, data, meta: null };
  },

  error(message: string, data: unknown = null): ApiResponse<unknown> {
    return { success: false, message, data, meta: null };
  },

  paginated<TData = unknown>(
    message: string,
    data: TData[],
    meta: PaginationMeta,
  ): ApiResponse<TData[], PaginationMeta> {
    return { success: true, message, data, meta };
  },
};
