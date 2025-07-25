/**
 * PipelineOrchestrator - Coordinates all pipeline components
 *
 * Central coordination hub that manages component lifecycle,
 * routing, health monitoring, and end-to-end pipeline execution.
 */

import { EventEmitter } from 'events';
import {
  PipelineNodeConfig,
  PipelineInput,
  PipelineOutput,
  PipelineEvent,
  PipelineContext,
} from './types.js';
import { IdeaInputProcessor } from './ideaInput.js';
import { QueryConstructor } from './queryConstructor.js';
import { PromptOptimizer } from './promptOptimizer.js';
import { LLMExecutor } from './llmExecutor.js';
import { OutputValidator } from './outputValidator.js';
import { FeedbackLoop } from './feedbackLoop.js';
import { PipelineJsonderulo } from './index.js';
import { PipelineMetricsCollector } from './metrics.js';

export interface PipelineConfig {
  enableMetrics?: boolean;
  enableFeedback?: boolean;
  maxConcurrency?: number;
  timeout?: number;
  retryPolicy?: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
}

export interface ExecutionPath {
  nodes: string[];
  estimatedDuration: number;
  estimatedCost: number;
  confidence: number;
}

export interface PipelineResult {
  success: boolean;
  output?: any;
  error?: Error;
  executionPath: string[];
  metrics: ExecutionMetrics;
  validationResult?: any;
}

export interface ExecutionMetrics {
  totalDuration: number;
  nodeMetrics: Record<string, NodeMetrics>;
  totalCost: number;
  tokensUsed: number;
}

export interface NodeMetrics {
  duration: number;
  success: boolean;
  retries: number;
  error?: string;
}

export interface PipelineHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: Record<string, ComponentHealth>;
  metrics: HealthMetrics;
  lastCheck: Date;
}

export interface ComponentHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  lastSuccess?: Date;
  errorRate: number;
  avgResponseTime: number;
}

export interface HealthMetrics {
  uptime: number;
  requestsPerMinute: number;
  errorRate: number;
  avgLatency: number;
}

export class PipelineOrchestrator extends EventEmitter {
  private components: Map<string, any> = new Map();
  private config: PipelineConfig;
  private metricsCollector?: PipelineMetricsCollector;
  private feedbackLoop?: FeedbackLoop;
  private health: PipelineHealth;
  private startTime: Date;
  private executionCount = 0;

  constructor(config: PipelineConfig = {}) {
    super();
    this.config = {
      enableMetrics: true,
      enableFeedback: true,
      maxConcurrency: 10,
      timeout: 300000, // 5 minutes
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        maxBackoffMs: 30000,
      },
      ...config,
    };

