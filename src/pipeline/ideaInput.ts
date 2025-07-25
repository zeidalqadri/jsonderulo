/**
 * IdeaInputProcessor - Normalizes and categorizes raw ideas into structured inputs
 *
 * This component serves as the entry point for the idea optimization pipeline,
 * transforming unstructured ideas into categorized, enriched inputs ready for
 * downstream processing.
 */

import { EventEmitter } from 'events';
import { IdeaCategory, OutputType, PipelineContext, PipelineEvent } from './types.js';

export interface ConceptEntity {
  text: string;
  type: 'action' | 'object' | 'attribute' | 'metric' | 'constraint';
  confidence: number;
}

export interface ConceptMap {
  entities: ConceptEntity[];
  relationships: Array<{
    from: string;
    to: string;
    type: string;
  }>;
  keywords: string[];
}

export interface EnrichedIdea {
  original: string;
  normalized: string;
  category: IdeaCategory;
  concepts: ConceptMap;
  constraints: string[];
  suggestedOutputType: OutputType;
  confidence: number;
  metadata: {
    wordCount: number;
    complexity: 'simple' | 'moderate' | 'complex';
    language: string;
    timestamp: Date;
  };
}

export class IdeaInputProcessor extends EventEmitter {
  private categoryPatterns: Map<IdeaCategory, RegExp[]> = new Map();
  private outputTypePatterns: Map<OutputType, RegExp[]> = new Map();

  constructor() {
    super();
    this.initializePatterns();
  }

  private initializePatterns(): void {
    // Category patterns for idea classification
    this.categoryPatterns = new Map([
      [
        'market-research',
        [
          /market|customer|consumer|demographic|segment|trend/i,
          /survey|research|analysis|study|data/i,
          /competitor|competitive|benchmark/i,
        ],
      ],
      [
        'product-development',
        [
          /product|feature|design|prototype|mvp/i,
          /develop|build|create|implement|enhance/i,
          /user story|requirement|specification/i,
        ],
      ],
      [
        'business-strategy',
        [
          /strategy|strategic|plan|roadmap|vision/i,
          /business model|revenue|growth|expansion/i,
          /objective|goal|kpi|metric|target/i,
        ],
      ],
      [
        'technical-design',
        [
          /architect|system|infrastructure|database/i,
          /api|integration|microservice|component/i,
          /performance|scalability|security|reliability/i,
        ],
      ],
      [
        'creative-content',
        [
          /content|copy|creative|campaign|brand/i,
          /story|narrative|message|communication/i,
          /visual|design|artwork|media/i,
        ],
      ],
      [
        'data-analysis',
        [
          /data|dataset|analytics|insight|pattern/i,
          /statistic|metric|measure|correlation/i,
          /visualiz|report|dashboard|chart/i,
        ],
      ],
      [
        'problem-solving',
        [
          /problem|issue|challenge|solution|solve/i,
          /fix|resolve|troubleshoot|debug|optimize/i,
          /root cause|investigation|diagnosis/i,
        ],
      ],
    ]);

    // Output type patterns
    this.outputTypePatterns = new Map([
      [
        'structured-report',
        [/report|document|summary|overview/i, /comprehensive|detailed|structured/i],
      ],
      ['action-items', [/action|task|todo|step|plan/i, /implement|execute|deliver/i]],
      ['analysis', [/analyze|analysis|examine|investigate/i, /insight|finding|observation/i]],
      ['classification', [/classify|categorize|group|segment/i, /type|kind|class|category/i]],
      ['extraction', [/extract|pull|get|find|identify/i, /information|data|entity|element/i]],
      ['generation', [/generate|create|produce|make/i, /new|original|innovative/i]],
      ['validation', [/validate|verify|check|confirm/i, /correct|accurate|valid/i]],
    ]);
  }

