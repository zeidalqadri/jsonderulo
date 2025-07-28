/**
 * Direct usage examples of Enhanced Jsonderulo V2
 * No UI needed - just pure API power
 */

import { EnhancedJsonderuloV2 } from '../src/core/enhancedJsonderuloV2.js';

// Initialize the enhanced jsonderulo
const jsonderulo = new EnhancedJsonderuloV2({
  enableContext: true,
  semanticSearch: true,
  strategy: 'chain-of-thought',
  selfConsistency: true,
  consistencyRounds: 3,
  trackQuality: true
});

// Example 1: Extract structured data with Chain of Thought
async function extractCustomerInsights() {
  const customerFeedback = `
    Our product is great but the onboarding is confusing. 
    I love the features but wish the UI was more intuitive.
    Customer support is excellent but response times could be better.
  `;

  const result = await jsonderulo.speakEnhanced(
    `Analyze this customer feedback and extract structured insights`,
    {
      sentiment: 'positive | negative | mixed',
      themes: ['string'],
      actionItems: [{ area: 'string', priority: 'high | medium | low', suggestion: 'string' }],
      overallScore: 'number between 1-10'
    },
    {
      enableCoT: true,
      additionalContext: [customerFeedback]
    }
  );

  console.log('Customer Insights:', result.result);
  console.log('Reasoning:', result.metadata?.reasoning);
}

// Example 2: API Design with Tree of Thoughts
async function designAPI() {
  const requirements = `
    Design a REST API for a task management system that supports:
    - User authentication
    - Task CRUD operations
    - Team collaboration
    - Real-time updates
  `;

  const result = await jsonderulo.speakEnhanced(
    requirements,
    {
      endpoints: [{
        path: 'string',
        method: 'GET | POST | PUT | DELETE',
        description: 'string',
        auth: 'boolean',
        realtime: 'boolean'
      }],
      dataModels: [{
        name: 'string',
        fields: ['string']
      }],
      securityConsiderations: ['string']
    },
    {
      strategy: 'tree-of-thoughts',
      enableToT: true
    }
  );

  console.log('API Design:', JSON.stringify(result.result, null, 2));
  console.log('Explored Paths:', result.metadata?.thoughtPaths?.length);
}

// Example 3: Self-Consistency for Critical Decisions
async function analyzeSecurityThreat() {
  const logData = `
    [2024-01-15 03:45:22] Failed login attempt from IP 192.168.1.105
    [2024-01-15 03:45:25] Failed login attempt from IP 192.168.1.105
    [2024-01-15 03:45:28] Successful login from IP 192.168.1.105
    [2024-01-15 03:46:15] Unusual data export: 50GB from database
    [2024-01-15 03:47:00] New SSH key added to admin account
  `;

  const result = await jsonderulo.processWithConsistency(
    `Analyze these logs for potential security threats`,
    {
      threatLevel: 'low | medium | high | critical',
      threatType: 'string',
      indicators: ['string'],
      recommendedActions: ['string'],
      confidence: 'number between 0-1'
    },
    {
      rounds: 5,
      additionalContext: [logData]
    }
  );

  console.log('Consensus Result:', result.consensus);
  console.log('Agreement Score:', result.agreement);
  console.log('All Analyses:', result.allResults.map(r => r.threatLevel));
}

// Example 4: Streaming JSON for Large Datasets
async function streamDataProcessing() {
  const jsonderuloStream = new EnhancedJsonderuloV2({
    streaming: true,
    streamingOptions: {
      validateChunks: true,
      bufferSize: 1024
    }
  });

  const stream = jsonderuloStream.streamJSON(
    'Generate a dataset of 100 user profiles with realistic data',
    {
      users: [{
        id: 'number',
        name: 'string',
        email: 'string',
        age: 'number',
        interests: ['string'],
        accountStatus: 'active | inactive | suspended'
      }]
    }
  );

  stream.on('chunk', (chunk) => {
    console.log('Received chunk:', chunk);
  });

  stream.on('complete', (result) => {
    console.log('Streaming complete. Total users:', result.data.users.length);
  });

  stream.on('error', (error) => {
    console.error('Streaming error:', error);
  });
}

// Example 5: Direct API calls (if deployed)
async function callAPI() {
  const response = await fetch('https://your-project.pages.dev/api/v2/speak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Design a caching strategy for a high-traffic e-commerce site',
      schema: {
        strategy: 'string',
        layers: [{ type: 'string', ttl: 'string', size: 'string' }],
        invalidationRules: ['string'],
        estimatedHitRate: 'string'
      },
      options: {
        strategy: 'chain-of-thought',
        enableCoT: true
      }
    })
  });

  const result = await response.json();
  console.log('Caching Strategy:', result);
}

// Run examples
async function main() {
  console.log('🚀 Enhanced Jsonderulo V2 - Direct Usage Examples\n');
  
  console.log('1️⃣ Extracting Customer Insights...');
  await extractCustomerInsights();
  
  console.log('\n2️⃣ Designing REST API...');
  await designAPI();
  
  console.log('\n3️⃣ Analyzing Security Threats...');
  await analyzeSecurityThreat();
  
  console.log('\n4️⃣ Streaming Large Dataset...');
  await streamDataProcessing();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { jsonderulo };