/**
 * Advanced Pipeline Integration Examples
 * 
 * Shows advanced usage patterns including custom adapters,
 * multi-node pipelines, and real-world integration scenarios.
 */

import { EventEmitter } from 'events';
import { PipelineJsonderulo } from '../../src/pipeline/index.js';
import { 
  PipelineInput, 
  PipelineOutput, 
  PipelineAdapter,
  PipelineNodeConfig,
  PipelineNodeType 
} from '../../src/pipeline/types.js';

/**
 * Custom Pipeline Adapter for Integration
 */
class CustomPipelineAdapter implements PipelineAdapter {
  adaptInput(upstreamOutput: any): PipelineInput {
    // Transform upstream output to jsonderulo input format
    return {
      query: upstreamOutput.processedQuery || upstreamOutput.query,
      schemaHints: upstreamOutput.schemaHints,
      context: {
        domain: upstreamOutput.domain || 'general',
        expectedOutputType: upstreamOutput.outputType || 'structured-report',
        constraints: upstreamOutput.constraints || [],
        upstream: {
          ideaCategory: upstreamOutput.category,
          queryOptimizationScore: upstreamOutput.score,
          previousOutputs: upstreamOutput.previousResults,
          metadata: upstreamOutput.metadata
        },
        pipelineConfig: upstreamOutput.config
      },
      executionId: upstreamOutput.executionId,
      timestamp: new Date()
    };
  }

  adaptOutput(pipelineOutput: PipelineOutput): any {
    // Transform jsonderulo output for downstream consumption
    return {
      structuredPrompt: pipelineOutput.structuredPrompt,
      schema: pipelineOutput.schema,
      validation: {
        rules: pipelineOutput.validationRules,
        autoRepair: pipelineOutput.validationRules.enableAutoRepair
      },
      execution: {
        provider: pipelineOutput.executionHints.recommendedProvider,
        model: pipelineOutput.executionHints.recommendedModel,
        estimatedCost: pipelineOutput.executionHints.estimatedCost,
        streaming: pipelineOutput.executionHints.enableStreaming
      },
      metadata: {
        ...pipelineOutput.metadata,
        timestamp: pipelineOutput.timestamp,
        executionId: pipelineOutput.executionId
      }
    };
  }

  validateCompatibility(upstreamNode?: PipelineNodeConfig, downstreamNode?: PipelineNodeConfig): boolean {
    // Validate that nodes are compatible
    if (!upstreamNode || !downstreamNode) return true;

    // Check if upstream produces what jsonderulo expects
    if (upstreamNode.nodeType === 'prompt-optimization' && 
        downstreamNode.nodeType === 'llm-execution') {
      return true;
    }

    return false;
  }
}

/**
 * Pipeline Orchestrator - Manages multiple nodes
 */
class PipelineOrchestrator extends EventEmitter {
  private nodes: Map<string, any> = new Map();
  private connections: Array<{ from: string; to: string; adapter?: PipelineAdapter }> = [];

  addNode(id: string, node: any): void {
    this.nodes.set(id, node);
  }

  connect(fromId: string, toId: string, adapter?: PipelineAdapter): void {
    this.connections.push({ from: fromId, to: toId, adapter });
  }

  async execute(input: any): Promise<any> {
    let currentData = input;
    
    // Execute through connected nodes
    for (const connection of this.connections) {
      const fromNode = this.nodes.get(connection.from);
      const toNode = this.nodes.get(connection.to);

      if (!fromNode || !toNode) continue;

      // Process through current node
      const output = await fromNode.process(currentData);

      // Adapt output if adapter provided
      if (connection.adapter) {
        currentData = connection.adapter.adaptInput(output);
      } else {
        currentData = output;
      }

      this.emit('node-executed', {
        nodeId: connection.from,
        output,
        timestamp: new Date()
      });
    }

    return currentData;
  }
}

/**
 * Example: Multi-Node Pipeline with Jsonderulo
 */
