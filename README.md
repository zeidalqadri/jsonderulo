# 🎵 jsonderulo

> The finest JSON speaker on earth - transforms prompts into JSON-structured casks for perfect LLM compliance

jsonderulo turns every ask and prompt into purposeful JSON-structured tasks, creating a storm of literal prowess that LLMs are lulled into following through with doing exactly as serenaded.

## Why jsonderulo?

LLMs are trained on millions of JSON files from APIs and code - it's their native language. Regular prompts give unpredictable formats, but JSON prompts provide consistent, structured responses every time.

## Features

### Core Features
- 🎯 **Natural Language → JSON Schema**: Automatically generate schemas from descriptions
- 🔄 **Smart Prompt Transformation**: Convert regular prompts into JSON-structured prompts
- 📋 **Template Library**: Pre-built patterns for common use cases
- ✅ **Validation & Repair**: Ensure outputs match schemas with automatic fixes
- 🚀 **Multiple Modes**: Strict, explanatory, streaming, and validated outputs
- 🛠️ **CLI & API**: Use as a library or command-line tool

### 🆕 Enhanced V2 Features
- 🧠 **Advanced Context Management**: Semantic memory with intelligent retrieval
- 🤔 **Chain of Thought (CoT)**: Step-by-step reasoning for complex tasks
- 🌳 **Tree of Thoughts (ToT)**: Explore multiple solution paths
- 🔄 **Self-Consistency**: Generate consensus from multiple outputs
- 📡 **JSON Streaming**: Progressive validation during generation
- 📊 **A/B Testing**: Optimize prompts with data-driven insights
- 📈 **Quality Tracking**: Monitor and improve prompt effectiveness
- 🎭 **Role-Based Prompting**: Specialized personas for different tasks
- 🗜️ **Context Compression**: Fit more context in limited windows
- 🔍 **Semantic Search**: Find relevant context using embeddings

## Installation

```bash
npm install jsonderulo
# or
yarn add jsonderulo
```

For CLI usage:
```bash
npm install -g jsonderulo
```

## Quick Start

### As a Library

```javascript
const { Jsonderulo } = require('jsonderulo');
// or
import { Jsonderulo } from 'jsonderulo';

const jsonderulo = new Jsonderulo();

// Transform a prompt with automatic schema generation
const result = jsonderulo.speak(
  'Analyze customer sentiment',
  'A sentiment field (positive/negative/neutral), confidence score 0-1, and explanation'
);

console.log(result.prompt);
// Output: Structured prompt with JSON schema

console.log(result.schema);
// Output: Generated JSON schema
```

### CLI Usage

```bash
# Transform a prompt
jsonderulo speak "Extract entities from text" --schema "persons, organizations, locations arrays"

# Use a template
jsonderulo template extraction --vars '{"text": "Apple CEO Tim Cook announced..."}'

# Generate schema from description
jsonderulo schema "User profile with name, email, and optional age"

# Validate JSON
jsonderulo validate response.json schema.json --repair

# Interactive mode
jsonderulo interactive
```

## Core Concepts

### 1. Schema Generation

jsonderulo intelligently converts natural language descriptions into JSON schemas:

```javascript
const schema = jsonderulo.speak(
  'Get user data',
  'Required username (min 3 chars), email address, optional age (13-120)'
).schema;

// Generates:
{
  "type": "object",
  "properties": {
    "username": { "type": "string", "minLength": 3 },
    "email": { "type": "string", "pattern": "^[\\w.-]+@[\\w.-]+\\.\\w+$" },
    "age": { "type": "number", "minimum": 13, "maximum": 120 }
  },
  "required": ["username", "email"],
  "additionalProperties": false
}
```

### 2. Prompt Modes

- **Strict**: JSON-only responses, no explanatory text
- **Explanatory**: Includes reasoning fields for transparency
- **Streaming**: Optimized for incremental parsing
- **Validated**: Built-in schema validation before output

```javascript
// Explanatory mode for debugging
const result = jsonderulo.speak('Classify document', undefined, {
  mode: 'explanatory',
  includeExamples: true
});
```

### 3. Templates

Pre-built templates for common tasks:

```javascript
// Information extraction
jsonderulo.useTemplate('extraction', {
  schema: JSON.stringify(entitySchema),
  text: 'Your text here'
});

// Classification
jsonderulo.useTemplate('classification', {
  schema: JSON.stringify(classificationSchema),
  input: 'Item to classify',
  examples: 'Example classifications'
});
```

