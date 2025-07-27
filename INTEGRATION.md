# Enhanced Jsonderulo V2 - Integration Guide

No demo UI needed. Just pure prompt engineering power in your code.

## Quick Start

```typescript
import { EnhancedJsonderuloV2 } from '@jsonderulo/core';

const jsonderulo = new EnhancedJsonderuloV2({
  strategy: 'chain-of-thought',
  selfConsistency: true,
  enableContext: true
});

// Get structured output with reasoning
const result = await jsonderulo.speakEnhanced(
  "Extract key metrics from Q4 financial report",
  { revenue: 'number', growth: 'string', risks: ['string'] }
);
```

## Core Features (No UI Required)

### 1. Chain of Thought (CoT)
```typescript
// Breaks down complex reasoning
const analysis = await jsonderulo.speakEnhanced(
  "Analyze this architecture for scalability issues",
  schema,
  { enableCoT: true }
);
// Returns: { result: {...}, metadata: { reasoning: [...] } }
```

### 2. Tree of Thoughts (ToT)
```typescript
// Explores multiple solution paths
const solutions = await jsonderulo.speakEnhanced(
  "Design optimal database schema",
  schema,
  { strategy: 'tree-of-thoughts', enableToT: true }
);
// Returns best solution after exploring alternatives
```

### 3. Self-Consistency
```typescript
// Multiple rounds for reliability
const consensus = await jsonderulo.processWithConsistency(
  "Classify this security incident",
  schema,
  { rounds: 5 }
);
// Returns: { consensus: {...}, agreement: 0.95 }
```

### 4. Context Management
```typescript
// Add domain knowledge
await jsonderulo.addContext("API conventions", apiDocsContent);
await jsonderulo.addContext("Security policies", securityRules);

// Uses context automatically
const secure = await jsonderulo.speakEnhanced(
  "Design user authentication flow",
  authSchema
);
```

### 5. Streaming for Large Outputs
```typescript
const stream = jsonderulo.streamJSON(
  "Generate test dataset",
  { records: [recordSchema] }
);

stream.on('chunk', (data) => process(data));
stream.on('complete', (result) => console.log('Done'));
```

## Integration Patterns

### CLI Tool
```typescript
#!/usr/bin/env node
import { EnhancedJsonderuloV2 } from '@jsonderulo/core';

const jsonderulo = new EnhancedJsonderuloV2();
const prompt = process.argv[2];
const result = await jsonderulo.speak(prompt);
console.log(JSON.stringify(result, null, 2));
```

### Express Middleware
```typescript
app.post('/api/process', async (req, res) => {
  const { prompt, schema, options } = req.body;
  const result = await jsonderulo.speakEnhanced(prompt, schema, options);
  res.json(result);
});
```

### GitHub Action
```yaml
- name: Analyze Code Quality
  run: |
    npx jsonderulo "Analyze code quality issues" \
      --schema '{"issues":["string"],"score":"number"}' \
      --strategy chain-of-thought
```

## Direct API Usage (Deployed Version)

```bash
# Chain of Thought Analysis
curl -X POST https://your-project.pages.dev/api/v2/speak \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Analyze this error log",
    "schema": {"severity": "string", "cause": "string"},
    "options": {"strategy": "chain-of-thought"}
  }'

# Add Context
curl -X POST https://your-project.pages.dev/api/v2/context/add \
  -H "Content-Type: application/json" \
  -d '{
    "key": "system-architecture",
    "content": "Microservices with Kafka..."
  }'
```

## Why No Demo UI?

The enhanced jsonderulo V2 is designed to be:
- **Embedded** in your applications
- **Automated** in your workflows  
- **Integrated** with your tools
- **Invoked** programmatically

The power is in the API, not the UI. Use it where you need it:
- Data pipelines
- CI/CD workflows
- Code generation
- Analysis tools
- API endpoints
- CLI utilities

## Getting Started

```bash
npm install @jsonderulo/core
```

Then just import and use. No UI setup, no demo pages, just results.