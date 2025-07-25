import { PromptEngine } from '../src/core/promptEngine';

describe('PromptEngine', () => {
  let engine: PromptEngine;

  beforeEach(() => {
    engine = new PromptEngine();
  });

  describe('transformPrompt', () => {
    test('should generate strict mode prompt', () => {
      const schema = { type: 'object' as const, properties: { test: { type: 'string' } }, additionalProperties: false };
      const prompt = engine.transformPrompt('Test prompt', schema, { mode: 'strict' });

      expect(prompt).toContain('JSON-only response system');
      expect(prompt).toContain('Test prompt');
      expect(prompt).toContain(JSON.stringify(schema, null, 2));
    });

    test('should include examples when requested', () => {
      const schema = { type: 'object' as const, properties: { name: { type: 'string' } }, additionalProperties: false };
      const prompt = engine.transformPrompt('Get name', schema, { 
        mode: 'strict', 
        includeExamples: true 
      });

      expect(prompt).toContain('Example of valid response structure');
      expect(prompt).toContain('example string');
    });

    test('should add error recovery instructions', () => {
      const schema = { type: 'object' as const, properties: {}, additionalProperties: false };
      const prompt = engine.transformPrompt('Test', schema, { 
        mode: 'strict', 
        errorRecovery: true 
      });

      expect(prompt).toContain('If you encounter any issues');
    });
  });

  describe('applyTemplate', () => {
    test('should apply basic_json template', () => {
      const variables = {
        schema: '{"type": "object"}',
        request: 'Generate user data'
      };
      
      const prompt = engine.applyTemplate('basic_json', variables);
      
      expect(prompt).toContain('Generate user data');
      expect(prompt).toContain('{"type": "object"}');
    });

    test('should throw error for missing variables', () => {
      expect(() => {
        engine.applyTemplate('basic_json', { schema: 'test' });
      }).toThrow('Missing required variable');
    });

    test('should throw error for unknown template', () => {
      expect(() => {
        engine.applyTemplate('unknown_template', {});
      }).toThrow('Template \'unknown_template\' not found');
    });
  });

  describe('generateExampleFromSchema', () => {
    test('should generate examples for different types', () => {
      const schema = JSON.stringify({
        type: 'object',
        properties: {
          string: { type: 'string' },
          number: { type: 'number' },
          boolean: { type: 'boolean' },
          array: { type: 'array' }
        }
      });

      const example = engine.generateExampleFromSchema(schema);
      const parsed = JSON.parse(example);

      expect(parsed.string).toBe('example string');
      expect(parsed.number).toBe(0);
      expect(parsed.boolean).toBe(true);
      expect(Array.isArray(parsed.array)).toBe(true);
    });

    test('should handle enum values', () => {
      const schema = JSON.stringify({
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'inactive'] }
        }
      });

      const example = engine.generateExampleFromSchema(schema);
      const parsed = JSON.parse(example);

      expect(parsed.status).toBe('active');
    });
  });
});