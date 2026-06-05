export function SectionHeader({
  title,
  description,
  actions
}) {
  return (
    <div className="flex items-center justify-between mb-6">

      <div>

        <h2 className="text-2xl font-bold text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="text-slate-500 mt-1">
            {description}
          </p>
        )}

      </div>

      {actions && (
        <div>
          {actions}
        </div>
      )}

    </div>
  );
}

// Button.displayName = 'Button';
export default SectionHeader;