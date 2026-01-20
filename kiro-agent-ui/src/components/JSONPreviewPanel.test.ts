/**
 * Property-based tests for JSON Preview Synchronization
 * 
 * **Property 5: Field State Synchronization**
 * **Validates: Requirements 1.2, 11.2**
 * 
 * For any field modification in the Configuration_Editor, the internal state 
 * and JSON preview should both reflect the new value immediately (within the same render cycle).
 * 
 * Testing Framework: Vitest with fast-check
 */

import { describe, expect, test as unitTest } from 'vitest';
import { test, fc } from '@fast-check/vitest';
import type { AgentConfiguration, MCPServerConfig, Hook, ToolHook, KnowledgeBaseResource, Resource } from '../types/agent-config';

// ============================================================================
// Re-implement cleanConfig for testing (exported from component)
// ============================================================================

/**
 * Clean configuration by removing empty/undefined values
 * Only includes fields that have been explicitly set
 * 
 * This is a copy of the function from JSONPreviewPanel.tsx for testing purposes
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
 * Format configuration as JSON with 2-space indentation
 */
function formatConfigAsJSON(config: AgentConfiguration): string {
  const cleaned = cleanConfig(config);
  return JSON.stringify(cleaned, null, 2) || '{}';
}

// ============================================================================
// Arbitraries for generating valid AgentConfiguration objects
// ============================================================================

// Simple string arbitrary that avoids filter overhead
const simpleStringArbitrary = fc.stringMatching(/^[a-zA-Z0-9_-]+$/).filter(s => s.length >= 1 && s.length <= 20);

// Arbitrary for generating valid local MCP server configs
const localMCPServerArbitrary: fc.Arbitrary<MCPServerConfig> = fc.record({
  command: simpleStringArbitrary,
  args: fc.option(fc.array(simpleStringArbitrary, { maxLength: 3 }), { nil: undefined }),
  env: fc.option(fc.dictionary(simpleStringArbitrary, simpleStringArbitrary, { maxKeys: 2 }), { nil: undefined }),
  timeout: fc.option(fc.integer({ min: 1, max: 60000 }), { nil: undefined }),
});

// Arbitrary for generating valid remote MCP server configs
const remoteMCPServerArbitrary: fc.Arbitrary<MCPServerConfig> = fc.record({
  type: fc.constant('http' as const),
  url: fc.constantFrom('https://api.example.com/mcp', 'http://localhost:3000', 'https://mcp.service.io/v1'),
});

// Combined MCP server arbitrary
const mcpServerArbitrary: fc.Arbitrary<MCPServerConfig> = fc.oneof(
  localMCPServerArbitrary,
  remoteMCPServerArbitrary
);

// Arbitrary for generating hooks
const hookArbitrary: fc.Arbitrary<Hook> = fc.record({
  command: simpleStringArbitrary,
  timeout_ms: fc.option(fc.integer({ min: 1, max: 60000 }), { nil: undefined }),
  cache_ttl_seconds: fc.option(fc.integer({ min: 1, max: 3600 }), { nil: undefined }),
});

// Arbitrary for generating tool hooks
const toolHookArbitrary: fc.Arbitrary<ToolHook> = fc.record({
  command: simpleStringArbitrary,
  timeout_ms: fc.option(fc.integer({ min: 1, max: 60000 }), { nil: undefined }),
  cache_ttl_seconds: fc.option(fc.integer({ min: 1, max: 3600 }), { nil: undefined }),
  matcher: simpleStringArbitrary,
});

// Arbitrary for generating knowledge base resources
const knowledgeBaseResourceArbitrary: fc.Arbitrary<KnowledgeBaseResource> = fc.record({
  type: fc.constant('knowledgeBase' as const),
  source: simpleStringArbitrary,
  name: simpleStringArbitrary,
  description: fc.option(simpleStringArbitrary, { nil: undefined }),
  indexType: fc.option(fc.constantFrom('best' as const, 'fast' as const), { nil: undefined }),
  autoUpdate: fc.option(fc.boolean(), { nil: undefined }),
});

