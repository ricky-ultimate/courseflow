"use client";

import { ComplaintStatus } from "@/types";

const TABS: { value: "all" | ComplaintStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: ComplaintStatus.PENDING, label: "Pending" },
  { value: ComplaintStatus.IN_PROGRESS, label: "In Progress" },
  { value: ComplaintStatus.RESOLVED, label: "Resolved" },
  { value: ComplaintStatus.CLOSED, label: "Closed" },
];

interface ComplaintsManagerTabsProps {
  activeTab: "all" | ComplaintStatus;
  pendingCount: number | null;
  onTabChange: (tab: "all" | ComplaintStatus) => void;
}

export function ComplaintsManagerTabs({
  activeTab,
  pendingCount,
  onTabChange,
}: ComplaintsManagerTabsProps) {
  return (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 !mt-4">
      <div className="flex gap-1 border-b border-gray-200 min-w-max pb-px">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => onTabChange(t.value)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              activeTab === t.value
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            {t.value === ComplaintStatus.PENDING &&
              pendingCount !== null &&
              pendingCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  {pendingCount}
                </span>
              )}
          </button>
        ))}
      </div>
    </div>
  );
}
