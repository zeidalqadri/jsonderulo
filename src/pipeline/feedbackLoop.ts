/**
 * FeedbackLoop - Continuous improvement through feedback integration
 *
 * Collects execution feedback, analyzes patterns, and generates
 * optimization recommendations for pipeline improvement.
 */

import { EventEmitter } from 'events';
import { PipelineMetrics, PipelineEvent } from './types.js';

export interface FeedbackData {
  executionId: string;
  timestamp: Date;
  success: boolean;
  duration: number;
  tokenUsage: number;
  cost: number;
  errorType?: string;
  errorMessage?: string;
  outputQuality?: number;
  userSatisfaction?: number;
  metadata?: Record<string, any>;
}

export interface ExecutionResult {
  id: string;
  success: boolean;
  metrics: ExecutionMetrics;
  output?: any;
  error?: Error;
}

export interface ExecutionMetrics {
  duration: number;
  tokenUsage: number;
  cost: number;
  retries: number;
  provider: string;
  model: string;
}

export interface PatternInsights {
  errorPatterns: ErrorPattern[];
  performancePatterns: PerformancePattern[];
  costPatterns: CostPattern[];
  recommendations: string[];
  overallTrend: 'improving' | 'stable' | 'degrading';
}

export interface ErrorPattern {
  type: string;
  frequency: number;
  recentOccurrences: Date[];
  commonContext?: Record<string, any>;
  suggestedFix?: string;
}

export interface PerformancePattern {
  metric: 'latency' | 'throughput' | 'success_rate';
  trend: 'increasing' | 'decreasing' | 'stable';
  averageValue: number;
  percentileP95: number;
  outliers: number;
}

export interface CostPattern {
  provider: string;
  averageCost: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  costPerToken: number;
  projectedMonthlyCost: number;
}

export interface OptimizationUpdate {
  parameter: string;
  currentValue: any;
  recommendedValue: any;
  expectedImprovement: number;
  confidence: number;
}

export interface Improvement {
  type: 'performance' | 'cost' | 'quality' | 'reliability';
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  implementation: string;
}

export class FeedbackLoop extends EventEmitter {
  private feedbackHistory: FeedbackData[] = [];
  private patternDetectionWindow = 100; // Last N executions
  private updateInterval = 3600000; // 1 hour
  private lastUpdate: Date = new Date();

  constructor() {
    super();
    this.startPeriodicAnalysis();
  }

  collectFeedback(execution: ExecutionResult): FeedbackData {
    const feedback: FeedbackData = {
      executionId: execution.id,
      timestamp: new Date(),
      success: execution.success,
      duration: execution.metrics.duration,
      tokenUsage: execution.metrics.tokenUsage,
      cost: execution.metrics.cost,
      errorType: execution.error?.name,
      errorMessage: execution.error?.message,
      metadata: {
        provider: execution.metrics.provider,
        model: execution.metrics.model,
        retries: execution.metrics.retries,
      },
    };

    this.feedbackHistory.push(feedback);

    // Keep history size manageable
    if (this.feedbackHistory.length > 10000) {
      this.feedbackHistory = this.feedbackHistory.slice(-5000);
    }

    this.emit('feedback-collected', {
      type: 'processing-started',
      payload: { feedback },
      executionId: this.generateExecutionId(),
      timestamp: new Date(),
    } as PipelineEvent);

    return feedback;
  }

  analyzePatterns(feedbackHistory?: FeedbackData[]): PatternInsights {
    const history = feedbackHistory || this.getRecentFeedback();

    const errorPatterns = this.analyzeErrorPatterns(history);
    const performancePatterns = this.analyzePerformancePatterns(history);
    const costPatterns = this.analyzeCostPatterns(history);
    const recommendations = this.generateRecommendations(
      errorPatterns,
      performancePatterns,
      costPatterns
    );
    const overallTrend = this.determineOverallTrend(history);

    const insights: PatternInsights = {
      errorPatterns,
      performancePatterns,
      costPatterns,
      recommendations,
      overallTrend,
    };

    this.emit('patterns-analyzed', {
      type: 'processing-started',
      payload: { insights },
      executionId: this.generateExecutionId(),
      timestamp: new Date(),
    } as PipelineEvent);

    return insights;
  }

