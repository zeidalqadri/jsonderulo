import { SchemaGenerator, GeneratedSchema } from './schemaGenerator.js';
import { PromptEngine, PromptOptions, PromptMode } from './promptEngine.js';
import { JsonValidator, ValidationResult } from './validator.js';
import { ProviderRegistry, ProviderStats } from '../providers/registry.js';
import { LLMRequest, LLMResponse, CostMetrics, ProviderConfig } from '../providers/base.js';

export interface EnhancedJsonDeruloOptions {
  mode?: PromptMode;
  temperature?: number;
  includeExamples?: boolean;
  autoRepair?: boolean;
  maxRetries?: number;
  provider?: string;
  model?: string;
  maxTokens?: number;
  costOptimized?: boolean;
}

export interface EnhancedJsonDeruloResult {
  prompt: string;
  schema: GeneratedSchema | any;
  systemPrompt?: string;
  validationResult?: ValidationResult;
  repairedJson?: string;
  llmResponse?: LLMResponse;
  costMetrics?: CostMetrics;
  providerUsed?: string;
}

export interface CostAnalytics {
  totalCost: number;
  costByProvider: Record<string, number>;
  costByModel: Record<string, number>;
  averageCostPerRequest: number;
  costTrend: { date: Date; cost: number }[];
  suggestions: string[];
}

export class EnhancedJsonderulo {
  private schemaGenerator: SchemaGenerator;
  private promptEngine: PromptEngine;
  private validator: JsonValidator;
  private providerRegistry: ProviderRegistry;

  constructor() {
    this.schemaGenerator = new SchemaGenerator();
    this.promptEngine = new PromptEngine();
    this.validator = new JsonValidator();
    this.providerRegistry = new ProviderRegistry();
  }

  /**
   * Configure LLM providers
   */
  addProvider(providerType: string, config: ProviderConfig): void {
    const provider = this.providerRegistry.createProvider(providerType, config);
    this.providerRegistry.addProvider(providerType, provider);
  }