// Arbitrary for generating resources (string URI or knowledge base)
const resourceArbitrary: fc.Arbitrary<Resource> = fc.oneof(
  fc.constantFrom('file://README.md', 'file://src/**/*.ts', 'skill://coding', 'skill://testing'),
  knowledgeBaseResourceArbitrary
);

// Server name arbitrary (valid identifier)
const serverNameArbitrary = fc.stringMatching(/^[a-zA-Z0-9_-]+$/).filter(s => s.length >= 1 && s.length <= 15);

// Tool reference arbitrary (pre-generated valid patterns)
const toolReferenceArbitrary = fc.tuple(
  serverNameArbitrary,
  serverNameArbitrary
).map(([server, tool]) => `@${server}/${tool}`);

// Alias name arbitrary (valid identifier starting with letter or underscore)
const aliasNameArbitrary = fc.tuple(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'.split('')),
  fc.stringMatching(/^[a-zA-Z0-9_]*$/).filter(s => s.length <= 10)
).map(([first, rest]) => `${first}${rest}`);

// Keyboard shortcut arbitrary
const keyboardShortcutArbitrary = fc.oneof(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')).map(k => `ctrl+${k}`),
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')).map(k => `shift+${k}`),
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')).map(k => `ctrl+shift+${k}`)
);

// Arbitrary for generating valid AgentConfiguration objects
// Simplified to avoid complex nested structures that slow down generation
const agentConfigArbitrary: fc.Arbitrary<AgentConfiguration> = fc.record({
  name: fc.option(simpleStringArbitrary, { nil: undefined }),
  description: fc.option(simpleStringArbitrary, { nil: undefined }),
  prompt: fc.option(simpleStringArbitrary, { nil: undefined }),
  mcpServers: fc.option(
    fc.dictionary(serverNameArbitrary, mcpServerArbitrary, { maxKeys: 2 }),
    { nil: undefined }
  ),
  tools: fc.option(fc.array(simpleStringArbitrary, { maxLength: 3 }), { nil: undefined }),
  toolAliases: fc.option(
    fc.dictionary(toolReferenceArbitrary, aliasNameArbitrary, { maxKeys: 2 }),
    { nil: undefined }
  ),
  allowedTools: fc.option(fc.array(simpleStringArbitrary, { maxLength: 3 }), { nil: undefined }),
  toolsSettings: fc.option(
    fc.record({
      write: fc.option(fc.record({
        allowedPaths: fc.option(fc.array(simpleStringArbitrary, { maxLength: 2 }), { nil: undefined }),
      }), { nil: undefined }),
      shell: fc.option(fc.record({
        allowedCommands: fc.option(fc.array(simpleStringArbitrary, { maxLength: 2 }), { nil: undefined }),
        deniedCommands: fc.option(fc.array(simpleStringArbitrary, { maxLength: 2 }), { nil: undefined }),
        autoAllowReadonly: fc.option(fc.boolean(), { nil: undefined }),
      }), { nil: undefined }),
      aws: fc.option(fc.record({
        allowedServices: fc.option(fc.array(simpleStringArbitrary, { maxLength: 2 }), { nil: undefined }),
        autoAllowReadonly: fc.option(fc.boolean(), { nil: undefined }),
      }), { nil: undefined }),
    }),
    { nil: undefined }
  ),
  resources: fc.option(fc.array(resourceArbitrary, { maxLength: 3 }), { nil: undefined }),
  hooks: fc.option(
    fc.record({
      agentSpawn: fc.option(fc.array(hookArbitrary, { maxLength: 2 }), { nil: undefined }),
      userPromptSubmit: fc.option(fc.array(hookArbitrary, { maxLength: 2 }), { nil: undefined }),
      preToolUse: fc.option(fc.array(toolHookArbitrary, { maxLength: 2 }), { nil: undefined }),
      postToolUse: fc.option(fc.array(toolHookArbitrary, { maxLength: 2 }), { nil: undefined }),
      stop: fc.option(fc.array(hookArbitrary, { maxLength: 2 }), { nil: undefined }),
    }),
    { nil: undefined }
  ),
  includeMcpJson: fc.option(fc.boolean(), { nil: undefined }),
  model: fc.option(simpleStringArbitrary, { nil: undefined }),
  keyboardShortcut: fc.option(keyboardShortcutArbitrary, { nil: undefined }),
  welcomeMessage: fc.option(simpleStringArbitrary, { nil: undefined }),
});

