import { OutputValidator, BusinessRule } from '../../src/pipeline/outputValidator.js';
import { ValidationRules } from '../../src/pipeline/types.js';

describe('OutputValidator', () => {
  let validator: OutputValidator;

  beforeEach(() => {
    validator = new OutputValidator();
  });

  describe('validateOutput', () => {
    test('should validate output against schema', async () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          value: { type: 'number' },
        },
        required: ['name', 'value'],
      };

      const validOutput = { name: 'test', value: 42 };
      const rules: ValidationRules = {
        requiredFields: ['name', 'value'],
        enableAutoRepair: false,
      };

      const result = await validator.validateOutput(validOutput, rules, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(result.validationMetrics).toBeDefined();
      expect(result.validationMetrics?.schemaCompliance).toBe(1);
    });

    test('should detect schema violations', async () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          value: { type: 'number' },
        },
        required: ['name', 'value'],
      };

      const invalidOutput = { name: 'test' }; // missing required 'value'
      const rules: ValidationRules = {
        requiredFields: ['name', 'value'],
        enableAutoRepair: false,
      };

      const result = await validator.validateOutput(invalidOutput, rules, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.validationMetrics?.schemaCompliance).toBe(0);
    });

    test('should emit validation events', async () => {
      const startedHandler = jest.fn();
      const completedHandler = jest.fn();

      validator.on('validation-started', startedHandler);
      validator.on('validation-completed', completedHandler);

      const rules: ValidationRules = {
        requiredFields: ['test'],
        enableAutoRepair: false,
      };

      await validator.validateOutput({}, rules);

      expect(startedHandler).toHaveBeenCalledTimes(1);
      expect(completedHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateSemantics', () => {
    test('should detect incomplete output', async () => {
      const incompleteOutput = {
        report: 'This is incomplete...',
        findings: null,
        recommendations: undefined,
      };

      const rules: ValidationRules = {
        requiredFields: ['report'],
        enableAutoRepair: false,
      };

      const result = await validator.validateSemantics(incompleteOutput, rules);

      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.type === 'incompleteness')).toBe(true);
      expect(result.score).toBeLessThan(1);
    });

    test('should detect ambiguous language', async () => {
      const ambiguousOutput = {
        analysis: 'This might possibly be correct',
        confidence: 'somewhat high',
      };

      const result = await validator.validateSemantics(ambiguousOutput, {
        requiredFields: [],
        enableAutoRepair: false,
      });

      expect(result.issues.some(i => i.type === 'ambiguity')).toBe(true);
    });

    test('should pass clean semantic validation', async () => {
      const cleanOutput = {
        report: 'Clear and complete analysis',
        findings: ['Finding 1', 'Finding 2'],
        recommendations: ['Action 1', 'Action 2'],
      };

      const result = await validator.validateSemantics(cleanOutput, {
        requiredFields: [],
        enableAutoRepair: false,
      });

      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThan(0.8);
    });
  });

  describe('validateBusinessRules', () => {
    test('should validate against business rules', async () => {
      const rules: BusinessRule[] = [
        {
          name: 'minimum-items',
          description: 'Must have at least 3 items',
          check: (output) => output.items?.length >= 3,
          severity: 'critical',
          errorMessage: 'Output must contain at least 3 items',
        },
        {
          name: 'max-value',
          description: 'Values must not exceed 100',
          check: (output) => output.items?.every((i: any) => i.value <= 100),
          severity: 'major',
          errorMessage: 'Item values exceed maximum allowed',
        },
      ];

      const validOutput = {
        items: [
          { value: 10 },
          { value: 20 },
          { value: 30 },
        ],
      };

      const result = await validator.validateBusinessRules(validOutput, rules);

      expect(result.passed).toBe(true);
      expect(result.passedRules).toContain('minimum-items');
      expect(result.passedRules).toContain('max-value');
      expect(result.score).toBe(1);
    });

    test('should detect business rule violations', async () => {
      const rules: BusinessRule[] = [
        {
          name: 'minimum-items',
          description: 'Must have at least 3 items',
          check: (output) => output.items?.length >= 3,
          severity: 'critical',
          errorMessage: 'Output must contain at least 3 items',
          remediation: 'Add more items to meet minimum requirement',
        },
      ];

      const invalidOutput = {
        items: [{ value: 10 }], // Only 1 item
      };

      const result = await validator.validateBusinessRules(invalidOutput, rules);

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBe(1);
      expect(result.violations[0].severity).toBe('critical');
      expect(result.violations[0].remediation).toBeDefined();
    });

    test('should handle rule check errors gracefully', async () => {
      const rules: BusinessRule[] = [
        {
          name: 'error-rule',
          description: 'Rule that throws error',
          check: () => { throw new Error('Rule error'); },
          severity: 'major',
          errorMessage: 'Rule check failed',
        },
      ];

      const result = await validator.validateBusinessRules({}, rules);

      expect(result.passed).toBe(true); // No critical violations
      expect(result.violations.length).toBe(1);
      expect(result.violations[0].description).toContain('Rule check failed');
    });
  });

  describe('repairOutput', () => {
    test('should repair missing required fields', async () => {
      const output = { name: 'test' };
      const schemaErrors = [{
        keyword: 'required',
        params: { missingProperty: 'value' },
      }];

      const result = await validator.repairOutput(
        output,
        schemaErrors,
        [],
        [],
        3
      );

      expect(result.success).toBe(true);
      expect(result.output.value).toBeDefined();
      expect(result.repairs.length).toBe(1);
      expect(result.repairs[0].type).toBe('schema');
    });

    test('should repair type mismatches', async () => {
      const output = { count: '5' }; // String instead of number
      const schemaErrors = [{
        keyword: 'type',
        instancePath: '/count',
        params: { type: 'number' },
      }];

      const result = await validator.repairOutput(
        output,
        schemaErrors,
        [],
        [],
        3
      );

      expect(result.success).toBe(true);
      expect(typeof result.output.count).toBe('number');
      expect(result.output.count).toBe(5);
    });

    test('should respect max repair attempts', async () => {
      const output = {};
      const manyErrors = Array(10).fill({
        keyword: 'required',
        params: { missingProperty: 'field' },
      });

      const result = await validator.repairOutput(
        output,
        manyErrors,
        [],
        [],
        3 // Max 3 attempts
      );

      expect(result.repairs.length).toBeLessThanOrEqual(3);
    });

    test('should decrease confidence with each repair', async () => {
      const output = {};
      const errors = [
        { keyword: 'required', params: { missingProperty: 'field1' } },
        { keyword: 'required', params: { missingProperty: 'field2' } },
      ];

      const result = await validator.repairOutput(
        output,
        errors,
        [],
        [],
        5
      );

      expect(result.confidence).toBeLessThan(1);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('auto-repair integration', () => {
    test('should auto-repair when enabled in rules', async () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          count: { type: 'number' },
        },
        required: ['name', 'count'],
      };

      const invalidOutput = { name: 'test' }; // Missing count
      const rules: ValidationRules = {
        requiredFields: ['name', 'count'],
        enableAutoRepair: true,
        maxRepairAttempts: 3,
      };

      const result = await validator.validateOutput(invalidOutput, rules, schema);

      expect(result.repairAttempted).toBe(true);
      expect(result.repairedOutput).toBeDefined();
      expect(result.repairedOutput.count).toBeDefined();
    });

    test('should not repair when disabled', async () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      };

      const invalidOutput = {}; // Missing name
      const rules: ValidationRules = {
        requiredFields: ['name'],
        enableAutoRepair: false,
      };

      const result = await validator.validateOutput(invalidOutput, rules, schema);

      expect(result.repairAttempted).toBe(false);
      expect(result.repairedOutput).toBeUndefined();
    });
  });

  describe('registerBusinessRule', () => {
    test('should register and apply custom business rules', async () => {
      const customRule: BusinessRule = {
        name: 'custom-validation',
        description: 'Custom validation logic',
        check: (output) => output.customField === 'expected',
        severity: 'major',
        errorMessage: 'Custom field validation failed',
      };

      validator.registerBusinessRule('custom', customRule);

      const output = { customField: 'expected' };
      const result = await validator.validateBusinessRules(
        output,
        [customRule]
      );

      expect(result.passed).toBe(true);
      expect(result.passedRules).toContain('custom-validation');
    });
  });

  describe('validation metrics', () => {
    test('should calculate comprehensive metrics', async () => {
      const schema = {
        type: 'object',
        properties: {
          report: { type: 'string' },
          items: { type: 'array' },
        },
        required: ['report', 'items'],
      };

      const output = {
        report: 'Complete report',
        items: [1, 2, 3],
      };

      const rules: ValidationRules = {
        requiredFields: ['report', 'items'],
        enableAutoRepair: false,
      };

      const result = await validator.validateOutput(output, rules, schema);

      expect(result.validationMetrics).toBeDefined();
      expect(result.validationMetrics?.totalChecks).toBe(3);
      expect(result.validationMetrics?.overallScore).toBeGreaterThan(0.5);
      expect(result.validationMetrics?.validationTime).toBeGreaterThan(0);
    });
  });

  describe('output type specific validation', () => {
    test('should validate structured reports', async () => {
      const reportOutput = {
        summary: 'Executive summary',
        findings: ['Finding 1', 'Finding 2'],
        recommendations: ['Recommendation 1'],
      };

      const rules: ValidationRules = {
        requiredFields: ['summary', 'findings', 'recommendations'],
        enableAutoRepair: false,
      };

      const result = await validator.validateOutput(reportOutput, rules);

      expect(result.semanticValid).toBe(true);
    });

    test('should validate action items', async () => {
      const actionOutput = {
        actions: [
          { task: 'Task 1', priority: 'high' },
          { task: 'Task 2', priority: 'medium' },
        ],
      };

      const rules: ValidationRules = {
        requiredFields: ['actions'],
        enableAutoRepair: false,
      };

      const result = await validator.validateOutput(actionOutput, rules);

      expect(result.semanticValid).toBe(true);
    });
  });
});