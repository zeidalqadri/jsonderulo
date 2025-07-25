/**
 * Pipeline Metrics and Monitoring Example
 * 
 * Demonstrates how to use the metrics and monitoring capabilities
 * of jsonderulo in a pipeline context.
 */

import { PipelineJsonderulo } from '../../src/pipeline/index.js';
import { PipelineMetricsCollector } from '../../src/pipeline/metrics.js';
import { PipelineInput, PipelineEvent } from '../../src/pipeline/types.js';

/**
 * Example: Real-time Metrics Monitoring
 */
async function runMetricsMonitoring() {
  console.log('📊 Real-time Metrics Monitoring Example\n');

  // Create metrics collector
  const metricsCollector = new PipelineMetricsCollector();
  
  // Create jsonderulo instance
  const jsonderulo = new PipelineJsonderulo();

  // Connect metrics collector to pipeline events
  jsonderulo.on('pipeline-event', (event: PipelineEvent) => {
    metricsCollector.recordEvent(event);
  });

  // Set up real-time monitoring
  metricsCollector.on('metric-event', (event: PipelineEvent) => {
    if (event.type === 'output-ready') {
      const metrics = metricsCollector.getMetrics();
      console.log(`📈 [${new Date().toISOString()}] Request #${metrics.requestsProcessed} completed`);
      console.log(`   Avg Response Time: ${metrics.avgProcessingTime.toFixed(2)}ms`);
      console.log(`   Total Cost: $${metrics.costMetrics.totalCost.toFixed(4)}`);
    }
  });

  // Simulate various workloads
  const workloads = [
    // Simple requests
    ...Array(5).fill(null).map((_, i) => ({
      name: `Simple Request ${i + 1}`,
      input: createPipelineInput('Extract product name from description', 'extraction', [])
    })),
    
    // Medium complexity
    ...Array(3).fill(null).map((_, i) => ({
      name: `Medium Request ${i + 1}`,
      input: createPipelineInput(
        'Analyze customer feedback with sentiment and categories',
        'analysis',
        ['include-confidence']
      )
    })),
    
    // Complex requests
    ...Array(2).fill(null).map((_, i) => ({
      name: `Complex Request ${i + 1}`,
      input: createPipelineInput(
        'Generate comprehensive market report with trends, competitors, and projections',
        'structured-report',
        ['include-data-sources', 'quantify-impacts', 'include-confidence']
      )
    }))
  ];

  console.log(`🚀 Running ${workloads.length} requests...\n`);

  // Process workloads
  for (const workload of workloads) {
    console.log(`\n⚡ Processing: ${workload.name}`);
    try {
      await jsonderulo.process(workload.input);
      await sleep(100); // Small delay for visibility
    } catch (error) {
      console.error(`❌ Error: ${error}`);
    }
  }

  // Display final metrics
  console.log('\n\n📊 Final Metrics Summary');
  console.log('========================');
  
  const finalMetrics = metricsCollector.getMetrics();
  const performance = metricsCollector.getPerformanceMetrics();
  const costProjection = metricsCollector.getCostProjection();
  const health = metricsCollector.getHealthStatus();

  console.log(`\nRequests: ${finalMetrics.requestsProcessed}`);
  console.log(`Success Rate: ${(finalMetrics.successRate * 100).toFixed(1)}%`);
  console.log(`\nPerformance:`);
  console.log(`  P50: ${performance.p50ResponseTime.toFixed(2)}ms`);
  console.log(`  P95: ${performance.p95ResponseTime.toFixed(2)}ms`);
  console.log(`  P99: ${performance.p99ResponseTime.toFixed(2)}ms`);
  console.log(`  Throughput: ${performance.throughput.toFixed(2)} req/s`);
  console.log(`\nCost Analysis:`);
  console.log(`  Total: $${finalMetrics.costMetrics.totalCost.toFixed(4)}`);
  console.log(`  Per Request: $${finalMetrics.costMetrics.avgCostPerRequest.toFixed(6)}`);
  console.log(`  Projected Daily: $${costProjection.daily.toFixed(2)}`);
  console.log(`  Projected Monthly: $${costProjection.monthly.toFixed(2)}`);
  console.log(`\nHealth Status: ${health.status.toUpperCase()}`);
  if (health.issues.length > 0) {
    console.log('Issues:');
    health.issues.forEach(issue => console.log(`  - ${issue}`));
  }

  return metricsCollector;
}

/**
 * Example: Performance Testing with Load Simulation
 */
