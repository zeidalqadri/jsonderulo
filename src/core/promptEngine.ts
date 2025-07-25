import { GeneratedSchema } from './schemaGenerator.js';

export type PromptMode = 'strict' | 'explanatory' | 'streaming' | 'validated';

export interface PromptTemplate {
  name: string;
  template: string;
  variables: string[];
  useCase: string;
}

export interface PromptOptions {
  mode: PromptMode;
  temperature?: number;
  includeExamples?: boolean;
  errorRecovery?: boolean;
}

export class PromptEngine {
  private templates: Map<string, PromptTemplate> = new Map();
  private systemPrompts: Map<PromptMode, string> = new Map();

  constructor() {
    this.initializeTemplates();
    this.initializeSystemPrompts();
  }

  private initializeTemplates(): void {
    const templates: PromptTemplate[] = [
      {
        name: 'basic_json',
        template: `You are a JSON-only response assistant. Your outputs must be valid JSON that conforms to the provided schema. Do not include any text before or after the JSON object. Do not include markdown code blocks or formatting. Respond only with the JSON object.

Schema: {schema}

Request: {request}`,
        variables: ['schema', 'request'],
        useCase: 'General purpose JSON generation',
      },
      {
        name: 'extraction',
        template: `Extract the requested information from the following text and return it as a JSON object matching this schema:

{schema}

Text to analyze:
{text}

Remember:
- Extract only information present in the text
- Use null for missing values
- Ensure all enum values match exactly
- Return only the JSON object`,
        variables: ['schema', 'text'],
        useCase: 'Extracting structured data from unstructured text',
      },
      {
        name: 'classification',
        template: `Classify the following input according to the schema. {examples}

Now classify this:
{input}

Return your response as a JSON object matching this schema:
{schema}`,
        variables: ['examples', 'input', 'schema'],
        useCase: 'Classification tasks',
      },
      {
        name: 'analysis',
        template: `Analyze the following content and generate a structured report:

Content:
{content}

Generate a JSON analysis report following this schema:
{schema}

Focus on:
{focus_areas}`,
        variables: ['content', 'schema', 'focus_areas'],
        useCase: 'Structured analysis tasks',
      },
    ];

    templates.forEach(template => {
      this.templates.set(template.name, template);
    });
  }

  private initializeSystemPrompts(): void {
    this.systemPrompts.set(
      'strict',
      'You are a JSON-only response system. Never include explanatory text, markdown formatting, or code blocks. Output only valid JSON.'
    );

    this.systemPrompts.set(
      'explanatory',
      'You are a JSON generator that includes explanation fields. For every decision or classification, include an "explanation" or "reasoning" field to aid debugging and transparency.'
    );

    this.systemPrompts.set(
      'streaming',
      'You are a streaming JSON generator. Output JSON in a streaming-friendly format, either as JSON Lines or as a single valid JSON object that can be parsed incrementally.'
    );

    this.systemPrompts.set(
      'validated',
      'You are a schema-validated JSON generator. Always validate your output against the provided schema before responding. If validation would fail, fix the issues before returning.'
    );
  }

  transformPrompt(
    userPrompt: string,
    schema: GeneratedSchema | string,
    options: PromptOptions = { mode: 'strict' }
  ): string {
    const schemaString = typeof schema === 'string' ? schema : JSON.stringify(schema, null, 2);
    const systemPrompt = this.systemPrompts.get(options.mode) || this.systemPrompts.get('strict')!;

    const enhancedPrompt = this.buildEnhancedPrompt(userPrompt, schemaString, options);

    return `${systemPrompt}

${enhancedPrompt}`;
  }

  private buildEnhancedPrompt(userPrompt: string, schema: string, options: PromptOptions): string {
    let prompt = `Task: ${userPrompt}

JSON Schema:
${schema}

Requirements:
1. Your response MUST be valid JSON
2. Your response MUST conform to the provided schema
3. Include all required fields
4. Use only allowed enum values
5. Respect all constraints (min/max, patterns, etc.)`;

    if (options.includeExamples) {
      prompt += `

Example of valid response structure:
${this.generateExampleFromSchema(schema)}`;
    }

    if (options.errorRecovery) {
      prompt += `

If you encounter any issues:
1. First, ensure your JSON is syntactically valid
2. Check that all required fields are present
3. Verify enum values match exactly
4. Ensure numeric values are within specified ranges`;
    }

    if (options.temperature !== undefined) {
      prompt += `

Note: Generate response with ${options.temperature < 0.5 ? 'high precision' : 'creative variation'} (temperature: ${options.temperature})`;
    }

    return prompt;
  }

  generateExampleFromSchema(schemaString: string): string {
    try {
      const schema = JSON.parse(schemaString);
      return JSON.stringify(this.generateExampleObject(schema), null, 2);
    } catch {
      return '{}';
    }
  }

  private generateExampleObject(schema: any): any {
    if (schema.type === 'object' && schema.properties) {
      const example: any = {};

      Object.entries(schema.properties).forEach(([key, propSchema]: [string, any]) => {
        example[key] = this.generateExampleValue(propSchema);
      });

      return example;
    }

    return this.generateExampleValue(schema);
  }

  private generateExampleValue(schema: any): any {
    switch (schema.type) {
      case 'string':
        if (schema.enum) return schema.enum[0];
        if (schema.format === 'email') return 'example@email.com';
        if (schema.format === 'date-time') return '2024-01-01T00:00:00Z';
        return 'example string';

      case 'number':
      case 'integer':
        if (schema.minimum !== undefined) return schema.minimum;
        if (schema.maximum !== undefined) return schema.maximum;
        return 0;

      case 'boolean':
        return true;

      case 'array':
        if (schema.items) {
          return [this.generateExampleValue(schema.items)];
        }
        return [];

      case 'object':
        return this.generateExampleObject(schema);

      default:
        return null;
    }
  }

  getTemplate(name: string): PromptTemplate | undefined {
    return this.templates.get(name);
  }

  applyTemplate(
    templateName: string,
    variables: Record<string, string>,
    options?: PromptOptions
  ): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    let prompt = template.template;

    template.variables.forEach(variable => {
      const value = variables[variable];
      if (value === undefined) {
        throw new Error(`Missing required variable '${variable}' for template '${templateName}'`);
      }
      prompt = prompt.replace(new RegExp(`{${variable}}`, 'g'), value);
    });

    if (options) {
      const systemPrompt = this.systemPrompts.get(options.mode) || '';
      return `${systemPrompt}

${prompt}`;
    }

    return prompt;
  }
}
