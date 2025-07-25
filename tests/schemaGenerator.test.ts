import { SchemaGenerator } from '../src/core/schemaGenerator';

describe('SchemaGenerator', () => {
  let generator: SchemaGenerator;

  beforeEach(() => {
    generator = new SchemaGenerator();
  });

  describe('generateFromDescription', () => {
    test('should generate schema for simple fields', () => {
      const description = 'A name field that is required and an optional age field';
      const schema = generator.generateFromDescription(description);

      expect(schema.type).toBe('object');
      expect(schema.properties).toHaveProperty('name');
      expect(schema.properties).toHaveProperty('age');
      expect(schema.required).toContain('name');
      expect(schema.additionalProperties).toBe(false);
    });

    test('should infer correct types', () => {
      const description = 'A username (string), age (number), and isActive (boolean)';
      const schema = generator.generateFromDescription(description);

      expect(schema.properties.username.type).toBe('string');
      expect(schema.properties.age.type).toBe('number');
      expect(schema.properties.isActive.type).toBe('boolean');
    });

    test('should handle constraints', () => {
      const description = 'An email field with at least 5 characters and a score between 0 and 100';
      const schema = generator.generateFromDescription(description);

      expect(schema.properties.email.minLength).toBe(5);
      expect(schema.properties.email.pattern).toBeDefined();
    });

    test('should handle enum values', () => {
      const description = 'A status field that can be one of: pending, approved, rejected';
      const schema = generator.generateFromDescription(description);

      expect(schema.properties.status.enum).toEqual(['pending', 'approved', 'rejected']);
    });

    test('should infer schema from context when no explicit fields', () => {
      const description = 'Perform sentiment analysis on the text';
      const schema = generator.generateFromDescription(description);

      expect(schema.properties).toHaveProperty('sentiment');
      expect(schema.properties).toHaveProperty('confidence');
      expect(schema.properties).toHaveProperty('explanation');
    });
  });
});