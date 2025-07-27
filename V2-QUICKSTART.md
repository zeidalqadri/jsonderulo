# Enhanced Jsonderulo V2 - Quick Start (No UI)

The demo was just to showcase capabilities. The real power is in direct usage.

## Installation

```bash
npm install
npm run build
```

## Command Line Usage

```bash
# Basic usage with Chain of Thought
npx jsonderulo-v2 speak "Analyze this customer feedback: 'Great product but slow shipping'" --strategy cot

# Tree of Thoughts for complex problems  
npx jsonderulo-v2 speak "Design a caching strategy for high-traffic API" --strategy tot

# Self-consistency for critical decisions
npx jsonderulo-v2 speak "Is this a security threat?" --strategy consistency --rounds 5

# With schema validation
npx jsonderulo-v2 speak "Extract product details" --schema '{"name":"string","price":"number","inStock":"boolean"}'

# Quick sentiment analysis
npx jsonderulo-v2 analyze "This is the best tool ever!" --type sentiment
```

## Direct Code Integration

```typescript
import { EnhancedJsonderuloV2 } from './src/core/enhancedJsonderuloV2.js';

// Initialize
const jsonderulo = new EnhancedJsonderuloV2({
  strategy: 'chain-of-thought',
  selfConsistency: true
});

// Use it
const result = await jsonderulo.speakEnhanced(
  "Your prompt here",
  { /* your schema */ }
);
```

## Run Examples

```bash
npm run examples
```

This will run all the direct usage examples showing:
- Customer insights extraction
- API design with Tree of Thoughts  
- Security analysis with self-consistency
- Streaming for large datasets

## API Endpoints (If Deployed)

```bash
# Direct API call
curl -X POST https://your-deployment.pages.dev/api/v2/speak \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Analyze this data",
    "options": {"strategy": "chain-of-thought"}
  }'
```

## Why No UI?

Jsonderulo V2 is designed for:
- **Automation** - CI/CD pipelines, scripts
- **Integration** - Embed in your apps
- **Performance** - Direct API calls
- **Flexibility** - Use anywhere

The enhanced features (CoT, ToT, self-consistency, context management) work best when integrated directly into your workflow, not through a demo UI.