const { Jsonderulo } = require('../dist');

// Create a new instance
const jsonderulo = new Jsonderulo();

// Example 1: Generate schema from description and create prompt
console.log('=== Example 1: Sentiment Analysis ===\n');
const sentimentResult = jsonderulo.speak(
  'Analyze the sentiment of customer reviews',
  'A sentiment field that is positive, negative, or neutral, a confidence score between 0 and 1, and an explanation',
  { mode: 'explanatory' }
);

console.log('Generated Prompt:');
console.log(sentimentResult.prompt);
console.log('\nGenerated Schema:');
console.log(JSON.stringify(sentimentResult.schema, null, 2));

// Example 2: Use a template
console.log('\n\n=== Example 2: Using Templates ===\n');
const extractionResult = jsonderulo.useTemplate('extraction', {
  schema: JSON.stringify({
    type: 'object',
    properties: {
      persons: { type: 'array', items: { type: 'string' } },
      organizations: { type: 'array', items: { type: 'string' } },
      locations: { type: 'array', items: { type: 'string' } }
    },
    required: ['persons', 'organizations', 'locations']
  }),
  text: 'Apple CEO Tim Cook announced new products in Cupertino, California.'
});

console.log('Template-based Prompt:');
console.log(extractionResult.prompt);

// Example 3: Validate JSON response
console.log('\n\n=== Example 3: Validation ===\n');
const testResponse = {
  sentiment: 'positive',
  confidence: 0.95,
  explanation: 'The review contains many positive words and expressions of satisfaction'
};

const validationResult = jsonderulo.validate(
  testResponse,
  sentimentResult.schema
);

console.log('Validation Result:', validationResult.valid ? '✅ Valid' : '❌ Invalid');

// Example 4: Repair invalid JSON
console.log('\n\n=== Example 4: JSON Repair ===\n');
const invalidJson = `{
  "name": "John Doe",
  "age": 30,
  "city": "New York",
}`;  // Note the trailing comma

const repaired = jsonderulo.repair(invalidJson);
console.log('Repaired JSON:', repaired);