  /**
   * Transform a natural language request into a JSON-structured prompt with LLM generation
   */
  async speakWithLLM(
    request: string,
    schemaDescription?: string,
    options: EnhancedJsonDeruloOptions = {}
  ): Promise<EnhancedJsonDeruloResult> {
    // Generate schema from description or infer from request
    const schema = schemaDescription
      ? this.schemaGenerator.generateFromDescription(schemaDescription)
      : this.inferSchemaFromRequest(request);

    // Transform the prompt
    const promptOptions: PromptOptions = {
      mode: options.mode || 'strict',
      temperature: options.temperature,
      includeExamples: options.includeExamples,
      errorRecovery: options.maxRetries !== undefined && options.maxRetries > 0,
    };

    const transformedPrompt = this.promptEngine.transformPrompt(request, schema, promptOptions);

    const systemPrompt = this.getSystemPrompt(promptOptions.mode);

    // Prepare LLM request
    const llmRequest: LLMRequest = {
      prompt: transformedPrompt,
      systemPrompt,
      temperature: options.temperature || 0,
      maxTokens: options.maxTokens || 4096,
      jsonMode: true,
    };

    try {
      // Generate completion using provider registry
      const llmResponse = await this.providerRegistry.generateCompletion(
        llmRequest,
        options.provider
      );

      let content = llmResponse.content;
      let repairedJson: string | undefined;

      // Auto-repair if enabled
      if (options.autoRepair) {
        const repaired = this.validator.repairJson(content);
        if (repaired && repaired !== content) {
          repairedJson = repaired;
          content = repaired;
        }
      }

      // Validate the response
      const validationResult = this.validator.validate(content, schema);

      return {
        prompt: transformedPrompt,
        schema,
        systemPrompt,
        validationResult,
        repairedJson,
        llmResponse,
        costMetrics: llmResponse.costMetrics,
        providerUsed: llmResponse.provider,
      };
    } catch (error) {
      throw new Error(
        `LLM generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Original speak method for backward compatibility (no LLM generation)
   */
  speak(
    request: string,
    schemaDescription?: string,
    options: EnhancedJsonDeruloOptions = {}
  ): EnhancedJsonDeruloResult {
    const schema = schemaDescription
      ? this.schemaGenerator.generateFromDescription(schemaDescription)
      : this.inferSchemaFromRequest(request);

    const promptOptions: PromptOptions = {
      mode: options.mode || 'strict',
      temperature: options.temperature,
      includeExamples: options.includeExamples,
      errorRecovery: options.maxRetries !== undefined && options.maxRetries > 0,
    };

    const transformedPrompt = this.promptEngine.transformPrompt(request, schema, promptOptions);

    return {
      prompt: transformedPrompt,
      schema,
      systemPrompt: this.getSystemPrompt(promptOptions.mode),
    };
  }

  /**
   * Complete workflow with LLM generation, validation, and optional retry
   */
  async processWithLLM(
    request: string,
    schemaDescription?: string,
    options: EnhancedJsonDeruloOptions = {}
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    attempts?: number;
    totalCost?: number;
    providersUsed?: string[];
  }> {
    const maxRetries = options.maxRetries || 1;
    let attempts = 0;
    let totalCost = 0;
    const providersUsed: string[] = [];

    while (attempts < maxRetries) {
      attempts++;

      try {
        const result = await this.speakWithLLM(request, schemaDescription, options);

        if (result.costMetrics) {
          totalCost += result.costMetrics.totalCost;
        }

        if (result.providerUsed && !providersUsed.includes(result.providerUsed)) {
          providersUsed.push(result.providerUsed);
        }

        if (result.validationResult?.valid) {
          const data =
            typeof result.llmResponse?.content === 'string'
              ? JSON.parse(result.llmResponse.content)
              : result.llmResponse?.content;

          return {
            success: true,
            data,
            attempts,
            totalCost,
            providersUsed,
          };
        }

        // If validation failed and we have retries left, use recovery prompt
        if (attempts < maxRetries && result.llmResponse) {
          const recoveryPrompt = this.validator.generateRecoveryPrompt(
            request,
            result.llmResponse.content,
            result.validationResult!,
            result.schema
          );

          const recoveryOptions = { ...options, maxRetries: 1 };
          const recoveryResult = await this.speakWithLLM(
            recoveryPrompt,
            undefined,
            recoveryOptions
          );

          if (recoveryResult.costMetrics) {
            totalCost += recoveryResult.costMetrics.totalCost;
          }

          if (recoveryResult.validationResult?.valid && recoveryResult.llmResponse) {
            return {
              success: true,
              data: JSON.parse(recoveryResult.llmResponse.content),
              attempts: attempts + 1,
              totalCost,
              providersUsed,
            };
          }
        }
      } catch (error) {
        if (attempts >= maxRetries) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            attempts,
            totalCost,
            providersUsed,
          };
        }
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
      attempts,
      totalCost,
      providersUsed,
    };
  }

  /**
   * Cost analytics and optimization insights
   */
  getCostAnalytics(hours?: number): CostAnalytics {
    const costHistory = this.providerRegistry.getCostHistory(hours);
    const totalCost = costHistory.reduce((sum, cost) => sum + cost.totalCost, 0);

    // Group costs by provider and model
    const costByProvider: Record<string, number> = {};
    const costByModel: Record<string, number> = {};

    costHistory.forEach(cost => {
      costByProvider[cost.provider] = (costByProvider[cost.provider] || 0) + cost.totalCost;
      costByModel[cost.model] = (costByModel[cost.model] || 0) + cost.totalCost;
    });

    // Calculate average cost per request
    const averageCostPerRequest = costHistory.length > 0 ? totalCost / costHistory.length : 0;

    // Generate cost trend data (daily buckets)
    const costTrend = this.generateCostTrend(costHistory);

    // Generate optimization suggestions
    const suggestions = this.generateCostSuggestions(
      costByProvider,
      costByModel,
      averageCostPerRequest
    );

    return {
      totalCost,
      costByProvider,
      costByModel,
      averageCostPerRequest,
      costTrend,
      suggestions,
    };
  }

  private generateCostTrend(costHistory: CostMetrics[]): { date: Date; cost: number }[] {
    const dailyCosts: Record<string, number> = {};

    costHistory.forEach(cost => {
      const date = cost.timestamp.toISOString().split('T')[0];
      dailyCosts[date] = (dailyCosts[date] || 0) + cost.totalCost;
    });

    return Object.entries(dailyCosts)
      .map(([date, cost]) => ({ date: new Date(date), cost }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private generateCostSuggestions(
    costByProvider: Record<string, number>,
    costByModel: Record<string, number>,
    averageCost: number
  ): string[] {
    const suggestions: string[] = [];

    // Provider cost comparison
    const providers = Object.entries(costByProvider).sort((a, b) => b[1] - a[1]);
    if (providers.length > 1) {
      const mostExpensive = providers[0];
      const leastExpensive = providers[providers.length - 1];
      if (mostExpensive[1] > leastExpensive[1] * 2) {
        suggestions.push(
          `Consider using ${leastExpensive[0]} more often - it's ${((mostExpensive[1] / leastExpensive[1]) * 100 - 100).toFixed(0)}% cheaper than ${mostExpensive[0]}`
        );
      }
    }

