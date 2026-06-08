// dashboard/src/components/inventory/InventoryUnitModal.jsx

import { useState, useEffect } from 'react';

import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

const UNIT_TYPES = [
  'WEIGHT',
  'VOLUME',
  'COUNT',
  'LENGTH'
];

export default function InventoryUnitModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading
}) {
  const [form, setForm] = useState({
    name: '',
    symbol: '',
    unitType: 'COUNT',
    isBaseUnit: false
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        symbol: initialData.symbol || '',
        unitType:
          initialData.unit_type || 'COUNT',
        isBaseUnit:
          initialData.is_base_unit || false
      });
    }
  }, [initialData]);

  const submit = () => {
    onSubmit(form);
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={
        initialData
          ? 'Edit Unit'
          : 'Create Unit'
      }
    >
      <div className="space-y-4">

        <Input
          label="Name"
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value
            })
          }
        />

        <Input
          label="Symbol"
          value={form.symbol}
          onChange={(e) =>
            setForm({
              ...form,
              symbol: e.target.value
            })
          }
        />

        <select
          value={form.unitType}
          onChange={(e) =>
            setForm({
              ...form,
              unitType: e.target.value
            })
          }
          className="w-full border rounded-lg p-2"
        >
          {UNIT_TYPES.map((type) => (
            <option
              key={type}
              value={type}
            >
              {type}
            </option>
          ))}
        </select>

        <label className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={form.isBaseUnit}
            onChange={(e) =>
              setForm({
                ...form,
                isBaseUnit:
                  e.target.checked
              })
            }
          />

          Base Unit
        </label>

        <div className="flex justify-end gap-2 pt-2">

          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            disabled={loading}
            onClick={submit}
          >
            Save
          </Button>

        </div>
      </div>
    </Modal>
  );
}