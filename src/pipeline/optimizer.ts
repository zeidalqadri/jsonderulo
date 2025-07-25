/**
 * Pipeline Optimizer
 *
 * Optimizes jsonderulo configuration based on pipeline context
 * to achieve the best balance of quality, speed, and cost.
 */

import { PipelineInput, ExecutionHints } from './types.js';
import { SchemaComplexity } from './schemaComplexity.js';

interface OptimizationContext {
  input: PipelineInput;
  schema: any;
  complexity: SchemaComplexity;
  taskType: string;
}

interface ProviderProfile {
  name: string;
  models: ModelProfile[];
  strengths: string[];
  costMultiplier: number;
  speedRating: number; // 1-10, higher is faster
  qualityRating: number; // 1-10, higher is better
}

interface ModelProfile {
  name: string;
  costPer1kTokens: number;
  maxTokens: number;
  bestFor: string[];
  temperature: {
    min: number;
    max: number;
    optimal: number;
  };
}

export class PipelineOptimizer {
  private providerProfiles: Map<string, ProviderProfile>;

  constructor() {
    this.providerProfiles = this.initializeProviderProfiles();
  }

  /**
   * Generate execution hints based on context
   */
  generateExecutionHints(context: OptimizationContext): ExecutionHints {
    const { provider, model } = this.selectOptimalProvider(context);
    const temperature = this.getOptimalTemperature(context.input);
    const tokenEstimate = this.estimateTokenUsage(context);
    const cost = this.estimateCost(provider, model, tokenEstimate);

    return {
      recommendedProvider: provider,
      recommendedModel: model,
      estimatedCost: cost,
      expectedTokens: tokenEstimate,
      suggestedTemperature: temperature,
      enableStreaming: this.shouldEnableStreaming(context),
    };
  }

  /**
   * Get optimal temperature based on task
   */
  getOptimalTemperature(input: PipelineInput): number {
    const outputType = input.context.expectedOutputType;
    const qualityPref = input.context.pipelineConfig?.qualityPreference ?? 0.5;

    // Base temperatures for different tasks
    const baseTemperatures: Record<string, number> = {
      extraction: 0,
      classification: 0,
      validation: 0,
      analysis: 0.2,
      generation: 0.3,
      'structured-report': 0.1,
      'action-items': 0,
    };

    let temperature = baseTemperatures[outputType] ?? 0.1;

    // Adjust based on quality preference
    if (qualityPref < 0.3) {
      // Speed preferred - slightly higher temperature for faster generation
      temperature += 0.1;
    } else if (qualityPref > 0.7) {
      // Quality preferred - lower temperature for consistency
      temperature = Math.max(0, temperature - 0.1);
    }

    return Math.min(0.5, temperature); // Cap at 0.5 for structured outputs
  }

  /**
   * Select optimal provider and model
   */
  private selectOptimalProvider(context: OptimizationContext): {
    provider: string;
    model: string;
  } {
    const { input, complexity, taskType } = context;
    const config = input.context.pipelineConfig;

    // Get quality vs speed preference
    const qualityPref = config?.qualityPreference ?? 0.5;
    const maxCost = config?.maxCost ?? Infinity;
    const targetLatency = config?.targetLatency ?? 10000; // 10s default

    // Score each provider/model combination
    const candidates = this.getAllCandidates();
    const scored = candidates.map(candidate => ({
      ...candidate,
      score: this.scoreCandidate(candidate, {
        complexity,
        taskType,
        qualityPref,
        maxCost,
        targetLatency,
      }),
    }));

    // Sort by score and pick the best
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    return {
      provider: best.provider,
      model: best.model,
    };
  }

  /**
   * Get all provider/model candidates
   */
  private getAllCandidates(): Array<{
    provider: string;
    model: string;
    profile: ProviderProfile;
    modelProfile: ModelProfile;
  }> {
    const candidates: any[] = [];

    this.providerProfiles.forEach((profile, provider) => {
      profile.models.forEach(model => {
        candidates.push({
          provider,
          model: model.name,
          profile,
          modelProfile: model,
        });
      });
    });

    return candidates;
  }

  /**
   * Score a provider/model candidate
   */
  private scoreCandidate(
    candidate: any,
    context: {
      complexity: SchemaComplexity;
      taskType: string;
      qualityPref: number;
      maxCost: number;
      targetLatency: number;
    }
  ): number {
    const { profile, modelProfile } = candidate;
    let score = 50; // Base score

    // Quality score (0-30 points)
    const qualityScore = profile.qualityRating * 3;
    score += qualityScore * context.qualityPref;

    // Speed score (0-30 points)
    const speedScore = profile.speedRating * 3;
    score += speedScore * (1 - context.qualityPref);

    // Task fit score (0-20 points)
    if (modelProfile.bestFor.includes(context.taskType)) {
      score += 20;
    } else if (modelProfile.bestFor.includes('general')) {
      score += 10;
    }

    // Complexity handling (0-10 points)
    if (context.complexity === 'complex' && profile.qualityRating >= 8) {
      score += 10;
    } else if (context.complexity === 'simple' && profile.speedRating >= 8) {
      score += 10;
    } else {
      score += 5;
    }

    // Cost penalty
    const estimatedCost = modelProfile.costPer1kTokens * 2; // Rough estimate
    if (estimatedCost > context.maxCost) {
      score -= 50; // Heavy penalty for exceeding budget
    } else {
      // Slight penalty based on cost
      score -= (estimatedCost / context.maxCost) * 10;
    }

    return score;
  }

