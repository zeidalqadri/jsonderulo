# JSON Prompt Engineering Best Practices - Part 2

## Continued: Prompt Engineering Patterns

**Few-Shot Example (continued):**
```
User: Analyze the sentiment of this text: "I love this product!"
Assistant: {"sentiment": "positive", "confidence": 0.95, "key_phrases": ["love", "product"], "summary": "Highly positive product feedback"}

User: Analyze the sentiment of this text: "The service was terrible and slow."
Assistant: {"sentiment": "negative", "confidence": 0.92, "key_phrases": ["terrible", "slow", "service"], "summary": "Negative service experience"}
```

## Common Challenges and Solutions

### 1. Formatting Issues

**Problems:**
- Random spaces, line breaks, inconsistent quoting
- Extraneous conversational text before/after JSON
- Hallucinated fields not in schema
- Invalid escape sequences in strings

**Solutions:**
- Use `additionalProperties: false` in schemas
- Implement robust post-processing
- Set clear boundaries in system prompts
- Use grammar-constrained decoding when available

### 2. Complex Nested Structures

**Challenge:** Deep nesting can confuse models

**Solution:** Hierarchical generation approach:
```python
# Step 1: Generate high-level structure
outline = generate_outline(prompt)

# Step 2: Fill in details for each section
for section in outline['sections']:
    section['content'] = generate_section_content(section['title'])
```

### 3. Dynamic Schema Handling

When schemas need to change at runtime:

```python
def create_dynamic_schema(fields: List[dict]) -> dict:
    """Generate JSON schema dynamically based on field definitions"""
    properties = {}
    required = []
    
    for field in fields:
        properties[field['name']] = {
            'type': field['type'],
            'description': field.get('description', '')
        }
        if field.get('required', False):
            required.append(field['name'])
    
    return {
        'type': 'object',
        'properties': properties,
        'required': required,
        'additionalProperties': False
    }
```

## Advanced Patterns

### 1. Union Types and Polymorphism

```json
{
  "type": "object",
  "properties": {
    "content": {
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "type": {"const": "text"},
            "value": {"type": "string"}
          },
          "required": ["type", "value"]
        },
        {
          "type": "object",
          "properties": {
            "type": {"const": "image"},
            "url": {"type": "string", "format": "uri"},
            "alt": {"type": "string"}
          },
          "required": ["type", "url"]
        },
        {
          "type": "object",
          "properties": {
            "type": {"const": "code"},
            "language": {"type": "string"},
            "code": {"type": "string"}
          },
          "required": ["type", "language", "code"]
        }
      ]
    }
  }
}
```

### 2. Recursive Schemas

For tree-like structures:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "definitions": {
    "node": {
      "type": "object",
      "properties": {
        "id": {"type": "string"},
        "name": {"type": "string"},
        "children": {
          "type": "array",
          "items": {"$ref": "#/definitions/node"}
        }
      },
      "required": ["id", "name"]
    }
  },
  "type": "object",
  "properties": {
    "root": {"$ref": "#/definitions/node"}
  },
  "required": ["root"]
}
```

### 3. Validation with Business Logic

```python
from pydantic import BaseModel, validator
from datetime import datetime

class Event(BaseModel):
    name: str
    start_date: datetime
    end_date: datetime
    attendees: List[str]
    
    @validator('end_date')
    def end_after_start(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v
    
    @validator('attendees')
    def minimum_attendees(cls, v):
        if len(v) < 1:
            raise ValueError('At least one attendee required')
        return v
```

## Performance Optimization

### 1. Schema Complexity Guidelines

- **Maximum nesting depth**: 5 levels (OpenAI limit)
- **Maximum properties**: 100 per object
- **Array size limits**: Consider pagination for large arrays
- **String length constraints**: Set reasonable maxLength values

### 2. Streaming Considerations

For streaming responses with structured output:

```python
def stream_json_lines(messages):
    """Generate JSON Lines format for streaming"""
    for chunk in llm.stream(messages):
        if chunk.choices[0].delta.content:
            try:
                # Parse each line as separate JSON
                data = json.loads(chunk.choices[0].delta.content)
                yield json.dumps(data) + '\n'
            except json.JSONDecodeError:
                continue
```

### 3. Caching Strategies

```python
from functools import lru_cache
import hashlib

@lru_cache(maxsize=1000)
def get_cached_schema(schema_hash: str) -> dict:
    """Cache compiled schemas for performance"""
    return load_and_compile_schema(schema_hash)

def generate_with_schema(prompt: str, schema: dict) -> dict:
    schema_hash = hashlib.md5(
        json.dumps(schema, sort_keys=True).encode()
    ).hexdigest()
    compiled_schema = get_cached_schema(schema_hash)
    return llm.generate(prompt, schema=compiled_schema)
```

## Testing and Validation

### 1. Schema Test Suite

```python
import pytest
from jsonschema import validate, ValidationError

class TestSchemaValidation:
    def test_valid_response(self):
        response = {
            "sentiment": "positive",
            "confidence": 0.85,
            "categories": ["technology", "business"]
        }
        validate(response, schema)
        
    def test_invalid_enum(self):
        response = {
            "sentiment": "very_positive",  # Invalid enum
            "confidence": 0.85,
            "categories": []
        }
        with pytest.raises(ValidationError):
            validate(response, schema)
```

### 2. LLM Output Testing

```python
def test_llm_consistency(prompt: str, runs: int = 10) -> dict:
    """Test LLM output consistency across multiple runs"""
    results = []
    errors = []
    
    for i in range(runs):
        try:
            output = generate_structured_output(prompt)
            validate(output, schema)
            results.append(output)
        except (ValidationError, json.JSONDecodeError) as e:
            errors.append(str(e))
    
    return {
        "success_rate": len(results) / runs,
        "unique_outputs": len(set(json.dumps(r, sort_keys=True) for r in results)),
        "common_errors": Counter(errors).most_common(3)
    }
```

## Library Recommendations

### Python Ecosystem

1. **Instructor** - Best for OpenAI integration with Pydantic
2. **Outlines** - Grammar-constrained generation
3. **Guidance** - Microsoft's constrained generation library
4. **LangChain** - Comprehensive framework with schema support
5. **json_repair** - Post-processing for fixing common JSON errors

### JavaScript/TypeScript

1. **Zod** - Runtime type validation
2. **TypeChat** - Microsoft's TypeScript-based approach
3. **LangChain.js** - JavaScript port with structured output support
4. **Ajv** - Fast JSON Schema validator

## Future Trends (2025 and Beyond)

### 1. Native Schema Support
- More models will support constrained decoding at inference time
- Standardization of schema formats across providers
- Improved performance with hardware acceleration

### 2. Semantic Validation
- Moving beyond syntactic validation to semantic correctness
- AI-powered schema generation from natural language
- Context-aware validation rules

### 3. Multi-Modal Schemas
- Schemas that can handle text, images, and other modalities
- Unified validation frameworks for complex AI outputs

## Conclusion

JSON prompt engineering has matured significantly in 2024-2025, with reliable methods now available for generating structured outputs from LLMs. Key success factors include:

1. **Use appropriate tools**: Leverage libraries like Instructor or Pydantic for robust validation
2. **Design clear schemas**: Keep schemas as simple as possible while meeting requirements
3. **Handle errors gracefully**: Implement retry logic and fallback strategies
4. **Test thoroughly**: Validate outputs across different prompts and edge cases
5. **Stay updated**: The landscape is evolving rapidly with new capabilities

By following these best practices and patterns, developers can build reliable AI applications that consistently produce well-structured, validated JSON outputs suitable for production use.