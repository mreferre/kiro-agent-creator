import { useState } from 'react';
import type { AgentConfiguration, ValidationErrors, MCPServerConfig, LocalMCPServer, RemoteMCPServer } from '../types/agent-config';
import { FieldWithTooltip } from './FieldWithTooltip';
import { KeyValueField } from './KeyValueField';
import type { KeyValuePair } from './KeyValueField';

/**
 * Props for the MCPServersSection component
 */
interface MCPServersSectionProps {
  config: Pick<AgentConfiguration, 'mcpServers'>;
  onChange: (updates: Partial<AgentConfiguration>) => void;
  errors: ValidationErrors;
}

/**
 * Field documentation for tooltips
 */
const fieldDocs = {
  mcpServers: {
    tooltip: 'Configure MCP (Model Context Protocol) servers that provide tools to the agent. Servers can be local (command-based) or remote (HTTP).',
    example: 'Local: command="uvx", args=["mcp-server"]; HTTP: url="https://api.example.com/mcp"',
  },
  serverName: {
    tooltip: 'A unique name to identify this MCP server. Used to reference tools from this server.',
    example: 'my-mcp-server',
  },
  command: {
    tooltip: 'The command to execute to start the local MCP server.',
    example: 'uvx, npx, python',
  },
  args: {
    tooltip: 'Command-line arguments to pass to the server command.',
    example: 'mcp-server, --port, 3000',
  },
  env: {
    tooltip: 'Environment variables to set when running the server.',
    example: 'API_KEY=xxx, DEBUG=true',
  },
  timeout: {
    tooltip: 'Timeout in milliseconds for server operations.',
    example: '30000',
  },
  url: {
    tooltip: 'The URL of the remote HTTP MCP server.',
    example: 'https://api.example.com/mcp',
  },
};

/**
 * Helper to check if a server config is local
 */
function isLocalServer(config: MCPServerConfig): config is LocalMCPServer {
  return !('type' in config) || (config as RemoteMCPServer).type !== 'http';
}

