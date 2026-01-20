import type { AgentConfiguration, ValidationErrors } from '../types/agent-config';
import { FieldWithTooltip } from './FieldWithTooltip';

/**
 * Props for the BasicFieldsSection component
 */
interface BasicFieldsSectionProps {
  config: Pick<AgentConfiguration, 'name' | 'description' | 'prompt' | 'model' | 'keyboardShortcut' | 'welcomeMessage' | 'includeMcpJson'>;
  onChange: (updates: Partial<AgentConfiguration>) => void;
  errors: ValidationErrors;
}

/**
 * Field documentation for tooltips
 * Requirements: 5.1, 5.2, 5.3
 */
const fieldDocs = {
  name: {
    tooltip: 'A unique identifier for your custom agent. This name will be used to reference the agent in the CLI.',
    example: 'my-custom-agent',
  },
  description: {
    tooltip: 'A brief description of what your agent does. This helps identify the agent\'s purpose.',
    example: 'A specialized agent for backend development',
  },
  prompt: {
    tooltip: 'The system prompt that defines your agent\'s behavior, personality, and capabilities. This is the main instruction set for the agent.',
    example: 'You are a helpful assistant specialized in Rust backend development...',
  },
  model: {
    tooltip: 'The AI model to use for this agent. Different models have different capabilities and costs.',
    example: 'claude-sonnet-4-20250514',
  },
  keyboardShortcut: {
    tooltip: 'A keyboard shortcut to quickly activate this agent. Format: [ctrl+][shift+]key',
    example: 'ctrl+shift+a',
  },
  welcomeMessage: {
    tooltip: 'A message displayed when the agent is first activated. Use this to greet users and explain what the agent can do.',
    example: 'Hello! I\'m your specialized assistant for backend development.',
  },
  includeMcpJson: {
    tooltip: 'When enabled, includes the MCP server configuration JSON in the agent context. Useful for debugging MCP integrations.',
  },
};

/**
 * BasicFieldsSection Component
 * 
 * Handles the basic configuration fields:
 * - name (text input)
 * - description (text input)
 * - prompt (textarea - larger for system prompts)
 * - model (text input)
 * - keyboardShortcut (text input with format hint)
 * - welcomeMessage (textarea)
 * - includeMcpJson (checkbox/toggle)
 * 
 * Requirements: 1.2, 1.3, 1.4
 */
export function BasicFieldsSection({ config, onChange, errors }: BasicFieldsSectionProps) {
  /**
   * Helper to handle text input changes
   * Sets value to undefined if empty to keep config clean
   */
  const handleTextChange = (field: keyof Pick<AgentConfiguration, 'name' | 'description' | 'prompt' | 'model' | 'keyboardShortcut' | 'welcomeMessage'>) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      onChange({ [field]: value || undefined });
    };

  /**
   * Helper to handle checkbox changes
   */
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ includeMcpJson: e.target.checked || undefined });
  };

  /**
   * Helper to get error class for a field
   */
  const getInputClassName = (fieldName: string) => {
    const baseClasses = "w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white";
    const errorClasses = errors[fieldName] 
      ? "border-red-500 dark:border-red-500" 
      : "border-gray-300 dark:border-gray-600";
    return `${baseClasses} ${errorClasses}`;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
        Basic Configuration
      </h3>

      {/* Name Field */}
      <FieldWithTooltip
        label="Agent Name"
        tooltip={fieldDocs.name.tooltip}
        example={fieldDocs.name.example}
        error={errors.name}
        htmlFor="name"
      >
        <input
          id="name"
          type="text"
          placeholder="e.g., my-custom-agent"
          value={config.name || ''}
          onChange={handleTextChange('name')}
          className={getInputClassName('name')}
          data-testid="basic-field-name"
        />
      </FieldWithTooltip>

      {/* Description Field */}
      <FieldWithTooltip
        label="Description"
        tooltip={fieldDocs.description.tooltip}
        example={fieldDocs.description.example}
        error={errors.description}
        htmlFor="description"
      >
        <input
          id="description"
          type="text"
          placeholder="e.g., A specialized agent for backend development"
          value={config.description || ''}
          onChange={handleTextChange('description')}
          className={getInputClassName('description')}
          data-testid="basic-field-description"
        />
      </FieldWithTooltip>

      {/* Prompt Field (Textarea for system prompts) */}
      <FieldWithTooltip
        label="System Prompt"
        tooltip={fieldDocs.prompt.tooltip}
        example={fieldDocs.prompt.example}
        error={errors.prompt}
        htmlFor="prompt"
      >
        <textarea
          id="prompt"
          placeholder="e.g., You are a helpful assistant specialized in..."
          value={config.prompt || ''}
          onChange={handleTextChange('prompt')}
          rows={6}
          className={getInputClassName('prompt')}
          data-testid="basic-field-prompt"
        />
      </FieldWithTooltip>

      {/* Model Field */}
      <FieldWithTooltip
        label="Model"
        tooltip={fieldDocs.model.tooltip}
        example={fieldDocs.model.example}
        error={errors.model}
        htmlFor="model"
      >
        <input
          id="model"
          type="text"
          placeholder="e.g., claude-sonnet-4-20250514"
          value={config.model || ''}
          onChange={handleTextChange('model')}
          className={getInputClassName('model')}
          data-testid="basic-field-model"
        />
      </FieldWithTooltip>

      {/* Keyboard Shortcut Field */}
      <FieldWithTooltip
        label="Keyboard Shortcut"
        tooltip={fieldDocs.keyboardShortcut.tooltip}
        example={fieldDocs.keyboardShortcut.example}
        error={errors.keyboardShortcut}
        htmlFor="keyboardShortcut"
      >
        <input
          id="keyboardShortcut"
          type="text"
          placeholder="e.g., ctrl+shift+a"
          value={config.keyboardShortcut || ''}
          onChange={handleTextChange('keyboardShortcut')}
          className={getInputClassName('keyboardShortcut')}
          data-testid="basic-field-keyboardShortcut"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Format: [ctrl+][shift+]key (e.g., ctrl+a, shift+b, ctrl+shift+k)
        </p>
      </FieldWithTooltip>

      {/* Welcome Message Field (Textarea) */}
      <FieldWithTooltip
        label="Welcome Message"
        tooltip={fieldDocs.welcomeMessage.tooltip}
        example={fieldDocs.welcomeMessage.example}
        error={errors.welcomeMessage}
        htmlFor="welcomeMessage"
      >
        <textarea
          id="welcomeMessage"
          placeholder="e.g., Hello! I'm your specialized assistant for..."
          value={config.welcomeMessage || ''}
          onChange={handleTextChange('welcomeMessage')}
          rows={3}
          className={getInputClassName('welcomeMessage')}
          data-testid="basic-field-welcomeMessage"
        />
      </FieldWithTooltip>

      {/* Include MCP JSON Checkbox */}
      <FieldWithTooltip
        label="Include MCP JSON"
        tooltip={fieldDocs.includeMcpJson.tooltip}
        htmlFor="includeMcpJson"
        error={errors.includeMcpJson}
      >
        <div className="flex items-center">
          <input
            id="includeMcpJson"
            type="checkbox"
            checked={config.includeMcpJson || false}
            onChange={handleCheckboxChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
            data-testid="basic-field-includeMcpJson"
          />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            Enable to include MCP configuration in agent context
          </span>
        </div>
      </FieldWithTooltip>
    </div>
  );
}

export default BasicFieldsSection;
