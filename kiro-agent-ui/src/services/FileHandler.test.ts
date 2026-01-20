/**
 * Unit tests and Property-based tests for FileHandler Service
 * 
 * Tests the file import/export functionality including:
 * - JSON parsing and error handling
 * - Configuration cleaning (removing empty values)
 * - Filename generation
 * - Serialization
 * 
 * Property-based tests verify:
 * - Property 1: Import/Export Round-Trip Consistency
 * - Property 2: Invalid JSON Error Handling
 * - Property 3: JSON Serialization Cleanliness
 * - Property 4: Filename Generation Logic
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { test, fc } from '@fast-check/vitest';
import type { AgentConfiguration, MCPServerConfig, Hook, ToolHook, KnowledgeBaseResource, Resource } from '../types/agent-config';
import {
  importFile,
  exportConfig,
  cleanConfig,
  serializeConfig,
  generateFilename,
  FileHandlerError,
  FileHandler,
  fileHandler,
} from './FileHandler';
import type { AgentConfiguration } from '../types/agent-config';

// Mock FileReader for testing importFile
class MockFileReader {
  result: string | ArrayBuffer | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  
  readAsText(file: File): void {
    // Simulate async behavior
    setTimeout(() => {
      if (file.name === 'error.json') {
        this.onerror?.();
      } else {
        this.result = (file as unknown as { _content: string })._content;
        this.onload?.();
      }
    }, 0);
  }
}

// Helper to create a mock File with content
function createMockFile(content: string, name: string = 'test.json'): File {
  const file = new File([content], name, { type: 'application/json' });
  // Attach content for our mock FileReader
  (file as unknown as { _content: string })._content = content;
  return file;
}

describe('FileHandler', () => {
  beforeEach(() => {
    // Mock FileReader
    vi.stubGlobal('FileReader', MockFileReader);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('importFile', () => {
    it('should parse valid JSON configuration', async () => {
      const config: AgentConfiguration = {
        name: 'test-agent',
        description: 'A test agent',
        tools: ['read', 'write'],
      };
      const file = createMockFile(JSON.stringify(config));
      
      const result = await importFile(file);
      
      expect(result).toEqual(config);
    });

    it('should preserve all fields from the file including unknown fields', async () => {
      const configWithUnknown = {
        name: 'test-agent',
        unknownField: 'should be preserved',
        nested: { custom: 'value' },
      };
      const file = createMockFile(JSON.stringify(configWithUnknown));
      
      const result = await importFile(file);
      
      expect(result).toEqual(configWithUnknown);
    });

    it('should throw JSON_PARSE_ERROR for invalid JSON', async () => {
      const file = createMockFile('{ invalid json }');
      
      await expect(importFile(file)).rejects.toThrow(FileHandlerError);
      await expect(importFile(file)).rejects.toMatchObject({
        type: 'JSON_PARSE_ERROR',
      });
    });

    it('should throw JSON_PARSE_ERROR with descriptive message', async () => {
      const file = createMockFile('not json at all');
      
      try {
        await importFile(file);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FileHandlerError);
        expect((error as FileHandlerError).message).toContain('Invalid JSON:');
      }
    });

    it('should throw JSON_PARSE_ERROR for non-object JSON', async () => {
      const file = createMockFile('"just a string"');
      
      await expect(importFile(file)).rejects.toMatchObject({
        type: 'JSON_PARSE_ERROR',
        message: 'Invalid JSON: Expected an object at the root level',
      });
    });

    it('should throw JSON_PARSE_ERROR for array JSON', async () => {
      const file = createMockFile('[1, 2, 3]');
      
      await expect(importFile(file)).rejects.toMatchObject({
        type: 'JSON_PARSE_ERROR',
        message: 'Invalid JSON: Expected an object at the root level',
      });
    });

    it('should throw FILE_READ_ERROR when file cannot be read', async () => {
      const file = createMockFile('content', 'error.json');
      
      await expect(importFile(file)).rejects.toMatchObject({
        type: 'FILE_READ_ERROR',
        message: 'Could not read file. Please try again.',
      });
    });

    it('should handle empty object', async () => {
      const file = createMockFile('{}');
      
      const result = await importFile(file);
      
      expect(result).toEqual({});
    });

    it('should handle complex nested configuration', async () => {
      const config: AgentConfiguration = {
        name: 'complex-agent',
        mcpServers: {
          'local-server': {
            command: 'node',
            args: ['server.js'],
            env: { NODE_ENV: 'production' },
          },
          'remote-server': {
            type: 'http',
            url: 'https://api.example.com/mcp',
          },
        },
        hooks: {
          agentSpawn: [{ command: 'echo "started"' }],
          preToolUse: [{ command: 'validate', matcher: '*' }],
        },
        resources: [
          'file://README.md',
          {
            type: 'knowledgeBase',
            source: '/docs',
            name: 'Documentation',
          },
        ],
      };
      const file = createMockFile(JSON.stringify(config));
      
      const result = await importFile(file);
      
      expect(result).toEqual(config);
    });
  });

  describe('cleanConfig', () => {
    it('should remove undefined values', () => {
      const config: AgentConfiguration = {
        name: 'test',
        description: undefined,
      };
      
      const result = cleanConfig(config);
      
      expect(result).toEqual({ name: 'test' });
      expect('description' in result).toBe(false);
    });

    it('should remove null values', () => {
      const config = {
        name: 'test',
        description: null,
      } as unknown as AgentConfiguration;
      
      const result = cleanConfig(config);
      
      expect(result).toEqual({ name: 'test' });
    });

    it('should remove empty strings', () => {
      const config: AgentConfiguration = {
        name: 'test',
        description: '',
      };
      
      const result = cleanConfig(config);
      
      expect(result).toEqual({ name: 'test' });
    });

    it('should remove empty arrays', () => {
      const config: AgentConfiguration = {
        name: 'test',
        tools: [],
      };
      
      const result = cleanConfig(config);
      
      expect(result).toEqual({ name: 'test' });
    });

    it('should remove empty objects', () => {
      const config: AgentConfiguration = {
        name: 'test',
        mcpServers: {},
      };
      
      const result = cleanConfig(config);
      
      expect(result).toEqual({ name: 'test' });
    });

    it('should preserve non-empty values', () => {
      const config: AgentConfiguration = {
        name: 'test',
        description: 'A description',
        tools: ['read', 'write'],
        includeMcpJson: false, // false is not empty
      };
      
      const result = cleanConfig(config);
      
      expect(result).toEqual(config);
    });

    it('should recursively clean nested objects', () => {
      const config: AgentConfiguration = {
        name: 'test',
        toolsSettings: {
          write: {
            allowedPaths: [],
          },
          shell: {
            allowedCommands: ['npm test'],
            deniedCommands: [],
          },
        },
      };
      
      const result = cleanConfig(config);
      
      expect(result).toEqual({
        name: 'test',
        toolsSettings: {
          shell: {
            allowedCommands: ['npm test'],
          },
        },
      });
    });

    it('should clean objects inside arrays', () => {
      const config: AgentConfiguration = {
        name: 'test',
        hooks: {
          agentSpawn: [
            { command: 'echo', timeout_ms: undefined },
          ],
        },
      };
      
      const result = cleanConfig(config);
      
      expect(result).toEqual({
        name: 'test',
        hooks: {
          agentSpawn: [{ command: 'echo' }],
        },
      });
    });

    it('should return empty object for completely empty config', () => {
      const config: AgentConfiguration = {};
      
      const result = cleanConfig(config);
      
      expect(result).toEqual({});
    });

    it('should preserve boolean false values', () => {
      const config: AgentConfiguration = {
        name: 'test',
        includeMcpJson: false,
        toolsSettings: {
          shell: {
            autoAllowReadonly: false,
          },
        },
      };
      
      const result = cleanConfig(config);
      
      expect(result).toEqual(config);
    });

    it('should preserve zero values', () => {
      const config: AgentConfiguration = {
        name: 'test',
        hooks: {
          agentSpawn: [
            { command: 'echo', timeout_ms: 0 },
          ],
        },
      };
      
      const result = cleanConfig(config);
      
      // Note: 0 is a valid value and should be preserved
      expect(result).toEqual(config);
    });
  });

  describe('generateFilename', () => {
    it('should use agent name when set', () => {
      const config: AgentConfiguration = { name: 'my-agent' };
      
      const result = generateFilename(config);
      
      expect(result).toBe('my-agent.json');
    });

    it('should return agent-config.json when name is not set', () => {
      const config: AgentConfiguration = {};
      
      const result = generateFilename(config);
      
      expect(result).toBe('agent-config.json');
    });

    it('should return agent-config.json when name is empty string', () => {
      const config: AgentConfiguration = { name: '' };
      
      const result = generateFilename(config);
      
      expect(result).toBe('agent-config.json');
    });

    it('should return agent-config.json when name is whitespace only', () => {
      const config: AgentConfiguration = { name: '   ' };
      
      const result = generateFilename(config);
      
      expect(result).toBe('agent-config.json');
    });

    it('should sanitize name with special characters', () => {
      const config: AgentConfiguration = { name: 'My Agent! @#$%' };
      
      const result = generateFilename(config);
      
      expect(result).toBe('my-agent.json');
    });

    it('should handle name with spaces', () => {
      const config: AgentConfiguration = { name: 'My Test Agent' };
      
      const result = generateFilename(config);
      
      expect(result).toBe('my-test-agent.json');
    });

    it('should use custom filename when provided', () => {
      const config: AgentConfiguration = { name: 'my-agent' };
      
      const result = generateFilename(config, 'custom-name');
      
      expect(result).toBe('custom-name.json');
    });

    it('should not double .json extension for custom filename', () => {
      const config: AgentConfiguration = { name: 'my-agent' };
      
      const result = generateFilename(config, 'custom-name.json');
      
      expect(result).toBe('custom-name.json');
    });

    it('should preserve underscores and hyphens in name', () => {
      const config: AgentConfiguration = { name: 'my_test-agent' };
      
      const result = generateFilename(config);
      
      expect(result).toBe('my_test-agent.json');
    });

    it('should handle name with leading/trailing special chars', () => {
      const config: AgentConfiguration = { name: '---my-agent---' };
      
      const result = generateFilename(config);
      
      expect(result).toBe('my-agent.json');
    });
  });

  describe('serializeConfig', () => {
    it('should format JSON with 2-space indentation', () => {
      const config: AgentConfiguration = {
        name: 'test',
        tools: ['read'],
      };
      
      const result = serializeConfig(config);
      
      expect(result).toBe('{\n  "name": "test",\n  "tools": [\n    "read"\n  ]\n}');
    });

    it('should clean config by default', () => {
      const config: AgentConfiguration = {
        name: 'test',
        description: '',
        tools: [],
      };
      
      const result = serializeConfig(config);
      
      expect(result).toBe('{\n  "name": "test"\n}');
    });

    it('should not clean config when clean=false', () => {
      const config: AgentConfiguration = {
        name: 'test',
        tools: [],
      };
      
      const result = serializeConfig(config, false);
      
      expect(result).toContain('"tools"');
    });

    it('should produce valid JSON', () => {
      const config: AgentConfiguration = {
        name: 'test',
        mcpServers: {
          server1: { command: 'node' },
        },
      };
      
      const result = serializeConfig(config);
      
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe('exportConfig', () => {
    let createObjectURLMock: ReturnType<typeof vi.fn>;
    let revokeObjectURLMock: ReturnType<typeof vi.fn>;
    let appendChildMock: ReturnType<typeof vi.fn>;
    let removeChildMock: ReturnType<typeof vi.fn>;
    let clickMock: ReturnType<typeof vi.fn>;
    let createdLink: { href: string; download: string; click: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      createObjectURLMock = vi.fn().mockReturnValue('blob:test-url');
      revokeObjectURLMock = vi.fn();
      appendChildMock = vi.fn();
      removeChildMock = vi.fn();
      clickMock = vi.fn();

      vi.stubGlobal('URL', {
        createObjectURL: createObjectURLMock,
        revokeObjectURL: revokeObjectURLMock,
      });

      // Mock document and its methods for Node environment
      const mockBody = {
        appendChild: appendChildMock,
        removeChild: removeChildMock,
      };

      vi.stubGlobal('document', {
        body: mockBody,
        createElement: (tag: string) => {
          if (tag === 'a') {
            createdLink = {
              href: '',
              download: '',
              click: clickMock,
            };
            return createdLink;
          }
          return {};
        },
      });
    });

    it('should create blob with correct content type', () => {
      const config: AgentConfiguration = { name: 'test' };
      
      exportConfig(config);
      
      expect(createObjectURLMock).toHaveBeenCalledWith(
        expect.any(Blob)
      );
    });

    it('should set correct filename on download link', () => {
      const config: AgentConfiguration = { name: 'my-agent' };
      
      exportConfig(config);
      
      expect(createdLink.download).toBe('my-agent.json');
    });

    it('should use custom filename when provided', () => {
      const config: AgentConfiguration = { name: 'my-agent' };
      
      exportConfig(config, 'custom-export');
      
      expect(createdLink.download).toBe('custom-export.json');
    });

    it('should trigger click on the download link', () => {
      const config: AgentConfiguration = { name: 'test' };
      
      exportConfig(config);
      
      expect(clickMock).toHaveBeenCalled();
    });

    it('should clean up URL object after download', () => {
      const config: AgentConfiguration = { name: 'test' };
      
      exportConfig(config);
      
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:test-url');
    });

    it('should append and remove link from document body', () => {
      const config: AgentConfiguration = { name: 'test' };
      
      exportConfig(config);
      
      expect(appendChildMock).toHaveBeenCalled();
      expect(removeChildMock).toHaveBeenCalled();
    });
  });

  describe('FileHandler class', () => {
    it('should provide importFile method', async () => {
      const config: AgentConfiguration = { name: 'test' };
      const file = createMockFile(JSON.stringify(config));
      
      const result = await fileHandler.importFile(file);
      
      expect(result).toEqual(config);
    });

    it('should provide exportConfig method', () => {
      // Just verify the method exists and doesn't throw
      expect(() => {
        const handler = new FileHandler();
        expect(typeof handler.exportConfig).toBe('function');
      }).not.toThrow();
    });
  });

  describe('FileHandlerError', () => {
    it('should have correct name property', () => {
      const error = new FileHandlerError('JSON_PARSE_ERROR', 'test message');
      
      expect(error.name).toBe('FileHandlerError');
    });

    it('should have correct type property', () => {
      const error = new FileHandlerError('FILE_READ_ERROR', 'test message');
      
      expect(error.type).toBe('FILE_READ_ERROR');
    });

    it('should have correct message', () => {
      const error = new FileHandlerError('JSON_PARSE_ERROR', 'Invalid JSON: test');
      
      expect(error.message).toBe('Invalid JSON: test');
    });

    it('should be instanceof Error', () => {
      const error = new FileHandlerError('JSON_PARSE_ERROR', 'test');
      
      expect(error).toBeInstanceOf(Error);
    });
  });
});


// ============================================================================
// Property-Based Tests for Import/Export
// ============================================================================

// ============================================================================
// Arbitraries for generating valid AgentConfiguration objects
// ============================================================================

// Valid keyboard shortcut arbitrary
const validKeyboardShortcutArbitrary = fc.oneof(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')).map(k => `ctrl+${k}`),
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')).map(k => `shift+${k}`),
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')).map(k => `ctrl+shift+${k}`)
);

// Valid local MCP server arbitrary
const validLocalMCPServerArbitrary: fc.Arbitrary<MCPServerConfig> = fc.record({
  command: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  args: fc.option(fc.array(fc.string()), { nil: undefined }),
  env: fc.option(fc.dictionary(fc.string(), fc.string()), { nil: undefined }),
  timeout: fc.option(fc.integer({ min: 1 }), { nil: undefined }),
});

// Valid remote MCP server arbitrary
const validRemoteMCPServerArbitrary: fc.Arbitrary<MCPServerConfig> = fc.record({
  type: fc.constant('http' as const),
  url: fc.webUrl(),
});

// Valid MCP server arbitrary (either local or remote)
const validMCPServerArbitrary = fc.oneof(
  validLocalMCPServerArbitrary,
  validRemoteMCPServerArbitrary
);

// Valid hook arbitrary
const validHookArbitrary: fc.Arbitrary<Hook> = fc.record({
  command: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  timeout_ms: fc.option(fc.integer({ min: 1 }), { nil: undefined }),
  cache_ttl_seconds: fc.option(fc.integer({ min: 1 }), { nil: undefined }),
});

// Valid tool hook arbitrary (with matcher)
const validToolHookArbitrary: fc.Arbitrary<ToolHook> = fc.record({
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
const validKnowledgeBaseArbitrary: fc.Arbitrary<KnowledgeBaseResource> = fc.record({
  type: fc.constant('knowledgeBase' as const),
  source: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  description: fc.option(fc.string(), { nil: undefined }),
  indexType: fc.option(fc.constantFrom('best' as const, 'fast' as const), { nil: undefined }),
  autoUpdate: fc.option(fc.boolean(), { nil: undefined }),
});

// Valid resource arbitrary (string URI or knowledge base)
const validResourceArbitrary: fc.Arbitrary<Resource> = fc.oneof(
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

// Complete valid configuration arbitrary (with non-empty values to ensure round-trip works)
const validAgentConfigArbitrary: fc.Arbitrary<AgentConfiguration> = fc.record({
  name: fc.option(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), { nil: undefined }),
  description: fc.option(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), { nil: undefined }),
  prompt: fc.option(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), { nil: undefined }),
  mcpServers: fc.option(
    fc.dictionary(validServerNameArbitrary, validMCPServerArbitrary, { minKeys: 1, maxKeys: 3 }),
    { nil: undefined }
  ),
  tools: fc.option(fc.array(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 5 }), { nil: undefined }),
  toolAliases: fc.option(
    fc.array(fc.tuple(validToolReferenceArbitrary, validAliasNameArbitrary), { minLength: 1, maxLength: 3 })
      .map(pairs => Object.fromEntries(pairs)),
    { nil: undefined }
  ),
  allowedTools: fc.option(fc.array(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 5 }), { nil: undefined }),
  toolsSettings: fc.option(validToolsSettingsArbitrary, { nil: undefined }),
  resources: fc.option(fc.array(validResourceArbitrary, { minLength: 1, maxLength: 3 }), { nil: undefined }),
  hooks: fc.option(validHooksConfigArbitrary, { nil: undefined }),
  includeMcpJson: fc.option(fc.boolean(), { nil: undefined }),
  model: fc.option(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), { nil: undefined }),
  keyboardShortcut: fc.option(validKeyboardShortcutArbitrary, { nil: undefined }),
  welcomeMessage: fc.option(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), { nil: undefined }),
});

// Arbitrary for generating agent names (including empty/whitespace cases)
const agentNameArbitrary = fc.oneof(
  fc.constant(undefined),
  fc.constant(''),
  fc.constant('   '),
  fc.string({ minLength: 1 }).filter(s => s.trim().length > 0)
);

// Arbitrary for generating invalid JSON strings
const invalidJsonArbitrary = fc.oneof(
  // Malformed JSON syntax
  fc.constant('{ invalid json }'),
  fc.constant('{ "key": }'),
  fc.constant('{ "key" "value" }'),
  fc.constant('not json at all'),
  fc.constant('undefined'),
  fc.constant(''),
  // Valid JSON but not an object
  fc.constant('"just a string"'),
  fc.constant('123'),
  fc.constant('true'),
  fc.constant('null'),
  fc.constant('[1, 2, 3]'),
  fc.constant('["array", "of", "strings"]'),
  // Random strings that are unlikely to be valid JSON objects
  fc.string().filter(s => {
    try {
      const parsed = JSON.parse(s);
      return typeof parsed !== 'object' || parsed === null || Array.isArray(parsed);
    } catch {
      return true; // Not valid JSON
    }
  })
);

// ============================================================================
// Property 1: Import/Export Round-Trip Consistency
// **Validates: Requirements 2.2, 2.4, 3.1**
// ============================================================================

describe('Property 1: Import/Export Round-Trip Consistency', () => {
  /**
   * **Validates: Requirements 2.2, 2.4, 3.1**
   * 
   * For any valid AgentConfiguration object, exporting it to JSON and then
   * importing that JSON back should produce an equivalent configuration object
   * (with the same field values).
   */

  test.prop([validAgentConfigArbitrary], { numRuns: 100 })(
    'exporting to JSON and importing back should produce equivalent configuration',
    async (config) => {
      // Export the configuration to JSON string
      const exported = serializeConfig(config, true);
      
      // Create a mock file with the exported content
      const file = createMockFile(exported);
      
      // Import the JSON back
      const imported = await importFile(file);
      
      // The imported configuration should match the cleaned version of the original
      // (since export cleans the config)
      const cleanedOriginal = cleanConfig(config);
      expect(imported).toEqual(cleanedOriginal);
    }
  );

  test.prop([validAgentConfigArbitrary], { numRuns: 100 })(
    'round-trip should preserve all non-empty field values',
    async (config) => {
      const exported = serializeConfig(config, true);
      const file = createMockFile(exported);
      const imported = await importFile(file);
      
      // Check that all non-empty fields from the original are preserved
      const cleanedOriginal = cleanConfig(config);
      
      // All keys in cleaned original should exist in imported
      for (const key of Object.keys(cleanedOriginal)) {
        expect(imported).toHaveProperty(key);
        expect((imported as Record<string, unknown>)[key]).toEqual(
          (cleanedOriginal as Record<string, unknown>)[key]
        );
      }
    }
  );

  test.prop([validAgentConfigArbitrary], { numRuns: 100 })(
    'multiple round-trips should be idempotent',
    async (config) => {
      // First round-trip
      const exported1 = serializeConfig(config, true);
      const file1 = createMockFile(exported1);
      const imported1 = await importFile(file1);
      
      // Second round-trip
      const exported2 = serializeConfig(imported1, true);
      const file2 = createMockFile(exported2);
      const imported2 = await importFile(file2);
      
      // Third round-trip
      const exported3 = serializeConfig(imported2, true);
      const file3 = createMockFile(exported3);
      const imported3 = await importFile(file3);
      
      // All imports after the first should be identical
      expect(imported2).toEqual(imported1);
      expect(imported3).toEqual(imported1);
      
      // All exports after the first should be identical
      expect(exported2).toBe(exported1);
      expect(exported3).toBe(exported1);
    }
  );
});

