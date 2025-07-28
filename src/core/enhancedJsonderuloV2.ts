/**
 * Enhanced Jsonderulo V2 - The Ultimate Prompt & Context Engineering System
 * 
 * Integrates all advanced features:
 * - Advanced context management with semantic retrieval
 * - Chain of Thought and Tree of Thoughts prompting
 * - JSON streaming with progressive validation
 * - Prompt quality scoring and A/B testing
 * - Self-consistency and reliability features
 */

import { EventEmitter } from 'events';
import { z } from 'zod';
import { Jsonderulo, JsonDeruloOptions, JsonDeruloResult } from './jsonderulo.js';
import { ContextManager, ContextEntry, ContextWindow } from './contextManager.js';
import { AdvancedPrompting, PromptingStrategy, ConsistencyResult, AdvancedPromptResult } from './advancedPrompting.js';
import { EmbeddingsManager, SimilarityResult } from './embeddingsManager.js';
import { JsonStreamingValidator, StreamingResult, StreamingOptions } from './jsonStreaming.js';
import { PromptQualityFramework, PromptMetrics, QualityScore, ABTestConfig } from './promptQualityFramework.js';
import { SchemaGenerator, GeneratedSchema } from './schemaGenerator.js';
import { PromptEngine } from './promptEngine.js';
import { JsonValidator } from './validator.js';

export interface EnhancedOptions extends JsonDeruloOptions {
  // Context options
  enableContext?: boolean;
  contextWindowSize?: number;
  semanticSearch?: boolean;
  
  // Prompting strategy
  strategy?: PromptingStrategy | PromptingStrategy[];
  enableCoT?: boolean;
  enableToT?: boolean;
  selfConsistency?: boolean;
  consistencyRounds?: number;
  
  // Streaming options
  streaming?: boolean;
  streamingOptions?: StreamingOptions;
  
  // Quality options
  trackQuality?: boolean;
  enableABTesting?: boolean;
  qualityThreshold?: number;
  
  // Advanced options
  adaptivePrompting?: boolean;
  contextCompression?: boolean;
  schemaEvolution?: boolean;
}

export interface EnhancedResult extends JsonDeruloResult {
  context?: ContextWindow;
  reasoning?: {
    steps?: any[];
    tree?: any;
    consistency?: ConsistencyResult;
  };
  streaming?: AsyncIterable<StreamingResult>;
  quality?: {
    score: QualityScore;
    metrics: PromptMetrics;
    recommendations?: string[];
  };
  metadata?: {
    strategy: PromptingStrategy | PromptingStrategy[];
    tokensUsed: number;
    processingTime: number;
    contextRetrieved?: number;
  };
}

export class EnhancedJsonderuloV2 extends EventEmitter {
  private baseJsonderulo: Jsonderulo;
  private contextManager: ContextManager;
  private advancedPrompting: AdvancedPrompting;
  private embeddingsManager: EmbeddingsManager;
  private streamingValidator: JsonStreamingValidator;
  private qualityFramework: PromptQualityFramework;
  
  private defaultOptions: Required<EnhancedOptions> = {
    mode: 'strict',
    temperature: 0.7,
    includeExamples: true,
    autoRepair: true,
    maxRetries: 3,
    enableContext: true,
    contextWindowSize: 4000,
    semanticSearch: true,
    strategy: 'standard',
    enableCoT: false,
    enableToT: false,
    selfConsistency: false,
    consistencyRounds: 3,
    streaming: false,
    streamingOptions: {},
    trackQuality: true,
    enableABTesting: false,
    qualityThreshold: 0.8,
    adaptivePrompting: true,
    contextCompression: true,
    schemaEvolution: false,
  };

  constructor() {
    super();
    
    // Initialize all components
    this.baseJsonderulo = new Jsonderulo();
    this.contextManager = new ContextManager({
      maxTokens: 4000,
      compressionEnabled: true,
      semanticSearchEnabled: true,
    });
    this.advancedPrompting = new AdvancedPrompting();
    this.embeddingsManager = new EmbeddingsManager();
    this.streamingValidator = new JsonStreamingValidator();
    this.qualityFramework = new PromptQualityFramework();
    
    this.setupEventForwarding();
  }

