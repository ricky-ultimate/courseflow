import { Card } from "@/components/ui/card";

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  iconBg: string;
  sublabel?: string;
}

export function StatCard({
  icon: Icon,
  value,
  label,
  iconBg,
  sublabel,
}: StatCardProps) {
  return (
    <Card className="rounded-xl border border-gray-200 p-5 shadow-sm">
      <div
        className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center mb-3`}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="text-[28px] font-bold leading-tight">{value}</div>
      <p className="text-[13px] text-gray-500 mt-1">{label}</p>
      {sublabel && (
        <p className="text-[11px] text-gray-400 mt-0.5">{sublabel}</p>
      )}
    </Card>
  );
}
