import { IdeaInputProcessor } from '../../src/pipeline/ideaInput.js';
import { IdeaCategory, OutputType } from '../../src/pipeline/types.js';

describe('IdeaInputProcessor', () => {
  let processor: IdeaInputProcessor;

  beforeEach(() => {
    processor = new IdeaInputProcessor();
  });

  describe('processIdea', () => {
    test('should process a simple market research idea', async () => {
      const idea = 'Analyze customer demographics and buying patterns for our new product launch';
      const result = await processor.processIdea(idea);

      expect(result).toBeDefined();
      expect(result.category).toBe('market-research');
      expect(result.suggestedOutputType).toBe('analysis');
      expect(result.concepts.entities.length).toBeGreaterThan(0);
      expect(result.constraints.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should process a product development idea', async () => {
      const idea = 'Create a new feature to help users track their daily habits with reminders';
      const result = await processor.processIdea(idea);

      expect(result.category).toBe('product-development');
      expect(result.concepts.entities.some(e => e.text === 'create' && e.type === 'action')).toBe(true);
      expect(result.concepts.entities.some(e => e.text === 'users' && e.type === 'object')).toBe(true);
    });

    test('should emit events during processing', async () => {
      const startedHandler = jest.fn();
      const completedHandler = jest.fn();
      
      processor.on('processing-started', startedHandler);
      processor.on('processing-completed', completedHandler);

      await processor.processIdea('Test idea for event emission');

      expect(startedHandler).toHaveBeenCalledTimes(1);
      expect(completedHandler).toHaveBeenCalledTimes(1);
      expect(completedHandler.mock.calls[0][0].payload.processingTime).toBeGreaterThan(0);
    });
  });

  describe('categorizeIdea', () => {
    test('should categorize market research ideas correctly', async () => {
      const ideas = [
        'Study market trends and competitor analysis',
        'Research customer preferences and demographics',
        'Analyze consumer behavior patterns',
      ];

      for (const idea of ideas) {
        const category = await processor.categorizeIdea(idea);
        expect(category).toBe('market-research');
      }
    });

    test('should categorize technical design ideas correctly', async () => {
      const ideas = [
        'Design a scalable microservice architecture',
        'Create API integration for database systems',
        'Build infrastructure for high performance',
      ];

      for (const idea of ideas) {
        const category = await processor.categorizeIdea(idea);
        expect(category).toBe('technical-design');
      }
    });

    test('should default to problem-solving for ambiguous ideas', async () => {
      const category = await processor.categorizeIdea('do something interesting');
      expect(category).toBe('problem-solving');
    });
  });

  describe('extractConcepts', () => {
    test('should extract action entities', async () => {
      const idea = 'Create and analyze data to generate insights';
      const concepts = await processor.extractConcepts(idea);

      const actions = concepts.entities.filter(e => e.type === 'action');
      expect(actions.map(a => a.text)).toContain('create');
      expect(actions.map(a => a.text)).toContain('analyze');
      expect(actions.map(a => a.text)).toContain('generate');
    });

    test('should extract metrics and constraints', async () => {
      const idea = 'Must achieve 95% accuracy within 30 days with minimum resources';
      const concepts = await processor.extractConcepts(idea);

      const metrics = concepts.entities.filter(e => e.type === 'metric');
      const constraints = concepts.entities.filter(e => e.type === 'constraint');

      expect(metrics.some(m => m.text.includes('95%'))).toBe(true);
      expect(constraints.some(c => c.text === 'must')).toBe(true);
      expect(constraints.some(c => c.text === 'minimum')).toBe(true);
    });

    test('should extract relationships between entities', async () => {
      const idea = 'Analyze customer data';
      const concepts = await processor.extractConcepts(idea);

      expect(concepts.relationships.length).toBeGreaterThan(0);
      expect(concepts.relationships.some(r => 
        r.from === 'analyze' && r.to === 'data' && r.type === 'acts-on'
      )).toBe(true);
    });
  });

  describe('deriveConstraints', () => {
    test('should derive time constraints', () => {
      const constraints = processor.deriveConstraints(
        'Need to complete this urgently by Friday',
        'problem-solving'
      );

      expect(constraints).toContain('High priority - urgent delivery required');
      expect(constraints).toContain('Has specific deadline requirements');
    });

    test('should derive quality constraints', () => {
      const constraints = processor.deriveConstraints(
        'Provide a comprehensive and accurate analysis',
        'data-analysis'
      );

      expect(constraints).toContain('High accuracy required');
      expect(constraints).toContain('Comprehensive coverage required');
    });

    test('should add category-specific constraints', () => {
      const marketConstraints = processor.deriveConstraints(
        'Market analysis needed',
        'market-research'
      );
      expect(marketConstraints).toContain('Must be data-driven');
      expect(marketConstraints).toContain('Requires reliable sources');

      const techConstraints = processor.deriveConstraints(
        'System design required',
        'technical-design'
      );
      expect(techConstraints).toContain('Must be scalable');
      expect(techConstraints).toContain('Consider security implications');
    });

    test('should identify compliance constraints', () => {
      const constraints = processor.deriveConstraints(
        'Ensure regulatory compliance in the solution',
        'business-strategy'
      );

      expect(constraints).toContain('Must meet compliance requirements');
    });
  });

  describe('metadata generation', () => {
    test('should calculate word count correctly', async () => {
      const idea = 'This is a test idea with exactly ten words here';
      const result = await processor.processIdea(idea);

      expect(result.metadata.wordCount).toBe(10);
    });

    test('should assess complexity appropriately', async () => {
      const simpleIdea = 'Analyze data';
      const complexIdea = 'Create a comprehensive market analysis report examining customer demographics, ' +
        'buying patterns, competitive landscape, and future trends with actionable insights ' +
        'for product development and marketing strategy optimization';

      const simpleResult = await processor.processIdea(simpleIdea);
      const complexResult = await processor.processIdea(complexIdea);

      expect(simpleResult.metadata.complexity).toBe('simple');
      expect(complexResult.metadata.complexity).toBe('complex');
    });
  });

  describe('output type suggestion', () => {
    test('should suggest appropriate output types', async () => {
      const testCases = [
        { idea: 'Generate a report on findings', expected: 'structured-report' },
        { idea: 'Extract key information from documents', expected: 'extraction' },
        { idea: 'Classify these items into categories', expected: 'classification' },
        { idea: 'Validate the data accuracy', expected: 'validation' },
        { idea: 'Create action items for the team', expected: 'action-items' },
      ];

      for (const testCase of testCases) {
        const result = await processor.processIdea(testCase.idea);
        expect(result.suggestedOutputType).toBe(testCase.expected);
      }
    });
  });

  describe('error handling', () => {
    test('should handle empty input gracefully', async () => {
      const result = await processor.processIdea('');
      expect(result).toBeDefined();
      expect(result.normalized).toBe('');
      expect(result.concepts.entities).toHaveLength(0);
    });

    test('should handle special characters', async () => {
      const idea = 'Analyze @#$% data!!! with 100% accuracy???';
      const result = await processor.processIdea(idea);
      
      expect(result).toBeDefined();
      expect(result.normalized).not.toContain('@#$%');
      expect(result.concepts.entities.some(e => e.text === 'analyze')).toBe(true);
    });
  });
});