async function runMultiNodePipeline() {
  console.log('🔗 Multi-Node Pipeline Example\n');

  // Create pipeline nodes
  const orchestrator = new PipelineOrchestrator();
  const adapter = new CustomPipelineAdapter();

  // Mock upstream node (Query Optimizer)
  const queryOptimizer = {
    async process(input: any) {
      console.log('📝 [Query Optimizer] Processing:', input.query);
      return {
        processedQuery: `Optimized: ${input.query}`,
        domain: 'business-analysis',
        outputType: 'structured-report',
        constraints: ['include-data-sources', 'quantify-impacts'],
        score: 0.92,
        category: 'market-research',
        config: {
          qualityPreference: 0.8,
          maxCost: 0.1
        }
      };
    }
  };

  // Jsonderulo node
  const jsonderulo = new PipelineJsonderulo({
    nodeId: 'jsonderulo-structure',
    eventHandlers: {
      onOutput: (output) => {
        console.log('🎵 [Jsonderulo] Schema generated, complexity:', 
                   output.metadata.jsonderuloProcessing.schemaComplexity);
      }
    }
  });

  // Mock downstream node (LLM Executor)
  const llmExecutor = {
    async process(input: any) {
      console.log('🤖 [LLM Executor] Executing with provider:', input.execution.provider);
      console.log('   Schema fields:', Object.keys(input.schema.properties || {}));
      return {
        response: { /* LLM response */ },
        validated: true,
        cost: input.execution.estimatedCost
      };
    }
  };

  // Set up pipeline
  orchestrator.addNode('optimizer', queryOptimizer);
  orchestrator.addNode('jsonderulo', jsonderulo);
  orchestrator.addNode('executor', llmExecutor);

  orchestrator.connect('optimizer', 'jsonderulo', adapter);
  orchestrator.connect('jsonderulo', 'executor', adapter);

  // Listen for events
  orchestrator.on('node-executed', (event) => {
    console.log(`✅ Node '${event.nodeId}' completed at ${event.timestamp.toISOString()}`);
  });

  // Execute pipeline
  try {
    const initialInput = {
      query: "Analyze competitive landscape for renewable energy storage solutions"
    };

    console.log('🚀 Starting pipeline execution...\n');
    const result = await orchestrator.execute(initialInput);
    console.log('\n✨ Pipeline completed successfully!');
    
    return result;
  } catch (error) {
    console.error('❌ Pipeline error:', error);
  }
}

/**
 * Example: Dynamic Pipeline Configuration
 */
async function runDynamicPipeline() {
  console.log('\n\n🔗 Dynamic Pipeline Configuration Example\n');

  const jsonderulo = new PipelineJsonderulo();

  // Function to determine pipeline configuration based on input
  function configurePipeline(rawIdea: string): PipelineInput {
    const idea = rawIdea.toLowerCase();
    
    // Determine domain
    let domain = 'general';
    if (idea.includes('market') || idea.includes('business')) domain = 'business-analysis';
    else if (idea.includes('technical') || idea.includes('code')) domain = 'technical-design';
    else if (idea.includes('data') || idea.includes('analytics')) domain = 'data-analysis';

    // Determine output type
    let outputType: any = 'structured-report';
    if (idea.includes('extract')) outputType = 'extraction';
    else if (idea.includes('classify')) outputType = 'classification';
    else if (idea.includes('action') || idea.includes('todo')) outputType = 'action-items';

    // Determine constraints
    const constraints: string[] = [];
    if (idea.includes('source') || idea.includes('reference')) {
      constraints.push('include-data-sources');
    }
    if (idea.includes('impact') || idea.includes('effect')) {
      constraints.push('quantify-impacts');
    }
    if (idea.includes('confident') || idea.includes('certain')) {
      constraints.push('include-confidence');
    }

    return {
      query: rawIdea,
      context: {
        domain,
        expectedOutputType: outputType,
        constraints,
        upstream: {
          ideaCategory: domain === 'business-analysis' ? 'market-research' : 'data-analysis',
          queryOptimizationScore: 0.8 + Math.random() * 0.2 // Simulate score
        },
        pipelineConfig: {
          qualityPreference: constraints.length > 1 ? 0.8 : 0.5,
          debugMode: idea.includes('debug') || idea.includes('explain')
        }
      }
    };
  }

  // Test different idea types
  const ideas = [
    "Extract key market trends from industry reports with data sources",
    "Classify customer feedback with confidence scores",
    "Generate action items for product launch with impact analysis",
    "Analyze technical architecture with detailed explanations (debug mode)"
  ];

  for (const idea of ideas) {
    console.log(`\n💡 Processing: "${idea}"`);
    
    const pipelineInput = configurePipeline(idea);
    console.log(`📊 Configured as: ${pipelineInput.context.domain} / ${pipelineInput.context.expectedOutputType}`);
    console.log(`🎯 Constraints: ${pipelineInput.context.constraints.join(', ') || 'none'}`);
    
    try {
      const output = await jsonderulo.process(pipelineInput);
      console.log(`✅ Schema ready - ${Object.keys(output.schema.properties || {}).length} fields`);
    } catch (error) {
      console.error(`❌ Error: ${error}`);
    }
  }
}

/**
 * Example: Pipeline with Metrics and Monitoring
 */
