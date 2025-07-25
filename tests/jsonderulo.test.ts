import { Jsonderulo } from '../src/core/jsonderulo';

describe('Jsonderulo', () => {
  let jsonderulo: Jsonderulo;

  beforeEach(() => {
    jsonderulo = new Jsonderulo();
  });

  describe('speak', () => {
    test('should transform basic request', () => {
      const result = jsonderulo.speak('Generate user data');
      
      expect(result.prompt).toBeDefined();
      expect(result.schema).toBeDefined();
      expect(result.schema.type).toBe('object');
    });

    test('should use provided schema description', () => {
      const result = jsonderulo.speak(
        'Get user info',
        'A name field and an email field, both required'
      );
      
      expect(result.schema.properties).toHaveProperty('name');
      expect(result.schema.properties).toHaveProperty('email');
      expect(result.schema.required).toContain('name');
      expect(result.schema.required).toContain('email');
    });

    test('should apply different modes', () => {
      const strictResult = jsonderulo.speak('Test', undefined, { mode: 'strict' });
      const explanatoryResult = jsonderulo.speak('Test', undefined, { mode: 'explanatory' });
      
      expect(strictResult.systemPrompt).toContain('JSON-only');
      expect(explanatoryResult.systemPrompt).toContain('explanation fields');
    });
  });

  describe('useTemplate', () => {
    test('should apply template with variables', () => {
      const variables = {
        schema: JSON.stringify({ type: 'object' }),
        text: 'Sample text'
      };
      
      const result = jsonderulo.useTemplate('extraction', variables);
      
      expect(result.prompt).toContain('Sample text');
      expect(result.schema).toEqual({ type: 'object' });
    });
  });

  describe('validate', () => {
    test('should validate response against schema', () => {
      const schema = {
        type: 'object',
        properties: { test: { type: 'string' } },
        required: ['test']
      };
      
      const validResult = jsonderulo.validate({ test: 'value' }, schema);
      const invalidResult = jsonderulo.validate({}, schema);
      
      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
    });
  });

  describe('repair', () => {
    test('should repair invalid JSON', () => {
      const repaired = jsonderulo.repair('{test: "value"}');
      expect(repaired).toBe('{"test": "value"}');
    });
  });

  describe('process', () => {
    test('should process request with LLM function', async () => {
      const mockLLM = jest.fn().mockResolvedValue('{"result": "success"}');
      
      const result = await jsonderulo.process(
        'Generate response',
        mockLLM,
        { maxRetries: 1 }
      );
      
      expect(mockLLM).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ result: 'success' });
    });

    test('should retry on validation failure', async () => {
      const mockLLM = jest.fn()
        .mockResolvedValueOnce('invalid json')
        .mockResolvedValueOnce('{"valid": true}');
      
      const result = await jsonderulo.process(
        'Generate valid response',
        mockLLM,
        { maxRetries: 2, autoRepair: true }
      );
      
      expect(mockLLM).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
    });

    test('should fail after max retries', async () => {
      const mockLLM = jest.fn().mockResolvedValue('invalid json');
      
      const result = await jsonderulo.process(
        'Generate response',
        mockLLM,
        { maxRetries: 2 }
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.attempts).toBe(2);
    });
  });

  describe('getAvailableTemplates', () => {
    test('should return list of templates', () => {
      const templates = jsonderulo.getAvailableTemplates();
      
      expect(templates).toContain('basic_json');
      expect(templates).toContain('extraction');
      expect(templates).toContain('classification');
      expect(templates).toContain('analysis');
    });
  });

  describe('exportConfig', () => {
    test('should export configuration', () => {
      const config = jsonderulo.exportConfig();
      
      expect(config.version).toBe('1.0.0');
      expect(config.templates).toBeDefined();
      expect(config.modes).toContain('strict');
      expect(config.modes).toContain('explanatory');
    });
  });
});