import { useState, useEffect, useCallback } from "react";
import { getCategories } from "@/lib/api";
import { config } from "@/lib/config";
import type { Category } from "@/lib/types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showInactive, setShowInactive] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const minDelay = new Promise((r) => setTimeout(r, 500));
    try {
      const params: Record<string, unknown> = {
        page,
        page_size: config.defaultPageSize,
      };
      if (showInactive) {
        params.is_active = false;
      }
      const [data] = await Promise.all([getCategories(params), minDelay]);
      setCategories(data.results);
      setTotalCount(data.count);
      setTotalPages(Math.ceil(data.count / config.defaultPageSize));
    } catch (err) {
      await minDelay;
      setError(err instanceof Error ? err.message : "An error occurred");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [page, showInactive, fetchTrigger]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    setFetchTrigger((prev) => prev + 1);
  }, []);

  return {
    categories,
    loading,
    error,
    page,
    totalPages,
    totalCount,
    showInactive,
    setPage,
    setShowInactive,
    refetch,
  };
}
