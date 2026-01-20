import { useState, useCallback, useEffect } from 'react';
import type { AgentConfiguration, ValidationErrors } from './types/agent-config';
import { BasicFieldsSection } from './components/BasicFieldsSection';
import { ToolsSection } from './components/ToolsSection';
import { MCPServersSection } from './components/MCPServersSection';
import { HooksSection } from './components/HooksSection';
import { ToolSettingsSection } from './components/ToolSettingsSection';
import { ResourcesSection } from './components/ResourcesSection';
import { JSONPreviewPanel } from './components/JSONPreviewPanel';
import { Toolbar } from './components/Toolbar';
import { validate } from './services/ValidationEngine';
import { importFile, exportConfig, FileHandlerError } from './services/FileHandler';
import { getExample } from './services/ExampleGenerator';

/**
 * App Component
 * 
 * The root component that orchestrates the layout and manages global state.
 * 
 * Manages:
 * - Current configuration state
 * - Validation state
 * - JSON preview visibility toggle
 */
function App() {
  // Configuration state - starts with an empty object
  const [config, setConfig] = useState<AgentConfiguration>({});
  
  // Validation state - tracks validation errors by field path
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // JSON preview visibility toggle
  const [isPreviewVisible, setIsPreviewVisible] = useState<boolean>(true);

  // Import error state for displaying error messages to the user
  const [importError, setImportError] = useState<string | null>(null);

  // Check if configuration is valid (no validation errors)
  const isValid = Object.keys(validationErrors).length === 0;

  // Handler for partial configuration updates - merges updates with existing config
  // Used by section components like BasicFieldsSection
  const handlePartialConfigChange = useCallback((updates: Partial<AgentConfiguration>) => {
    setConfig((prevConfig) => {
      // Create new config by merging updates
      const newConfig = { ...prevConfig, ...updates };
      
      // Clean up undefined values to keep config clean
      Object.keys(newConfig).forEach((key) => {
        if (newConfig[key as keyof AgentConfiguration] === undefined) {
          delete newConfig[key as keyof AgentConfiguration];
        }
      });
      
      return newConfig;
    });
  }, []);

  // Run validation whenever config changes
  // Requirements: 4.1 - validate on every field modification
  useEffect(() => {
    const result = validate(config);
    setValidationErrors(result.errors);
  }, [config]);

  // Handler for toggling JSON preview visibility
  const handleTogglePreview = useCallback(() => {
    setIsPreviewVisible((prev) => !prev);
  }, []);

  // Handler for creating a new configuration
  const handleNewConfig = useCallback(() => {
    setConfig({});
    setValidationErrors({});
    setImportError(null);
  }, []);

  // Handler for importing a configuration file
  // Validates: Requirements 2.1, 2.2, 2.3
  const handleImport = useCallback(async (file: File) => {
    setImportError(null);
    try {
      const importedConfig = await importFile(file);
      setConfig(importedConfig);
      // Validation will run automatically via useEffect
    } catch (error) {
      if (error instanceof FileHandlerError) {
        setImportError(error.message);
      } else {
        setImportError('An unexpected error occurred while importing the file.');
      }
    }
  }, []);

  // Handler for exporting the configuration
  // Validates: Requirements 3.1, 3.2, 3.3, 3.4
  const handleExport = useCallback(() => {
    if (isValid) {
      exportConfig(config);
    }
  }, [config, isValid]);

  // Handler for loading an example configuration
  // Validates: Requirements 13.1, 13.8
  const handleLoadExample = useCallback((exampleId: string) => {
    const example = getExample(exampleId);
    if (example) {
      setConfig(example.config);
      setImportError(null);
    }
  }, []);

  // Handler for copy to clipboard (called by JSONPreviewPanel)
  const handleCopyJSON = useCallback(() => {
    // The actual copy is handled by the JSONPreviewPanel component
    // This callback can be used for analytics or additional actions
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Toolbar Area */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Kiro Agent Configuration Editor
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Create and edit Kiro CLI custom agent configuration files
              </p>
            </div>
            {/* Toolbar with import/export buttons */}
            <Toolbar
              onNew={handleNewConfig}
              onImport={handleImport}
              onExport={handleExport}
              onLoadExample={handleLoadExample}
              isValid={isValid}
              isPreviewVisible={isPreviewVisible}
              onTogglePreview={handleTogglePreview}
            />
          </div>
        </div>
      </header>

      {/* Import Error Alert */}
      {importError && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-red-400 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-red-700 dark:text-red-300" data-testid="import-error-message">
                  {importError}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setImportError(null)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
                aria-label="Dismiss error"
                data-testid="dismiss-import-error"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 h-full">
          {/* Form Editor Area */}
          <div className={`flex-1 ${isPreviewVisible ? 'w-1/2' : 'w-full'}`}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-full overflow-auto">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Configuration Editor
              </h2>
              {/* BasicFieldsSection - handles name, description, prompt, model, keyboardShortcut, welcomeMessage, includeMcpJson */}
              <BasicFieldsSection
                config={config}
                onChange={handlePartialConfigChange}
                errors={validationErrors}
              />

              {/* ToolsSection - handles tools and allowedTools arrays */}
              <div className="mt-8">
                <ToolsSection
                  config={config}
                  onChange={handlePartialConfigChange}
                  errors={validationErrors}
                />
              </div>

              {/* MCPServersSection - handles MCP server configuration */}
              <div className="mt-8">
                <MCPServersSection
                  config={config}
                  onChange={handlePartialConfigChange}
                  errors={validationErrors}
                />
              </div>

              {/* HooksSection - handles hooks configuration */}
              <div className="mt-8">
                <HooksSection
                  config={config}
                  onChange={handlePartialConfigChange}
                  errors={validationErrors}
                />
              </div>

              {/* ToolSettingsSection - handles tool-specific settings */}
              <div className="mt-8">
                <ToolSettingsSection
                  config={config}
                  onChange={handlePartialConfigChange}
                  errors={validationErrors}
                />
              </div>

              {/* ResourcesSection - handles resources configuration */}
              <div className="mt-8">
                <ResourcesSection
                  config={config}
                  onChange={handlePartialConfigChange}
                  errors={validationErrors}
                />
              </div>
            </div>
          </div>

          {/* JSON Preview Panel */}
          <JSONPreviewPanel
            config={config}
            isVisible={isPreviewVisible}
            onToggle={handleTogglePreview}
            onCopy={handleCopyJSON}
          />
        </div>
      </main>

      {/* Validation Status Indicator */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              {isValid ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span className="text-green-600 dark:text-green-400">Configuration is valid</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  <span className="text-red-600 dark:text-red-400">
                    {Object.keys(validationErrors).length} validation error(s)
                  </span>
                </>
              )}
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              Kiro CLI Custom Agent Configuration Editor
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