  async processIdea(rawIdea: string): Promise<EnrichedIdea> {
    const startTime = Date.now();

    this.emit('processing-started', {
      type: 'input-received',
      payload: { rawIdea },
      executionId: this.generateExecutionId(),
      timestamp: new Date(),
    } as PipelineEvent);

    const normalized = this.normalizeIdea(rawIdea);
    const category = await this.categorizeIdea(normalized);
    const concepts = await this.extractConcepts(normalized);
    const constraints = this.deriveConstraints(normalized, category);
    const outputType = this.suggestOutputType(normalized, category);

    const enrichedIdea: EnrichedIdea = {
      original: rawIdea,
      normalized,
      category,
      concepts,
      constraints,
      suggestedOutputType: outputType,
      confidence: this.calculateConfidence(category, concepts, constraints),
      metadata: {
        wordCount: normalized.split(/\s+/).length,
        complexity: this.assessComplexity(normalized, concepts),
        language: 'en', // TODO: Implement language detection
        timestamp: new Date(),
      },
    };

    const processingTime = Date.now() - startTime;

    this.emit('processing-completed', {
      type: 'processing-started',
      payload: {
        enrichedIdea,
        processingTime,
      },
      executionId: this.generateExecutionId(),
      timestamp: new Date(),
    } as PipelineEvent);

    return enrichedIdea;
  }

  async categorizeIdea(normalizedIdea: string): Promise<IdeaCategory> {
    const scores = new Map<IdeaCategory, number>();

    for (const [category, patterns] of this.categoryPatterns.entries()) {
      let score = 0;
      for (const pattern of patterns) {
        const matches = normalizedIdea.match(pattern);
        if (matches) {
          score += matches.length;
        }
      }
      scores.set(category, score);
    }

    // Find category with highest score
    let maxScore = 0;
    let selectedCategory: IdeaCategory = 'problem-solving'; // default

    for (const [category, score] of scores.entries()) {
      if (score > maxScore) {
        maxScore = score;
        selectedCategory = category;
      }
    }

    return selectedCategory;
  }

  async extractConcepts(idea: string): Promise<ConceptMap> {
    const entities: ConceptEntity[] = [];
    const keywords: string[] = [];

    // Extract action words (verbs)
    const actionPattern =
      /\b(create|build|analyze|generate|extract|validate|optimize|design|implement|develop)\b/gi;
    const actions = idea.match(actionPattern) || [];
    actions.forEach(action => {
      entities.push({
        text: action.toLowerCase(),
        type: 'action',
        confidence: 0.9,
      });
    });

    // Extract metrics and measurements
    const metricPattern =
      /\b(\d+%?|\w+\s+rate|score|metric|kpi|performance|efficiency|accuracy)\b/gi;
    const metrics = idea.match(metricPattern) || [];
    metrics.forEach(metric => {
      entities.push({
        text: metric.toLowerCase(),
        type: 'metric',
        confidence: 0.85,
      });
    });

    // Extract constraints
    const constraintPattern =
      /\b(must|should|require|need|within|less than|more than|at least|maximum|minimum)\b/gi;
    const constraints = idea.match(constraintPattern) || [];
    constraints.forEach(constraint => {
      entities.push({
        text: constraint.toLowerCase(),
        type: 'constraint',
        confidence: 0.8,
      });
    });

    // Extract key nouns as objects
    const nounPattern =
      /\b([A-Z][a-z]+|data|system|user|customer|product|service|report|analysis)\b/g;
    const nouns = idea.match(nounPattern) || [];
    nouns.forEach(noun => {
      if (!keywords.includes(noun.toLowerCase())) {
        keywords.push(noun.toLowerCase());
        entities.push({
          text: noun.toLowerCase(),
          type: 'object',
          confidence: 0.75,
        });
      }
    });

    // Build relationships between entities
    const relationships = this.extractRelationships(entities, idea);

    return {
      entities,
      relationships,
      keywords,
    };
  }

