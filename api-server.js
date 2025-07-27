import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Import jsonderulo components
import { Jsonderulo } from './dist/core/jsonderulo.js';
import { SchemaGenerator } from './dist/core/schemaGenerator.js';
import { JsonValidator } from './dist/core/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 8081;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(join(__dirname, 'dist-ui')));

// Initialize components
const jsonderulo = new Jsonderulo();
const schemaGenerator = new SchemaGenerator();
const validator = new JsonValidator();

// In-memory storage for demo
const storage = {
  pipelines: [],
  schemas: [],
  executions: []
};

// Load sample templates
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

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Templates
app.get('/api/templates', (req, res) => {
  res.json(templates);
});

// Pipeline execution - Core functionality
app.post('/api/pipeline/execute', async (req, res) => {
  try {
    const { idea, template, options = {} } = req.body;
    
    if (!idea) {
      return res.status(400).json({ error: 'Idea is required' });
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

    // Execute with jsonderulo - using the schema as description  
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

    res.json({
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
        tokens_used: 0, // No actual LLM call yet
        model: 'jsonderulo-core',
        processing_time: Date.now() - parseInt(execution.id)
      }
    });

  } catch (error) {
    console.error('Pipeline execution error:', error);
    res.status(500).json({ 
      error: 'Pipeline execution failed', 
      details: error.message 
    });
  }
});

// Schema generation
app.post('/api/schema/generate', async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const schema = await schemaGenerator.generateFromDescription(description);
    
    res.json({
      success: true,
      schema,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Schema generation error:', error);
    res.status(500).json({ 
      error: 'Schema generation failed', 
      details: error.message 
    });
  }
});

// Validation
app.post('/api/validate', async (req, res) => {
  try {
    const { data, schema } = req.body;
    
    if (!data || !schema) {
      return res.status(400).json({ error: 'Data and schema are required' });
    }

    const validation = await validator.validate(data, schema);
    
    res.json({
      success: true,
      valid: validation.valid,
      errors: validation.errors || [],
      repaired: validation.repaired || null
    });

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ 
      error: 'Validation failed', 
      details: error.message 
    });
  }
});

// Pipeline management
app.get('/api/pipelines', (req, res) => {
  res.json(storage.pipelines);
});

app.post('/api/pipelines', (req, res) => {
  const pipeline = {
    id: Date.now().toString(),
    ...req.body,
    created_at: new Date().toISOString()
  };
  storage.pipelines.push(pipeline);
  res.json(pipeline);
});

// Execution history
app.get('/api/executions', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const start = (page - 1) * limit;
  const end = start + limit;
  
  const executions = storage.executions
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(start, end);
  
  res.json({
    executions,
    total: storage.executions.length,
    page,
    limit
  });
});

// Prompt optimization - New simple endpoint
app.post('/api/optimize-prompt', async (req, res) => {
  try {
    const { idea, outputFormat = 'natural' } = req.body;
    
    if (!idea) {
      return res.status(400).json({ error: 'Idea is required' });
    }

    console.log('Optimizing prompt for idea:', idea);

    const startTime = Date.now();

    // Simple categorization
    let category = 'problem-solving';
    let complexity = 'moderate';
    let confidence = 0.85;

    if (idea.includes('data') || idea.includes('analysis')) {
      category = 'data-analysis';
      complexity = 'complex';
    } else if (idea.includes('customer') || idea.includes('user')) {
      category = 'market-research';
      complexity = 'moderate';
    } else if (idea.includes('product') || idea.includes('feature')) {
      category = 'product-development';
      complexity = 'moderate';
    }

    // Generate enhanced prompt based on format
    let enhancedPrompt;
    let suggestions = [];

    if (outputFormat === 'json') {
      enhancedPrompt = `{
  "task": "${idea}",
  "instructions": [
    "Analyze the provided input thoroughly",
    "Extract key insights and patterns",
    "Structure the response in the specified format",
    "Ensure all required fields are included"
  ],
  "output_format": {
    "type": "object",
    "properties": {
      "analysis": {"type": "string", "description": "Main analysis or insights"},
      "key_findings": {"type": "array", "items": {"type": "string"}},
      "confidence_score": {"type": "number", "minimum": 0, "maximum": 1},
      "recommendations": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["analysis", "key_findings", "confidence_score"]
  },
  "constraints": [
    "Be specific and actionable",
    "Include supporting evidence",
    "Maintain objectivity",
    "Focus on practical insights"
  ]
}`;

      suggestions = [
        'Consider adding validation rules for data types',
        'Include enum constraints for categorical data',
        'Add pattern matching for structured text fields',
        'Define minimum/maximum values for numerical outputs'
      ];
    } else {
      enhancedPrompt = `You are an expert analyst tasked with: ${idea}

Please follow these structured guidelines:

**Analysis Framework:**
1. Begin with a comprehensive overview of the subject matter
2. Break down the analysis into key components
3. Identify patterns, trends, and significant findings
4. Provide evidence-based insights

**Output Structure:**
- **Summary**: Concise overview of your findings
- **Key Insights**: 3-5 most important discoveries
- **Supporting Evidence**: Data points or examples that validate your insights
- **Recommendations**: Actionable next steps or suggestions
- **Confidence Assessment**: Your level of certainty in the analysis (0-100%)

**Quality Standards:**
- Be specific and avoid generalities
- Use clear, professional language
- Support claims with reasoning
- Focus on actionable outcomes
- Maintain objectivity throughout

Please ensure your response is comprehensive yet concise, prioritizing clarity and practical value.`;

      suggestions = [
        'Add specific examples or use cases to make the prompt more concrete',
        'Include quality criteria for evaluating the output',
        'Consider adding domain-specific terminology or context',
        'Specify the target audience or intended use of the analysis'
      ];
    }

    const processingTime = Date.now() - startTime;

    const result = {
      original: idea,
      enhanced: enhancedPrompt,
      metadata: {
        category,
        complexity,
        tokens_used: Math.floor(enhancedPrompt.length / 4), // Rough token estimation
        processing_time: processingTime,
        confidence
      },
      suggestions
    };

    res.json(result);

  } catch (error) {
    console.error('Prompt optimization error:', error);
    res.status(500).json({ 
      error: 'Prompt optimization failed', 
      details: error.message 
    });
  }
});

// Analytics
app.get('/api/analytics', (req, res) => {
  const analytics = {
    total_executions: storage.executions.length,
    total_tokens: storage.executions.reduce((sum, exec) => sum + (exec.result?.usage?.total_tokens || 0), 0),
    success_rate: storage.executions.length > 0 ? 
      storage.executions.filter(e => e.result && !e.result.error).length / storage.executions.length : 0,
    avg_processing_time: 1200, // Mock data
    popular_templates: templates.map(t => ({
      name: t.name,
      usage_count: storage.executions.filter(e => e.template === t.id).length
    }))
  };
  
  res.json(analytics);
});

// Serve UI for all other routes
// app.get('*', (req, res) => {
//   res.sendFile(join(__dirname, 'dist-ui', 'index.html'));
// });

// Error handling
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({ 
    error: 'Internal server error', 
    details: error.message 
  });
});

app.listen(port, () => {
  console.log(`🎵 Jsonderulo API server running on http://localhost:${port}`);
  console.log(`🎯 Core endpoints ready:`);
  console.log(`   POST /api/pipeline/execute - Execute idea → JSON transformation`);
  console.log(`   GET  /api/templates - Get available templates`);
  console.log(`   POST /api/schema/generate - Generate schema from description`);
  console.log(`   POST /api/validate - Validate JSON against schema`);
});