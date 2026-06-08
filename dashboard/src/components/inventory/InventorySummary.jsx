// dashboard/src/components/inventory/InventorySummary.jsx

import { useInventoryStore } from '../../store/inventoryStore';

export default function InventorySummary() {
  const {
    units,
    vendors,
    categories,
    masterItems
  } = useInventoryStore();

  const cards = [
    {
      label: 'Master Items',
      value: masterItems.length
    },
    {
      label: 'Categories',
      value: categories.length
    },
    {
      label: 'Vendors',
      value: vendors.length
    },
    {
      label: 'Units',
      value: units.length
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-xl border p-5"
        >
          <div className="text-sm text-gray-500">
            {card.label}
          </div>

          <div className="text-3xl font-bold mt-2">
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}