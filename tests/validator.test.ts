import { JsonValidator } from '../src/core/validator';

describe('JsonValidator', () => {
  let validator: JsonValidator;

  beforeEach(() => {
    validator = new JsonValidator();
  });

  describe('validate', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 2 },
        age: { type: 'number', minimum: 0, maximum: 120 },
        email: { type: 'string', pattern: '^[\\w.-]+@[\\w.-]+\\.\\w+$' }
      },
      required: ['name', 'age'],
      additionalProperties: false
    };

    test('should validate valid JSON', () => {
      const data = { name: 'John', age: 30, email: 'john@example.com' };
      const result = validator.validate(data, schema);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('should catch missing required fields', () => {
      const data = { name: 'John' };
      const result = validator.validate(data, schema);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].keyword).toBe('required');
      expect(result.suggestions).toContain('Add missing required field: age');
    });

    test('should catch type errors', () => {
      const data = { name: 'John', age: '30' };
      const result = validator.validate(data, schema);
      
      expect(result.valid).toBe(false);
      expect(result.errors![0].keyword).toBe('type');
    });

    test('should catch constraint violations', () => {
      const data = { name: 'J', age: 150 };
      const result = validator.validate(data, schema);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    test('should handle invalid JSON syntax', () => {
      const invalidJson = '{"name": "John", "age": 30,}';
      const result = validator.validate(invalidJson, schema);
      
      expect(result.valid).toBe(false);
      expect(result.errors![0].keyword).toBe('parse');
    });
  });

  describe('repairJson', () => {
    test('should fix missing quotes around keys', () => {
      const invalid = '{name: "John", age: 30}';
      const repaired = validator.repairJson(invalid);
      
      expect(repaired).toBe('{"name": "John", "age": 30}');
    });

    test('should fix trailing commas', () => {
      const invalid = '{"name": "John", "age": 30,}';
      const repaired = validator.repairJson(invalid);
      
      expect(repaired).toBe('{"name": "John", "age": 30}');
    });

    test('should convert single quotes to double quotes', () => {
      const invalid = "{'name': 'John'}";
      const repaired = validator.repairJson(invalid);
      
      expect(repaired).toBe('{"name": "John"}');
    });

    test('should add missing closing brackets', () => {
      const invalid = '{"name": "John"';
      const repaired = validator.repairJson(invalid);
      
      expect(repaired).toBe('{"name": "John"}');
    });

    test('should return null for unrepairable JSON', () => {
      const invalid = 'not json at all';
      const repaired = validator.repairJson(invalid);
      
      expect(repaired).toBeNull();
    });
  });

  describe('generateRecoveryPrompt', () => {
    test('should generate recovery prompt with errors and suggestions', () => {
      const schema = { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] };
      const validationResult = {
        valid: false,
        errors: [{ path: '/', message: 'missing required field', keyword: 'required', params: {} }],
        suggestions: ['Add missing required field: name']
      };
      
      const prompt = validator.generateRecoveryPrompt(
        'Generate user',
        '{}',
        validationResult,
        schema
      );
      
      expect(prompt).toContain('failed validation');
      expect(prompt).toContain('Generate user');
      expect(prompt).toContain('missing required field');
      expect(prompt).toContain('Add missing required field: name');
    });
  });
});