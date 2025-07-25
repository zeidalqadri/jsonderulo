# jsonderulo Pipeline Architecture Diagram

## Pipeline Flow with Data Transformations

```mermaid
graph TB
    %% Input Stage
    RawIdea["🔤 Raw Idea<br/>Type: string<br/>Example: 'analyze customer feedback<br/>to identify pain points and<br/>generate action items'"]
    
    %% Stage 1: IdeaInputProcessor
    RawIdea --> IIP[IdeaInputProcessor]
    IIP --> EnrichedIdea["📊 EnrichedIdea<br/>Type: Object<br/>{<br/>  original: string<br/>  normalized: string<br/>  category: 'market-research'<br/>  concepts: ConceptMap<br/>  constraints: string[]<br/>  suggestedOutputType: 'action-items'<br/>  confidence: 0.85<br/>  metadata: {...}<br/>}"]
    
    %% Stage 2: QueryConstructor
    EnrichedIdea --> QC[QueryConstructor]
    QC --> StructuredQuery["🔧 StructuredQuery<br/>Type: Object<br/>{<br/>  primary: 'analyze customer feedback...'<br/>  components: QueryComponent[]<br/>  focus: {<br/>    primaryEntity: 'customer feedback'<br/>    primaryAction: 'analyze'<br/>    targetOutcome: 'actionable insights'<br/>    successCriteria: [...]<br/>  }<br/>  parameters: {...}<br/>  metadata: {...}<br/>}"]
    
    %% Stage 3: PipelineJsonderulo
    StructuredQuery --> PJ[PipelineJsonderulo<br/>Schema Generation]
    PJ --> SchemaOutput["📋 Schema + Prompt<br/>Type: Object<br/>{<br/>  structuredPrompt: string<br/>  schema: JSONSchema<br/>  systemPrompt: string<br/>  validationRules: {...}<br/>  executionHints: {...}<br/>}"]
    
    %% Stage 4: PromptOptimizer
    SchemaOutput --> PO[PromptOptimizer]
    PO --> OptimizedPrompt["⚡ OptimizedPrompt<br/>Type: Object<br/>{<br/>  prompt: string<br/>  examples: Example[]<br/>  reasoning: ReasoningStep[]<br/>  tokens: number<br/>  strategy: 'few-shot'<br/>  compression: {...}<br/>}"]
    
    %% Stage 5: LLMExecutor
    OptimizedPrompt --> LE[LLMExecutor<br/>Provider Selection]
    LE --> LLMResponse["🤖 LLMResponse<br/>Type: Object<br/>{<br/>  content: string/object<br/>  model: 'gpt-4'<br/>  provider: 'openai'<br/>  usage: {<br/>    promptTokens: 1250<br/>    completionTokens: 450<br/>    totalCost: 0.0234<br/>  }<br/>  metadata: {...}<br/>}"]
    
    %% Stage 6: OutputValidator
    LLMResponse --> OV[OutputValidator]
    OV --> ValidatedOutput["✅ ValidatedOutput<br/>Type: Object<br/>{<br/>  isValid: true<br/>  output: {<br/>    actionItems: [...]<br/>    insights: [...]<br/>    metrics: {...}<br/>  }<br/>  repairs: []<br/>  confidence: 0.92<br/>}"]
    
    %% Stage 7: FeedbackLoop
    ValidatedOutput --> FL[FeedbackLoop]
    FL --> FeedbackData["📈 FeedbackData<br/>Type: Object<br/>{<br/>  quality: 0.88<br/>  performance: {...}<br/>  patterns: [...]<br/>  improvements: [...]<br/>  recommendations: {...}<br/>}"]
    
    %% Final Output
    ValidatedOutput --> FinalOutput["🎯 Pipeline Result<br/>Type: Object<br/>{<br/>  output: ValidatedOutput<br/>  metadata: {<br/>    totalTime: 3450ms<br/>    totalCost: 0.0234<br/>    confidence: 0.92<br/>  }<br/>  path: ExecutionPath[]<br/>}"]
    
    %% Feedback connections
    FeedbackData -.->|Optimization Updates| PO
    FeedbackData -.->|Provider Preferences| LE
    FeedbackData -.->|Validation Rules| OV
    
    %% Orchestrator oversight
    Orchestrator[PipelineOrchestrator<br/>Coordinates Flow]
    Orchestrator -.->|Controls| IIP
    Orchestrator -.->|Controls| QC
    Orchestrator -.->|Controls| PJ
    Orchestrator -.->|Controls| PO
    Orchestrator -.->|Controls| LE
    Orchestrator -.->|Controls| OV
    Orchestrator -.->|Controls| FL
    
    %% Event emissions
    IIP ===>|Events| EventBus[Event Bus<br/>Monitoring]
    QC ===>|Events| EventBus
    PJ ===>|Events| EventBus
    PO ===>|Events| EventBus
    LE ===>|Events| EventBus
    OV ===>|Events| EventBus
    FL ===>|Events| EventBus
    
    style RawIdea fill:#e1f5fe
    style EnrichedIdea fill:#c5e1a5
    style StructuredQuery fill:#fff9c4
    style SchemaOutput fill:#ffccbc
    style OptimizedPrompt fill:#d1c4e9
    style LLMResponse fill:#b2dfdb
    style ValidatedOutput fill:#c8e6c9
    style FeedbackData fill:#f8bbd0
    style FinalOutput fill:#81c784
    style EventBus fill:#ffecb3
    style Orchestrator fill:#ce93d8
```

