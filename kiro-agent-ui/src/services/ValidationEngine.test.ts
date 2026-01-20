/**
 * Unit tests for ValidationEngine service
 * 
 * Tests the validation functionality including:
 * - Full configuration validation
 * - Single field validation
 * - Error path formatting
 * - Edge cases
 * - Property-based tests for validation completeness
 * 
 * Validates: Requirements 4.1, 4.2
 */

import { describe, it, expect } from 'vitest';
import { test, fc } from '@fast-check/vitest';
import { validate, validateField, ValidationEngine, validationEngine } from './ValidationEngine';
import type { AgentConfiguration } from '../types/agent-config';

describe('ValidationEngine', () => {
  describe('validate()', () => {
    it('should return valid result for empty configuration', () => {
      const config: AgentConfiguration = {};
      const result = validate(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return valid result for valid configuration', () => {
      const config: AgentConfiguration = {
        name: 'my-agent',
        description: 'A test agent',
        keyboardShortcut: 'ctrl+a',
        tools: ['read', 'write'],
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return error for invalid keyboard shortcut', () => {
      const config: AgentConfiguration = {
        keyboardShortcut: 'invalid-shortcut',
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('keyboardShortcut');
      expect(result.errors.keyboardShortcut).toContain('Invalid keyboard shortcut format');
    });

    it('should validate keyboard shortcut patterns correctly', () => {
      // Valid shortcuts
      expect(validate({ keyboardShortcut: 'a' }).isValid).toBe(true);
      expect(validate({ keyboardShortcut: 'ctrl+a' }).isValid).toBe(true);
      expect(validate({ keyboardShortcut: 'shift+b' }).isValid).toBe(true);
      expect(validate({ keyboardShortcut: 'ctrl+shift+c' }).isValid).toBe(true);
      expect(validate({ keyboardShortcut: '1' }).isValid).toBe(true);
      expect(validate({ keyboardShortcut: 'ctrl+9' }).isValid).toBe(true);

      // Invalid shortcuts
      expect(validate({ keyboardShortcut: 'ctrl+' }).isValid).toBe(false);
      expect(validate({ keyboardShortcut: 'ctrl+shift+' }).isValid).toBe(false);
      expect(validate({ keyboardShortcut: 'alt+a' }).isValid).toBe(false);
      expect(validate({ keyboardShortcut: 'ctrl+A' }).isValid).toBe(false);
      expect(validate({ keyboardShortcut: 'ctrl+shift+ctrl+a' }).isValid).toBe(false);
    });

    it('should return error for local MCP server without command', () => {
      const config: AgentConfiguration = {
        mcpServers: {
          'my-server': {
            command: '', // Empty command
          },
        },
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('mcpServers.my-server.command');
    });

    it('should return error for HTTP MCP server without valid URL', () => {
      const config: AgentConfiguration = {
        mcpServers: {
          'remote-server': {
            type: 'http',
            url: 'not-a-valid-url',
          },
        },
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('mcpServers.remote-server.url');
    });

    it('should validate valid MCP server configurations', () => {
      const config: AgentConfiguration = {
        mcpServers: {
          'local-server': {
            command: 'node',
            args: ['server.js'],
            env: { NODE_ENV: 'production' },
            timeout: 5000,
          },
          'remote-server': {
            type: 'http',
            url: 'https://api.example.com/mcp',
          },
        },
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return error for hook without command', () => {
      const config: AgentConfiguration = {
        hooks: {
          agentSpawn: [
            { command: '' }, // Empty command
          ],
        },
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('hooks.agentSpawn[0].command');
    });

    it('should return error for tool hook without matcher', () => {
      const config: AgentConfiguration = {
        hooks: {
          preToolUse: [
            { command: 'echo test', matcher: '' }, // Empty matcher
          ],
        },
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('hooks.preToolUse[0].matcher');
    });

    it('should validate valid hooks configuration', () => {
      const config: AgentConfiguration = {
        hooks: {
          agentSpawn: [
            { command: 'echo "Agent started"', timeout_ms: 5000 },
          ],
          preToolUse: [
            { command: 'echo "Before tool"', matcher: 'fs_write' },
          ],
          postToolUse: [
            { command: 'cargo fmt', matcher: '*', cache_ttl_seconds: 60 },
          ],
          stop: [
            { command: 'echo "Agent stopped"' },
          ],
        },
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return error for invalid tool alias key format', () => {
      const config: AgentConfiguration = {
        toolAliases: {
          'invalid-key': 'myAlias', // Key should be @server/tool format
        },
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(false);
      // The error should be on the toolAliases field
      const hasToolAliasError = Object.keys(result.errors).some(
        key => key.startsWith('toolAliases')
      );
      expect(hasToolAliasError).toBe(true);
    });

    it('should return error for invalid tool alias value format', () => {
      const config: AgentConfiguration = {
        toolAliases: {
          '@server/tool': '123invalid', // Value should start with letter/underscore
        },
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(false);
      const hasToolAliasError = Object.keys(result.errors).some(
        key => key.startsWith('toolAliases')
      );
      expect(hasToolAliasError).toBe(true);
    });

    it('should validate valid tool aliases', () => {
      const config: AgentConfiguration = {
        toolAliases: {
          '@mcp-server/read_file': 'read',
          '@my-server/custom_tool': '_myTool',
        },
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return error for empty resource string', () => {
      const config: AgentConfiguration = {
        resources: [''], // Empty string
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('resources[0]');
    });

    it('should return error for knowledge base without required fields', () => {
      const config: AgentConfiguration = {
        resources: [
          {
            type: 'knowledgeBase',
            source: '',
            name: '',
          },
        ],
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(false);
      // Should have errors for source and name
      const hasSourceError = Object.keys(result.errors).some(
        key => key.includes('source')
      );
      const hasNameError = Object.keys(result.errors).some(
        key => key.includes('name')
      );
      expect(hasSourceError || hasNameError).toBe(true);
    });

    it('should validate valid resources', () => {
      const config: AgentConfiguration = {
        resources: [
          'file://README.md',
          'skill://my-skill',
          {
            type: 'knowledgeBase',
            source: '/docs',
            name: 'Documentation',
            description: 'Project docs',
            indexType: 'best',
            autoUpdate: true,
          },
        ],
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return error for negative timeout', () => {
      const config: AgentConfiguration = {
        mcpServers: {
          'my-server': {
            command: 'node server.js',
            timeout: -1000,
          },
        },
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('mcpServers.my-server.timeout');
    });

    it('should collect multiple errors', () => {
      const config: AgentConfiguration = {
        keyboardShortcut: 'invalid',
        mcpServers: {
          'server1': { command: '' },
        },
        hooks: {
          agentSpawn: [{ command: '' }],
        },
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(1);
    });
  });

  describe('validateField()', () => {
    it('should return null for valid field value', () => {
      const error = validateField('keyboardShortcut', 'ctrl+a');
      expect(error).toBeNull();
    });

    it('should return error message for invalid field value', () => {
      const error = validateField('keyboardShortcut', 'invalid');
      expect(error).not.toBeNull();
      expect(error).toContain('Invalid keyboard shortcut format');
    });

    it('should validate nested field paths', () => {
      // Valid nested value
      const validError = validateField('mcpServers.myServer.command', 'node server.js');
      expect(validError).toBeNull();

      // Invalid nested value (empty command)
      const invalidError = validateField('mcpServers.myServer.command', '');
      expect(invalidError).not.toBeNull();
    });

    it('should return null for valid name field', () => {
      const error = validateField('name', 'my-agent');
      expect(error).toBeNull();
    });

    it('should return null for optional fields with undefined', () => {
      const error = validateField('description', undefined);
      expect(error).toBeNull();
    });

    it('should validate array item paths', () => {
      // This tests the path parsing for array notation
      const error = validateField('tools', ['read', 'write']);
      expect(error).toBeNull();
    });
  });

  describe('ValidationEngine class', () => {
    it('should provide validate method', () => {
      const engine = new ValidationEngine();
      const result = engine.validate({ name: 'test' });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should provide validateField method', () => {
      const engine = new ValidationEngine();
      const error = engine.validateField('keyboardShortcut', 'ctrl+a');
      
      expect(error).toBeNull();
    });

    it('should work with singleton instance', () => {
      const result = validationEngine.validate({ name: 'test' });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('error path formatting', () => {
    it('should format simple paths correctly', () => {
      const config: AgentConfiguration = {
        keyboardShortcut: 'invalid',
      };
      const result = validate(config);
      
      expect(result.errors).toHaveProperty('keyboardShortcut');
    });

    it('should format nested object paths with dot notation', () => {
      const config: AgentConfiguration = {
        mcpServers: {
          'my-server': {
            command: '',
          },
        },
      };
      const result = validate(config);
      
      expect(result.errors).toHaveProperty('mcpServers.my-server.command');
    });

    it('should format array paths with bracket notation', () => {
      const config: AgentConfiguration = {
        hooks: {
          agentSpawn: [
            { command: '' },
          ],
        },
      };
      const result = validate(config);
      
      expect(result.errors).toHaveProperty('hooks.agentSpawn[0].command');
    });

    it('should handle deeply nested paths', () => {
      const config: AgentConfiguration = {
        hooks: {
          preToolUse: [
            { command: 'test', matcher: '' },
          ],
        },
      };
      const result = validate(config);
      
      expect(result.errors).toHaveProperty('hooks.preToolUse[0].matcher');
    });
  });
});


// ============================================================================
// Property 6: Validation Completeness
// **Validates: Requirements 4.1, 4.2**
// ============================================================================

describe('Property 6: Validation Completeness', () => {
  /**
   * **Validates: Requirements 4.1, 4.2**
   * 
   * For any AgentConfiguration object, the Validation_Engine should:
   * - Return a complete list of all validation errors
   * - Return an empty error list if and only if the configuration is valid
   * - Map each error to the specific field path that caused it
   */

  // ============================================================================
  // Arbitraries for generating valid configurations
  // ============================================================================

  // Valid keyboard shortcut arbitrary
  const validKeyboardShortcutArbitrary = fc.oneof(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')).map(k => `ctrl+${k}`),
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')).map(k => `shift+${k}`),
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')).map(k => `ctrl+shift+${k}`)
  );

  // Valid local MCP server arbitrary
  const validLocalMCPServerArbitrary = fc.record({
    command: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
    args: fc.option(fc.array(fc.string()), { nil: undefined }),
    env: fc.option(fc.dictionary(fc.string(), fc.string()), { nil: undefined }),
    timeout: fc.option(fc.integer({ min: 1 }), { nil: undefined }),
  });

  // Valid remote MCP server arbitrary
  const validRemoteMCPServerArbitrary = fc.record({
    type: fc.constant('http' as const),
    url: fc.webUrl(),
  });

  // Valid MCP server arbitrary (either local or remote)
  const validMCPServerArbitrary = fc.oneof(
    validLocalMCPServerArbitrary,
    validRemoteMCPServerArbitrary
  );

  // Valid hook arbitrary
  const validHookArbitrary = fc.record({
    command: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
    timeout_ms: fc.option(fc.integer({ min: 1 }), { nil: undefined }),
    cache_ttl_seconds: fc.option(fc.integer({ min: 1 }), { nil: undefined }),
  });

  // Valid tool hook arbitrary (with matcher)
  const validToolHookArbitrary = fc.record({
    command: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
    matcher: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
    timeout_ms: fc.option(fc.integer({ min: 1 }), { nil: undefined }),
    cache_ttl_seconds: fc.option(fc.integer({ min: 1 }), { nil: undefined }),
  });

  // Valid tool reference arbitrary for aliases
  const validToolReferenceArbitrary = fc.tuple(
    fc.stringMatching(/^[a-zA-Z0-9_-]+$/).filter(s => s.length > 0),
    fc.stringMatching(/^[a-zA-Z0-9_-]+$/).filter(s => s.length > 0)
  ).map(([server, tool]) => `@${server}/${tool}`);

  // Valid alias name arbitrary
  const validAliasNameArbitrary = fc.tuple(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'.split('')),
    fc.stringMatching(/^[a-zA-Z0-9_]*$/)
  ).map(([first, rest]) => `${first}${rest}`);

  // Valid knowledge base resource arbitrary
  const validKnowledgeBaseArbitrary = fc.record({
    type: fc.constant('knowledgeBase' as const),
    source: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
    name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
    description: fc.option(fc.string(), { nil: undefined }),
    indexType: fc.option(fc.constantFrom('best' as const, 'fast' as const), { nil: undefined }),
    autoUpdate: fc.option(fc.boolean(), { nil: undefined }),
  });

  // Valid resource arbitrary (string URI or knowledge base)
  const validResourceArbitrary = fc.oneof(
    fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
    validKnowledgeBaseArbitrary
  );

  // Valid tool settings arbitrary
  const validToolsSettingsArbitrary = fc.record({
    write: fc.option(fc.record({
      allowedPaths: fc.option(fc.array(fc.string()), { nil: undefined }),
    }), { nil: undefined }),
    shell: fc.option(fc.record({
      allowedCommands: fc.option(fc.array(fc.string()), { nil: undefined }),
      deniedCommands: fc.option(fc.array(fc.string()), { nil: undefined }),
      autoAllowReadonly: fc.option(fc.boolean(), { nil: undefined }),
    }), { nil: undefined }),
    aws: fc.option(fc.record({
      allowedServices: fc.option(fc.array(fc.string()), { nil: undefined }),
      autoAllowReadonly: fc.option(fc.boolean(), { nil: undefined }),
    }), { nil: undefined }),
  });

  // Valid hooks config arbitrary
  const validHooksConfigArbitrary = fc.record({
    agentSpawn: fc.option(fc.array(validHookArbitrary, { maxLength: 3 }), { nil: undefined }),
    userPromptSubmit: fc.option(fc.array(validHookArbitrary, { maxLength: 3 }), { nil: undefined }),
    preToolUse: fc.option(fc.array(validToolHookArbitrary, { maxLength: 3 }), { nil: undefined }),
    postToolUse: fc.option(fc.array(validToolHookArbitrary, { maxLength: 3 }), { nil: undefined }),
    stop: fc.option(fc.array(validHookArbitrary, { maxLength: 3 }), { nil: undefined }),
  });

  // Generate a valid server name (alphanumeric with hyphens)
  const validServerNameArbitrary = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9-]*$/).filter(s => s.length > 0 && s.length <= 20);

  // Complete valid configuration arbitrary
  const validAgentConfigArbitrary = fc.record({
    name: fc.option(fc.string(), { nil: undefined }),
    description: fc.option(fc.string(), { nil: undefined }),
    prompt: fc.option(fc.string(), { nil: undefined }),
    mcpServers: fc.option(
      fc.dictionary(validServerNameArbitrary, validMCPServerArbitrary, { maxKeys: 3 }),
      { nil: undefined }
    ),
    tools: fc.option(fc.array(fc.string(), { maxLength: 5 }), { nil: undefined }),
    toolAliases: fc.option(
      fc.array(fc.tuple(validToolReferenceArbitrary, validAliasNameArbitrary), { maxLength: 3 })
        .map(pairs => Object.fromEntries(pairs)),
      { nil: undefined }
    ),
    allowedTools: fc.option(fc.array(fc.string(), { maxLength: 5 }), { nil: undefined }),
    toolsSettings: fc.option(validToolsSettingsArbitrary, { nil: undefined }),
    resources: fc.option(fc.array(validResourceArbitrary, { maxLength: 3 }), { nil: undefined }),
    hooks: fc.option(validHooksConfigArbitrary, { nil: undefined }),
    includeMcpJson: fc.option(fc.boolean(), { nil: undefined }),
    model: fc.option(fc.string(), { nil: undefined }),
    keyboardShortcut: fc.option(validKeyboardShortcutArbitrary, { nil: undefined }),
    welcomeMessage: fc.option(fc.string(), { nil: undefined }),
  });

  // ============================================================================
  // Arbitraries for generating invalid configurations
  // ============================================================================

  // Invalid keyboard shortcut arbitrary
  const invalidKeyboardShortcutArbitrary = fc.string().filter(s => {
    return !/^(ctrl\+)?(shift\+)?[a-z0-9]$/.test(s);
  });

  // Invalid local MCP server (empty command)
  const invalidLocalMCPServerArbitrary = fc.record({
    command: fc.constant(''),
    args: fc.option(fc.array(fc.string()), { nil: undefined }),
  });

  // Invalid remote MCP server (invalid URL)
  const invalidRemoteMCPServerArbitrary = fc.record({
    type: fc.constant('http' as const),
    url: fc.string().filter(s => {
      try {
        new URL(s);
        return false;
      } catch {
        return true;
      }
    }),
  });

  // Invalid hook (empty command)
  const invalidHookArbitrary = fc.record({
    command: fc.constant(''),
    timeout_ms: fc.option(fc.integer({ min: 1 }), { nil: undefined }),
  });

  // Invalid tool hook (empty matcher)
  const invalidToolHookArbitrary = fc.record({
    command: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
    matcher: fc.constant(''),
  });

  // Invalid resource (empty string)
  const invalidResourceArbitrary = fc.constant('');

  // ============================================================================
  // Property Tests
  // ============================================================================

  test.prop([validAgentConfigArbitrary], { numRuns: 100 })(
    'should return isValid=true and empty errors for any valid configuration',
    (config) => {
      const result = validate(config);
      
      // For valid configurations, isValid should be true
      expect(result.isValid).toBe(true);
      
      // For valid configurations, errors should be empty
      expect(result.errors).toEqual({});
      expect(Object.keys(result.errors).length).toBe(0);
    }
  );

  test.prop([invalidKeyboardShortcutArbitrary], { numRuns: 100 })(
    'should return isValid=false and non-empty errors for invalid keyboard shortcut',
    (shortcut) => {
      const config: AgentConfiguration = { keyboardShortcut: shortcut };
      const result = validate(config);
      
      // For invalid configurations, isValid should be false
      expect(result.isValid).toBe(false);
      
      // For invalid configurations, errors should not be empty
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
      
      // Error should be mapped to the specific field path
      expect(result.errors).toHaveProperty('keyboardShortcut');
    }
  );

  test.prop([invalidLocalMCPServerArbitrary, validServerNameArbitrary], { numRuns: 100 })(
    'should return isValid=false and map error to specific field path for invalid local MCP server',
    (server, serverName) => {
      const config: AgentConfiguration = {
        mcpServers: { [serverName]: server },
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
      
      // Error should be mapped to the specific nested field path
      const hasCommandError = Object.keys(result.errors).some(
        path => path.includes('mcpServers') && path.includes('command')
      );
      expect(hasCommandError).toBe(true);
    }
  );

  test.prop([invalidRemoteMCPServerArbitrary, validServerNameArbitrary], { numRuns: 100 })(
    'should return isValid=false and map error to specific field path for invalid remote MCP server',
    (server, serverName) => {
      const config: AgentConfiguration = {
        mcpServers: { [serverName]: server },
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
      
      // Error should be mapped to the specific nested field path
      const hasUrlError = Object.keys(result.errors).some(
        path => path.includes('mcpServers') && path.includes('url')
      );
      expect(hasUrlError).toBe(true);
    }
  );

  test.prop([invalidHookArbitrary], { numRuns: 100 })(
    'should return isValid=false and map error to array item path for invalid hook',
    (hook) => {
      const config: AgentConfiguration = {
        hooks: { agentSpawn: [hook] },
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
      
      // Error should be mapped to the specific array item path
      const hasHookError = Object.keys(result.errors).some(
        path => path.includes('hooks.agentSpawn[0]') && path.includes('command')
      );
      expect(hasHookError).toBe(true);
    }
  );

  test.prop([invalidToolHookArbitrary], { numRuns: 100 })(
    'should return isValid=false and map error to array item path for invalid tool hook',
    (hook) => {
      const config: AgentConfiguration = {
        hooks: { preToolUse: [hook] },
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
      
      // Error should be mapped to the specific array item path
      const hasMatcherError = Object.keys(result.errors).some(
        path => path.includes('hooks.preToolUse[0]') && path.includes('matcher')
      );
      expect(hasMatcherError).toBe(true);
    }
  );

  test.prop([invalidResourceArbitrary], { numRuns: 100 })(
    'should return isValid=false and map error to array item path for invalid resource',
    (resource) => {
      const config: AgentConfiguration = {
        resources: [resource],
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
      
      // Error should be mapped to the specific array item path
      const hasResourceError = Object.keys(result.errors).some(
        path => path.includes('resources[0]')
      );
      expect(hasResourceError).toBe(true);
    }
  );

  test.prop([validAgentConfigArbitrary], { numRuns: 100 })(
    'isValid should be true if and only if errors is empty',
    (config) => {
      const result = validate(config);
      
      // isValid === true <=> errors is empty
      if (result.isValid) {
        expect(Object.keys(result.errors).length).toBe(0);
      } else {
        expect(Object.keys(result.errors).length).toBeGreaterThan(0);
      }
      
      // Reverse implication
      if (Object.keys(result.errors).length === 0) {
        expect(result.isValid).toBe(true);
      } else {
        expect(result.isValid).toBe(false);
      }
    }
  );

  test.prop([validAgentConfigArbitrary], { numRuns: 100 })(
    'all errors should have valid field paths (non-empty strings)',
    (config) => {
      const result = validate(config);
      
      // All error paths should be non-empty strings
      for (const path of Object.keys(result.errors)) {
        expect(typeof path).toBe('string');
        expect(path.length).toBeGreaterThan(0);
        
        // Path should not contain invalid characters
        expect(path).not.toContain('undefined');
        expect(path).not.toContain('null');
      }
      
      // All error messages should be non-empty strings
      for (const message of Object.values(result.errors)) {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      }
    }
  );

  test.prop([validAgentConfigArbitrary], { numRuns: 100 })(
    'validation should be deterministic (same input produces same errors)',
    (config) => {
      // Run validation twice on the same input
      const result1 = validate(config);
      const result2 = validate(config);
      
      // Results should be identical
      expect(result1.isValid).toBe(result2.isValid);
      expect(result1.errors).toEqual(result2.errors);
      
      // Run a third time to be sure
      const result3 = validate(config);
      expect(result1.isValid).toBe(result3.isValid);
      expect(result1.errors).toEqual(result3.errors);
    }
  );

  // Test with configurations that have multiple errors
  test.prop([
    invalidKeyboardShortcutArbitrary,
    invalidLocalMCPServerArbitrary,
    validServerNameArbitrary
  ], { numRuns: 100 })(
    'should return complete list of all validation errors (multiple errors)',
    (shortcut, server, serverName) => {
      const config: AgentConfiguration = {
        keyboardShortcut: shortcut,
        mcpServers: { [serverName]: server },
      };
      const result = validate(config);
      
      expect(result.isValid).toBe(false);
      
      // Should have at least 2 errors (one for shortcut, one for server command)
      expect(Object.keys(result.errors).length).toBeGreaterThanOrEqual(2);
      
      // Should have error for keyboard shortcut
      expect(result.errors).toHaveProperty('keyboardShortcut');
      
      // Should have error for MCP server command
      const hasCommandError = Object.keys(result.errors).some(
        path => path.includes('mcpServers') && path.includes('command')
      );
      expect(hasCommandError).toBe(true);
    }
  );

  // Test that error paths follow expected format patterns
  test.prop([validAgentConfigArbitrary], { numRuns: 100 })(
    'error paths should follow valid format patterns',
    (config) => {
      const result = validate(config);
      
      // Valid path patterns:
      // - Simple: 'fieldName'
      // - Nested: 'parent.child'
      // - Array: 'array[0]'
      // - Combined: 'parent.array[0].field'
      const validPathPattern = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_-]*|\[\d+\])*$/;
      
      for (const path of Object.keys(result.errors)) {
        // Path should match the valid pattern (allowing for special root case)
        if (path !== '_root') {
          expect(validPathPattern.test(path)).toBe(true);
        }
      }
    }
  );

  // ============================================================================
  // Unit Tests for Edge Cases
  // ============================================================================

  it('should return valid result for empty configuration', () => {
    const config: AgentConfiguration = {};
    const result = validate(config);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('should collect all errors from deeply nested structures', () => {
    const config: AgentConfiguration = {
      keyboardShortcut: 'invalid',
      mcpServers: {
        'server1': { command: '' },
        'server2': { type: 'http', url: 'not-a-url' },
      },
      hooks: {
        agentSpawn: [{ command: '' }],
        preToolUse: [{ command: 'test', matcher: '' }],
      },
      resources: [''],
    };
    const result = validate(config);
    
    expect(result.isValid).toBe(false);
    
    // Should have errors for all invalid fields
    expect(result.errors).toHaveProperty('keyboardShortcut');
    expect(Object.keys(result.errors).some(p => p.includes('server1'))).toBe(true);
    expect(Object.keys(result.errors).some(p => p.includes('server2'))).toBe(true);
    expect(Object.keys(result.errors).some(p => p.includes('agentSpawn'))).toBe(true);
    expect(Object.keys(result.errors).some(p => p.includes('preToolUse'))).toBe(true);
    expect(Object.keys(result.errors).some(p => p.includes('resources'))).toBe(true);
  });

  it('should map errors to correct array indices', () => {
    const config: AgentConfiguration = {
      hooks: {
        agentSpawn: [
          { command: 'valid' },
          { command: '' }, // Invalid at index 1
          { command: 'also valid' },
        ],
      },
    };
    const result = validate(config);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveProperty('hooks.agentSpawn[1].command');
    expect(result.errors).not.toHaveProperty('hooks.agentSpawn[0].command');
    expect(result.errors).not.toHaveProperty('hooks.agentSpawn[2].command');
  });

  it('should handle multiple errors in same array', () => {
    const config: AgentConfiguration = {
      hooks: {
        agentSpawn: [
          { command: '' }, // Invalid at index 0
          { command: '' }, // Invalid at index 1
        ],
      },
    };
    const result = validate(config);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveProperty('hooks.agentSpawn[0].command');
    expect(result.errors).toHaveProperty('hooks.agentSpawn[1].command');
  });

  it('should validate tool aliases with both invalid key and value', () => {
    const config: AgentConfiguration = {
      toolAliases: {
        'invalid-key': '123invalid',
      },
    };
    const result = validate(config);
    
    expect(result.isValid).toBe(false);
    // Should have at least one error related to toolAliases
    const hasToolAliasError = Object.keys(result.errors).some(
      path => path.includes('toolAliases')
    );
    expect(hasToolAliasError).toBe(true);
  });
});
