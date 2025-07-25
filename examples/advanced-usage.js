const { Jsonderulo } = require('../dist');

// Advanced example with complete workflow
async function demonstrateCompleteWorkflow() {
  const jsonderulo = new Jsonderulo();

  // Mock LLM function for demonstration
  const mockLLM = async (prompt) => {
    console.log('LLM received prompt:', prompt.substring(0, 100) + '...\n');
    
    // Simulate different responses based on prompt content
    if (prompt.includes('sentiment')) {
      return JSON.stringify({
        sentiment: 'positive',
        confidence: 0.85,
        explanation: 'The text expresses satisfaction and happiness'
      });
    }
    
    if (prompt.includes('extraction')) {
      return JSON.stringify({
        entities: [
          { text: 'Apple', type: 'organization', confidence: 0.95 },
          { text: 'Tim Cook', type: 'person', confidence: 0.98 }
        ],
        summary: 'Tech company announcement'
      });
    }
    
    return '{"error": "Unknown request"}';
  };

  console.log('=== Complete Workflow Example ===\n');

  // Process with automatic retry and repair
  const result = await jsonderulo.process(
    'Extract entities from the text about Apple and Tim Cook',
    mockLLM,
    {
      mode: 'explanatory',
      autoRepair: true,
      maxRetries: 3,
      includeExamples: true
    }
  );

  console.log('Process Result:');
  console.log(JSON.stringify(result, null, 2));
}

// Custom schema generation example
function demonstrateCustomSchemas() {
  const jsonderulo = new Jsonderulo();

  console.log('\n=== Custom Schema Generation ===\n');

  // Complex nested schema
  const complexRequest = `
    I need a user profile with:
    - A required username (at least 3 characters)
    - An email address
    - An optional age (between 13 and 120)
    - A list of hobbies
    - Account settings object with theme (dark or light) and notifications enabled
  `;

  const result = jsonderulo.speak(complexRequest, undefined, {
    mode: 'validated',
    includeExamples: true
  });

  console.log('Generated Schema for Complex Request:');
  console.log(JSON.stringify(result.schema, null, 2));
}

// Dynamic template usage
function demonstrateDynamicTemplates() {
  const jsonderulo = new Jsonderulo();

  console.log('\n=== Dynamic Template Usage ===\n');

  // Create variables dynamically based on task
  const taskTypes = ['classification', 'extraction', 'analysis'];
  
  taskTypes.forEach(taskType => {
    const variables = {
      schema: JSON.stringify({
        type: 'object',
        properties: {
          taskType: { type: 'string', const: taskType },
          results: { type: 'array' },
          metadata: { type: 'object' }
        }
      }),
      input: `Process this for ${taskType}`,
      examples: '' // Would include real examples
    };

    const result = jsonderulo.useTemplate('classification', variables, {
      mode: 'strict',
      temperature: 0.3
    });

    console.log(`\nTemplate for ${taskType}:`);
    console.log(result.prompt.substring(0, 150) + '...');
  });
}

// Error recovery demonstration
function demonstrateErrorRecovery() {
  const jsonderulo = new Jsonderulo();

  console.log('\n=== Error Recovery Example ===\n');

  const invalidResponse = `{
    "sentiment": "very positive", // Invalid enum value
    "confidence": 1.5, // Out of range
    "unexpectedField": "should not be here"
  }`;

  const schema = {
    type: 'object',
    properties: {
      sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
      confidence: { type: 'number', minimum: 0, maximum: 1 }
    },
    required: ['sentiment', 'confidence'],
    additionalProperties: false
  };

  const validationResult = jsonderulo.validate(invalidResponse, schema);
  
  console.log('Validation Errors:');
  validationResult.errors?.forEach(error => {
    console.log(`- ${error.path}: ${error.message}`);
  });

  console.log('\nSuggestions:');
  validationResult.suggestions?.forEach(suggestion => {
    console.log(`- ${suggestion}`);
  });

  // Generate recovery prompt
  const recoveryPrompt = jsonderulo.generateRecoveryPrompt(
    'Analyze sentiment',
    invalidResponse,
    validationResult,
    schema
  );

  console.log('\nRecovery Prompt:');
  console.log(recoveryPrompt.substring(0, 200) + '...');
}

// Run all demonstrations
async function runAllDemos() {
  await demonstrateCompleteWorkflow();
  demonstrateCustomSchemas();
  demonstrateDynamicTemplates();
  demonstrateErrorRecovery();
}

// Execute if run directly
if (require.main === module) {
  runAllDemos().catch(console.error);
}

module.exports = {
  demonstrateCompleteWorkflow,
  demonstrateCustomSchemas,
  demonstrateDynamicTemplates,
  demonstrateErrorRecovery
};