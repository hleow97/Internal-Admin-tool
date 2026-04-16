import { renderHook, act, waitFor } from "@testing-library/react";
import { useCategories } from "@/hooks/useCategories";
import * as api from "@/lib/api";
import type { PaginatedResponse, Category } from "@/lib/types";

jest.mock("@/lib/api");

const mockedApi = api as jest.Mocked<typeof api>;

const mockResponse: PaginatedResponse<Category> = {
  count: 12,
  next: "http://localhost:8000/api/categories/?page=2",
  previous: null,
  results: [
    { id: "cat-1", name: "Travel", is_active: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
    { id: "cat-2", name: "Office Supplies", is_active: true, created_at: "2026-01-02T00:00:00Z", updated_at: "2026-01-02T00:00:00Z" },
  ],
};

describe("useCategories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  it("fetches categories on mount and exposes data", async () => {
    mockedApi.getCategories.mockResolvedValue(mockResponse);
    const { result } = renderHook(() => useCategories());

    expect(result.current.loading).toBe(true);
    await act(async () => { jest.advanceTimersByTime(600); });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.categories).toEqual(mockResponse.results);
    expect(result.current.totalPages).toBe(2);
    expect(result.current.totalCount).toBe(12);
    expect(result.current.error).toBeNull();
    expect(mockedApi.getCategories).toHaveBeenCalledWith({ page: 1, page_size: 6 });
  });

  it("surfaces error message on fetch failure", async () => {
    mockedApi.getCategories.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useCategories());

    await act(async () => { jest.advanceTimersByTime(600); });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Network error");
    expect(result.current.categories).toEqual([]);
  });

  it("re-fetches with is_active=false when showInactive toggled", async () => {
    mockedApi.getCategories.mockResolvedValue(mockResponse);
    const { result } = renderHook(() => useCategories());
    await act(async () => { jest.advanceTimersByTime(600); });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.setShowInactive(true));
    await act(async () => { jest.advanceTimersByTime(600); });

    await waitFor(() => {
      expect(mockedApi.getCategories).toHaveBeenCalledWith({ page: 1, page_size: 6, is_active: false });
    });
  });

  it("re-fetches with correct page number", async () => {
    mockedApi.getCategories.mockResolvedValue(mockResponse);
    const { result } = renderHook(() => useCategories());
    await act(async () => { jest.advanceTimersByTime(600); });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.setPage(2));
    await act(async () => { jest.advanceTimersByTime(600); });

    await waitFor(() => {
      expect(mockedApi.getCategories).toHaveBeenCalledWith({ page: 2, page_size: 6 });
    });
  });

  it("refetch triggers a new API call", async () => {
    mockedApi.getCategories.mockResolvedValue(mockResponse);
    const { result } = renderHook(() => useCategories());
    await act(async () => { jest.advanceTimersByTime(600); });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedApi.getCategories).toHaveBeenCalledTimes(1);
    await act(() => result.current.refetch());
    await act(async () => { jest.advanceTimersByTime(600); });
    await waitFor(() => expect(mockedApi.getCategories).toHaveBeenCalledTimes(2));
  });
});
