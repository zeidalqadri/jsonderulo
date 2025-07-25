/**
 * QueryConstructor - Builds optimized queries from processed ideas
 *
 * This component transforms enriched ideas into structured queries
 * optimized for specific output types and downstream processing.
 */

import { EventEmitter } from 'events';
import { OutputType, PipelineContext, PipelineEvent } from './types.js';
import { EnrichedIdea, ConceptEntity } from './ideaInput.js';

export interface StructuredQuery {
  primary: string;
  components: QueryComponent[];
  focus: QueryFocus;
  parameters: QueryParameters;
  metadata: QueryMetadata;
}

export interface QueryComponent {
  type: 'objective' | 'scope' | 'constraint' | 'output' | 'context';
  content: string;
  priority: 'required' | 'recommended' | 'optional';
  rationale?: string;
}

export interface QueryFocus {
  primaryEntity: string;
  primaryAction: string;
  targetOutcome: string;
  successCriteria: string[];
}

export interface QueryParameters {
  depth: 'shallow' | 'standard' | 'comprehensive';
  format: 'structured' | 'narrative' | 'hybrid';
  tone: 'formal' | 'conversational' | 'technical';
  verbosity: 'concise' | 'balanced' | 'detailed';
}

export interface QueryMetadata {
  optimizationScore: number;
  estimatedComplexity: number;
  suggestedTokenBudget: number;
  confidenceLevel: number;
}

export interface OptimizedQuery extends StructuredQuery {
  optimizations: QueryOptimization[];
  alternativeFormulations: string[];
}

export interface QueryOptimization {
  type: 'clarity' | 'specificity' | 'efficiency' | 'output-alignment';
  original: string;
  optimized: string;
  impact: number;
}

export interface ContextualQuery extends OptimizedQuery {
  contextEnhancements: ContextEnhancement[];
  pipelineAlignment: PipelineAlignment;
}

export interface ContextEnhancement {
  source: 'upstream' | 'domain' | 'constraints' | 'history';
  enhancement: string;
  relevance: number;
}

export interface PipelineAlignment {
  upstreamCompatibility: number;
  downstreamReadiness: number;
  contextCoverage: number;
}

export class QueryConstructor extends EventEmitter {
  private outputOptimizationStrategies: Map<OutputType, OptimizationStrategy> = new Map();

  constructor() {
    super();
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    this.outputOptimizationStrategies = new Map([
      [
        'structured-report',
        {
          depth: 'comprehensive',
          format: 'structured',
          tone: 'formal',
          focusAreas: ['completeness', 'organization', 'evidence'],
        },
      ],
      [
        'action-items',
        {
          depth: 'standard',
          format: 'structured',
          tone: 'conversational',
          focusAreas: ['clarity', 'prioritization', 'feasibility'],
        },
      ],
      [
        'analysis',
        {
          depth: 'comprehensive',
          format: 'hybrid',
          tone: 'technical',
          focusAreas: ['insights', 'methodology', 'conclusions'],
        },
      ],
      [
        'classification',
        {
          depth: 'standard',
          format: 'structured',
          tone: 'technical',
          focusAreas: ['criteria', 'categories', 'confidence'],
        },
      ],
      [
        'extraction',
        {
          depth: 'shallow',
          format: 'structured',
          tone: 'technical',
          focusAreas: ['precision', 'completeness', 'structure'],
        },
      ],
      [
        'generation',
        {
          depth: 'standard',
          format: 'narrative',
          tone: 'conversational',
          focusAreas: ['creativity', 'coherence', 'relevance'],
        },
      ],
      [
        'validation',
        {
          depth: 'standard',
          format: 'structured',
          tone: 'technical',
          focusAreas: ['accuracy', 'criteria', 'evidence'],
        },
      ],
    ]);
  }

  async constructQuery(enrichedIdea: EnrichedIdea): Promise<StructuredQuery> {
    const startTime = Date.now();

    this.emit('construction-started', {
      type: 'processing-started',
      payload: { enrichedIdea },
      executionId: this.generateExecutionId(),
      timestamp: new Date(),
    } as PipelineEvent);

    const components = this.buildQueryComponents(enrichedIdea);
    const focus = this.extractQueryFocus(enrichedIdea);
    const parameters = this.determineQueryParameters(enrichedIdea);
    const metadata = this.calculateQueryMetadata(enrichedIdea, components);

    const structuredQuery: StructuredQuery = {
      primary: this.buildPrimaryQuery(enrichedIdea, focus),
      components,
      focus,
      parameters,
      metadata,
    };

    const processingTime = Date.now() - startTime;

    this.emit('construction-completed', {
      type: 'processing-started',
      payload: {
        structuredQuery,
        processingTime,
      },
      executionId: this.generateExecutionId(),
      timestamp: new Date(),
    } as PipelineEvent);

    return structuredQuery;
  }

