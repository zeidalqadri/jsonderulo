/**
 * LLMExecutor - Smart LLM execution with provider selection and fallbacks
 *
 * Manages LLM provider selection, execution strategies, streaming,
 * and fallback mechanisms for robust pipeline execution.
 */

import { EventEmitter } from 'events';
import { ProviderRegistry } from '../providers/registry.js';
import { LLMRequest, LLMResponse } from '../providers/base.js';
import { ExecutionHints, PipelineEvent } from './types.js';

export interface ExecutorConfig {
  registry?: ProviderRegistry;
  maxRetries?: number;
  timeout?: number;
  enableStreaming?: boolean;
}

export interface Provider {
  name: string;
  priority: number;
}

export interface BatchRequest {
  id: string;
  prompt: string;
  metadata?: any;
}

export interface BatchResponse {
  results: Array<{
    id: string;
    response?: LLMResponse;
    error?: Error;
  }>;
  successCount: number;
  failureCount: number;
  totalCost: number;
}

export interface StreamChunk {
  content: string;
  isComplete: boolean;
  metadata?: any;
}

export type ChunkHandler = (chunk: StreamChunk) => void;

export class LLMExecutor extends EventEmitter {
  private registry: ProviderRegistry;
  private config: ExecutorConfig;

  constructor(config: ExecutorConfig = {}) {
    super();
    this.config = {
      maxRetries: 3,
      timeout: 30000,
      enableStreaming: true,
      ...config,
    };
    this.registry = config.registry || new ProviderRegistry();
  }

  async execute(structuredPrompt: string, hints: ExecutionHints): Promise<LLMResponse> {
    const startTime = Date.now();

    this.emit('execution-started', {
      type: 'processing-started',
      payload: { structuredPrompt, hints },
      executionId: this.generateExecutionId(),
      timestamp: new Date(),
    } as PipelineEvent);

    try {
      const request: LLMRequest = {
        prompt: structuredPrompt,
        temperature: hints.suggestedTemperature,
        maxTokens: Math.min(hints.expectedTokens * 1.2, 4096),
        jsonMode: true,
      };

      // Use registry to handle provider selection and execution
      const response = await this.registry.generateCompletion(request, hints.recommendedProvider);

      const executionTime = Date.now() - startTime;

      this.emit('execution-completed', {
        type: 'output-ready',
        payload: { response, executionTime },
        executionId: this.generateExecutionId(),
        timestamp: new Date(),
      } as PipelineEvent);

      return response;
    } catch (error) {
      this.emit('execution-failed', {
        type: 'error',
        payload: { error },
        executionId: this.generateExecutionId(),
        timestamp: new Date(),
        error: {
          code: 'EXECUTION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      } as PipelineEvent);

      throw error;
    }
  }

  async *executeStream(
    prompt: string,
    onChunk: ChunkHandler
  ): AsyncGenerator<string, void, unknown> {
    if (!this.config.enableStreaming) {
      throw new Error('Streaming is disabled in configuration');
    }

    // Use registry to generate completion
    const response = await this.registry.generateCompletion({
      prompt,
      jsonMode: true,
    });

    // Simulate streaming by chunking the response
    const content = response.content;
    const chunkSize = 50;

    for (let i = 0; i < content.length; i += chunkSize) {
      const chunk = content.slice(i, i + chunkSize);

      onChunk({
        content: chunk,
        isComplete: i + chunkSize >= content.length,
      });

      yield chunk;

      // Simulate streaming delay
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  async executeBatch(prompts: BatchRequest[]): Promise<BatchResponse> {
    const results: BatchResponse['results'] = [];
    let totalCost = 0;
    let successCount = 0;
    let failureCount = 0;

    // Execute in parallel with concurrency limit
    const concurrencyLimit = 5;
    const batches = [];

    for (let i = 0; i < prompts.length; i += concurrencyLimit) {
      batches.push(prompts.slice(i, i + concurrencyLimit));
    }

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(async request => {
          try {
            const response = await this.registry.generateCompletion({
              prompt: request.prompt,
              jsonMode: true,
            });

            successCount++;
            totalCost += response.costMetrics.totalCost;

            return {
              id: request.id,
              response,
            };
          } catch (error) {
            failureCount++;
            return {
              id: request.id,
              error: error instanceof Error ? error : new Error('Unknown error'),
            };
          }
        })
      );

      results.push(
        ...batchResults.map((result, idx) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            return {
              id: batch[idx].id,
              error: new Error(result.reason),
            };
          }
        })
      );
    }

    return {
      results,
      successCount,
      failureCount,
      totalCost,
    };
  }

  async executeWithFallback(prompt: string, providers: Provider[]): Promise<LLMResponse> {
    const errors: Array<{ provider: string; error: Error }> = [];

    for (const providerConfig of providers) {
      try {
        const response = await this.registry.generateCompletion(
          {
            prompt,
            jsonMode: true,
          },
          providerConfig.name
        );

        return response;
      } catch (error) {
        errors.push({
          provider: providerConfig.name,
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
      }
    }

    // All providers failed
    throw new Error(
      `All providers failed. Errors: ${errors
        .map(e => `${e.provider}: ${e.error.message}`)
        .join(', ')}`
    );
  }

  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Registry management
  addProvider(name: string, config: any): void {
    const provider = this.registry.createProvider(name, config);
    this.registry.addProvider(name, provider);
  }

  getCostHistory(hours?: number) {
    return this.registry.getCostHistory(hours);
  }
}
