import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        default:
          "bg-slate-100 text-slate-700",

        success:
          "bg-emerald-100 text-emerald-700",

        warning:
          "bg-amber-100 text-amber-700",

        danger:
          "bg-red-100 text-red-700",

        info:
          "bg-indigo-100 text-indigo-700"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export function Badge({
  variant,
  className,
  children
}) {
  return (
    <span
      className={cn(
        badgeVariants({ variant }),
        className
      )}
    >
      {children}
    </span>
  );
}

// Button.displayName = 'Button';
export default Badge;