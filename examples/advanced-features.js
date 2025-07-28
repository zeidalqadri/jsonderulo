/**
 * Advanced Features Examples for Enhanced Jsonderulo V2
 * 
 * Demonstrates:
 * - Context-aware prompting
 * - Chain of Thought and Tree of Thoughts
 * - Self-consistency checking
 * - JSON streaming
 * - A/B testing
 * - Quality tracking
 */

import { EnhancedJsonderuloV2 } from '../src/core/enhancedJsonderuloV2.js';
import { z } from 'zod';

// Initialize enhanced jsonderulo
const jsonderulo = new EnhancedJsonderuloV2();

console.log('🎵 Enhanced Jsonderulo V2 - Advanced Features Demo\n');

// Example 1: Context-Aware Prompting
async function contextAwareExample() {
  console.log('1️⃣ Context-Aware Prompting Example');
  console.log('=====================================\n');

  // Add context about user preferences and previous interactions
  jsonderulo.addContext(
    'User prefers detailed technical explanations with examples',
    'user_input'
  );
  jsonderulo.addContext(
    'Previous API design used REST with JSON responses',
    'assistant_output'
  );
  jsonderulo.addContext(
    'Company coding standards: Use TypeScript, follow Clean Architecture',
    'reference'
  );

  // Generate context-aware prompt
  const result = await jsonderulo.speakEnhanced(
    'Design a new API endpoint for user authentication',
    'API endpoint specification with method, path, headers, request/response schemas',
    {
      enableContext: true,
      semanticSearch: true,
      includeExamples: true,
    }
  );

  console.log('Generated Prompt (with context):');
  console.log(result.prompt);
  console.log('\nContext Used:', result.context?.entries.length, 'entries');
  console.log('Context Tokens:', result.context?.totalTokens);
  console.log('\n---\n');
}

// Example 2: Chain of Thought (CoT) Prompting
async function chainOfThoughtExample() {
  console.log('2️⃣ Chain of Thought (CoT) Example');
  console.log('====================================\n');

  const schema = z.object({
    problem: z.string(),
    analysis: z.object({
      steps: z.array(z.object({
        step: z.number(),
        description: z.string(),
        reasoning: z.string(),
      })),
      conclusion: z.string(),
    }),
    solution: z.object({
      approach: z.string(),
      implementation: z.string(),
      tradeoffs: z.array(z.string()),
    }),
  });

  const result = await jsonderulo.speakEnhanced(
    'Analyze the performance bottleneck in a web application with slow database queries',
    JSON.stringify(schema),
    {
      strategy: 'cot',
      enableCoT: true,
    }
  );

  console.log('CoT-Enhanced Prompt:');
  console.log(result.prompt);
  console.log('\nReasoning Steps:', result.reasoning?.steps?.length);
  console.log('\n---\n');
}

// Example 3: Tree of Thoughts (ToT) for Complex Problems
async function treeOfThoughtsExample() {
  console.log('3️⃣ Tree of Thoughts (ToT) Example');
  console.log('====================================\n');

  const result = await jsonderulo.speakEnhanced(
    'Find the optimal data structure for a real-time collaborative text editor',
    undefined,
    {
      strategy: 'tot',
      enableToT: true,
    }
  );

  console.log('ToT-Enhanced Prompt:');
  console.log(result.prompt.substring(0, 500) + '...');
  console.log('\nPrompt explores multiple solution paths');
  console.log('\n---\n');
}

