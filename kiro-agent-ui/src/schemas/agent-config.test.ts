/**
 * Property-based tests for Zod schema validation
 * 
 * These tests verify the correctness of validation schemas using fast-check
 * to generate random inputs and verify properties hold across all valid executions.
 * 
 * Testing Framework: Vitest with fast-check
 */

import { describe, expect } from 'vitest';
import { test, fc } from '@fast-check/vitest';
import {
  keyboardShortcutPattern,
  toolReferencePattern,
  aliasNamePattern,
  isValidKeyboardShortcut,
  isValidToolReference,
  isValidAliasName,
  LocalMCPServerSchema,
  RemoteMCPServerSchema,
  MCPServerConfigSchema,
  AgentConfigurationSchema,
} from './agent-config';

// ============================================================================
// Property 7: Keyboard Shortcut Format Validation
// **Validates: Requirements 4.4**
// ============================================================================

describe('Property 7: Keyboard Shortcut Format Validation', () => {
  /**
   * **Validates: Requirements 4.4**
   * 
   * For any string provided as a keyboard shortcut, the Validation_Engine should:
   * - Accept strings matching the pattern ^(ctrl\+)?(shift\+)?[a-z0-9]$
   * - Reject all other strings with a descriptive error message
   */

  // Arbitrary for generating valid keyboard shortcuts
  const validKeyboardShortcutArbitrary = fc.oneof(
    // Just a key: a-z or 0-9
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
    // ctrl+key
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')).map(k => `ctrl+${k}`),
    // shift+key
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')).map(k => `shift+${k}`),
    // ctrl+shift+key
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')).map(k => `ctrl+shift+${k}`)
  );

  // Arbitrary for generating invalid keyboard shortcuts
  const invalidKeyboardShortcutArbitrary = fc.string().filter(s => {
    // Filter out strings that would match the valid pattern
    return !keyboardShortcutPattern.test(s);
  });

  test.prop([validKeyboardShortcutArbitrary], { numRuns: 100 })(
    'should accept valid keyboard shortcuts matching pattern ^(ctrl+)?(shift+)?[a-z0-9]$',
    (shortcut) => {
      // Verify the pattern matches
      expect(keyboardShortcutPattern.test(shortcut)).toBe(true);
      
      // Verify the helper function returns true
      expect(isValidKeyboardShortcut(shortcut)).toBe(true);
      
      // Verify Zod schema accepts it
      const result = AgentConfigurationSchema.safeParse({ keyboardShortcut: shortcut });
      expect(result.success).toBe(true);
    }
  );

  test.prop([invalidKeyboardShortcutArbitrary], { numRuns: 100 })(
    'should reject invalid keyboard shortcuts with a descriptive error message',
    (shortcut) => {
      // Verify the pattern does not match
      expect(keyboardShortcutPattern.test(shortcut)).toBe(false);
      
      // Verify the helper function returns false
      expect(isValidKeyboardShortcut(shortcut)).toBe(false);
      
      // Verify Zod schema rejects it with an error message
      const result = AgentConfigurationSchema.safeParse({ keyboardShortcut: shortcut });
      expect(result.success).toBe(false);
      
      if (!result.success) {
        // Verify there's a descriptive error message (Zod 4 uses .issues instead of .errors)
        const issues = result.error.issues;
        expect(issues.length).toBeGreaterThan(0);
        expect(issues[0].message).toContain('Invalid keyboard shortcut format');
      }
    }
  );

  // Unit tests for specific edge cases
  test('should accept specific valid shortcuts', () => {
    const validShortcuts = ['a', 'z', '0', '9', 'ctrl+a', 'shift+b', 'ctrl+shift+c', 'ctrl+0', 'shift+9'];
    
    for (const shortcut of validShortcuts) {
      expect(isValidKeyboardShortcut(shortcut)).toBe(true);
      const result = AgentConfigurationSchema.safeParse({ keyboardShortcut: shortcut });
      expect(result.success).toBe(true);
    }
  });

  test('should reject specific invalid shortcuts', () => {
    const invalidShortcuts = [
      '',                    // empty string
      'A',                   // uppercase
      'ctrl+A',              // uppercase with modifier
      'alt+a',               // wrong modifier
      'ctrl+alt+a',          // wrong modifier combination
      'shift+ctrl+a',        // wrong order
      'ctrl+',               // missing key
      '+a',                  // missing modifier name
      'ctrl+shift+',         // missing key with both modifiers
      'ctrl+ab',             // multiple keys
      'ctrl+shift+ab',       // multiple keys with modifiers
      'CTRL+a',              // uppercase modifier
      'Ctrl+a',              // mixed case modifier
    ];
    
    for (const shortcut of invalidShortcuts) {
      expect(isValidKeyboardShortcut(shortcut)).toBe(false);
      const result = AgentConfigurationSchema.safeParse({ keyboardShortcut: shortcut });
      expect(result.success).toBe(false);
    }
  });
});

