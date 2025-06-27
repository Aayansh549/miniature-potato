import { cn } from "@/lib/utils";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

export default function AlertCard({
  message,
  className,
  icon = (
    <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 text-destructive" />
  ),
}: {
  message: string;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-destructive/10 border-destructive/50 text-destructive flex items-center gap-3 p-3 shadow-sm",
        className,
      )}
      aria-live="polite"
    >
      {icon}
      <div className="font-medium">{message}</div>
    </div>
  );
}