// Example 4: Self-Consistency for Reliability
async function selfConsistencyExample() {
  console.log('4️⃣ Self-Consistency Example');
  console.log('=============================\n');

  // Mock LLM function that returns slightly different outputs
  const mockLLM = async (prompt) => {
    const responses = [
      '{"name": "John Doe", "age": 30, "role": "Developer", "skills": ["JavaScript", "Python"]}',
      '{"name": "John Doe", "age": 30, "role": "Developer", "skills": ["JavaScript", "Python", "Go"]}',
      '{"name": "John Doe", "age": 30, "role": "Developer", "skills": ["JavaScript", "Python"]}',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const result = await jsonderulo.processWithConsistency(
    'Generate a user profile for a software developer',
    mockLLM,
    {
      selfConsistency: true,
      consistencyRounds: 3,
    }
  );

  console.log('Consistency Analysis:');
  console.log('Success:', result.success);
  console.log('Confidence Score:', result.consistency?.confidenceScore.toFixed(2));
  console.log('Consensus Output:', JSON.stringify(result.data, null, 2));
  if (result.consistency?.variations.length > 0) {
    console.log('\nVariations Found:');
    result.consistency.variations.forEach(v => {
      console.log(`- ${v.field}: ${JSON.stringify(v.values)}`);
    });
  }
  console.log('\n---\n');
}

// Example 5: JSON Streaming with Progressive Validation
async function streamingExample() {
  console.log('5️⃣ JSON Streaming Example');
  console.log('===========================\n');

  const schema = z.object({
    products: z.array(z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      inStock: z.boolean(),
    })),
    total: z.number(),
  });

  // Mock streaming function
  async function* mockStreamingLLM(prompt) {
    const chunks = [
      '{"products": [',
      '{"id": "1", "name": "Laptop",',
      ' "price": 999.99, "inStock": true},',
      '{"id": "2", "name": "Mouse",',
      ' "price": 29.99, "inStock": false}',
      '], "total": 1029.98}',
    ];
    
    for (const chunk of chunks) {
      yield chunk;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('Streaming JSON generation with validation...');
  let chunkCount = 0;
  
  for await (const result of jsonderulo.streamJSON(
    'Generate a product catalog',
    mockStreamingLLM,
    schema,
    { streaming: true }
  )) {
    chunkCount++;
    if (!result.complete) {
      console.log(`Chunk ${chunkCount}: ${result.tokens} tokens processed`);
    }
  }
  
  console.log(`\nStreaming completed after ${chunkCount} chunks`);
  console.log('\n---\n');
}

// Example 6: A/B Testing for Prompt Optimization
async function abTestingExample() {
  console.log('6️⃣ A/B Testing Example');
  console.log('========================\n');

  // Define prompt variants
  const variants = [
    {
      name: 'baseline',
      modifier: (req) => req,
    },
    {
      name: 'with-cot',
      modifier: (req) => req,
      strategy: 'cot',
    },
    {
      name: 'with-examples',
      modifier: (req) => `${req}. Include specific examples in your response.`,
    },
  ];

  // Mock LLM for testing
  const testLLM = async (prompt) => {
    return JSON.stringify({
      analysis: 'Test response',
      quality: prompt.includes('example') ? 'high' : 'medium',
    });
  };

  const testId = await jsonderulo.runABTest(
    'Analyze customer feedback and provide insights',
    variants,
    testLLM,
    {
      sampleSize: 10,
      metrics: ['outputAccuracy', 'clarityScore', 'tokensUsed'],
    }
  );

  console.log('A/B Test Started:', testId);
  console.log('Testing 3 prompt variants...');
  console.log('\n---\n');
}

// Example 7: Quality Tracking and Insights
async function qualityTrackingExample() {
  console.log('7️⃣ Quality Tracking Example');
  console.log('=============================\n');

  // Generate a prompt with quality tracking
  const result = await jsonderulo.speakEnhanced(
    'Create a data processing pipeline configuration',
    'Configuration object with steps, transformations, and error handling',
    {
      trackQuality: true,
      strategy: 'cot',
    }
  );

  console.log('Quality Score:', result.quality?.score.overall.toFixed(2));
  console.log('\nBreakdown:');
  console.log('- Effectiveness:', result.quality?.score.breakdown.effectiveness.toFixed(2));
  console.log('- Efficiency:', result.quality?.score.breakdown.efficiency.toFixed(2));
  console.log('- Quality:', result.quality?.score.breakdown.quality.toFixed(2));
  
  console.log('\nStrengths:', result.quality?.score.strengths.join(', '));
  console.log('Recommendations:', result.quality?.recommendations?.join('; '));
  
  // Get overall metrics
  const metrics = jsonderulo.getQualityMetrics();
  console.log('\nOverall System Metrics:');
  console.log('- Average Quality:', metrics.avgQualityScore.toFixed(2));
  console.log('- Total Prompts:', metrics.totalPrompts);
  console.log('\n---\n');
}

// Example 8: Combined Advanced Features
async function combinedFeaturesExample() {
  console.log('8️⃣ Combined Advanced Features Example');
  console.log('=======================================\n');

  // Add rich context
  jsonderulo.addContext('Project uses microservices architecture', 'reference');
  jsonderulo.addContext('Prefer event-driven communication patterns', 'reference');
  jsonderulo.addContext('Security is a top priority', 'user_input');

  // Complex schema
  const schema = z.object({
    serviceName: z.string(),
    architecture: z.object({
      pattern: z.enum(['REST', 'GraphQL', 'gRPC', 'Event-Driven']),
      justification: z.string(),
    }),
    api: z.object({
      endpoints: z.array(z.object({
        method: z.string(),
        path: z.string(),
        description: z.string(),
        security: z.array(z.string()),
      })),
    }),
    events: z.optional(z.array(z.object({
      name: z.string(),
      payload: z.record(z.any()),
      subscribers: z.array(z.string()),
    }))),
    security: z.object({
      authentication: z.string(),
      authorization: z.string(),
      encryption: z.boolean(),
    }),
  });

  // Generate with all features
  const result = await jsonderulo.speakEnhanced(
    'Design a payment processing microservice with complete API specification',
    JSON.stringify(schema),
    {
      enableContext: true,
      strategy: ['cot', 'role-based'],
      trackQuality: true,
      includeExamples: true,
      semanticSearch: true,
    }
  );

  console.log('🎯 Advanced Prompt Generated!');
  console.log('\nFeatures Used:');
  console.log('- Context entries:', result.metadata?.contextRetrieved);
  console.log('- Strategy:', Array.isArray(result.metadata?.strategy) 
    ? result.metadata.strategy.join(', ') 
    : result.metadata?.strategy);
  console.log('- Estimated tokens:', result.metadata?.tokensUsed);
  console.log('- Processing time:', result.metadata?.processingTime, 'ms');
  console.log('- Quality score:', result.quality?.score.overall.toFixed(2));
  
  console.log('\nPrompt Preview (first 300 chars):');
  console.log(result.prompt.substring(0, 300) + '...');
  console.log('\n---\n');
}

// Example 9: Semantic Search for Context
async function semanticSearchExample() {
  console.log('9️⃣ Semantic Search Example');
  console.log('============================\n');

  // Add various context entries
  const contexts = [
    'Machine learning models require training data',
    'Deep learning uses neural networks',
    'Natural language processing handles text',
    'Computer vision processes images',
    'The weather forecast predicts rain tomorrow',
    'Stock market analysis uses technical indicators',
  ];

  contexts.forEach(ctx => jsonderulo.addContext(ctx, 'reference'));

  // Search for AI-related context
  const results = await jsonderulo.findSimilarContext('artificial intelligence', 3);

  console.log('Semantic Search Results for "artificial intelligence":');
  results.forEach((result, idx) => {
    console.log(`${idx + 1}. [Score: ${result.score.toFixed(2)}] ${result.metadata.text}`);
  });
  console.log('\n---\n');
}

// Example 10: Export Learnings
async function exportLearningsExample() {
  console.log('🔟 Export Learnings Example');
  console.log('============================\n');

  const learnings = jsonderulo.exportLearnings();

  console.log('System Learnings:');
  console.log('- Context Entries:', learnings.contextEntries);
  console.log('- Embeddings Count:', learnings.embeddingsCount);
  console.log('- Quality Insights:', learnings.qualityInsights);
  console.log('\nBest Practices Discovered:');
  learnings.bestPractices.forEach(practice => {
    console.log(`- ${practice}`);
  });
  console.log('\n---\n');
}

// Run all examples
async function runAllExamples() {
  try {
    await contextAwareExample();
    await chainOfThoughtExample();
    await treeOfThoughtsExample();
    await selfConsistencyExample();
    await streamingExample();
    await abTestingExample();
    await qualityTrackingExample();
    await combinedFeaturesExample();
    await semanticSearchExample();
    await exportLearningsExample();
    
    console.log('✅ All examples completed successfully!');
    console.log('\n🎵 Enhanced Jsonderulo V2 - The finest prompt engineer on earth! 🎵');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run the demo
runAllExamples();