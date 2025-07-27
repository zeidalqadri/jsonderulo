// Cloudflare Pages Function to handle API routes
// This replaces the Node.js Express server for Cloudflare deployment

// Mock implementations of the core jsonderulo classes for Cloudflare
class MockJsonderulo {
  speak(request, schemaDescription, options = {}) {
    return {
      prompt: `You are a JSON-only response system. Never include explanatory text, markdown formatting, or code blocks. Output only valid JSON.

Task: ${request}

JSON Schema:
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": true
}

Requirements:
1. Your response MUST be valid JSON
2. Your response MUST conform to the provided schema
3. Include all required fields
4. Use only allowed enum values
5. Respect all constraints (min/max, patterns, etc.)

Note: Generate response with creative variation (temperature: ${options.temperature || 0.7})`,
      schema: schemaDescription ? JSON.parse(schemaDescription) : {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: true
      },
      systemPrompt: "You are a JSON-only response system. Never include explanatory text, markdown formatting, or code blocks. Output only valid JSON."
    };
  }
}

class MockSchemaGenerator {
  async generateFromDescription(description) {
    // Simple schema generation based on keywords
    if (description.includes('user') || description.includes('profile')) {
      return {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', pattern: '^[\\w.-]+@[\\w.-]+\\.\\w+$' },
          age: { type: 'number', minimum: 0, maximum: 150 }
        },
        required: ['name', 'email'],
        additionalProperties: false
      };
    }
    
    if (description.includes('sentiment') || description.includes('feedback')) {
      return {
        type: 'object',
        properties: {
          sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          text: { type: 'string' }
        },
        required: ['sentiment'],
        additionalProperties: false
      };
    }
    
    return {
      type: 'object',
      properties: {
        data: { type: 'string' }
      },
      required: [],
      additionalProperties: true
    };
  }
}

class MockJsonValidator {
  async validate(data, schema) {
    return {
      valid: true,
      errors: [],
      repaired: null
    };
  }
}

// Initialize mock components
const jsonderulo = new MockJsonderulo();
const schemaGenerator = new MockSchemaGenerator();
const validator = new MockJsonValidator();

// In-memory storage for demo
const storage = {
  pipelines: [],
  schemas: [],
  executions: []
};

// Sample templates
const templates = [
  {
    id: 'extraction',
    name: 'Data Extraction',
    description: 'Extract structured data from text',
    schema: {
      type: 'object',
      properties: {
        entities: { type: 'array', items: { type: 'string' } },
        relationships: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  {
    id: 'classification',
    name: 'Text Classification',
    description: 'Classify text into categories',
    schema: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        reasoning: { type: 'string' }
      }
    }
  },
  {
    id: 'analysis',
    name: 'Content Analysis',
    description: 'Analyze content for insights',
    schema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        key_points: { type: 'array', items: { type: 'string' } },
        sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] }
      }
    }
  }
];

// Helper function to create JSON response
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// Main API handler
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  try {
    // Route handlers
    if (path === 'health' && request.method === 'GET') {
      return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
    }

    if (path === 'templates' && request.method === 'GET') {
      return jsonResponse(templates);
    }

    if (path === 'pipeline/execute' && request.method === 'POST') {
      const body = await request.json();
      const { idea, template, options = {} } = body;
      
      if (!idea) {
        return jsonResponse({ error: 'Idea is required' }, 400);
      }

      console.log('Executing pipeline for idea:', idea);

      // Use template if provided
      let schema = null;
      if (template) {
        const templateData = templates.find(t => t.id === template);
        if (templateData) {
          schema = templateData.schema;
        }
      }

      // Generate schema if not provided
      if (!schema) {
        console.log('Generating schema for idea...');
        schema = await schemaGenerator.generateFromDescription(idea);
      }

      // Execute with jsonderulo
      const schemaDescription = schema ? JSON.stringify(schema) : idea;
      const result = jsonderulo.speak(idea, schemaDescription, {
        mode: options.mode || 'strict',
        temperature: options.temperature || 0.7
      });

      // Store execution
      const execution = {
        id: Date.now().toString(),
        idea,
        template,
        schema,
        result,
        timestamp: new Date().toISOString(),
        options
      };
      storage.executions.push(execution);

      return jsonResponse({
        success: true,
        execution_id: execution.id,
        schema,
        result: {
          transformed_prompt: result.prompt,
          generated_schema: result.schema,
          system_prompt: result.systemPrompt,
          validation_result: result.validationResult,
          repaired_json: result.repairedJson
        },
        metadata: {
          tokens_used: 0,
          model: 'jsonderulo-core',
          processing_time: Date.now() - parseInt(execution.id)
        }
      });
    }

    if (path === 'schema/generate' && request.method === 'POST') {
      const body = await request.json();
      const { description } = body;
      
      if (!description) {
        return jsonResponse({ error: 'Description is required' }, 400);
      }

      const schema = await schemaGenerator.generateFromDescription(description);
      
      return jsonResponse({
        success: true,
        schema,
        timestamp: new Date().toISOString()
      });
    }

    if (path === 'validate' && request.method === 'POST') {
      const body = await request.json();
      const { data, schema } = body;
      
      if (!data || !schema) {
        return jsonResponse({ error: 'Data and schema are required' }, 400);
      }

      const validation = await validator.validate(data, schema);
      
      return jsonResponse({
        success: true,
        valid: validation.valid,
        errors: validation.errors || [],
        repaired: validation.repaired || null
      });
    }

    if (path === 'executions' && request.method === 'GET') {
      const page = parseInt(url.searchParams.get('page')) || 1;
      const limit = parseInt(url.searchParams.get('limit')) || 10;
      const start = (page - 1) * limit;
      const end = start + limit;
      
      const executions = storage.executions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(start, end);
      
      return jsonResponse({
        executions,
        total: storage.executions.length,
        page,
        limit
      });
    }

    if (path === 'analytics' && request.method === 'GET') {
      const analytics = {
        total_executions: storage.executions.length,
        total_tokens: storage.executions.reduce((sum, exec) => sum + (exec.result?.usage?.total_tokens || 0), 0),
        success_rate: storage.executions.length > 0 ? 
          storage.executions.filter(e => e.result && !e.result.error).length / storage.executions.length : 0,
        avg_processing_time: 1200,
        popular_templates: templates.map(t => ({
          name: t.name,
          usage_count: storage.executions.filter(e => e.template === t.id).length
        }))
      };
      
      return jsonResponse(analytics);
    }

    // 404 for unmatched routes
    return jsonResponse({ error: 'Not found' }, 404);

  } catch (error) {
    console.error('API Error:', error);
    return jsonResponse({ 
      error: 'Internal server error', 
      details: error.message 
    }, 500);
  }
}