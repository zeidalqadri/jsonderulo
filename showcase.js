const { Jsonderulo } = require('./dist');

const jsonderulo = new Jsonderulo();

console.log('\n🎵 JSONDERULO - JSON Speaking Demonstrations 🎵\n');

// Example 1: Simple sentiment analysis
console.log('1️⃣  SENTIMENT ANALYSIS\n');
console.log('Input: "Analyze sentiment of customer reviews"');

const sentiment = jsonderulo.speak('Analyze sentiment of customer reviews');
console.log('\nGenerated Prompt:');
console.log(sentiment.prompt.split('\n').slice(0, 5).join('\n') + '...\n');

// Example 2: Extract structured data
console.log('\n2️⃣  ENTITY EXTRACTION\n');

const extraction = jsonderulo.useTemplate('extraction', {
  schema: JSON.stringify({
    type: 'object',
    properties: {
      people: { type: 'array', items: { type: 'string' } },
      companies: { type: 'array', items: { type: 'string' } },
      products: { type: 'array', items: { type: 'string' } }
    },
    additionalProperties: false
  }),
  text: 'Elon Musk announced that Tesla will release the new Cybertruck next year.'
});

console.log('Task: Extract entities from text about Tesla announcement');
console.log('\nPrompt structure includes:');
console.log('- Extraction instructions ✓');
console.log('- Schema validation ✓');
console.log('- Clear formatting rules ✓');

// Example 3: Validate and repair JSON
console.log('\n3️⃣  JSON VALIDATION & REPAIR\n');

const brokenJson = `{
  "user": "John Doe",
  "score": 95,
  "tags": ["expert", "verified"],
}`;

console.log('Broken JSON (has trailing comma):');
console.log(brokenJson);

const repaired = jsonderulo.repair(brokenJson);
console.log('\nRepaired JSON:');
console.log(repaired);

// Example 4: Natural language to schema
console.log('\n4️⃣  NATURAL LANGUAGE → JSON SCHEMA\n');

const descriptions = [
  'A product with name, price, and availability status',
  'User data including email, age (18-99), and subscription type (free, pro, enterprise)'
];

descriptions.forEach((desc, i) => {
  console.log(`\nDescription ${i + 1}: "${desc}"`);
  const result = jsonderulo.speak('Generate data', desc);
  console.log('Generated Schema:');
  console.log(JSON.stringify(result.schema, null, 2));
});

// Example 5: Complete workflow simulation
console.log('\n5️⃣  COMPLETE WORKFLOW WITH MOCK LLM\n');

async function simulateWorkflow() {
  const mockLLM = async (prompt) => {
    // Simulate LLM response based on prompt
    if (prompt.includes('product')) {
      return JSON.stringify({
        name: 'Premium Widget',
        price: 99.99,
        availabilityStatus: 'in-stock'
      });
    }
    return '{"result": "success"}';
  };

  const result = await jsonderulo.process(
    'Generate product information',
    mockLLM,
    { mode: 'strict', maxRetries: 2 }
  );

  console.log('Process completed:');
  console.log(`- Success: ${result.success ? '✓' : '✗'}`);
  console.log(`- Attempts: ${result.attempts}`);
  console.log('- Generated data:', JSON.stringify(result.data, null, 2));
}

simulateWorkflow().then(() => {
  console.log('\n✨ Jsonderulo transforms every prompt into purposeful JSON-structured tasks! ✨\n');
});