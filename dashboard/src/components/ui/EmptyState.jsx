import { Plus, Package, ClipboardList, Users, BarChart3, Store } from 'lucide-react';

const iconMap = {
  menu: Package,
  orders: ClipboardList,
  kds: ClipboardList,
  reports: BarChart3,
  staff: Users,
  inventory: Package,
  outlets: Store,
};

export default function EmptyState({ 
  title = 'No items found', 
  message = 'Get started by adding your first item.', 
  actionLabel = 'Add Item', 
  onAction, 
  icon = 'menu' 
}) {
  const Icon = iconMap[icon] || Package;
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-gray-100 rounded-full p-4 mb-4">
        <Icon className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">{message}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}