  private setupEventForwarding(): void {
    // Forward events from components
    this.contextManager.on('entry-added', data => this.emit('context:entry-added', data));
    this.advancedPrompting.on('optimization-completed', data => this.emit('prompting:optimized', data));
    this.embeddingsManager.on('embedding-generated', data => this.emit('embeddings:generated', data));
    this.qualityFramework.on('prompt-evaluated', data => this.emit('quality:evaluated', data));
  }

  /**
   * Enhanced speak method with all advanced features
   */
  async speakEnhanced(
    request: string,
    schemaDescription?: string,
    options: EnhancedOptions = {}
  ): Promise<EnhancedResult> {
    const startTime = Date.now();
    const opts = { ...this.defaultOptions, ...options };
    
    this.emit('processing-started', { request, options: opts });

    // Step 1: Context retrieval
    let contextWindow: ContextWindow | undefined;
    if (opts.enableContext) {
      contextWindow = await this.buildContext(request, opts);
      this.emit('context-built', { entries: contextWindow.entries.length });
    }

    // Step 2: Schema generation or retrieval
    const schema = schemaDescription
      ? this.baseJsonderulo['schemaGenerator'].generateFromDescription(schemaDescription)
      : this.baseJsonderulo['inferSchemaFromRequest'](request);

    // Step 3: Apply advanced prompting strategy
    let enhancedPromptResult: AdvancedPromptResult;
    
    if (Array.isArray(opts.strategy)) {
      enhancedPromptResult = this.advancedPrompting.combineStrategies(
        request,
        opts.strategy,
        schema
      );
    } else if (opts.enableCoT || opts.strategy === 'cot') {
      enhancedPromptResult = this.advancedPrompting.generateCoTPrompt(
        request,
        schema,
        { explicitReasoning: true, structured: true }
      );
    } else if (opts.enableToT || opts.strategy === 'tot') {
      enhancedPromptResult = this.advancedPrompting.generateToTPrompt(
        request,
        schema,
        { branches: 3, depth: 3 }
      );
    } else if (opts.strategy === 'role-based') {
      enhancedPromptResult = this.advancedPrompting.generateRoleBasedPrompt(
        request,
        'data-analyst',
        schema
      );
    } else {
      // Use base jsonderulo transformation
      const baseResult = this.baseJsonderulo.speak(request, schemaDescription, opts);
      enhancedPromptResult = {
        strategy: 'standard',
        prompt: baseResult.prompt,
        systemPrompt: baseResult.systemPrompt,
        metadata: {},
      };
    }

    // Step 4: Add context to prompt
    if (contextWindow) {
      enhancedPromptResult.prompt = this.integrateContext(
        enhancedPromptResult.prompt,
        contextWindow
      );
    }

    // Step 5: Prepare streaming if enabled
    let streamingResult: AsyncIterable<StreamingResult> | undefined;
    if (opts.streaming) {
      streamingResult = this.createStreamingWrapper(
        enhancedPromptResult.prompt,
        schema,
        opts.streamingOptions
      );
    }

    // Step 6: Track initial quality metrics
    const initialMetrics = await this.qualityFramework.evaluatePrompt(
      enhancedPromptResult.prompt,
      null,
      undefined,
      { requestLength: request.length }
    );

    const processingTime = Date.now() - startTime;

    // Build result
    const result: EnhancedResult = {
      prompt: enhancedPromptResult.prompt,
      schema,
      systemPrompt: enhancedPromptResult.systemPrompt,
      context: contextWindow,
      reasoning: {
        steps: enhancedPromptResult.metadata.steps,
        tree: enhancedPromptResult.metadata.tree,
      },
      streaming: streamingResult,
      quality: opts.trackQuality ? {
        score: this.qualityFramework.calculateQualityScore(initialMetrics),
        metrics: initialMetrics,
        recommendations: this.qualityFramework.generateOptimizationSuggestions(
          enhancedPromptResult.prompt,
          []
        ),
      } : undefined,
      metadata: {
        strategy: enhancedPromptResult.strategy,
        tokensUsed: this.estimateTokens(enhancedPromptResult.prompt),
        processingTime,
        contextRetrieved: contextWindow?.entries.length,
      },
    };

    this.emit('processing-completed', result);
    return result;
  }