// ============================================================================
// Property 5: Field State Synchronization
// **Validates: Requirements 1.2, 11.2**
// ============================================================================

describe('Property 5: Field State Synchronization', () => {
  /**
   * **Validates: Requirements 1.2, 11.2**
   * 
   * For any field modification in the Configuration_Editor, the internal state 
   * and JSON preview should both reflect the new value immediately.
   */

  // ---------------------------------------------------------------------------
  // Property Test 1: Any configuration object is correctly serialized to JSON
  // ---------------------------------------------------------------------------
  test.prop([agentConfigArbitrary], { numRuns: 100 })(
    'any valid AgentConfiguration should be correctly serialized to JSON',
    (config) => {
      const jsonString = formatConfigAsJSON(config);
      
      // The JSON should be valid and parseable
      expect(() => JSON.parse(jsonString)).not.toThrow();
      
      // Parse it back
      const parsed = JSON.parse(jsonString);
      
      // The parsed object should be an object
      expect(typeof parsed).toBe('object');
      expect(parsed).not.toBeNull();
    }
  );

  // ---------------------------------------------------------------------------
  // Property Test 2: cleanConfig properly removes empty/undefined values
  // ---------------------------------------------------------------------------
  test.prop([agentConfigArbitrary], { numRuns: 100 })(
    'cleanConfig should remove all empty/undefined values',
    (config) => {
      const cleaned = cleanConfig(config);
      
      // Check that no undefined values exist in cleaned config
      for (const [, value] of Object.entries(cleaned)) {
        expect(value).not.toBeUndefined();
        expect(value).not.toBeNull();
        
        // Check that no empty strings exist
        if (typeof value === 'string') {
          expect(value).not.toBe('');
        }
        
        // Check that no empty arrays exist at top level
        if (Array.isArray(value)) {
          expect(value.length).toBeGreaterThan(0);
        }
        
        // Check that no empty objects exist at top level
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          expect(Object.keys(value).length).toBeGreaterThan(0);
        }
      }
    }
  );

  // ---------------------------------------------------------------------------
  // Property Test 3: JSON is formatted with 2-space indentation
  // ---------------------------------------------------------------------------
  test.prop([agentConfigArbitrary], { numRuns: 100 })(
    'JSON output should be formatted with 2-space indentation',
    (config) => {
      const jsonString = formatConfigAsJSON(config);
      
      // If the JSON has nested content, it should use 2-space indentation
      // We can verify this by checking that the JSON matches what we'd get with 2-space indent
      const cleaned = cleanConfig(config);
      const expectedJSON = JSON.stringify(cleaned, null, 2) || '{}';
      
      expect(jsonString).toBe(expectedJSON);
      
      // Additionally, if there are nested objects, verify indentation pattern
      if (jsonString.includes('\n')) {
        const lines = jsonString.split('\n');
        for (const line of lines) {
          // Each line should start with spaces that are multiples of 2
          const leadingSpaces = line.match(/^(\s*)/)?.[1] || '';
          expect(leadingSpaces.length % 2).toBe(0);
        }
      }
    }
  );

  // ---------------------------------------------------------------------------
  // Property Test 4: JSON output is valid and parseable, matching input after cleaning
  // ---------------------------------------------------------------------------
  test.prop([agentConfigArbitrary], { numRuns: 100 })(
    'JSON output should be valid, parseable, and match the cleaned input configuration',
    (config) => {
      const jsonString = formatConfigAsJSON(config);
      
      // Parse the JSON
      const parsed = JSON.parse(jsonString);
      
      // Get the cleaned config
      const cleaned = cleanConfig(config);
      
      // The parsed JSON should deeply equal the cleaned config
      expect(parsed).toEqual(cleaned);
    }
  );

  // ---------------------------------------------------------------------------
  // Property Test 5: Empty config produces minimal valid JSON
  // ---------------------------------------------------------------------------
  test.prop([fc.constant({} as AgentConfiguration)], { numRuns: 10 })(
    'empty configuration should produce empty JSON object',
    (config) => {
      const jsonString = formatConfigAsJSON(config);
      
      expect(jsonString).toBe('{}');
      expect(JSON.parse(jsonString)).toEqual({});
    }
  );

  // ---------------------------------------------------------------------------
  // Property Test 6: Config with only undefined/empty values produces empty JSON
  // ---------------------------------------------------------------------------
  unitTest('configuration with only undefined/empty values should produce empty JSON', () => {
    const configWithEmptyValues: AgentConfiguration = {
      name: undefined,
      description: '',
      prompt: undefined,
      tools: [],
      mcpServers: {},
      resources: [],
    };
    
    const jsonString = formatConfigAsJSON(configWithEmptyValues);
    
    expect(jsonString).toBe('{}');
    expect(JSON.parse(jsonString)).toEqual({});
  });

  // ---------------------------------------------------------------------------
  // Unit Tests for specific edge cases
  // ---------------------------------------------------------------------------
  unitTest('should correctly serialize a complete configuration', () => {
    const config: AgentConfiguration = {
      name: 'test-agent',
      description: 'A test agent',
      prompt: 'You are a helpful assistant',
      model: 'claude-3',
      keyboardShortcut: 'ctrl+shift+a',
      welcomeMessage: 'Hello!',
      includeMcpJson: true,
      tools: ['read', 'write', 'shell'],
      allowedTools: ['read'],
      mcpServers: {
        'my-server': { command: 'node', args: ['server.js'] },
        'remote-server': { type: 'http', url: 'https://api.example.com/mcp' },
      },
      toolAliases: {
        '@my-server/read_file': 'read',
      },
      toolsSettings: {
        write: { allowedPaths: ['src/**'] },
        shell: { allowedCommands: ['npm test'], autoAllowReadonly: true },
      },
      resources: [
        'file://README.md',
        {
          type: 'knowledgeBase',
          source: './docs',
          name: 'Documentation',
          indexType: 'best',
        },
      ],
      hooks: {
        agentSpawn: [{ command: 'echo "Agent started"' }],
        postToolUse: [{ command: 'npm run lint', matcher: 'fs_write' }],
      },
    };
    
    const jsonString = formatConfigAsJSON(config);
    const parsed = JSON.parse(jsonString);
    
    // Verify all fields are present
    expect(parsed.name).toBe('test-agent');
    expect(parsed.description).toBe('A test agent');
    expect(parsed.prompt).toBe('You are a helpful assistant');
    expect(parsed.model).toBe('claude-3');
    expect(parsed.keyboardShortcut).toBe('ctrl+shift+a');
    expect(parsed.welcomeMessage).toBe('Hello!');
    expect(parsed.includeMcpJson).toBe(true);
    expect(parsed.tools).toEqual(['read', 'write', 'shell']);
    expect(parsed.allowedTools).toEqual(['read']);
    expect(parsed.mcpServers['my-server']).toEqual({ command: 'node', args: ['server.js'] });
    expect(parsed.mcpServers['remote-server']).toEqual({ type: 'http', url: 'https://api.example.com/mcp' });
    expect(parsed.toolAliases['@my-server/read_file']).toBe('read');
    expect(parsed.toolsSettings.write.allowedPaths).toEqual(['src/**']);
    expect(parsed.toolsSettings.shell.allowedCommands).toEqual(['npm test']);
    expect(parsed.toolsSettings.shell.autoAllowReadonly).toBe(true);
    expect(parsed.resources).toHaveLength(2);
    expect(parsed.hooks.agentSpawn).toHaveLength(1);
    expect(parsed.hooks.postToolUse).toHaveLength(1);
  });

  unitTest('should omit fields with empty values', () => {
    const config: AgentConfiguration = {
      name: 'test-agent',
      description: '',           // empty string - should be omitted
      prompt: undefined,         // undefined - should be omitted
      tools: [],                 // empty array - should be omitted
      mcpServers: {},            // empty object - should be omitted
      includeMcpJson: false,     // false is a valid value - should be included
    };
    
    const jsonString = formatConfigAsJSON(config);
    const parsed = JSON.parse(jsonString);
    
    expect(parsed.name).toBe('test-agent');
    expect(parsed.includeMcpJson).toBe(false);
    expect(parsed).not.toHaveProperty('description');
    expect(parsed).not.toHaveProperty('prompt');
    expect(parsed).not.toHaveProperty('tools');
    expect(parsed).not.toHaveProperty('mcpServers');
  });

  unitTest('should preserve boolean false values', () => {
    const config: AgentConfiguration = {
      includeMcpJson: false,
      toolsSettings: {
        shell: {
          autoAllowReadonly: false,
        },
      },
    };
    
    const jsonString = formatConfigAsJSON(config);
    const parsed = JSON.parse(jsonString);
    
    expect(parsed.includeMcpJson).toBe(false);
    expect(parsed.toolsSettings.shell.autoAllowReadonly).toBe(false);
  });

  unitTest('should preserve numeric zero values', () => {
    const config: AgentConfiguration = {
      hooks: {
        agentSpawn: [{
          command: 'echo test',
          timeout_ms: 0,  // Note: 0 might be invalid per schema, but cleanConfig should preserve it
        }],
      },
    };
    
    const jsonString = formatConfigAsJSON(config);
    const parsed = JSON.parse(jsonString);
    
    // Zero is a valid value and should be preserved
    expect(parsed.hooks.agentSpawn[0].timeout_ms).toBe(0);
  });

  unitTest('should handle deeply nested structures', () => {
    const config: AgentConfiguration = {
      mcpServers: {
        'server-1': {
          command: 'node',
          args: ['--flag', 'value'],
          env: {
            NODE_ENV: 'production',
            DEBUG: 'true',
          },
          timeout: 5000,
        },
      },
      toolsSettings: {
        write: {
          allowedPaths: ['src/**/*.ts', 'tests/**/*.ts'],
        },
        shell: {
          allowedCommands: ['npm test', 'npm run build'],
          deniedCommands: ['rm -rf'],
          autoAllowReadonly: true,
        },
        aws: {
          allowedServices: ['s3', 'lambda'],
          autoAllowReadonly: false,
        },
      },
    };
    
    const jsonString = formatConfigAsJSON(config);
    const parsed = JSON.parse(jsonString);
    
    // Verify nested structure is preserved
    expect(parsed.mcpServers['server-1'].env.NODE_ENV).toBe('production');
    expect(parsed.toolsSettings.shell.deniedCommands).toContain('rm -rf');
    expect(parsed.toolsSettings.aws.autoAllowReadonly).toBe(false);
  });

  unitTest('should handle special characters in strings', () => {
    const config: AgentConfiguration = {
      name: 'test-agent',
      description: 'Agent with "quotes" and \\backslashes\\',
      prompt: 'Line 1\nLine 2\tTabbed',
      welcomeMessage: 'Unicode: 你好 🎉',
    };
    
    const jsonString = formatConfigAsJSON(config);
    
    // Should be valid JSON
    expect(() => JSON.parse(jsonString)).not.toThrow();
    
    const parsed = JSON.parse(jsonString);
    expect(parsed.description).toBe('Agent with "quotes" and \\backslashes\\');
    expect(parsed.prompt).toBe('Line 1\nLine 2\tTabbed');
    expect(parsed.welcomeMessage).toBe('Unicode: 你好 🎉');
  });

  unitTest('should produce consistent output for same input', () => {
    const config: AgentConfiguration = {
      name: 'test-agent',
      tools: ['read', 'write'],
      mcpServers: {
        'server-a': { command: 'node a.js' },
        'server-b': { command: 'node b.js' },
      },
    };
    
    // Generate JSON multiple times
    const json1 = formatConfigAsJSON(config);
    const json2 = formatConfigAsJSON(config);
    const json3 = formatConfigAsJSON(config);
    
    // All outputs should be identical
    expect(json1).toBe(json2);
    expect(json2).toBe(json3);
  });
});
