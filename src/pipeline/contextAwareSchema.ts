/**
 * Context-Aware Schema Generator
 *
 * Generates JSON schemas based on pipeline context, upstream outputs,
 * and domain-specific knowledge.
 */

import { PipelineInput, IdeaCategory, OutputType } from './types.js';
import { SchemaGenerator } from '../core/schemaGenerator.js';

interface SchemaTemplate {
  name: string;
  applicableFor: {
    outputTypes?: OutputType[];
    ideaCategories?: IdeaCategory[];
    domains?: string[];
  };
  baseSchema: any;
  requiredContext?: string[];
}

export class ContextAwareSchemaGenerator {
  private schemaGenerator: SchemaGenerator;
  private templates: Map<string, SchemaTemplate>;
  private domainPatterns: Map<string, any>;

  constructor() {
    this.schemaGenerator = new SchemaGenerator();
    this.templates = this.initializeTemplates();
    this.domainPatterns = this.initializeDomainPatterns();
  }

  /**
   * Generate schema based on pipeline context
   */
  async generate(input: PipelineInput): Promise<{
    schema: any;
    schemaSource: 'inferred' | 'explicit' | 'template' | 'hybrid';
    confidence: number;
  }> {
    // Check for explicit schema hints
    if (input.schemaHints?.expectedFields && input.schemaHints.expectedFields.length > 0) {
      return this.generateFromHints(input);
    }

    // Try to find matching template
    const template = this.findMatchingTemplate(input);
    if (template) {
      return this.generateFromTemplate(input, template);
    }

    // Use domain patterns if available
    const domainSchema = this.generateFromDomainPattern(input);
    if (domainSchema) {
      return domainSchema;
    }

    // Fallback to inference from query
    return this.generateInferred(input);
  }

  /**
   * Generate schema from explicit hints
   */
  private generateFromHints(input: PipelineInput): {
    schema: any;
    schemaSource: 'explicit';
    confidence: number;
  } {
    const hints = input.schemaHints!;
    const schema: any = {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    };

    // Build properties from expected fields
    hints.expectedFields!.forEach(field => {
      const fieldType = hints.dataTypes?.[field] || this.inferFieldType(field);
      schema.properties[field] = this.createFieldSchema(field, fieldType, input);

      // Make fields required unless they seem optional
      if (!field.includes('optional') && !field.endsWith('?')) {
        schema.required.push(field);
      }
    });

    // Add constraints based on context
    this.addContextualConstraints(schema, input);

    return {
      schema,
      schemaSource: 'explicit',
      confidence: 0.9,
    };
  }

  /**
   * Generate schema from template
   */
  private generateFromTemplate(
    input: PipelineInput,
    template: SchemaTemplate
  ): {
    schema: any;
    schemaSource: 'template';
    confidence: number;
  } {
    // Clone base schema
    const schema = JSON.parse(JSON.stringify(template.baseSchema));

    // Customize based on context
    this.customizeSchemaForContext(schema, input);

    // Add any additional fields from hints
    if (input.schemaHints?.expectedFields) {
      input.schemaHints.expectedFields.forEach(field => {
        if (!schema.properties[field]) {
          schema.properties[field] = this.createFieldSchema(field, 'string', input);
        }
      });
    }

    return {
      schema,
      schemaSource: 'template',
      confidence: 0.85,
    };
  }

  /**
   * Generate schema from domain patterns
   */
  private generateFromDomainPattern(input: PipelineInput): {
    schema: any;
    schemaSource: 'hybrid';
    confidence: number;
  } | null {
    const domainPattern = this.domainPatterns.get(input.context.domain);
    if (!domainPattern) return null;

    // Start with domain pattern
    const schema = JSON.parse(JSON.stringify(domainPattern));

    // Enhance with query analysis
    const queryEnhancements = this.analyzeQueryForSchema(input.query);
    this.mergeSchemaEnhancements(schema, queryEnhancements);

    // Add output type specific fields
    this.addOutputTypeFields(schema, input.context.expectedOutputType);

    return {
      schema,
      schemaSource: 'hybrid',
      confidence: 0.75,
    };
  }

  /**
   * Generate inferred schema
   */
  private generateInferred(input: PipelineInput): {
    schema: any;
    schemaSource: 'inferred';
    confidence: number;
  } {
    // Use the base schema generator with context hints
    const contextualDescription = this.createContextualDescription(input);
    const schema = this.schemaGenerator.generateFromDescription(contextualDescription);

    // Enhance with output type requirements
    this.addOutputTypeFields(schema, input.context.expectedOutputType);

    return {
      schema,
      schemaSource: 'inferred',
      confidence: 0.6,
    };
  }

