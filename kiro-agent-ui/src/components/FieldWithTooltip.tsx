import { useState, useRef, useEffect } from 'react';

/**
 * Props for the FieldWithTooltip component
 * 
 * Requirements: 5.1, 5.2, 5.3
 */
export interface FieldWithTooltipProps {
  /** The label text for the field */
  label: string;
  /** The tooltip description text */
  tooltip: string;
  /** Optional example value to show in the tooltip */
  example?: string;
  /** Optional error message to display */
  error?: string;
  /** The form field element(s) to render */
  children: React.ReactNode;
  /** Optional HTML id for the label's htmlFor attribute */
  htmlFor?: string;
}

/**
 * FieldWithTooltip Component
 * 
 * A wrapper component that displays a label with an info icon.
 * When the user hovers over the info icon, a tooltip appears showing
 * the field description and optionally an example value.
 * 
 * Requirements:
 * - 5.1: Display an info icon next to each configuration field
 * - 5.2: Show a tooltip with field description on hover
 * - 5.3: Include example values in tooltips where applicable
 */
export function FieldWithTooltip({
  label,
  tooltip,
  example,
  error,
  children,
  htmlFor,
}: FieldWithTooltipProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top');
  const iconRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Calculate tooltip position based on available space
  useEffect(() => {
    if (isTooltipVisible && iconRef.current) {
      const iconRect = iconRef.current.getBoundingClientRect();
      const spaceAbove = iconRect.top;
      const tooltipHeight = 100; // Approximate tooltip height
      
      // If not enough space above, show below
      if (spaceAbove < tooltipHeight) {
        setTooltipPosition('bottom');
      } else {
        setTooltipPosition('top');
      }
    }
  }, [isTooltipVisible]);

  const handleMouseEnter = () => {
    setIsTooltipVisible(true);
  };

  const handleMouseLeave = () => {
    setIsTooltipVisible(false);
  };

  const handleFocus = () => {
    setIsTooltipVisible(true);
  };

  const handleBlur = () => {
    setIsTooltipVisible(false);
  };

  return (
    <div className="space-y-1">
      {/* Label with info icon */}
      <div className="flex items-center gap-1.5">
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
        
        {/* Info icon with tooltip */}
        <div className="relative inline-block">
          <button
            ref={iconRef}
            type="button"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="inline-flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-full transition-colors"
            aria-label={`Information about ${label}`}
            aria-describedby={isTooltipVisible ? `tooltip-${htmlFor || label}` : undefined}
            data-testid={`tooltip-trigger-${htmlFor || label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {/* Info icon (circle with "i") */}
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Tooltip */}
          {isTooltipVisible && (
            <div
              ref={tooltipRef}
              id={`tooltip-${htmlFor || label}`}
              role="tooltip"
              className={`absolute z-50 w-64 p-3 text-sm bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-lg ${
                tooltipPosition === 'top'
                  ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
                  : 'top-full left-1/2 -translate-x-1/2 mt-2'
              }`}
              data-testid={`tooltip-content-${htmlFor || label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {/* Tooltip arrow */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent ${
                  tooltipPosition === 'top'
                    ? 'top-full border-t-8 border-t-gray-900 dark:border-t-gray-800'
                    : 'bottom-full border-b-8 border-b-gray-900 dark:border-b-gray-800'
                }`}
                aria-hidden="true"
              />
              
              {/* Tooltip content */}
              <p className="text-gray-100">{tooltip}</p>
              
              {/* Example value if provided */}
              {example && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <span className="text-gray-400 text-xs font-medium">Example:</span>
                  <code className="block mt-1 text-xs text-blue-300 bg-gray-800 dark:bg-gray-900 px-2 py-1 rounded font-mono break-all">
                    {example}
                  </code>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Form field children */}
      <div>{children}</div>

      {/* Error message */}
      {error && (
        <p
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
          data-testid={`error-${htmlFor || label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default FieldWithTooltip;