  private extractRelationships(
    entities: ConceptEntity[],
    idea: string
  ): Array<{ from: string; to: string; type: string }> {
    const relationships = [];

    // Look for action-object relationships
    const actionEntities = entities.filter(e => e.type === 'action');
    const objectEntities = entities.filter(e => e.type === 'object');

    for (const action of actionEntities) {
      for (const object of objectEntities) {
        // Check if action and object appear near each other
        const pattern = new RegExp(`${action.text}\\s+\\w*\\s*${object.text}`, 'i');
        if (idea.match(pattern)) {
          relationships.push({
            from: action.text,
            to: object.text,
            type: 'acts-on',
          });
        }
      }
    }

    return relationships;
  }

  deriveConstraints(idea: string, category: IdeaCategory): string[] {
    const constraints: string[] = [];

    // Time constraints
    if (idea.match(/urgent|asap|immediately|quickly|fast/i)) {
      constraints.push('High priority - urgent delivery required');
    }
    if (idea.match(/by|before|deadline|due/i)) {
      constraints.push('Has specific deadline requirements');
    }

    // Quality constraints
    if (idea.match(/accurate|precise|exact|correct/i)) {
      constraints.push('High accuracy required');
    }
    if (idea.match(/comprehensive|complete|thorough|detailed/i)) {
      constraints.push('Comprehensive coverage required');
    }

    // Category-specific constraints
    switch (category) {
      case 'market-research':
        constraints.push('Must be data-driven');
        constraints.push('Requires reliable sources');
        break;
      case 'product-development':
        constraints.push('Must align with user needs');
        constraints.push('Consider technical feasibility');
        break;
      case 'business-strategy':
        constraints.push('Must align with business objectives');
        constraints.push('Consider market conditions');
        break;
      case 'technical-design':
        constraints.push('Must be scalable');
        constraints.push('Consider security implications');
        break;
      case 'data-analysis':
        constraints.push('Must be statistically valid');
        constraints.push('Requires data quality checks');
        break;
    }

    // Compliance constraints
    if (idea.match(/compliant|compliance|regulatory|legal/i)) {
      constraints.push('Must meet compliance requirements');
    }

    return constraints;
  }

  enrichWithContext(idea: string, domain: string): EnrichedIdea {
    // This would be implemented with the full processIdea method
    // For now, throwing an error to indicate it needs async processing
    throw new Error('Use processIdea() method for full enrichment');
  }

  private normalizeIdea(rawIdea: string): string {
    return rawIdea
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?-]/g, '')
      .toLowerCase();
  }

  private suggestOutputType(idea: string, category: IdeaCategory): OutputType {
    let maxScore = 0;
    let selectedType: OutputType = 'analysis'; // default

    for (const [outputType, patterns] of this.outputTypePatterns.entries()) {
      let score = 0;
      for (const pattern of patterns) {
        if (idea.match(pattern)) {
          score++;
        }
      }

      if (score > maxScore) {
        maxScore = score;
        selectedType = outputType;
      }
    }

    // Category-based defaults if no clear match
    if (maxScore === 0) {
      switch (category) {
        case 'market-research':
        case 'data-analysis':
          return 'analysis';
        case 'product-development':
        case 'business-strategy':
          return 'action-items';
        case 'technical-design':
          return 'structured-report';
        default:
          return 'analysis';
      }
    }

    return selectedType;
  }

  private assessComplexity(idea: string, concepts: ConceptMap): 'simple' | 'moderate' | 'complex' {
    const wordCount = idea.split(/\s+/).length;
    const entityCount = concepts.entities.length;
    const relationshipCount = concepts.relationships.length;

    const complexityScore = wordCount / 10 + entityCount * 2 + relationshipCount * 3;

    if (complexityScore < 10) return 'simple';
    if (complexityScore < 25) return 'moderate';
    return 'complex';
  }

  private calculateConfidence(
    category: IdeaCategory,
    concepts: ConceptMap,
    constraints: string[]
  ): number {
    let confidence = 0.5; // base confidence

    // Boost confidence based on concept extraction
    if (concepts.entities.length > 3) confidence += 0.2;
    if (concepts.relationships.length > 0) confidence += 0.1;
    if (constraints.length > 2) confidence += 0.1;

    // Cap at 0.95
    return Math.min(confidence, 0.95);
  }

  private generateExecutionId(): string {
    return `idea-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
