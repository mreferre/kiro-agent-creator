import type { AgentConfiguration, ValidationErrors, ToolsSettings } from '../types/agent-config';
import { FieldWithTooltip } from './FieldWithTooltip';
import { ArrayField } from './ArrayField';

/**
 * Props for the ToolSettingsSection component
 */
interface ToolSettingsSectionProps {
  config: Pick<AgentConfiguration, 'toolsSettings'>;
  onChange: (updates: Partial<AgentConfiguration>) => void;
  errors: ValidationErrors;
}

/**
 * Field documentation for tooltips
 */
const fieldDocs = {
  toolsSettings: {
    tooltip: 'Configure settings for specific tools like write, shell, and AWS.',
    example: 'Restrict write paths, allow specific shell commands',
  },
  write: {
    allowedPaths: {
      tooltip: 'Glob patterns for paths the write tool is allowed to modify.',
      example: 'src/**, tests/**, !node_modules/**',
    },
  },
  shell: {
    allowedCommands: {
      tooltip: 'Shell commands that are explicitly allowed.',
      example: 'npm, yarn, git, ls',
    },
    deniedCommands: {
      tooltip: 'Shell commands that are explicitly denied.',
      example: 'rm -rf, sudo, chmod',
    },
    autoAllowReadonly: {
      tooltip: 'Automatically allow read-only commands without confirmation.',
    },
  },
  aws: {
    allowedServices: {
      tooltip: 'AWS services that are allowed to be used.',
      example: 's3, dynamodb, lambda',
    },
    autoAllowReadonly: {
      tooltip: 'Automatically allow read-only AWS operations without confirmation.',
    },
  },
};

