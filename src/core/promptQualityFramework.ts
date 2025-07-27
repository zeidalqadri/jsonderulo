/**
 * Prompt Quality Scoring and A/B Testing Framework
 * 
 * Provides comprehensive prompt evaluation with:
 * - Quality scoring based on multiple metrics
 * - A/B testing for prompt variations
 * - Performance tracking and analytics
 * - Automatic optimization recommendations
 */

import { EventEmitter } from 'events';

export interface PromptMetrics {
  // Effectiveness metrics
  taskCompletionRate: number;
  outputAccuracy: number;
  schemaCompliance: number;
  
  // Efficiency metrics
  tokensUsed: number;
  responseTime: number;
  retryCount: number;
  
  // Quality metrics
  clarityScore: number;
  specificityScore: number;
  consistencyScore: number;
  
  // User satisfaction
  userRating?: number;
  feedbackScore?: number;
}

export interface PromptVariant {
  id: string;
  name: string;
  prompt: string;
  systemPrompt?: string;
  metadata: {
    strategy?: string;
    temperature?: number;
    tags?: string[];
  };
}

export interface TestResult {
  variantId: string;
  metrics: PromptMetrics;
  output: any;
  error?: string;
  timestamp: Date;
  context?: any;
}

export interface ABTestConfig {
  name: string;
  description: string;
  variants: PromptVariant[];
  sampleSize: number;
  confidenceLevel?: number;
  metrics: (keyof PromptMetrics)[];
  successCriteria?: {
    metric: keyof PromptMetrics;
    threshold: number;
    comparison: 'greater' | 'less';
  }[];
}

export interface ABTestResults {
  testId: string;
  config: ABTestConfig;
  results: Map<string, TestResult[]>;
  analysis: {
    winner?: string;
    confidence: number;
    improvements: Map<string, number>;
    recommendations: string[];
  };
  status: 'running' | 'completed' | 'failed';
}

