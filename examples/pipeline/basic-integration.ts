/**
 * Basic Pipeline Integration Example
 * 
 * This example shows how to integrate jsonderulo as a modular component
 * in an idea optimization pipeline.
 */

import { PipelineJsonderulo } from '../../src/pipeline/index.js';
import { PipelineInput, PipelineOutput } from '../../src/pipeline/types.js';

// Example: Simple Pipeline Integration
async function runBasicPipeline() {
  console.log('🔗 Basic Pipeline Integration Example\n');

  // Initialize jsonderulo pipeline node
  const jsonderulo = new PipelineJsonderulo({
    nodeId: 'jsonderulo-001',
    enabled: true,
    config: {
      logLevel: 'info'
    }
  });

  // Example input from upstream node
  const pipelineInput: PipelineInput = {
    query: "Analyze market trends for sustainable packaging in the food industry",
    context: {
      domain: "business-analysis",
      expectedOutputType: "structured-report",
      constraints: [
        "include-data-sources",
        "quantify-impacts",
        "include-confidence"
      ],
      upstream: {
        ideaCategory: "market-research",
        queryOptimizationScore: 0.85,
        previousOutputs: {
          ideaValidation: {
            feasible: true,
            marketSize: "large",
            complexity: "medium"
          }
        }
      },
      pipelineConfig: {
        maxCost: 0.05,
        targetLatency: 5000,
        qualityPreference: 0.7,
        debugMode: false
      }
    },
    executionId: "pipeline-run-001",
    timestamp: new Date()
  };

  try {
    // Process through jsonderulo
    console.log('📥 Input Query:', pipelineInput.query);
    console.log('🎯 Expected Output:', pipelineInput.context.expectedOutputType);
    console.log('📊 Constraints:', pipelineInput.context.constraints);
    console.log('\n⚙️  Processing through jsonderulo...\n');

    const output = await jsonderulo.process(pipelineInput);

    // Display results
    console.log('✅ Processing Complete!\n');
    console.log('📋 Generated Schema:');
    console.log(JSON.stringify(output.schema, null, 2));
    console.log('\n💡 Execution Hints:');
    console.log(`  - Provider: ${output.executionHints.recommendedProvider}`);
    console.log(`  - Model: ${output.executionHints.recommendedModel}`);
    console.log(`  - Estimated Cost: $${output.executionHints.estimatedCost.toFixed(4)}`);
    console.log(`  - Expected Tokens: ${output.executionHints.expectedTokens}`);
    console.log('\n📊 Processing Metadata:');
    console.log(`  - Schema Complexity: ${output.metadata.jsonderuloProcessing.schemaComplexity}`);
    console.log(`  - Confidence Score: ${output.metadata.jsonderuloProcessing.confidenceScore}`);
    console.log(`  - Processing Time: ${output.metadata.jsonderuloProcessing.processingTime}ms`);
    console.log(`  - Schema Source: ${output.metadata.jsonderuloProcessing.schemaSource}`);

    if (output.warnings && output.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      output.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    return output;
  } catch (error) {
    console.error('❌ Pipeline Error:', error);
    throw error;
  }
}

// Example: Pipeline with Schema Hints
async function runPipelineWithHints() {
  console.log('\n\n🔗 Pipeline with Schema Hints Example\n');

  const jsonderulo = new PipelineJsonderulo();

  const pipelineInput: PipelineInput = {
    query: "Extract key financial metrics from the quarterly report",
    schemaHints: {
      expectedFields: [
        "revenue",
        "profit",
        "expenses",
        "growthRate",
        "marketShare"
      ],
      dataTypes: {
        "revenue": "number",
        "profit": "number",
        "expenses": "number",
        "growthRate": "number",
        "marketShare": "number"
      }
    },
    context: {
      domain: "financial-analysis",
      expectedOutputType: "extraction",
      constraints: ["include-confidence"],
      upstream: {
        ideaCategory: "data-analysis"
      }
    }
  };

  try {
    const output = await jsonderulo.process(pipelineInput);
    
    console.log('✅ Schema generated from hints:');
    console.log(JSON.stringify(output.schema, null, 2));
    console.log(`\n📊 Schema Source: ${output.metadata.jsonderuloProcessing.schemaSource}`);
    
    return output;
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Example: Pipeline Event Handling
async function runPipelineWithEvents() {
  console.log('\n\n🔗 Pipeline with Event Handling Example\n');

  const jsonderulo = new PipelineJsonderulo({
    eventHandlers: {
      onInput: (input) => {
        console.log('📥 [Event] Input received:', input.query);
      },
      onOutput: (output) => {
        console.log('📤 [Event] Output ready, schema complexity:', 
                   output.metadata.jsonderuloProcessing.schemaComplexity);
      },
      onError: (error) => {
        console.error('❌ [Event] Error occurred:', error.message);
      },
      onMetrics: (metrics) => {
        console.log('📊 [Event] Metrics update:');
        console.log(`  - Requests: ${metrics.requestsProcessed}`);
        console.log(`  - Avg Time: ${metrics.avgProcessingTime.toFixed(2)}ms`);
      }
    }
  });

  // Listen for all pipeline events
  jsonderulo.on('pipeline-event', (event) => {
    console.log(`🔔 [Pipeline Event] ${event.type} at ${event.timestamp.toISOString()}`);
  });

  const pipelineInput: PipelineInput = {
    query: "Classify customer feedback into categories with sentiment analysis",
    context: {
      domain: "customer-analytics",
      expectedOutputType: "classification",
      constraints: [],
      upstream: {
        ideaCategory: "data-analysis",
        queryOptimizationScore: 0.9
      }
    }
  };

  try {
    await jsonderulo.process(pipelineInput);
  } catch (error) {
    console.error('Pipeline error:', error);
  }
}

// Example: Simulating Full Pipeline Flow
async function simulateFullPipeline() {
  console.log('\n\n🔗 Full Pipeline Simulation\n');

  // Simulate upstream nodes
  const ideaInput = {
    rawIdea: "I want to understand how AI is impacting healthcare costs",
    timestamp: new Date()
  };

  console.log('💡 [Idea Input Node]:', ideaInput.rawIdea);

  // Query construction (simulated)
  const constructedQuery = {
    query: "Analyze the impact of AI adoption on healthcare costs, including implementation expenses, operational savings, and patient outcome improvements",
    keywords: ["AI", "healthcare", "costs", "ROI", "patient outcomes"]
  };

  console.log('🔨 [Query Construction Node]:', constructedQuery.query);

  // Prompt optimization (simulated)
  const optimizedPrompt = {
    query: constructedQuery.query,
    optimizationScore: 0.88,
    suggestedConstraints: ["include-data-sources", "quantify-impacts"]
  };

  console.log('⚡ [Prompt Optimization Node]: Score =', optimizedPrompt.optimizationScore);

  // Jsonderulo processing
  const jsonderulo = new PipelineJsonderulo();
  
  const pipelineInput: PipelineInput = {
    query: optimizedPrompt.query,
    context: {
      domain: "healthcare-analysis",
      expectedOutputType: "analysis",
      constraints: optimizedPrompt.suggestedConstraints,
      upstream: {
        ideaCategory: "data-analysis",
        queryOptimizationScore: optimizedPrompt.optimizationScore,
        metadata: {
          keywords: constructedQuery.keywords
        }
      },
      pipelineConfig: {
        qualityPreference: 0.8,
        maxCost: 0.10
      }
    }
  };

  const jsonderuloOutput = await jsonderulo.process(pipelineInput);
  
  console.log('\n🎵 [Jsonderulo Node]: Schema ready');
  console.log('  - Complexity:', jsonderuloOutput.metadata.jsonderuloProcessing.schemaComplexity);
  console.log('  - Provider:', jsonderuloOutput.executionHints.recommendedProvider);

  // Simulate LLM execution (would use actual LLM in real pipeline)
  console.log('\n🤖 [LLM Execution Node]: Generating response...');
  console.log('  - Using schema validation');
  console.log('  - Estimated tokens:', jsonderuloOutput.executionHints.expectedTokens);

  // Output validation (simulated)
  console.log('\n✅ [Validation Node]: Response validated against schema');
  console.log('  - All required fields present');
  console.log('  - Data types match schema');

  console.log('\n🎯 Pipeline execution complete!');
}

// Run all examples
async function runAllExamples() {
  try {
    await runBasicPipeline();
    await runPipelineWithHints();
    await runPipelineWithEvents();
    await simulateFullPipeline();
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

export {
  runBasicPipeline,
  runPipelineWithHints,
  runPipelineWithEvents,
  simulateFullPipeline
};