// ============================================================================
// Property 2: Invalid JSON Error Handling
// **Validates: Requirements 2.3**
// ============================================================================

describe('Property 2: Invalid JSON Error Handling', () => {
  /**
   * **Validates: Requirements 2.3**
   * 
   * For any string that is not valid JSON or does not conform to the
   * AgentConfiguration schema, the File_Handler should return an error result
   * with a descriptive message rather than throwing an exception or producing
   * undefined behavior.
   */

  test.prop([invalidJsonArbitrary], { numRuns: 100 })(
    'should return FileHandlerError for invalid JSON strings',
    async (invalidJson) => {
      const file = createMockFile(invalidJson);
      
      // Should reject with FileHandlerError, not throw unhandled exception
      await expect(importFile(file)).rejects.toBeInstanceOf(FileHandlerError);
    }
  );

  test.prop([invalidJsonArbitrary], { numRuns: 100 })(
    'error should have descriptive message for invalid JSON',
    async (invalidJson) => {
      const file = createMockFile(invalidJson);
      
      try {
        await importFile(file);
        // Should not reach here
        expect.fail('Should have thrown FileHandlerError');
      } catch (error) {
        expect(error).toBeInstanceOf(FileHandlerError);
        const fileError = error as FileHandlerError;
        
        // Error should have a type
        expect(fileError.type).toBe('JSON_PARSE_ERROR');
        
        // Error message should be descriptive (non-empty)
        expect(fileError.message).toBeTruthy();
        expect(fileError.message.length).toBeGreaterThan(0);
        
        // Error message should contain "Invalid JSON"
        expect(fileError.message).toContain('Invalid JSON');
      }
    }
  );

  test.prop([invalidJsonArbitrary], { numRuns: 100 })(
    'should not produce undefined behavior for any invalid input',
    async (invalidJson) => {
      const file = createMockFile(invalidJson);
      
      // The function should either:
      // 1. Resolve with a valid object (if somehow the input is valid)
      // 2. Reject with a FileHandlerError
      // It should NEVER:
      // - Return undefined
      // - Return null
      // - Throw a non-FileHandlerError exception
      
      try {
        const result = await importFile(file);
        // If it resolves, result should be a valid object
        expect(result).toBeDefined();
        expect(result).not.toBeNull();
        expect(typeof result).toBe('object');
      } catch (error) {
        // If it rejects, it should be a FileHandlerError
        expect(error).toBeInstanceOf(FileHandlerError);
      }
    }
  );

  // Test with random strings that might be edge cases
  test.prop([fc.string()], { numRuns: 100 })(
    'should handle any arbitrary string input gracefully',
    async (randomString) => {
      const file = createMockFile(randomString);
      
      try {
        const result = await importFile(file);
        // If it succeeds, the string was valid JSON object
        expect(typeof result).toBe('object');
        expect(result).not.toBeNull();
        expect(Array.isArray(result)).toBe(false);
      } catch (error) {
        // If it fails, should be a proper FileHandlerError
        expect(error).toBeInstanceOf(FileHandlerError);
        expect((error as FileHandlerError).type).toBe('JSON_PARSE_ERROR');
      }
    }
  );
});

