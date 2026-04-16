import { renderHook, act, waitFor } from "@testing-library/react";
import { useCodes } from "@/hooks/useCodes";
import * as api from "@/lib/api";
import type { PaginatedResponse, Code } from "@/lib/types";

jest.mock("@/lib/api");

const mockedApi = api as jest.Mocked<typeof api>;

const mockResponse: PaginatedResponse<Code> = {
  count: 20,
  next: "http://localhost:8000/api/categories/cat-1/codes/?page=2",
  previous: null,
  results: [
    { id: "code-1", category: { id: "cat-1", name: "Travel" }, code: "TRV-001", description: "Domestic travel", is_active: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
    { id: "code-2", category: { id: "cat-1", name: "Travel" }, code: "TRV-002", description: "International travel", is_active: true, created_at: "2026-01-02T00:00:00Z", updated_at: "2026-01-02T00:00:00Z" },
  ],
};

describe("useCodes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  it("returns empty state when categoryId is null", () => {
    const { result } = renderHook(() => useCodes(null));
    expect(result.current.codes).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(mockedApi.getCodes).not.toHaveBeenCalled();
  });

  it("fetches codes when categoryId is provided", async () => {
    mockedApi.getCodes.mockResolvedValue(mockResponse);
    const { result } = renderHook(() => useCodes("cat-1"));

    expect(result.current.loading).toBe(true);
    await act(async () => { jest.advanceTimersByTime(600); });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.codes).toEqual(mockResponse.results);
    expect(result.current.totalCount).toBe(20);
    expect(mockedApi.getCodes).toHaveBeenCalledWith("cat-1", { page: 1, page_size: 6 });
  });

  it("resets page to 1 when categoryId changes", async () => {
    mockedApi.getCodes.mockResolvedValue(mockResponse);
    const { result, rerender } = renderHook(
      ({ id }: { id: string | null }) => useCodes(id),
      { initialProps: { id: "cat-1" } }
    );
    await act(async () => { jest.advanceTimersByTime(600); });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.setPage(2));
    rerender({ id: "cat-2" });
    await act(async () => { jest.advanceTimersByTime(600); });

    await waitFor(() => {
      expect(mockedApi.getCodes).toHaveBeenCalledWith("cat-2", { page: 1, page_size: 6 });
    });
  });

  it("surfaces error on fetch failure", async () => {
    mockedApi.getCodes.mockRejectedValue(new Error("Server error"));
    const { result } = renderHook(() => useCodes("cat-1"));

    await act(async () => { jest.advanceTimersByTime(600); });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Server error");
  });

  it("re-fetches with is_active=false when showInactive toggled", async () => {
    mockedApi.getCodes.mockResolvedValue(mockResponse);
    const { result } = renderHook(() => useCodes("cat-1"));
    await act(async () => { jest.advanceTimersByTime(600); });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.setShowInactive(true));
    await act(async () => { jest.advanceTimersByTime(600); });

    await waitFor(() => {
      expect(mockedApi.getCodes).toHaveBeenCalledWith("cat-1", { page: 1, page_size: 6, is_active: false });
    });
  });
});
