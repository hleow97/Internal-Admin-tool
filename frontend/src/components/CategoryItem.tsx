import { useState } from "react";
import type { Category } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import CategoryForm from "./CategoryForm";

interface CategoryItemProps {
  category: Category;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, data: { name: string; is_active: boolean; updated_at: string }) => Promise<void>;
}

export default function CategoryItem({
  category,
  isSelected,
  onSelect,
  onUpdate,
}: CategoryItemProps) {
  const [editing, setEditing] = useState(false);

  const handleUpdate = async (data: { name: string; is_active?: boolean; updated_at?: string }) => {
    await onUpdate(category.id, {
      name: data.name,
      is_active: data.is_active!,
      updated_at: data.updated_at!,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <CategoryForm
        category={category}
        onSubmit={handleUpdate}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div
      onClick={() => onSelect(category.id)}
      className={`flex items-center justify-between p-3 cursor-pointer rounded hover:bg-gray-50 ${
        isSelected ? "bg-blue-50 border border-blue-200" : "border border-transparent"
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect(category.id);
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{category.name}</span>
        <StatusBadge isActive={category.is_active} />
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        className="text-xs text-blue-600 hover:text-blue-800"
      >
        Edit
      </button>
    </div>
  );
}
