import { Card, CardContent } from "./Card";
import { cn } from "../../lib/utils";

export function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  accent = "default"
}) {

  const accents = {
    success: {
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    warning: {
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    danger: {
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },
    info: {
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    commercial: {
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    default: {
      iconBg: "bg-slate-100",
      iconColor: "text-slate-500",
    },
  };
  return (

    <Card>
      <CardContent>

        <div className="flex items-start justify-between">

          <div>

            <p className="text-sm text-slate-500">
              {label}
            </p>

            <h3 className="text-3xl font-bold text-slate-900 mt-2">
              {value}
            </h3>

            {subtitle && (
              <p className="text-xs text-slate-500 mt-2">
                {subtitle}
              </p>
            )}

          </div>

          {Icon && (
            <div
              className={cn(
                "p-2 rounded-xl",
                accents[accent].iconBg
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  accents[accent].iconColor
                )}
              />
            </div>
          )}

        </div>

      </CardContent>
    </Card>
  );
}

// Button.displayName = 'Button';
export default MetricCard;