  optimizeForOutput(query: StructuredQuery, outputType: OutputType): OptimizedQuery {
    const strategy = this.outputOptimizationStrategies.get(outputType);
    if (!strategy) {
      return {
        ...query,
        optimizations: [],
        alternativeFormulations: [],
      };
    }

    const optimizations: QueryOptimization[] = [];

    // Optimize for clarity
    if (strategy.focusAreas.includes('clarity')) {
      const clarityOpt = this.optimizeClarity(query);
      if (clarityOpt) optimizations.push(clarityOpt);
    }

    // Optimize for specificity
    if (strategy.focusAreas.includes('precision') || strategy.focusAreas.includes('specificity')) {
      const specificityOpt = this.optimizeSpecificity(query);
      if (specificityOpt) optimizations.push(specificityOpt);
    }

    // Optimize for output alignment
    const alignmentOpt = this.optimizeForOutputAlignment(query, outputType);
    if (alignmentOpt) optimizations.push(alignmentOpt);

    // Generate alternative formulations
    const alternatives = this.generateAlternativeFormulations(query, outputType);

    return {
      ...query,
      optimizations,
      alternativeFormulations: alternatives,
    };
  }

  addQueryContext(query: OptimizedQuery, context: PipelineContext): ContextualQuery {
    const enhancements: ContextEnhancement[] = [];

    // Add domain context
    if (context.domain) {
      enhancements.push({
        source: 'domain',
        enhancement: `Within the context of ${context.domain}`,
        relevance: 0.9,
      });
    }

    // Add constraint context
    context.constraints.forEach(constraint => {
      enhancements.push({
        source: 'constraints',
        enhancement: `Ensuring: ${constraint}`,
        relevance: 0.85,
      });
    });

    // Add upstream context
    if (context.upstream.previousOutputs) {
      enhancements.push({
        source: 'upstream',
        enhancement: 'Building upon previous analysis',
        relevance: 0.8,
      });
    }

    // Calculate pipeline alignment
    const alignment: PipelineAlignment = {
      upstreamCompatibility: this.calculateUpstreamCompatibility(query, context),
      downstreamReadiness: this.calculateDownstreamReadiness(query, context),
      contextCoverage: this.calculateContextCoverage(enhancements),
    };

    return {
      ...query,
      contextEnhancements: enhancements,
      pipelineAlignment: alignment,
    };
  }

  scoreQuery(query: StructuredQuery): number {
    let score = 0;

    // Component completeness (30%)
    const requiredComponents = query.components.filter(c => c.priority === 'required').length;
    const totalComponents = query.components.length;
    score += (requiredComponents / totalComponents) * 0.3;

    // Focus clarity (25%)
    if (query.focus.primaryEntity && query.focus.primaryAction) {
      score += 0.25;
    }

    // Success criteria definition (20%)
    const criteriaScore = Math.min(query.focus.successCriteria.length / 3, 1) * 0.2;
    score += criteriaScore;

    // Metadata quality (25%)
    score += query.metadata.confidenceLevel * 0.25;

    return Math.min(score, 1);
  }

  private buildQueryComponents(enrichedIdea: EnrichedIdea): QueryComponent[] {
    const components: QueryComponent[] = [];

    // Objective component
    const primaryActions = enrichedIdea.concepts.entities
      .filter(e => e.type === 'action')
      .sort((a, b) => b.confidence - a.confidence);

    if (primaryActions.length > 0) {
      components.push({
        type: 'objective',
        content: `To ${primaryActions[0].text} ${this.getObjectiveTarget(enrichedIdea)}`,
        priority: 'required',
        rationale: 'Primary action identified from idea analysis',
      });
    }

    // Scope component
    const scopeElements = this.determineScopeElements(enrichedIdea);
    if (scopeElements.length > 0) {
      components.push({
        type: 'scope',
        content: `Focusing on: ${scopeElements.join(', ')}`,
        priority: 'required',
      });
    }

    // Constraint components
    enrichedIdea.constraints.forEach((constraint, index) => {
      components.push({
        type: 'constraint',
        content: constraint,
        priority: index < 2 ? 'required' : 'recommended',
      });
    });

    // Output component
    components.push({
      type: 'output',
      content: `Expected output format: ${enrichedIdea.suggestedOutputType}`,
      priority: 'required',
    });

    // Context component
    if (enrichedIdea.metadata.complexity === 'complex') {
      components.push({
        type: 'context',
        content: 'This is a complex request requiring comprehensive analysis',
        priority: 'optional',
      });
    }

    return components;
  }

