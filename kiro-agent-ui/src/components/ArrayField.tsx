import { FieldWithTooltip } from './FieldWithTooltip';

/**
 * Props for the ArrayField component
 */
interface ArrayFieldProps {
  label: string;
  tooltip: string;
  example?: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  error?: string;
  testId?: string;
}

/**
 * ArrayField Component
 * 
 * A reusable component for managing arrays of string values.
 * Features:
 * - Add button to append new items
 * - Remove button for each item
 * - Reorder with up/down buttons
 * - Placeholder when array is empty
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export function ArrayField({
  label,
  tooltip,
  example,
  items,
  onChange,
  placeholder = 'Enter value...',
  error,
  testId = 'array-field',
}: ArrayFieldProps) {
  /**
   * Add a new empty item to the array
   */
  const handleAdd = () => {
    onChange([...items, '']);
  };

  /**
   * Remove an item at the specified index
   */
  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  /**
   * Update an item at the specified index
   */
  const handleChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange(newItems);
  };

  /**
   * Move an item up in the array
   */
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onChange(newItems);
  };

  /**
   * Move an item down in the array
   */
  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
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
          items.map((item, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2"
              data-testid={`${testId}-item-${index}`}
            >
              <input
                type="text"
                value={item}
                onChange={(e) => handleChange(index, e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                data-testid={`${testId}-input-${index}`}
              />
              
              {/* Reorder buttons */}
              <button
                type="button"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move up"
                data-testid={`${testId}-move-up-${index}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              
              <button
                type="button"
                onClick={() => handleMoveDown(index)}
                disabled={index === items.length - 1}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move down"
                data-testid={`${testId}-move-down-${index}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
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
          ))
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

export default ArrayField;