// ============================================================================
// Property 3: JSON Serialization Cleanliness
// **Validates: Requirements 3.2, 3.4, 9.5**
// ============================================================================

describe('Property 3: JSON Serialization Cleanliness', () => {
  /**
   * **Validates: Requirements 3.2, 3.4, 9.5**
   * 
   * For any AgentConfiguration object, the exported JSON should:
   * - Be properly indented (2 spaces)
   * - Omit all fields that are undefined, null, or empty arrays/objects
   * - Produce valid JSON that can be parsed back
   */

  test.prop([validAgentConfigArbitrary], { numRuns: 100 })(
    'exported JSON should be properly indented with 2 spaces',
    (config) => {
      const exported = serializeConfig(config, true);
      
      // Parse and re-stringify with 2-space indentation to compare
      const parsed = JSON.parse(exported);
      const expectedFormat = JSON.stringify(parsed, null, 2);
      
      expect(exported).toBe(expectedFormat);
    }
  );

  test.prop([validAgentConfigArbitrary], { numRuns: 100 })(
    'exported JSON should omit undefined values',
    (config) => {
      const exported = serializeConfig(config, true);
      const parsed = JSON.parse(exported);
      
      // Check recursively that no value is undefined
      function checkNoUndefined(obj: unknown, path: string = ''): void {
        if (obj === undefined) {
          throw new Error(`Found undefined at path: ${path}`);
        }
        if (typeof obj === 'object' && obj !== null) {
          if (Array.isArray(obj)) {
            obj.forEach((item, index) => checkNoUndefined(item, `${path}[${index}]`));
          } else {
            for (const [key, value] of Object.entries(obj)) {
              checkNoUndefined(value, path ? `${path}.${key}` : key);
            }
          }
        }
      }
      
      expect(() => checkNoUndefined(parsed)).not.toThrow();
    }
  );

  test.prop([validAgentConfigArbitrary], { numRuns: 100 })(
    'exported JSON should omit null values',
    (config) => {
      const exported = serializeConfig(config, true);
      const parsed = JSON.parse(exported);
      
      // Check recursively that no value is null
      function checkNoNull(obj: unknown, path: string = ''): void {
        if (obj === null) {
          throw new Error(`Found null at path: ${path}`);
        }
        if (typeof obj === 'object' && obj !== null) {
          if (Array.isArray(obj)) {
            obj.forEach((item, index) => checkNoNull(item, `${path}[${index}]`));
          } else {
            for (const [key, value] of Object.entries(obj)) {
              checkNoNull(value, path ? `${path}.${key}` : key);
            }
          }
        }
      }
      
      expect(() => checkNoNull(parsed)).not.toThrow();
    }
  );

  test.prop([validAgentConfigArbitrary], { numRuns: 100 })(
    'exported JSON should omit empty arrays',
    (config) => {
      const exported = serializeConfig(config, true);
      const parsed = JSON.parse(exported);
      
      // Check recursively that no array is empty
      function checkNoEmptyArrays(obj: unknown, path: string = ''): void {
        if (Array.isArray(obj) && obj.length === 0) {
          throw new Error(`Found empty array at path: ${path}`);
        }
        if (typeof obj === 'object' && obj !== null) {
          if (Array.isArray(obj)) {
            obj.forEach((item, index) => checkNoEmptyArrays(item, `${path}[${index}]`));
          } else {
            for (const [key, value] of Object.entries(obj)) {
              checkNoEmptyArrays(value, path ? `${path}.${key}` : key);
            }
          }
        }
      }
      
      expect(() => checkNoEmptyArrays(parsed)).not.toThrow();
    }
  );

  test.prop([validAgentConfigArbitrary], { numRuns: 100 })(
    'exported JSON should omit empty objects',
    (config) => {
      const exported = serializeConfig(config, true);
      const parsed = JSON.parse(exported);
      
      // Check recursively that no object is empty (except root can be empty)
      function checkNoEmptyObjects(obj: unknown, path: string = '', isRoot: boolean = true): void {
        if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
          if (!isRoot && Object.keys(obj).length === 0) {
            throw new Error(`Found empty object at path: ${path}`);
          }
          for (const [key, value] of Object.entries(obj)) {
            checkNoEmptyObjects(value, path ? `${path}.${key}` : key, false);
          }
        }
        if (Array.isArray(obj)) {
          obj.forEach((item, index) => checkNoEmptyObjects(item, `${path}[${index}]`, false));
        }
      }
      
      expect(() => checkNoEmptyObjects(parsed)).not.toThrow();
    }
  );

  test.prop([validAgentConfigArbitrary], { numRuns: 100 })(
    'exported JSON should be valid and parseable',
    (config) => {
      const exported = serializeConfig(config, true);
      
      // Should not throw when parsing
      expect(() => JSON.parse(exported)).not.toThrow();
      
      // Parsed result should be an object
      const parsed = JSON.parse(exported);
      expect(typeof parsed).toBe('object');
      expect(parsed).not.toBeNull();
      expect(Array.isArray(parsed)).toBe(false);
    }
  );

  test.prop([validAgentConfigArbitrary], { numRuns: 100 })(
    'exported JSON should omit empty strings',
    (config) => {
      const exported = serializeConfig(config, true);
      const parsed = JSON.parse(exported);
      
      // Check recursively that no string is empty
      function checkNoEmptyStrings(obj: unknown, path: string = ''): void {
        if (typeof obj === 'string' && obj === '') {
          throw new Error(`Found empty string at path: ${path}`);
        }
        if (typeof obj === 'object' && obj !== null) {
          if (Array.isArray(obj)) {
            obj.forEach((item, index) => checkNoEmptyStrings(item, `${path}[${index}]`));
          } else {
            for (const [key, value] of Object.entries(obj)) {
              checkNoEmptyStrings(value, path ? `${path}.${key}` : key);
            }
          }
        }
      }
      
      expect(() => checkNoEmptyStrings(parsed)).not.toThrow();
    }
  );

  test.prop([validAgentConfigArbitrary], { numRuns: 100 })(
    'cleanConfig should be idempotent',
    (config) => {
      const cleaned1 = cleanConfig(config);
      const cleaned2 = cleanConfig(cleaned1 as AgentConfiguration);
      
      // Cleaning twice should produce the same result
      expect(cleaned2).toEqual(cleaned1);
    }
  );
});

