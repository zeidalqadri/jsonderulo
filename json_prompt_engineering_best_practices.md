# JSON Prompt Engineering Best Practices for LLMs (2024-2025)

## Executive Summary

JSON prompt engineering has evolved significantly in 2024-2025, with major improvements in reliability, schema validation, and structured output generation. This document outlines the current best practices, implementation strategies, and practical patterns for working with JSON outputs from Large Language Models.

## Core Best Practices

### 1. Use JSON Schema for Validation

JSON Schema provides a vocabulary for describing the structure and content of JSON data. It acts as a blueprint, specifying data types, required fields, format constraints, and validation rules.

**Key Benefits:**
- Enforces predictable, machine-readable output structure
- Enables automatic validation of LLM output
- Increases reliability when interacting with external systems
- Prevents downstream errors through data integrity checks

### 2. Clear and Explicit Instructions

**Essential Elements:**
- Explicitly state that you expect output in JSON format
- Clearly describe the intended use of the JSON output
- Provide system prompts that enforce structured responses
- Include schema definitions in the prompt when possible

### 3. Schema-Based Validation Approach

The modern approach follows this pattern:
1. Define a JSON Schema or Pydantic model
2. Instruct the LLM via prompting or function calling to conform to the schema
3. Validate the output against the schema
4. Handle errors and retry if necessary

## Recent Advancements (2024-2025)

### OpenAI Structured Outputs

OpenAI introduced Structured Outputs in August 2024, achieving:
- **100% schema compliance** (up from 35% with prompting alone)
- Support for complex nested structures
- Deterministic constrained decoding
- Available on gpt-4o, gpt-4o-mini, and fine-tuned models

**Key Features:**
- `response_format` parameter with `strict: true`
- Support for Pydantic models in Python
- Automatic validation and type checking

### Anthropic Claude Approach

Claude models excel at JSON output but require:
- Tool calling approach for best results
- Pre-filling assistant responses with JSON structure
- Inline examples of valid output
- ~14-20% of requests may need retry handling

## JSON Schema Patterns

### 1. Basic Structure with Enums

```json
{
  "type": "object",
  "properties": {
    "sentiment": {
      "type": "string",
      "enum": ["positive", "negative", "neutral"]
    },
    "confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "categories": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["business", "technology", "health", "sports", "entertainment"]
      }
    }
  },
  "required": ["sentiment", "confidence", "categories"],
  "additionalProperties": false
}
```

### 2. Nested Objects and Arrays

```json
{
  "type": "object",
  "properties": {
    "document": {
      "type": "object",
      "properties": {
        "title": {"type": "string"},
        "sections": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "heading": {"type": "string"},
              "content": {"type": "string"},
              "subsections": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "title": {"type": "string"},
                    "body": {"type": "string"}
                  },
                  "required": ["title", "body"]
                }
              }
            },
            "required": ["heading", "content"]
          }
        }
      },
      "required": ["title", "sections"]
    }
  },
  "required": ["document"],
  "additionalProperties": false
}
```

### 3. Conditional Validation

```json
{
  "type": "object",
  "properties": {
    "userType": {
      "type": "string",
      "enum": ["guest", "member", "admin"]
    },
    "memberId": {"type": "string"}
  },
  "required": ["userType"],
  "if": {
    "properties": {"userType": {"const": "member"}}
  },
  "then": {
    "required": ["memberId"],
    "properties": {
      "memberId": {
        "type": "string",
        "pattern": "^MEM-[0-9]{6}$"
      }
    }
  }
}
```

## Implementation Strategies

### Python with Pydantic

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum

class SentimentType(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"

class AnalysisResult(BaseModel):
    sentiment: SentimentType
    confidence: float = Field(ge=0, le=1)
    key_phrases: List[str] = Field(max_items=10)
    summary: str = Field(max_length=500)
    
class DocumentAnalysis(BaseModel):
    """Root schema for document analysis"""
    metadata: dict[str, str]
    results: List[AnalysisResult]
    processing_time_ms: int

# Usage with OpenAI
response = client.chat.completions.create(
    model="gpt-4o-2024-08-06",
    messages=[
        {"role": "system", "content": "You are a document analyzer. Always respond with valid JSON."},
        {"role": "user", "content": "Analyze this document: ..."}
    ],
    response_format=DocumentAnalysis
)
```

### TypeScript with Zod

```typescript
import { z } from 'zod';

const SentimentSchema = z.enum(['positive', 'negative', 'neutral']);

const AnalysisResultSchema = z.object({
  sentiment: SentimentSchema,
  confidence: z.number().min(0).max(1),
  keyPhrases: z.array(z.string()).max(10),
  summary: z.string().max(500)
});

const DocumentAnalysisSchema = z.object({
  metadata: z.record(z.string()),
  results: z.array(AnalysisResultSchema),
  processingTimeMs: z.number().int()
});

type DocumentAnalysis = z.infer<typeof DocumentAnalysisSchema>;
```

## Practical Guidelines

### 1. Temperature Control
- Use **temperature=0.3** for structured outputs
- Lower temperatures increase consistency
- Balance creativity vs. reliability based on use case

### 2. Model Selection
- **GPT-4o-mini**: Best cost-efficiency for structured outputs
- **GPT-4o**: Higher complexity and reasoning requirements
- **Claude 3.5 Sonnet**: Excellent for complex schemas with retry handling

### 3. Error Handling

```python
import json
from json_repair import repair_json

def parse_llm_json(response: str) -> dict:
    """Parse and repair JSON from LLM output"""
    try:
        # Try direct parsing first
        return json.loads(response)
    except json.JSONDecodeError:
        # Attempt to repair common issues
        repaired = repair_json(response)
        return json.loads(repaired)
```

### 4. Prompt Engineering Patterns

**System Prompt Template:**
```
You are a JSON-only response assistant. Your outputs must be valid JSON that conforms to the provided schema. 
Do not include any text before or after the JSON object.
Do not include markdown code blocks or formatting.
Respond only with the JSON object.

Schema: {schema_definition}
```

**Few-Shot Example:**
```
User: Analyze the sentiment of this text: "I love this product!"