  /**
   * Estimate token usage
   */
  private estimateTokenUsage(context: OptimizationContext): number {
    const { input, schema, complexity } = context;

    // Base tokens for prompt structure
    let tokens = 200;

    // Add tokens for the query
    tokens += Math.ceil(input.query.length / 4);

    // Add tokens based on schema complexity
    const complexityMultipliers = {
      simple: 1.2,
      medium: 1.5,
      complex: 2.0,
    };
    tokens *= complexityMultipliers[complexity];

    // Add tokens for examples if included
    if (input.context.pipelineConfig?.debugMode) {
      tokens += 500; // Rough estimate for examples
    }

    // Add buffer for response
    tokens += this.estimateResponseTokens(schema);

    return Math.ceil(tokens);
  }

  /**
   * Estimate response tokens based on schema
   */
  private estimateResponseTokens(schema: any): number {
    let tokens = 0;

    if (schema.type === 'object' && schema.properties) {
      // Estimate based on number of properties and their types
      const propCount = Object.keys(schema.properties).length;
      tokens += propCount * 20; // Average tokens per field

      // Add more for complex types
      Object.values(schema.properties).forEach((prop: any) => {
        if (prop.type === 'array') tokens += 50;
        if (prop.type === 'object') tokens += 30;
        if (prop.enum) tokens += prop.enum.length * 5;
      });
    }

    return tokens;
  }

  /**
   * Estimate cost
   */
  private estimateCost(provider: string, model: string, tokens: number): number {
    const profile = this.providerProfiles.get(provider);
    if (!profile) return 0.01; // Default estimate

    const modelProfile = profile.models.find(m => m.name === model);
    if (!modelProfile) return 0.01;

    return (tokens / 1000) * modelProfile.costPer1kTokens;
  }

  /**
   * Determine if streaming should be enabled
   */
  private shouldEnableStreaming(context: OptimizationContext): boolean {
    const { input, complexity } = context;

    // Enable streaming for large outputs or when latency is critical
    if (context.taskType === 'generation' || context.taskType === 'structured-report') {
      return true;
    }

    if (complexity === 'complex') {
      return true;
    }

    const targetLatency = input.context.pipelineConfig?.targetLatency;
    if (targetLatency && targetLatency < 5000) {
      return true; // Enable streaming for low-latency requirements
    }

    return false;
  }

  /**
   * Initialize provider profiles
   */
  private initializeProviderProfiles(): Map<string, ProviderProfile> {
    const profiles = new Map<string, ProviderProfile>();

    // OpenAI Profile
    profiles.set('openai', {
      name: 'OpenAI',
      models: [
        {
          name: 'gpt-4o',
          costPer1kTokens: 0.01, // Combined input/output estimate
          maxTokens: 128000,
          bestFor: ['complex-analysis', 'structured-report', 'general'],
          temperature: { min: 0, max: 0.5, optimal: 0 },
        },
        {
          name: 'gpt-4o-mini',
          costPer1kTokens: 0.0004,
          maxTokens: 128000,
          bestFor: ['extraction', 'classification', 'simple-tasks'],
          temperature: { min: 0, max: 0.3, optimal: 0 },
        },
        {
          name: 'gpt-3.5-turbo',
          costPer1kTokens: 0.001,
          maxTokens: 16385,
          bestFor: ['simple-tasks', 'fast-processing'],
          temperature: { min: 0, max: 0.3, optimal: 0 },
        },
      ],
      strengths: ['structured-outputs', 'json-mode', 'function-calling'],
      costMultiplier: 1.0,
      speedRating: 8,
      qualityRating: 9,
    });

    // Anthropic Profile
    profiles.set('anthropic', {
      name: 'Anthropic',
      models: [
        {
          name: 'claude-3-5-sonnet-20241022',
          costPer1kTokens: 0.009,
          maxTokens: 200000,
          bestFor: ['complex-analysis', 'reasoning', 'general'],
          temperature: { min: 0, max: 0.5, optimal: 0.1 },
        },
        {
          name: 'claude-3-5-haiku-20241022',
          costPer1kTokens: 0.0008,
          maxTokens: 200000,
          bestFor: ['extraction', 'classification', 'fast-processing'],
          temperature: { min: 0, max: 0.3, optimal: 0 },
        },
      ],
      strengths: ['long-context', 'reasoning', 'analysis'],
      costMultiplier: 0.9,
      speedRating: 7,
      qualityRating: 9,
    });

    return profiles;
  }
}