### 4. Validation & Repair

```javascript
// Validate response
const validation = jsonderulo.validate(llmResponse, schema);
if (!validation.valid) {
  console.log('Errors:', validation.errors);
  console.log('Suggestions:', validation.suggestions);
}

// Auto-repair invalid JSON
const repaired = jsonderulo.repair('{"name": "John",}'); // Fixes trailing comma
```

### 5. Complete Workflow

```javascript
// Full process with retry and repair
const result = await jsonderulo.process(
  'Extract product details from description',
  async (prompt) => await callYourLLM(prompt),
  {
    mode: 'strict',
    autoRepair: true,
    maxRetries: 3
  }
);

if (result.success) {
  console.log('Extracted data:', result.data);
} else {
  console.log('Failed after', result.attempts, 'attempts');
}
```

## 🚀 Enhanced Jsonderulo V2 - Advanced Features

jsonderulo V2 introduces cutting-edge prompt and context engineering capabilities that maximize output quality for both natural language and JSON generation.

### Advanced Context Management

Build context-aware prompts with semantic memory and retrieval:

```javascript
import { EnhancedJsonderuloV2 } from 'jsonderulo';

const jsonderulo = new EnhancedJsonderuloV2();

// Add context with semantic indexing
jsonderulo.addContext('User prefers detailed explanations', 'user_input');
jsonderulo.addContext('Previous API used REST patterns', 'assistant_output');
jsonderulo.addContext('Company uses microservices', 'reference');

// Generate context-aware prompt
const result = await jsonderulo.speakEnhanced(
  'Design a new API endpoint',
  undefined,
  {
    enableContext: true,
    semanticSearch: true,
    contextWindowSize: 4000
  }
);

// Find similar context
const similar = await jsonderulo.findSimilarContext('API design patterns', 5);
```

### Chain of Thought (CoT) Prompting

Guide LLMs through step-by-step reasoning:

```javascript
const result = await jsonderulo.speakEnhanced(
  'Analyze this complex system architecture',
  schema,
  {
    strategy: 'cot',
    enableCoT: true
  }
);

// Result includes reasoning steps
console.log(result.reasoning.steps);
// Output: Step-by-step thought process
```

### Tree of Thoughts (ToT) for Complex Problems

Explore multiple solution paths:

```javascript
const result = await jsonderulo.speakEnhanced(
  'Find the optimal database design for this use case',
  undefined,
  {
    strategy: 'tot',
    enableToT: true
  }
);
```

### Self-Consistency for Reliability

Generate multiple outputs and find consensus:

```javascript
const result = await jsonderulo.processWithConsistency(
  'Extract key information from this document',
  llmFunction,
  {
    selfConsistency: true,
    consistencyRounds: 3,
    qualityThreshold: 0.8
  }
);

console.log(result.consistency.confidenceScore);
console.log(result.consistency.consensusOutput);
```

### JSON Streaming with Progressive Validation

Stream and validate JSON in real-time:

```javascript
const schema = z.object({
  items: z.array(z.object({
    id: z.string(),
    data: z.any()
  }))
});

for await (const result of jsonderulo.streamJSON(
  'Generate large dataset',
  streamingLLMFunction,
  schema
)) {
  console.log(`Progress: ${result.tokens} tokens, Valid: ${result.errors.length === 0}`);
}
```

### A/B Testing for Prompt Optimization

Test and optimize prompt variations:

```javascript
const testId = await jsonderulo.runABTest(
  'Base prompt',
  [
    { name: 'baseline', modifier: x => x },
    { name: 'with-cot', modifier: x => x, strategy: 'cot' },
    { name: 'with-examples', modifier: x => `${x} with examples` }
  ],
  llmFunction,
  {
    sampleSize: 20,
    metrics: ['outputAccuracy', 'schemaCompliance', 'tokensUsed']
  }
);

// Check results
const results = jsonderulo.getTestResults(testId);
```

### Prompt Quality Tracking

Monitor and improve prompt effectiveness:

```javascript
const result = await jsonderulo.speakEnhanced(
  'Generate report',
  schema,
  { trackQuality: true }
);

console.log(result.quality.score.overall); // 0.85
console.log(result.quality.recommendations);
// ["Add more specific constraints", "Include examples"]

// Get system-wide metrics
const metrics = jsonderulo.getQualityMetrics();
```