async function runMonitoredPipeline() {
  console.log('\n\n🔗 Pipeline with Metrics and Monitoring Example\n');

  const jsonderulo = new PipelineJsonderulo();
  const metricsCollector = {
    processingTimes: [] as number[],
    complexityScores: [] as string[],
    costs: [] as number[],
    errors: 0
  };

  // Set up monitoring
  jsonderulo.on('pipeline-event', (event) => {
    switch (event.type) {
      case 'processing-started':
        console.log('⏱️  Processing started:', new Date().toISOString());
        break;
      case 'schema-generated':
        console.log('📋 Schema generated, source:', event.payload.schemaSource);
        break;
      case 'output-ready':
        const output = event.payload.output as PipelineOutput;
        metricsCollector.processingTimes.push(
          output.metadata.jsonderuloProcessing.processingTime
        );
        metricsCollector.complexityScores.push(
          output.metadata.jsonderuloProcessing.schemaComplexity
        );
        metricsCollector.costs.push(output.executionHints.estimatedCost);
        break;
      case 'error':
        metricsCollector.errors++;
        console.error('❌ Error:', event.error?.message);
        break;
    }
  });

  // Run multiple requests
  const requests = [
    {
      query: "Simple extraction of product names",
      outputType: "extraction" as const
    },
    {
      query: "Complex market analysis with multiple data points and trends",
      outputType: "analysis" as const
    },
    {
      query: "Generate detailed action items with dependencies and timelines",
      outputType: "action-items" as const
    }
  ];

  for (const request of requests) {
    const input: PipelineInput = {
      query: request.query,
      context: {
        domain: 'general',
        expectedOutputType: request.outputType,
        constraints: [],
        upstream: {}
      }
    };

    try {
      await jsonderulo.process(input);
    } catch (error) {
      console.error('Request failed:', error);
    }
  }

  // Display metrics
  console.log('\n📊 Pipeline Metrics Summary:');
  console.log('═══════════════════════════');
  console.log(`Total Requests: ${metricsCollector.processingTimes.length}`);
  console.log(`Errors: ${metricsCollector.errors}`);
  console.log(`Avg Processing Time: ${
    (metricsCollector.processingTimes.reduce((a, b) => a + b, 0) / 
     metricsCollector.processingTimes.length).toFixed(2)
  }ms`);
  console.log(`Total Estimated Cost: $${
    metricsCollector.costs.reduce((a, b) => a + b, 0).toFixed(4)
  }`);
  console.log(`Complexity Distribution: ${
    metricsCollector.complexityScores.reduce((acc, c) => {
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  }`);

  // Get built-in metrics
  const builtinMetrics = jsonderulo.getMetrics();
  console.log('\n📈 Built-in Metrics:');
  console.log(`Success Rate: ${(builtinMetrics.successRate * 100).toFixed(1)}%`);
  console.log(`Schema Sources: ${JSON.stringify(builtinMetrics.schemaMetrics)}`);
}

/**
 * Example: Error Handling and Recovery
 */
async function runErrorHandlingPipeline() {
  console.log('\n\n🔗 Error Handling and Recovery Example\n');

  const jsonderulo = new PipelineJsonderulo();

  // Test various error scenarios
  const errorScenarios = [
    {
      name: "Invalid domain",
      input: {
        query: "Test query",
        context: {
          domain: "invalid-domain",
          expectedOutputType: "analysis" as const,
          constraints: [],
          upstream: {}
        }
      }
    },
    {
      name: "Missing required context",
      input: {
        query: "",
        context: null as any
      }
    },
    {
      name: "Extremely complex requirements",
      input: {
        query: "Generate a schema with 100 nested levels",
        schemaHints: {
          expectedFields: Array(100).fill(null).map((_, i) => `field${i}`),
        },
        context: {
          domain: "general",
          expectedOutputType: "generation" as const,
          constraints: Array(20).fill("complex-constraint"),
          upstream: {}
        }
      }
    }
  ];

  for (const scenario of errorScenarios) {
    console.log(`\n🧪 Testing: ${scenario.name}`);
    
    try {
      await jsonderulo.process(scenario.input as PipelineInput);
      console.log('✅ Handled successfully');
    } catch (error) {
      console.log('❌ Error caught:', error instanceof Error ? error.message : error);
      
      // Demonstrate recovery
      console.log('🔄 Attempting recovery...');
      
      // Create fallback input
      const fallbackInput: PipelineInput = {
        query: scenario.input.query || "Fallback query",
        context: {
          domain: "general",
          expectedOutputType: "structured-report",
          constraints: [],
          upstream: {},
          pipelineConfig: {
            debugMode: true // Enable debug for recovery
          }
        }
      };
      
      try {
        const recovered = await jsonderulo.process(fallbackInput);
        console.log('✅ Recovery successful, schema generated');
      } catch (recoveryError) {
        console.log('❌ Recovery also failed');
      }
    }
  }
}

// Run all advanced examples
async function runAllAdvancedExamples() {
  try {
    await runMultiNodePipeline();
    await runDynamicPipeline();
    await runMonitoredPipeline();
    await runErrorHandlingPipeline();
  } catch (error) {
    console.error('Advanced example failed:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllAdvancedExamples();
}

export {
  CustomPipelineAdapter,
  PipelineOrchestrator,
  runMultiNodePipeline,
  runDynamicPipeline,
  runMonitoredPipeline,
  runErrorHandlingPipeline
};