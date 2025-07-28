/**
 * Unified Jsonderulo - Consolidates all three implementations into a modular, feature-complete system
 * Combines: basic jsonderulo + enhanced LLM integration + V2 advanced prompting strategies
 */

import { SchemaGenerator } from './schemaGenerator.js';
import { PromptEngine } from './promptEngine.js';
import { JsonValidator } from './validator.js';
import { ContextManager } from './contextManager.js';
import { AdvancedPrompting } from './advancedPrompting.js';
import { EmbeddingsManager } from './embeddingsManager.js';
import { JsonStreaming } from './jsonStreaming.js';
import { PromptQualityFramework } from './promptQualityFramework.js';

// Types and Interfaces
export type PromptMode = 'strict' | 'explanatory' | 'streaming' | 'validated';
export type PromptingStrategy = 'chain-of-thought' | 'tree-of-thoughts' | 'role-based' | 'self-consistency' | 'react' | 'constitutional';
export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'cohere' | 'huggingface' | 'local';

export interface UnifiedConfig {
  // Core features
  enableBasicPrompting?: boolean;
  enableTemplates?: boolean;
  enableValidation?: boolean;
  
  // LLM Integration
  enableLLMIntegration?: boolean;
  enableCostTracking?: boolean;
  enableMultiProvider?: boolean;
  
  // V2 Advanced Features
  enableAdvancedPrompting?: boolean;
  enableContextManagement?: boolean;
  enableStreaming?: boolean;
  enableQualityFramework?: boolean;
  enableABTesting?: boolean;
  
  // Provider configs
  providers?: Record<string, ProviderConfig>;
  defaultProvider?: string;
  fallbackOrder?: string[];
}

export interface ProviderConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface UnifiedOptions {
  // Basic options
  mode?: PromptMode;
  includeExamples?: boolean;
  maxRetries?: number;
  
  // LLM options
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  costOptimized?: boolean;
  autoRepair?: boolean;
  
  // V2 options
  strategy?: PromptingStrategy | PromptingStrategy[];
  enableContext?: boolean;
  contextWindowSize?: number;
  semanticSearch?: boolean;
  enableCoT?: boolean;
  enableToT?: boolean;
  selfConsistency?: boolean;
  consistencyRounds?: number;
  streaming?: boolean;
  trackQuality?: boolean;
  enableABTesting?: boolean;
  qualityThreshold?: number;
  adaptivePrompting?: boolean;
  
  // New unified options
  role?: string;
  examples?: any[];
  constraints?: string[];
  outputFormat?: 'json' | 'structured' | 'text';
}

export interface UnifiedResult {
  // Core results
  prompt: string;
  schema?: any;
  systemPrompt?: string;
  
  // LLM results
  response?: string;
  data?: any;
  success?: boolean;
  error?: string;
  attempts?: number;
  
  // Cost tracking
  cost?: {
    total: number;
    provider: string;
    model: string;
    tokens: { input: number; output: number; total: number };
  };
  
  // V2 results
  context?: any;
  reasoning?: {
    steps?: any[];
    tree?: any;
    consistency?: any;
  };
  streaming?: AsyncIterable<any>;
  quality?: {
    score: number;
    metrics: any;
    recommendations: string[];
  };
  metadata?: {
    strategy?: PromptingStrategy;
    tokensUsed?: number;
    processingTime?: number;
    contextRetrieved?: number;
    version: string;
  };
}

/**
 * Unified Jsonderulo Class
 * Modular architecture with feature flags for different capabilities
 */
export class UnifiedJsonderulo {
  private config: UnifiedConfig;
  private version = '3.0.0-unified';
  
  // Core components (always available)
  private schemaGenerator: SchemaGenerator;
  private promptEngine: PromptEngine;
  private validator: JsonValidator;
  
  // Optional components (feature-flagged)
  private contextManager?: ContextManager;
  private advancedPrompting?: AdvancedPrompting;
  private embeddingsManager?: EmbeddingsManager;
  private jsonStreaming?: JsonStreaming;
  private qualityFramework?: PromptQualityFramework;
  
