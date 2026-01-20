import { FieldWithTooltip } from './FieldWithTooltip';

/**
 * A key-value pair for the KeyValueField component
 */
export interface KeyValuePair {
  key: string;
  value: string;
}

/**
 * Props for the KeyValueField component
 */
interface KeyValueFieldProps {
  label: string;
  tooltip: string;
  example?: string;
  items: KeyValuePair[];
  onChange: (items: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  keyLabel?: string;
  valueLabel?: string;
  error?: string;
  testId?: string;
}

/**
 * KeyValueField Component
 * 
 * A reusable component for managing key-value pairs (like toolAliases, env vars).
 * Features:
 * - Add button to append new pairs
 * - Remove button for each pair
 * - Separate inputs for key and value
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */
export function KeyValueField({
  label,
  tooltip,
  example,
  items,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  keyLabel = 'Key',
  valueLabel = 'Value',
  error,
  testId = 'key-value-field',
}: KeyValueFieldProps) {
  /**
   * Add a new empty key-value pair
   */
  const handleAdd = () => {
    onChange([...items, { key: '', value: '' }]);
  };

  /**
   * Remove a pair at the specified index
   */
  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  /**
   * Update the key at the specified index
   */
  const handleKeyChange = (index: number, key: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], key };
    onChange(newItems);
  };

  /**
   * Update the value at the specified index
   */
  const handleValueChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], value };
    onChange(newItems);
  };

  return (
    <FieldWithTooltip
      label={label}
      tooltip={tooltip}
      example={example}
      error={error}
    >
      <div className="space-y-2" data-testid={testId}>
        {items.length === 0 ? (
          <div 
            className="text-sm text-gray-500 dark:text-gray-400 italic py-2 px-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-md"
            data-testid={`${testId}-empty`}
          >
            No items added. Click "Add" to add an item.
          </div>
        ) : (
          <>
            {/* Header row */}
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              <div className="flex-1">{keyLabel}</div>
              <div className="flex-1">{valueLabel}</div>
              <div className="w-10"></div>
            </div>
            
            {items.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center gap-2"
                data-testid={`${testId}-item-${index}`}
              >
                <input
                  type="text"
                  value={item.key}
                  onChange={(e) => handleKeyChange(index, e.target.value)}
                  placeholder={keyPlaceholder}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  data-testid={`${testId}-key-${index}`}
                />
                
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => handleValueChange(index, e.target.value)}
                  placeholder={valuePlaceholder}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  data-testid={`${testId}-value-${index}`}
                />
                
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  title="Remove item"
                  data-testid={`${testId}-remove-${index}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </>
        )}
        
        {/* Add button */}
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
          data-testid={`${testId}-add`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </div>
    </FieldWithTooltip>
  );
}

export default KeyValueField;
