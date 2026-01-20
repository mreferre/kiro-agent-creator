/**
 * FileHandler Service
 * 
 * Provides file import and export functionality for agent configurations.
 * Handles JSON parsing, validation, and browser download operations.
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4
 */

import type { AgentConfiguration } from '../types/agent-config';

/**
 * Error types for file operations
 */
export type FileErrorType = 'JSON_PARSE_ERROR' | 'FILE_READ_ERROR' | 'SCHEMA_VALIDATION_ERROR';

/**
 * Custom error class for file handling operations
 */
export class FileHandlerError extends Error {
  readonly type: FileErrorType;
  
  constructor(
    type: FileErrorType,
    message: string
  ) {
    super(message);
    this.type = type;
    this.name = 'FileHandlerError';
  }
}

/**
 * Reads a file and returns its text content
 * 
 * @param file - The File object to read
 * @returns Promise resolving to the file's text content
 * @throws FileHandlerError with FILE_READ_ERROR type on failure
 * 
 * Validates: Requirement 2.3 (File Read Error handling)
 */
async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new FileHandlerError(
          'FILE_READ_ERROR',
          'Could not read file. Please try again.'
        ));
      }
    };
    
    reader.onerror = () => {
      reject(new FileHandlerError(
        'FILE_READ_ERROR',
        'Could not read file. Please try again.'
      ));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Parses JSON string and returns the parsed object
 * 
 * @param jsonString - The JSON string to parse
 * @returns The parsed object
 * @throws FileHandlerError with JSON_PARSE_ERROR type on failure
 * 
 * Validates: Requirement 2.3 (JSON Parse Error handling)
 */
function parseJSON(jsonString: string): unknown {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    const parseError = error instanceof SyntaxError ? error.message : 'Unknown parse error';
    throw new FileHandlerError(
      'JSON_PARSE_ERROR',
      `Invalid JSON: ${parseError}`
    );
  }
}

/**
 * Checks if a value is empty (undefined, null, empty string, empty array, or empty object)
 * 
 * @param value - The value to check
 * @returns true if the value is considered empty
 */
function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === 'string' && value === '') {
    return true;
  }
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  if (typeof value === 'object' && Object.keys(value as object).length === 0) {
    return true;
  }
  return false;
}

/**
 * Recursively cleans an object by removing empty/undefined values
 * 
 * @param obj - The object to clean
 * @returns A new object with empty values removed
 * 
 * Validates: Requirement 3.4 (omit empty/null optional fields)
 */
function cleanObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip temporary keys used for editing (e.g., __empty_0__)
    if (key.startsWith('__empty_')) {
      continue;
    }
    
    if (isEmpty(value)) {
      continue;
    }
    
    if (Array.isArray(value)) {
      // Clean array items - filter out empty strings and clean objects
      const cleanedArray = value
        .filter(item => {
          // Filter out empty strings from string arrays
          if (typeof item === 'string') {
            return item.trim() !== '';
          }
          return !isEmpty(item);
        })
        .map(item => {
          if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            return cleanObject(item as Record<string, unknown>);
          }
          return item;
        })
        .filter(item => !isEmpty(item));
      
      if (cleanedArray.length > 0) {
        result[key] = cleanedArray;
      }
    } else if (typeof value === 'object' && value !== null) {
      const cleanedNested = cleanObject(value as Record<string, unknown>);
      if (Object.keys(cleanedNested).length > 0) {
        result[key] = cleanedNested;
      }
    } else {
      result[key] = value;
    }
  }
  
  return result as Partial<T>;
}

/**
 * Generates a filename for the exported configuration
 * 
 * @param config - The agent configuration
 * @param customFilename - Optional custom filename
 * @returns The filename to use for the export
 * 
 * Validates: Requirement 3.3 (filename based on agent name or "agent-config.json")
 */