  // Provider management
  private providers: Map<string, ProviderConfig> = new Map();
  private providerFallbackOrder: string[] = [];
  
  // Cost tracking
  private costHistory: any[] = [];
  
  constructor(config: UnifiedConfig = {}) {
    this.config = {
      enableBasicPrompting: true,
      enableTemplates: true,
      enableValidation: true,
      enableLLMIntegration: false,
      enableCostTracking: false,
      enableMultiProvider: false,
      enableAdvancedPrompting: false,
      enableContextManagement: false,
      enableStreaming: false,
      enableQualityFramework: false,
      enableABTesting: false,
      ...config
    };
    
    // Initialize core components
    this.schemaGenerator = new SchemaGenerator();
    this.promptEngine = new PromptEngine();
    this.validator = new JsonValidator();
    
    // Initialize optional components based on config
    this.initializeComponents();
    
    // Setup providers if LLM integration is enabled
    if (this.config.enableLLMIntegration && this.config.providers) {
      Object.entries(this.config.providers).forEach(([name, config]) => {
        this.addProvider(name, config);
      });
      
      if (this.config.fallbackOrder) {
        this.setProviderFallbackOrder(this.config.fallbackOrder);
      }
    }
  }
  
  private initializeComponents() {
    if (this.config.enableContextManagement) {
      this.contextManager = new ContextManager();
    }
    
    if (this.config.enableAdvancedPrompting) {
      this.advancedPrompting = new AdvancedPrompting();
    }
    
    if (this.config.enableContextManagement) {
      this.embeddingsManager = new EmbeddingsManager({
        provider: 'openai', // Default, can be configured
        model: 'text-embedding-3-small'
      });
    }
    
    if (this.config.enableStreaming) {
      this.jsonStreaming = new JsonStreaming();
    }
    
    if (this.config.enableQualityFramework) {
      this.qualityFramework = new PromptQualityFramework();
    }
  }
  
  // ===========================================
  // UNIFIED MAIN METHODS
  // ===========================================
  
