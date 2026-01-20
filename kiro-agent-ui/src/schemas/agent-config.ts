/**
 * Zod validation schemas for Kiro CLI Custom Agent Configuration
 * 
 * These schemas provide runtime validation for agent configuration objects.
 * They enforce the structure and constraints defined in the design document.
 * 
 * Validates: Requirements 4.4, 4.5
 */

import { z } from 'zod';

// ============================================================================
// Validation Patterns
// ============================================================================

/**
 * Pattern for valid keyboard shortcuts
 * Format: [ctrl+][shift+]key where key is a-z or 0-9
 * Examples: 'a', 'ctrl+a', 'shift+b', 'ctrl+shift+c'
 * 
 * Validates: Requirement 4.4
 */
export const keyboardShortcutPattern = /^(ctrl\+)?(shift\+)?[a-z0-9]$/;

/**
 * Pattern for valid tool references in aliases
 * Format: @server/tool_name
 * Examples: '@mcp-server/read_file', '@my-server/custom_tool'
 */
export const toolReferencePattern = /^@[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;

/**
 * Pattern for valid alias names (valid identifiers)
 * Must start with letter or underscore, followed by alphanumeric or underscore
 * Examples: 'myAlias', '_private', 'tool_v2'
 */
export const aliasNamePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

// ============================================================================
// MCP Server Schemas
// ============================================================================

/**
 * Schema for local MCP server configuration
 * Requires a command, with optional args, env, and timeout
 * 
 * Validates: Requirement 4.5 (local servers must have command)
 */
export const LocalMCPServerSchema = z.object({
  command: z.string().min(1, 'Command is required'),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  timeout: z.number().positive('Timeout must be a positive number').optional(),
});

/**
 * Schema for remote MCP server configuration
 * Requires type: 'http' and a valid URL
 * 
 * Validates: Requirement 4.5 (HTTP servers must have valid URL)
 */
export const RemoteMCPServerSchema = z.object({
  type: z.literal('http'),
  url: z.string().url('Must be a valid URL'),
});

/**
 * Union schema for MCP server configurations
 * Discriminates between local and remote based on presence of 'type' field
 */
export const MCPServerConfigSchema = z.union([
  LocalMCPServerSchema,
  RemoteMCPServerSchema,
]);

// ============================================================================
// Hook Schemas
// ============================================================================

/**
 * Schema for basic hook configuration
 * Requires a command, with optional timeout and cache TTL
 */
export const HookSchema = z.object({
  command: z.string().min(1, 'Command is required'),
  timeout_ms: z.number().positive('Timeout must be a positive number').optional(),
  cache_ttl_seconds: z.number().positive('Cache TTL must be a positive number').optional(),
});

/**
 * Schema for tool-specific hooks (preToolUse, postToolUse)
 * Extends HookSchema with a required matcher field
 */
export const ToolHookSchema = HookSchema.extend({
  matcher: z.string().min(1, 'Matcher is required'),
});

/**
 * Schema for the hooks configuration object
 */
export const HooksConfigSchema = z.object({
  agentSpawn: z.array(HookSchema).optional(),
  userPromptSubmit: z.array(HookSchema).optional(),
  preToolUse: z.array(ToolHookSchema).optional(),
  postToolUse: z.array(ToolHookSchema).optional(),
  stop: z.array(HookSchema).optional(),
});

// ============================================================================
// Resource Schemas
// ============================================================================

/**
 * Schema for knowledge base resource configuration
 */
export const KnowledgeBaseResourceSchema = z.object({
  type: z.literal('knowledgeBase'),
  source: z.string().min(1, 'Source is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  indexType: z.enum(['best', 'fast']).optional(),
  autoUpdate: z.boolean().optional(),
});

/**
 * Schema for resources - either a string URI or a knowledge base object
 */
export const ResourceSchema = z.union([
  z.string().min(1, 'Resource URI cannot be empty'),
  KnowledgeBaseResourceSchema,
]);

// ============================================================================
// Tool Settings Schemas
// ============================================================================

/**
 * Schema for write tool settings
 */
export const WriteToolSettingsSchema = z.object({
  allowedPaths: z.array(z.string()).optional(),
});

/**
 * Schema for shell tool settings
 */
export const ShellToolSettingsSchema = z.object({
  allowedCommands: z.array(z.string()).optional(),
  deniedCommands: z.array(z.string()).optional(),
  autoAllowReadonly: z.boolean().optional(),
});

/**
 * Schema for AWS tool settings
 */
export const AWSToolSettingsSchema = z.object({
  allowedServices: z.array(z.string()).optional(),
  autoAllowReadonly: z.boolean().optional(),
});

/**
 * Schema for the tool settings container
 */
export const ToolsSettingsSchema = z.object({
  write: WriteToolSettingsSchema.optional(),
  shell: ShellToolSettingsSchema.optional(),
  aws: AWSToolSettingsSchema.optional(),
});

// ============================================================================
// Tool Alias Validation
// ============================================================================

/**
 * Schema for validating tool alias entries
 * Key must be a valid tool reference (@server/tool_name)
 * Value must be a valid identifier
 */
export const ToolAliasKeySchema = z.string().regex(
  toolReferencePattern,
  'Tool reference must match format @server/tool_name'
);

export const ToolAliasValueSchema = z.string().regex(
  aliasNamePattern,
  'Alias must be a valid identifier (start with letter/underscore, contain only alphanumeric/underscore)'
);

// ============================================================================
// Main Configuration Schema
// ============================================================================

/**
 * Complete schema for agent configuration
 * All fields are optional to support partial configurations
 * 
 * Validates: Requirements 4.4, 4.5
 */
export const AgentConfigurationSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  prompt: z.string().optional(),
  mcpServers: z.record(z.string(), MCPServerConfigSchema).optional(),
  tools: z.array(z.string()).optional(),
  toolAliases: z.record(
    ToolAliasKeySchema,
    ToolAliasValueSchema
  ).optional(),
  allowedTools: z.array(z.string()).optional(),
  toolsSettings: ToolsSettingsSchema.optional(),
  resources: z.array(ResourceSchema).optional(),
  hooks: HooksConfigSchema.optional(),
  includeMcpJson: z.boolean().optional(),
  model: z.string().optional(),
  keyboardShortcut: z.string()
    .regex(keyboardShortcutPattern, 'Invalid keyboard shortcut format. Use: [ctrl+][shift+]key (e.g., ctrl+a, shift+b)')
    .optional(),
  welcomeMessage: z.string().optional(),
});