  /**
   * Find matching template based on context
   */
  private findMatchingTemplate(input: PipelineInput): SchemaTemplate | null {
    for (const template of this.templates.values()) {
      const applicable = template.applicableFor;

      // Check output type match
      if (
        applicable.outputTypes &&
        !applicable.outputTypes.includes(input.context.expectedOutputType)
      ) {
        continue;
      }

      // Check idea category match
      if (
        applicable.ideaCategories &&
        input.context.upstream.ideaCategory &&
        !applicable.ideaCategories.includes(input.context.upstream.ideaCategory)
      ) {
        continue;
      }

      // Check domain match
      if (applicable.domains && !applicable.domains.includes(input.context.domain)) {
        continue;
      }

      // Check required context
      if (template.requiredContext) {
        const hasRequired = template.requiredContext.every(
          req => input.context.constraints.includes(req) || input.context.upstream.metadata?.[req]
        );
        if (!hasRequired) continue;
      }

      return template;
    }

    return null;
  }

  /**
   * Infer field type from field name
   */
  private inferFieldType(fieldName: string): string {
    const name = fieldName.toLowerCase();

    // Common patterns
    if (name.includes('date') || name.includes('time')) return 'date-time';
    if (name.includes('email')) return 'email';
    if (name.includes('url') || name.includes('link')) return 'url';
    if (name.includes('count') || name.includes('number') || name.includes('amount'))
      return 'number';
    if (name.includes('price') || name.includes('cost')) return 'number';
    if (name.includes('is') || name.includes('has') || name.includes('enabled')) return 'boolean';
    if (name.includes('list') || name.includes('items') || name.endsWith('s')) return 'array';
    if (name.includes('description') || name.includes('content')) return 'string';

    return 'string'; // Default
  }

  /**
   * Create field schema based on type and context
   */
  private createFieldSchema(fieldName: string, fieldType: string, input: PipelineInput): any {
    const baseSchema: any = {};

    switch (fieldType) {
      case 'string':
        baseSchema.type = 'string';
        if (fieldName.includes('description') || fieldName.includes('content')) {
          baseSchema.minLength = 10;
          baseSchema.maxLength = 1000;
        }
        break;

      case 'number':
        baseSchema.type = 'number';
        if (fieldName.includes('price') || fieldName.includes('cost')) {
          baseSchema.minimum = 0;
        }
        if (fieldName.includes('percentage') || fieldName.includes('rate')) {
          baseSchema.minimum = 0;
          baseSchema.maximum = 100;
        }
        break;

      case 'boolean':
        baseSchema.type = 'boolean';
        break;

      case 'array':
        baseSchema.type = 'array';
        baseSchema.items = { type: 'string' }; // Default to string array
        break;

      case 'date-time':
        baseSchema.type = 'string';
        baseSchema.format = 'date-time';
        break;

      case 'email':
        baseSchema.type = 'string';
        baseSchema.format = 'email';
        break;

      case 'url':
        baseSchema.type = 'string';
        baseSchema.format = 'uri';
        break;

      default:
        baseSchema.type = 'string';
    }

    // Add description if in debug mode
    if (input.context.pipelineConfig?.debugMode) {
      baseSchema.description = `Field: ${fieldName}`;
    }

    return baseSchema;
  }

  /**
   * Add contextual constraints to schema
   */
  private addContextualConstraints(schema: any, input: PipelineInput): void {
    // Add constraints based on pipeline constraints
    input.context.constraints.forEach(constraint => {
      switch (constraint) {
        case 'include-data-sources':
          if (!schema.properties.dataSources) {
            schema.properties.dataSources = {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  url: { type: 'string', format: 'uri' },
                  credibility: { type: 'number', minimum: 0, maximum: 1 },
                },
                required: ['name'],
              },
            };
            schema.required.push('dataSources');
          }
          break;

        case 'quantify-impacts':
          if (!schema.properties.impacts) {
            schema.properties.impacts = {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  area: { type: 'string' },
                  metric: { type: 'string' },
                  value: { type: 'number' },
                  unit: { type: 'string' },
                },
                required: ['area', 'metric', 'value'],
              },
            };
          }
          break;

