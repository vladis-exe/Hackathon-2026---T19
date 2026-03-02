import { cn } from "@/lib/utils";

type BadgeVariant = "online" | "offline" | "active" | "inactive";

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  online: "bg-success/15 text-success border-success/30",
  offline: "bg-destructive/15 text-destructive border-destructive/30",
  active: "bg-primary/15 text-primary border-primary/30",
  inactive: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ variant, label }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        variantStyles[variant]
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", {
          "bg-success": variant === "online",
          "bg-destructive": variant === "offline",
          "bg-primary": variant === "active",
          "bg-muted-foreground": variant === "inactive",
        })}
      />
      {label}
    </span>
  );
}