/**
 * MCPServersSection Component
 * 
 * Handles MCP server configuration:
 * - Add/remove servers
 * - Toggle between local and HTTP server types
 * - Configure server-specific fields
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */
export function MCPServersSection({ config, onChange, errors }: MCPServersSectionProps) {
  const [newServerName, setNewServerName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const servers = config.mcpServers || {};
  const serverNames = Object.keys(servers);

  /**
   * Add a new server
   */
  const handleAddServer = () => {
    if (!newServerName.trim()) return;
    
    // Check for duplicate names
    if (servers[newServerName]) {
      return; // Could show error, but validation will catch it
    }

    const newServers = {
      ...servers,
      [newServerName]: { command: '' } as LocalMCPServer,
    };
    onChange({ mcpServers: newServers });
    setNewServerName('');
    setShowAddForm(false);
  };

  /**
   * Remove a server
   */
  const handleRemoveServer = (name: string) => {
    const newServers = { ...servers };
    delete newServers[name];
    onChange({ mcpServers: Object.keys(newServers).length > 0 ? newServers : undefined });
  };

  /**
   * Toggle server type between local and HTTP
   */
  const handleToggleServerType = (name: string) => {
    const server = servers[name];
    const isLocal = isLocalServer(server);
    
    const newServers = {
      ...servers,
      [name]: isLocal 
        ? { type: 'http' as const, url: '' } as RemoteMCPServer
        : { command: '' } as LocalMCPServer,
    };
    onChange({ mcpServers: newServers });
  };

  /**
   * Update a local server field
   */
  const handleLocalServerChange = (name: string, field: keyof LocalMCPServer, value: unknown) => {
    const server = servers[name] as LocalMCPServer;
    const newServer = { ...server, [field]: value };
    
    // Clean up undefined/empty values
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      delete newServer[field];
    }
    
    const newServers = { ...servers, [name]: newServer };
    onChange({ mcpServers: newServers });
  };

  /**
   * Update a remote server field
   */
  const handleRemoteServerChange = (name: string, field: keyof RemoteMCPServer, value: string) => {
    const server = servers[name] as RemoteMCPServer;
    const newServer = { ...server, [field]: value };
    const newServers = { ...servers, [name]: newServer };
    onChange({ mcpServers: newServers });
  };

  /**
   * Convert env Record to KeyValuePair array
   */
  const envToArray = (env: Record<string, string> | undefined): KeyValuePair[] => {
    if (!env) return [];
    return Object.entries(env).map(([key, value]) => ({ key, value }));
  };

  /**
   * Convert KeyValuePair array to env Record
   */
  const arrayToEnv = (pairs: KeyValuePair[]): Record<string, string> | undefined => {
    const env: Record<string, string> = {};
    for (const pair of pairs) {
      if (pair.key.trim() !== '') {
        env[pair.key] = pair.value;
      }
    }
    return Object.keys(env).length > 0 ? env : undefined;
  };

  /**
   * Convert args string array to comma-separated string for display
   */
  const argsToString = (args: string[] | undefined): string => {
    return args?.join(', ') || '';
  };

  /**
   * Convert comma-separated string to args array
   */
  const stringToArgs = (str: string): string[] | undefined => {
    const args = str.split(',').map(s => s.trim()).filter(s => s !== '');
    return args.length > 0 ? args : undefined;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
        MCP Servers Configuration
      </h3>

      <FieldWithTooltip
        label="MCP Servers"
        tooltip={fieldDocs.mcpServers.tooltip}
        example={fieldDocs.mcpServers.example}
        error={errors.mcpServers}
      >
        <div className="space-y-4" data-testid="mcp-servers">
          {serverNames.length === 0 && !showAddForm && (
            <div 
              className="text-sm text-gray-500 dark:text-gray-400 italic py-2 px-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-md"
              data-testid="mcp-servers-empty"
            >
              No MCP servers configured. Click "Add MCP Server" to add one.
            </div>
          )}

          {/* Existing servers */}
          {serverNames.map((name) => {
            const server = servers[name];
            const isLocal = isLocalServer(server);
            const serverError = errors[`mcpServers.${name}`];

            return (
              <div 
                key={name}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
                data-testid={`mcp-server-${name}`}
              >
                {/* Server header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">{name}</span>
                    {serverError && (
                      <span className="text-xs text-red-500">{serverError}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Type toggle */}
                    <div className="flex items-center gap-1 text-sm">
                      <button
                        type="button"
                        onClick={() => handleToggleServerType(name)}
                        className={`px-2 py-1 rounded-l ${isLocal ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                        data-testid={`mcp-server-${name}-local-btn`}
                      >
                        Local
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleServerType(name)}
                        className={`px-2 py-1 rounded-r ${!isLocal ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                        data-testid={`mcp-server-${name}-http-btn`}
                      >
                        HTTP
                      </button>
                    </div>
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveServer(name)}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Remove server"
                      data-testid={`mcp-server-${name}-remove`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Server fields */}
                {isLocal ? (
                  <div className="space-y-3">
                    {/* Command */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Command
                      </label>
                      <input
                        type="text"
                        value={(server as LocalMCPServer).command || ''}
                        onChange={(e) => handleLocalServerChange(name, 'command', e.target.value)}
                        placeholder={fieldDocs.command.example}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        data-testid={`mcp-server-${name}-command`}
                      />
                    </div>

                    {/* Args */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Arguments (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={argsToString((server as LocalMCPServer).args)}
                        onChange={(e) => handleLocalServerChange(name, 'args', stringToArgs(e.target.value))}
                        placeholder={fieldDocs.args.example}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        data-testid={`mcp-server-${name}-args`}
                      />
                    </div>

                    {/* Env */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Environment Variables
                      </label>
                      <KeyValueField
                        label=""
                        tooltip={fieldDocs.env.tooltip}
                        items={envToArray((server as LocalMCPServer).env)}
                        onChange={(pairs) => handleLocalServerChange(name, 'env', arrayToEnv(pairs))}
                        keyPlaceholder="Variable name"
                        valuePlaceholder="Value"
                        keyLabel="Name"
                        valueLabel="Value"
                        testId={`mcp-server-${name}-env`}
                      />
                    </div>

                    {/* Timeout */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Timeout (ms)
                      </label>
                      <input
                        type="number"
                        value={(server as LocalMCPServer).timeout || ''}
                        onChange={(e) => handleLocalServerChange(name, 'timeout', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder={fieldDocs.timeout.example}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        data-testid={`mcp-server-${name}-timeout`}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* URL */}
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      URL
                    </label>
                    <input
                      type="url"
                      value={(server as RemoteMCPServer).url || ''}
                      onChange={(e) => handleRemoteServerChange(name, 'url', e.target.value)}
                      placeholder={fieldDocs.url.example}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      data-testid={`mcp-server-${name}-url`}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Add server form */}
          {showAddForm ? (
            <div className="border border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  placeholder="Server name"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  data-testid="mcp-server-new-name"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddServer()}
                />
                <button
                  type="button"
                  onClick={handleAddServer}
                  disabled={!newServerName.trim()}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  data-testid="mcp-server-add-confirm"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setNewServerName(''); }}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                  data-testid="mcp-server-add-cancel"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
              data-testid="mcp-server-add"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add MCP Server
            </button>
          )}
        </div>
      </FieldWithTooltip>
    </div>
  );
}

export default MCPServersSection;