// ============================================================================
// Property 4: Filename Generation Logic
// **Validates: Requirements 3.3**
// ============================================================================

describe('Property 4: Filename Generation Logic', () => {
  /**
   * **Validates: Requirements 3.3**
   * 
   * For any AgentConfiguration object, the generated filename should be:
   * - `{name}.json` if the name field is set and non-empty (after sanitization)
   * - `agent-config.json` if the name field is not set, empty, or sanitizes to empty
   */

  // Helper to check if a name will produce a non-empty sanitized result
  const willProduceSanitizedName = (name: string | undefined): boolean => {
    if (name === undefined || name.trim() === '') return false;
    // Simulate the sanitization logic from generateFilename
    const sanitized = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return sanitized.length > 0;
  };

  test.prop([agentNameArbitrary], { numRuns: 100 })(
    'should generate correct filename based on name field presence',
    (name) => {
      const config: AgentConfiguration = name !== undefined ? { name } : {};
      const filename = generateFilename(config);
      
      // Check if name will produce a valid sanitized name
      const hasEffectiveName = willProduceSanitizedName(name);
      
      if (hasEffectiveName) {
        // Should be based on the name
        expect(filename).toMatch(/\.json$/);
        expect(filename).not.toBe('agent-config.json');
      } else {
        // Should be the default
        expect(filename).toBe('agent-config.json');
      }
    }
  );

  // Generate names that will definitely produce a non-empty sanitized result
  const validNameArbitrary = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_-]*$/).filter(s => s.length > 0);

  test.prop([validNameArbitrary], { numRuns: 100 })(
    'should generate {sanitized-name}.json for names with alphanumeric content',
    (name) => {
      const config: AgentConfiguration = { name };
      const filename = generateFilename(config);
      
      // Should end with .json
      expect(filename).toMatch(/\.json$/);
      
      // Should not be the default filename (since name has alphanumeric content)
      expect(filename).not.toBe('agent-config.json');
      
      // Filename (without .json) should only contain valid characters
      const nameWithoutExtension = filename.slice(0, -5);
      expect(nameWithoutExtension).toMatch(/^[a-z0-9_-]+$/);
    }
  );

  test.prop([fc.constantFrom(undefined, '', '   ', '\t', '\n')], { numRuns: 100 })(
    'should generate agent-config.json for empty/whitespace names',
    (name) => {
      const config: AgentConfiguration = name !== undefined ? { name } : {};
      const filename = generateFilename(config);
      
      expect(filename).toBe('agent-config.json');
    }
  );

  // Names that consist only of special characters (excluding underscore and hyphen which are valid)
  // should result in default filename
  test.prop([fc.stringMatching(/^[^a-zA-Z0-9_-]+$/).filter(s => s.length > 0)], { numRuns: 100 })(
    'should generate agent-config.json for names with only special characters',
    (name) => {
      const config: AgentConfiguration = { name };
      const filename = generateFilename(config);
      
      // Names with only special characters (not including _ or -) sanitize to empty, so default is used
      expect(filename).toBe('agent-config.json');
    }
  );

  test.prop([validAgentConfigArbitrary], { numRuns: 100 })(
    'generated filename should always end with .json',
    (config) => {
      const filename = generateFilename(config);
      
      expect(filename).toMatch(/\.json$/);
    }
  );

  test.prop([validAgentConfigArbitrary], { numRuns: 100 })(
    'generated filename should be a valid filename (no special characters)',
    (config) => {
      const filename = generateFilename(config);
      
      // Remove .json extension
      const nameWithoutExtension = filename.slice(0, -5);
      
      // Should only contain alphanumeric, hyphens, and underscores
      expect(nameWithoutExtension).toMatch(/^[a-z0-9_-]+$/);
    }
  );

  // Custom filename with non-empty value
  test.prop([fc.string({ minLength: 1 })], { numRuns: 100 })(
    'custom filename should be used when provided and non-empty',
    (customFilename) => {
      const config: AgentConfiguration = { name: 'some-agent' };
      const filename = generateFilename(config, customFilename);
      
      if (customFilename.endsWith('.json')) {
        expect(filename).toBe(customFilename);
      } else {
        expect(filename).toBe(`${customFilename}.json`);
      }
    }
  );

  test.prop([validAgentConfigArbitrary], { numRuns: 100 })(
    'filename generation should be deterministic',
    (config) => {
      const filename1 = generateFilename(config);
      const filename2 = generateFilename(config);
      const filename3 = generateFilename(config);
      
      expect(filename1).toBe(filename2);
      expect(filename2).toBe(filename3);
    }
  );

  // Test that special characters in names are properly sanitized
  test.prop([fc.string({ minLength: 1 }).map(s => s + 'valid')], { numRuns: 100 })(
    'should sanitize special characters in names',
    (name) => {
      const config: AgentConfiguration = { name };
      const filename = generateFilename(config);
      
      // Remove .json extension
      const nameWithoutExtension = filename.slice(0, -5);
      
      // Should not contain any special characters
      expect(nameWithoutExtension).not.toMatch(/[^a-z0-9_-]/);
    }
  );

  test.prop([validAgentConfigArbitrary], { numRuns: 100 })(
    'filename should be either based on name or default',
    (config) => {
      const filename = generateFilename(config);
      
      // Filename should either be agent-config.json or {something}.json
      expect(filename).toMatch(/^[a-z0-9_-]+\.json$/);
    }
  );
});