  private extractQueryFocus(enrichedIdea: EnrichedIdea): QueryFocus {
    const actions = enrichedIdea.concepts.entities.filter(e => e.type === 'action');
    const objects = enrichedIdea.concepts.entities.filter(e => e.type === 'object');
    const metrics = enrichedIdea.concepts.entities.filter(e => e.type === 'metric');

    const primaryAction = actions.length > 0 ? actions[0].text : 'analyze';
    const primaryEntity = objects.length > 0 ? objects[0].text : 'subject matter';

    const targetOutcome = this.deriveTargetOutcome(
      enrichedIdea.suggestedOutputType,
      primaryAction,
      primaryEntity
    );

    const successCriteria = this.deriveSuccessCriteria(enrichedIdea, metrics);

    return {
      primaryEntity,
      primaryAction,
      targetOutcome,
      successCriteria,
    };
  }

  private determineQueryParameters(enrichedIdea: EnrichedIdea): QueryParameters {
    const strategy = this.outputOptimizationStrategies.get(enrichedIdea.suggestedOutputType);

    return {
      depth: strategy?.depth || 'standard',
      format: strategy?.format || 'structured',
      tone: strategy?.tone || 'conversational',
      verbosity: enrichedIdea.metadata.complexity === 'complex' ? 'detailed' : 'balanced',
    };
  }

  private calculateQueryMetadata(
    enrichedIdea: EnrichedIdea,
    components: QueryComponent[]
  ): QueryMetadata {
    const complexityFactors = [
      enrichedIdea.concepts.entities.length * 0.1,
      enrichedIdea.concepts.relationships.length * 0.2,
      components.length * 0.1,
      enrichedIdea.metadata.wordCount * 0.01,
    ];

    const estimatedComplexity = Math.min(
      complexityFactors.reduce((a, b) => a + b, 0),
      10
    );

    const suggestedTokenBudget = this.calculateTokenBudget(
      estimatedComplexity,
      enrichedIdea.suggestedOutputType
    );

    return {
      optimizationScore: 0.75,
      estimatedComplexity,
      suggestedTokenBudget,
      confidenceLevel: enrichedIdea.confidence,
    };
  }

