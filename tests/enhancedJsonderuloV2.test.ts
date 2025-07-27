import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EnhancedJsonderuloV2 } from '../src/core/enhancedJsonderuloV2.js';
import { z } from 'zod';

describe('EnhancedJsonderuloV2', () => {
  let jsonderulo: EnhancedJsonderuloV2;

  beforeEach(() => {
    jsonderulo = new EnhancedJsonderuloV2();
  });

  describe('Enhanced Speaking', () => {
    it('should generate enhanced prompt with context', async () => {
      // Add some context
      jsonderulo.addContext('Previous conversation about user preferences', 'reference');
      jsonderulo.addContext('User prefers detailed explanations', 'user_input');

      const result = await jsonderulo.speakEnhanced(
        'Generate a user profile',
        'A user profile with name, email, and preferences',
        { enableContext: true }
      );

      expect(result.prompt).toBeDefined();
      expect(result.schema).toBeDefined();
      expect(result.context).toBeDefined();
      expect(result.context!.entries.length).toBeGreaterThan(0);
    });

    it('should apply Chain of Thought strategy', async () => {
      const result = await jsonderulo.speakEnhanced(
        'Analyze this sales data and provide insights',
        undefined,
        { strategy: 'cot', enableCoT: true }
      );

      expect(result.prompt).toContain('step-by-step');
      expect(result.reasoning?.steps).toBeDefined();
      expect(result.metadata?.strategy).toBe('cot');
    });

    it('should apply Tree of Thoughts strategy', async () => {
      const result = await jsonderulo.speakEnhanced(
        'Find the best solution for optimizing database queries',
        undefined,
        { strategy: 'tot', enableToT: true }
      );

      expect(result.prompt).toContain('explore');
      expect(result.prompt).toContain('approaches');
      expect(result.metadata?.strategy).toBe('tot');
    });

    it('should combine multiple strategies', async () => {
      const result = await jsonderulo.speakEnhanced(
        'Create a comprehensive business plan',
        undefined,
        { strategy: ['cot', 'role-based'] }
      );

      expect(result.prompt).toBeDefined();
      expect(result.metadata?.strategy).toEqual('standard');
    });

    it('should track quality metrics', async () => {
      const result = await jsonderulo.speakEnhanced(
        'Generate a simple JSON object',
        'An object with name and age',
        { trackQuality: true }
      );

      expect(result.quality).toBeDefined();
      expect(result.quality?.score).toBeDefined();
      expect(result.quality?.score.overall).toBeGreaterThan(0);
      expect(result.quality?.metrics).toBeDefined();
    });
  });

  describe('Self-Consistency Processing', () => {
    it('should process with consistency checking', async () => {
      const mockLLM = jest.fn()
        .mockResolvedValueOnce('{"name": "John", "age": 30}')
        .mockResolvedValueOnce('{"name": "John", "age": 30}')
        .mockResolvedValueOnce('{"name": "John", "age": 31}');

      const result = await jsonderulo.processWithConsistency(
        'Generate a person object',
        mockLLM,
        { selfConsistency: true, consistencyRounds: 3 }
      );

      expect(result.success).toBe(true);
      expect(result.consistency).toBeDefined();
      expect(result.consistency?.consensusOutput).toBeDefined();
      expect(result.consistency?.confidenceScore).toBeGreaterThan(0);
    });

    it('should handle inconsistent outputs', async () => {
      const mockLLM = jest.fn()
        .mockResolvedValueOnce('{"name": "John", "age": 30}')
        .mockResolvedValueOnce('{"name": "Jane", "age": 25}')
        .mockResolvedValueOnce('{"name": "Bob", "age": 40}');

      const result = await jsonderulo.processWithConsistency(
        'Generate a person object',
        mockLLM,
        { selfConsistency: true, consistencyRounds: 3 }
      );

      expect(result.consistency).toBeDefined();
      expect(result.consistency?.variations.length).toBeGreaterThan(0);
    });
  });

  describe('JSON Streaming', () => {
    it('should stream JSON with progressive validation', async () => {
      const schema = z.object({
        name: z.string(),
        items: z.array(z.object({
          id: z.number(),
          value: z.string(),
        })),
      });

      async function* mockStream() {
        yield '{"name": "Test",';
        yield ' "items": [';
        yield '{"id": 1, "value": "first"},';
        yield '{"id": 2, "value": "second"}';
        yield ']}';
      }

      const results: any[] = [];
      for await (const result of jsonderulo.streamJSON(
        'Generate a list',
        mockStream,
        schema,
        { streaming: true }
      )) {
        results.push(result);
      }

      expect(results.length).toBeGreaterThan(0);
      expect(results[results.length - 1].complete).toBe(true);
    });
  });

  describe('A/B Testing', () => {
    it('should create and run A/B test', async () => {
      const variants = [
        {
          name: 'baseline',
          modifier: (req: string) => req,
        },
        {
          name: 'with-examples',
          modifier: (req: string) => `${req}. Provide examples.`,
          strategy: 'cot' as const,
        },
      ];

      const mockLLM = jest.fn().mockResolvedValue('{"result": "test"}');

      const testId = await jsonderulo.runABTest(
        'Generate a product description',
        variants,
        mockLLM,
        { sampleSize: 5 }
      );

      expect(testId).toBeDefined();
      expect(testId).toMatch(/^test-/);
    });
  });

  describe('Context Management', () => {
    it('should add and retrieve context entries', async () => {
      const id1 = jsonderulo.addContext('First context entry', 'user_input');
      const id2 = jsonderulo.addContext('Second context entry', 'assistant_output');

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should find similar context', async () => {
      jsonderulo.addContext('Machine learning is fascinating', 'reference');
      jsonderulo.addContext('Deep learning models are powerful', 'reference');
      jsonderulo.addContext('Weather is nice today', 'user_input');

      const similar = await jsonderulo.findSimilarContext('AI and machine learning', 2);

      expect(similar.length).toBeLessThanOrEqual(2);
      expect(similar[0].score).toBeGreaterThan(0);
    });
  });

  describe('Quality Metrics', () => {
    it('should track and report quality metrics', () => {
      const metrics = jsonderulo.getQualityMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.avgQualityScore).toBeDefined();
      expect(metrics.totalPrompts).toBeDefined();
      expect(metrics.improvements).toBeDefined();
      expect(Array.isArray(metrics.improvements)).toBe(true);
    });

    it('should export learnings', () => {
      jsonderulo.addContext('Test context', 'reference');
      
      const learnings = jsonderulo.exportLearnings();

      expect(learnings).toBeDefined();
      expect(learnings.contextEntries).toBeGreaterThanOrEqual(0);
      expect(learnings.embeddingsCount).toBeGreaterThanOrEqual(0);
      expect(learnings.bestPractices).toBeDefined();
      expect(Array.isArray(learnings.bestPractices)).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should update context configuration', () => {
      expect(() => {
        jsonderulo.updateContextConfig({
          maxTokens: 8000,
          compressionEnabled: false,
        });
      }).not.toThrow();
    });

    it('should update quality weights', () => {
      expect(() => {
        jsonderulo.updateQualityWeights({
          effectiveness: 0.5,
          efficiency: 0.3,
        });
      }).not.toThrow();
    });

    it('should set embeddings provider', () => {
      expect(() => {
        jsonderulo.setEmbeddingsProvider('mock');
      }).not.toThrow();
    });
  });

  describe('Utility Methods', () => {
    it('should get all templates', () => {
      const templates = jsonderulo.getAllTemplates();
      
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should get all roles', () => {
      const roles = jsonderulo.getRoles();
      
      expect(Array.isArray(roles)).toBe(true);
      expect(roles).toContain('data-analyst');
      expect(roles).toContain('api-designer');
    });

    it('should get active tests', () => {
      const tests = jsonderulo.getActiveTests();
      
      expect(Array.isArray(tests)).toBe(true);
    });
  });

  describe('Event Emission', () => {
    it('should emit processing events', async () => {
      const startedHandler = jest.fn();
      const completedHandler = jest.fn();

      jsonderulo.on('processing-started', startedHandler);
      jsonderulo.on('processing-completed', completedHandler);

      await jsonderulo.speakEnhanced('Test request');

      expect(startedHandler).toHaveBeenCalled();
      expect(completedHandler).toHaveBeenCalled();
    });

    it('should emit context events', () => {
      const contextHandler = jest.fn();
      jsonderulo.on('context:entry-added', contextHandler);

      jsonderulo.addContext('Test context', 'reference');

      expect(contextHandler).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON in consistency check', async () => {
      const mockLLM = jest.fn()
        .mockResolvedValueOnce('invalid json')
        .mockResolvedValueOnce('{"valid": true}')
        .mockResolvedValueOnce('{"valid": true}');

      const result = await jsonderulo.processWithConsistency(
        'Generate JSON',
        mockLLM,
        { consistencyRounds: 3 }
      );

      expect(result.attempts).toBe(3);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complex workflow with all features', async () => {
      // Add context
      jsonderulo.addContext('User prefers technical details', 'user_input');
      jsonderulo.addContext('Previous API design: REST with JSON', 'reference');

      // Generate enhanced prompt with CoT
      const result = await jsonderulo.speakEnhanced(
        'Design an API endpoint for user management',
        'API endpoint specification with method, path, request/response schemas',
        {
          enableContext: true,
          strategy: 'cot',
          trackQuality: true,
          includeExamples: true,
        }
      );

      expect(result).toBeDefined();
      expect(result.prompt).toContain('step-by-step');
      expect(result.context?.entries.length).toBeGreaterThan(0);
      expect(result.quality?.score.overall).toBeGreaterThan(0);
      expect(result.schema).toBeDefined();
      expect(result.metadata?.contextRetrieved).toBeGreaterThan(0);
    });
  });
});