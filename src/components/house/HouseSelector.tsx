import { useState } from 'react';
import type { House } from '@/types';

interface HouseSelectorProps {
  houses: House[];
  selectedHouseId?: string;
  onSelect: (houseId: string) => void;
  allowCustom?: boolean;
  onCreateCustom?: (data: { name: string; color: string }) => Promise<void>;
}

export function HouseSelector({
  houses,
  selectedHouseId,
  onSelect,
  allowCustom = false,
  onCreateCustom,
}: HouseSelectorProps) {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customColor, setCustomColor] = useState('#6366F1');
  const [isCreating, setIsCreating] = useState(false);

  const presetColors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#22C55E', // Green
    '#EAB308', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F97316', // Orange
    '#14B8A6', // Teal
  ];

  const handleCreateCustom = async () => {
    if (!onCreateCustom || !customName.trim()) return;

    setIsCreating(true);
    try {
      await onCreateCustom({ name: customName.trim(), color: customColor });
      setShowCustomForm(false);
      setCustomName('');
    } catch (error) {
      console.error('Failed to create custom house:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-neutral-700">
        Select Your House
      </label>

      {/* House grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {houses.filter(h => h.isDefault).map((house) => (
          <button
            key={house.id}
            type="button"
            onClick={() => onSelect(house.id)}
            className={`
              p-4 rounded-xl border-2 transition-all text-center
              ${selectedHouseId === house.id
                ? 'border-primary bg-primary/5'
                : 'border-neutral-200 hover:border-neutral-300 bg-white'
              }
            `}
          >
            {/* House color circle */}
            <div
              className="w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center"
              style={{ backgroundColor: house.color }}
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
            </div>

            <span className="text-sm font-medium text-neutral-900">
              {house.name}
            </span>

            {selectedHouseId === house.id && (
              <div className="mt-1">
                <svg className="w-4 h-4 mx-auto text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Custom houses (non-default) */}
      {houses.filter(h => !h.isDefault).length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-neutral-500 mb-2">Custom Houses</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {houses.filter(h => !h.isDefault).map((house) => (
              <button
                key={house.id}
                type="button"
                onClick={() => onSelect(house.id)}
                className={`
                  p-4 rounded-xl border-2 transition-all text-center
                  ${selectedHouseId === house.id
                    ? 'border-primary bg-primary/5'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }
                `}
              >
                <div
                  className="w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: house.color }}
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-neutral-900">
                  {house.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom house creation */}
      {allowCustom && onCreateCustom && (
        <div className="mt-4">
          {!showCustomForm ? (
            <button
              type="button"
              onClick={() => setShowCustomForm(true)}
              className="w-full py-3 border-2 border-dashed border-neutral-300 rounded-xl text-neutral-500 hover:border-primary hover:text-primary transition-colors"
            >
              + Create Custom House
            </button>
          ) : (
            <div className="p-4 bg-neutral-50 rounded-xl space-y-4">
              <h4 className="font-medium text-neutral-900">Create Custom House</h4>

              <div>
                <label className="block text-sm text-neutral-600 mb-1">House Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter house name"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-600 mb-2">House Color</label>
                <div className="flex flex-wrap gap-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCustomColor(color)}
                      className={`
                        w-8 h-8 rounded-full transition-transform
                        ${customColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}
                      `}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-8 h-8 rounded-full cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomForm(false)}
                  className="flex-1 py-2 text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateCustom}
                  disabled={!customName.trim() || isCreating}
                  className="flex-1 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
