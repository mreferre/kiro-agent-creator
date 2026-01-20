import type { AgentConfiguration, ValidationErrors, Hook, ToolHook, HooksConfig } from '../types/agent-config';
import { FieldWithTooltip } from './FieldWithTooltip';

/**
 * Props for the HooksSection component
 */
interface HooksSectionProps {
  config: Pick<AgentConfiguration, 'hooks'>;
  onChange: (updates: Partial<AgentConfiguration>) => void;
  errors: ValidationErrors;
}

/**
 * Hook trigger types
 */
type HookTrigger = 'agentSpawn' | 'userPromptSubmit' | 'preToolUse' | 'postToolUse' | 'stop';

/**
 * Field documentation for tooltips
 */
const fieldDocs = {
  hooks: {
    tooltip: 'Configure hooks that run at various trigger points during agent execution.',
    example: 'agentSpawn: run setup scripts; preToolUse: validate tool calls',
  },
  command: {
    tooltip: 'The shell command to execute when this hook is triggered.',
    example: 'npm run lint, ./scripts/validate.sh',
  },
  timeout_ms: {
    tooltip: 'Maximum time in milliseconds to wait for the hook to complete.',
    example: '5000',
  },
  cache_ttl_seconds: {
    tooltip: 'How long to cache the hook result in seconds.',
    example: '300',
  },
  matcher: {
    tooltip: 'Pattern to match tool names. Use * for wildcard.',
    example: 'fs_write, *, mcp_*',
  },
};

/**
 * Hook trigger labels and descriptions
 */
const triggerInfo: Record<HookTrigger, { label: string; description: string; hasMatcher: boolean }> = {
  agentSpawn: {
    label: 'Agent Spawn',
    description: 'Runs when the agent starts',
    hasMatcher: false,
  },
  userPromptSubmit: {
    label: 'User Prompt Submit',
    description: 'Runs when the user submits a prompt',
    hasMatcher: false,
  },
  preToolUse: {
    label: 'Pre Tool Use',
    description: 'Runs before a tool is executed',
    hasMatcher: true,
  },
  postToolUse: {
    label: 'Post Tool Use',
    description: 'Runs after a tool is executed',
    hasMatcher: true,
  },
  stop: {
    label: 'Stop',
    description: 'Runs when the agent stops',
    hasMatcher: false,
  },
};

