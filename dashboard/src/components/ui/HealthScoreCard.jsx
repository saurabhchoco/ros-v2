import { Card, CardContent } from "./Card";

export default function HealthScoreCard({
  score,
  status,
  subtitle,
  healthItems = []
}) {
  return (
    <Card>

      <CardContent className="py-5">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-sm text-slate-500">
              Brand Health
            </p>

            <h2 className="text-4xl font-bold text-slate-900 mt-2">
              {score}/100
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              {subtitle}
            </p>

          </div>

          <div
            className="
              h-12
              w-12
              rounded-full
              bg-emerald-100
              flex
              items-center
              justify-center
            "
          >
            <span className="text-emerald-600 font-bold">
              {status}
            </span>
          </div>

        </div>

      </CardContent>

    </Card>
  );
}