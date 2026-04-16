"use client";

import { useState, useCallback, useMemo } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useCodes } from "@/hooks/useCodes";
import { createCategory, updateCategory, createCode, updateCode, ConflictError } from "@/lib/api";
import type { Category } from "@/lib/types";
import CategoryList from "@/components/CategoryList";
import CodePanel from "@/components/CodePanel";

export default function Home() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const {
    categories,
    loading: categoriesLoading,
    error: categoriesFetchError,
    page: categoryPage,
    totalPages: categoryTotalPages,
    totalCount: categoryTotalCount,
    showInactive: categoryShowInactive,
    setPage: setCategoryPage,
    setShowInactive: setCategoryShowInactiveRaw,
    refetch: refetchCategories,
  } = useCategories();

  const {
    codes,
    loading: codesLoading,
    error: codesFetchError,
    page: codePage,
    totalPages: codeTotalPages,
    totalCount: codeTotalCount,
    showInactive: codeShowInactive,
    setPage: setCodePage,
    setShowInactive: setCodeShowInactive,
    refetch: refetchCodes,
  } = useCodes(selectedCategoryId);

  const selectedCategory = useMemo(
    () => categories.find((c: Category) => c.id === selectedCategoryId),
    [categories, selectedCategoryId]
  );

  const handleSetCategoryShowInactive = useCallback(
    (show: boolean) => {
      setCategoryShowInactiveRaw(show);
      setSelectedCategoryId(null);
    },
    [setCategoryShowInactiveRaw]
  );

  const handleSetCategoryPage = useCallback(
    (page: number) => {
      setCategoryPage(page);
      setSelectedCategoryId(null);
    },
    [setCategoryPage]
  );

  const dismissCategoryError = useCallback(() => setCategoryError(null), []);
  const dismissCodeError = useCallback(() => setCodeError(null), []);

  const handleAddCategory = useCallback(
    async (data: { name: string }) => {
      try {
        setCategoryError(null);
        await createCategory(data);
        refetchCategories();
      } catch (err) {
        if (err && typeof err === "object" && "fieldErrors" in err) {
          throw err;
        }
        setCategoryError(
          err instanceof Error ? err.message : "Failed to add category"
        );
      }
    },
    [refetchCategories]
  );

  const handleUpdateCategory = useCallback(
    async (
      id: string,
      data: { name: string; is_active: boolean; updated_at: string }
    ) => {
      try {
        setCategoryError(null);
        await updateCategory(id, data);
        refetchCategories();
      } catch (err) {
        if (err instanceof ConflictError) {
          setCategoryError(err.message);
          return;
        }
        if (err && typeof err === "object" && "fieldErrors" in err) {
          throw err;
        }
        if (err && typeof err === "object" && "detail" in err) {
          setCategoryError((err as { detail: string }).detail);
          return;
        }
        setCategoryError(
          err instanceof Error ? err.message : "Failed to update category"
        );
      }
    },
    [refetchCategories]
  );

  const handleAddCode = useCallback(
    async (data: { code: string; description: string }) => {
      if (!selectedCategoryId) return;
      try {
        setCodeError(null);
        await createCode(selectedCategoryId, data);
        refetchCodes();
      } catch (err) {
        if (err && typeof err === "object" && "fieldErrors" in err) {
          throw err;
        }
        setCodeError(
          err instanceof Error ? err.message : "Failed to add code"
        );
      }
    },
    [selectedCategoryId, refetchCodes]
  );

  const handleUpdateCode = useCallback(
    async (
      id: string,
      data: {
        code: string;
        description: string;
        is_active: boolean;
        category: string;
        updated_at: string;
      }
    ) => {
      try {
        setCodeError(null);
        await updateCode(id, data);
        refetchCodes();
      } catch (err) {
        if (err instanceof ConflictError) {
          setCodeError(err.message);
          return;
        }
        if (err && typeof err === "object" && "fieldErrors" in err) {
          throw err;
        }
        setCodeError(
          err instanceof Error ? err.message : "Failed to update code"
        );
      }
    },
    [refetchCodes]
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Expense Admin</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 min-h-[500px]">
          <CategoryList
            categories={categories}
            loading={categoriesLoading}
            error={categoryError || categoriesFetchError}
            page={categoryPage}
            totalPages={categoryTotalPages}
            totalCount={categoryTotalCount}
            showInactive={categoryShowInactive}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            onSetPage={handleSetCategoryPage}
            onSetShowInactive={handleSetCategoryShowInactive}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDismissError={dismissCategoryError}
          />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 min-h-[500px]">
          <CodePanel
            categoryId={selectedCategoryId}
            categoryName={selectedCategory?.name ?? null}
            categoryActive={selectedCategory?.is_active ?? true}
            codes={codes}
            loading={codesLoading}
            error={codeError || codesFetchError}
            page={codePage}
            totalPages={codeTotalPages}
            totalCount={codeTotalCount}
            showInactive={codeShowInactive}
            onSetPage={setCodePage}
            onSetShowInactive={setCodeShowInactive}
            onAddCode={handleAddCode}
            onUpdateCode={handleUpdateCode}
            onDismissError={dismissCodeError}
          />
        </div>
      </div>
    </div>
  );
}