  private buildPrimaryQuery(enrichedIdea: EnrichedIdea, focus: QueryFocus): string {
    const parts = [
      `${focus.primaryAction} ${focus.primaryEntity}`,
      enrichedIdea.normalized,
      `to achieve ${focus.targetOutcome}`,
    ];

    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  private optimizeClarity(query: StructuredQuery): QueryOptimization | null {
    const original = query.primary;
    let optimized = original;

    // Remove redundant words
    optimized = optimized.replace(/\b(very|really|quite|just)\b/gi, '');

    // Clarify ambiguous pronouns
    optimized = optimized.replace(/\bit\b/g, query.focus.primaryEntity);

    if (optimized !== original) {
      return {
        type: 'clarity',
        original,
        optimized,
        impact: 0.7,
      };
    }

    return null;
  }

  private optimizeSpecificity(query: StructuredQuery): QueryOptimization | null {
    const original = query.primary;
    let optimized = original;

    // Add specific criteria if missing
    if (!optimized.includes('specific') && query.focus.successCriteria.length > 0) {
      optimized += ` specifically addressing: ${query.focus.successCriteria[0]}`;
    }

    if (optimized !== original) {
      return {
        type: 'specificity',
        original,
        optimized,
        impact: 0.8,
      };
    }

    return null;
  }

  private optimizeForOutputAlignment(
    query: StructuredQuery,
    outputType: OutputType
  ): QueryOptimization | null {
    const alignmentPhrases: Record<OutputType, string> = {
      'structured-report': 'providing a comprehensive structured report',
      'action-items': 'generating clear, actionable items',
      analysis: 'conducting thorough analysis with insights',
      classification: 'classifying into distinct categories',
      extraction: 'extracting relevant information',
      generation: 'generating creative content',
      validation: 'validating against criteria',
    };

    const phrase = alignmentPhrases[outputType];
    if (phrase && !query.primary.includes(phrase)) {
      return {
        type: 'output-alignment',
        original: query.primary,
        optimized: `${query.primary}, ${phrase}`,
        impact: 0.9,
      };
    }

    return null;
  }

  private generateAlternativeFormulations(
    query: StructuredQuery,
    outputType: OutputType
  ): string[] {
    const alternatives: string[] = [];

    // Question format
    alternatives.push(
      `What ${query.focus.primaryAction} can be performed on ${query.focus.primaryEntity} to ${query.focus.targetOutcome}?`
    );

    // Imperative format
    alternatives.push(
      `${query.focus.primaryAction.charAt(0).toUpperCase() + query.focus.primaryAction.slice(1)} ${query.focus.primaryEntity} ensuring ${query.focus.successCriteria[0] || 'quality outcomes'}`
    );

    // Context-first format
    if (query.components.some(c => c.type === 'context')) {
      alternatives.push(
        `Given the context of ${query.focus.primaryEntity}, ${query.focus.primaryAction} to ${query.focus.targetOutcome}`
      );
    }

    return alternatives;
  }

  private calculateUpstreamCompatibility(query: OptimizedQuery, context: PipelineContext): number {
    let compatibility = 0.5;

    if (context.upstream.previousOutputs) {
      compatibility += 0.3;
    }

    if (context.upstream.queryOptimizationScore) {
      compatibility += context.upstream.queryOptimizationScore * 0.2;
    }

    return Math.min(compatibility, 1);
  }

  private calculateDownstreamReadiness(query: OptimizedQuery, context: PipelineContext): number {
    let readiness = 0.6;

    // Check if query aligns with expected output type
    if (
      query.components.some(
        c => c.type === 'output' && c.content.includes(context.expectedOutputType)
      )
    ) {
      readiness += 0.2;
    }

    // Check optimization quality
    readiness += query.metadata.optimizationScore * 0.2;

    return Math.min(readiness, 1);
  }

  private calculateContextCoverage(enhancements: ContextEnhancement[]): number {
    if (enhancements.length === 0) return 0;

    const totalRelevance = enhancements.reduce((sum, e) => sum + e.relevance, 0);
    const avgRelevance = totalRelevance / enhancements.length;

    // Consider both quantity and quality of enhancements
    const quantityScore = Math.min(enhancements.length / 5, 1) * 0.4;
    const qualityScore = avgRelevance * 0.6;

    return quantityScore + qualityScore;
  }

  private getObjectiveTarget(enrichedIdea: EnrichedIdea): string {
    const objects = enrichedIdea.concepts.entities
      .filter(e => e.type === 'object')
      .map(e => e.text);

    return objects.length > 0 ? objects.join(' and ') : 'the specified subject';
  }

  private determineScopeElements(enrichedIdea: EnrichedIdea): string[] {
    const elements: string[] = [];

    // Add high-confidence entities
    enrichedIdea.concepts.entities
      .filter(e => e.confidence > 0.8)
      .forEach(e => {
        if (!elements.includes(e.text)) {
          elements.push(e.text);
        }
      });

    // Add keywords not already included
    enrichedIdea.concepts.keywords.forEach(keyword => {
      if (!elements.includes(keyword)) {
        elements.push(keyword);
      }
    });

    return elements.slice(0, 5); // Limit scope elements
  }

  private deriveTargetOutcome(outputType: OutputType, action: string, entity: string): string {
    const outcomeTemplates: Record<OutputType, string> = {
      'structured-report': `produce a comprehensive report on ${entity}`,
      'action-items': `generate actionable steps for ${action}ing ${entity}`,
      analysis: `provide insights from ${action}ing ${entity}`,
      classification: `categorize ${entity} appropriately`,
      extraction: `extract relevant information about ${entity}`,
      generation: `create new content related to ${entity}`,
      validation: `verify the accuracy of ${entity}`,
    };

    return outcomeTemplates[outputType] || `complete ${action} of ${entity}`;
  }

  private deriveSuccessCriteria(enrichedIdea: EnrichedIdea, metrics: ConceptEntity[]): string[] {
    const criteria: string[] = [];

    // Add metric-based criteria
    metrics.forEach(metric => {
      criteria.push(`Achieve ${metric.text}`);
    });

    // Add constraint-based criteria
    enrichedIdea.constraints
      .filter(c => c.includes('required') || c.includes('must'))
      .forEach(constraint => {
        criteria.push(constraint);
      });

    // Add quality criteria based on complexity
    if (enrichedIdea.metadata.complexity === 'complex') {
      criteria.push('Provide comprehensive coverage');
    }

    if (enrichedIdea.suggestedOutputType === 'analysis') {
      criteria.push('Include actionable insights');
    }

    return criteria.slice(0, 5); // Limit criteria
  }

  private calculateTokenBudget(complexity: number, outputType: OutputType): number {
    const baseTokens: Record<OutputType, number> = {
      'structured-report': 2000,
      'action-items': 1000,
      analysis: 1500,
      classification: 800,
      extraction: 600,
      generation: 1200,
      validation: 500,
    };

    const base = baseTokens[outputType] || 1000;
    const complexityMultiplier = 1 + complexity / 10;

    return Math.round(base * complexityMultiplier);
  }

  private generateExecutionId(): string {
    return `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

interface OptimizationStrategy {
  depth: 'shallow' | 'standard' | 'comprehensive';
  format: 'structured' | 'narrative' | 'hybrid';
  tone: 'formal' | 'conversational' | 'technical';
  focusAreas: string[];
}
