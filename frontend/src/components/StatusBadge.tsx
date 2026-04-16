interface StatusBadgeProps {
  isActive: boolean;
}

export default function StatusBadge({ isActive }: StatusBadgeProps) {
  return isActive ? (
    <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-md bg-red-50 text-red-500 border border-red-200">
      Inactive
    </span>
  );
}