### Combined Strategies

Mix multiple techniques for maximum effectiveness:

```javascript
const result = await jsonderulo.speakEnhanced(
  'Complex analytical task',
  schema,
  {
    strategy: ['cot', 'role-based'],
    enableContext: true,
    trackQuality: true,
    semanticSearch: true
  }
);
```

### Configuration Options

```javascript
const jsonderulo = new EnhancedJsonderuloV2();

// Update context settings
jsonderulo.updateContextConfig({
  maxTokens: 8000,
  compressionEnabled: true
});

// Adjust quality weights
jsonderulo.updateQualityWeights({
  effectiveness: 0.5,
  efficiency: 0.2,
  quality: 0.3
});

// Set embeddings provider
jsonderulo.setEmbeddingsProvider('openai'); // or 'local', 'mock'
```

## Advanced Usage

### Custom Schema Patterns

```javascript
// Complex nested structures
const result = jsonderulo.speak(`
  Create a report with:
  - metadata object (title, date, author details)
  - sections array with content and subsections
  - summary with key points and recommendations
`);
```

### Error Recovery

```javascript
const recovery = jsonderulo.generateRecoveryPrompt(
  originalPrompt,
  failedResponse,
  validationResult,
  schema
);
// Returns a new prompt to fix validation errors
```

### Integration Example

```javascript
// With OpenAI
async function askWithStructure(question) {
  const { prompt, schema } = jsonderulo.speak(question);
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });
  
  const validation = jsonderulo.validate(response.choices[0].message.content, schema);
  return validation.valid ? JSON.parse(response.choices[0].message.content) : null;
}
```

## API Reference

### `new Jsonderulo()`
Create a new jsonderulo instance.

### `speak(request, schemaDescription?, options?)`
Transform a request into a JSON-structured prompt.

### `useTemplate(templateName, variables, options?)`
Apply a predefined template.

### `validate(response, schema)`
Validate JSON response against schema.

### `repair(invalidJson)`
Attempt to fix common JSON syntax errors.

### `process(request, llmFunction, options?)`
Complete workflow with automatic retry and repair.

## Examples

See the `examples/` directory for:
- Basic usage patterns
- Advanced workflows  
- Integration examples
- Custom templates

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run in development
npm run dev
```

## License

MIT

## Contributing

Pull requests are welcome! Please read our contributing guidelines first.

## MCP (Model Context Protocol) Support

Jsonderulo now includes an MCP server, allowing it to be used as a Claude Desktop agent! This enables Claude to directly use jsonderulo's capabilities for JSON prompt engineering.

### MCP Installation

1. **Install jsonderulo globally or locally:**
```bash
npm install -g jsonderulo
# or
npm install jsonderulo
```

2. **Configure Claude Desktop:**

Add jsonderulo to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "jsonderulo": {
      "command": "node",
      "args": ["/path/to/jsonderulo/dist/mcp/index.js"],
      "env": {}
    }
  }
}
```

Or if installed globally:
```json
{
  "mcpServers": {
    "jsonderulo": {
      "command": "npx",
      "args": ["-y", "jsonderulo-mcp"],
      "env": {}
    }
  }
}
```

3. **Restart Claude Desktop** to load the MCP server.

### MCP Tools Available

- `jsonderulo_speak` - Transform natural language into JSON-structured prompts
- `jsonderulo_generate_schema` - Generate JSON schema from descriptions
- `jsonderulo_validate` - Validate JSON against schemas
- `jsonderulo_repair` - Fix common JSON syntax errors
- `jsonderulo_use_template` - Apply predefined templates
- `jsonderulo_get_templates` - List available templates

### MCP Resources

- `template://basic_json` - Basic JSON generation template
- `template://extraction` - Data extraction template
- `template://classification` - Classification template
- `template://analysis` - Analysis template
- `examples://schemas` - Example JSON schemas
- `docs://best_practices` - JSON prompt engineering best practices

### Using with Claude

Once configured, you can ask Claude to use jsonderulo:

- "Use jsonderulo to generate a schema for a user profile"
- "Transform this prompt for JSON output using jsonderulo"
- "Validate this JSON with jsonderulo"
- "Show me jsonderulo's extraction template"

See `examples/mcp/usage-examples.md` for detailed examples.

## Acknowledgments

Inspired by the observation that JSON-structured prompts dramatically improve LLM response consistency and the tweet thread by @itsalexvacca about JSON prompting techniques.