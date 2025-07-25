#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Jsonderulo } from '../core/jsonderulo.js';
import { SchemaGenerator } from '../core/schemaGenerator.js';
import { JsonValidator } from '../core/validator.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize jsonderulo instance
const jsonderulo = new Jsonderulo();
const schemaGenerator = new SchemaGenerator();
const validator = new JsonValidator();

// Create MCP server
const server = new Server(
  {
    name: 'jsonderulo-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'jsonderulo_speak',
        description:
          'Transform a natural language request into a JSON-structured prompt with schema',
        inputSchema: {
          type: 'object',
          properties: {
            request: {
              type: 'string',
              description: 'The prompt/request to transform',
            },
            schemaDescription: {
              type: 'string',
              description: 'Natural language description of the desired schema (optional)',
            },
            mode: {
              type: 'string',
              enum: ['strict', 'explanatory', 'streaming', 'validated'],
              description: 'Output mode (default: strict)',
            },
            includeExamples: {
              type: 'boolean',
              description: 'Include examples in the prompt',
            },
          },
          required: ['request'],
        },
      },
      {
        name: 'jsonderulo_generate_schema',
        description: 'Generate a JSON schema from a natural language description',
        inputSchema: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Natural language description of the schema',
            },
          },
          required: ['description'],
        },
      },
      {
        name: 'jsonderulo_validate',
        description: 'Validate JSON data against a schema',
        inputSchema: {
          type: 'object',
          properties: {
            data: {
              type: ['object', 'string'],
              description: 'JSON data to validate (object or string)',
            },
            schema: {
              type: 'object',
              description: 'JSON schema to validate against',
            },
          },
          required: ['data', 'schema'],
        },
      },
      {
        name: 'jsonderulo_repair',
        description: 'Attempt to repair invalid JSON syntax',
        inputSchema: {
          type: 'object',
          properties: {
            invalidJson: {
              type: 'string',
              description: 'Invalid JSON string to repair',
            },
          },
          required: ['invalidJson'],
        },
      },
      {
        name: 'jsonderulo_use_template',
        description: 'Apply a predefined prompt template',
        inputSchema: {
          type: 'object',
          properties: {
            templateName: {
              type: 'string',
              enum: ['basic_json', 'extraction', 'classification', 'analysis'],
              description: 'Name of the template to use',
            },
            variables: {
              type: 'object',
              description: 'Variables to fill in the template',
              additionalProperties: { type: 'string' },
            },
          },
          required: ['templateName', 'variables'],
        },
      },
      {
        name: 'jsonderulo_get_templates',
        description: 'Get list of available templates',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async request => {
  try {
    const { name, arguments: args } = request.params;

    if (!args) {
      throw new McpError(ErrorCode.InvalidRequest, 'No arguments provided');
    }

    switch (name) {
      case 'jsonderulo_speak': {
        const result = jsonderulo.speak(
          args.request as string,
          args.schemaDescription as string | undefined,
          {
            mode: args.mode as any,
            includeExamples: args.includeExamples as boolean,
          }
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'jsonderulo_generate_schema': {
        const schema = schemaGenerator.generateFromDescription(args.description as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(schema, null, 2),
            },
          ],
        };
      }

      case 'jsonderulo_validate': {
        const validationResult = validator.validate(args.data, args.schema);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(validationResult, null, 2),
            },
          ],
        };
      }

      case 'jsonderulo_repair': {
        const repaired = validator.repairJson(args.invalidJson as string);
        return {
          content: [
            {
              type: 'text',
              text: repaired || 'Unable to repair JSON',
            },
          ],
        };
      }

      case 'jsonderulo_use_template': {
        const result = jsonderulo.useTemplate(
          args.templateName as string,
          args.variables as Record<string, string>
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'jsonderulo_get_templates': {
        const templates = jsonderulo.getAvailableTemplates();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ templates }, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

// Define available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'template://basic_json',
        name: 'Basic JSON Template',
        description: 'Template for basic JSON generation',
        mimeType: 'application/json',
      },
      {
        uri: 'template://extraction',
        name: 'Extraction Template',
        description: 'Template for extracting structured data from text',
        mimeType: 'application/json',
      },
      {
        uri: 'template://classification',
        name: 'Classification Template',
        description: 'Template for classification tasks',
        mimeType: 'application/json',
      },
      {
        uri: 'template://analysis',
        name: 'Analysis Template',
        description: 'Template for analysis tasks',
        mimeType: 'application/json',
      },
      {
        uri: 'examples://schemas',
        name: 'Schema Examples',
        description: 'Example JSON schemas for various use cases',
        mimeType: 'application/json',
      },
      {
        uri: 'docs://best_practices',
        name: 'JSON Prompt Engineering Best Practices',
        description: 'Best practices for JSON prompt engineering with LLMs',
        mimeType: 'text/markdown',
      },
    ],
  };
});

// Handle resource reading
server.setRequestHandler(ReadResourceRequestSchema, async request => {
  const { uri } = request.params;

  try {
    if (uri.startsWith('template://')) {
      const templateName = uri.replace('template://', '');
      const templatesPath = path.join(__dirname, '../../prompt_templates.json');
      const templatesContent = await fs.readFile(templatesPath, 'utf-8');
      const templates = JSON.parse(templatesContent);

      const template = templates.prompt_templates[templateName];
      if (!template) {
        throw new McpError(ErrorCode.InvalidRequest, `Template not found: ${templateName}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(template, null, 2),
          },
        ],
      };
    } else if (uri === 'examples://schemas') {
      const schemasPath = path.join(__dirname, '../../json_schema_examples.json');
      const schemasContent = await fs.readFile(schemasPath, 'utf-8');

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: schemasContent,
          },
        ],
      };
    } else if (uri === 'docs://best_practices') {
      const docsPath = path.join(__dirname, '../../json_prompt_engineering_best_practices.md');
      const docsContent = await fs.readFile(docsPath, 'utf-8');

      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: docsContent,
          },
        ],
      };
    } else {
      throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
    }
  } catch (error) {
    if (error instanceof McpError) throw error;
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to read resource: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Jsonderulo MCP server started');
}

main().catch(error => {
  console.error('Server error:', error);
  process.exit(1);
});
