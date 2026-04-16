import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  width?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export function FilterSelect({
  value,
  onValueChange,
  placeholder,
  width = "w-[140px]",
  disabled,
  children,
}: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={`border-0 shadow-none bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 focus:ring-0 ${width}`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}
