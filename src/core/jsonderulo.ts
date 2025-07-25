import { SchemaGenerator, GeneratedSchema } from './schemaGenerator.js';
import { PromptEngine, PromptOptions, PromptMode } from './promptEngine.js';
import { JsonValidator, ValidationResult } from './validator.js';

export interface JsonDeruloOptions {
  mode?: PromptMode;
  temperature?: number;
  includeExamples?: boolean;
  autoRepair?: boolean;
  maxRetries?: number;
}

export interface JsonDeruloResult {
  prompt: string;
  schema: GeneratedSchema | any;
  systemPrompt?: string;
  validationResult?: ValidationResult;
  repairedJson?: string;
}

export class Jsonderulo {
  private schemaGenerator: SchemaGenerator;
  private promptEngine: PromptEngine;
  private validator: JsonValidator;

  constructor() {
    this.schemaGenerator = new SchemaGenerator();
    this.promptEngine = new PromptEngine();
    this.validator = new JsonValidator();
  }

  /**
   * Transform a natural language request into a JSON-structured prompt
   */
  speak(
    request: string,
    schemaDescription?: string,
    options: JsonDeruloOptions = {}
  ): JsonDeruloResult {
    // Generate schema from description or infer from request
    const schema = schemaDescription
      ? this.schemaGenerator.generateFromDescription(schemaDescription)
      : this.inferSchemaFromRequest(request);

    // Transform the prompt
    const promptOptions: PromptOptions = {
      mode: options.mode || 'strict',
      temperature: options.temperature,
      includeExamples: options.includeExamples,
      errorRecovery: options.maxRetries !== undefined && options.maxRetries > 0,
    };

    const transformedPrompt = this.promptEngine.transformPrompt(request, schema, promptOptions);

    return {
      prompt: transformedPrompt,
      schema,
      systemPrompt: this.getSystemPrompt(promptOptions.mode),
    };
  }

  /**
   * Apply a predefined template to create a JSON-structured prompt
   */
  useTemplate(
    templateName: string,
    variables: Record<string, string>,
    options?: JsonDeruloOptions
  ): JsonDeruloResult {
    const promptOptions = options
      ? {
          mode: options.mode || 'strict',
          temperature: options.temperature,
          includeExamples: options.includeExamples,
        }
      : undefined;

    const prompt = this.promptEngine.applyTemplate(templateName, variables, promptOptions);

    // Extract schema from variables if provided
    const schema = variables.schema ? JSON.parse(variables.schema) : {};

    return {
      prompt,
      schema,
      systemPrompt: promptOptions ? this.getSystemPrompt(promptOptions.mode) : undefined,
    };
  }

  /**
   * Validate JSON response against schema
   */
  validate(response: any, schema: GeneratedSchema | any): ValidationResult {
    return this.validator.validate(response, schema);
  }

  /**
   * Attempt to repair invalid JSON
   */
  repair(invalidJson: string): string | null {
    return this.validator.repairJson(invalidJson);
  }

  /**
   * Generate a recovery prompt for failed validation
   */
  generateRecoveryPrompt(
    originalPrompt: string,
    invalidResponse: string,
    validationResult: ValidationResult,
    schema: any
  ): string {
    return this.validator.generateRecoveryPrompt(
      originalPrompt,
      invalidResponse,
      validationResult,
      schema
    );
  }

  /**
   * Complete workflow: transform, validate, and optionally repair
   */
  async process(
    request: string,
    llmFunction: (prompt: string) => Promise<string>,
    options: JsonDeruloOptions = {}
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    attempts?: number;
  }> {
    const maxRetries = options.maxRetries || 1;
    let attempts = 0;

    // Generate initial prompt
    const { prompt, schema } = this.speak(request, undefined, options);

    while (attempts < maxRetries) {
      attempts++;

      try {
        // Get LLM response
        const response = await llmFunction(prompt);

        // Try to repair if enabled
        let jsonResponse = response;
        if (options.autoRepair) {
          const repaired = this.repair(response);
          if (repaired) {
            jsonResponse = repaired;
          }
        }

        // Validate response
        const validationResult = this.validate(jsonResponse, schema);

        if (validationResult.valid) {
          const data = typeof jsonResponse === 'string' ? JSON.parse(jsonResponse) : jsonResponse;
          return {
            success: true,
            data,
            attempts,
          };
        }

        // If validation failed and we have retries left
        if (attempts < maxRetries) {
          const recoveryPrompt = this.generateRecoveryPrompt(
            request,
            response,
            validationResult,
            schema
          );

          const recoveryResponse = await llmFunction(recoveryPrompt);
          const recoveryValidation = this.validate(recoveryResponse, schema);

          if (recoveryValidation.valid) {
            return {
              success: true,
              data: JSON.parse(recoveryResponse),
              attempts: attempts + 1,
            };
          }
        }
      } catch (error) {
        if (attempts >= maxRetries) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            attempts,
          };
        }
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
      attempts,
    };
  }

  private inferSchemaFromRequest(request: string): GeneratedSchema {
    // Use the schema generator to infer from the request itself
    return this.schemaGenerator.generateFromDescription(request);
  }

  private getSystemPrompt(mode: PromptMode): string {
    const prompts = {
      strict:
        'You are a JSON-only response system. Never include explanatory text, markdown formatting, or code blocks. Output only valid JSON.',
      explanatory:
        'You are a JSON generator that includes explanation fields. For every decision or classification, include an "explanation" or "reasoning" field to aid debugging and transparency.',
      streaming:
        'You are a streaming JSON generator. Output JSON in a streaming-friendly format, either as JSON Lines or as a single valid JSON object that can be parsed incrementally.',
      validated:
        'You are a schema-validated JSON generator. Always validate your output against the provided schema before responding. If validation would fail, fix the issues before returning.',
    };
    return prompts[mode];
  }

  /**
   * Get available template names
   */
  getAvailableTemplates(): string[] {
    return ['basic_json', 'extraction', 'classification', 'analysis'];
  }

  /**
   * Export current configuration
   */
  exportConfig(): {
    templates: string[];
    modes: PromptMode[];
    version: string;
  } {
    return {
      templates: this.getAvailableTemplates(),
      modes: ['strict', 'explanatory', 'streaming', 'validated'],
      version: '1.0.0',
    };
  }
}
