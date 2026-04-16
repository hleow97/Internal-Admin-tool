import { useState } from "react";
import type { Code } from "@/lib/types";

interface CodeFormProps {
  code?: Code;
  onSubmit: (data: {
    code: string;
    description: string;
    is_active?: boolean;
    category?: string;
    updated_at?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function CodeForm({ code, onSubmit, onCancel }: CodeFormProps) {
  const [codeValue, setCodeValue] = useState(code?.code ?? "");
  const [description, setDescription] = useState(code?.description ?? "");
  const [isActive, setIsActive] = useState(code?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const isEdit = !!code;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      if (isEdit) {
        await onSubmit({
          code: codeValue,
          description,
          is_active: isActive,
          category: code!.category.id,
          updated_at: code!.updated_at,
        });
      } else {
        await onSubmit({ code: codeValue, description });
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "fieldErrors" in err) {
        setFieldErrors((err as { fieldErrors: Record<string, string[]> }).fieldErrors);
      } else {
        throw err;
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="code-value" className="block text-sm font-medium text-gray-600 mb-1.5">
          Code
        </label>
        <input
          id="code-value"
          type="text"
          value={codeValue}
          onChange={(e) => setCodeValue(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          autoFocus
        />
        {fieldErrors.code && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.code[0]}</p>
        )}
      </div>
      <div className="mb-4">
        <label htmlFor="code-description" className="block text-sm font-medium text-gray-600 mb-1.5">
          Description
        </label>
        <textarea
          id="code-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
        />
        {fieldErrors.description && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.description[0]}</p>
        )}
      </div>
      {isEdit && (
        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300"
            />
            Active
          </label>
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : isEdit ? "Update Code" : "Add Code"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
