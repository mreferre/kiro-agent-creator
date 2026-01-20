/**
 * Toolbar Component
 * 
 * Provides action buttons for file operations and example loading.
 * 
 * Features:
 * - "New Configuration" button to reset the form
 * - "Import" button with file picker for JSON files
 * - "Export" button (disabled when configuration is invalid)
 * - "Load Example" dropdown with example agent configurations
 * 
 * Validates: Requirements 1.1, 2.1, 3.1, 13.1, 13.8
 */

import { useRef, useCallback, useState } from 'react';
import { getExamples } from '../services/ExampleGenerator';

export interface ToolbarProps {
  /** Handler called when "New Configuration" is clicked */
  onNew: () => void;
  /** Handler called when a file is selected for import */
  onImport: (file: File) => void;
  /** Handler called when "Export" is clicked */
  onExport: () => void;
  /** Handler called when an example is selected */
  onLoadExample: (exampleId: string) => void;
  /** Whether the current configuration is valid (enables/disables Export button) */
  isValid: boolean;
  /** Whether the JSON preview panel is visible */
  isPreviewVisible?: boolean;
  /** Handler called when preview toggle is clicked */
  onTogglePreview?: () => void;
}

/**
 * Toolbar component with import/export buttons
 */
export function Toolbar({
  onNew,
  onImport,
  onExport,
  onLoadExample,
  isValid,
  isPreviewVisible,
  onTogglePreview,
}: ToolbarProps) {
  // Hidden file input ref for import functionality
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Example dropdown state
  const [showExampleDropdown, setShowExampleDropdown] = useState(false);
  const examples = getExamples();

  /**
   * Opens the file picker dialog
   * Validates: Requirement 2.1 - clicking Import opens file picker
   */
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Handles file selection from the file picker
   * Validates: Requirement 2.1 - file picker for JSON files
   */
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onImport(file);
        // Reset the input so the same file can be selected again
        event.target.value = '';
      }
    },
    [onImport]
  );

  /**
   * Handles export button click
   * Validates: Requirement 3.1 - clicking Export generates JSON file
   */
  const handleExportClick = useCallback(() => {
    if (isValid) {
      onExport();
    }
  }, [isValid, onExport]);

  /**
   * Handles load example selection
   * Validates: Requirement 13.1, 13.8 - selecting example populates form
   */
  const handleLoadExample = useCallback((exampleId: string) => {
    onLoadExample(exampleId);
    setShowExampleDropdown(false);
  }, [onLoadExample]);

  /**
   * Toggle example dropdown
   */
  const toggleExampleDropdown = useCallback(() => {
    setShowExampleDropdown((prev) => !prev);
  }, []);

  return (
    <div className="flex items-center space-x-3">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Import configuration file"
        data-testid="import-file-input"
      />

      {/* New Configuration Button */}
      <button
        type="button"
        onClick={onNew}
        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        data-testid="new-config-button"
      >
        New Configuration
      </button>

      {/* Import Button */}
      <button
        type="button"
        onClick={handleImportClick}
        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        data-testid="import-button"
      >
        Import
      </button>

      {/* Export Button - disabled when invalid */}
      <button
        type="button"
        onClick={handleExportClick}
        disabled={!isValid}
        className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
          isValid
            ? 'text-white bg-blue-600 hover:bg-blue-700'
            : 'text-gray-400 bg-gray-200 dark:bg-gray-600 cursor-not-allowed opacity-60'
        }`}
        data-testid="export-button"
        aria-disabled={!isValid}
        title={isValid ? 'Export configuration as JSON' : 'Fix validation errors before exporting'}
      >
        Export
      </button>

      {/* Load Example Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={toggleExampleDropdown}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center gap-1"
          data-testid="load-example-button"
          aria-expanded={showExampleDropdown}
          aria-haspopup="true"
        >
          Load Example
          <svg className={`w-4 h-4 transition-transform ${showExampleDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showExampleDropdown && (
          <div 
            className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
            data-testid="example-dropdown"
          >
            <div className="py-1">
              {examples.map((example) => (
                <button
                  key={example.id}
                  type="button"
                  onClick={() => handleLoadExample(example.id)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  data-testid={`example-option-${example.id}`}
                >
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {example.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {example.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview Toggle Button (optional) */}
      {onTogglePreview !== undefined && (
        <button
          type="button"
          onClick={onTogglePreview}
          className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
            isPreviewVisible
              ? 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700'
              : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
          }`}
          data-testid="toggle-preview-button"
        >
          {isPreviewVisible ? 'Hide Preview' : 'Show Preview'}
        </button>
      )}
    </div>
  );
}

export default Toolbar;
