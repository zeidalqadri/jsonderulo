import { QueryConstructor } from '../../src/pipeline/queryConstructor.js';
import { EnrichedIdea } from '../../src/pipeline/ideaInput.js';
import { PipelineContext } from '../../src/pipeline/types.js';

describe('QueryConstructor', () => {
  let constructor: QueryConstructor;
  let mockEnrichedIdea: EnrichedIdea;

  beforeEach(() => {
    constructor = new QueryConstructor();
    
    // Create a mock enriched idea for testing
    mockEnrichedIdea = {
      original: 'Analyze customer feedback to improve product features',
      normalized: 'analyze customer feedback to improve product features',
      category: 'product-development',
      concepts: {
        entities: [
          { text: 'analyze', type: 'action', confidence: 0.9 },
          { text: 'customer', type: 'object', confidence: 0.85 },
          { text: 'feedback', type: 'object', confidence: 0.85 },
          { text: 'improve', type: 'action', confidence: 0.8 },
          { text: 'product', type: 'object', confidence: 0.8 },
          { text: 'features', type: 'object', confidence: 0.8 },
        ],
        relationships: [
          { from: 'analyze', to: 'feedback', type: 'acts-on' },
          { from: 'improve', to: 'features', type: 'acts-on' },
        ],
        keywords: ['customer', 'feedback', 'product', 'features'],
      },
      constraints: [
        'Must be data-driven',
        'Consider technical feasibility',
        'High accuracy required',
      ],
      suggestedOutputType: 'action-items',
      confidence: 0.85,
      metadata: {
        wordCount: 8,
        complexity: 'moderate',
        language: 'en',
        timestamp: new Date(),
      },
    };
  });

  describe('constructQuery', () => {
    test('should construct a structured query from enriched idea', async () => {
      const result = await constructor.constructQuery(mockEnrichedIdea);

      expect(result).toBeDefined();
      expect(result.primary).toContain('analyze');
      expect(result.primary).toContain('customer');
      expect(result.components.length).toBeGreaterThan(0);
      expect(result.focus.primaryAction).toBe('analyze');
      expect(result.focus.primaryEntity).toBe('customer');
      expect(result.metadata.confidenceLevel).toBe(0.85);
    });

    test('should include all required components', async () => {
      const result = await constructor.constructQuery(mockEnrichedIdea);

      const componentTypes = result.components.map(c => c.type);
      expect(componentTypes).toContain('objective');
      expect(componentTypes).toContain('scope');
      expect(componentTypes).toContain('constraint');
      expect(componentTypes).toContain('output');
    });

    test('should emit events during construction', async () => {
      const startedHandler = jest.fn();
      const completedHandler = jest.fn();

      constructor.on('construction-started', startedHandler);
      constructor.on('construction-completed', completedHandler);

      await constructor.constructQuery(mockEnrichedIdea);

      expect(startedHandler).toHaveBeenCalledTimes(1);
      expect(completedHandler).toHaveBeenCalledTimes(1);
      expect(completedHandler.mock.calls[0][0].payload.processingTime).toBeGreaterThan(0);
    });

    test('should handle complex ideas appropriately', async () => {
      const complexIdea: EnrichedIdea = {
        ...mockEnrichedIdea,
        metadata: {
          ...mockEnrichedIdea.metadata,
          complexity: 'complex',
        },
      };

      const result = await constructor.constructQuery(complexIdea);

      expect(result.parameters.verbosity).toBe('detailed');
      expect(result.components.some(c => 
        c.type === 'context' && 
        c.content.includes('complex')
      )).toBe(true);
    });
  });

  describe('optimizeForOutput', () => {
    test('should optimize query for action-items output', async () => {
      const query = await constructor.constructQuery(mockEnrichedIdea);
      const optimized = constructor.optimizeForOutput(query, 'action-items');

      expect(optimized.optimizations.length).toBeGreaterThan(0);
      expect(optimized.alternativeFormulations.length).toBeGreaterThan(0);
      
      const hasOutputAlignment = optimized.optimizations.some(o => 
        o.type === 'output-alignment'
      );
      expect(hasOutputAlignment).toBe(true);
    });

    test('should apply different strategies for different output types', async () => {
      const query = await constructor.constructQuery(mockEnrichedIdea);
      
      const reportOptimized = constructor.optimizeForOutput(query, 'structured-report');
      const analysisOptimized = constructor.optimizeForOutput(query, 'analysis');

      expect(reportOptimized.optimizations).not.toEqual(analysisOptimized.optimizations);
      expect(reportOptimized.alternativeFormulations[0]).not.toBe(
        analysisOptimized.alternativeFormulations[0]
      );
    });

    test('should generate alternative formulations', async () => {
      const query = await constructor.constructQuery(mockEnrichedIdea);
      const optimized = constructor.optimizeForOutput(query, 'analysis');

      expect(optimized.alternativeFormulations.length).toBeGreaterThanOrEqual(2);
      expect(optimized.alternativeFormulations[0]).toContain('What');
      expect(optimized.alternativeFormulations[1]).toMatch(/^[A-Z]/);
    });
  });

  describe('addQueryContext', () => {
    test('should add context enhancements from pipeline context', async () => {
      const query = await constructor.constructQuery(mockEnrichedIdea);
      const optimized = constructor.optimizeForOutput(query, 'action-items');
      
      const pipelineContext: PipelineContext = {
        domain: 'e-commerce',
        expectedOutputType: 'action-items',
        constraints: ['Must be implementable within 30 days', 'Budget under $10k'],
        upstream: {
          ideaCategory: 'product-development',
          queryOptimizationScore: 0.8,
          previousOutputs: { analysis: 'Previous analysis data' },
        },
        pipelineConfig: {
          maxCost: 1.0,
          targetLatency: 5000,
          qualityPreference: 0.8,
        },
      };

      const contextual = constructor.addQueryContext(optimized, pipelineContext);

      expect(contextual.contextEnhancements.length).toBeGreaterThan(0);
      expect(contextual.contextEnhancements.some(e => 
        e.source === 'domain' && e.enhancement.includes('e-commerce')
      )).toBe(true);
      expect(contextual.pipelineAlignment.upstreamCompatibility).toBeGreaterThan(0.5);
      expect(contextual.pipelineAlignment.downstreamReadiness).toBeGreaterThan(0.5);
    });

    test('should calculate proper pipeline alignment scores', async () => {
      const query = await constructor.constructQuery(mockEnrichedIdea);
      const optimized = constructor.optimizeForOutput(query, 'action-items');
      
      const context: PipelineContext = {
        domain: 'tech',
        expectedOutputType: 'action-items',
        constraints: [],
        upstream: {
          queryOptimizationScore: 0.9,
          previousOutputs: { data: 'test' },
        },
      };

      const contextual = constructor.addQueryContext(optimized, context);

      expect(contextual.pipelineAlignment.upstreamCompatibility).toBeGreaterThan(0.8);
      expect(contextual.pipelineAlignment.contextCoverage).toBeGreaterThan(0);
    });
  });

  describe('scoreQuery', () => {
    test('should score queries based on completeness and quality', async () => {
      const goodQuery = await constructor.constructQuery(mockEnrichedIdea);
      const score = constructor.scoreQuery(goodQuery);

      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeLessThanOrEqual(1);
    });

    test('should give higher scores to complete queries', async () => {
      const completeIdea: EnrichedIdea = {
        ...mockEnrichedIdea,
        concepts: {
          ...mockEnrichedIdea.concepts,
          entities: [
            ...mockEnrichedIdea.concepts.entities,
            { text: '95% accuracy', type: 'metric', confidence: 0.9 },
          ],
        },
        confidence: 0.95,
      };

      const incompleteIdea: EnrichedIdea = {
        ...mockEnrichedIdea,
        concepts: {
          entities: [{ text: 'analyze', type: 'action', confidence: 0.5 }],
          relationships: [],
          keywords: [],
        },
        constraints: [],
        confidence: 0.5,
      };

      const completeQuery = await constructor.constructQuery(completeIdea);
      const incompleteQuery = await constructor.constructQuery(incompleteIdea);

      const completeScore = constructor.scoreQuery(completeQuery);
      const incompleteScore = constructor.scoreQuery(incompleteQuery);

      expect(completeScore).toBeGreaterThan(incompleteScore);
    });
  });

  describe('query components', () => {
    test('should prioritize components appropriately', async () => {
      const result = await constructor.constructQuery(mockEnrichedIdea);

      const requiredComponents = result.components.filter(c => c.priority === 'required');
      const recommendedComponents = result.components.filter(c => c.priority === 'recommended');
      const optionalComponents = result.components.filter(c => c.priority === 'optional');

      expect(requiredComponents.length).toBeGreaterThan(0);
      expect(requiredComponents.some(c => c.type === 'objective')).toBe(true);
      expect(requiredComponents.some(c => c.type === 'output')).toBe(true);
    });

    test('should include rationale for key components', async () => {
      const result = await constructor.constructQuery(mockEnrichedIdea);

      const objectiveComponent = result.components.find(c => c.type === 'objective');
      expect(objectiveComponent?.rationale).toBeDefined();
    });
  });

  describe('query focus extraction', () => {
    test('should extract primary action and entity', async () => {
      const result = await constructor.constructQuery(mockEnrichedIdea);

      expect(result.focus.primaryAction).toBe('analyze');
      expect(result.focus.primaryEntity).toBe('customer');
      expect(result.focus.targetOutcome).toContain('actionable steps');
      expect(result.focus.successCriteria.length).toBeGreaterThan(0);
    });

    test('should derive appropriate success criteria', async () => {
      const ideaWithMetrics: EnrichedIdea = {
        ...mockEnrichedIdea,
        concepts: {
          ...mockEnrichedIdea.concepts,
          entities: [
            ...mockEnrichedIdea.concepts.entities,
            { text: '90% satisfaction', type: 'metric', confidence: 0.9 },
          ],
        },
      };

      const result = await constructor.constructQuery(ideaWithMetrics);
      
      expect(result.focus.successCriteria.some(c => 
        c.includes('90% satisfaction')
      )).toBe(true);
    });
  });

  describe('parameter determination', () => {
    test('should set parameters based on output type', async () => {
      const reportIdea: EnrichedIdea = {
        ...mockEnrichedIdea,
        suggestedOutputType: 'structured-report',
      };

      const result = await constructor.constructQuery(reportIdea);

      expect(result.parameters.depth).toBe('comprehensive');
      expect(result.parameters.format).toBe('structured');
      expect(result.parameters.tone).toBe('formal');
    });

    test('should adjust verbosity based on complexity', async () => {
      const simpleIdea: EnrichedIdea = {
        ...mockEnrichedIdea,
        metadata: { ...mockEnrichedIdea.metadata, complexity: 'simple' },
      };

      const complexIdea: EnrichedIdea = {
        ...mockEnrichedIdea,
        metadata: { ...mockEnrichedIdea.metadata, complexity: 'complex' },
      };

      const simpleResult = await constructor.constructQuery(simpleIdea);
      const complexResult = await constructor.constructQuery(complexIdea);

      expect(simpleResult.parameters.verbosity).toBe('balanced');
      expect(complexResult.parameters.verbosity).toBe('detailed');
    });
  });

  describe('metadata calculation', () => {
    test('should calculate appropriate token budget', async () => {
      const result = await constructor.constructQuery(mockEnrichedIdea);

      expect(result.metadata.suggestedTokenBudget).toBeGreaterThan(500);
      expect(result.metadata.suggestedTokenBudget).toBeLessThan(5000);
    });

    test('should estimate complexity accurately', async () => {
      const simpleIdea: EnrichedIdea = {
        ...mockEnrichedIdea,
        concepts: {
          entities: [{ text: 'analyze', type: 'action', confidence: 0.9 }],
          relationships: [],
          keywords: ['data'],
        },
        metadata: { ...mockEnrichedIdea.metadata, wordCount: 3 },
      };

      const simpleResult = await constructor.constructQuery(simpleIdea);
      const complexResult = await constructor.constructQuery(mockEnrichedIdea);

      expect(simpleResult.metadata.estimatedComplexity).toBeLessThan(
        complexResult.metadata.estimatedComplexity
      );
    });
  });

  describe('error handling', () => {
    test('should handle empty concepts gracefully', async () => {
      const emptyIdea: EnrichedIdea = {
        ...mockEnrichedIdea,
        concepts: {
          entities: [],
          relationships: [],
          keywords: [],
        },
      };

      const result = await constructor.constructQuery(emptyIdea);
      
      expect(result).toBeDefined();
      expect(result.focus.primaryAction).toBe('analyze');
      expect(result.focus.primaryEntity).toBe('subject matter');
    });

    test('should handle missing optimization strategy', async () => {
      const query = await constructor.constructQuery(mockEnrichedIdea);
      // @ts-ignore - Testing invalid output type
      const optimized = constructor.optimizeForOutput(query, 'invalid-type');

      expect(optimized).toBeDefined();
      expect(optimized.optimizations).toHaveLength(0);
      expect(optimized.alternativeFormulations).toHaveLength(0);
    });
  });
});