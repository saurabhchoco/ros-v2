// dashboard/src/components/inventory/InventoryUnitsTable.jsx

import Button from '../ui/Button';

export default function InventoryUnitsTable({
  units,
  onEdit,
  onDelete
}) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">

      <table className="w-full">

        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-4">
              Name
            </th>

            <th className="text-left p-4">
              Symbol
            </th>

            <th className="text-left p-4">
              Type
            </th>

            <th className="text-left p-4">
              Base Unit
            </th>

            <th className="text-left p-4">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {units.map((unit) => (
            <tr
              key={unit.id}
              className="border-b"
            >
              <td className="p-4">
                {unit.name}
              </td>

              <td className="p-4">
                {unit.symbol}
              </td>

              <td className="p-4">
                {unit.unit_type}
              </td>

              <td className="p-4">
                {unit.is_base_unit
                  ? 'Yes'
                  : 'No'}
              </td>

              <td className="p-4 flex gap-2">

                <Button
                  size="sm"
                  onClick={() =>
                    onEdit(unit)
                  }
                >
                  Edit
                </Button>

                <Button
                  size="sm"
                  variant="danger"
                  onClick={() =>
                    onDelete(unit)
                  }
                >
                  Delete
                </Button>

              </td>
            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
}