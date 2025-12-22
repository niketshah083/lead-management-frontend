export interface IPagination {
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface IApiResponse<T> {
  statusCode: number;
  data: T;
  message?: string;
  totalCount?: number;
  pagination?: IPagination;
}

export interface IPaginatedRequest {
  page?: number;
  limit?: number;
}
