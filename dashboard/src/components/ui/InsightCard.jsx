import { Card, CardContent } from "./Card";

export default function InsightCard({
  title,
  value,
  icon: Icon
}) {
  return (
    <Card>

      <CardContent>

        <div className="flex items-start gap-3">

          {Icon && (
            <Icon className="h-5 w-5 text-slate-500 mt-1" />
          )}

          <div>

            <p className="text-sm text-slate-500">
              {title}
            </p>

            <p className="font-semibold text-slate-900 mt-1">
              {value}
            </p>

          </div>

        </div>

      </CardContent>

    </Card>
  );
}