  updateOptimizations(insights: PatternInsights): OptimizationUpdate[] {
    const updates: OptimizationUpdate[] = [];

    // Update retry logic based on error patterns
    if (insights.errorPatterns.some(p => p.frequency > 0.1)) {
      updates.push({
        parameter: 'maxRetries',
        currentValue: 3,
        recommendedValue: 5,
        expectedImprovement: 0.15,
        confidence: 0.8,
      });
    }

    // Update timeout based on performance patterns
    const latencyPattern = insights.performancePatterns.find(p => p.metric === 'latency');
    if (latencyPattern && latencyPattern.percentileP95 > 5000) {
      updates.push({
        parameter: 'timeout',
        currentValue: 30000,
        recommendedValue: 45000,
        expectedImprovement: 0.1,
        confidence: 0.7,
      });
    }

    // Update provider preferences based on cost patterns
    const expensiveProvider = insights.costPatterns.find(p => p.trend === 'increasing');
    if (expensiveProvider) {
      updates.push({
        parameter: 'preferredProvider',
        currentValue: expensiveProvider.provider,
        recommendedValue: this.findCheaperAlternative(insights.costPatterns),
        expectedImprovement: 0.3,
        confidence: 0.9,
      });
    }

    return updates;
  }

  suggestImprovements(metrics: PipelineMetrics): Improvement[] {
    const improvements: Improvement[] = [];

    // Performance improvements
    if (metrics.avgProcessingTime > 1000) {
      improvements.push({
        type: 'performance',
        description: 'Implement caching for frequently used schemas',
        impact: 'high',
        effort: 'medium',
        implementation: 'Add Redis or in-memory cache for schema generation results',
      });
    }

    // Cost improvements
    if (metrics.costMetrics.avgCostPerRequest > 0.05) {
      improvements.push({
        type: 'cost',
        description: 'Use smaller models for simple tasks',
        impact: 'high',
        effort: 'low',
        implementation: 'Implement task complexity analysis to route to appropriate models',
      });
    }

    // Quality improvements
    if (metrics.successRate < 0.95) {
      improvements.push({
        type: 'quality',
        description: 'Enhance prompt templates and examples',
        impact: 'medium',
        effort: 'medium',
        implementation: 'Analyze failed requests and improve prompt engineering',
      });
    }

    // Reliability improvements
    if (
      metrics.validationMetrics.validationAttempts >
      metrics.validationMetrics.validationSuccesses * 1.2
    ) {
      improvements.push({
        type: 'reliability',
        description: 'Improve schema generation accuracy',
        impact: 'high',
        effort: 'high',
        implementation: 'Train custom models or enhance schema inference logic',
      });
    }

    return improvements;
  }

  private analyzeErrorPatterns(history: FeedbackData[]): ErrorPattern[] {
    const errorMap = new Map<string, ErrorPattern>();

    history
      .filter(f => !f.success)
      .forEach(feedback => {
        const errorType = feedback.errorType || 'unknown';

        if (!errorMap.has(errorType)) {
          errorMap.set(errorType, {
            type: errorType,
            frequency: 0,
            recentOccurrences: [],
          });
        }

        const pattern = errorMap.get(errorType)!;
        pattern.frequency++;
        pattern.recentOccurrences.push(feedback.timestamp);
      });

    // Calculate frequency rates and add suggestions
    const totalExecutions = history.length;
    return Array.from(errorMap.values()).map(pattern => {
      pattern.frequency = pattern.frequency / totalExecutions;
      pattern.suggestedFix = this.suggestErrorFix(pattern.type);
      return pattern;
    });
  }

  private analyzePerformancePatterns(history: FeedbackData[]): PerformancePattern[] {
    const patterns: PerformancePattern[] = [];

    // Latency analysis
    const durations = history.map(f => f.duration).sort((a, b) => a - b);
    patterns.push({
      metric: 'latency',
      trend: this.calculateTrend(durations),
      averageValue: this.average(durations),
      percentileP95: this.percentile(durations, 0.95),
      outliers: durations.filter(d => d > this.percentile(durations, 0.95)).length,
    });

    // Success rate analysis
    const successRate = history.filter(f => f.success).length / history.length;
    patterns.push({
      metric: 'success_rate',
      trend: 'stable', // Would need time-series analysis for trend
      averageValue: successRate,
      percentileP95: successRate,
      outliers: 0,
    });

    return patterns;
  }

  private analyzeCostPatterns(history: FeedbackData[]): CostPattern[] {
    const providerCosts = new Map<string, number[]>();

    history.forEach(feedback => {
      const provider = feedback.metadata?.provider || 'unknown';
      if (!providerCosts.has(provider)) {
        providerCosts.set(provider, []);
      }
      providerCosts.get(provider)!.push(feedback.cost);
    });

    return Array.from(providerCosts.entries()).map(([provider, costs]) => ({
      provider,
      averageCost: this.average(costs),
      trend: this.calculateTrend(costs),
      costPerToken: this.average(costs) / this.average(history.map(f => f.tokenUsage)),
      projectedMonthlyCost: this.average(costs) * 30 * 24 * 60, // Assuming per-minute rate
    }));
  }