    // Model suggestions based on cost
    const expensiveModels = Object.entries(costByModel)
      .filter(([_, cost]) => cost > averageCost * 1.5)
      .map(([model]) => model);

    if (expensiveModels.length > 0) {
      suggestions.push(
        `Consider using smaller models for simple tasks. Models like ${expensiveModels.join(', ')} are driving up costs`
      );
    }

    // Usage pattern suggestions
    if (averageCost > 0.01) {
      suggestions.push('Consider implementing response caching for repeated queries');
    }

    if (suggestions.length === 0) {
      suggestions.push('Your usage patterns look cost-efficient!');
    }

    return suggestions;
  }

  /**
   * Get provider statistics
   */
  getProviderStats(): Map<string, ProviderStats> {
    return this.providerRegistry.getStats();
  }

  /**
   * Configure provider fallback order
   */
  setProviderFallbackOrder(order: string[]): void {
    this.providerRegistry.setFallbackOrder(order);
  }

  // Existing methods for backward compatibility
  useTemplate(
    templateName: string,
    variables: Record<string, string>,
    options?: EnhancedJsonDeruloOptions
  ): EnhancedJsonDeruloResult {
    const promptOptions = options
      ? {
          mode: options.mode || 'strict',
          temperature: options.temperature,
          includeExamples: options.includeExamples,
        }
      : undefined;

    const prompt = this.promptEngine.applyTemplate(templateName, variables, promptOptions);

    const schema = variables.schema ? JSON.parse(variables.schema) : {};

    return {
      prompt,
      schema,
      systemPrompt: promptOptions ? this.getSystemPrompt(promptOptions.mode) : undefined,
    };
  }

  validate(response: any, schema: GeneratedSchema | any): ValidationResult {
    return this.validator.validate(response, schema);
  }

  repair(invalidJson: string): string | null {
    return this.validator.repairJson(invalidJson);
  }

  generateRecoveryPrompt(
    originalPrompt: string,
    invalidResponse: string,
    validationResult: ValidationResult,
    schema: any
  ): string {
    return this.validator.generateRecoveryPrompt(
      originalPrompt,
      invalidResponse,
      validationResult,
      schema
    );
  }

  private inferSchemaFromRequest(request: string): GeneratedSchema {
    return this.schemaGenerator.generateFromDescription(request);
  }

  private getSystemPrompt(mode: PromptMode): string {
    const prompts = {
      strict:
        'You are a JSON-only response system. Never include explanatory text, markdown formatting, or code blocks. Output only valid JSON.',
      explanatory:
        'You are a JSON generator that includes explanation fields. For every decision or classification, include an "explanation" or "reasoning" field to aid debugging and transparency.',
      streaming:
        'You are a streaming JSON generator. Output JSON in a streaming-friendly format, either as JSON Lines or as a single valid JSON object that can be parsed incrementally.',
      validated:
        'You are a schema-validated JSON generator. Always validate your output against the provided schema before responding. If validation would fail, fix the issues before returning.',
    };
    return prompts[mode];
  }

  getAvailableTemplates(): string[] {
    return ['basic_json', 'extraction', 'classification', 'analysis'];
  }

  exportConfig(): {
    templates: string[];
    modes: PromptMode[];
    providers: string[];
    version: string;
  } {
    return {
      templates: this.getAvailableTemplates(),
      modes: ['strict', 'explanatory', 'streaming', 'validated'],
      providers: this.providerRegistry.getAvailableProviders(),
      version: '2.0.0',
    };
  }
}