    this.startTime = new Date();
    this.health = this.initializeHealth();
    this.initializeComponents();
    this.startHealthMonitoring();
  }

  private initializeComponents(): void {
    // Core pipeline components
    this.registerNode({
      nodeId: 'idea-input',
      nodeType: 'idea-input',
      enabled: true,
    });
    this.components.set('idea-input', new IdeaInputProcessor());

    this.registerNode({
      nodeId: 'query-constructor',
      nodeType: 'query-construction',
      enabled: true,
    });
    this.components.set('query-constructor', new QueryConstructor());

    this.registerNode({
      nodeId: 'prompt-optimizer',
      nodeType: 'prompt-optimization',
      enabled: true,
    });
    this.components.set('prompt-optimizer', new PromptOptimizer());

    this.registerNode({
      nodeId: 'jsonderulo',
      nodeType: 'structure-layer',
      enabled: true,
    });
    this.components.set('jsonderulo', new PipelineJsonderulo());

    this.registerNode({
      nodeId: 'llm-executor',
      nodeType: 'llm-execution',
      enabled: true,
    });
    this.components.set('llm-executor', new LLMExecutor());

    this.registerNode({
      nodeId: 'output-validator',
      nodeType: 'output-validation',
      enabled: true,
    });
    this.components.set('output-validator', new OutputValidator());

    // Optional components
    if (this.config.enableMetrics) {
      this.metricsCollector = new PipelineMetricsCollector();
      this.setupMetricsCollection();
    }

    if (this.config.enableFeedback) {
      this.registerNode({
        nodeId: 'feedback-loop',
        nodeType: 'feedback-loop',
        enabled: true,
      });
      this.feedbackLoop = new FeedbackLoop();
      this.components.set('feedback-loop', this.feedbackLoop);
    }
  }

  registerNode(config: PipelineNodeConfig): void {
    // Store node configuration
    this.emit('node-registered', {
      type: 'processing-started',
      payload: { config },
      executionId: this.generateExecutionId(),
      timestamp: new Date(),
    } as PipelineEvent);
  }

  async executePipeline(
    input: string,
    context?: Partial<PipelineContext>
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    const executionId = this.generateExecutionId();
    const executionPath: string[] = [];
    const nodeMetrics: Record<string, NodeMetrics> = {};

    this.executionCount++;

    try {
      // Create pipeline context
      const pipelineContext: PipelineContext = {
        domain: context?.domain || 'general',
        expectedOutputType: context?.expectedOutputType || 'analysis',
        constraints: context?.constraints || [],
        upstream: context?.upstream || {},
        pipelineConfig: context?.pipelineConfig,
      };

      // Determine execution path
      const path = await this.routeRequest({
        query: input,
        context: pipelineContext,
        executionId,
        timestamp: new Date(),
      });

      // Execute pipeline nodes in sequence
      let currentData: any = input;

      for (const nodeId of path.nodes) {
        const nodeStart = Date.now();
        executionPath.push(nodeId);

        try {
          currentData = await this.executeNode(nodeId, currentData, pipelineContext);

          nodeMetrics[nodeId] = {
            duration: Date.now() - nodeStart,
            success: true,
            retries: 0,
          };
        } catch (error) {
          nodeMetrics[nodeId] = {
            duration: Date.now() - nodeStart,
            success: false,
            retries: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          throw error;
        }
      }

      // Validate final output
      const validationResult = await this.validateOutput(currentData);

      const totalDuration = Date.now() - startTime;

      const result: PipelineResult = {
        success: true,
        output: currentData,
        executionPath,
        metrics: {
          totalDuration,
          nodeMetrics,
          totalCost: this.calculateTotalCost(nodeMetrics),
          tokensUsed: this.calculateTokensUsed(currentData),
        },
        validationResult,
      };

      // Collect feedback
      if (this.feedbackLoop) {
        this.feedbackLoop.collectFeedback({
          id: executionId,
          success: true,
          metrics: {
            duration: totalDuration,
            tokenUsage: result.metrics.tokensUsed,
            cost: result.metrics.totalCost,
            retries: 0,
            provider: 'pipeline',
            model: 'orchestrated',
          },
        });
      }

      return result;
    } catch (error) {
      const totalDuration = Date.now() - startTime;

      const result: PipelineResult = {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
        executionPath,
        metrics: {
          totalDuration,
          nodeMetrics,
          totalCost: 0,
          tokensUsed: 0,
        },
      };

      // Collect feedback for failure
      if (this.feedbackLoop) {
        this.feedbackLoop.collectFeedback({
          id: executionId,
          success: false,
          error: result.error,
          metrics: {
            duration: totalDuration,
            tokenUsage: 0,
            cost: 0,
            retries: 0,
            provider: 'pipeline',
            model: 'orchestrated',
          },
        });
      }

      return result;
    }
  }

  async routeRequest(input: PipelineInput): Promise<ExecutionPath> {
    // Simplified routing - use full pipeline for now
    const nodes = [
      'idea-input',
      'query-constructor',
      'prompt-optimizer',
      'jsonderulo',
      'llm-executor',
      'output-validator',
    ];

    if (this.config.enableFeedback) {
      nodes.push('feedback-loop');
    }

    return {
      nodes,
      estimatedDuration: 5000,
      estimatedCost: 0.05,
      confidence: 0.9,
    };
  }

  getHealth(): PipelineHealth {
    return { ...this.health };
  }

  private async executeNode(nodeId: string, data: any, context: PipelineContext): Promise<any> {
    const component = this.components.get(nodeId);
    if (!component) {
      throw new Error(`Component ${nodeId} not found`);
    }

    switch (nodeId) {
      case 'idea-input':
        return await component.processIdea(data);

      case 'query-constructor':
        const query = await component.constructQuery(data);
        return component.addQueryContext(
          component.optimizeForOutput(query, context.expectedOutputType),
          context
        );

      case 'prompt-optimizer':
        return await component.optimizeForModel(data.primary, 'openai', 'gpt-4o-mini');

      case 'jsonderulo':
        return await component.process({
          query: data.prompt,
          context,
          executionId: this.generateExecutionId(),
          timestamp: new Date(),
        });

      case 'llm-executor':
        return await component.execute(data.structuredPrompt, data.executionHints);

      case 'output-validator':
        const validation = await component.validateOutput(
          data.content,
          data.validationRules,
          data.schema
        );
        return validation.valid ? data : validation.repairedOutput;

      case 'feedback-loop':
        // Feedback loop processes but passes data through
        return data;

      default:
        throw new Error(`Unknown node: ${nodeId}`);
    }
  }

  private async validateOutput(output: any): Promise<any> {
    const validator = this.components.get('output-validator');
    if (!validator) return { valid: true };

    return await validator.validateOutput(output, {
      requiredFields: [],
      enableAutoRepair: true,
    });
  }

  private calculateTotalCost(nodeMetrics: Record<string, NodeMetrics>): number {
    // Simplified cost calculation
    return Object.values(nodeMetrics).reduce((total, metrics) => {
      return total + (metrics.success ? 0.01 : 0);
    }, 0);
  }

  private calculateTokensUsed(output: any): number {
    // Rough estimation
    const outputStr = JSON.stringify(output);
    return Math.ceil(outputStr.length / 4);
  }

  private initializeHealth(): PipelineHealth {
    return {
      status: 'healthy',
      components: {},
      metrics: {
        uptime: 0,
        requestsPerMinute: 0,
        errorRate: 0,
        avgLatency: 0,
      },
      lastCheck: new Date(),
    };
  }

  private startHealthMonitoring(): void {
    setInterval(() => {
      this.updateHealth();
    }, 60000); // Check every minute
  }

  private updateHealth(): void {
    const now = new Date();
    const uptime = now.getTime() - this.startTime.getTime();

    // Update component health
    for (const [nodeId, component] of this.components) {
      this.health.components[nodeId] = {
        name: nodeId,
        status: 'up', // Simplified - would check actual health
        errorRate: 0,
        avgResponseTime: 100,
      };
    }

    // Update metrics
    this.health.metrics = {
      uptime,
      requestsPerMinute: this.executionCount / (uptime / 60000),
      errorRate: 0, // Would calculate from actual errors
      avgLatency: 1000, // Would calculate from actual latencies
    };

    // Determine overall status
    const errorRate = this.health.metrics.errorRate;
    if (errorRate > 0.1) {
      this.health.status = 'unhealthy';
    } else if (errorRate > 0.05) {
      this.health.status = 'degraded';
    } else {
      this.health.status = 'healthy';
    }

    this.health.lastCheck = now;
  }

  private setupMetricsCollection(): void {
    if (!this.metricsCollector) return;

    // Connect metrics collector to all components
    for (const [nodeId, component] of this.components) {
      if (component instanceof EventEmitter) {
        component.on('pipeline-event', (event: PipelineEvent) => {
          this.metricsCollector!.emit('metric-collected', {
            nodeId,
            ...event,
          });
        });
      }
    }
  }

  private generateExecutionId(): string {
    return `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API
  shutdown(): void {
    // Clean up resources
    this.removeAllListeners();
    for (const component of this.components.values()) {
      if (component instanceof EventEmitter) {
        component.removeAllListeners();
      }
    }
  }

  getComponentStatus(nodeId: string): ComponentHealth | undefined {
    return this.health.components[nodeId];
  }

  getMetrics(): any {
    return this.metricsCollector?.generateReport();
  }

  getFeedbackInsights(): any {
    return this.feedbackLoop?.analyzePatterns();
  }
}