  /**
   * Process with self-consistency for reliability
   */
  async processWithConsistency(
    request: string,
    llmFunction: (prompt: string) => Promise<string>,
    options: EnhancedOptions = {}
  ): Promise<{
    success: boolean;
    data?: any;
    consistency?: ConsistencyResult;
    attempts?: number;
  }> {
    const opts = { ...this.defaultOptions, ...options };
    const rounds = opts.consistencyRounds;

    // Generate multiple prompt variations
    const prompts = this.advancedPrompting.generateSelfConsistencyPrompt(
      request,
      undefined,
      { variations: rounds }
    );

    // Execute all variations
    const outputs: any[] = [];
    let attempts = 0;

    for (const promptResult of prompts) {
      try {
        attempts++;
        const response = await llmFunction(promptResult.prompt);
        const parsed = JSON.parse(response);
        outputs.push(parsed);
      } catch (error) {
        this.emit('consistency-round-failed', { attempt: attempts, error });
      }
    }

    // Analyze consistency
    const consistency = this.advancedPrompting.analyzeConsistency(outputs);

    if (consistency.consensusOutput && consistency.confidenceScore > opts.qualityThreshold) {
      return {
        success: true,
        data: consistency.consensusOutput,
        consistency,
        attempts,
      };
    }

    return {
      success: false,
      consistency,
      attempts,
    };
  }

  /**
   * Stream JSON generation with progressive validation
   */
  async *streamJSON(
    request: string,
    llmStreamFunction: (prompt: string) => AsyncIterable<string>,
    schema?: z.ZodType<any>,
    options: EnhancedOptions = {}
  ): AsyncIterable<StreamingResult> {
    const enhancedResult = await this.speakEnhanced(request, undefined, {
      ...options,
      streaming: true,
    });

    const textStream = llmStreamFunction(enhancedResult.prompt);
    
    // Use streaming validator
    yield* this.streamingValidator.processTextStream(textStream, schema);
  }

  /**
   * Run A/B test for prompt optimization
   */
  async runABTest(
    baseRequest: string,
    variants: Array<{
      name: string;
      modifier: (request: string) => string;
      strategy?: PromptingStrategy;
    }>,
    llmFunction: (prompt: string) => Promise<string>,
    testConfig: Partial<ABTestConfig>
  ): Promise<string> {
    // Create prompt variants
    const promptVariants = await Promise.all(
      variants.map(async (variant, index) => {
        const modifiedRequest = variant.modifier(baseRequest);
        const result = await this.speakEnhanced(modifiedRequest, undefined, {
          strategy: variant.strategy || 'standard',
        });
        
        return {
          id: `variant-${index}`,
          name: variant.name,
          prompt: result.prompt,
          systemPrompt: result.systemPrompt,
          metadata: {
            strategy: variant.strategy,
          },
        };
      })
    );

    // Start A/B test
    const config: ABTestConfig = {
      name: testConfig.name || 'Prompt Optimization Test',
      description: testConfig.description || 'Testing prompt variations',
      variants: promptVariants,
      sampleSize: testConfig.sampleSize || 20,
      metrics: testConfig.metrics || ['outputAccuracy', 'schemaCompliance', 'tokensUsed'],
      ...testConfig,
    };

    const testId = await this.qualityFramework.startABTest(config);
    
    this.emit('ab-test-started', { testId, config });
    return testId;
  }

  /**
   * Add context entry for future retrieval
   */
  addContext(
    content: string,
    type: ContextEntry['type'] = 'reference',
    metadata?: Partial<ContextEntry['metadata']>
  ): string {
    const entryId = this.contextManager.addEntry({
      content,
      type,
      metadata,
    });

    // Add to embeddings for semantic search
    this.embeddingsManager.addText(content, {
      type,
      ...metadata,
    });

    return entryId;
  }

  /**
   * Find similar context entries
   */
  async findSimilarContext(
    query: string,
    maxResults: number = 5
  ): Promise<SimilarityResult[]> {
    return this.embeddingsManager.findSimilar(query, {
      maxResults,
      threshold: 0.7,
    });
  }

