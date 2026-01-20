import type { AgentConfiguration, ValidationErrors } from '../types/agent-config';
import { ArrayField } from './ArrayField';
import { KeyValueField } from './KeyValueField';
import type { KeyValuePair } from './KeyValueField';

/**
 * Props for the ToolsSection component
 */
interface ToolsSectionProps {
  config: Pick<AgentConfiguration, 'tools' | 'allowedTools' | 'toolAliases'>;
  onChange: (updates: Partial<AgentConfiguration>) => void;
  errors: ValidationErrors;
}

/**
 * Field documentation for tooltips
 */
const fieldDocs = {
  tools: {
    tooltip: 'List of MCP tool names that this agent can use. These tools must be available from configured MCP servers.',
    example: 'read_file, write_file, execute_command',
  },
  allowedTools: {
    tooltip: 'List of tools that are pre-approved for use without user confirmation. Use with caution.',
    example: 'read_file, list_directory',
  },
  toolAliases: {
    tooltip: 'Map original tool references to alias names. The key is the original tool reference (@server/tool_name), and the value is the alias name.',
    example: '@mcp-server/read_file → read, @mcp-server/write_file → write',
  },
};

/**
 * ToolsSection Component
 * 
 * Handles the tools configuration:
 * - tools (array of tool names)
 * - allowedTools (array of pre-approved tools)
 * 
 * Requirements: 6.1, 6.2, 6.3
 */
export function ToolsSection({ config, onChange, errors }: ToolsSectionProps) {
  /**
   * Handle tools array change
   * Keep empty strings while editing - they'll be filtered on export
   */
  const handleToolsChange = (tools: string[]) => {
    onChange({ tools: tools.length > 0 ? tools : undefined });
  };

  /**
   * Handle allowedTools array change
   * Keep empty strings while editing - they'll be filtered on export
   */
  const handleAllowedToolsChange = (allowedTools: string[]) => {
    onChange({ allowedTools: allowedTools.length > 0 ? allowedTools : undefined });
  };

  /**
   * Handle toolAliases change
   * Keep pairs while editing - they'll be filtered on export
   */
  const handleToolAliasesChange = (pairs: KeyValuePair[]) => {
    // Keep all pairs while editing, convert to record for state
    // Empty keys will be filtered on export
    if (pairs.length === 0) {
      onChange({ toolAliases: undefined });
      return;
    }
    
    // Store as a special format that preserves empty keys during editing
    // We'll use a temporary array storage approach
    const aliases: Record<string, string> = {};
    pairs.forEach((pair, index) => {
      // Use index-based key for empty keys to preserve them during editing
      const key = pair.key.trim() !== '' ? pair.key : `__empty_${index}__`;
      aliases[key] = pair.value;
    });
    onChange({ toolAliases: aliases });
  };

  /**
   * Convert toolAliases Record to KeyValuePair array for the component
   */
  const toolAliasesArray: KeyValuePair[] = config.toolAliases
    ? Object.entries(config.toolAliases).map(([key, value]) => ({
        // Convert back from index-based keys
        key: key.startsWith('__empty_') ? '' : key,
        value
      }))
    : [];

  return (
    <div className="space-y-6">
      <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
        Tools Configuration
      </h3>

      {/* Tools Array */}
      <ArrayField
        label="Tools"
        tooltip={fieldDocs.tools.tooltip}
        example={fieldDocs.tools.example}
        items={config.tools || []}
        onChange={handleToolsChange}
        placeholder="e.g., read_file"
        error={errors.tools}
        testId="tools-array"
      />

      {/* Allowed Tools Array */}
      <ArrayField
        label="Allowed Tools"
        tooltip={fieldDocs.allowedTools.tooltip}
        example={fieldDocs.allowedTools.example}
        items={config.allowedTools || []}
        onChange={handleAllowedToolsChange}
        placeholder="e.g., read_file"
        error={errors.allowedTools}
        testId="allowed-tools-array"
      />

      {/* Tool Aliases */}
      <KeyValueField
        label="Tool Aliases"
        tooltip={fieldDocs.toolAliases.tooltip}
        example={fieldDocs.toolAliases.example}
        items={toolAliasesArray}
        onChange={handleToolAliasesChange}
        keyPlaceholder="e.g., @server/read_file"
        valuePlaceholder="e.g., read"
        keyLabel="Tool Reference"
        valueLabel="Alias Name"
        error={errors.toolAliases}
        testId="tool-aliases"
      />
    </div>
  );
}

export default ToolsSection;
