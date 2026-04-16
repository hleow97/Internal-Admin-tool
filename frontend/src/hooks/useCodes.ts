import { useState, useEffect, useCallback } from "react";
import { getCodes } from "@/lib/api";
import { config } from "@/lib/config";
import type { Code } from "@/lib/types";

export function useCodes(categoryId: string | null) {
  const [codes, setCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showInactive, setShowInactive] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  useEffect(() => {
    setPage(1);
    setShowInactive(false);
  }, [categoryId]);

  const fetchData = useCallback(async () => {
    if (!categoryId) {
      setCodes([]);
      setLoading(false);
      setError(null);
      setTotalPages(0);
      setTotalCount(0);
      return;
    }
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
      const [data] = await Promise.all([getCodes(categoryId, params), minDelay]);
      setCodes(data.results);
      setTotalCount(data.count);
      setTotalPages(Math.ceil(data.count / config.defaultPageSize));
    } catch (err) {
      await minDelay;
      setError(err instanceof Error ? err.message : "An error occurred");
      setCodes([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, page, showInactive, fetchTrigger]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    setFetchTrigger((prev) => prev + 1);
  }, []);

  return {
    codes,
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
