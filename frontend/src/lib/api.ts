import { config } from "./config";
import type {
  Category,
  Code,
  PaginatedResponse,
  ApiError,
  CategoryCreateData,
  CategoryUpdateData,
  CodeCreateData,
  CodeUpdateData,
  PaginationParams,
} from "./types";

class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

class ValidationError extends Error {
  fieldErrors: Record<string, string[]>;
  constructor(fieldErrors: Record<string, string[]>) {
    super("Validation failed");
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

class NetworkError extends Error {
  constructor() {
    super("Connection failed. Please check your network.");
    this.name = "NetworkError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${config.apiBaseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
  } catch {
    throw new NetworkError();
  }

  if (response.status === 409) {
    const body = await response.json();
    throw new ConflictError(
      body.detail ||
        "This record was modified by another user. Please refresh and try again."
    );
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (body.detail) {
      const error: ApiError = { status: response.status, detail: body.detail };
      throw error;
    }
    const error: ApiError = {
      status: response.status,
      fieldErrors: body,
    };
    throw error;
  }

  return response.json();
}

function buildQuery(params: PaginationParams): string {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));
  if (params.is_active === false) query.set("is_active", "false");
  const str = query.toString();
  return str ? `?${str}` : "";
}

export function getCategories(
  params: PaginationParams = {}
): Promise<PaginatedResponse<Category>> {
  return request(`/categories/${buildQuery(params)}`);
}

export function createCategory(
  data: CategoryCreateData
): Promise<Category> {
  return request("/categories/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCategory(
  id: string,
  data: CategoryUpdateData
): Promise<Category> {
  return request(`/categories/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function getCodes(
  categoryId: string,
  params: PaginationParams = {}
): Promise<PaginatedResponse<Code>> {
  return request(`/categories/${categoryId}/codes/${buildQuery(params)}`);
}

export function createCode(
  categoryId: string,
  data: CodeCreateData
): Promise<Code> {
  return request(`/categories/${categoryId}/codes/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCode(
  id: string,
  data: CodeUpdateData
): Promise<Code> {
  return request(`/codes/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export { ConflictError, ValidationError, NetworkError };
