import { BaseLLMProvider, ProviderConfig, LLMRequest, LLMResponse, CostMetrics } from './base.js';
import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';

export interface ProviderStats {
  totalRequests: number;
  totalCost: number;
  averageLatency: number;
  successRate: number;
  lastUsed: Date;
}

export interface ProviderSelection {
  provider: string;
  model?: string;
  reason: string;
}

export class ProviderRegistry {
  private providers: Map<string, BaseLLMProvider> = new Map();
  private stats: Map<string, ProviderStats> = new Map();
  private costHistory: CostMetrics[] = [];
  private fallbackOrder: string[] = ['openai', 'anthropic'];

  constructor() {
    this.initializeStats();
  }

  addProvider(name: string, provider: BaseLLMProvider): void {
    this.providers.set(name, provider);
    if (!this.stats.has(name)) {
      this.stats.set(name, {
        totalRequests: 0,
        totalCost: 0,
        averageLatency: 0,
        successRate: 1.0,
        lastUsed: new Date(),
      });
    }
  }

  createProvider(providerType: string, config: ProviderConfig): BaseLLMProvider {
    switch (providerType.toLowerCase()) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }
  }

  async generateCompletion(request: LLMRequest, providerPreference?: string): Promise<LLMResponse> {
    const selection = await this.selectProvider(request, providerPreference);
    const provider = this.providers.get(selection.provider);

    if (!provider) {
      throw new Error(`Provider ${selection.provider} not found`);
    }

    const startTime = Date.now();

    try {
      const response = await provider.generateCompletion(request);
      const latency = Date.now() - startTime;

      // Update stats
      this.updateStats(selection.provider, response.costMetrics, latency, true);
      this.costHistory.push(response.costMetrics);

      return response;
    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateStats(selection.provider, null, latency, false);

      // Try fallback if this wasn't already a fallback attempt
      if (!providerPreference) {
        return this.tryFallback(request, selection.provider);
      }

      throw error;
    }
  }

  private async tryFallback(request: LLMRequest, failedProvider: string): Promise<LLMResponse> {
    for (const providerName of this.fallbackOrder) {
      if (providerName === failedProvider) continue;

      const provider = this.providers.get(providerName);
      if (!provider) continue;

      try {
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) continue;

        console.warn(`Falling back to ${providerName} after ${failedProvider} failed`);
        return this.generateCompletion(request, providerName);
      } catch (error) {
        console.warn(`Fallback provider ${providerName} also failed:`, error);
        continue;
      }
    }

    throw new Error('All providers failed');
  }

  private async selectProvider(
    request: LLMRequest,
    preference?: string
  ): Promise<ProviderSelection> {
    // If user specified a preference, try that first
    if (preference && this.providers.has(preference)) {
      const provider = this.providers.get(preference)!;
      const isAvailable = await provider.isAvailable();
      if (isAvailable) {
        return {
          provider: preference,
          reason: 'User preference',
        };
      }
    }

    // Cost-based selection for non-preference requests
    return this.selectOptimalProvider(request);
  }

  private async selectOptimalProvider(request: LLMRequest): Promise<ProviderSelection> {
    const candidates: { provider: string; score: number; cost: number }[] = [];

    for (const [name, provider] of this.providers) {
      try {
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) continue;

        const stats = this.stats.get(name)!;
        const estimatedCost = this.estimateCost(name, request);

        // Calculate selection score (lower is better)
        // Factors: cost (40%), success rate (30%), latency (20%), recency (10%)
        const costScore = estimatedCost * 0.4;
        const reliabilityScore = (1 - stats.successRate) * 0.3;
        const latencyScore = (stats.averageLatency / 1000) * 0.2;
        const recencyScore = ((Date.now() - stats.lastUsed.getTime()) / (1000 * 60 * 60)) * 0.1; // Hours since last use

        const totalScore = costScore + reliabilityScore + latencyScore + recencyScore;

        candidates.push({
          provider: name,
          score: totalScore,
          cost: estimatedCost,
        });
      } catch (error) {
        console.warn(`Error evaluating provider ${name}:`, error);
      }
    }

    if (candidates.length === 0) {
      throw new Error('No available providers');
    }

    // Sort by score (lower is better) and select the best
    candidates.sort((a, b) => a.score - b.score);
    const selected = candidates[0];

    return {
      provider: selected.provider,
      reason: `Optimal selection (cost: $${selected.cost.toFixed(6)})`,
    };
  }

  private estimateCost(providerName: string, request: LLMRequest): number {
    const provider = this.providers.get(providerName);
    if (!provider) return 0;

    // Rough estimation: 1 token ≈ 4 characters for input, adjust for completion
    const estimatedInputTokens = Math.ceil(request.prompt.length / 4);
    const estimatedOutputTokens = request.maxTokens || 1000;

    // Use the provider's pricing to estimate cost
    const providerInstance = provider as any;
    const pricing = providerInstance.modelPricing?.default || { input: 1.0, output: 3.0 };

    return (
      (estimatedInputTokens / 1000000) * pricing.input +
      (estimatedOutputTokens / 1000000) * pricing.output
    );
  }

  private updateStats(
    providerName: string,
    costMetrics: CostMetrics | null,
    latency: number,
    success: boolean
  ): void {
    const stats = this.stats.get(providerName);
    if (!stats) return;

    stats.totalRequests++;
    stats.lastUsed = new Date();

    if (costMetrics) {
      stats.totalCost += costMetrics.totalCost;
    }

    // Update running average for latency
    stats.averageLatency =
      (stats.averageLatency * (stats.totalRequests - 1) + latency) / stats.totalRequests;

    // Update success rate with exponential smoothing
    const alpha = 0.1; // Smoothing factor
    stats.successRate = stats.successRate * (1 - alpha) + (success ? 1 : 0) * alpha;
  }

  private initializeStats(): void {
    const defaultStats: ProviderStats = {
      totalRequests: 0,
      totalCost: 0,
      averageLatency: 1000,
      successRate: 1.0,
      lastUsed: new Date(),
    };

    this.stats.set('openai', { ...defaultStats });
    this.stats.set('anthropic', { ...defaultStats });
  }

  getStats(): Map<string, ProviderStats> {
    return new Map(this.stats);
  }

  getCostHistory(hours?: number): CostMetrics[] {
    if (!hours) return [...this.costHistory];

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.costHistory.filter(cost => cost.timestamp >= cutoff);
  }

  getTotalCost(hours?: number): number {
    const relevantCosts = this.getCostHistory(hours);
    return relevantCosts.reduce((sum, cost) => sum + cost.totalCost, 0);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  setFallbackOrder(order: string[]): void {
    this.fallbackOrder = [...order];
  }
}
