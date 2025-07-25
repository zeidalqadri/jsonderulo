const { Jsonderulo } = require('./dist');
const chalk = require('chalk').default;

console.log(chalk.cyan('\n🎵 Jsonderulo Demo - The finest JSON speaker on earth! 🎵\n'));

const jsonderulo = new Jsonderulo();

// Demo 1: Simple sentiment analysis
console.log(chalk.yellow('=== Demo 1: Sentiment Analysis ==='));
const sentimentResult = jsonderulo.speak(
  'Analyze the sentiment of this text',
  'A sentiment field (positive, negative, or neutral), confidence score 0-1, and explanation'
);
console.log('\nGenerated Schema:');
console.log(JSON.stringify(sentimentResult.schema, null, 2));
console.log('\nGenerated Prompt (first 200 chars):');
console.log(sentimentResult.prompt.substring(0, 200) + '...');

// Demo 2: Complex user profile
console.log(chalk.yellow('\n\n=== Demo 2: User Profile Schema ==='));
const userResult = jsonderulo.speak(
  'Create user profile',
  'username (string, required, min 3 chars), email (string, required), age (number, optional, 18-120), accountType (string) that can be one of: free, premium, enterprise'
);
console.log('\nGenerated Schema:');
console.log(JSON.stringify(userResult.schema, null, 2));

// Demo 3: Using templates
console.log(chalk.yellow('\n\n=== Demo 3: Template Usage ==='));
const templateResult = jsonderulo.useTemplate('extraction', {
  schema: JSON.stringify({
    type: 'object',
    properties: {
      persons: { type: 'array', items: { type: 'string' } },
      organizations: { type: 'array', items: { type: 'string' } },
      locations: { type: 'array', items: { type: 'string' } }
    },
    required: ['persons', 'organizations', 'locations'],
    additionalProperties: false
  }),
  text: 'Tim Cook announced at Apple headquarters in Cupertino that Steve Jobs would be remembered forever.'
});
console.log('\nExtraction Template Applied');
console.log('Prompt includes:', templateResult.prompt.includes('Extract') ? '✓ Extraction instructions' : '✗ Missing instructions');
console.log('Prompt includes:', templateResult.prompt.includes('schema') ? '✓ Schema reference' : '✗ Missing schema');

// Demo 4: Validation and repair
console.log(chalk.yellow('\n\n=== Demo 4: Validation & Repair ==='));
const testSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' }
  },
  required: ['name'],
  additionalProperties: false
};

// Valid JSON
const validData = { name: 'John', age: 30 };
const validResult = jsonderulo.validate(validData, testSchema);
console.log('\nValid data:', validData);
console.log('Validation:', validResult.valid ? chalk.green('✓ PASSED') : chalk.red('✗ FAILED'));

// Invalid JSON string with errors
const invalidJson = '{name: "Jane", age: "25",}'; // Missing quotes, wrong type, trailing comma
console.log('\nInvalid JSON:', invalidJson);
const repaired = jsonderulo.repair(invalidJson);
console.log('Repaired:', repaired);
if (repaired) {
  const repairedValidation = jsonderulo.validate(repaired, testSchema);
  console.log('After repair:', repairedValidation.valid ? chalk.green('✓ PASSED') : chalk.red('✗ FAILED'));
}

// Demo 5: Complete workflow with mock LLM
console.log(chalk.yellow('\n\n=== Demo 5: Complete Workflow ==='));
async function demoWorkflow() {
  // Mock LLM that returns valid JSON
  const mockLLM = async (prompt) => {
    console.log('LLM called with prompt containing:', 
      prompt.includes('sentiment') ? 'sentiment analysis request' : 'other request'
    );
    return JSON.stringify({
      sentiment: 'positive',
      confidence: 0.92,
      explanation: 'The text contains positive expressions and enthusiasm'
    });
  };

  const result = await jsonderulo.process(
    'Analyze sentiment with explanation',
    mockLLM,
    {
      mode: 'explanatory',
      maxRetries: 3,
      includeExamples: true
    }
  );

  console.log('\nWorkflow result:');
  console.log('Success:', result.success ? chalk.green('✓') : chalk.red('✗'));
  console.log('Data:', JSON.stringify(result.data, null, 2));
  console.log('Attempts:', result.attempts);
}

demoWorkflow().then(() => {
  console.log(chalk.cyan('\n\n🎵 Jsonderulo demo complete! 🎵\n'));
});