/**
 * ToolSettingsSection Component
 * 
 * Handles tool-specific settings:
 * - Write tool: allowedPaths
 * - Shell tool: allowedCommands, deniedCommands, autoAllowReadonly
 * - AWS tool: allowedServices, autoAllowReadonly
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
export function ToolSettingsSection({ config, onChange, errors }: ToolSettingsSectionProps) {
  const toolsSettings = config.toolsSettings || {};

  /**
   * Update tools settings
   */
  const updateToolsSettings = (newSettings: ToolsSettings) => {
    // Clean up empty settings
    const cleaned: ToolsSettings = {};
    
    if (newSettings.write && Object.keys(newSettings.write).length > 0) {
      const write = { ...newSettings.write };
      if (write.allowedPaths && write.allowedPaths.length === 0) {
        delete write.allowedPaths;
      }
      if (Object.keys(write).length > 0) {
        cleaned.write = write;
      }
    }
    
    if (newSettings.shell && Object.keys(newSettings.shell).length > 0) {
      const shell = { ...newSettings.shell };
      if (shell.allowedCommands && shell.allowedCommands.length === 0) {
        delete shell.allowedCommands;
      }
      if (shell.deniedCommands && shell.deniedCommands.length === 0) {
        delete shell.deniedCommands;
      }
      if (Object.keys(shell).length > 0) {
        cleaned.shell = shell;
      }
    }
    
    if (newSettings.aws && Object.keys(newSettings.aws).length > 0) {
      const aws = { ...newSettings.aws };
      if (aws.allowedServices && aws.allowedServices.length === 0) {
        delete aws.allowedServices;
      }
      if (Object.keys(aws).length > 0) {
        cleaned.aws = aws;
      }
    }
    
    onChange({ toolsSettings: Object.keys(cleaned).length > 0 ? cleaned : undefined });
  };

  /**
   * Handle write tool settings change
   */
  const handleWriteChange = (field: 'allowedPaths', value: string[]) => {
    updateToolsSettings({
      ...toolsSettings,
      write: {
        ...toolsSettings.write,
        [field]: value.length > 0 ? value : undefined,
      },
    });
  };

  /**
   * Handle shell tool settings change
   */
  const handleShellChange = (field: 'allowedCommands' | 'deniedCommands' | 'autoAllowReadonly', value: string[] | boolean | undefined) => {
    const shell = { ...toolsSettings.shell };
    if (value === undefined || (Array.isArray(value) && value.length === 0)) {
      delete shell[field as keyof typeof shell];
    } else {
      (shell as Record<string, unknown>)[field] = value;
    }
    updateToolsSettings({
      ...toolsSettings,
      shell,
    });
  };

  /**
   * Handle AWS tool settings change
   */
  const handleAwsChange = (field: 'allowedServices' | 'autoAllowReadonly', value: string[] | boolean | undefined) => {
    const aws = { ...toolsSettings.aws };
    if (value === undefined || (Array.isArray(value) && value.length === 0)) {
      delete aws[field as keyof typeof aws];
    } else {
      (aws as Record<string, unknown>)[field] = value;
    }
    updateToolsSettings({
      ...toolsSettings,
      aws,
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
        Tool Settings
      </h3>

      <FieldWithTooltip
        label="Tool Settings"
        tooltip={fieldDocs.toolsSettings.tooltip}
        example={fieldDocs.toolsSettings.example}
        error={errors.toolsSettings}
      >
        <div className="space-y-6" data-testid="tool-settings">
          {/* Write Tool Settings */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4" data-testid="tool-settings-write">
            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Write Tool
            </h4>
            
            <ArrayField
              label="Allowed Paths"
              tooltip={fieldDocs.write.allowedPaths.tooltip}
              example={fieldDocs.write.allowedPaths.example}
              items={toolsSettings.write?.allowedPaths || []}
              onChange={(paths) => handleWriteChange('allowedPaths', paths)}
              placeholder="e.g., src/**"
              error={errors['toolsSettings.write.allowedPaths']}
              testId="tool-settings-write-allowedPaths"
            />
          </div>

          {/* Shell Tool Settings */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4" data-testid="tool-settings-shell">
            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Shell Tool
            </h4>
            
            <ArrayField
              label="Allowed Commands"
              tooltip={fieldDocs.shell.allowedCommands.tooltip}
              example={fieldDocs.shell.allowedCommands.example}
              items={toolsSettings.shell?.allowedCommands || []}
              onChange={(commands) => handleShellChange('allowedCommands', commands)}
              placeholder="e.g., npm"
              error={errors['toolsSettings.shell.allowedCommands']}
              testId="tool-settings-shell-allowedCommands"
            />
            
            <ArrayField
              label="Denied Commands"
              tooltip={fieldDocs.shell.deniedCommands.tooltip}
              example={fieldDocs.shell.deniedCommands.example}
              items={toolsSettings.shell?.deniedCommands || []}
              onChange={(commands) => handleShellChange('deniedCommands', commands)}
              placeholder="e.g., rm -rf"
              error={errors['toolsSettings.shell.deniedCommands']}
              testId="tool-settings-shell-deniedCommands"
            />
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="shell-autoAllowReadonly"
                checked={toolsSettings.shell?.autoAllowReadonly || false}
                onChange={(e) => handleShellChange('autoAllowReadonly', e.target.checked || undefined)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                data-testid="tool-settings-shell-autoAllowReadonly"
              />
              <label htmlFor="shell-autoAllowReadonly" className="text-sm text-gray-700 dark:text-gray-300">
                Auto-allow read-only commands
              </label>
            </div>
          </div>

          {/* AWS Tool Settings */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4" data-testid="tool-settings-aws">
            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
              AWS Tool
            </h4>
            
            <ArrayField
              label="Allowed Services"
              tooltip={fieldDocs.aws.allowedServices.tooltip}
              example={fieldDocs.aws.allowedServices.example}
              items={toolsSettings.aws?.allowedServices || []}
              onChange={(services) => handleAwsChange('allowedServices', services)}
              placeholder="e.g., s3"
              error={errors['toolsSettings.aws.allowedServices']}
              testId="tool-settings-aws-allowedServices"
            />
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="aws-autoAllowReadonly"
                checked={toolsSettings.aws?.autoAllowReadonly || false}
                onChange={(e) => handleAwsChange('autoAllowReadonly', e.target.checked || undefined)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                data-testid="tool-settings-aws-autoAllowReadonly"
              />
              <label htmlFor="aws-autoAllowReadonly" className="text-sm text-gray-700 dark:text-gray-300">
                Auto-allow read-only operations
              </label>
            </div>
          </div>
        </div>
      </FieldWithTooltip>
    </div>
  );
}

export default ToolSettingsSection;