// ============================================================================
// Type Inference
// ============================================================================

/**
 * Inferred types from Zod schemas
 * These can be used as alternatives to the manually defined types
 */
export type InferredLocalMCPServer = z.infer<typeof LocalMCPServerSchema>;
export type InferredRemoteMCPServer = z.infer<typeof RemoteMCPServerSchema>;
export type InferredMCPServerConfig = z.infer<typeof MCPServerConfigSchema>;
export type InferredHook = z.infer<typeof HookSchema>;
export type InferredToolHook = z.infer<typeof ToolHookSchema>;
export type InferredHooksConfig = z.infer<typeof HooksConfigSchema>;
export type InferredKnowledgeBaseResource = z.infer<typeof KnowledgeBaseResourceSchema>;
export type InferredResource = z.infer<typeof ResourceSchema>;
export type InferredToolsSettings = z.infer<typeof ToolsSettingsSchema>;
export type InferredAgentConfiguration = z.infer<typeof AgentConfigurationSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates a keyboard shortcut string
 * @param shortcut - The keyboard shortcut to validate
 * @returns true if valid, false otherwise
 */
export function isValidKeyboardShortcut(shortcut: string): boolean {
  return keyboardShortcutPattern.test(shortcut);
}

/**
 * Validates a tool reference string
 * @param reference - The tool reference to validate
 * @returns true if valid, false otherwise
 */
export function isValidToolReference(reference: string): boolean {
  return toolReferencePattern.test(reference);
}

/**
 * Validates an alias name string
 * @param alias - The alias name to validate
 * @returns true if valid, false otherwise
 */
export function isValidAliasName(alias: string): boolean {
  return aliasNamePattern.test(alias);
}

/**
 * Checks if an MCP server config is a local server
 * @param config - The MCP server configuration
 * @returns true if local server, false if remote
 */
export function isLocalMCPServer(config: z.infer<typeof MCPServerConfigSchema>): config is z.infer<typeof LocalMCPServerSchema> {
  return !('type' in config) || config.type !== 'http';
}

/**
 * Checks if an MCP server config is a remote server
 * @param config - The MCP server configuration
 * @returns true if remote server, false if local
 */
export function isRemoteMCPServer(config: z.infer<typeof MCPServerConfigSchema>): config is z.infer<typeof RemoteMCPServerSchema> {
  return 'type' in config && config.type === 'http';
}

/**
 * Checks if a resource is a knowledge base resource
 * @param resource - The resource to check
 * @returns true if knowledge base, false if string URI
 */
export function isKnowledgeBaseResource(resource: z.infer<typeof ResourceSchema>): resource is z.infer<typeof KnowledgeBaseResourceSchema> {
  return typeof resource === 'object' && resource.type === 'knowledgeBase';
}
