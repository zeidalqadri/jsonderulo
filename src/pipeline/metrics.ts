/**
 * Pipeline Metrics and Monitoring
 *
 * Provides comprehensive metrics collection and monitoring
 * capabilities for jsonderulo in pipeline contexts.
 */

import { EventEmitter } from 'events';
import { PipelineMetrics, PipelineEvent, PipelineOutput } from './types.js';

export interface MetricSnapshot {
  timestamp: Date;
  metrics: PipelineMetrics;
  recentEvents: PipelineEvent[];
}

export interface PerformanceMetrics {
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number; // requests per second
}

export interface CostProjection {
  hourly: number;
  daily: number;
  monthly: number;
  byProvider: Record<string, number>;
}

export class PipelineMetricsCollector extends EventEmitter {
  private metrics: PipelineMetrics;
  private responseTimes: number[] = [];
  private recentEvents: PipelineEvent[] = [];
  private startTime: Date;
  private windowSize: number = 1000; // Keep last 1000 measurements

  constructor() {
    super();
    this.startTime = new Date();
    this.metrics = this.initializeMetrics();
  }

  /**
   * Initialize empty metrics
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

  /**
   * Record a pipeline event
   */
  recordEvent(event: PipelineEvent): void {
    // Keep recent events for analysis
    this.recentEvents.push(event);
    if (this.recentEvents.length > 100) {
      this.recentEvents.shift();
    }

    // Update metrics based on event type
    switch (event.type) {
      case 'output-ready':
        this.recordSuccessfulRequest(event.payload.output);
        break;
      case 'error':
        this.recordFailedRequest(event);
        break;
      case 'validation-completed':
        this.recordValidation(event);
        break;
    }

    // Emit event for external listeners
    this.emit('metric-event', event);
  }

  /**
   * Record successful request
   */
  private recordSuccessfulRequest(output: PipelineOutput): void {
    this.metrics.requestsProcessed++;

    // Update processing time
    const processingTime = output.metadata.jsonderuloProcessing.processingTime;
    this.responseTimes.push(processingTime);
    if (this.responseTimes.length > this.windowSize) {
      this.responseTimes.shift();
    }

    this.metrics.avgProcessingTime = this.calculateAverage(this.responseTimes);

    // Update schema complexity
    const complexityScore = this.complexityToScore(
      output.metadata.jsonderuloProcessing.schemaComplexity
    );
    this.metrics.avgSchemaComplexity = this.updateRunningAverage(
      this.metrics.avgSchemaComplexity,
      complexityScore,
      this.metrics.requestsProcessed
    );

    // Update schema source metrics
    const source = output.metadata.jsonderuloProcessing.schemaSource;
    const metricKey = `${source}Count` as keyof typeof this.metrics.schemaMetrics;
    this.metrics.schemaMetrics[metricKey]++;

    // Update cost metrics
    const cost = output.executionHints.estimatedCost;
    this.metrics.costMetrics.totalCost += cost;
    this.metrics.costMetrics.avgCostPerRequest =
      this.metrics.costMetrics.totalCost / this.metrics.requestsProcessed;

    const provider = output.executionHints.recommendedProvider;
    this.metrics.costMetrics.costByProvider[provider] =
      (this.metrics.costMetrics.costByProvider[provider] || 0) + cost;

    // Update success rate
    this.updateSuccessRate(true);
  }

  /**
   * Record failed request
   */
  private recordFailedRequest(event: PipelineEvent): void {
    this.updateSuccessRate(false);
    this.emit('error-recorded', event.error);
  }