/**
 * HooksSection Component
 * 
 * Handles hooks configuration:
 * - Separate subsections for each hook type
 * - Add/remove hooks in each section
 * - Matcher field for tool-specific hooks
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
export function HooksSection({ config, onChange, errors }: HooksSectionProps) {
  const hooks = config.hooks || {};

  /**
   * Update hooks config
   */
  const updateHooks = (newHooks: HooksConfig) => {
    // Clean up empty arrays
    const cleaned: HooksConfig = {};
    for (const [key, value] of Object.entries(newHooks)) {
      if (Array.isArray(value) && value.length > 0) {
        cleaned[key as keyof HooksConfig] = value as Hook[] & ToolHook[];
      }
    }
    onChange({ hooks: Object.keys(cleaned).length > 0 ? cleaned : undefined });
  };

  /**
   * Add a hook to a trigger
   */
  const handleAddHook = (trigger: HookTrigger) => {
    const hasMatcher = triggerInfo[trigger].hasMatcher;
    const newHook = hasMatcher 
      ? { command: '', matcher: '' } as ToolHook
      : { command: '' } as Hook;
    
    const currentHooks = hooks[trigger] || [];
    updateHooks({
      ...hooks,
      [trigger]: [...currentHooks, newHook],
    });
  };

  /**
   * Remove a hook from a trigger
   */
  const handleRemoveHook = (trigger: HookTrigger, index: number) => {
    const currentHooks = hooks[trigger] || [];
    const newHooks = currentHooks.filter((_, i) => i !== index);
    updateHooks({
      ...hooks,
      [trigger]: newHooks,
    });
  };

  /**
   * Update a hook field
   */
  const handleHookChange = (trigger: HookTrigger, index: number, field: string, value: unknown) => {
    const currentHooks = [...(hooks[trigger] || [])] as (Hook | ToolHook)[];
    const hook = { ...currentHooks[index] };
    (hook as Record<string, unknown>)[field] = value;
    
    // Clean up undefined/empty values
    if (value === undefined || value === '') {
      delete (hook as Record<string, unknown>)[field];
    }
    
    currentHooks[index] = hook;
    updateHooks({
      ...hooks,
      [trigger]: currentHooks,
    });
  };

  /**
   * Render a single hook form
   */
  const renderHookForm = (trigger: HookTrigger, hook: Hook | ToolHook, index: number) => {
    const hasMatcher = triggerInfo[trigger].hasMatcher;
    const hookError = errors[`hooks.${trigger}.${index}`];

    return (
      <div 
        key={index}
        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3"
        data-testid={`hook-${trigger}-${index}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Hook #{index + 1}
          </span>
          <button
            type="button"
            onClick={() => handleRemoveHook(trigger, index)}
            className="p-1 text-red-500 hover:text-red-700"
            title="Remove hook"
            data-testid={`hook-${trigger}-${index}-remove`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {hookError && (
          <p className="text-xs text-red-500">{hookError}</p>
        )}

        {/* Command */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Command
          </label>
          <input
            type="text"
            value={hook.command || ''}
            onChange={(e) => handleHookChange(trigger, index, 'command', e.target.value)}
            placeholder={fieldDocs.command.example}
            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            data-testid={`hook-${trigger}-${index}-command`}
          />
        </div>

        {/* Matcher (only for tool hooks) */}
        {hasMatcher && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Matcher
            </label>
            <input
              type="text"
              value={(hook as ToolHook).matcher || ''}
              onChange={(e) => handleHookChange(trigger, index, 'matcher', e.target.value)}
              placeholder={fieldDocs.matcher.example}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              data-testid={`hook-${trigger}-${index}-matcher`}
            />
          </div>
        )}

        {/* Timeout */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Timeout (ms)
          </label>
          <input
            type="number"
            value={hook.timeout_ms || ''}
            onChange={(e) => handleHookChange(trigger, index, 'timeout_ms', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder={fieldDocs.timeout_ms.example}
            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            data-testid={`hook-${trigger}-${index}-timeout`}
          />
        </div>

        {/* Cache TTL */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Cache TTL (seconds)
          </label>
          <input
            type="number"
            value={hook.cache_ttl_seconds || ''}
            onChange={(e) => handleHookChange(trigger, index, 'cache_ttl_seconds', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder={fieldDocs.cache_ttl_seconds.example}
            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            data-testid={`hook-${trigger}-${index}-cache-ttl`}
          />
        </div>
      </div>
    );
  };

  /**
   * Render a trigger section
   */
  const renderTriggerSection = (trigger: HookTrigger) => {
    const info = triggerInfo[trigger];
    const triggerHooks = hooks[trigger] || [];

    return (
      <div key={trigger} className="space-y-2" data-testid={`hooks-${trigger}`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {info.label}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {info.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleAddHook(trigger)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
            data-testid={`hooks-${trigger}-add`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        </div>

        {triggerHooks.length === 0 ? (
          <div className="text-xs text-gray-400 dark:text-gray-500 italic py-2">
            No hooks configured
          </div>
        ) : (
          <div className="space-y-2">
            {triggerHooks.map((hook, index) => renderHookForm(trigger, hook, index))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
        Hooks Configuration
      </h3>

      <FieldWithTooltip
        label="Hooks"
        tooltip={fieldDocs.hooks.tooltip}
        example={fieldDocs.hooks.example}
        error={errors.hooks}
      >
        <div className="space-y-6" data-testid="hooks">
          {(Object.keys(triggerInfo) as HookTrigger[]).map(renderTriggerSection)}
        </div>
      </FieldWithTooltip>
    </div>
  );
}

export default HooksSection;
