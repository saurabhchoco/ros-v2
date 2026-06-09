import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl font-medium transition-all",
  {
    variants: {
      variant: {
        primary:
          "bg-indigo-600 text-white hover:bg-indigo-700",
        secondary:
          "bg-slate-100 text-slate-700 hover:bg-slate-200",
        danger:
          "bg-red-600 text-white hover:bg-red-700",
        ghost:
          "hover:bg-slate-100 text-slate-700"
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4",
        lg: "h-11 px-6"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export function Button({
  className,
  variant,
  size,
  ...props
}) {
  return (
    <button
      className={cn(
        buttonVariants({
          variant,
          size
        }),
        className
      )}
      {...props}
    />
  );
}
Button.displayName = 'Button';
export default Button;