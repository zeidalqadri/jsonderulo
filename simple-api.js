import http from 'http';
import url from 'url';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import jsonderulo components
import { Jsonderulo } from './dist/core/jsonderulo.js';
import { SchemaGenerator } from './dist/core/schemaGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize components
const jsonderulo = new Jsonderulo();
const schemaGenerator = new SchemaGenerator();

// In-memory storage for demo
const storage = {
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

function sendJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function sendFile(res, filePath, contentType) {
  try {
    const content = readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);
  } catch (error) {
    res.writeHead(404);
    res.end('File not found');
  }
}

async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  console.log(`${method} ${path}`);

  try {
    // API Routes
    if (path === '/api/health') {
      sendJSON(res, { status: 'ok', timestamp: new Date().toISOString() });
    }
    else if (path === '/api/templates') {
      sendJSON(res, templates);
    }
    else if (path === '/api/pipeline/execute' && method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { idea, template, options = {} } = JSON.parse(body);
          
          if (!idea) {
            sendJSON(res, { error: 'Idea is required' }, 400);
            return;
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
            schema = schemaGenerator.generateFromDescription(idea);
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

          sendJSON(res, {
            success: true,
            execution_id: execution.id,
            schema,
            result: {
              transformed_prompt: result.prompt,
              instructions: result.instructions,
              output_format: result.outputFormat,
              validation_rules: result.validationRules
            },
            metadata: {
              tokens_used: 0, // No actual LLM call
              model: 'jsonderulo-core',
              processing_time: Date.now() - parseInt(execution.id)
            }
          });

        } catch (error) {
          console.error('Pipeline execution error:', error);
          sendJSON(res, { 
            error: 'Pipeline execution failed', 
            details: error.message 
          }, 500);
        }
      });
    }
    else if (path === '/api/executions') {
      const page = parseInt(parsedUrl.query.page) || 1;
      const limit = parseInt(parsedUrl.query.limit) || 10;
      const start = (page - 1) * limit;
      const end = start + limit;
      
      const executions = storage.executions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(start, end);
      
      sendJSON(res, {
        executions,
        total: storage.executions.length,
        page,
        limit
      });
    }
    else if (path === '/api/analytics') {
      const analytics = {
        total_executions: storage.executions.length,
        total_tokens: 0,
        success_rate: 1.0,
        avg_processing_time: 1200,
        popular_templates: templates.map(t => ({
          name: t.name,
          usage_count: storage.executions.filter(e => e.template === t.id).length
        }))
      };
      
      sendJSON(res, analytics);
    }
    // Serve static files
    else if (path.startsWith('/assets/')) {
      const filePath = join(__dirname, 'dist-ui', path);
      const ext = path.split('.').pop();
      const contentTypes = {
        'js': 'text/javascript',
        'css': 'text/css',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'svg': 'image/svg+xml'
      };
      sendFile(res, filePath, contentTypes[ext] || 'text/plain');
    }
    // Serve UI
    else {
      const filePath = join(__dirname, 'dist-ui', 'index.html');
      sendFile(res, filePath, 'text/html');
    }

  } catch (error) {
    console.error('Request handling error:', error);
    sendJSON(res, { 
      error: 'Internal server error', 
      details: error.message 
    }, 500);
  }
}

const server = http.createServer(handleRequest);
const port = 8080;

server.listen(port, () => {
  console.log(`🎵 Jsonderulo Simple API server running on http://localhost:${port}`);
  console.log(`🎯 Core endpoints ready:`);
  console.log(`   POST /api/pipeline/execute - Execute idea → JSON transformation`);
  console.log(`   GET  /api/templates - Get available templates`);
  console.log(`   GET  /api/health - Health check`);
});