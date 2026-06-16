export default function AttentionCenter({ items }) {
  if (!items || items.length === 0) return null;
  const getColor = (type) => {
    if (type === 'red') return 'border-l-4 border-l-red-500 bg-red-50 text-red-800';
    if (type === 'amber') return 'border-l-4 border-l-amber-500 bg-amber-50 text-amber-800';
    return 'border-l-4 border-l-blue-500 bg-blue-50 text-blue-800';
  };
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className={`rounded-r-xl p-3 text-sm ${getColor(item.type)}`}>
          <div className="font-medium">{item.title}</div>
          <div className="text-xs opacity-90 mt-0.5">{item.description}</div>
          {item.link && <a href={item.link} className="text-xs underline mt-1 inline-block">View →</a>}
        </div>
      ))}
    </div>
  );
}