  /**
   * Record validation event
   */
  private recordValidation(event: PipelineEvent): void {
    const { success, repaired } = event.payload;

    this.metrics.validationMetrics.validationAttempts++;
    if (success) {
      this.metrics.validationMetrics.validationSuccesses++;
    }

    if (repaired) {
      this.metrics.validationMetrics.repairAttempts++;
      if (success) {
        this.metrics.validationMetrics.repairSuccesses++;
      }
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PipelineMetrics {
    return JSON.parse(JSON.stringify(this.metrics));
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
    const throughput = this.calculateThroughput();

    return {
      p50ResponseTime: this.getPercentile(sortedTimes, 0.5),
      p95ResponseTime: this.getPercentile(sortedTimes, 0.95),
      p99ResponseTime: this.getPercentile(sortedTimes, 0.99),
      throughput,
    };
  }

  /**
   * Get cost projection
   */
  getCostProjection(): CostProjection {
    const runtime = Date.now() - this.startTime.getTime();
    const hoursElapsed = runtime / (1000 * 60 * 60);
    const costPerHour = hoursElapsed > 0 ? this.metrics.costMetrics.totalCost / hoursElapsed : 0;

    const byProvider: Record<string, number> = {};
    Object.entries(this.metrics.costMetrics.costByProvider).forEach(([provider, cost]) => {
      byProvider[provider] = hoursElapsed > 0 ? (cost / hoursElapsed) * 24 * 30 : 0;
    });

    return {
      hourly: costPerHour,
      daily: costPerHour * 24,
      monthly: costPerHour * 24 * 30,
      byProvider,
    };
  }

  /**
   * Get metric snapshot
   */
  getSnapshot(): MetricSnapshot {
    return {
      timestamp: new Date(),
      metrics: this.getMetrics(),
      recentEvents: [...this.recentEvents],
    };
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues: string[];
  } {
    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check success rate
    if (this.metrics.successRate < 0.95) {
      issues.push(`Low success rate: ${(this.metrics.successRate * 100).toFixed(1)}%`);
      status = this.metrics.successRate < 0.8 ? 'unhealthy' : 'degraded';
    }

    // Check response times
    const p95 = this.getPercentile(
      [...this.responseTimes].sort((a, b) => a - b),
      0.95
    );
    if (p95 > 5000) {
      issues.push(`High response time: p95 = ${p95.toFixed(0)}ms`);
      status = status === 'healthy' ? 'degraded' : status;
    }

    // Check cost
    const projection = this.getCostProjection();
    if (projection.daily > 100) {
      issues.push(`High daily cost: $${projection.daily.toFixed(2)}`);
      status = status === 'healthy' ? 'degraded' : status;
    }

    // Check validation success
    const validationSuccessRate =
      this.metrics.validationMetrics.validationAttempts > 0
        ? this.metrics.validationMetrics.validationSuccesses /
          this.metrics.validationMetrics.validationAttempts
        : 1;

    if (validationSuccessRate < 0.9) {
      issues.push(`Low validation success rate: ${(validationSuccessRate * 100).toFixed(1)}%`);
      status = 'degraded';
    }

    return { status, issues };
  }

  /**
   * Generate summary report
   */
  generateReport(): string {
    const perf = this.getPerformanceMetrics();
    const cost = this.getCostProjection();
    const health = this.getHealthStatus();
    const runtime = Date.now() - this.startTime.getTime();
    const runtimeHours = (runtime / (1000 * 60 * 60)).toFixed(2);

    const report = `
=== Pipeline Metrics Report ===
Generated: ${new Date().toISOString()}
Runtime: ${runtimeHours} hours

SUMMARY
-------
Total Requests: ${this.metrics.requestsProcessed}
Success Rate: ${(this.metrics.successRate * 100).toFixed(1)}%
Health Status: ${health.status.toUpperCase()}

PERFORMANCE
-----------
Average Response Time: ${this.metrics.avgProcessingTime.toFixed(2)}ms
P50 Response Time: ${perf.p50ResponseTime.toFixed(2)}ms
P95 Response Time: ${perf.p95ResponseTime.toFixed(2)}ms
P99 Response Time: ${perf.p99ResponseTime.toFixed(2)}ms
Throughput: ${perf.throughput.toFixed(2)} req/s

COST ANALYSIS
-------------
Total Cost: $${this.metrics.costMetrics.totalCost.toFixed(4)}
Average Cost/Request: $${this.metrics.costMetrics.avgCostPerRequest.toFixed(6)}
Projected Daily Cost: $${cost.daily.toFixed(2)}
Projected Monthly Cost: $${cost.monthly.toFixed(2)}

Cost by Provider:
${Object.entries(this.metrics.costMetrics.costByProvider)
  .map(([p, c]) => `  ${p}: $${c.toFixed(4)}`)
  .join('\n')}

SCHEMA GENERATION
-----------------
Inferred: ${this.metrics.schemaMetrics.inferredCount}
Explicit: ${this.metrics.schemaMetrics.explicitCount}
Template: ${this.metrics.schemaMetrics.templateCount}
Hybrid: ${this.metrics.schemaMetrics.hybridCount}
Average Complexity: ${this.complexityFromScore(this.metrics.avgSchemaComplexity)}

VALIDATION
----------
Attempts: ${this.metrics.validationMetrics.validationAttempts}
Successes: ${this.metrics.validationMetrics.validationSuccesses}
Success Rate: ${
      this.metrics.validationMetrics.validationAttempts > 0
        ? (
            (this.metrics.validationMetrics.validationSuccesses /
              this.metrics.validationMetrics.validationAttempts) *
            100
          ).toFixed(1)
        : 'N/A'
    }%
Repairs: ${this.metrics.validationMetrics.repairAttempts}
Repair Success Rate: ${
      this.metrics.validationMetrics.repairAttempts > 0
        ? (
            (this.metrics.validationMetrics.repairSuccesses /
              this.metrics.validationMetrics.repairAttempts) *
            100
          ).toFixed(1)
        : 'N/A'
    }%

${
  health.issues.length > 0
    ? `
ISSUES
------
${health.issues.map(i => `- ${i}`).join('\n')}
`
    : ''
}
    `.trim();

    return report;
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = this.initializeMetrics();
    this.responseTimes = [];
    this.recentEvents = [];
    this.startTime = new Date();
    this.emit('metrics-reset');
  }

  /**
   * Export metrics for external storage
   */
  exportMetrics(): {
    version: string;
    timestamp: Date;
    runtime: number;
    metrics: PipelineMetrics;
    performance: PerformanceMetrics;
    cost: CostProjection;
    health: any;
  } {
    return {
      version: '1.0.0',
      timestamp: new Date(),
      runtime: Date.now() - this.startTime.getTime(),
      metrics: this.getMetrics(),
      performance: this.getPerformanceMetrics(),
      cost: this.getCostProjection(),
      health: this.getHealthStatus(),
    };
  }

  /**
   * Helper methods
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private updateRunningAverage(current: number, newValue: number, count: number): number {
    return (current * (count - 1) + newValue) / count;
  }

  private updateSuccessRate(success: boolean): void {
    const totalAttempts = this.metrics.requestsProcessed + (success ? 0 : 1);
    const successCount =
      this.metrics.requestsProcessed * this.metrics.successRate + (success ? 1 : 0);
    this.metrics.successRate = totalAttempts > 0 ? successCount / totalAttempts : 1;
  }

  private complexityToScore(complexity: 'simple' | 'medium' | 'complex'): number {
    switch (complexity) {
      case 'simple':
        return 1;
      case 'medium':
        return 2;
      case 'complex':
        return 3;
      default:
        return 2;
    }
  }

  private complexityFromScore(score: number): string {
    if (score <= 1.5) return 'simple';
    if (score <= 2.5) return 'medium';
    return 'complex';
  }

  private getPercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil(sortedValues.length * percentile) - 1;
    return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
  }

  private calculateThroughput(): number {
    const runtime = Date.now() - this.startTime.getTime();
    const seconds = runtime / 1000;
    return seconds > 0 ? this.metrics.requestsProcessed / seconds : 0;
  }
}