  /**
   * Get quality metrics for recent prompts
   */
  getQualityMetrics(timeRange?: { start: Date; end: Date }): {
    avgQualityScore: number;
    totalPrompts: number;
    improvements: string[];
  } {
    const historical = this.qualityFramework.getHistoricalPerformance('global', timeRange);
    
    if (historical.length === 0) {
      return {
        avgQualityScore: 0,
        totalPrompts: 0,
        improvements: ['No data available yet'],
      };
    }

    const avgMetrics = historical.reduce((acc, result) => {
      Object.entries(result.metrics).forEach(([key, value]) => {
        if (typeof value === 'number') {
          acc[key] = (acc[key] || 0) + value;
        }
      });
      return acc;
    }, {} as any);

    Object.keys(avgMetrics).forEach(key => {
      avgMetrics[key] /= historical.length;
    });

    const qualityScore = this.qualityFramework.calculateQualityScore(avgMetrics as PromptMetrics);
    
    return {
      avgQualityScore: qualityScore.overall,
      totalPrompts: historical.length,
      improvements: qualityScore.recommendations,
    };
  }

  /**
   * Export current configuration and learned patterns
   */
  exportLearnings(): {
    contextEntries: number;
    embeddingsCount: number;
    qualityInsights: any;
    bestPractices: string[];
  } {
    const contextData = this.contextManager.exportContext();
    const embeddingsData = this.embeddingsManager.exportEmbeddings();
    const qualityMetrics = this.getQualityMetrics();

    const bestPractices: string[] = [];
    
    if (qualityMetrics.avgQualityScore > 0.85) {
      bestPractices.push('Current prompting strategies are highly effective');
    }
    
    if (contextData.entries.length > 100) {
      bestPractices.push('Rich context history enables better responses');
    }

    return {
      contextEntries: contextData.entries.length,
      embeddingsCount: embeddingsData.embeddings.length,
      qualityInsights: qualityMetrics,
      bestPractices,
    };
  }

  // Private helper methods

  private async buildContext(
    request: string,
    options: EnhancedOptions
  ): Promise<ContextWindow> {
    const relevantContext = await this.contextManager.retrieveContext({
      query: request,
      maxResults: 10,
    });

    // Find semantically similar content
    if (options.semanticSearch) {
      const similar = await this.embeddingsManager.findSimilar(request, {
        maxResults: 5,
        threshold: 0.8,
      });

      const semanticContext = similar.map(result => result.metadata.text);
      
      return this.contextManager.buildContextWindow(
        request,
        semanticContext
      );
    }

    return this.contextManager.buildContextWindow(request);
  }

  private integrateContext(prompt: string, context: ContextWindow): string {
    if (context.entries.length === 0) return prompt;

    const contextText = context.entries
      .map(entry => `[${entry.type}]: ${entry.content}`)
      .join('\n');

    return `Given the following context:\n${contextText}\n\n${prompt}`;
  }

  private createStreamingWrapper(
    prompt: string,
    schema: any,
    options?: StreamingOptions
  ): AsyncIterable<StreamingResult> {
    // Return a wrapper that will be used when streaming is initiated
    return {
      async *[Symbol.asyncIterator]() {
        const validator = new JsonStreamingValidator(options);
        validator.initializeStream(schema);
        
        // This would be connected to actual LLM streaming
        yield* validator.processTextStream(async function* () {
          yield '{"status": "streaming", "message": "Ready for streaming"}';
        }());
      },
    };
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  // Public configuration methods

  updateContextConfig(config: Partial<ContextManager['config']>): void {
    this.contextManager.updateConfig(config);
  }

  updateQualityWeights(weights: Partial<typeof this.qualityFramework['scoringWeights']>): void {
    Object.assign(this.qualityFramework['scoringWeights'], weights);
  }

  setEmbeddingsProvider(provider: 'openai' | 'local' | 'mock'): void {
    // Update embeddings manager config
    this.embeddingsManager = new EmbeddingsManager({ provider });
  }

  // Utility methods

  getAllTemplates(): string[] {
    return this.baseJsonderulo.getAvailableTemplates();
  }

  getRoles(): string[] {
    return Array.from(this.advancedPrompting['roleLibrary'].keys());
  }

  getActiveTests(): any[] {
    return this.qualityFramework.getActiveTests();
  }
}