import { cn } from "@/lib/utils";

interface ColSpec {
  className?: string;
}

interface TableSkeletonProps {
  rows?: number;
  cols: ColSpec[];
  className?: string;
}

export function TableSkeleton({ rows = 7, cols, className }: TableSkeletonProps) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-t">
                {cols.map((col, j) => (
                  <td key={j} className="p-3">
                    <div className={cn("h-6 bg-gray-200 animate-pulse rounded", col.className ?? "w-full")} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