## Data Transformation Details

### 1. Raw Input → EnrichedIdea
**Component**: IdeaInputProcessor
```typescript
// Input
"analyze customer feedback to identify pain points and generate action items"

// Output
{
  original: "analyze customer feedback to identify pain points and generate action items",
  normalized: "analyze customer feedback identify pain points generate action items",
  category: "market-research",
  concepts: {
    entities: [
      { text: "analyze", type: "action", confidence: 0.9 },
      { text: "customer feedback", type: "object", confidence: 0.85 },
      { text: "pain points", type: "metric", confidence: 0.8 },
      { text: "action items", type: "object", confidence: 0.85 }
    ],
    relationships: [
      { from: "analyze", to: "customer feedback", type: "acts-on" },
      { from: "identify", to: "pain points", type: "acts-on" }
    ],
    keywords: ["customer", "feedback", "pain", "points", "action", "items"]
  },
  constraints: ["Must be data-driven", "Requires reliable sources"],
  suggestedOutputType: "action-items",
  confidence: 0.85,
  metadata: {
    wordCount: 12,
    complexity: "moderate",
    language: "en",
    timestamp: "2024-01-25T10:30:00Z"
  }
}
```

### 2. EnrichedIdea → StructuredQuery
**Component**: QueryConstructor
```typescript
// Transforms enriched idea into optimized query structure
{
  primary: "analyze customer feedback to identify pain points and achieve actionable insights",
  components: [
    {
      type: "objective",
      content: "To analyze customer feedback",
      priority: "required",
      rationale: "Primary action identified from idea analysis"
    },
    {
      type: "scope",
      content: "Focusing on: customer feedback, pain points, action items",
      priority: "required"
    },
    {
      type: "constraint",
      content: "Must be data-driven",
      priority: "required"
    },
    {
      type: "output",
      content: "Expected output format: action-items",
      priority: "required"
    }
  ],
  focus: {
    primaryEntity: "customer feedback",
    primaryAction: "analyze",
    targetOutcome: "generate actionable steps for analyzing customer feedback",
    successCriteria: [
      "Identify key pain points",
      "Prioritize by impact",
      "Generate actionable recommendations"
    ]
  },
  parameters: {
    depth: "standard",
    format: "structured",
    tone: "conversational",
    verbosity: "balanced"
  },
  metadata: {
    optimizationScore: 0.78,
    estimatedComplexity: 4.2,
    suggestedTokenBudget: 1500,
    confidenceLevel: 0.85
  }
}
```

### 3. StructuredQuery → Schema + Prompt
**Component**: PipelineJsonderulo
```typescript
// Generates JSON schema and prompt
{
  structuredPrompt: "Analyze the following customer feedback data and generate action items...",
  schema: {
    type: "object",
    properties: {
      actionItems: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            priority: { type: "string", enum: ["high", "medium", "low"] },
            category: { type: "string" },
            estimatedImpact: { type: "string" }
          },
          required: ["title", "description", "priority"]
        }
      },
      insights: {
        type: "array",
        items: {
          type: "object",
          properties: {
            finding: { type: "string" },
            evidence: { type: "array", items: { type: "string" } },
            recommendation: { type: "string" }
          }
        }
      },
      summary: { type: "string" }
    },
    required: ["actionItems", "insights", "summary"]
  },
  systemPrompt: "You are an expert analyst. Generate structured output following the schema.",
  validationRules: {
    requiredFields: ["actionItems", "insights", "summary"],
    minActionItems: 3,
    maxActionItems: 10
  },
  executionHints: {
    recommendedProvider: "openai",
    recommendedModel: "gpt-4",
    estimatedTokens: 1500,
    estimatedCost: 0.025,
    temperature: 0.7
  }
}
```

