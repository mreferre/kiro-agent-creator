/**
 * ExampleGenerator Service Tests
 * 
 * Tests for the ExampleGenerator service that provides example agent configurations.
 * 
 * Validates: Requirements 13.2, 13.3, 13.7
 */

import { describe, it, expect } from 'vitest';
import { getExamples, getExample } from './ExampleGenerator';
import { validate } from './ValidationEngine';

describe('ExampleGenerator', () => {
  describe('getExamples', () => {
    it('should return an array of examples', () => {
      const examples = getExamples();
      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
    });

    it('should return at least 3 examples', () => {
      const examples = getExamples();
      expect(examples.length).toBeGreaterThanOrEqual(3);
    });

    it('should include Rust Backend example', () => {
      const examples = getExamples();
      const rustExample = examples.find(e => e.id === 'rust-backend');
      expect(rustExample).toBeDefined();
      expect(rustExample?.name).toBe('Rust Backend Developer');
    });

    it('should include Frontend React example', () => {
      const examples = getExamples();
      const reactExample = examples.find(e => e.id === 'frontend-react');
      expect(reactExample).toBeDefined();
      expect(reactExample?.name).toBe('Frontend React Developer');
    });

    it('should include DevOps AWS example', () => {
      const examples = getExamples();
      const devopsExample = examples.find(e => e.id === 'devops-aws');
      expect(devopsExample).toBeDefined();
      expect(devopsExample?.name).toBe('DevOps AWS Engineer');
    });
  });

  describe('getExample', () => {
    it('should return the correct example by ID', () => {
      const example = getExample('rust-backend');
      expect(example).toBeDefined();
      expect(example?.id).toBe('rust-backend');
    });

    it('should return undefined for non-existent ID', () => {
      const example = getExample('non-existent');
      expect(example).toBeUndefined();
    });
  });

  describe('Example Validity (Property 11)', () => {
    it('all examples should have valid configurations', () => {
      const examples = getExamples();
      
      for (const example of examples) {
        const result = validate(example.config);
        expect(result.isValid).toBe(true);
        expect(Object.keys(result.errors)).toHaveLength(0);
      }
    });

    it('all examples should have required metadata', () => {
      const examples = getExamples();
      
      for (const example of examples) {
        expect(example.id).toBeTruthy();
        expect(example.name).toBeTruthy();
        expect(example.description).toBeTruthy();
        expect(example.config).toBeDefined();
      }
    });

    it('all examples should have unique IDs', () => {
      const examples = getExamples();
      const ids = examples.map(e => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all examples should have a name in their config', () => {
      const examples = getExamples();
      
      for (const example of examples) {
        expect(example.config.name).toBeTruthy();
      }
    });

    it('all examples should have a description in their config', () => {
      const examples = getExamples();
      
      for (const example of examples) {
        expect(example.config.description).toBeTruthy();
      }
    });

    it('all examples should have a prompt in their config', () => {
      const examples = getExamples();
      
      for (const example of examples) {
        expect(example.config.prompt).toBeTruthy();
      }
    });

    it('all examples should have a model in their config', () => {
      const examples = getExamples();
      
      for (const example of examples) {
        expect(example.config.model).toBeTruthy();
      }
    });

    it('all examples should have tools defined', () => {
      const examples = getExamples();
      
      for (const example of examples) {
        expect(example.config.tools).toBeDefined();
        expect(Array.isArray(example.config.tools)).toBe(true);
        expect(example.config.tools!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Example Content Quality', () => {
    it('Rust Backend example should have Rust-specific tools and settings', () => {
      const example = getExample('rust-backend');
      expect(example).toBeDefined();
      
      // Should have shell tool for cargo commands
      expect(example?.config.tools).toContain('shell');
      
      // Should have Rust-specific shell commands allowed
      expect(example?.config.toolsSettings?.shell?.allowedCommands).toContain('cargo');
      expect(example?.config.toolsSettings?.shell?.allowedCommands).toContain('rustc');
    });

    it('Frontend React example should have frontend-specific tools and settings', () => {
      const example = getExample('frontend-react');
      expect(example).toBeDefined();
      
      // Should have shell tool for npm commands
      expect(example?.config.tools).toContain('shell');
      
      // Should have npm/yarn commands allowed
      expect(example?.config.toolsSettings?.shell?.allowedCommands).toContain('npm');
    });

    it('DevOps AWS example should have AWS-specific tools and settings', () => {
      const example = getExample('devops-aws');
      expect(example).toBeDefined();
      
      // Should have AWS tool
      expect(example?.config.tools).toContain('aws');
      
      // Should have AWS services allowed
      expect(example?.config.toolsSettings?.aws?.allowedServices).toBeDefined();
      expect(example?.config.toolsSettings?.aws?.allowedServices?.length).toBeGreaterThan(0);
      
      // Should have MCP server configured
      expect(example?.config.mcpServers).toBeDefined();
    });
  });
});
