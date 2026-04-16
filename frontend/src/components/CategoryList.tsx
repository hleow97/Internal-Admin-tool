import { useState } from "react";
import type { Category } from "@/lib/types";
import Modal from "./Modal";
import CategoryForm from "./CategoryForm";
import StatusBadge from "./StatusBadge";
import Spinner from "./Spinner";
import ErrorAlert from "./ErrorAlert";
import Pagination from "./Pagination";

interface CategoryListProps {
  categories: Category[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  totalCount?: number;
  showInactive: boolean;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  onSetPage: (page: number) => void;
  onSetShowInactive: (show: boolean) => void;
  onAddCategory: (data: { name: string }) => Promise<void>;
  onUpdateCategory: (id: string, data: { name: string; is_active: boolean; updated_at: string }) => Promise<void>;
  onDismissError: () => void;
}

export default function CategoryList({
  categories,
  loading,
  error,
  page,
  totalPages,
  totalCount,
  showInactive,
  selectedCategoryId,
  onSelectCategory,
  onSetPage,
  onSetShowInactive,
  onAddCategory,
  onUpdateCategory,
  onDismissError,
}: CategoryListProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = async (data: { name: string }) => {
    await onAddCategory(data);
    setShowAddModal(false);
  };

  const handleUpdate = async (id: string, data: { name: string; is_active?: boolean; updated_at?: string }) => {
    await onUpdateCategory(id, {
      name: data.name,
      is_active: data.is_active!,
      updated_at: data.updated_at!,
    });
    setEditingId(null);
  };

  const editingCategory = editingId ? categories.find((c) => c.id === editingId) : undefined;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">All Categories</h2>
        <div className="flex items-center gap-3">
          <select
            value={showInactive ? "inactive" : "active"}
            onChange={(e) => onSetShowInactive(e.target.value === "inactive")}
            className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M2.22%204.47a.75.75%200%20011.06%200L6%207.19l2.72-2.72a.75.75%200%20011.06%201.06l-3.25%203.25a.75.75%200%2001-1.06%200L2.22%205.53a.75.75%200%20010-1.06z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={onDismissError} />}

      <Modal title="Add Category" open={showAddModal} onClose={() => setShowAddModal(false)}>
        <CategoryForm
          onSubmit={handleAdd}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      <Modal title="Edit Category" open={!!editingId} onClose={() => setEditingId(null)}>
        {editingCategory && (
          <CategoryForm
            category={editingCategory}
            onSubmit={(data) => handleUpdate(editingId!, data)}
            onCancel={() => setEditingId(null)}
          />
        )}
      </Modal>

      <div className="flex-1 min-h-[360px]">
      {loading ? (
        <Spinner />
      ) : categories.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-gray-400">No categories found</p>
        </div>
      ) : (
        <div className="overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-sm font-normal text-gray-400">Category Name</th>
                <th className="text-center px-5 py-3 text-sm font-normal text-gray-400 w-28">Status</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`border-b border-gray-50 cursor-pointer transition-colors ${
                    cat.id === selectedCategoryId
                      ? "bg-blue-50/50"
                      : "hover:bg-gray-50/50"
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSelectCategory(cat.id);
                  }}
                >
                  <td className="px-5 py-4 text-sm font-medium text-gray-900">{cat.name}</td>
                  <td className="px-5 py-4 text-center">
                    <StatusBadge isActive={cat.is_active} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(cat.id);
                      }}
                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>

      <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={onSetPage} />
    </div>
  );
}