export interface QualityScore {
  overall: number;
  breakdown: {
    effectiveness: number;
    efficiency: number;
    quality: number;
    satisfaction: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export class PromptQualityFramework extends EventEmitter {
  private activeTests: Map<string, ABTestResults> = new Map();
  private historicalData: Map<string, TestResult[]> = new Map();
  private benchmarks: Map<string, PromptMetrics> = new Map();
  private scoringWeights: Record<string, number> = {
    effectiveness: 0.4,
    efficiency: 0.2,
    quality: 0.3,
    satisfaction: 0.1,
  };

  constructor() {
    super();
    this.initializeBenchmarks();
  }

  private initializeBenchmarks(): void {
    // Set baseline benchmarks for comparison
    this.benchmarks.set('default', {
      taskCompletionRate: 0.85,
      outputAccuracy: 0.9,
      schemaCompliance: 0.95,
      tokensUsed: 500,
      responseTime: 2000,
      retryCount: 0.1,
      clarityScore: 0.8,
      specificityScore: 0.85,
      consistencyScore: 0.9,
      userRating: 4.0,
      feedbackScore: 0.8,
    });
  }

  /**
   * Evaluate prompt quality
   */
  async evaluatePrompt(
    prompt: string,
    output: any,
    expectedOutput?: any,
    context?: any
  ): Promise<PromptMetrics> {
    const startTime = Date.now();

    const metrics: PromptMetrics = {
      taskCompletionRate: this.calculateTaskCompletion(output, expectedOutput),
      outputAccuracy: this.calculateAccuracy(output, expectedOutput),
      schemaCompliance: this.calculateSchemaCompliance(output, context?.schema),
      tokensUsed: this.estimateTokens(prompt + JSON.stringify(output)),
      responseTime: context?.responseTime || (Date.now() - startTime),
      retryCount: context?.retryCount || 0,
      clarityScore: this.calculateClarity(prompt),
      specificityScore: this.calculateSpecificity(prompt),
      consistencyScore: await this.calculateConsistency(prompt, context?.previousPrompts),
      userRating: context?.userRating,
      feedbackScore: context?.feedbackScore,
    };

    this.emit('prompt-evaluated', { prompt, metrics });
    return metrics;
  }

  /**
   * Calculate overall quality score
   */
  calculateQualityScore(metrics: PromptMetrics): QualityScore {
    const effectiveness = this.calculateEffectivenessScore(metrics);
    const efficiency = this.calculateEfficiencyScore(metrics);
    const quality = this.calculateQualitySubScore(metrics);
    const satisfaction = this.calculateSatisfactionScore(metrics);

    const overall = 
      effectiveness * this.scoringWeights.effectiveness +
      efficiency * this.scoringWeights.efficiency +
      quality * this.scoringWeights.quality +
      satisfaction * this.scoringWeights.satisfaction;

    const breakdown = { effectiveness, efficiency, quality, satisfaction };
    const strengths = this.identifyStrengths(metrics, breakdown);
    const weaknesses = this.identifyWeaknesses(metrics, breakdown);
    const recommendations = this.generateRecommendations(metrics, weaknesses);

    return {
      overall,
      breakdown,
      strengths,
      weaknesses,
      recommendations,
    };
  }

  /**
   * Start A/B test
   */
  async startABTest(config: ABTestConfig): Promise<string> {
    const testId = this.generateTestId();
    
    const testResults: ABTestResults = {
      testId,
      config,
      results: new Map(config.variants.map(v => [v.id, []])),
      analysis: {
        confidence: 0,
        improvements: new Map(),
        recommendations: [],
      },
      status: 'running',
    };

    this.activeTests.set(testId, testResults);
    this.emit('test-started', { testId, config });

    return testId;
  }

  /**
   * Record test result
   */
  async recordTestResult(
    testId: string,
    variantId: string,
    output: any,
    metrics?: Partial<PromptMetrics>,
    context?: any
  ): Promise<void> {
    const test = this.activeTests.get(testId);
    if (!test || test.status !== 'running') {
      throw new Error('Test not found or not running');
    }

    const variant = test.config.variants.find(v => v.id === variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }

    // Calculate full metrics if not provided
    const fullMetrics = metrics
      ? { ...this.getDefaultMetrics(), ...metrics }
      : await this.evaluatePrompt(variant.prompt, output, context?.expected, context);

    const result: TestResult = {
      variantId,
      metrics: fullMetrics as PromptMetrics,
      output,
      timestamp: new Date(),
      context,
    };

    test.results.get(variantId)!.push(result);

    // Check if test is complete
    const totalResults = Array.from(test.results.values())
      .reduce((sum, results) => sum + results.length, 0);

    if (totalResults >= test.config.sampleSize * test.config.variants.length) {
      await this.completeTest(testId);
    }

    this.emit('result-recorded', { testId, variantId, result });
  }

  /**
   * Complete and analyze test
   */
  private async completeTest(testId: string): Promise<void> {
    const test = this.activeTests.get(testId);
    if (!test) return;

    test.status = 'completed';
    
    // Analyze results
    const analysis = this.analyzeTestResults(test);
    test.analysis = analysis;

    // Store historical data
    test.results.forEach((results, variantId) => {
      const key = `${testId}-${variantId}`;
      this.historicalData.set(key, results);
    });

    this.emit('test-completed', { testId, analysis });
  }

  /**
   * Analyze test results
   */
  private analyzeTestResults(test: ABTestResults): ABTestResults['analysis'] {
    const variantStats = new Map<string, {
      mean: Record<string, number>;
      stdDev: Record<string, number>;
      count: number;
    }>();

    // Calculate statistics for each variant
    test.results.forEach((results, variantId) => {
      const stats = this.calculateVariantStats(results, test.config.metrics);
      variantStats.set(variantId, stats);
    });

    // Determine winner
    const winner = this.determineWinner(variantStats, test.config);
    
    // Calculate improvements
    const improvements = this.calculateImprovements(variantStats, test.config.variants[0].id);
    
    // Generate recommendations
    const recommendations = this.generateTestRecommendations(
      test.config,
      variantStats,
      winner
    );

    // Calculate confidence
    const confidence = this.calculateStatisticalConfidence(
      variantStats,
      test.config.confidenceLevel || 0.95
    );

    return {
      winner,
      confidence,
      improvements,
      recommendations,
    };
  }

  /**
   * Get test results
   */
  getTestResults(testId: string): ABTestResults | undefined {
    return this.activeTests.get(testId);
  }

  /**
   * Get all active tests
   */
  getActiveTests(): ABTestResults[] {
    return Array.from(this.activeTests.values()).filter(t => t.status === 'running');
  }

  /**
   * Get historical performance
   */
  getHistoricalPerformance(
    promptId: string,
    timeRange?: { start: Date; end: Date }
  ): TestResult[] {
    const results = this.historicalData.get(promptId) || [];
    
    if (timeRange) {
      return results.filter(r => 
        r.timestamp >= timeRange.start && r.timestamp <= timeRange.end
      );
    }
    
    return results;
  }

  /**
   * Generate optimization suggestions
   */
  generateOptimizationSuggestions(
    currentPrompt: string,
    recentResults: TestResult[]
  ): string[] {
    const suggestions: string[] = [];
    
    if (recentResults.length === 0) {
      return ['Insufficient data for optimization suggestions'];
    }

    // Analyze recent performance
    const avgMetrics = this.calculateAverageMetrics(recentResults.map(r => r.metrics));
    const qualityScore = this.calculateQualityScore(avgMetrics);

    // Based on weaknesses, suggest improvements
    if (qualityScore.breakdown.clarity < 0.7) {
      suggestions.push('Simplify language and use more concrete terms');
      suggestions.push('Break down complex instructions into steps');
    }

    if (qualityScore.breakdown.efficiency < 0.6) {
      suggestions.push('Reduce prompt length while maintaining clarity');
      suggestions.push('Use more efficient instruction patterns');
    }

    if (avgMetrics.retryCount > 0.5) {
      suggestions.push('Add more specific examples to reduce ambiguity');
      suggestions.push('Include explicit constraints and requirements');
    }

    if (avgMetrics.schemaCompliance < 0.9) {
      suggestions.push('Emphasize schema requirements more clearly');
      suggestions.push('Provide example of expected output format');
    }

    return suggestions;
  }

  // Private calculation methods

  private calculateTaskCompletion(output: any, expected?: any): number {
    if (!expected) return output ? 1 : 0;
    
    // Check if all required fields are present
    const requiredFields = Object.keys(expected);
    const presentFields = output ? Object.keys(output) : [];
    
    const completionRate = requiredFields.filter(field => 
      presentFields.includes(field)
    ).length / requiredFields.length;
    
    return completionRate;
  }

  private calculateAccuracy(output: any, expected?: any): number {
    if (!expected || !output) return output ? 0.5 : 0;
    
    // Deep comparison with fuzzy matching
    return this.deepCompare(output, expected);
  }

  private deepCompare(obj1: any, obj2: any): number {
    if (obj1 === obj2) return 1;
    
    if (typeof obj1 !== typeof obj2) return 0;
    
    if (typeof obj1 === 'object' && obj1 !== null && obj2 !== null) {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      const allKeys = new Set([...keys1, ...keys2]);
      
      let totalScore = 0;
      allKeys.forEach(key => {
        if (key in obj1 && key in obj2) {
          totalScore += this.deepCompare(obj1[key], obj2[key]);
        }
      });
      
      return totalScore / allKeys.size;
    }
    
    // Fuzzy string matching
    if (typeof obj1 === 'string' && typeof obj2 === 'string') {
      return this.stringSimilarity(obj1, obj2);
    }
    
    // Number comparison with tolerance
    if (typeof obj1 === 'number' && typeof obj2 === 'number') {
      const diff = Math.abs(obj1 - obj2);
      const avg = (Math.abs(obj1) + Math.abs(obj2)) / 2;
      return avg === 0 ? 1 : Math.max(0, 1 - diff / avg);
    }
    
    return 0;
  }

  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private calculateSchemaCompliance(output: any, schema?: any): number {
    if (!schema || !output) return output ? 0.8 : 0;
    
    // This would integrate with the validator
    // For now, return a mock score
    return 0.95;
  }

  private calculateClarity(prompt: string): number {
    // Analyze prompt clarity
    const words = prompt.split(/\s+/);
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    const sentences = prompt.split(/[.!?]+/).filter(s => s.trim());
    const avgSentenceLength = words.length / sentences.length;
    
    // Penalize very long words and sentences
    const wordScore = Math.max(0, 1 - (avgWordLength - 6) / 10);
    const sentenceScore = Math.max(0, 1 - (avgSentenceLength - 15) / 30);
    
    // Check for clarity indicators
    const hasStructure = /\d+\.|[-*]|\n\n/.test(prompt) ? 1.1 : 1;
    const hasExamples = /example|e\.g\.|for instance/i.test(prompt) ? 1.1 : 1;
    
    return Math.min(1, (wordScore * 0.4 + sentenceScore * 0.6) * hasStructure * hasExamples);
  }

  private calculateSpecificity(prompt: string): number {
    // Check for specific instructions and constraints
    const specificityIndicators = [
      /must/i,
      /should/i,
      /exactly/i,
      /specifically/i,
      /only/i,
      /format/i,
      /structure/i,
      /\d+/,
    ];
    
    const matches = specificityIndicators.filter(pattern => pattern.test(prompt)).length;
    return Math.min(1, 0.5 + matches * 0.1);
  }

  private async calculateConsistency(
    prompt: string,
    previousPrompts?: string[]
  ): Promise<number> {
    if (!previousPrompts || previousPrompts.length === 0) return 1;
    
    // Compare terminology and style consistency
    const currentTerms = this.extractKeyTerms(prompt);
    let consistencyScore = 0;
    
    for (const prevPrompt of previousPrompts) {
      const prevTerms = this.extractKeyTerms(prevPrompt);
      const overlap = currentTerms.filter(t => prevTerms.includes(t)).length;
      consistencyScore += overlap / Math.max(currentTerms.length, prevTerms.length);
    }
    
    return consistencyScore / previousPrompts.length;
  }

  private extractKeyTerms(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    
    return words
      .filter(w => w.length > 3 && !stopWords.has(w))
      .slice(0, 20);
  }

  private calculateEffectivenessScore(metrics: PromptMetrics): number {
    return (
      metrics.taskCompletionRate * 0.4 +
      metrics.outputAccuracy * 0.4 +
      metrics.schemaCompliance * 0.2
    );
  }

  private calculateEfficiencyScore(metrics: PromptMetrics): number {
    const tokenScore = Math.max(0, 1 - metrics.tokensUsed / 2000);
    const timeScore = Math.max(0, 1 - metrics.responseTime / 10000);
    const retryScore = Math.max(0, 1 - metrics.retryCount);
    
    return tokenScore * 0.3 + timeScore * 0.3 + retryScore * 0.4;
  }

  private calculateQualitySubScore(metrics: PromptMetrics): number {
    return (
      metrics.clarityScore * 0.4 +
      metrics.specificityScore * 0.3 +
      metrics.consistencyScore * 0.3
    );
  }

  private calculateSatisfactionScore(metrics: PromptMetrics): number {
    if (!metrics.userRating && !metrics.feedbackScore) return 0.8;
    
    const rating = metrics.userRating ? metrics.userRating / 5 : 0.8;
    const feedback = metrics.feedbackScore || 0.8;
    
    return (rating + feedback) / 2;
  }

  private identifyStrengths(
    metrics: PromptMetrics,
    breakdown: QualityScore['breakdown']
  ): string[] {
    const strengths: string[] = [];
    
    if (breakdown.effectiveness > 0.85) {
      strengths.push('High task completion and accuracy');
    }
    if (breakdown.efficiency > 0.8) {
      strengths.push('Efficient token usage and fast response');
    }
    if (metrics.clarityScore > 0.85) {
      strengths.push('Clear and well-structured instructions');
    }
    if (metrics.consistencyScore > 0.9) {
      strengths.push('Consistent terminology and style');
    }
    
    return strengths;
  }

  private identifyWeaknesses(
    metrics: PromptMetrics,
    breakdown: QualityScore['breakdown']
  ): string[] {
    const weaknesses: string[] = [];
    
    if (breakdown.effectiveness < 0.7) {
      weaknesses.push('Low task completion or accuracy');
    }
    if (breakdown.efficiency < 0.6) {
      weaknesses.push('Inefficient token usage or slow response');
    }
    if (metrics.clarityScore < 0.7) {
      weaknesses.push('Unclear or ambiguous instructions');
    }
    if (metrics.retryCount > 0.5) {
      weaknesses.push('High retry rate indicating ambiguity');
    }
    
    return weaknesses;
  }

  private generateRecommendations(
    metrics: PromptMetrics,
    weaknesses: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    weaknesses.forEach(weakness => {
      switch (true) {
        case weakness.includes('task completion'):
          recommendations.push('Add more specific instructions for each required output');
          break;
        case weakness.includes('token usage'):
          recommendations.push('Compress prompt by removing redundant instructions');
          break;
        case weakness.includes('Unclear'):
          recommendations.push('Use simpler language and provide examples');
          break;
        case weakness.includes('retry rate'):
          recommendations.push('Add constraints and validation requirements');
          break;
      }
    });
    
    return recommendations;
  }

  private calculateVariantStats(
    results: TestResult[],
    metrics: (keyof PromptMetrics)[]
  ): {
    mean: Record<string, number>;
    stdDev: Record<string, number>;
    count: number;
  } {
    const stats = {
      mean: {} as Record<string, number>,
      stdDev: {} as Record<string, number>,
      count: results.length,
    };

    metrics.forEach(metric => {
      const values = results.map(r => r.metrics[metric] as number).filter(v => v !== undefined);
      
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      stats.mean[metric] = mean;
      
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      stats.stdDev[metric] = Math.sqrt(variance);
    });

    return stats;
  }

  private determineWinner(
    variantStats: Map<string, any>,
    config: ABTestConfig
  ): string | undefined {
    if (config.successCriteria && config.successCriteria.length > 0) {
      // Use success criteria
      const scores = new Map<string, number>();
      
      variantStats.forEach((stats, variantId) => {
        let score = 0;
        config.successCriteria!.forEach(criterion => {
          const value = stats.mean[criterion.metric];
          if (criterion.comparison === 'greater' && value > criterion.threshold) {
            score++;
          } else if (criterion.comparison === 'less' && value < criterion.threshold) {
            score++;
          }
        });
        scores.set(variantId, score);
      });
      
      const maxScore = Math.max(...scores.values());
      const winners = Array.from(scores.entries())
        .filter(([_, score]) => score === maxScore)
        .map(([id]) => id);
      
      return winners.length === 1 ? winners[0] : undefined;
    } else {
      // Use overall quality score
      let bestVariant: string | undefined;
      let bestScore = -Infinity;
      
      variantStats.forEach((stats, variantId) => {
        const avgMetrics = this.statsToMetrics(stats.mean);
        const qualityScore = this.calculateQualityScore(avgMetrics);
        
        if (qualityScore.overall > bestScore) {
          bestScore = qualityScore.overall;
          bestVariant = variantId;
        }
      });
      
      return bestVariant;
    }
  }

  private calculateImprovements(
    variantStats: Map<string, any>,
    baselineId: string
  ): Map<string, number> {
    const improvements = new Map<string, number>();
    const baseline = variantStats.get(baselineId);
    
    if (!baseline) return improvements;
    
    variantStats.forEach((stats, variantId) => {
      if (variantId === baselineId) return;
      
      let totalImprovement = 0;
      let metricCount = 0;
      
      Object.entries(stats.mean).forEach(([metric, value]) => {
        const baseValue = baseline.mean[metric];
        if (baseValue && typeof value === 'number') {
          const improvement = ((value - baseValue) / baseValue) * 100;
          totalImprovement += improvement;
          metricCount++;
        }
      });
      
      improvements.set(variantId, totalImprovement / metricCount);
    });
    
    return improvements;
  }

  private generateTestRecommendations(
    config: ABTestConfig,
    variantStats: Map<string, any>,
    winner?: string
  ): string[] {
    const recommendations: string[] = [];
    
    if (!winner) {
      recommendations.push('No clear winner - consider running test with larger sample size');
      return recommendations;
    }
    
    const winnerStats = variantStats.get(winner);
    if (!winnerStats) return recommendations;
    
    // Analyze what made the winner successful
    const winnerVariant = config.variants.find(v => v.id === winner);
    if (winnerVariant?.metadata.strategy) {
      recommendations.push(`${winnerVariant.metadata.strategy} strategy showed best results`);
    }
    
    // Specific metric improvements
    config.metrics.forEach(metric => {
      const improvement = this.calculateMetricImprovement(
        winnerStats.mean[metric],
        variantStats,
        metric
      );
      
      if (improvement > 10) {
        recommendations.push(`${metric} improved by ${improvement.toFixed(1)}%`);
      }
    });
    
    return recommendations;
  }

  private calculateMetricImprovement(
    winnerValue: number,
    allStats: Map<string, any>,
    metric: string
  ): number {
    const values = Array.from(allStats.values())
      .map(stats => stats.mean[metric])
      .filter(v => v !== undefined && v !== winnerValue);
    
    if (values.length === 0) return 0;
    
    const avgOthers = values.reduce((sum, v) => sum + v, 0) / values.length;
    return ((winnerValue - avgOthers) / avgOthers) * 100;
  }

  private calculateStatisticalConfidence(
    variantStats: Map<string, any>,
    confidenceLevel: number
  ): number {
    // Simplified confidence calculation
    // In real implementation, would use proper statistical tests
    const sampleSizes = Array.from(variantStats.values()).map(s => s.count);
    const minSampleSize = Math.min(...sampleSizes);
    
    // Base confidence on sample size
    const sampleConfidence = Math.min(1, minSampleSize / 100);
    
    // Adjust for variance
    const variances = Array.from(variantStats.values())
      .flatMap(s => Object.values(s.stdDev))
      .filter(v => typeof v === 'number');
    
    const avgVariance = variances.reduce((sum, v) => sum + v, 0) / variances.length;
    const varianceConfidence = Math.max(0, 1 - avgVariance);
    
    return sampleConfidence * 0.6 + varianceConfidence * 0.4;
  }

  private calculateAverageMetrics(metricsArray: PromptMetrics[]): PromptMetrics {
    const avg: any = {};
    const keys = Object.keys(metricsArray[0]) as (keyof PromptMetrics)[];
    
    keys.forEach(key => {
      const values = metricsArray
        .map(m => m[key])
        .filter(v => v !== undefined && typeof v === 'number') as number[];
      
      if (values.length > 0) {
        avg[key] = values.reduce((sum, v) => sum + v, 0) / values.length;
      }
    });
    
    return avg as PromptMetrics;
  }

  private statsToMetrics(meanValues: Record<string, number>): PromptMetrics {
    return {
      taskCompletionRate: meanValues.taskCompletionRate || 0,
      outputAccuracy: meanValues.outputAccuracy || 0,
      schemaCompliance: meanValues.schemaCompliance || 0,
      tokensUsed: meanValues.tokensUsed || 0,
      responseTime: meanValues.responseTime || 0,
      retryCount: meanValues.retryCount || 0,
      clarityScore: meanValues.clarityScore || 0,
      specificityScore: meanValues.specificityScore || 0,
      consistencyScore: meanValues.consistencyScore || 0,
      userRating: meanValues.userRating,
      feedbackScore: meanValues.feedbackScore,
    };
  }

  private getDefaultMetrics(): PromptMetrics {
    return {
      taskCompletionRate: 0,
      outputAccuracy: 0,
      schemaCompliance: 0,
      tokensUsed: 0,
      responseTime: 0,
      retryCount: 0,
      clarityScore: 0,
      specificityScore: 0,
      consistencyScore: 0,
    };
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private generateTestId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}