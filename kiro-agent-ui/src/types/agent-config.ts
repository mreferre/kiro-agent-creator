/**
 * TypeScript type definitions for Kiro CLI Custom Agent Configuration
 * 
 * These types define the structure of agent configuration files used by the Kiro CLI.
 * They support both local (command-based) and remote (HTTP) MCP servers, various
 * hook types, tool settings, and resource configurations.
 */

// ============================================================================
// MCP Server Configurations
// ============================================================================

/**
 * Configuration for a local MCP server that runs as a subprocess
 */
export interface LocalMCPServer {
  /** The command to execute to start the server */
  command: string;
  /** Optional command-line arguments */
  args?: string[];
  /** Optional environment variables */
  env?: Record<string, string>;
  /** Optional timeout in milliseconds */
  timeout?: number;
}

/**
 * Configuration for a remote MCP server accessed via HTTP
 */
export interface RemoteMCPServer {
  /** Must be 'http' to indicate a remote server */
  type: 'http';
  /** The URL of the remote MCP server */
  url: string;
}

/**
 * Union type for MCP server configurations - either local or remote
 */
export type MCPServerConfig = LocalMCPServer | RemoteMCPServer;

// ============================================================================
// Tool Settings
// ============================================================================

/**
 * Settings for the write tool
 */
export interface WriteToolSettings {
  /** Glob patterns for paths the write tool is allowed to modify */
  allowedPaths?: string[];
}

/**
 * Settings for the shell tool
 */
export interface ShellToolSettings {
  /** Commands that are explicitly allowed */
  allowedCommands?: string[];
  /** Commands that are explicitly denied */
  deniedCommands?: string[];
  /** Whether to automatically allow read-only commands */
  autoAllowReadonly?: boolean;
}

/**
 * Settings for the AWS tool
 */
export interface AWSToolSettings {
  /** AWS services that are allowed to be used */
  allowedServices?: string[];
  /** Whether to automatically allow read-only operations */
  autoAllowReadonly?: boolean;
}

/**
 * Container for all tool-specific settings
 */
export interface ToolsSettings {
  /** Settings for the write tool */
  write?: WriteToolSettings;
  /** Settings for the shell tool */
  shell?: ShellToolSettings;
  /** Settings for the AWS tool */
  aws?: AWSToolSettings;
}

// ============================================================================
// Resources
// ============================================================================

/**
 * Configuration for a knowledge base resource
 */
export interface KnowledgeBaseResource {
  /** Must be 'knowledgeBase' to indicate this resource type */
  type: 'knowledgeBase';
  /** The source path or URL for the knowledge base */
  source: string;
  /** A human-readable name for the knowledge base */
  name: string;
  /** Optional description of the knowledge base contents */
  description?: string;
  /** Indexing strategy: 'best' for quality, 'fast' for speed */
  indexType?: 'best' | 'fast';
  /** Whether to automatically update the index when source changes */
  autoUpdate?: boolean;
}

/**
 * A resource can be either a simple URI string (file://, skill://) or a knowledge base object
 */
export type Resource = string | KnowledgeBaseResource;

// ============================================================================
// Hooks
// ============================================================================

/**
 * Base hook configuration for commands that run at trigger points
 */
export interface Hook {
  /** The command to execute */
  command: string;
  /** Optional timeout in milliseconds */
  timeout_ms?: number;
  /** Optional cache TTL in seconds for hook results */
  cache_ttl_seconds?: number;
}

/**
 * Hook configuration for tool-specific hooks (preToolUse, postToolUse)
 * Extends Hook with a matcher pattern
 */
export interface ToolHook extends Hook {
  /** Pattern to match tool names (e.g., 'fs_write', '*') */
  matcher: string;
}

/**
 * Container for all hook configurations organized by trigger point
 */
export interface HooksConfig {
  /** Hooks that run when the agent spawns */
  agentSpawn?: Hook[];
  /** Hooks that run when the user submits a prompt */
  userPromptSubmit?: Hook[];
  /** Hooks that run before a tool is used */
  preToolUse?: ToolHook[];
  /** Hooks that run after a tool is used */
  postToolUse?: ToolHook[];
  /** Hooks that run when the agent stops */
  stop?: Hook[];
}

// ============================================================================
// Main Configuration
// ============================================================================

/**
 * The main agent configuration interface
 * All fields are optional to support partial configurations
 */
export interface AgentConfiguration {
  /** Human-readable name for the agent */
  name?: string;
  /** Description of what the agent does */
  description?: string;
  /** System prompt that defines the agent's behavior */
  prompt?: string;
  /** MCP servers available to the agent, keyed by server name */
  mcpServers?: Record<string, MCPServerConfig>;
  /** List of tool references the agent can use */
  tools?: string[];
  /** Mapping of original tool references to alias names */
  toolAliases?: Record<string, string>;
  /** List of tools that are pre-approved for use */
  allowedTools?: string[];
  /** Tool-specific settings */
  toolsSettings?: ToolsSettings;
  /** Resources available to the agent */
  resources?: Resource[];
  /** Hook configurations for various trigger points */
  hooks?: HooksConfig;
  /** Whether to include the mcp.json file */
  includeMcpJson?: boolean;
  /** The model to use for the agent */
  model?: string;
  /** Keyboard shortcut to activate the agent (e.g., 'ctrl+shift+a') */
  keyboardShortcut?: string;
  /** Welcome message displayed when the agent starts */
  welcomeMessage?: string;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation errors mapped by field path
 * Key is the dot-notation path to the field (e.g., 'mcpServers.myServer.command')
 * Value is the error message
 */
export interface ValidationErrors {
  [path: string]: string;
}

/**
 * Result of validating an agent configuration
 */
export interface ValidationResult {
  /** Whether the configuration is valid */
  isValid: boolean;
  /** Map of field paths to error messages */
  errors: ValidationErrors;
}

// ============================================================================
// Example Agent Types
// ============================================================================

/**
 * An example agent template with metadata
 */
export interface ExampleAgent {
  /** Unique identifier for the example */
  id: string;
  /** Display name for the example */
  name: string;
  /** Description of what the example demonstrates */
  description: string;
  /** The actual configuration */
  config: AgentConfiguration;
}
