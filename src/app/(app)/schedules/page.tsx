import { Suspense } from "react";
import SchedulePageContent from "./SchedulePageContent";

export default function SchedulePage() {
  return (
    <Suspense fallback={<SchedulePageSkeleton />}>
      <SchedulePageContent />
    </Suspense>
  );
}

function SchedulePageSkeleton() {
  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-10">
      <div className="animate-pulse">
        <div className="h-10 bg-slate-200 rounded-lg w-1/4 mb-4" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    </div>
  );
}
