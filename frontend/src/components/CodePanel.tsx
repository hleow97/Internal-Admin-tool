import { useState } from "react";
import type { Code } from "@/lib/types";
import Modal from "./Modal";
import CodeForm from "./CodeForm";
import StatusBadge from "./StatusBadge";
import Spinner from "./Spinner";
import ErrorAlert from "./ErrorAlert";
import Pagination from "./Pagination";

interface CodePanelProps {
  categoryId: string | null;
  categoryName: string | null;
  categoryActive?: boolean;
  codes: Code[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  totalCount?: number;
  showInactive: boolean;
  onSetPage: (page: number) => void;
  onSetShowInactive: (show: boolean) => void;
  onAddCode: (data: { code: string; description: string }) => Promise<void>;
  onUpdateCode: (
    id: string,
    data: {
      code: string;
      description: string;
      is_active: boolean;
      category: string;
      updated_at: string;
    }
  ) => Promise<void>;
  onDismissError: () => void;
}

export default function CodePanel({
  categoryId,
  categoryName,
  categoryActive = true,
  codes,
  loading,
  error,
  page,
  totalPages,
  totalCount,
  showInactive,
  onSetPage,
  onSetShowInactive,
  onAddCode,
  onUpdateCode,
  onDismissError,
}: CodePanelProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = async (data: { code: string; description: string }) => {
    await onAddCode(data);
    setShowAddModal(false);
  };

  const handleUpdate = async (
    id: string,
    data: {
      code: string;
      description: string;
      is_active?: boolean;
      category?: string;
      updated_at?: string;
    }
  ) => {
    await onUpdateCode(id, {
      code: data.code,
      description: data.description,
      is_active: data.is_active!,
      category: data.category!,
      updated_at: data.updated_at!,
    });
    setEditingId(null);
  };

  const editingCode = editingId ? codes.find((c) => c.id === editingId) : undefined;

  if (!categoryId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-400">Select a category to view its codes</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Expense Codes</h2>
          <p className="text-sm text-gray-400 mt-0.5">{categoryName}</p>
        </div>
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
            disabled={!categoryActive}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              categoryActive
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            + Add
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={onDismissError} />}

      <Modal title="Add Code" open={showAddModal} onClose={() => setShowAddModal(false)}>
        <CodeForm
          onSubmit={handleAdd}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      <Modal title="Edit Code" open={!!editingId} onClose={() => setEditingId(null)}>
        {editingCode && (
          <CodeForm
            code={editingCode}
            onSubmit={(data) => handleUpdate(editingId!, data)}
            onCancel={() => setEditingId(null)}
          />
        )}
      </Modal>

      <div className="flex-1 min-h-[360px]">
      {loading ? (
        <Spinner />
      ) : codes.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-gray-400">No codes in this category</p>
        </div>
      ) : (
        <div className="overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-sm font-normal text-gray-400 w-28">Code</th>
                <th className="text-left px-5 py-3 text-sm font-normal text-gray-400">Description</th>
                <th className="text-center px-5 py-3 text-sm font-normal text-gray-400 w-28">Status</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <tr
                  key={code.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-5 py-4 font-mono text-sm font-medium text-gray-900 whitespace-nowrap">{code.code}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {code.description || <span className="text-gray-300">&mdash;</span>}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <StatusBadge isActive={code.is_active} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setEditingId(code.id)}
                      disabled={!categoryActive}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        categoryActive
                          ? "text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100"
                          : "text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed"
                      }`}
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
