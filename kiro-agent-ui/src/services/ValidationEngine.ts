/**
 * ValidationEngine Service
 * 
 * Provides validation functionality for agent configurations using Zod schemas.
 * Converts Zod validation errors to a structured ValidationErrors format with
 * field paths for easy integration with form components.
 * 
 * Validates: Requirements 4.1, 4.2
 */

import { z } from 'zod';
import { AgentConfigurationSchema } from '../schemas/agent-config';
import type { AgentConfiguration, ValidationResult, ValidationErrors } from '../types/agent-config';

/**
 * Converts a Zod error path to a dot-notation string with array bracket notation
 * 
 * @param path - Array of path segments from Zod error
 * @returns Formatted path string (e.g., 'mcpServers.myServer.command', 'tools[0]')
 */
function formatErrorPath(path: (string | number)[]): string {
  if (path.length === 0) {
    return '_root';
  }

  return path.reduce<string>((acc, segment, index) => {
    if (typeof segment === 'number') {
      // Use array bracket notation for numeric indices
      return `${acc}[${segment}]`;
    }
    // Use dot notation for string keys (except for the first segment)
    return index === 0 ? segment : `${acc}.${segment}`;
  }, '');
}

/**
 * Converts Zod validation errors to ValidationErrors format
 * 
 * @param zodError - The Zod error object
 * @returns ValidationErrors object mapping field paths to error messages
 */
function convertZodErrors(zodError: z.ZodError): ValidationErrors {
  const errors: ValidationErrors = {};

  for (const issue of zodError.issues) {
    // Cast path to (string | number)[] since Zod paths don't contain symbols in practice
    const path = formatErrorPath(issue.path as (string | number)[]);
    // If multiple errors exist for the same path, keep the first one
    if (!(path in errors)) {
      errors[path] = issue.message;
    }
  }

  return errors;
}

/**
 * Validates an entire agent configuration against the schema
 * 
 * @param config - The agent configuration to validate
 * @returns ValidationResult with isValid flag and errors object
 * 
 * @example
 * ```typescript
 * const result = validate({ name: 'my-agent', keyboardShortcut: 'invalid' });
 * // result.isValid === false
 * // result.errors === { keyboardShortcut: 'Invalid keyboard shortcut format...' }
 * ```
 */
export function validate(config: AgentConfiguration): ValidationResult {
  const result = AgentConfigurationSchema.safeParse(config);

  if (result.success) {
    return {
      isValid: true,
      errors: {},
    };
  }

  return {
    isValid: false,
    errors: convertZodErrors(result.error),
  };
}

/**
 * Validates a single field by its path
 * 
 * This function extracts the value at the given path from a configuration object
 * and validates it against the corresponding part of the schema.
 * 
 * @param path - Dot-notation path to the field (e.g., 'name', 'mcpServers.myServer.command')
 * @param value - The value to validate
 * @param fullConfig - Optional full configuration for context-dependent validation
 * @returns Error message if invalid, null if valid
 * 
 * @example
 * ```typescript
 * const error = validateField('keyboardShortcut', 'invalid-shortcut');
 * // error === 'Invalid keyboard shortcut format...'
 * 
 * const noError = validateField('keyboardShortcut', 'ctrl+a');
 * // noError === null
 * ```
 */
export function validateField(
  path: string,
  value: unknown,
  fullConfig?: AgentConfiguration
): string | null {
  // Build a partial config with just the field we want to validate
  const partialConfig = buildPartialConfig(path, value, fullConfig);
  
  // Validate the entire config and extract the error for our specific path
  const result = AgentConfigurationSchema.safeParse(partialConfig);

  if (result.success) {
    return null;
  }

  // Find the error that matches our path
  for (const issue of result.error.issues) {
    // Cast path to (string | number)[] since Zod paths don't contain symbols in practice
    const errorPath = formatErrorPath(issue.path as (string | number)[]);
    if (errorPath === path || errorPath.startsWith(path)) {
      return issue.message;
    }
  }

  return null;
}

/**
 * Builds a partial configuration object with a value at the specified path
 * 
 * @param path - Dot-notation path (e.g., 'mcpServers.myServer.command')
 * @param value - The value to set at the path
 * @param baseConfig - Optional base configuration to merge with
 * @returns Partial configuration object
 */
function buildPartialConfig(
  path: string,
  value: unknown,
  baseConfig?: AgentConfiguration
): AgentConfiguration {
  // Start with the base config or empty object
  const config: AgentConfiguration = baseConfig ? { ...baseConfig } : {};
  
  // Parse the path into segments, handling array notation
  const segments = parsePath(path);
  
  if (segments.length === 0) {
    return config;
  }

  // Navigate/create the nested structure and set the value
  setNestedValue(config as unknown as Record<string, unknown>, segments, value);
  
  return config;
}

/**
 * Parses a dot-notation path with array brackets into segments
 * 
 * @param path - Path string (e.g., 'mcpServers.myServer.command', 'tools[0]')
 * @returns Array of path segments
 */
function parsePath(path: string): (string | number)[] {
  const segments: (string | number)[] = [];
  
  // Match either dot-separated keys or bracket notation
  const regex = /([^.\[\]]+)|\[(\d+)\]/g;
  let match;
  
  while ((match = regex.exec(path)) !== null) {
    if (match[1] !== undefined) {
      // Regular key
      segments.push(match[1]);
    } else if (match[2] !== undefined) {
      // Array index
      segments.push(parseInt(match[2], 10));
    }
  }
  
  return segments;
}

/**
 * Sets a value at a nested path in an object, creating intermediate objects/arrays as needed
 * 
 * @param obj - The object to modify
 * @param segments - Path segments
 * @param value - The value to set
 */
function setNestedValue(
  obj: Record<string, unknown>,
  segments: (string | number)[],
  value: unknown
): void {
  let current: Record<string, unknown> = obj;
  
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];
    const nextSegment = segments[i + 1];
    
    if (typeof segment === 'number') {
      // This shouldn't happen at the top level, but handle it
      continue;
    }
    
    if (!(segment in current) || current[segment] === undefined) {
      // Create the appropriate container based on the next segment type
      current[segment] = typeof nextSegment === 'number' ? [] : {};
    }
    
    current = current[segment] as Record<string, unknown>;
  }
  
  const lastSegment = segments[segments.length - 1];
  if (typeof lastSegment === 'string') {
    current[lastSegment] = value;
  } else if (typeof lastSegment === 'number' && Array.isArray(current)) {
    current[lastSegment] = value;
  }
}

/**
 * ValidationEngine class providing an object-oriented interface
 * 
 * This class wraps the functional validation methods for use cases
 * that prefer an object-oriented approach.
 */
export class ValidationEngine {
  /**
   * Validates an entire agent configuration
   * 
   * @param config - The configuration to validate
   * @returns ValidationResult with isValid flag and errors
   */
  validate(config: AgentConfiguration): ValidationResult {
    return validate(config);
  }

  /**
   * Validates a single field by path
   * 
   * @param path - Dot-notation path to the field
   * @param value - The value to validate
   * @param fullConfig - Optional full configuration for context
   * @returns Error message if invalid, null if valid
   */
  validateField(
    path: string,
    value: unknown,
    fullConfig?: AgentConfiguration
  ): string | null {
    return validateField(path, value, fullConfig);
  }
}

// Export a singleton instance for convenience
export const validationEngine = new ValidationEngine();

// Default export for the class
export default ValidationEngine;
