import { EventEmitter } from 'events';
import {
  PipelineInput,
  PipelineOutput,
  PipelineMetrics,
  PipelineEvent,
  PipelineNodeConfig,
  ExecutionHints,
  ValidationRules,
} from './types.js';
import { EnhancedJsonderulo } from '../core/enhancedJsonderulo.js';
import { SchemaComplexityAnalyzer } from './schemaComplexity.js';
import { ContextAwareSchemaGenerator } from './contextAwareSchema.js';
import { PipelineOptimizer } from './optimizer.js';
import { IdeaInputProcessor } from './ideaInput.js';
import { QueryConstructor } from './queryConstructor.js';
import { OutputValidator } from './outputValidator.js';

/**
 * PipelineJsonderulo - A pipeline-ready version of jsonderulo
 *
 * This class wraps jsonderulo functionality to work seamlessly
 * as a modular component in idea optimization pipelines.
 */
export class PipelineJsonderulo extends EventEmitter {
  private jsonderulo: EnhancedJsonderulo;
  private complexityAnalyzer: SchemaComplexityAnalyzer;
  private contextAwareGenerator: ContextAwareSchemaGenerator;
  private optimizer: PipelineOptimizer;
  private metrics: PipelineMetrics;
  private config: PipelineNodeConfig;

  constructor(config?: Partial<PipelineNodeConfig>) {
    super();

    this.jsonderulo = new EnhancedJsonderulo();
    this.complexityAnalyzer = new SchemaComplexityAnalyzer();
    this.contextAwareGenerator = new ContextAwareSchemaGenerator();
    this.optimizer = new PipelineOptimizer();

    this.config = {
      nodeId: config?.nodeId || 'jsonderulo-structure-layer',
      nodeType: 'structure-layer',
      enabled: config?.enabled ?? true,
      config: config?.config || {},
      eventHandlers: config?.eventHandlers,
    };

    this.metrics = this.initializeMetrics();
    this.setupEventHandlers();
  }

