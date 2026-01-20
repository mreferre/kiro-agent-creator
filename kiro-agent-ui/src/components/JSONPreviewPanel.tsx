import { useState, useCallback, useMemo } from 'react';
import type { AgentConfiguration } from '../types/agent-config';

/**
 * Props for the JSONPreviewPanel component
 */
export interface JSONPreviewPanelProps {
  /** The current agent configuration to display */
  config: AgentConfiguration;
  /** Whether the panel is visible */
  isVisible: boolean;
  /** Callback to toggle panel visibility */
  onToggle: () => void;
  /** Callback when copy button is clicked */
  onCopy: () => void;
}

/**
 * Syntax highlighting token types for JSON
 */
type TokenType = 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punctuation';

/**
 * Get the CSS class for a token type
 */
function getTokenClass(type: TokenType): string {
  switch (type) {
    case 'key':
      return 'text-purple-600 dark:text-purple-400';
    case 'string':
      return 'text-green-600 dark:text-green-400';
    case 'number':
      return 'text-blue-600 dark:text-blue-400';
    case 'boolean':
      return 'text-orange-600 dark:text-orange-400';
    case 'null':
      return 'text-gray-500 dark:text-gray-400';
    case 'punctuation':
      return 'text-gray-700 dark:text-gray-300';
    default:
      return 'text-gray-800 dark:text-gray-200';
  }
}

/**
 * Syntax highlight a JSON string and return React elements
 * Uses a simple regex-based approach for highlighting
 */
function syntaxHighlightJSON(json: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let key = 0;

  // Regex patterns for different JSON tokens
  // Order matters - more specific patterns first
  const patterns: Array<{ regex: RegExp; type: TokenType }> = [
    // Keys (property names) - must be followed by a colon
    { regex: /"([^"\\]|\\.)*"\s*(?=:)/g, type: 'key' },
    // String values
    { regex: /"([^"\\]|\\.)*"/g, type: 'string' },
    // Numbers (including negative and decimals)
    { regex: /-?\d+\.?\d*([eE][+-]?\d+)?/g, type: 'number' },
    // Booleans
    { regex: /\b(true|false)\b/g, type: 'boolean' },
    // Null
    { regex: /\bnull\b/g, type: 'null' },
    // Punctuation (braces, brackets, colons, commas)
    { regex: /[{}[\]:,]/g, type: 'punctuation' },
  ];

  // Build a combined regex with named groups
  let lastIndex = 0;
  const combinedRegex = new RegExp(
    patterns.map((p) => `(${p.regex.source})`).join('|'),
    'g'
  );

  let match;
  while ((match = combinedRegex.exec(json)) !== null) {
    // Add any text before this match as plain text
    if (match.index > lastIndex) {
      elements.push(
        <span key={key++}>{json.slice(lastIndex, match.index)}</span>
      );
    }

    // Determine which pattern matched
    let tokenType: TokenType = 'punctuation';
    for (let i = 0; i < patterns.length; i++) {
      if (match[i + 1] !== undefined) {
        tokenType = patterns[i].type;
        break;
      }
    }

    // Add the highlighted token
    elements.push(
      <span key={key++} className={getTokenClass(tokenType)}>
        {match[0]}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text
  if (lastIndex < json.length) {
    elements.push(<span key={key++}>{json.slice(lastIndex)}</span>);
  }

  return elements;
}

/**
 * Clean configuration by removing empty/undefined values
 * Only includes fields that have been explicitly set
 */
function cleanConfig(config: AgentConfiguration): AgentConfiguration {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(config)) {
    // Skip undefined and null values
    if (value === undefined || value === null) continue;

    // Skip empty strings
    if (typeof value === 'string' && value === '') continue;

    // Skip empty arrays
    if (Array.isArray(value) && value.length === 0) continue;

    // Skip empty objects
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) continue;

    // Include the value
    cleaned[key] = value;
  }

  return cleaned as AgentConfiguration;
}

/**
 * JSONPreviewPanel Component
 * 
 * Displays a live JSON preview of the current agent configuration with:
 * - Syntax highlighting for different JSON elements
 * - Toggle visibility button
 * - Copy to clipboard button with visual feedback
 * 
 * Requirements: 11.1, 11.3, 11.4, 11.5
 */
export function JSONPreviewPanel({
  config,
  isVisible,
  onToggle,
  onCopy,
}: JSONPreviewPanelProps) {
  // State for copy feedback
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  // Clean and format the JSON with 2-space indentation
  const formattedJSON = useMemo(() => {
    const cleaned = cleanConfig(config);
    return JSON.stringify(cleaned, null, 2) || '{}';
  }, [config]);

  // Syntax highlighted JSON elements
  const highlightedJSON = useMemo(() => {
    return syntaxHighlightJSON(formattedJSON);
  }, [formattedJSON]);

  // Handle copy to clipboard with feedback
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formattedJSON);
      setCopyFeedback(true);
      onCopy();
      
      // Reset feedback after 2 seconds
      setTimeout(() => {
        setCopyFeedback(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [formattedJSON, onCopy]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className="w-1/2" data-testid="json-preview-panel">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-full overflow-auto">
        {/* Header with title and action buttons */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            JSON Preview
          </h2>
          <div className="flex items-center space-x-2">
            {/* Copy to Clipboard Button */}
            <button
              className={`px-3 py-1 text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                copyFeedback
                  ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700'
                  : 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              onClick={handleCopy}
              data-testid="copy-json-button"
              aria-label={copyFeedback ? 'Copied!' : 'Copy to clipboard'}
            >
              {copyFeedback ? (
                <span className="flex items-center">
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </span>
              ) : (
                <span className="flex items-center">
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </span>
              )}
            </button>
            {/* Toggle Visibility Button */}
            <button
              className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onToggle}
              data-testid="toggle-preview-button"
              aria-label="Hide preview"
            >
              <span className="flex items-center">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
                Hide
              </span>
            </button>
          </div>
        </div>

        {/* JSON Preview with Syntax Highlighting */}
        <pre
          className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 text-sm font-mono overflow-auto whitespace-pre-wrap break-words"
          data-testid="json-preview-content"
        >
          <code>{highlightedJSON}</code>
        </pre>
      </div>
    </div>
  );
}

export default JSONPreviewPanel;