async function runPerformanceTest() {
  console.log('\n\n🏃 Performance Testing Example\n');

  const metricsCollector = new PipelineMetricsCollector();
  const jsonderulo = new PipelineJsonderulo();

  jsonderulo.on('pipeline-event', (event) => {
    metricsCollector.recordEvent(event);
  });

  // Configure load test
  const testConfig = {
    duration: 10000, // 10 seconds
    targetRPS: 5,    // 5 requests per second
    rampUp: 2000    // 2 second ramp up
  };

  console.log(`📋 Test Configuration:`);
  console.log(`  Duration: ${testConfig.duration / 1000}s`);
  console.log(`  Target RPS: ${testConfig.targetRPS}`);
  console.log(`  Ramp Up: ${testConfig.rampUp / 1000}s\n`);

  const startTime = Date.now();
  let requestCount = 0;
  let errors = 0;

  // Progress tracking
  const progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = (elapsed / testConfig.duration) * 100;
    const currentRPS = requestCount / (elapsed / 1000);
    process.stdout.write(`\r⏱️  Progress: ${progress.toFixed(1)}% | RPS: ${currentRPS.toFixed(2)} | Requests: ${requestCount} | Errors: ${errors}`);
  }, 100);

  // Load generation loop
  while (Date.now() - startTime < testConfig.duration) {
    const elapsed = Date.now() - startTime;
    const rampProgress = Math.min(1, elapsed / testConfig.rampUp);
    const currentTargetRPS = testConfig.targetRPS * rampProgress;
    const delay = 1000 / currentTargetRPS;

    // Generate request
    const input = createRandomPipelineInput();
    
    // Process async without waiting
    jsonderulo.process(input)
      .then(() => requestCount++)
      .catch(() => errors++);

    await sleep(delay);
  }

  clearInterval(progressInterval);
  console.log('\n\n⏹️  Load test completed, waiting for pending requests...');
  
  // Wait for pending requests
  await sleep(2000);

  // Generate report
  console.log('\n📊 Performance Test Report');
  console.log('=========================');
  console.log(metricsCollector.generateReport());

  return metricsCollector;
}

/**
 * Example: Metrics Dashboard Simulation
 */