  /**
   * Universal speak method - routes to appropriate implementation based on config
   */
  async speak(
    request: string,
    schemaDescription?: string,
    options: UnifiedOptions = {}
  ): Promise<UnifiedResult> {
    const startTime = Date.now();
    
    try {
      // Determine which implementation to use based on options and config
      if (options.streaming && this.config.enableStreaming) {
        return await this.speakStreaming(request, schemaDescription, options);
      } else if ((options.strategy || options.enableContext) && this.config.enableAdvancedPrompting) {
        return await this.speakAdvanced(request, schemaDescription, options);
      } else if (options.provider && this.config.enableLLMIntegration) {
        return await this.speakWithLLM(request, schemaDescription, options);
      } else {
        return await this.speakBasic(request, schemaDescription, options);
      }
    } catch (error) {
      return {
        prompt: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: Date.now() - startTime,
          version: this.version
        }
      };
    }
  }
  
  /**
   * Universal process method - complete workflow with LLM execution
   */
  async process(
    request: string,
    llmFunction: (prompt: string) => Promise<string>,
    schemaDescription?: string,
    options: UnifiedOptions = {}
  ): Promise<UnifiedResult> {
    const startTime = Date.now();
    const maxRetries = options.maxRetries || 3;
    let lastError: string = '';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Get the prompt first
        const promptResult = await this.speak(request, schemaDescription, options);
        if (!promptResult.success && promptResult.error) {
          lastError = promptResult.error;
          continue;
        }
        
        // Execute with LLM
        const response = await llmFunction(promptResult.prompt);
        
        // Validate if schema is available
        if (promptResult.schema) {
          const validationResult = this.validator.validate(response, promptResult.schema);
          
          if (validationResult.valid) {
            // Success path
            const result: UnifiedResult = {
              ...promptResult,
              response,
              data: JSON.parse(response),
              success: true,
              attempts: attempt,
              metadata: {
                ...promptResult.metadata,
                processingTime: Date.now() - startTime,
                version: this.version
              }
            };
            
            // Track quality if enabled
            if (this.config.enableQualityFramework && this.qualityFramework) {
              const quality = await this.qualityFramework.evaluateResponse(
                promptResult.prompt,
                response,
                { request, schemaDescription, options }
              );
              result.quality = quality;
            }
            
            return result;
          } else {
            // Try repair if enabled
            if (options.autoRepair) {
              const repairedJson = this.validator.repair(response);
              if (repairedJson) {
                const revalidation = this.validator.validate(repairedJson, promptResult.schema);
                if (revalidation.valid) {
                  return {
                    ...promptResult,
                    response: repairedJson,
                    data: JSON.parse(repairedJson),
                    success: true,
                    attempts: attempt,
                    metadata: {
                      ...promptResult.metadata,
                      processingTime: Date.now() - startTime,
                      version: this.version
                    }
                  };
                }
              }
            }
            
            lastError = `Validation failed: ${validationResult.errors.join(', ')}`;
          }
        } else {
          // No schema validation, return as-is
          return {
            ...promptResult,
            response,
            data: response,
            success: true,
            attempts: attempt,
            metadata: {
              ...promptResult.metadata,
              processingTime: Date.now() - startTime,
              version: this.version
            }
          };
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    return {
      prompt: '',
      success: false,
      error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`,
      attempts: maxRetries,
      metadata: {
        processingTime: Date.now() - startTime,
        version: this.version
      }
    };
  }
  
  // ===========================================
  // IMPLEMENTATION-SPECIFIC METHODS
  // ===========================================
  
  /**
   * Basic implementation (from original jsonderulo.ts)
   */
  private async speakBasic(
    request: string,
    schemaDescription?: string,
    options: UnifiedOptions = {}
  ): Promise<UnifiedResult> {
    const schema = schemaDescription 
      ? this.schemaGenerator.generateFromDescription(schemaDescription)
      : this.schemaGenerator.inferFromRequest(request);
    
    const prompt = this.promptEngine.transform(request, schema, {
      mode: options.mode || 'strict',
      includeExamples: options.includeExamples || false,
      examples: options.examples || [],
      constraints: options.constraints || []
    });
    
    const systemPrompt = this.promptEngine.getSystemPrompt(options.mode || 'strict');
    
    return {
      prompt,
      schema,
      systemPrompt,
      success: true,
      metadata: {
        version: this.version
      }
    };
  }
  
  /**
   * LLM-enhanced implementation (from enhancedJsonderulo.ts)
   */
  private async speakWithLLM(
    request: string,
    schemaDescription?: string,
    options: UnifiedOptions = {}
  ): Promise<UnifiedResult> {
    // Get basic prompt first
    const basicResult = await this.speakBasic(request, schemaDescription, options);
    
    // Add LLM-specific enhancements
    if (options.provider && this.providers.has(options.provider)) {
      const providerConfig = this.providers.get(options.provider)!;
      
      // Add provider-specific optimizations to prompt
      let enhancedPrompt = basicResult.prompt;
      
      if (options.costOptimized) {
        enhancedPrompt = this.optimizeForCost(enhancedPrompt, providerConfig);
      }
      
      return {
        ...basicResult,
        prompt: enhancedPrompt,
        metadata: {
          ...basicResult.metadata,
          provider: options.provider,
          model: options.model || providerConfig.model
        }
      };
    }
    
    return basicResult;
  }
  
  /**
   * Advanced implementation (from enhancedJsonderuloV2.ts)
   */
  private async speakAdvanced(
    request: string,
    schemaDescription?: string,
    options: UnifiedOptions = {}
  ): Promise<UnifiedResult> {
    if (!this.advancedPrompting) {
      throw new Error('Advanced prompting is not enabled. Set enableAdvancedPrompting: true in config.');
    }
    
    // Context retrieval if enabled
    let context: any = null;
    if (options.enableContext && this.contextManager && this.embeddingsManager) {
      const embedding = await this.embeddingsManager.generateEmbedding(request);
      const similarContext = await this.contextManager.findSimilarContext(
        embedding,
        options.contextWindowSize || 5
      );
      context = this.contextManager.buildContextWindow(similarContext, request);
    }
    
    // Strategy selection
    const strategies = Array.isArray(options.strategy) ? options.strategy : [options.strategy || 'chain-of-thought'];
    
    let enhancedPrompt: string;
    let reasoning: any = {};
    
    if (strategies.includes('chain-of-thought') || options.enableCoT) {
      const cotResult = await this.advancedPrompting.generateChainOfThought(request, {
        context,
        schema: schemaDescription
      });
      enhancedPrompt = cotResult.prompt;
      reasoning.steps = cotResult.steps;
    } else if (strategies.includes('tree-of-thoughts') || options.enableToT) {
      const totResult = await this.advancedPrompting.generateTreeOfThoughts(request, {
        context,
        schema: schemaDescription
      });
      enhancedPrompt = totResult.prompt;
      reasoning.tree = totResult.tree;
    } else {
      // Fallback to basic
      const basicResult = await this.speakBasic(request, schemaDescription, options);
      enhancedPrompt = basicResult.prompt;
    }
    
    // Self-consistency if enabled
    if (options.selfConsistency && this.advancedPrompting) {
      const consistencyResult = await this.advancedPrompting.generateSelfConsistency(
        request,
        options.consistencyRounds || 3,
        { context, schema: schemaDescription }
      );
      reasoning.consistency = consistencyResult;
    }
    
    const schema = schemaDescription 
      ? this.schemaGenerator.generateFromDescription(schemaDescription)
      : this.schemaGenerator.inferFromRequest(request);
    
    return {
      prompt: enhancedPrompt,
      schema,
      systemPrompt: this.promptEngine.getSystemPrompt(options.mode || 'strict'),
      context,
      reasoning,
      success: true,
      metadata: {
        strategy: strategies[0],
        contextRetrieved: context ? Object.keys(context).length : 0,
        version: this.version
      }
    };
  }
  
  /**
   * Streaming implementation
   */
  private async speakStreaming(
    request: string,
    schemaDescription?: string,
    options: UnifiedOptions = {}
  ): Promise<UnifiedResult> {
    if (!this.jsonStreaming) {
      throw new Error('Streaming is not enabled. Set enableStreaming: true in config.');
    }
    
    const basicResult = await this.speakBasic(request, schemaDescription, options);
    
    // Create streaming generator
    const streamingGenerator = this.jsonStreaming.createStreamingValidator(basicResult.schema);
    
    return {
      ...basicResult,
      streaming: streamingGenerator,
      metadata: {
        ...basicResult.metadata,
        streamingEnabled: true
      }
    };
  }
  
  // ===========================================
  // PROVIDER MANAGEMENT
  // ===========================================
  
  addProvider(name: string, config: ProviderConfig) {
    this.providers.set(name, config);
  }
  
  removeProvider(name: string) {
    this.providers.delete(name);
  }
  
  setProviderFallbackOrder(order: string[]) {
    this.providerFallbackOrder = order;
  }
  
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
  
  // ===========================================
  // TEMPLATE MANAGEMENT
  // ===========================================
  
  useTemplate(templateName: string, variables: Record<string, any>, options: UnifiedOptions = {}): Promise<UnifiedResult> {
    const templateResult = this.promptEngine.useTemplate(templateName, variables);
    return this.speak(templateResult.prompt, templateResult.schemaDescription, options);
  }
  
  getAvailableTemplates(): string[] {
    return this.promptEngine.getAvailableTemplates();
  }
  
  // ===========================================
  // VALIDATION & REPAIR
  // ===========================================
  
  validate(response: string, schema: any) {
    return this.validator.validate(response, schema);
  }
  
  repair(invalidJson: string): string | null {
    return this.validator.repair(invalidJson);
  }
  
  generateRecoveryPrompt(originalPrompt: string, invalidResponse: string, validationResult: any, schema: any): string {
    return this.validator.generateRecoveryPrompt(originalPrompt, invalidResponse, validationResult, schema);
  }
  
  // ===========================================
  // COST TRACKING & ANALYTICS
  // ===========================================
  
  getCostAnalytics(hours: number = 24) {
    if (!this.config.enableCostTracking) {
      return null;
    }
    
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    const recentCosts = this.costHistory.filter(cost => cost.timestamp > cutoff);
    
    return {
      totalCost: recentCosts.reduce((sum, cost) => sum + cost.amount, 0),
      requestCount: recentCosts.length,
      averageCost: recentCosts.length > 0 ? recentCosts.reduce((sum, cost) => sum + cost.amount, 0) / recentCosts.length : 0,
      breakdown: this.groupCostsByProvider(recentCosts),
      trends: this.calculateCostTrends(recentCosts)
    };
  }
  
  private optimizeForCost(prompt: string, providerConfig: ProviderConfig): string {
    // Cost optimization logic
    return prompt; // Simplified for now
  }
  
  private groupCostsByProvider(costs: any[]) {
    return costs.reduce((acc, cost) => {
      if (!acc[cost.provider]) {
        acc[cost.provider] = { total: 0, count: 0 };
      }
      acc[cost.provider].total += cost.amount;
      acc[cost.provider].count += 1;
      return acc;
    }, {});
  }
  
  private calculateCostTrends(costs: any[]) {
    // Trend calculation logic
    return { trend: 'stable', change: 0 };
  }
  
  // ===========================================
  // CONFIGURATION & UTILITIES
  // ===========================================
  
  updateConfig(newConfig: Partial<UnifiedConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.initializeComponents(); // Reinitialize with new config
  }
  
  getConfig(): UnifiedConfig {
    return { ...this.config };
  }
  
  exportConfig() {
    return {
      version: this.version,
      config: this.config,
      providers: Array.from(this.providers.keys()),
      templates: this.getAvailableTemplates(),
      capabilities: this.getCapabilities()
    };
  }
  
  getCapabilities() {
    return {
      basicPrompting: this.config.enableBasicPrompting,
      templates: this.config.enableTemplates,
      validation: this.config.enableValidation,
      llmIntegration: this.config.enableLLMIntegration,
      costTracking: this.config.enableCostTracking,
      multiProvider: this.config.enableMultiProvider,
      advancedPrompting: this.config.enableAdvancedPrompting,
      contextManagement: this.config.enableContextManagement,
      streaming: this.config.enableStreaming,
      qualityFramework: this.config.enableQualityFramework,
      abTesting: this.config.enableABTesting
    };
  }
  
  getVersion(): string {
    return this.version;
  }
}

// Convenience factory functions for common configurations
export function createBasicJsonderulo(): UnifiedJsonderulo {
  return new UnifiedJsonderulo({
    enableBasicPrompting: true,
    enableTemplates: true,
    enableValidation: true
  });
}

export function createEnhancedJsonderulo(providers: Record<string, ProviderConfig>): UnifiedJsonderulo {
  return new UnifiedJsonderulo({
    enableBasicPrompting: true,
    enableTemplates: true,
    enableValidation: true,
    enableLLMIntegration: true,
    enableCostTracking: true,
    enableMultiProvider: true,
    providers
  });
}

export function createAdvancedJsonderulo(providers: Record<string, ProviderConfig>): UnifiedJsonderulo {
  return new UnifiedJsonderulo({
    enableBasicPrompting: true,
    enableTemplates: true,
    enableValidation: true,
    enableLLMIntegration: true,
    enableCostTracking: true,
    enableMultiProvider: true,
    enableAdvancedPrompting: true,
    enableContextManagement: true,
    enableStreaming: true,
    enableQualityFramework: true,
    enableABTesting: true,
    providers
  });
}

export default UnifiedJsonderulo;