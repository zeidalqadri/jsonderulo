/**
 * Complete Pipeline Demo
 * 
 * Demonstrates the full idea optimization pipeline from raw idea
 * to validated, structured output with metrics and feedback.
 */

import { PipelineOrchestrator } from '../../src/pipeline/orchestrator.js';
import { IdeaInputProcessor } from '../../src/pipeline/ideaInput.js';
import { QueryConstructor } from '../../src/pipeline/queryConstructor.js';
import { OutputValidator, BusinessRule } from '../../src/pipeline/outputValidator.js';
import { PromptOptimizer } from '../../src/pipeline/promptOptimizer.js';
import { PipelineContext } from '../../src/pipeline/types.js';

async function runCompletePipelineDemo() {
  console.log('🚀 Jsonderulo Complete Pipeline Demo\n');

  // Initialize the orchestrator
  const orchestrator = new PipelineOrchestrator({
    enableMetrics: true,
    enableFeedback: true,
    maxConcurrency: 5,
  });

  // Example ideas to process
  const ideas = [
    {
      input: 'Analyze customer feedback data to identify top 3 pain points and suggest product improvements with implementation timeline',
      context: {
        domain: 'product-development',
        expectedOutputType: 'action-items' as const,
        constraints: [
          'Must be implementable within Q1',
          'Budget constraint of $50k',
          'Should align with mobile-first strategy',
        ],
      },
    },
    {
      input: 'Create a comprehensive market analysis report for our AI-powered fitness app including competitor analysis, market size, and growth projections',
      context: {
        domain: 'market-research',
        expectedOutputType: 'structured-report' as const,
        constraints: [
          'Focus on North American market',
          'Include data from last 2 years',
          'Highlight monetization opportunities',
        ],
      },
    },
    {
      input: 'Extract and classify all technical requirements from our project documentation and create a prioritized implementation roadmap',
      context: {
        domain: 'technical-design',
        expectedOutputType: 'extraction' as const,
        constraints: [
          'Group by component/module',
          'Include effort estimates',
          'Flag dependencies',
        ],
      },
    },
  ];

  // Process each idea through the pipeline
  for (const { input, context } of ideas) {
    console.log('━'.repeat(80));
    console.log(`\n📋 Processing Idea: "${input.substring(0, 60)}..."\n`);

    try {
      // Execute the complete pipeline
      const result = await orchestrator.executePipeline(input, context);

      if (result.success) {
        console.log('✅ Pipeline Execution Successful!\n');
        
        // Display execution path
        console.log('🔄 Execution Path:');
        result.executionPath.forEach((node, idx) => {
          const metrics = result.metrics.nodeMetrics[node];
          console.log(`   ${idx + 1}. ${node} (${metrics.duration}ms)`);
        });

        // Display key metrics
        console.log('\n📊 Execution Metrics:');
        console.log(`   Total Duration: ${result.metrics.totalDuration}ms`);
        console.log(`   Total Cost: $${result.metrics.totalCost.toFixed(4)}`);
        console.log(`   Tokens Used: ${result.metrics.tokensUsed}`);

        // Display output preview
        console.log('\n📤 Output Preview:');
        console.log(JSON.stringify(result.output, null, 2).substring(0, 500) + '...\n');

        // Validation results
        if (result.validationResult) {
          console.log('✓ Validation Status:', result.validationResult.valid ? 'PASSED' : 'FAILED');
          if (result.validationResult.validationMetrics) {
            console.log(`  Overall Score: ${(result.validationResult.validationMetrics.overallScore * 100).toFixed(1)}%`);
          }
        }
      } else {
        console.log('❌ Pipeline Execution Failed:', result.error?.message);
      }
    } catch (error) {
      console.error('💥 Unexpected Error:', error);
    }
  }

  // Display pipeline health
  console.log('\n' + '━'.repeat(80));
  console.log('\n🏥 Pipeline Health Report:\n');
  
  const health = orchestrator.getHealth();
  console.log(`Status: ${health.status.toUpperCase()}`);
  console.log(`Uptime: ${Math.floor(health.metrics.uptime / 1000)}s`);
  console.log(`Requests/min: ${health.metrics.requestsPerMinute.toFixed(2)}`);
  console.log(`Error Rate: ${(health.metrics.errorRate * 100).toFixed(2)}%`);
  console.log(`Avg Latency: ${health.metrics.avgLatency}ms`);

  // Display feedback insights
  const insights = orchestrator.getFeedbackInsights();
  if (insights) {
    console.log('\n📈 Feedback Insights:\n');
    console.log(`Overall Trend: ${insights.overallTrend}`);
    
    if (insights.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      insights.recommendations.forEach((rec, idx) => {
        console.log(`   ${idx + 1}. ${rec}`);
      });
    }
  }

  // Shutdown
  orchestrator.shutdown();
  console.log('\n✨ Demo Complete!\n');
}