  /**
   * Main processing method for pipeline integration
   */
  async process(input: PipelineInput): Promise<PipelineOutput> {
    const startTime = Date.now();
    const executionId = input.executionId || this.generateExecutionId();

    try {
      // Emit input received event
      this.emitEvent({
        type: 'input-received',
        payload: { input },
        executionId,
        timestamp: new Date(),
      });

      // Start processing
      this.emitEvent({
        type: 'processing-started',
        payload: { query: input.query },
        executionId,
        timestamp: new Date(),
      });

      // Generate schema based on context
      const { schema, schemaSource, confidence } = await this.generateContextAwareSchema(input);

      // Emit schema generated event
      this.emitEvent({
        type: 'schema-generated',
        payload: { schema, schemaSource, confidence },
        executionId,
        timestamp: new Date(),
      });

      // Transform the prompt
      const transformResult = this.jsonderulo.speak(
        input.query,
        undefined, // Schema already generated
        {
          mode: input.context.pipelineConfig?.debugMode ? 'explanatory' : 'strict',
          temperature: this.optimizer.getOptimalTemperature(input),
          includeExamples: this.shouldIncludeExamples(input),
          costOptimized: true,
        }
      );

      // Override with our context-aware schema
      transformResult.schema = schema;

      // Generate execution hints
      const executionHints = this.generateExecutionHints(input, schema);

      // Generate validation rules
      const validationRules = this.generateValidationRules(input, schema);

      // Analyze schema complexity
      const schemaComplexity = this.complexityAnalyzer.analyze(schema);

      // Calculate confidence score
      const confidenceScore = this.calculateConfidence(input, schema, schemaSource);

      // Build output
      const output: PipelineOutput = {
        structuredPrompt: transformResult.prompt,
        schema: schema,
        systemPrompt: transformResult.systemPrompt,
        validationRules,
        executionHints,
        metadata: {
          pipelineContext: input.context,
          jsonderuloProcessing: {
            schemaComplexity,
            confidenceScore,
            processingTime: Date.now() - startTime,
            schemaSource,
            templateUsed: this.getTemplateUsed(input),
          },
        },
        warnings: this.generateWarnings(input, schema, executionHints),
        executionId,
        timestamp: new Date(),
      };

      // Update metrics
      this.updateMetrics(output);

      // Emit output ready event
      this.emitEvent({
        type: 'output-ready',
        payload: { output },
        executionId,
        timestamp: new Date(),
      });

      return output;
    } catch (error) {
      // Emit error event
      this.emitEvent({
        type: 'error',
        payload: { input },
        executionId,
        timestamp: new Date(),
        error: {
          code: 'PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
      });

      throw error;
    }
  }

  /**
   * Generate schema with context awareness
   */
  private async generateContextAwareSchema(input: PipelineInput): Promise<{
    schema: any;
    schemaSource: 'inferred' | 'explicit' | 'template' | 'hybrid';
    confidence: number;
  }> {
    return this.contextAwareGenerator.generate(input);
  }

  /**
   * Generate execution hints based on input and schema
   */
  private generateExecutionHints(input: PipelineInput, schema: any): ExecutionHints {
    const complexity = this.complexityAnalyzer.analyze(schema);
    const taskType = this.inferTaskType(input);

    return this.optimizer.generateExecutionHints({
      input,
      schema,
      complexity,
      taskType,
    });
  }

  /**
   * Generate validation rules from schema and context
   */
  private generateValidationRules(input: PipelineInput, schema: any): ValidationRules {
    const requiredFields = this.extractRequiredFields(schema);
    const fieldValidation = this.extractFieldValidation(schema);

    return {
      requiredFields,
      fieldValidation,
      customValidators: this.getCustomValidators(input),
      enableAutoRepair: input.context.pipelineConfig?.debugMode ? false : true,
      maxRepairAttempts: 3,
    };
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(input: PipelineInput, schema: any, schemaSource: string): number {
    let confidence = 0.5; // Base confidence

    // Adjust based on schema source
    if (schemaSource === 'explicit') confidence += 0.3;
    else if (schemaSource === 'template') confidence += 0.2;
    else if (schemaSource === 'hybrid') confidence += 0.25;

    // Adjust based on upstream context
    if (input.context.upstream.queryOptimizationScore) {
      confidence += input.context.upstream.queryOptimizationScore * 0.1;
    }

    // Adjust based on schema hints
    if (input.schemaHints?.expectedFields) {
      confidence += 0.1;
    }

    // Cap at 1.0
    return Math.min(confidence, 1.0);
  }

  /**
   * Generate warnings for downstream nodes
   */
  private generateWarnings(
    input: PipelineInput,
    schema: any,
    executionHints: ExecutionHints
  ): string[] {
    const warnings: string[] = [];

    // Warn about high complexity
    const complexity = this.complexityAnalyzer.analyze(schema);
    if (complexity === 'complex') {
      warnings.push('Schema complexity is high - consider breaking down the task');
    }

    // Warn about cost
    if (executionHints.estimatedCost > 0.1) {
      warnings.push(`High estimated cost: $${executionHints.estimatedCost.toFixed(4)}`);
    }

    // Warn about token usage
    if (executionHints.expectedTokens > 3000) {
      warnings.push(`High token usage expected: ${executionHints.expectedTokens} tokens`);
    }

    // Warn about missing context
    if (!input.context.upstream.queryOptimizationScore) {
      warnings.push('No query optimization score available - results may vary');
    }

    return warnings;
  }

  /**
   * Utility methods
   */
  private shouldIncludeExamples(input: PipelineInput): boolean {
    // Include examples for complex schemas or when explicitly requested
    const complexity =
      input.schemaHints?.expectedFields && input.schemaHints.expectedFields.length > 5;
    return complexity || input.context.pipelineConfig?.debugMode || false;
  }

  private inferTaskType(input: PipelineInput): string {
    // Infer task type from context and query
    if (input.context.expectedOutputType === 'extraction') return 'extraction';
    if (input.context.expectedOutputType === 'classification') return 'classification';
    if (input.context.expectedOutputType === 'analysis') return 'analysis';

    // Fallback to query analysis
    const query = input.query.toLowerCase();
    if (query.includes('extract') || query.includes('find')) return 'extraction';
    if (query.includes('classify') || query.includes('categorize')) return 'classification';
    if (query.includes('analyze') || query.includes('evaluate')) return 'analysis';

    return 'general';
  }

  private extractRequiredFields(schema: any): string[] {
    if (schema.type === 'object' && schema.required) {
      return schema.required;
    }
    return [];
  }

  private extractFieldValidation(schema: any): Record<string, any> {
    const validation: Record<string, any> = {};

    if (schema.type === 'object' && schema.properties) {
      Object.entries(schema.properties).forEach(([field, fieldSchema]: [string, any]) => {
        validation[field] = {
          type: fieldSchema.type,
          constraints: {
            ...fieldSchema,
          },
        };
      });
    }

    return validation;
  }

  private getCustomValidators(input: PipelineInput): any[] {
    // Return custom validators based on domain/context
    const validators = [];

    if (input.context.domain === 'business-analysis') {
      validators.push({
        name: 'Business Metrics Validator',
        description: 'Validates business metrics are within reasonable ranges',
        validatorId: 'business-metrics-v1',
      });
    }

    return validators;
  }

  private getTemplateUsed(input: PipelineInput): string | undefined {
    // Determine if a template was used based on output type
    const templateMap: Record<string, string> = {
      extraction: 'extraction',
      classification: 'classification',
      analysis: 'analysis',
    };

    return templateMap[input.context.expectedOutputType];
  }

  private generateExecutionId(): string {
    return `jsonderulo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Event handling
   */
  private emitEvent(event: PipelineEvent): void {
    this.emit('pipeline-event', event);

    // Call configured event handlers
    if (this.config.eventHandlers) {
      switch (event.type) {
        case 'input-received':
          this.config.eventHandlers.onInput?.(event.payload.input);
          break;
        case 'output-ready':
          this.config.eventHandlers.onOutput?.(event.payload.output);
          break;
        case 'error':
          this.config.eventHandlers.onError?.(new Error(event.error?.message || 'Unknown error'));
          break;
      }
    }
  }

  private setupEventHandlers(): void {
    // Set up internal event handlers for metrics
    this.on('pipeline-event', (event: PipelineEvent) => {
      if (event.type === 'output-ready') {
        this.config.eventHandlers?.onMetrics?.(this.metrics);
      }
    });
  }

  /**
   * Metrics management
   */
  private initializeMetrics(): PipelineMetrics {
    return {
      requestsProcessed: 0,
      avgProcessingTime: 0,
      successRate: 1.0,
      avgSchemaComplexity: 0,
      costMetrics: {
        totalCost: 0,
        avgCostPerRequest: 0,
        costByProvider: {},
      },
      schemaMetrics: {
        inferredCount: 0,
        explicitCount: 0,
        templateCount: 0,
        hybridCount: 0,
      },
      validationMetrics: {
        validationAttempts: 0,
        validationSuccesses: 0,
        repairAttempts: 0,
        repairSuccesses: 0,
      },
    };
  }

  private updateMetrics(output: PipelineOutput): void {
    this.metrics.requestsProcessed++;

    // Update processing time
    const processingTime = output.metadata.jsonderuloProcessing.processingTime;
    this.metrics.avgProcessingTime =
      (this.metrics.avgProcessingTime * (this.metrics.requestsProcessed - 1) + processingTime) /
      this.metrics.requestsProcessed;

    // Update schema complexity
    const complexityScore =
      output.metadata.jsonderuloProcessing.schemaComplexity === 'simple'
        ? 1
        : output.metadata.jsonderuloProcessing.schemaComplexity === 'medium'
          ? 2
          : 3;
    this.metrics.avgSchemaComplexity =
      (this.metrics.avgSchemaComplexity * (this.metrics.requestsProcessed - 1) + complexityScore) /
      this.metrics.requestsProcessed;

    // Update schema source metrics
    const source = output.metadata.jsonderuloProcessing.schemaSource;
    this.metrics.schemaMetrics[`${source}Count` as keyof typeof this.metrics.schemaMetrics]++;

    // Update cost metrics
    const estimatedCost = output.executionHints.estimatedCost;
    this.metrics.costMetrics.totalCost += estimatedCost;
    this.metrics.costMetrics.avgCostPerRequest =
      this.metrics.costMetrics.totalCost / this.metrics.requestsProcessed;
  }

  /**
   * Public API
   */
  getMetrics(): PipelineMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  getConfig(): PipelineNodeConfig {
    return { ...this.config };
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }
}

// Export new pipeline components
export { IdeaInputProcessor } from './ideaInput.js';
export { QueryConstructor } from './queryConstructor.js';
export { OutputValidator } from './outputValidator.js';
export { PromptOptimizer } from './promptOptimizer.js';
export { LLMExecutor } from './llmExecutor.js';
export { FeedbackLoop } from './feedbackLoop.js';
export { PipelineOrchestrator } from './orchestrator.js';

// Export types
export type { ConceptEntity, ConceptMap, EnrichedIdea } from './ideaInput.js';
export type {
  StructuredQuery,
  QueryComponent,
  QueryFocus,
  QueryParameters,
  OptimizedQuery,
  ContextualQuery,
} from './queryConstructor.js';
export type {
  ValidationResult,
  SemanticValidationResult,
  BusinessValidationResult,
  BusinessRule,
  RepairedOutput,
} from './outputValidator.js';
export type {
  OptimizedPrompt,
  Example,
  ReasoningStep,
  ChainPrompt,
  CompressedPrompt,
} from './promptOptimizer.js';
export type {
  ExecutorConfig,
  BatchRequest,
  BatchResponse,
  StreamChunk,
  ChunkHandler,
} from './llmExecutor.js';
export type {
  FeedbackData,
  ExecutionResult,
  PatternInsights,
  OptimizationUpdate,
  Improvement,
} from './feedbackLoop.js';
export type {
  PipelineConfig,
  ExecutionPath,
  PipelineResult,
  PipelineHealth,
} from './orchestrator.js';