        case 'include-confidence':
          if (!schema.properties.confidence) {
            schema.properties.confidence = {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Confidence score for the analysis',
            };
            schema.required.push('confidence');
          }
          break;
      }
    });
  }

  /**
   * Customize schema based on context
   */
  private customizeSchemaForContext(schema: any, input: PipelineInput): void {
    // Add quality preference based fields
    const qualityPref = input.context.pipelineConfig?.qualityPreference ?? 0.5;

    if (qualityPref > 0.7 && schema.properties) {
      // High quality - add explanation fields
      Object.keys(schema.properties).forEach(key => {
        if (!key.includes('explanation') && !key.includes('reasoning')) {
          const explanationKey = `${key}Explanation`;
          if (!schema.properties[explanationKey]) {
            schema.properties[explanationKey] = {
              type: 'string',
              description: `Explanation for ${key}`,
            };
          }
        }
      });
    }

    // Add debug fields if in debug mode
    if (input.context.pipelineConfig?.debugMode) {
      schema.properties._debug = {
        type: 'object',
        properties: {
          processingTime: { type: 'number' },
          modelUsed: { type: 'string' },
          confidence: { type: 'number' },
        },
      };
    }
  }

  /**
   * Analyze query for schema enhancements
   */
  private analyzeQueryForSchema(query: string): any {
    const enhancements: any = {
      properties: {},
      required: [],
    };

    const lowerQuery = query.toLowerCase();

    // Look for specific patterns
    if (lowerQuery.includes('compare') || lowerQuery.includes('versus')) {
      enhancements.properties.comparison = {
        type: 'object',
        properties: {
          items: { type: 'array', items: { type: 'object' } },
          criteria: { type: 'array', items: { type: 'string' } },
          winner: { type: 'string' },
          reasoning: { type: 'string' },
        },
      };
    }

    if (lowerQuery.includes('trend') || lowerQuery.includes('over time')) {
      enhancements.properties.timeline = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            period: { type: 'string' },
            value: { type: 'number' },
            change: { type: 'number' },
          },
        },
      };
    }

    if (lowerQuery.includes('pros') && lowerQuery.includes('cons')) {
      enhancements.properties.pros = {
        type: 'array',
        items: { type: 'string' },
      };
      enhancements.properties.cons = {
        type: 'array',
        items: { type: 'string' },
      };
    }

    return enhancements;
  }

  /**
   * Merge schema enhancements
   */
  private mergeSchemaEnhancements(base: any, enhancements: any): void {
    if (enhancements.properties) {
      Object.assign(base.properties, enhancements.properties);
    }

    if (enhancements.required) {
      base.required = [...new Set([...base.required, ...enhancements.required])];
    }
  }

  /**
   * Add output type specific fields
   */
  private addOutputTypeFields(schema: any, outputType: OutputType): void {
    switch (outputType) {
      case 'structured-report':
        this.ensureReportStructure(schema);
        break;
      case 'action-items':
        this.ensureActionItemsStructure(schema);
        break;
      case 'analysis':
        this.ensureAnalysisStructure(schema);
        break;
      case 'classification':
        this.ensureClassificationStructure(schema);
        break;
      case 'extraction':
        this.ensureExtractionStructure(schema);
        break;
    }
  }

  private ensureReportStructure(schema: any): void {
    if (!schema.properties.summary) {
      schema.properties.summary = { type: 'string', minLength: 50 };
    }
    if (!schema.properties.sections) {
      schema.properties.sections = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            subsections: { type: 'array' },
          },
          required: ['title', 'content'],
        },
      };
    }
    if (!schema.properties.conclusion) {
      schema.properties.conclusion = { type: 'string' };
    }
  }

  private ensureActionItemsStructure(schema: any): void {
    if (!schema.properties.actionItems) {
      schema.properties.actionItems = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            task: { type: 'string' },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            deadline: { type: 'string', format: 'date' },
            assignee: { type: 'string' },
            dependencies: { type: 'array', items: { type: 'string' } },
          },
          required: ['task', 'priority'],
        },
      };
      schema.required.push('actionItems');
    }
  }

  private ensureAnalysisStructure(schema: any): void {
    if (!schema.properties.findings) {
      schema.properties.findings = {
        type: 'array',
        items: { type: 'string' },
      };
    }
    if (!schema.properties.insights) {
      schema.properties.insights = {
        type: 'array',
        items: { type: 'string' },
      };
    }
    if (!schema.properties.recommendations) {
      schema.properties.recommendations = {
        type: 'array',
        items: { type: 'string' },
      };
    }
  }

  private ensureClassificationStructure(schema: any): void {
    if (!schema.properties.category) {
      schema.properties.category = { type: 'string' };
      schema.required.push('category');
    }
    if (!schema.properties.confidence) {
      schema.properties.confidence = {
        type: 'number',
        minimum: 0,
        maximum: 1,
      };
    }
    if (!schema.properties.reasoning) {
      schema.properties.reasoning = { type: 'string' };
    }
  }

  private ensureExtractionStructure(schema: any): void {
    if (!schema.properties.extractedData) {
      schema.properties.extractedData = {
        type: 'object',
        additionalProperties: true,
      };
    }
    if (!schema.properties.metadata) {
      schema.properties.metadata = {
        type: 'object',
        properties: {
          sourceLength: { type: 'number' },
          extractionConfidence: { type: 'number' },
          missingFields: { type: 'array', items: { type: 'string' } },
        },
      };
    }
  }

  /**
   * Create contextual description for inference
   */
  private createContextualDescription(input: PipelineInput): string {
    const parts = [];

    // Add output type requirement
    parts.push(`Generate a ${input.context.expectedOutputType} structure`);

    // Add domain context
    if (input.context.domain) {
      parts.push(`for ${input.context.domain} domain`);
    }

    // Add constraints
    if (input.context.constraints.length > 0) {
      parts.push(`including ${input.context.constraints.join(', ')}`);
    }

    // Add query context
    parts.push(`to address: ${input.query}`);

    return parts.join(' ');
  }

  /**
   * Initialize schema templates
   */
  private initializeTemplates(): Map<string, SchemaTemplate> {
    const templates = new Map<string, SchemaTemplate>();

    // Market Research Template
    templates.set('market-research', {
      name: 'Market Research Report',
      applicableFor: {
        outputTypes: ['structured-report', 'analysis'],
        ideaCategories: ['market-research'],
        domains: ['business-analysis', 'market-analysis'],
      },
      baseSchema: {
        type: 'object',
        properties: {
          marketOverview: {
            type: 'object',
            properties: {
              size: { type: 'number' },
              growth: { type: 'number' },
              segments: { type: 'array', items: { type: 'string' } },
            },
          },
          competitors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                marketShare: { type: 'number' },
                strengths: { type: 'array', items: { type: 'string' } },
                weaknesses: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          opportunities: { type: 'array', items: { type: 'string' } },
          threats: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
        },
        required: ['marketOverview', 'competitors', 'opportunities', 'recommendations'],
      },
    });

    // Technical Design Template
    templates.set('technical-design', {
      name: 'Technical Design Document',
      applicableFor: {
        outputTypes: ['structured-report'],
        ideaCategories: ['technical-design'],
        domains: ['software-engineering', 'system-design'],
      },
      baseSchema: {
        type: 'object',
        properties: {
          overview: { type: 'string' },
          architecture: {
            type: 'object',
            properties: {
              components: { type: 'array', items: { type: 'object' } },
              dataFlow: { type: 'object' },
              technologies: { type: 'array', items: { type: 'string' } },
            },
          },
          implementation: {
            type: 'object',
            properties: {
              phases: { type: 'array', items: { type: 'object' } },
              timeline: { type: 'string' },
              resources: { type: 'array', items: { type: 'string' } },
            },
          },
          risks: { type: 'array', items: { type: 'object' } },
          testing: { type: 'object' },
        },
        required: ['overview', 'architecture', 'implementation'],
      },
    });

    return templates;
  }

  /**
   * Initialize domain patterns
   */
  private initializeDomainPatterns(): Map<string, any> {
    const patterns = new Map<string, any>();

    // Business Analysis Pattern
    patterns.set('business-analysis', {
      type: 'object',
      properties: {
        executiveSummary: { type: 'string' },
        currentState: { type: 'object' },
        proposedState: { type: 'object' },
        gap: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        roi: { type: 'object' },
      },
      required: ['executiveSummary', 'recommendations'],
    });

    // Data Analysis Pattern
    patterns.set('data-analysis', {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        methodology: { type: 'string' },
        findings: { type: 'array', items: { type: 'object' } },
        visualizations: { type: 'array', items: { type: 'object' } },
        conclusions: { type: 'array', items: { type: 'string' } },
      },
      required: ['summary', 'findings', 'conclusions'],
    });

    return patterns;
  }
}