### 4. Schema + Prompt → OptimizedPrompt
**Component**: PromptOptimizer
```typescript
// Optimizes for specific model/provider
{
  prompt: "<<Optimized prompt with examples and reasoning>>",
  examples: [
    {
      input: "Customer says: 'Login process is confusing'",
      output: {
        actionItems: [{
          title: "Simplify login flow",
          description: "Reduce steps from 5 to 3",
          priority: "high"
        }]
      }
    }
  ],
  reasoning: [
    { step: 1, instruction: "First, categorize feedback by theme" },
    { step: 2, instruction: "Then, identify root causes" },
    { step: 3, instruction: "Finally, generate specific actions" }
  ],
  tokens: 1250,
  strategy: "few-shot",
  compression: {
    original: 1500,
    compressed: 1250,
    ratio: 0.83
  }
}
```

### 5. OptimizedPrompt → LLMResponse
**Component**: LLMExecutor
```typescript
// Executes with selected provider
{
  content: {
    actionItems: [
      {
        title: "Redesign login interface",
        description: "Implement single-page login with clear visual hierarchy",
        priority: "high",
        category: "UX",
        estimatedImpact: "Reduce support tickets by 30%"
      },
      // ... more items
    ],
    insights: [
      {
        finding: "45% of complaints relate to authentication",
        evidence: ["Login timeout issues", "Password reset confusion"],
        recommendation: "Implement SSO and improve password recovery flow"
      }
    ],
    summary: "Analysis reveals authentication as primary pain point..."
  },
  model: "gpt-4",
  provider: "openai",
  usage: {
    promptTokens: 1250,
    completionTokens: 450,
    totalCost: 0.0234
  },
  metadata: {
    latency: 2100,
    streamingEnabled: false,
    temperature: 0.7
  }
}
```

### 6. LLMResponse → ValidatedOutput
**Component**: OutputValidator
```typescript
// Validates and potentially repairs output
{
  isValid: true,
  output: {
    actionItems: [...], // Validated action items
    insights: [...],    // Validated insights
    summary: "..."      // Validated summary
  },
  validationReport: {
    schemaValid: true,
    semanticValid: true,
    businessRulesValid: true,
    warnings: [],
    suggestions: ["Consider adding timeline estimates"]
  },
  repairs: [], // No repairs needed
  confidence: 0.92
}
```

### 7. ValidatedOutput → FeedbackData
**Component**: FeedbackLoop
```typescript
// Collects performance metrics
{
  executionId: "pipeline-123",
  timestamp: "2024-01-25T10:31:45Z",
  quality: 0.88,
  performance: {
    totalTime: 3450,
    validationTime: 120,
    llmTime: 2100
  },
  patterns: [
    {
      type: "success-pattern",
      description: "Few-shot examples improved action item quality",
      frequency: 0.75
    }
  ],
  improvements: [
    {
      component: "PromptOptimizer",
      suggestion: "Add domain-specific examples",
      impact: 0.15
    }
  ],
  recommendations: {
    promptStrategy: "Increase examples for this category",
    providerSelection: "Continue with current provider",
    validationRules: "Add timeline validation"
  }
}
```

## Event Flow

Each component emits events throughout execution:

```typescript
// Example events emitted
{
  type: "processing-started",
  component: "IdeaInputProcessor",
  payload: { ideaLength: 72, timestamp: "..." }
}

{
  type: "schema-generated", 
  component: "PipelineJsonderulo",
  payload: { 
    schemaComplexity: "medium",
    fieldCount: 12,
    schemaSource: "template"
  }
}

{
  type: "validation-completed",
  component: "OutputValidator",
  payload: {
    valid: true,
    repairsNeeded: 0,
    validationTime: 120
  }
}
```

## Key Data Types

### ConceptMap
```typescript
interface ConceptMap {
  entities: Array<{
    text: string;
    type: 'action' | 'object' | 'attribute' | 'metric' | 'constraint';
    confidence: number;
  }>;
  relationships: Array<{
    from: string;
    to: string;
    type: string;
  }>;
  keywords: string[];
}
```

### ExecutionHints
```typescript
interface ExecutionHints {
  recommendedProvider: string;
  recommendedModel: string;
  estimatedTokens: number;
  estimatedCost: number;
  temperature: number;
  fallbackProviders: string[];
  timeout: number;
  retryStrategy: {
    maxRetries: number;
    backoffMs: number;
  };
}
```

### ValidationRules
```typescript
interface ValidationRules {
  requiredFields: string[];
  fieldValidation: Record<string, any>;
  customValidators: Array<{
    name: string;
    validatorId: string;
    parameters?: any;
  }>;
  semanticRules: Array<{
    field: string;
    rule: string;
    severity: 'error' | 'warning';
  }>;
  businessRules: BusinessRule[];
}
```