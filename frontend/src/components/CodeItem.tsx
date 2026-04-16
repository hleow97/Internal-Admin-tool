import { useState } from "react";
import type { Code } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import CodeForm from "./CodeForm";

interface CodeItemProps {
  code: Code;
  onUpdate: (
    id: string,
    data: {
      code: string;
      description: string;
      is_active: boolean;
      category: string;
      updated_at: string;
    }
  ) => Promise<void>;
}

export default function CodeItem({ code, onUpdate }: CodeItemProps) {
  const [editing, setEditing] = useState(false);

  const handleUpdate = async (data: {
    code: string;
    description: string;
    is_active?: boolean;
    category?: string;
    updated_at?: string;
  }) => {
    await onUpdate(code.id, {
      code: data.code,
      description: data.description,
      is_active: data.is_active!,
      category: data.category!,
      updated_at: data.updated_at!,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <CodeForm
        code={code}
        onSubmit={handleUpdate}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex items-center justify-between p-3 border border-gray-100 rounded">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-medium">{code.code}</span>
          <StatusBadge isActive={code.is_active} />
        </div>
        {code.description && (
          <p className="text-xs text-gray-500 mt-0.5">{code.description}</p>
        )}
      </div>
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-blue-600 hover:text-blue-800"
      >
        Edit
      </button>
    </div>
  );
}