async function runMetricsDashboard() {
  console.log('\n\n📊 Metrics Dashboard Simulation\n');

  const metricsCollector = new PipelineMetricsCollector();
  const jsonderulo = new PipelineJsonderulo();

  jsonderulo.on('pipeline-event', (event) => {
    metricsCollector.recordEvent(event);
  });

  // Dashboard update function
  function updateDashboard() {
    console.clear();
    console.log('📊 JSONDERULO PIPELINE METRICS DASHBOARD');
    console.log('=' .repeat(50));
    console.log(`Last Update: ${new Date().toLocaleTimeString()}`);
    
    const metrics = metricsCollector.getMetrics();
    const perf = metricsCollector.getPerformanceMetrics();
    const cost = metricsCollector.getCostProjection();
    const health = metricsCollector.getHealthStatus();

    // Status indicator
    const statusIcon = health.status === 'healthy' ? '🟢' : 
                      health.status === 'degraded' ? '🟡' : '🔴';
    console.log(`\nSystem Status: ${statusIcon} ${health.status.toUpperCase()}`);

    // Key metrics
    console.log('\n📈 KEY METRICS');
    console.log(`Requests: ${metrics.requestsProcessed} | Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);
    console.log(`Avg Response: ${metrics.avgProcessingTime.toFixed(0)}ms | P95: ${perf.p95ResponseTime.toFixed(0)}ms`);
    console.log(`Cost/Request: $${metrics.costMetrics.avgCostPerRequest.toFixed(6)}`);

    // Schema distribution
    console.log('\n📋 SCHEMA GENERATION');
    const total = Object.values(metrics.schemaMetrics).reduce((a, b) => a + b, 0);
    if (total > 0) {
      console.log(`Inferred: ${((metrics.schemaMetrics.inferredCount / total) * 100).toFixed(0)}%`);
      console.log(`Explicit: ${((metrics.schemaMetrics.explicitCount / total) * 100).toFixed(0)}%`);
      console.log(`Template: ${((metrics.schemaMetrics.templateCount / total) * 100).toFixed(0)}%`);
      console.log(`Hybrid: ${((metrics.schemaMetrics.hybridCount / total) * 100).toFixed(0)}%`);
    }

    // Cost breakdown
    console.log('\n💰 COST ANALYSIS');
    console.log(`Total: $${metrics.costMetrics.totalCost.toFixed(4)}`);
    console.log(`Projected Daily: $${cost.daily.toFixed(2)}`);
    console.log(`Projected Monthly: $${cost.monthly.toFixed(2)}`);

    // Provider usage
    if (Object.keys(metrics.costMetrics.costByProvider).length > 0) {
      console.log('\nProvider Distribution:');
      Object.entries(metrics.costMetrics.costByProvider).forEach(([provider, providerCost]) => {
        const percentage = (providerCost / metrics.costMetrics.totalCost) * 100;
        console.log(`  ${provider}: ${percentage.toFixed(1)}% ($${providerCost.toFixed(4)})`);
      });
    }

    // Health issues
    if (health.issues.length > 0) {
      console.log('\n⚠️  ISSUES');
      health.issues.forEach(issue => console.log(`- ${issue}`));
    }

    console.log('\n[Press Ctrl+C to stop]');
  }

  // Update dashboard every second
  const dashboardInterval = setInterval(updateDashboard, 1000);

  // Generate continuous load
  console.log('Starting continuous load generation...');
  
  const loadGenerator = setInterval(async () => {
    const batchSize = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < batchSize; i++) {
      const input = createRandomPipelineInput();
      jsonderulo.process(input).catch(() => {});
    }
  }, 500);

  // Run for 30 seconds
  await sleep(30000);

  clearInterval(dashboardInterval);
  clearInterval(loadGenerator);

  console.clear();
  console.log('Dashboard simulation completed.');
  
  return metricsCollector;
}

/**
 * Example: Metrics Export and Analysis
 */
async function runMetricsExport() {
  console.log('\n\n📤 Metrics Export Example\n');

  const metricsCollector = new PipelineMetricsCollector();
  const jsonderulo = new PipelineJsonderulo();

  jsonderulo.on('pipeline-event', (event) => {
    metricsCollector.recordEvent(event);
  });

  // Generate some test data
  console.log('Generating test data...');
  for (let i = 0; i < 20; i++) {
    const input = createRandomPipelineInput();
    try {
      await jsonderulo.process(input);
    } catch (error) {
      // Ignore errors for this example
    }
  }

  // Export metrics
  const exportData = metricsCollector.exportMetrics();
  
  console.log('\n📊 Exported Metrics:');
  console.log(JSON.stringify(exportData, null, 2));

  // Demonstrate how to save to file (commented out to avoid file creation)
  console.log('\n💾 To save metrics to file:');
  console.log('```javascript');
  console.log('import { writeFileSync } from "fs";');
  console.log('const exportData = metricsCollector.exportMetrics();');
  console.log('writeFileSync("pipeline-metrics.json", JSON.stringify(exportData, null, 2));');
  console.log('```');

  // Show CSV export example
  console.log('\n📊 CSV Export Example:');
  const csvData = [
    ['Metric', 'Value'],
    ['Total Requests', exportData.metrics.requestsProcessed],
    ['Success Rate', (exportData.metrics.successRate * 100).toFixed(1) + '%'],
    ['Avg Response Time', exportData.metrics.avgProcessingTime.toFixed(2) + 'ms'],
    ['Total Cost', '$' + exportData.metrics.costMetrics.totalCost.toFixed(4)],
    ['P95 Response Time', exportData.performance.p95ResponseTime.toFixed(2) + 'ms'],
    ['Throughput', exportData.performance.throughput.toFixed(2) + ' req/s']
  ];

  console.log(csvData.map(row => row.join(',')).join('\n'));

  return metricsCollector;
}

// Helper functions
function createPipelineInput(
  query: string,
  outputType: any,
  constraints: string[]
): PipelineInput {
  return {
    query,
    context: {
      domain: 'general',
      expectedOutputType: outputType,
      constraints,
      upstream: {
        queryOptimizationScore: 0.7 + Math.random() * 0.3
      },
      pipelineConfig: {
        qualityPreference: Math.random(),
        maxCost: 0.1
      }
    }
  };
}

function createRandomPipelineInput(): PipelineInput {
  const queries = [
    'Extract key information from text',
    'Classify this document',
    'Analyze market trends',
    'Generate action items',
    'Create structured report'
  ];
  
  const outputTypes = [
    'extraction',
    'classification',
    'analysis',
    'action-items',
    'structured-report'
  ];
  
  const possibleConstraints = [
    'include-confidence',
    'include-data-sources',
    'quantify-impacts'
  ];

  const query = queries[Math.floor(Math.random() * queries.length)];
  const outputType = outputTypes[Math.floor(Math.random() * outputTypes.length)];
  const constraintCount = Math.floor(Math.random() * 3);
  const constraints = possibleConstraints
    .sort(() => Math.random() - 0.5)
    .slice(0, constraintCount);

  return createPipelineInput(query, outputType, constraints);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run all metrics examples
async function runAllMetricsExamples() {
  try {
    await runMetricsMonitoring();
    await runPerformanceTest();
    await runMetricsDashboard();
    await runMetricsExport();
  } catch (error) {
    console.error('Metrics example failed:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllMetricsExamples();
}

export {
  runMetricsMonitoring,
  runPerformanceTest,
  runMetricsDashboard,
  runMetricsExport
};