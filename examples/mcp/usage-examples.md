# Jsonderulo MCP Usage Examples

Once jsonderulo is configured in Claude Desktop, you can use it through Claude's interface. Here are some examples:

## 1. Generate JSON Schema from Natural Language

**You:** "Use jsonderulo to generate a schema for a user profile with name, email, age (optional, 18-99), and subscription type (free, pro, enterprise)"

**Claude will use:** `jsonderulo_generate_schema` tool

**Expected Output:**
```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "email": {
      "type": "string",
      "pattern": "^[\\w.-]+@[\\w.-]+\\.\\w+$"
    },
    "age": {
      "type": "number",
      "minimum": 18,
      "maximum": 99
    },
    "subscriptionType": {
      "type": "string",
      "enum": ["free", "pro", "enterprise"]
    }
  },
  "required": ["name", "email", "subscriptionType"],
  "additionalProperties": false
}
```

## 2. Transform a Prompt for JSON Output

**You:** "Use jsonderulo to create a prompt for sentiment analysis with confidence scores"

**Claude will use:** `jsonderulo_speak` tool with mode "explanatory"

**Expected Output:**
```json
{
  "prompt": "You are a JSON generator that includes explanation fields...",
  "schema": {
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
      "explanation": {
        "type": "string"
      }
    },
    "required": ["sentiment", "confidence"],
    "additionalProperties": false
  }
}
```

## 3. Validate JSON Against Schema

**You:** "Use jsonderulo to validate this JSON: {'name': 'John', 'age': '25'} against a schema requiring name as string and age as number"

**Claude will use:** `jsonderulo_validate` tool

**Expected Output:**
```json
{
  "valid": false,
  "errors": [
    {
      "path": "/age",
      "message": "must be number",
      "keyword": "type"
    }
  ],
  "suggestions": [
    "Change /age from string to number"
  ]
}
```

## 4. Repair Invalid JSON

**You:** "Use jsonderulo to fix this JSON: {name: 'Jane', tags: ['expert', 'verified'],}"

**Claude will use:** `jsonderulo_repair` tool

**Expected Output:**
```json
{"name": "Jane", "tags": ["expert", "verified"]}
```

## 5. Use Templates

**You:** "Use jsonderulo's extraction template to extract entities from 'Tim Cook announced at Apple headquarters in Cupertino'"

**Claude will use:** `jsonderulo_use_template` tool

**Expected Output:**
```json
{
  "prompt": "Extract the requested information from the following text...",
  "schema": {
    "type": "object",
    "properties": {
      "persons": { "type": "array", "items": { "type": "string" } },
      "organizations": { "type": "array", "items": { "type": "string" } },
      "locations": { "type": "array", "items": { "type": "string" } }
    }
  }
}
```

## 6. Access Resources

**You:** "Show me the JSON prompt engineering best practices from jsonderulo"

**Claude will use:** Read resource `docs://best_practices`

**You:** "Get the classification template from jsonderulo"

**Claude will use:** Read resource `template://classification`

## Tips for Using Jsonderulo with Claude

1. **Be specific** about what you want jsonderulo to do
2. **Mention the tool name** explicitly for clarity
3. **Provide examples** when asking for schema generation
4. **Use appropriate modes**:
   - `strict` for JSON-only responses
   - `explanatory` when you need reasoning fields
   - `validated` for extra validation focus
5. **Combine tools** - generate schema, then create prompts, then validate responses