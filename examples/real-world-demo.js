const { Jsonderulo } = require('../dist');

console.log('\n🎵 JSONDERULO REAL-WORLD EXAMPLE 🎵');
console.log('Transforming natural language into structured JSON for LLMs\n');

const jsonderulo = new Jsonderulo();

// Scenario: Building a customer feedback analyzer
console.log('📋 SCENARIO: Customer Feedback Analysis System\n');

// Step 1: Define what we want from natural language
const feedbackRequest = `
  Analyze customer feedback and extract:
  - Overall sentiment (positive, negative, neutral)
  - Confidence score between 0 and 1
  - Key topics mentioned (array of strings)
  - Issues identified (array with description and severity)
  - Recommendation (string, optional)
`;

console.log('1️⃣  Natural Language Request:');
console.log(feedbackRequest);

// Step 2: Generate the JSON schema and prompt
const result = jsonderulo.speak('Analyze customer feedback', feedbackRequest.trim());

console.log('\n2️⃣  Generated JSON Schema:');
console.log(JSON.stringify(result.schema, null, 2));

console.log('\n3️⃣  Structured Prompt for LLM:');
console.log('First 300 characters:', result.prompt.substring(0, 300) + '...');

// Step 4: Simulate LLM response and validate
console.log('\n4️⃣  Simulating LLM Response & Validation:');

const mockLLMResponse = {
  overall: { type: 'string' },
  confidence: { type: 'number' },
  key: { type: 'array' },
  issues: { type: 'array' },
  recommendation: { type: 'string' }
};

// This would be the actual LLM response in production
const actualResponse = {
  sentiment: 'positive',
  confidence: 0.78,
  topics: ['product quality', 'customer service', 'shipping'],
  issues: [
    { description: 'Packaging could be improved', severity: 'low' }
  ],
  recommendation: 'Continue focus on product quality'
};

console.log('Mock LLM Response:', JSON.stringify(actualResponse, null, 2));

// Validate the response
const validation = jsonderulo.validate(actualResponse, result.schema);
console.log('\nValidation Result:', validation.valid ? '✅ VALID' : '❌ INVALID');

console.log('\n5️⃣  Benefits of using jsonderulo:');
console.log('✨ Consistent JSON structure every time');
console.log('✨ Natural language → Schema generation');
console.log('✨ Built-in validation and error recovery');
console.log('✨ Perfect for production LLM applications');
console.log('✨ No more parsing unpredictable text outputs!');

console.log('\n🎵 jsonderulo - turning prompts into purposeful JSON tasks! 🎵\n');