export function generateFilename(config: AgentConfiguration, customFilename?: string): string {
  if (customFilename) {
    // Ensure the custom filename ends with .json
    return customFilename.endsWith('.json') ? customFilename : `${customFilename}.json`;
  }
  
  if (config.name && config.name.trim() !== '') {
    // Sanitize the name for use as a filename
    const sanitizedName = config.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return sanitizedName ? `${sanitizedName}.json` : 'agent-config.json';
  }
  
  return 'agent-config.json';
}

/**
 * Triggers a browser download for the given content
 * 
 * @param content - The content to download
 * @param filename - The filename for the download
 */
function triggerDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Imports a JSON file and returns the parsed AgentConfiguration
 * 
 * @param file - The File object to import
 * @returns Promise resolving to the parsed AgentConfiguration
 * @throws FileHandlerError on file read or JSON parse errors
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 */
export async function importFile(file: File): Promise<AgentConfiguration> {
  // Read the file content
  const content = await readFileAsText(file);
  
  // Parse the JSON
  const parsed = parseJSON(content);
  
  // Ensure it's an object (basic type check)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new FileHandlerError(
      'JSON_PARSE_ERROR',
      'Invalid JSON: Expected an object at the root level'
    );
  }
  
  // Return the parsed configuration
  // Note: Schema validation is handled separately by the ValidationEngine
  // This preserves all existing values from the file including unknown fields (Requirement 2.4)
  return parsed as AgentConfiguration;
}

/**
 * Exports an AgentConfiguration to a JSON file and triggers download
 * 
 * @param config - The configuration to export
 * @param filename - Optional custom filename
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */
export function exportConfig(config: AgentConfiguration, filename?: string): void {
  // Clean the configuration to remove empty/undefined values
  const cleanedConfig = cleanObject(config as Record<string, unknown>);
  
  // Format JSON with 2-space indentation
  const jsonContent = JSON.stringify(cleanedConfig, null, 2);
  
  // Generate the filename
  const exportFilename = generateFilename(config, filename);
  
  // Trigger the download
  triggerDownload(jsonContent, exportFilename);
}

/**
 * Cleans an AgentConfiguration by removing empty/undefined values
 * Exported for use in JSON preview and testing
 * 
 * @param config - The configuration to clean
 * @returns A new configuration with empty values removed
 * 
 * Validates: Requirement 3.4
 */
export function cleanConfig(config: AgentConfiguration): Partial<AgentConfiguration> {
  return cleanObject(config as Record<string, unknown>) as Partial<AgentConfiguration>;
}

/**
 * Serializes an AgentConfiguration to a formatted JSON string
 * Exported for use in JSON preview
 * 
 * @param config - The configuration to serialize
 * @param clean - Whether to clean the config before serializing (default: true)
 * @returns Formatted JSON string
 * 
 * Validates: Requirements 3.2, 3.4
 */
export function serializeConfig(config: AgentConfiguration, clean: boolean = true): string {
  const configToSerialize = clean ? cleanConfig(config) : config;
  return JSON.stringify(configToSerialize, null, 2);
}

/**
 * FileHandler class providing an object-oriented interface
 * 
 * This class wraps the functional file handling methods for use cases
 * that prefer an object-oriented approach.
 */
export class FileHandler {
  /**
   * Imports a JSON file and returns the parsed AgentConfiguration
   * 
   * @param file - The File object to import
   * @returns Promise resolving to the parsed AgentConfiguration
   */
  async importFile(file: File): Promise<AgentConfiguration> {
    return importFile(file);
  }

  /**
   * Exports an AgentConfiguration to a JSON file and triggers download
   * 
   * @param config - The configuration to export
   * @param filename - Optional custom filename
   */
  exportConfig(config: AgentConfiguration, filename?: string): void {
    return exportConfig(config, filename);
  }
}

// Export a singleton instance for convenience
export const fileHandler = new FileHandler();

// Default export for the class
export default FileHandler;
