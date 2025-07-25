# jsonderulo Pipeline Flow - Simplified View

## Data Flow Through Pipeline Components

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                   INPUT: Raw Idea String                             │
│                  "analyze customer feedback to identify pain points"                 │
└─────────────────────────────────────────┬───────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  1. IdeaInputProcessor                  │ Type: string → EnrichedIdea               │
├─────────────────────────────────────────┴───────────────────────────────────────────┤
│  • Normalizes text                                                                  │
│  • Categorizes idea (market-research, product-dev, etc.)                           │
│  • Extracts concepts & entities                                                    │
│  • Identifies constraints                                                           │
│  • Suggests output type                                                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  OUTPUT: {                                                                          │
│    category: "market-research",                                                     │
│    concepts: { entities: [...], relationships: [...] },                            │
│    suggestedOutputType: "action-items",                                            │
│    confidence: 0.85                                                                │
│  }                                                                                  │
└─────────────────────────────────────────┬───────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  2. QueryConstructor                    │ Type: EnrichedIdea → StructuredQuery     │
├─────────────────────────────────────────┴───────────────────────────────────────────┤
│  • Builds query components                                                          │
│  • Defines focus & success criteria                                                 │
│  • Sets query parameters                                                            │
│  • Optimizes for output type                                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  OUTPUT: {                                                                          │
│    primary: "analyze customer feedback...",                                         │
│    components: [objectives, scope, constraints],                                    │
│    focus: { primaryAction: "analyze", targetOutcome: "..." },                      │
│    parameters: { depth: "standard", tone: "conversational" }                        │
│  }                                                                                  │
└─────────────────────────────────────────┬───────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  3. PipelineJsonderulo                  │ Type: StructuredQuery → Schema + Prompt  │
├─────────────────────────────────────────┴───────────────────────────────────────────┤
│  • Generates JSON schema                                                            │
│  • Creates structured prompt                                                        │
│  • Defines validation rules                                                         │
│  • Provides execution hints                                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  OUTPUT: {                                                                          │
│    structuredPrompt: "Analyze the following...",                                   │
│    schema: { type: "object", properties: {...} },                                  │
│    validationRules: { requiredFields: [...] },                                     │
│    executionHints: { recommendedProvider: "openai", estimatedCost: 0.025 }         │
│  }                                                                                  │
└─────────────────────────────────────────┬───────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  4. PromptOptimizer                     │ Type: Prompt → OptimizedPrompt           │
├─────────────────────────────────────────┴───────────────────────────────────────────┤
│  • Adds few-shot examples                                                          │
│  • Implements reasoning chains                                                      │
│  • Compresses tokens                                                               │
│  • Optimizes for model                                                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  OUTPUT: {                                                                          │
│    prompt: "<<optimized with examples>>",                                          │
│    examples: [{ input: "...", output: {...} }],                                    │
│    tokens: 1250,                                                                   │
│    strategy: "few-shot"                                                            │
│  }                                                                                  │
└─────────────────────────────────────────┬───────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  5. LLMExecutor                         │ Type: OptimizedPrompt → LLMResponse      │
├─────────────────────────────────────────┴───────────────────────────────────────────┤
│  • Selects optimal provider                                                         │
│  • Executes LLM request                                                            │
│  • Handles streaming/batching                                                       │
│  • Manages fallbacks                                                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  OUTPUT: {                                                                          │
│    content: { actionItems: [...], insights: [...] },                               │
│    provider: "openai",                                                             │
│    model: "gpt-4",                                                                 │
│    usage: { totalCost: 0.0234, tokens: 1700 }                                      │
│  }                                                                                  │
└─────────────────────────────────────────┬───────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  6. OutputValidator                     │ Type: LLMResponse → ValidatedOutput      │
├─────────────────────────────────────────┴───────────────────────────────────────────┤
│  • Schema validation                                                                │
│  • Semantic validation                                                              │
│  • Business rule checks                                                             │
│  • Auto-repair attempts                                                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  OUTPUT: {                                                                          │
│    isValid: true,                                                                   │
│    output: { /* cleaned & validated data */ },                                     │
│    repairs: [],                                                                     │
│    confidence: 0.92                                                                │
│  }                                                                                  │
└─────────────────────────────────────────┬───────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  7. FeedbackLoop                        │ Type: Results → FeedbackData             │
├─────────────────────────────────────────┴───────────────────────────────────────────┤
│  • Collects performance metrics                                                     │
│  • Analyzes patterns                                                                │
│  • Generates improvements                                                           │
│  • Updates optimization params                                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  OUTPUT: {                                                                          │
│    quality: 0.88,                                                                   │
│    patterns: ["few-shot improved quality"],                                        │
│    improvements: ["add domain examples"],                                           │
│    recommendations: { ... }                                                         │
│  }                                                                                  │
└─────────────────────────────────────────┬───────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                FINAL OUTPUT: PipelineResult                          │
│  {                                                                                  │
│    output: { actionItems: [...], insights: [...], summary: "..." },                │
│    metadata: { totalTime: 3450ms, totalCost: $0.0234, confidence: 0.92 },          │
│    path: [/* execution trace */]                                                    │
│  }                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Data Transformation Summary

| Stage | Input Type | Output Type | Key Transformations |
|-------|------------|-------------|-------------------|
| 1. IdeaInput | `string` | `EnrichedIdea` | Text → Structured concepts |
| 2. QueryConstructor | `EnrichedIdea` | `StructuredQuery` | Concepts → Query components |
| 3. PipelineJsonderulo | `StructuredQuery` | `Schema + Prompt` | Query → JSON Schema |
| 4. PromptOptimizer | `Prompt` | `OptimizedPrompt` | Basic → Enhanced prompt |
| 5. LLMExecutor | `OptimizedPrompt` | `LLMResponse` | Prompt → AI output |
| 6. OutputValidator | `LLMResponse` | `ValidatedOutput` | Raw → Validated data |
| 7. FeedbackLoop | `Results` | `FeedbackData` | Execution → Insights |

## Orchestrator Control Flow

```
PipelineOrchestrator
    │
    ├─→ Manages execution order
    ├─→ Handles errors & retries  
    ├─→ Monitors health status
    ├─→ Collects metrics
    └─→ Emits events to Event Bus
        │
        └─→ Event Bus
            ├─→ Real-time monitoring
            ├─→ Performance tracking
            ├─→ Error aggregation
            └─→ Custom handlers
```

## Key Features

1. **Progressive Enhancement**: Each stage adds value and structure
2. **Type Safety**: Full TypeScript types at every stage
3. **Event Driven**: All components emit events for monitoring
4. **Feedback Loop**: Continuous improvement from execution data
5. **Error Resilience**: Fallbacks and repairs at multiple stages
6. **Cost Optimization**: Provider selection and token management
7. **Parallel Capable**: Batching and streaming support