  private generateRecommendations(
    errorPatterns: ErrorPattern[],
    performancePatterns: PerformancePattern[],
    costPatterns: CostPattern[]
  ): string[] {
    const recommendations: string[] = [];

    // Error-based recommendations
    const highErrorRate = errorPatterns.find(p => p.frequency > 0.05);
    if (highErrorRate) {
      recommendations.push(
        `High error rate (${(highErrorRate.frequency * 100).toFixed(1)}%) for ${highErrorRate.type}. ${highErrorRate.suggestedFix}`
      );
    }

    // Performance-based recommendations
    const latencyPattern = performancePatterns.find(p => p.metric === 'latency');
    if (latencyPattern && latencyPattern.averageValue > 2000) {
      recommendations.push(
        'Average latency exceeds 2 seconds. Consider implementing caching or using faster models.'
      );
    }

    // Cost-based recommendations
    const expensiveProvider = costPatterns.find(p => p.averageCost > 0.1);
    if (expensiveProvider) {
      recommendations.push(
        `${expensiveProvider.provider} costs average $${expensiveProvider.averageCost.toFixed(3)} per request. Consider using alternative providers for non-critical tasks.`
      );
    }

    return recommendations;
  }

  private determineOverallTrend(history: FeedbackData[]): 'improving' | 'stable' | 'degrading' {
    if (history.length < 10) return 'stable';

    const recentHalf = history.slice(history.length / 2);
    const olderHalf = history.slice(0, history.length / 2);

    const recentSuccessRate = recentHalf.filter(f => f.success).length / recentHalf.length;
    const olderSuccessRate = olderHalf.filter(f => f.success).length / olderHalf.length;

    const diff = recentSuccessRate - olderSuccessRate;

    if (diff > 0.05) return 'improving';
    if (diff < -0.05) return 'degrading';
    return 'stable';
  }

  private suggestErrorFix(errorType: string): string {
    const fixes: Record<string, string> = {
      timeout: 'Increase timeout duration or optimize prompt complexity',
      rate_limit: 'Implement exponential backoff and request queuing',
      invalid_response: 'Enhance prompt clarity and add validation examples',
      token_limit: 'Implement prompt compression or chunking strategy',
      unknown: 'Add detailed error logging and monitoring',
    };

    return fixes[errorType] || fixes['unknown'];
  }

  private findCheaperAlternative(costPatterns: CostPattern[]): string {
    const sorted = [...costPatterns].sort((a, b) => a.averageCost - b.averageCost);
    return sorted[0]?.provider || 'openai';
  }

  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 3) return 'stable';

    const firstThird = values.slice(0, values.length / 3);
    const lastThird = values.slice(-values.length / 3);

    const firstAvg = this.average(firstThird);
    const lastAvg = this.average(lastThird);

    const change = (lastAvg - firstAvg) / firstAvg;

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  private getRecentFeedback(): FeedbackData[] {
    return this.feedbackHistory.slice(-this.patternDetectionWindow);
  }

  private startPeriodicAnalysis(): void {
    setInterval(() => {
      if (this.feedbackHistory.length > 50) {
        const insights = this.analyzePatterns();
        this.emit('periodic-analysis', {
          type: 'processing-started',
          payload: { insights },
          executionId: this.generateExecutionId(),
          timestamp: new Date(),
        } as PipelineEvent);
      }
    }, this.updateInterval);
  }

  private generateExecutionId(): string {
    return `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API for feedback management
  getFeedbackHistory(limit?: number): FeedbackData[] {
    if (limit) {
      return this.feedbackHistory.slice(-limit);
    }
    return [...this.feedbackHistory];
  }

  clearHistory(): void {
    this.feedbackHistory = [];
  }

  exportMetrics(): {
    totalExecutions: number;
    successRate: number;
    averageLatency: number;
    totalCost: number;
    errorBreakdown: Record<string, number>;
  } {
    const total = this.feedbackHistory.length;
    const successful = this.feedbackHistory.filter(f => f.success).length;

    return {
      totalExecutions: total,
      successRate: total > 0 ? successful / total : 0,
      averageLatency: this.average(this.feedbackHistory.map(f => f.duration)),
      totalCost: this.feedbackHistory.reduce((sum, f) => sum + f.cost, 0),
      errorBreakdown: this.feedbackHistory
        .filter(f => !f.success)
        .reduce(
          (acc, f) => {
            const type = f.errorType || 'unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
    };
  }
}