// ============================================================================
// Property 8: MCP Server Configuration Validation
// **Validates: Requirements 4.5, 7.6**
// ============================================================================

describe('Property 8: MCP Server Configuration Validation', () => {
  /**
   * **Validates: Requirements 4.5, 7.6**
   * 
   * For any MCP server configuration:
   * - Local servers (without type: 'http') must have a non-empty command field
   * - Remote servers (with type: 'http') must have a valid URL in the url field
   * - Server names within a configuration must be unique
   */

  // Arbitrary for generating valid local MCP server configs
  const validLocalServerArbitrary = fc.record({
    command: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
    args: fc.option(fc.array(fc.string()), { nil: undefined }),
    env: fc.option(fc.dictionary(fc.string(), fc.string()), { nil: undefined }),
    timeout: fc.option(fc.integer({ min: 1 }), { nil: undefined }),
  });

  // Arbitrary for generating valid remote MCP server configs
  const validRemoteServerArbitrary = fc.record({
    type: fc.constant('http' as const),
    url: fc.webUrl(),
  });

  // Arbitrary for generating invalid local servers (empty command)
  const invalidLocalServerArbitrary = fc.record({
    command: fc.constant(''),
    args: fc.option(fc.array(fc.string()), { nil: undefined }),
  });

  // Arbitrary for generating invalid remote servers (invalid URL)
  const invalidRemoteServerArbitrary = fc.record({
    type: fc.constant('http' as const),
    url: fc.string().filter(s => {
      try {
        new URL(s);
        return false; // Valid URL, filter it out
      } catch {
        return true; // Invalid URL, keep it
      }
    }),
  });

  test.prop([validLocalServerArbitrary], { numRuns: 100 })(
    'should accept local servers with non-empty command field',
    (server) => {
      const result = LocalMCPServerSchema.safeParse(server);
      expect(result.success).toBe(true);
      
      // Also test through the union schema
      const unionResult = MCPServerConfigSchema.safeParse(server);
      expect(unionResult.success).toBe(true);
    }
  );

  test.prop([validRemoteServerArbitrary], { numRuns: 100 })(
    'should accept remote servers with valid URL',
    (server) => {
      const result = RemoteMCPServerSchema.safeParse(server);
      expect(result.success).toBe(true);
      
      // Also test through the union schema
      const unionResult = MCPServerConfigSchema.safeParse(server);
      expect(unionResult.success).toBe(true);
    }
  );

  test.prop([invalidLocalServerArbitrary], { numRuns: 100 })(
    'should reject local servers with empty command field',
    (server) => {
      const result = LocalMCPServerSchema.safeParse(server);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        // Zod 4 uses .issues instead of .errors
        const issues = result.error.issues;
        expect(issues.length).toBeGreaterThan(0);
        // Should have an error about command being required
        const commandError = issues.find(e => e.path.includes('command'));
        expect(commandError).toBeDefined();
      }
    }
  );

  test.prop([invalidRemoteServerArbitrary], { numRuns: 100 })(
    'should reject remote servers with invalid URL',
    (server) => {
      const result = RemoteMCPServerSchema.safeParse(server);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        // Zod 4 uses .issues instead of .errors
        const issues = result.error.issues;
        expect(issues.length).toBeGreaterThan(0);
        // Should have an error about URL being invalid
        const urlError = issues.find(e => e.path.includes('url'));
        expect(urlError).toBeDefined();
      }
    }
  );

  // Test for unique server names (Property 8 requirement)
  test('should allow configurations with unique server names', () => {
    const config = {
      mcpServers: {
        'server-1': { command: 'node server1.js' },
        'server-2': { command: 'node server2.js' },
        'server-3': { type: 'http' as const, url: 'https://api.example.com/mcp' },
      },
    };
    
    const result = AgentConfigurationSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  // Note: Zod's record type inherently enforces unique keys since it's a JavaScript object
  // Duplicate keys in JSON will be overwritten, so this is handled at the JSON parsing level
  test('should handle server name uniqueness through object key semantics', () => {
    // In JavaScript/JSON, duplicate keys result in the last value winning
    // This test verifies the schema accepts valid server configurations
    const config = {
      mcpServers: {
        'my-server': { command: 'node server.js' },
      },
    };
    
    const result = AgentConfigurationSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  // Unit tests for specific edge cases
  test('should accept specific valid local server configurations', () => {
    const validConfigs = [
      { command: 'node' },
      { command: 'python', args: ['-m', 'server'] },
      { command: 'npx', args: ['mcp-server'], env: { NODE_ENV: 'production' } },
      { command: 'cargo', args: ['run'], timeout: 5000 },
    ];
    
    for (const config of validConfigs) {
      const result = LocalMCPServerSchema.safeParse(config);
      expect(result.success).toBe(true);
    }
  });

  test('should accept specific valid remote server configurations', () => {
    const validConfigs = [
      { type: 'http' as const, url: 'https://api.example.com/mcp' },
      { type: 'http' as const, url: 'http://localhost:3000' },
      { type: 'http' as const, url: 'https://mcp.service.io/v1' },
    ];
    
    for (const config of validConfigs) {
      const result = RemoteMCPServerSchema.safeParse(config);
      expect(result.success).toBe(true);
    }
  });

  test('should reject specific invalid configurations', () => {
    // Empty command
    expect(LocalMCPServerSchema.safeParse({ command: '' }).success).toBe(false);
    
    // Missing command
    expect(LocalMCPServerSchema.safeParse({}).success).toBe(false);
    
    // Invalid URL
    expect(RemoteMCPServerSchema.safeParse({ type: 'http', url: 'not-a-url' }).success).toBe(false);
    
    // Missing URL
    expect(RemoteMCPServerSchema.safeParse({ type: 'http' }).success).toBe(false);
    
    // Negative timeout
    expect(LocalMCPServerSchema.safeParse({ command: 'node', timeout: -1 }).success).toBe(false);
  });
});

// ============================================================================
// Property 10: Tool Alias Validation
// **Validates: Requirements 12.2, 12.3**
// ============================================================================

describe('Property 10: Tool Alias Validation', () => {
  /**
   * **Validates: Requirements 12.2, 12.3**
   * 
   * For any tool alias entry:
   * - The original tool reference must match the pattern @[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+
   * - The alias name must match the pattern ^[a-zA-Z_][a-zA-Z0-9_]*$ (valid identifier)
   */

  // Arbitrary for generating valid tool references
  const validToolReferenceArbitrary = fc.tuple(
    fc.stringMatching(/^[a-zA-Z0-9_-]+$/).filter(s => s.length > 0),
    fc.stringMatching(/^[a-zA-Z0-9_-]+$/).filter(s => s.length > 0)
  ).map(([server, tool]) => `@${server}/${tool}`);

  // Arbitrary for generating valid alias names (valid identifiers)
  const validAliasNameArbitrary = fc.tuple(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'.split('')),
    fc.stringMatching(/^[a-zA-Z0-9_]*$/)
  ).map(([first, rest]) => `${first}${rest}`);

  // Arbitrary for generating invalid tool references
  const invalidToolReferenceArbitrary = fc.string().filter(s => {
    return !toolReferencePattern.test(s);
  });

  // Arbitrary for generating invalid alias names
  const invalidAliasNameArbitrary = fc.string().filter(s => {
    return !aliasNamePattern.test(s);
  });

  test.prop([validToolReferenceArbitrary], { numRuns: 100 })(
    'should accept valid tool references matching pattern @[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+',
    (reference) => {
      // Verify the pattern matches
      expect(toolReferencePattern.test(reference)).toBe(true);
      
      // Verify the helper function returns true
      expect(isValidToolReference(reference)).toBe(true);
    }
  );

  test.prop([validAliasNameArbitrary], { numRuns: 100 })(
    'should accept valid alias names matching pattern ^[a-zA-Z_][a-zA-Z0-9_]*$',
    (alias) => {
      // Verify the pattern matches
      expect(aliasNamePattern.test(alias)).toBe(true);
      
      // Verify the helper function returns true
      expect(isValidAliasName(alias)).toBe(true);
    }
  );

  test.prop([invalidToolReferenceArbitrary], { numRuns: 100 })(
    'should reject invalid tool references',
    (reference) => {
      // Verify the pattern does not match
      expect(toolReferencePattern.test(reference)).toBe(false);
      
      // Verify the helper function returns false
      expect(isValidToolReference(reference)).toBe(false);
    }
  );

  test.prop([invalidAliasNameArbitrary], { numRuns: 100 })(
    'should reject invalid alias names',
    (alias) => {
      // Verify the pattern does not match
      expect(aliasNamePattern.test(alias)).toBe(false);
      
      // Verify the helper function returns false
      expect(isValidAliasName(alias)).toBe(false);
    }
  );

  // Test tool aliases in the full configuration schema
  test.prop([validToolReferenceArbitrary, validAliasNameArbitrary], { numRuns: 100 })(
    'should accept valid tool alias entries in configuration',
    (reference, alias) => {
      const config = {
        toolAliases: {
          [reference]: alias,
        },
      };
      
      const result = AgentConfigurationSchema.safeParse(config);
      expect(result.success).toBe(true);
    }
  );

  // Unit tests for specific edge cases
  test('should accept specific valid tool references', () => {
    const validReferences = [
      '@mcp-server/read_file',
      '@my-server/custom_tool',
      '@server123/tool_v2',
      '@a/b',
      '@ABC/XYZ',
      '@my_server/my_tool',
      '@server-name/tool-name',
    ];
    
    for (const reference of validReferences) {
      expect(isValidToolReference(reference)).toBe(true);
    }
  });

  test('should reject specific invalid tool references', () => {
    const invalidReferences = [
      '',                      // empty string
      'mcp-server/read_file',  // missing @
      '@/read_file',           // missing server name
      '@mcp-server/',          // missing tool name
      '@mcp-server',           // missing /tool
      'read_file',             // no @ or /
      '@mcp server/tool',      // space in server name
      '@mcp-server/tool name', // space in tool name
      '@@server/tool',         // double @
      '@server//tool',         // double /
    ];
    
    for (const reference of invalidReferences) {
      expect(isValidToolReference(reference)).toBe(false);
    }
  });

  test('should accept specific valid alias names', () => {
    const validAliases = [
      'myAlias',
      '_private',
      'tool_v2',
      'A',
      '_',
      'readFile',
      'READ_FILE',
      '_123',
      'a1b2c3',
    ];
    
    for (const alias of validAliases) {
      expect(isValidAliasName(alias)).toBe(true);
    }
  });

  test('should reject specific invalid alias names', () => {
    const invalidAliases = [
      '',              // empty string
      '123',           // starts with number
      '1alias',        // starts with number
      'my-alias',      // contains hyphen
      'my alias',      // contains space
      'my.alias',      // contains dot
      '@alias',        // starts with @
      'alias!',        // contains special character
    ];
    
    for (const alias of invalidAliases) {
      expect(isValidAliasName(alias)).toBe(false);
    }
  });

  test('should reject invalid tool alias entries in configuration', () => {
    // Invalid tool reference as key
    const configWithInvalidKey = {
      toolAliases: {
        'invalid-reference': 'validAlias',
      },
    };
    
    const result1 = AgentConfigurationSchema.safeParse(configWithInvalidKey);
    expect(result1.success).toBe(false);
    
    // Invalid alias name as value
    const configWithInvalidValue = {
      toolAliases: {
        '@server/tool': '123invalid',
      },
    };
    
    const result2 = AgentConfigurationSchema.safeParse(configWithInvalidValue);
    expect(result2.success).toBe(false);
  });
});
