import { describe, it, expect, beforeEach } from 'vitest';
import { AdvancedPrompting } from '../src/core/advancedPrompting.js';
import { z } from 'zod';

describe('AdvancedPrompting', () => {
  let advancedPrompting: AdvancedPrompting;

  beforeEach(() => {
    advancedPrompting = new AdvancedPrompting();
  });

  describe('Chain of Thought (CoT)', () => {
    it('should generate CoT prompt with steps', () => {
      const result = advancedPrompting.generateCoTPrompt(
        'Analyze the financial data and identify trends',
        undefined,
        { explicitReasoning: true }
      );

      expect(result.strategy).toBe('cot');
      expect(result.prompt).toContain('step-by-step');
      expect(result.prompt).toContain('reasoning');
      expect(result.metadata.steps).toBeDefined();
      expect(result.metadata.steps!.length).toBeGreaterThan(0);
    });

    it('should generate structured CoT prompt', () => {
      const schema = z.object({
        analysis: z.string(),
        trends: z.array(z.string()),
        recommendations: z.array(z.string()),
      });

      const result = advancedPrompting.generateCoTPrompt(
        'Analyze sales data',
        schema,
        { structured: true }
      );

      expect(result.prompt).toContain('Structure your response as follows');
      expect(result.prompt).toContain('JSON schema');
    });

    it('should infer appropriate steps for different tasks', () => {
      const analysisResult = advancedPrompting.generateCoTPrompt('Analyze this dataset');
      const problemResult = advancedPrompting.generateCoTPrompt('Solve this optimization problem');
      const classifyResult = advancedPrompting.generateCoTPrompt('Classify these documents');

      expect(analysisResult.metadata.steps![0].thought).toContain('understand');
      expect(problemResult.metadata.steps![0].thought).toContain('problem');
      expect(classifyResult.metadata.steps![0].thought).toContain('characteristics');
    });
  });

  describe('Tree of Thoughts (ToT)', () => {
    it('should generate ToT prompt with exploration instructions', () => {
      const result = advancedPrompting.generateToTPrompt(
        'Find the optimal algorithm for this problem'
      );

      expect(result.strategy).toBe('tot');
      expect(result.prompt).toContain('explore');
      expect(result.prompt).toContain('approaches');
      expect(result.prompt).toContain('evaluate');
      expect(result.metadata.tree).toBeDefined();
    });

    it('should customize branches and evaluation criteria', () => {
      const result = advancedPrompting.generateToTPrompt(
        'Design a scalable system architecture',
        undefined,
        {
          branches: 4,
          depth: 2,
          evaluationCriteria: ['Performance', 'Scalability', 'Cost'],
        }
      );

      expect(result.prompt).toContain('4 different initial approaches');
      expect(result.prompt).toContain('Performance');
      expect(result.prompt).toContain('Scalability');
      expect(result.prompt).toContain('Cost');
    });
  });

  describe('Self-Consistency', () => {
    it('should generate multiple prompt variations', () => {
      const results = advancedPrompting.generateSelfConsistencyPrompt(
        'Extract key information from this text',
        undefined,
        { variations: 3 }
      );

      expect(results.length).toBe(3);
      expect(results[0].strategy).toBe('self-consistency');
      // Variations should have different phrasings
      expect(new Set(results.map(r => r.prompt)).size).toBeGreaterThan(1);
    });

    it('should include schema in all variations', () => {
      const schema = z.object({ key: z.string(), value: z.number() });
      
      const results = advancedPrompting.generateSelfConsistencyPrompt(
        'Parse this data',
        schema,
        { variations: 2 }
      );

      results.forEach(result => {
        expect(result.prompt).toContain('JSON');
        expect(result.prompt).toContain('schema');
      });
    });
  });

  describe('Consistency Analysis', () => {
    it('should analyze consistent outputs', () => {
      const outputs = [
        { name: 'John', age: 30, city: 'NYC' },
        { name: 'John', age: 30, city: 'NYC' },
        { name: 'John', age: 30, city: 'NYC' },
      ];

      const result = advancedPrompting.analyzeConsistency(outputs);

      expect(result.confidenceScore).toBe(1);
      expect(result.consensusOutput).toEqual(outputs[0]);
      expect(result.variations.length).toBe(0);
    });

    it('should identify variations in outputs', () => {
      const outputs = [
        { name: 'John', age: 30, city: 'NYC' },
        { name: 'John', age: 31, city: 'NYC' },
        { name: 'John', age: 30, city: 'Boston' },
      ];

      const result = advancedPrompting.analyzeConsistency(outputs);

      expect(result.confidenceScore).toBeLessThan(1);
      expect(result.variations.length).toBeGreaterThan(0);
      
      const ageVariation = result.variations.find(v => v.field === 'age');
      expect(ageVariation).toBeDefined();
      expect(ageVariation!.values).toContain(30);
      expect(ageVariation!.values).toContain(31);
    });

    it('should find consensus values', () => {
      const outputs = [
        { status: 'active', count: 10 },
        { status: 'active', count: 12 },
        { status: 'active', count: 10 },
        { status: 'inactive', count: 10 },
      ];

      const result = advancedPrompting.analyzeConsistency(outputs);

      expect(result.consensusOutput?.status).toBe('active');
      expect(result.consensusOutput?.count).toBe(10);
    });
  });

  describe('Role-Based Prompting', () => {
    it('should generate role-based prompt with expertise', () => {
      const result = advancedPrompting.generateRoleBasedPrompt(
        'Analyze this dataset for patterns',
        'data-analyst'
      );

      expect(result.strategy).toBe('role-based');
      expect(result.prompt).toContain('data analyst');
      expect(result.prompt).toContain('expertise');
      expect(result.metadata.role).toBeDefined();
      expect(result.metadata.role!.expertise).toContain('data analysis');
    });

    it('should apply role constraints', () => {
      const result = advancedPrompting.generateRoleBasedPrompt(
        'Review this code for issues',
        'quality-assurance'
      );

      expect(result.prompt).toContain('Constraints');
      expect(result.metadata.role!.constraints).toBeDefined();
    });

    it('should support custom roles', () => {
      const result = advancedPrompting.generateRoleBasedPrompt(
        'Design a database schema',
        'custom-role',
        undefined,
        {
          description: 'database architect with 10 years experience',
          expertise: ['SQL', 'NoSQL', 'performance optimization'],
          traits: ['detail-oriented', 'systematic'],
        }
      );

      expect(result.prompt).toContain('database architect');
      expect(result.prompt).toContain('SQL');
      expect(result.metadata.role!.name).toBe('custom-role');
    });
  });

  describe('Strategy Combination', () => {
    it('should combine multiple strategies', () => {
      const result = advancedPrompting.combineStrategies(
        'Create a comprehensive analysis',
        ['cot', 'role-based']
      );

      expect(result.prompt).toContain('Step-by-step approach');
      expect(result.metadata.role).toBeDefined();
    });

    it('should handle schema in combined strategies', () => {
      const schema = z.object({
        summary: z.string(),
        details: z.array(z.string()),
      });

      const result = advancedPrompting.combineStrategies(
        'Analyze this report',
        ['cot'],
        schema
      );

      expect(result.prompt).toContain('JSON');
      expect(result.prompt).toContain('conforming to');
    });
  });

  describe('System Prompts', () => {
    it('should generate appropriate system prompts', () => {
      const cotResult = advancedPrompting.generateCoTPrompt('Task');
      const totResult = advancedPrompting.generateToTPrompt('Task');
      const roleResult = advancedPrompting.generateRoleBasedPrompt('Task', 'data-analyst');

      expect(cotResult.systemPrompt).toContain('step-by-step');
      expect(totResult.systemPrompt).toContain('multiple solution paths');
      expect(roleResult.systemPrompt).toContain('data analyst');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty outputs in consistency analysis', () => {
      const result = advancedPrompting.analyzeConsistency([]);

      expect(result.outputs).toEqual([]);
      expect(result.confidenceScore).toBe(0);
      expect(result.variations).toEqual([]);
    });

    it('should handle nested objects in consistency analysis', () => {
      const outputs = [
        { user: { name: 'John', prefs: { theme: 'dark' } } },
        { user: { name: 'John', prefs: { theme: 'light' } } },
      ];

      const result = advancedPrompting.analyzeConsistency(outputs);

      const themeVariation = result.variations.find(v => v.field.includes('theme'));
      expect(themeVariation).toBeDefined();
    });

    it('should handle complex schemas in prompts', () => {
      const complexSchema = z.object({
        id: z.string().uuid(),
        data: z.array(z.object({
          timestamp: z.string().datetime(),
          values: z.record(z.number()),
        })),
        metadata: z.optional(z.any()),
      });

      const result = advancedPrompting.generateCoTPrompt(
        'Process this data',
        complexSchema
      );

      expect(result.prompt).toContain('JSON schema');
      expect(() => JSON.parse(result.prompt.match(/JSON schema:\n(.+?)\n\n/s)?.[1] || '')).not.toThrow();
    });
  });
});