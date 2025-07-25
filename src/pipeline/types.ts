/**
 * Pipeline Integration Types for Jsonderulo
 *
 * These types define the interfaces for integrating jsonderulo
 * as a modular component in larger idea optimization pipelines.
 */

export type PipelineNodeType =
  | 'idea-input'
  | 'query-construction'
  | 'prompt-optimization'
  | 'structure-layer' // This is jsonderulo
  | 'llm-execution'
  | 'output-validation'
  | 'feedback-loop';

export type OutputType =
  | 'structured-report'
  | 'action-items'
  | 'analysis'
  | 'classification'
  | 'extraction'
  | 'generation'
  | 'validation';

export type IdeaCategory =
  | 'market-research'
  | 'product-development'
  | 'business-strategy'
  | 'technical-design'
  | 'creative-content'
  | 'data-analysis'
  | 'problem-solving';

export interface PipelineContext {
  /** The domain or field of the idea */
  domain: string;

  /** Expected output type from the pipeline */
  expectedOutputType: OutputType;

  /** Constraints that must be satisfied */
  constraints: string[];

  /** Context from upstream nodes */
  upstream: {
    /** Category of the original idea */
    ideaCategory?: IdeaCategory;

    /** Score from query optimization (0-1) */
    queryOptimizationScore?: number;

    /** Previous node outputs */
    previousOutputs?: Record<string, any>;

    /** Accumulated metadata */
    metadata?: Record<string, any>;
  };

  /** Pipeline-wide configuration */
  pipelineConfig?: {
    /** Maximum cost budget for this pipeline run */
    maxCost?: number;

    /** Target completion time in ms */
    targetLatency?: number;

    /** Quality vs speed preference (0 = speed, 1 = quality) */
    qualityPreference?: number;

    /** Whether to enable debugging/explanatory modes */
    debugMode?: boolean;
  };
}

export interface PipelineInput {
  /** The main query or prompt to process */
  query: string;

  /** Optional schema hints from upstream */
  schemaHints?: {
    /** Expected fields in the output */
    expectedFields?: string[];

    /** Known data types */
    dataTypes?: Record<string, string>;

    /** Example outputs */
    examples?: any[];
  };

  /** Pipeline context */
  context: PipelineContext;

  /** Unique identifier for this pipeline execution */
  executionId?: string;

  /** Timestamp when this node received the input */
  timestamp?: Date;
}

export interface ExecutionHints {
  /** Recommended LLM provider based on task */
  recommendedProvider: string;

  /** Recommended model for this task */
  recommendedModel?: string;

  /** Estimated cost for execution */
  estimatedCost: number;

  /** Expected token usage */
  expectedTokens: number;

  /** Suggested temperature setting */
  suggestedTemperature?: number;

  /** Whether to enable streaming */
  enableStreaming?: boolean;
}

export interface ValidationRules {
  /** Required fields that must be present */
  requiredFields: string[];

  /** Field-level validation rules */
  fieldValidation?: Record<
    string,
    {
      type: string;
      constraints?: any;
    }
  >;

  /** Custom validation functions */
  customValidators?: Array<{
    name: string;
    description: string;
    validatorId: string;
  }>;

  /** Whether to auto-repair validation failures */
  enableAutoRepair: boolean;

  /** Maximum repair attempts */
  maxRepairAttempts?: number;
}

export interface PipelineOutput {
  /** The structured prompt ready for LLM execution */
  structuredPrompt: string;

  /** Generated JSON schema */
  schema: any;

  /** System prompt for the LLM */
  systemPrompt?: string;

  /** Validation rules for the output */
  validationRules: ValidationRules;

  /** Hints for downstream execution */
  executionHints: ExecutionHints;

  /** Metadata including input context and processing info */
  metadata: {
    /** Original pipeline context */
    pipelineContext: PipelineContext;

    /** Jsonderulo-specific processing information */
    jsonderuloProcessing: {
      /** Complexity of generated schema */
      schemaComplexity: 'simple' | 'medium' | 'complex';

      /** Confidence in schema accuracy (0-1) */
      confidenceScore: number;

      /** Processing time in ms */
      processingTime: number;

      /** Whether schema was inferred or explicitly defined */
      schemaSource: 'inferred' | 'explicit' | 'template' | 'hybrid';

      /** Template used, if any */
      templateUsed?: string;
    };
  };

  /** Warnings or suggestions for downstream nodes */
  warnings?: string[];

  /** Execution ID for tracking */
  executionId: string;

  /** Timestamp when processing completed */
  timestamp: Date;
}

export interface PipelineMetrics {
  /** Number of requests processed */
  requestsProcessed: number;

  /** Average processing time */
  avgProcessingTime: number;

  /** Success rate (successful schema generation) */
  successRate: number;

  /** Average schema complexity */
  avgSchemaComplexity: number;

  /** Cost metrics */
  costMetrics: {
    totalCost: number;
    avgCostPerRequest: number;
    costByProvider: Record<string, number>;
  };

  /** Schema generation metrics */
  schemaMetrics: {
    inferredCount: number;
    explicitCount: number;
    templateCount: number;
    hybridCount: number;
  };

  /** Validation metrics */
  validationMetrics: {
    validationAttempts: number;
    validationSuccesses: number;
    repairAttempts: number;
    repairSuccesses: number;
  };
}

export interface PipelineEvent {
  /** Type of event */
  type:
    | 'input-received'
    | 'processing-started'
    | 'schema-generated'
    | 'validation-completed'
    | 'output-ready'
    | 'error'
    | 'warning';

  /** Event payload */
  payload: any;

  /** Execution ID */
  executionId: string;

  /** Event timestamp */
  timestamp: Date;

  /** Optional error information */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PipelineNodeConfig {
  /** Node identifier */
  nodeId: string;

  /** Node type */
  nodeType: PipelineNodeType;

  /** Whether this node is enabled */
  enabled: boolean;

  /** Node-specific configuration */
  config?: Record<string, any>;

  /** Event handlers */
  eventHandlers?: {
    onInput?: (input: PipelineInput) => void;
    onOutput?: (output: PipelineOutput) => void;
    onError?: (error: Error) => void;
    onMetrics?: (metrics: PipelineMetrics) => void;
  };
}

export interface PipelineAdapter {
  /** Adapt input from upstream node format */
  adaptInput(upstreamOutput: any): PipelineInput;

  /** Adapt output for downstream node format */
  adaptOutput(pipelineOutput: PipelineOutput): any;

  /** Validate compatibility with upstream/downstream nodes */
  validateCompatibility(
    upstreamNode?: PipelineNodeConfig,
    downstreamNode?: PipelineNodeConfig
  ): boolean;
}
