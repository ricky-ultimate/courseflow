import { Badge } from "@/components/ui/badge";
import { ComplaintStatus } from "@/types";

const STATUS_BADGES: Record<ComplaintStatus, string> = {
  [ComplaintStatus.PENDING]: "bg-amber-100 text-amber-800",
  [ComplaintStatus.IN_PROGRESS]: "bg-blue-100 text-blue-800",
  [ComplaintStatus.RESOLVED]: "bg-green-100 text-green-800",
  [ComplaintStatus.CLOSED]: "bg-gray-100 text-gray-800",
};

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <Badge className={STATUS_BADGES[status]}>{status.replace("_", " ")}</Badge>
  );
}

export { STATUS_BADGES };
