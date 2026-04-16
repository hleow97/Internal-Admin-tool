export interface Category {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Code {
  id: string;
  category: { id: string; name: string };
  code: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  status: number;
  detail?: string;
  fieldErrors?: Record<string, string[]>;
}

export interface CategoryCreateData {
  name: string;
}

export interface CategoryUpdateData {
  name: string;
  is_active: boolean;
  updated_at: string;
}

export interface CodeCreateData {
  code: string;
  description: string;
}

export interface CodeUpdateData {
  code: string;
  description: string;
  is_active: boolean;
  category: string;
  updated_at: string;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  is_active?: boolean;
}