// Individual component demos
async function demonstrateComponents() {
  console.log('\n🧩 Individual Component Demonstrations\n');

  // 1. Idea Input Processor Demo
  console.log('1️⃣ IdeaInputProcessor Demo:');
  const ideaProcessor = new IdeaInputProcessor();
  const enrichedIdea = await ideaProcessor.processIdea(
    'Build a machine learning model to predict customer churn with 90% accuracy'
  );
  console.log(`   Category: ${enrichedIdea.category}`);
  console.log(`   Complexity: ${enrichedIdea.metadata.complexity}`);
  console.log(`   Concepts Found: ${enrichedIdea.concepts.entities.length}`);
  console.log(`   Suggested Output: ${enrichedIdea.suggestedOutputType}\n`);

  // 2. Query Constructor Demo
  console.log('2️⃣ QueryConstructor Demo:');
  const queryConstructor = new QueryConstructor();
  const structuredQuery = await queryConstructor.constructQuery(enrichedIdea);
  console.log(`   Query Score: ${queryConstructor.scoreQuery(structuredQuery).toFixed(2)}`);
  console.log(`   Components: ${structuredQuery.components.length}`);
  console.log(`   Primary Focus: ${structuredQuery.focus.primaryAction} ${structuredQuery.focus.primaryEntity}\n`);

  // 3. Output Validator Demo
  console.log('3️⃣ OutputValidator Demo:');
  const validator = new OutputValidator();
  
  // Register a business rule
  validator.registerBusinessRule('ml-model', {
    name: 'accuracy-threshold',
    description: 'Model accuracy must meet minimum threshold',
    check: (output) => output.accuracy >= 0.85,
    severity: 'critical',
    errorMessage: 'Model accuracy below required threshold',
  } as BusinessRule);

  const testOutput = {
    model: 'RandomForest',
    accuracy: 0.88,
    features: ['tenure', 'monthly_charges', 'total_charges'],
  };

  const validationResult = await validator.validateOutput(testOutput, {
    requiredFields: ['model', 'accuracy', 'features'],
    enableAutoRepair: true,
  });
  console.log(`   Validation: ${validationResult.valid ? 'PASSED' : 'FAILED'}`);
  console.log(`   Semantic Valid: ${validationResult.semanticValid}`);
  console.log(`   Business Rules: ${validationResult.businessRulesPassed ? 'PASSED' : 'FAILED'}\n`);

  // 4. Prompt Optimizer Demo
  console.log('4️⃣ PromptOptimizer Demo:');
  const optimizer = new PromptOptimizer();
  const optimizedPrompt = await optimizer.optimizeForModel(
    'Analyze the data and provide insights',
    'openai',
    'gpt-4o'
  );
  console.log(`   Original Tokens: ~${Math.ceil('Analyze the data and provide insights'.length / 4)}`);
  console.log(`   Optimized Tokens: ~${optimizedPrompt.metadata.estimatedTokens}`);
  console.log(`   Optimizations: ${optimizedPrompt.optimizations.join(', ')}`);
}

// Run the demos
async function main() {
  try {
    await runCompletePipelineDemo();
    await demonstrateComponents();
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}