import { cn } from "../../lib/utils";

export function AppShellNav({
  items,
  activePath,
  onNavigate
}) {
  return (
    <nav className="flex items-center gap-2">

      {items.map((item) => (
        <button
          key={item.path}
          onClick={() => onNavigate(item.path)}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
            activePath === item.path
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          {item.icon && <item.icon className="h-4 w-4" />}
          {item.label}
        </button>
      ))}

    </nav>
  );
}